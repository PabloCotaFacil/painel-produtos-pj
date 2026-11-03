import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { checkIsAdmin } from '@/lib/auth';
import { getOrSeedCategories } from '@/lib/categories';
import { invalidateCache } from '@/lib/cache';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const isAdmin = await checkIsAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { title, description, videoUrl, categoryTag, order, isActive } = body;

    const updated = await (prisma as any).shortReel.update({
      where: { id: params.id },
      data: {
        ...(title && { title: title.trim() }),
        ...(description !== undefined && { description: description ? description.trim() : null }),
        ...(videoUrl && { videoUrl: videoUrl.trim() }),
        ...(categoryTag !== undefined && { categoryTag: categoryTag ? categoryTag.trim() : null }),
        ...(order !== undefined && { order: Number(order) }),
        ...(isActive !== undefined && { isActive: !!isActive }),
      },
    });

    invalidateCache();
    revalidatePath('/categorias/treinamentos');
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Erro ao atualizar reel:', error);
    return NextResponse.json({ error: 'Erro ao atualizar reel' }, { status: 500 });
  }
}

// POST /api/reels/[id] -> Converte um Reel cadastrado por engano para um Treinamento Completo (16:9) na aba Treinamentos
export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const isAdmin = await checkIsAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const reel = await (prisma as any).shortReel.findUnique({
      where: { id: params.id },
    });

    if (!reel) {
      return NextResponse.json({ error: 'Reel não encontrado' }, { status: 404 });
    }

    const categories = await getOrSeedCategories();
    const treinamentosCat =
      categories.find((c: any) => c.slug === 'treinamentos') || categories[0];

    try {
      await (prisma as any).$executeRawUnsafe(`
        ALTER TABLE "Article" ADD COLUMN IF NOT EXISTS "videoType" TEXT DEFAULT 'training';
      `);
    } catch (_) {}

    const summaryText =
      reel.description && reel.description.trim()
        ? reel.description.trim()
        : `Videoaula de treinamento completo: ${reel.title}`;

    const article = await (prisma as any).article.create({
      data: {
        title: reel.title,
        summary: summaryText,
        content: `<p>${summaryText}</p>`,
        videoUrl: reel.videoUrl,
        videoType: 'training',
        categoryId: treinamentosCat.id,
      },
      include: { category: true, attachments: true },
    });

    await (prisma as any).shortReel.delete({
      where: { id: params.id },
    });

    revalidatePath('/');
    invalidateCache();
    revalidatePath('/categorias/treinamentos');
    revalidatePath('/categorias/[slug]', 'page');

    return NextResponse.json({ success: true, article });
  } catch (error) {
    console.error('Erro ao converter reel para treinamento 16:9:', error);
    return NextResponse.json(
      { error: 'Erro ao converter para treinamento 16:9' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const isAdmin = await checkIsAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    await (prisma as any).shortReel.delete({
      where: { id: params.id },
    });

    invalidateCache();
    revalidatePath('/categorias/treinamentos');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao deletar reel:', error);
    return NextResponse.json({ error: 'Erro ao deletar reel' }, { status: 500 });
  }
}
