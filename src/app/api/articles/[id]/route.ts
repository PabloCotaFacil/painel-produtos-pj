import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { checkIsAdmin } from '@/lib/auth';
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
    const { title, summary, content, categoryId, attachments, videoUrl, videoType } = body;

    try {
      await (prisma as any).$executeRawUnsafe(`
        ALTER TABLE "Article" ADD COLUMN IF NOT EXISTS "videoType" TEXT DEFAULT 'training';
      `);
    } catch (_) {}

    // Remove old attachments
    await prisma.attachment.deleteMany({ where: { articleId: params.id } });

    const cleanVideoUrl = videoUrl ? videoUrl.trim() : null;
    const finalVideoType = cleanVideoUrl
      ? videoType === 'reel'
        ? 'reel'
        : 'training'
      : null;

    const finalContent = content && content.trim() ? content : summary;

    const article = await (prisma as any).article.update({
      where: { id: params.id },
      data: {
        title: title.trim(),
        summary: summary.trim(),
        content: finalContent,
        videoUrl: cleanVideoUrl,
        videoType: finalVideoType,
        categoryId,
        attachments: {
          create: attachments?.map((att: { name: string; fileUrl: string }) => ({
            name: att.name,
            fileUrl: att.fileUrl,
            fileType: 'pdf',
          })),
        },
      },
      include: { category: true, attachments: true },
    });

    // Se for um Treinamento 16:9, remove eventual duplicata na tabela ShortReel
    if (cleanVideoUrl && finalVideoType === 'training') {
      try {
        await (prisma as any).shortReel.deleteMany({
          where: { videoUrl: cleanVideoUrl },
        });
      } catch (_) {}
    }

    invalidateCache();
    revalidatePath('/');
    revalidatePath(`/artigos/${params.id}`);
    revalidatePath('/categorias/treinamentos');
    revalidatePath('/categorias/[slug]', 'page');

    return NextResponse.json(article);
  } catch (error) {
    console.error('Update article error:', error);
    return NextResponse.json({ error: 'Erro ao atualizar artigo' }, { status: 500 });
  }
}

// Alternância rápida de formato (16:9 Training <-> 9:16 Reel) com 1 clique
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const isAdmin = await checkIsAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { videoType } = body;

    try {
      await (prisma as any).$executeRawUnsafe(`
        ALTER TABLE "Article" ADD COLUMN IF NOT EXISTS "videoType" TEXT DEFAULT 'training';
      `);
    } catch (_) {}

    const targetType = videoType === 'reel' ? 'reel' : 'training';

    const updated = await (prisma as any).article.update({
      where: { id: params.id },
      data: { videoType: targetType },
      include: { category: true, attachments: true },
    });

    if (targetType === 'training' && updated.videoUrl) {
      try {
        await (prisma as any).shortReel.deleteMany({
          where: { videoUrl: updated.videoUrl },
        });
      } catch (_) {}
    }

    invalidateCache();
    revalidatePath('/');
    revalidatePath(`/artigos/${params.id}`);
    revalidatePath('/categorias/treinamentos');
    revalidatePath('/categorias/[slug]', 'page');

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Patch article videoType error:', error);
    return NextResponse.json({ error: 'Erro ao alterar formato do vídeo' }, { status: 500 });
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
    await prisma.attachment.deleteMany({ where: { articleId: params.id } });
    await prisma.article.delete({ where: { id: params.id } });

    invalidateCache();
    revalidatePath('/');
    revalidatePath('/categorias/treinamentos');
    revalidatePath('/categorias/[slug]', 'page');

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao deletar artigo' }, { status: 500 });
  }
}
