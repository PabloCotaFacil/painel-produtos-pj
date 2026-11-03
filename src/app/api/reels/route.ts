import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { checkIsAdmin } from '@/lib/auth';
import { getAllShortReels } from '@/lib/reels';
import { invalidateCache } from '@/lib/cache';

export async function GET() {
  try {
    const reels = await getAllShortReels();
    return NextResponse.json(reels);
  } catch (error) {
    console.error('Erro ao listar reels:', error);
    return NextResponse.json({ error: 'Erro ao buscar reels' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const isAdmin = await checkIsAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { title, description, videoUrl, categoryTag, order, isActive } = body;

    if (!title || !videoUrl) {
      return NextResponse.json(
        { error: 'Título e Link do Vídeo (YouTube Shorts ou URL) são obrigatórios' },
        { status: 400 }
      );
    }

    const newReel = await (prisma as any).shortReel.create({
      data: {
        title: title.trim(),
        description: description ? description.trim() : null,
        videoUrl: videoUrl.trim(),
        categoryTag: categoryTag ? categoryTag.trim() : 'Dica Rápida',
        order: typeof order === 'number' ? order : 0,
        isActive: isActive !== undefined ? !!isActive : true,
      },
    });

    invalidateCache();
    revalidatePath('/categorias/treinamentos');
    return NextResponse.json(newReel);
  } catch (error) {
    console.error('Erro ao criar reel:', error);
    return NextResponse.json({ error: 'Erro ao salvar reel' }, { status: 500 });
  }
}
