import ArticleCard from '@/components/ArticleCard';
import TrainingVideoCard from '@/components/TrainingVideoCard';
import TreinamentosReelsFeed, { type ReelFeedItem } from '@/components/TreinamentosReelsFeed';
import { prisma } from '@/lib/prisma';
import { getOrSeedCategories } from '@/lib/categories';
import { getFastArticlesList, invalidateCache } from '@/lib/cache';
import { getActiveShortReels } from '@/lib/reels';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  FolderOpen,
  Layers,
  Video,
  MonitorPlay,
  Sparkles,
  FileText,
} from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const REMOVED_CATEGORY_SLUGS: string[] = [];

let isVideoTypeMigrated = false;

async function ensureVideoTypeMigration() {
  if (isVideoTypeMigrated) return;
  try {
    await (prisma as any).$executeRawUnsafe(`
      ALTER TABLE "Article" ADD COLUMN IF NOT EXISTS "videoType" TEXT DEFAULT 'training';
    `);
  } catch (_) {}

  try {
    await (prisma as any).$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "SystemConfig" (
        "key" TEXT PRIMARY KEY,
        "value" TEXT NOT NULL
      );
    `);

    const configKey = 'migrated_16_9_videos_v2';
    const existingFlag = await prisma.systemConfig.findUnique({
      where: { key: configKey },
    });

    if (!existingFlag) {
      await (prisma as any).$executeRawUnsafe(`
        UPDATE "Article"
        SET "videoType" = 'training'
        WHERE "videoUrl" IS NOT NULL
          AND "videoUrl" NOT ILIKE '%/shorts/%';
      `);

      await prisma.systemConfig.upsert({
        where: { key: configKey },
        update: { value: 'true' },
        create: { key: configKey, value: 'true' },
      });

      invalidateCache('articles');
    }

    isVideoTypeMigrated = true;
  } catch (err) {
    try {
      await (prisma as any).$executeRawUnsafe(`
        UPDATE "Article"
        SET "videoType" = 'training'
        WHERE "videoUrl" IS NOT NULL
          AND "videoUrl" NOT ILIKE '%/shorts/%'
          AND ("videoType" IS NULL OR "videoType" = '');
      `);
    } catch (_) {}
    console.warn('Aviso ao verificar migração de videoType:', err);
  }
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams?: { subcat?: string };
}) {
  await ensureVideoTypeMigration();

  const isTreinamentos = params.slug === 'treinamentos';
  const [categories, allArticles, shortReels] = await Promise.all([
    getOrSeedCategories(),
    getFastArticlesList(),
    isTreinamentos ? getActiveShortReels() : Promise.resolve([]),
  ]);

  // Tratamento para "TODAS AS CATEGORIAS" (slug === 'all')
  if (params.slug === 'all') {
    return (
      <div className="space-y-6">
        <div>
          <Link
            href="/"
            className="inline-flex items-center space-x-2 text-xs font-black text-blue-700 dark:text-blue-400 bg-white dark:bg-slate-900 hover:bg-blue-50 dark:hover:bg-slate-800 px-4 py-2.5 rounded-xl border border-blue-200 dark:border-slate-800 shadow-sm transition group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>← Voltar para a Página Inicial</span>
          </Link>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 card-shadow transition-colors">
          <div className="flex items-center space-x-3 text-blue-700 dark:text-blue-400 font-extrabold text-xs uppercase tracking-wider mb-2">
            <Layers className="w-4 h-4 text-cyan-500" />
            <span>Biblioteca Completa</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white">
            Todas as Categorias & Produtos PJ
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-2">
            Visão geral de todos os produtos PJ, manuais operacionais, esteiras bancárias e treinamentos.
          </p>
        </div>

        <section className="space-y-4">
          <div className="border-b border-slate-200 dark:border-slate-800 pb-2">
            <h2 className="text-lg font-black text-slate-900 dark:text-white">
              Todos os Materiais Publicados ({allArticles.length})
            </h2>
          </div>

          {allArticles.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 text-center border border-slate-200 dark:border-slate-800">
              <p className="text-slate-500 dark:text-slate-400 text-sm font-semibold">
                Nenhum material cadastrado ainda.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {allArticles.map((art) => (
                <ArticleCard key={art.id} article={art} />
              ))}
            </div>
          )}
        </section>
      </div>
    );
  }

  const foundCategory = categories.find((c: any) => c.slug === params.slug);
  if (!foundCategory) {
    notFound();
  }

  const isArticleReel = (art: any): boolean => {
    if (!art.videoUrl) return false;
    if (art.videoType === 'training') return false;
    if (art.videoType === 'reel') return true;
    return art.videoUrl.includes('/shorts/');
  };

  // Se for a aba de Treinamentos global:
  // Permite filtrar por subcategoria (produto específico ou todos)
  const selectedSubcatSlug = searchParams?.subcat || 'all';

  // Se estiver em Treinamentos, pega vídeos de TODAS as categorias ou da categoria selecionada
  const sourceArticles = isTreinamentos
    ? selectedSubcatSlug === 'all'
      ? allArticles
      : allArticles.filter((a: any) => a.category?.slug === selectedSubcatSlug)
    : allArticles.filter((a: any) => a.category?.slug === params.slug);

  const category = {
    ...foundCategory,
    articles: sourceArticles,
  };

  // Coleta vídeos 9:16 (Reels)
  const articleReels: ReelFeedItem[] = sourceArticles
    .filter((art) => isArticleReel(art))
    .map((art) => ({
      id: art.id,
      title: art.title,
      description: art.summary,
      videoUrl: art.videoUrl!,
      categoryTag: art.category?.name || 'Dica Rápida',
      order: 0,
      isActive: true,
      isArticle: true,
    }));

  // Treinamentos 16:9
  const training16x9Articles = sourceArticles.filter(
    (art) => Boolean(art.videoUrl) && !isArticleReel(art)
  );

  const trainingVideoUrls = new Set(
    training16x9Articles.map((a) => a.videoUrl?.trim()).filter(Boolean)
  );

  const reels: ReelFeedItem[] = (
    isTreinamentos ? [...shortReels, ...articleReels] : articleReels
  )
    .filter((r) => !trainingVideoUrls.has(r.videoUrl?.trim()))
    .filter(
      (item, index, self) =>
        index === self.findIndex((t) => t.videoUrl.trim() === item.videoUrl.trim())
    );

  // Materiais em texto/PDF (sem vídeo)
  const manualArticles = sourceArticles.filter((art) => !art.videoUrl);

  // Lista de outras categorias para as pílulas de filtro dentro de Treinamentos
  const otherCategories = categories.filter((c: any) => c.slug !== 'treinamentos');

  return (
    <div className="space-y-8">
      {/* Botão de Retornar para a Página Inicial */}
      <div>
        <Link
          href="/"
          className="inline-flex items-center space-x-2 text-xs font-black text-blue-700 dark:text-blue-400 bg-white dark:bg-slate-900 hover:bg-blue-50 dark:hover:bg-slate-800 px-4 py-2.5 rounded-xl border border-blue-200 dark:border-slate-800 shadow-sm transition group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>← Voltar para a Página Inicial</span>
        </Link>
      </div>

      {/* Category Header */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 card-shadow transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5 text-blue-700 dark:text-blue-400 font-extrabold text-xs uppercase tracking-wider mb-2">
            {isTreinamentos ? (
              <Video className="w-4 h-4 text-rose-500" />
            ) : (
              <FolderOpen className="w-4 h-4 text-cyan-500" />
            )}
            <span>{isTreinamentos ? 'Central de Capacitação CotaFácil PJ' : 'Produto / Categoria PJ'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            {category.name}
          </h1>
          {category.description && (
            <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm mt-1.5 max-w-2xl">
              {category.description}
            </p>
          )}
        </div>

        {/* Resumo rápido de conteúdos */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {training16x9Articles.length > 0 && (
            <a
              href="#catalog-videoaulas"
              className="inline-flex items-center space-x-2 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/50 px-3.5 py-2 rounded-2xl text-xs font-extrabold transition"
            >
              <MonitorPlay className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              <span>{training16x9Articles.length} Videoaula(s) 16:9</span>
            </a>
          )}

          {reels.length > 0 && (
            <div className="inline-flex items-center space-x-2 bg-cyan-50 dark:bg-cyan-950/60 text-cyan-800 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-900/50 px-3.5 py-2 rounded-2xl text-xs font-extrabold">
              <Sparkles className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              <span>{reels.length} Pílula(s) 9:16</span>
            </div>
          )}
        </div>
      </div>

      {/* Se estiver na aba Treinamentos: Filtro por Categoria / Produto PJ */}
      {isTreinamentos && otherCategories.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center gap-2">
          <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider mr-2">
            Filtrar Treinamentos por Produto:
          </span>

          <Link
            href="/categorias/treinamentos"
            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition ${
              selectedSubcatSlug === 'all'
                ? 'bg-blue-700 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            Todos os Produtos
          </Link>

          {otherCategories.map((c: any) => (
            <Link
              key={c.id}
              href={`/categorias/treinamentos?subcat=${c.slug}`}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition ${
                selectedSubcatSlug === c.slug
                  ? 'bg-blue-700 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              {c.name}
            </Link>
          ))}
        </div>
      )}

      {/* SEÇÃO 1 (TOPO): REELS NO CANTO ESQUERDO + PAINEL À DIREITA */}
      {reels.length > 0 && (
        <section className="space-y-3">
          <TreinamentosReelsFeed
            reels={reels}
            catalogSectionId="catalog-videoaulas"
            trainingsCount={training16x9Articles.length}
            latestTrainingTitle={training16x9Articles[0]?.title || null}
            latestTrainingId={training16x9Articles[0]?.id || null}
          />
        </section>
      )}

      {/* SEÇÃO 2: TREINAMENTOS COMPLETOS (16:9) DA CATEGORIA */}
      {training16x9Articles.length > 0 && (
        <section
          id="catalog-videoaulas"
          className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 card-shadow space-y-6 scroll-mt-24 transition-colors"
        >
          <div className="border-b border-slate-100 dark:border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start space-x-3.5">
              <div className="w-11 h-11 rounded-2xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-md">
                <MonitorPlay className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                    {isTreinamentos
                      ? 'Treinamentos Completos (16:9)'
                      : `Videoaulas & Treinamentos de ${category.name}`}
                  </h2>
                  <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                    Formato Horizontal 16:9
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Assista às aulas completas diretamente no reprodutor abaixo ou abra a aula para consultar regras e baixar PDFs.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {training16x9Articles.map((art) => (
              <TrainingVideoCard key={art.id} article={art} />
            ))}
          </div>
        </section>
      )}

      {/* SEÇÃO 3: MANUAIS, APOSTILAS E REGRAS DA CATEGORIA */}
      <section className="space-y-4">
        <div className="border-b border-slate-200 dark:border-slate-800 pb-3 flex items-center space-x-2.5">
          <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
              {isTreinamentos
                ? `Apostilas, Manuais & Roteiros de Treinamento (${manualArticles.length})`
                : `Manuais & Materiais de Apoio — ${category.name} (${manualArticles.length})`}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Documentos oficiais, esteiras operacionais e materiais de leitura complementares.
            </p>
          </div>
        </div>

        {manualArticles.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-10 text-center border border-slate-200 dark:border-slate-800">
            <p className="text-slate-500 dark:text-slate-400 text-sm font-semibold">
              {training16x9Articles.length > 0 || reels.length > 0
                ? 'Todos os materiais cadastrados para esta categoria estão disponíveis em formato de vídeo acima.'
                : 'Nenhum material cadastrado nesta categoria ainda.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {manualArticles.map((art) => (
              <ArticleCard key={art.id} article={art} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
