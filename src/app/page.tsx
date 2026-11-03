import CategoryCards from '@/components/CategoryCards';
import ArticleCard from '@/components/ArticleCard';
import HeroMedia from '@/components/HeroMedia';
import SearchResultsAnchor from '@/components/SearchResultsAnchor';
import { getOrSeedCategories } from '@/lib/categories';
import { getFastArticlesList, getFastHeroBanner } from '@/lib/cache';
import { smartSearchArticles } from '@/lib/search';
import Link from 'next/link';
import {
  Sparkles,
  Search,
  Info,
  ChevronRight,
  Layers,
} from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function HomePage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const query = searchParams.q || '';

  // Executa todas as leituras em paralelo usando cache em memória (resposta em < 2ms)
  const [, heroBanner, allArticles] = await Promise.all([
    getOrSeedCategories(),
    getFastHeroBanner(),
    getFastArticlesList(),
  ]);

  const articles = query.trim()
    ? smartSearchArticles(allArticles, query)
    : allArticles.slice(0, 16);

  return (
    <div className="space-y-8">
      {/* ============================================================ */}
      {/* BEVI-AJUDA STYLE HERO BANNER COMPACTO EM ALTURA & PANORÂMICO */}
      {/* ============================================================ */}
      <div className="gradient-hero rounded-3xl px-5 sm:px-8 py-6 sm:py-7 text-white shadow-xl relative overflow-hidden">
        {/* GRAFISMOS VETORIAIS EXCLUSIVOS NO FUNDO (ONDAS E CÍRCULOS) */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
          {/* Ondas orgânicas fluidas */}
          <svg
            className="absolute -right-20 -top-24 w-[550px] h-[550px] opacity-15 text-white"
            viewBox="0 0 500 500"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="250" cy="250" r="220" stroke="currentColor" strokeWidth="2.5" strokeDasharray="6 6" />
            <circle cx="250" cy="250" r="170" stroke="currentColor" strokeWidth="4" />
            <circle cx="250" cy="250" r="110" stroke="currentColor" strokeWidth="2" />
            <path
              d="M 50,250 C 120,120 380,380 450,250"
              stroke="currentColor"
              strokeWidth="3"
            />
          </svg>

          {/* Grafismo circular e arcos translúcidos à esquerda */}
          <svg
            className="absolute -left-32 -bottom-32 w-[420px] h-[420px] opacity-10 text-cyan-200"
            viewBox="0 0 400 400"
            fill="none"
          >
            <circle cx="200" cy="200" r="190" stroke="currentColor" strokeWidth="2" />
            <circle cx="200" cy="200" r="130" stroke="currentColor" strokeWidth="3" strokeDasharray="8 8" />
            <circle cx="200" cy="200" r="80" stroke="currentColor" strokeWidth="2" />
          </svg>

          {/* Gradiente de iluminação suave */}
          <div className="absolute top-0 right-1/4 w-80 h-80 bg-cyan-400/20 rounded-full blur-3xl" />
        </div>

        {/* HERO CONTENT */}
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Coluna Esquerda: Textos de Boas-Vindas & Chamada */}
          <div className="lg:col-span-7 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-cyan-200 text-xs sm:text-sm font-bold tracking-wide">
                Olá! Bem-vindo ao Hub de Apoio CotaFácil.
              </span>
              {heroBanner.badgeText && (
                <div className="inline-flex items-center space-x-1.5 bg-white/15 backdrop-blur-md px-2.5 py-1 rounded-full text-[11px] text-cyan-200 font-bold border border-white/20">
                  <Sparkles className="w-3 h-3 shrink-0 text-cyan-300" />
                  <span>{heroBanner.badgeText}</span>
                </div>
              )}
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black leading-tight tracking-tight text-white">
                {heroBanner.title || 'Como podemos te ajudar?'}
              </h1>
              {heroBanner.subtitle && (
                <p className="text-blue-100 text-xs sm:text-sm mt-1.5 max-w-xl leading-relaxed">
                  {heroBanner.subtitle}
                </p>
              )}
            </div>
          </div>

          {/* Coluna Direita: Cards Clicáveis Moldáveis ou Player de Vídeo */}
          <div className="lg:col-span-5 flex flex-col justify-center">
            <HeroMedia
              mediaType={heroBanner.mediaType}
              videoUrl={heroBanner.videoUrl}
              videoTitle={heroBanner.videoTitle}
              cardsJson={heroBanner.cardsJson}
            />
          </div>
        </div>
      </div>

      {/* ROLAGEM AUTOMÁTICA VISUAL PARA A BUSCA */}
      <SearchResultsAnchor query={query} />

      {/* ============================================================ */}
      {/* CARDS DE CATEGORIAS FLUTUANTES (IDÊNTICO AO BEVI AJUDA)        */}
      {/* ============================================================ */}
      <CategoryCards floating={true} />

      {/* ============================================================ */}
      {/* SEÇÃO "ÚLTIMAS ATUALIZAÇÕES" / RESULTADOS DA PESQUISA         */}
      {/* ============================================================ */}
      <section id="materiais-section" className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/90 dark:border-slate-800 card-shadow space-y-6 scroll-mt-28 transition-colors">
        {/* BANNER VISUAL DE FEEDBACK DA BUSCA */}
        {query && (
          <div className="bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm animate-in fade-in duration-300">
            <div className="flex items-center space-x-3.5">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow">
                <Search className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white">
                  Pesquisa inteligente por: <span className="text-blue-600 dark:text-blue-400 font-black">"{query}"</span>
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                  {articles.length === 0
                    ? 'Nenhum material correspondente encontrado.'
                    : articles.length === 1
                    ? '1 material encontrado por relevância de termos:'
                    : `${articles.length} materiais encontrados e ordenados por relevância:`}
                </p>
              </div>
            </div>
            <Link
              href="/"
              className="text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-slate-900 bg-white dark:bg-slate-800 hover:bg-slate-100 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition whitespace-nowrap self-start sm:self-auto"
            >
              ✕ Limpar busca
            </Link>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-2xl font-black text-blue-900 dark:text-white flex items-center gap-2 tracking-tight">
              <span className="w-2.5 h-6 bg-cyan-500 rounded-full inline-block"></span>
              {query ? `Materiais encontrados para "${query}"` : 'Últimas atualizações'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {query
                ? `Encontrados ${articles.length} materiais correspondentes (busca por termos únicos ou combinados)`
                : 'Consulte os comunicados, regras de esteiras e manuais atualizados recentemente'}
            </p>
          </div>

          <Link
            href="/categorias/all"
            className="text-xs font-extrabold text-blue-600 dark:text-blue-400 hover:text-blue-800 flex items-center gap-1 transition shrink-0"
          >
            <span>Ver biblioteca completa</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* LISTA RÁPIDA EM 2 COLUNAS ESTILO BEVI AJUDA */}
        {articles.length > 0 && !query && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 pb-6 border-b border-slate-100 dark:border-slate-800">
            {articles.slice(0, 8).map((art) => (
              <Link
                key={art.id}
                href={`/artigos/${art.id}`}
                className="group flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/70 transition border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
              >
                <div className="flex items-center space-x-2.5 min-w-0 pr-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 group-hover:scale-125 transition shrink-0"></span>
                  <span className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition truncate">
                    {art.title}
                  </span>
                </div>
                <div className="text-cyan-600 dark:text-cyan-400 group-hover:text-blue-600 shrink-0">
                  <Info className="w-4 h-4" />
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* GALERIA COMPLETA DE CARDS COM RESUMOS E DOWNLOADS */}
        <div>
          <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            <span>Materiais em Destaque</span>
          </h3>

          {articles.length === 0 ? (
            <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-12 text-center border border-dashed border-slate-200 dark:border-slate-700">
              <p className="text-slate-500 dark:text-slate-400 text-sm font-semibold">
                Nenhum material encontrado com o termo pesquisado.
              </p>
              <Link href="/" className="text-xs font-bold text-blue-700 dark:text-blue-400 hover:underline mt-2 inline-block">
                Limpar busca
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {articles.map((art) => (
                <ArticleCard key={art.id} article={art} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
