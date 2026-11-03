import { prisma } from './prisma';
import { getCached, setCached } from './cache';

export interface ShortReelItem {
  id: string;
  title: string;
  description?: string | null;
  videoUrl: string;
  categoryTag?: string | null;
  order: number;
  isActive: boolean;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export const DEFAULT_SHORT_REELS: ShortReelItem[] = [];

let isTableVerified = false;

async function ensureShortReelTable() {
  if (isTableVerified) return;
  isTableVerified = true;
  try {
    await (prisma as any).$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "ShortReel" (
        "id" TEXT PRIMARY KEY,
        "title" TEXT NOT NULL,
        "description" TEXT,
        "videoUrl" TEXT NOT NULL,
        "categoryTag" TEXT DEFAULT 'Treinamento Rápido',
        "order" INTEGER NOT NULL DEFAULT 0,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
  } catch (err) {
    console.warn('Verificação de tabela ShortReel:', err);
  }
}

export async function getActiveShortReels(): Promise<ShortReelItem[]> {
  const cached = getCached<ShortReelItem[]>('reels:active', 60000);
  if (cached) return cached;

  try {
    await ensureShortReelTable();

    const reels = await (prisma as any).shortReel.findMany({
      where: { isActive: true },
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
    });

    const result = Array.isArray(reels) ? reels : [];
    setCached('reels:active', result);
    return result;
  } catch (error) {
    console.error('Erro ao buscar reels no banco:', error);
    return [];
  }
}

export async function getAllShortReels(): Promise<ShortReelItem[]> {
  try {
    await ensureShortReelTable();

    const reels = await (prisma as any).shortReel.findMany({
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
    });

    if (reels && Array.isArray(reels)) {
      return reels;
    }

    return [];
  } catch (error) {
    console.error('Erro ao buscar todos os reels:', error);
    return [];
  }
}
