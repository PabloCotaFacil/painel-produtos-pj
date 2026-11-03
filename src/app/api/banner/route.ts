import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { checkIsAdmin } from '@/lib/auth';
import { invalidateCache } from '@/lib/cache';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const defaultCards = JSON.stringify([
  {
    id: '1',
    title: 'Crédito Imobiliário',
    subtitle: 'LTV, esteiras Caixa, Itaú, BB e Santander',
    url: '/categorias/imobiliario',
    icon: 'home',
    color: 'blue',
  },
]);

export async function GET() {
  try {
    let banner = await prisma.heroBanner.findUnique({
      where: { id: 'default-hero' },
    });

    if (!banner) {
      banner = await prisma.heroBanner.create({
        data: {
          id: 'default-hero',
          badgeText: 'Regras & Manuais 2025/2026',
          title: 'Como podemos te ajudar?',
          subtitle:
            'Consulte manuais operacionais de bancos, downloads de PDFs com checklist de esteira e regras operacionais atualizadas.',
          primaryButtonText: 'Ver Regras & Manuais',
          primaryButtonUrl: '/categorias/treinamentos',
          secondaryButtonText: '',
          secondaryButtonUrl: '',
          mediaType: 'cards',
          videoUrl: '',
          videoTitle: '',
          cardsJson: defaultCards,
        },
      });
    }

    if (!banner.cardsJson || banner.cardsJson === '[]') {
      banner = {
        ...banner,
        cardsJson: defaultCards,
      };
    }

    return NextResponse.json(banner);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar banner' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const isAdmin = await checkIsAdmin();
  if (!isAdmin) {
    return NextResponse.json(
      { error: 'Sessão expirada ou não autorizada. Faça login novamente no painel.' },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const {
      badgeText = '',
      title = '',
      subtitle = '',
      primaryButtonText = '',
      primaryButtonUrl = '',
      secondaryButtonText = '',
      secondaryButtonUrl = '',
      mediaType = 'cards',
      videoUrl = '',
      videoTitle = '',
      cardsJson,
    } = body;

    let formattedCardsJson = defaultCards;
    if (typeof cardsJson === 'string' && cardsJson.trim().length > 0) {
      formattedCardsJson = cardsJson;
    } else if (Array.isArray(cardsJson)) {
      formattedCardsJson = JSON.stringify(cardsJson);
    }

    const safeData = {
      badgeText: String(badgeText ?? 'Regras & Manuais 2025/2026'),
      title: String(title ?? 'Como podemos te ajudar?'),
      subtitle: String(subtitle ?? ''),
      primaryButtonText: String(primaryButtonText ?? 'Ver Regras & Manuais'),
      primaryButtonUrl: String(primaryButtonUrl ?? '/categorias/treinamentos'),
      secondaryButtonText: String(secondaryButtonText ?? ''),
      secondaryButtonUrl: String(secondaryButtonUrl ?? ''),
      mediaType: mediaType === 'video' ? 'video' : 'cards',
      videoUrl: String(videoUrl ?? '').trim(),
      videoTitle: String(videoTitle ?? '').trim(),
      cardsJson: formattedCardsJson,
    };

    const banner = await prisma.heroBanner.upsert({
      where: { id: 'default-hero' },
      update: safeData,
      create: {
        id: 'default-hero',
        ...safeData,
      },
    });

    invalidateCache();
    revalidatePath('/');

    return NextResponse.json(banner);
  } catch (error: any) {
    console.error('Erro ao atualizar banner:', error);
    return NextResponse.json(
      { error: error?.message || 'Erro ao atualizar banner no banco de dados' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  return PUT(request);
}
