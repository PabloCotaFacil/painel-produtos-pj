import { prisma } from './prisma';

// Cache em memória ultrarrápido no servidor para eliminar latência de banco nas páginas e buscas.
// É invalidado instantaneamente sempre que o Admin cria, edita ou exclui qualquer material, reel ou banner.

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const globalCache = globalThis as unknown as {
  __painelCache?: Record<string, CacheEntry<any>>;
  __schemaVerified?: boolean;
};

if (!globalCache.__painelCache) {
  globalCache.__painelCache = {};
}

export function getCached<T>(key: string, ttlMs = 60000): T | null {
  const store = globalCache.__painelCache;
  if (!store) return null;
  const entry = store[key];
  if (!entry) return null;
  if (Date.now() - entry.timestamp > ttlMs) {
    delete store[key];
    return null;
  }
  return entry.data as T;
}

export function setCached<T>(key: string, data: T): void {
  if (!globalCache.__painelCache) {
    globalCache.__painelCache = {};
  }
  globalCache.__painelCache[key] = {
    data,
    timestamp: Date.now(),
  };
}

export function invalidateCache(prefix?: string): void {
  const store = globalCache.__painelCache;
  if (!store) return;
  if (!prefix) {
    globalCache.__painelCache = {};
    return;
  }
  for (const key of Object.keys(store)) {
    if (key.startsWith(prefix)) {
      delete store[key];
    }
  }
}

export function isSchemaVerified(): boolean {
  return Boolean(globalCache.__schemaVerified);
}

export function markSchemaVerified(): void {
  globalCache.__schemaVerified = true;
}

const REMOVED_CATEGORY_SLUGS = ['credito-pj', 'credito-agro'];

/**
 * Busca otimizada de artigos para listagens e busca inteligente:
 * Exclui o campo pesado `fileUrl` (que pode conter PDFs em Base64 de vários MBs)
 * e mantém em cache em memória para resposta instantânea (< 2ms).
 */
export async function getFastArticlesList() {
  const cached = getCached<any[]>('articles:fast-list', 60000);
  if (cached) return cached;

  const articles = await prisma.article.findMany({
    where: {
      category: {
        slug: {
          notIn: REMOVED_CATEGORY_SLUGS,
        },
      },
    },
    select: {
      id: true,
      title: true,
      summary: true,
      content: true,
      videoUrl: true,
      videoType: true,
      categoryId: true,
      updatedAt: true,
      createdAt: true,
      category: {
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          icon: true,
        },
      },
      attachments: {
        select: {
          id: true,
          name: true,
          fileType: true,
        },
      },
    },
    orderBy: { updatedAt: 'desc' },
  });

  setCached('articles:fast-list', articles);
  return articles;
}

/**
 * Busca otimizada do Banner da Home com cache em memória.
 */
export async function getFastHeroBanner() {
  const cached = getCached<any>('banner:default', 60000);
  if (cached) return cached;

  let heroBanner = await prisma.heroBanner.findUnique({
    where: { id: 'default-hero' },
  });

  if (!heroBanner) {
    heroBanner = {
      id: 'default-hero',
      badgeText: 'Regras & Manuais 2025/2026',
      title: 'Como podemos te ajudar?',
      subtitle:
        'Consulte esteiras operacionais, regras de crédito imobiliário, downloads de PDFs e treinamentos atualizados.',
      primaryButtonText: 'Ver Regras & Manuais',
      primaryButtonUrl: '/categorias/treinamentos',
      secondaryButtonText: null,
      secondaryButtonUrl: null,
      mediaType: 'cards',
      videoUrl: null,
      videoTitle: null,
      cardsJson: '[]',
      updatedAt: new Date(),
    };
  }

  setCached('banner:default', heroBanner);
  return heroBanner;
}
