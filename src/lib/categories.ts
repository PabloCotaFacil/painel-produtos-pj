import { prisma } from './prisma';
import { getCached, setCached, isSchemaVerified, markSchemaVerified } from './cache';

export interface DefaultCategoryDef {
  name: string;
  slug: string;
  description: string;
  icon: string;
}

export const DEFAULT_CATEGORIES: DefaultCategoryDef[] = [
  {
    name: 'Produtos PJ',
    slug: 'produtos-pj',
    description: 'Capital de Giro, Antecipação de Recebíveis, Financiamento PJ e Linhas Bancárias.',
    icon: 'briefcase',
  },
  {
    name: 'Treinamentos e Videoaulas',
    slug: 'treinamentos',
    description: 'Vídeos de treinamento, videoaulas, tutoriais e esteiras operacionais PJ.',
    icon: 'video',
  },
];

const REMOVED_CATEGORY_SLUGS: string[] = [];
const CATEGORIES_CACHE_KEY = 'categories:list';

/**
 * Garante que o banco de dados tenha as categorias básicas e a coluna videoType.
 * Usa cache em memória (5 minutos) e executa DDL apenas 1 vez por instância.
 */
export async function getOrSeedCategories() {
  const cached = getCached<any[]>(CATEGORIES_CACHE_KEY, 300000);
  if (cached && cached.length > 0) {
    return cached;
  }

  try {
    if (!isSchemaVerified()) {
      markSchemaVerified();
      try {
        await (prisma as any).$executeRawUnsafe(`
          ALTER TABLE "Article" ADD COLUMN IF NOT EXISTS "videoType" TEXT DEFAULT 'training';
        `);
      } catch (_) {}
    }

    let categories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
    });

    if (categories.length === 0) {
      for (const cat of DEFAULT_CATEGORIES) {
        await prisma.category.upsert({
          where: { slug: cat.slug },
          update: { name: cat.name, description: cat.description, icon: cat.icon },
          create: cat,
        });
      }

      categories = await prisma.category.findMany({
        orderBy: { name: 'asc' },
      });
    }

    setCached(CATEGORIES_CACHE_KEY, categories);
    return categories;
  } catch (error) {
    console.error('Erro ao buscar/garantir categorias:', error);
    return DEFAULT_CATEGORIES.map((c, i) => ({
      id: `default-${i + 1}`,
      name: c.name,
      slug: c.slug,
      description: c.description,
      icon: c.icon,
    }));
  }
}
