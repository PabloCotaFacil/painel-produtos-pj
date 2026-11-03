import { NextResponse } from 'next/server';
import { getFastArticlesList } from '@/lib/cache';
import { getActiveShortReels } from '@/lib/reels';
import { smartSearchArticles, smartSearchReels } from '@/lib/search';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get('q') || '').trim();

    if (!q) {
      return NextResponse.json({ articles: [], reels: [] });
    }

    const [allArticles, activeReels] = await Promise.all([
      getFastArticlesList(),
      getActiveShortReels(),
    ]);

    const matchedArticles = smartSearchArticles(allArticles, q).slice(0, 8).map((art: any) => ({
      id: art.id,
      title: art.title,
      summary: art.summary,
      videoUrl: art.videoUrl,
      videoType: art.videoType || 'training',
      categoryName: art.category?.name || 'Geral',
      categorySlug: art.category?.slug || 'all',
      attachmentsCount: art.attachments?.length || 0,
      firstAttachmentName: art.attachments?.[0]?.name || null,
    }));

    const matchedReels = smartSearchReels(activeReels, q).slice(0, 4).map((r) => ({
      id: r.id,
      title: r.title,
      description: r.description,
      categoryTag: r.categoryTag,
      videoUrl: r.videoUrl,
    }));

    return NextResponse.json({
      articles: matchedArticles,
      reels: matchedReels,
    });
  } catch (error) {
    console.error('Erro na API de busca inteligente:', error);
    return NextResponse.json({ articles: [], reels: [] }, { status: 500 });
  }
}
