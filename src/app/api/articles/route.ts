import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { checkIsAdmin } from '@/lib/auth';
import { invalidateCache } from '@/lib/cache';

export async function POST(request: Request) {
  const isAdmin = await checkIsAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { title, summary, content, categoryId, attachments, videoUrl, videoType } = body;

    if (!title || !summary || !categoryId) {
      return NextResponse.json({ error: 'Preencha todos os campos obrigatórios (Título, Resumo e Categoria)' }, { status: 400 });
    }

    // Garante coluna videoType no banco
    try {
      await (prisma as any).$executeRawUnsafe(`
        ALTER TABLE "Article" ADD COLUMN IF NOT EXISTS "videoType" TEXT DEFAULT 'training';
      `);
    } catch (_) {}

    const cleanVideoUrl = videoUrl ? videoUrl.trim() : null;
    // Se o usuário selecionou explicitamente 'reel' ou 'training', respeita 100% a escolha
    const finalVideoType = cleanVideoUrl
      ? videoType === 'reel'
        ? 'reel'
        : 'training'
      : null;

    const finalContent = content && content.trim() ? content : summary;

    const article = await (prisma as any).article.create({
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

    // Se for um Treinamento 16:9, garante que a mesma URL não fique presa na tabela ShortReel por engano
    if (cleanVideoUrl && finalVideoType === 'training') {
      try {
        await (prisma as any).shortReel.deleteMany({
          where: { videoUrl: cleanVideoUrl },
        });
      } catch (_) {}
    }

    invalidateCache();
    revalidatePath('/');
    revalidatePath('/categorias/treinamentos');
    revalidatePath('/categorias/[slug]', 'page');

    return NextResponse.json(article);
  } catch (error) {
    console.error('Create article error:', error);
    return NextResponse.json({ error: 'Erro ao criar artigo' }, { status: 500 });
  }
}
