import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkIsAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: Request) {
  const isAdmin = await checkIsAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { uploadId, chunkIndex, totalChunks, chunkData, fileName, mimeType, fileSize } = body;

    if (!uploadId || chunkIndex === undefined || totalChunks === undefined || !chunkData) {
      return NextResponse.json({ error: 'Dados do pedaço de arquivo incompletos' }, { status: 400 });
    }

    // Salva o pedaço do arquivo no banco
    await prisma.uploadChunk.create({
      data: {
        uploadId,
        chunkIndex,
        totalChunks,
        data: chunkData,
      },
    });

    // Se for o último pedaço, junta todos os pedaços e cria o arquivo final definitivo
    if (chunkIndex === totalChunks - 1) {
      const allChunks = await prisma.uploadChunk.findMany({
        where: { uploadId },
        orderBy: { chunkIndex: 'asc' },
      });

      if (allChunks.length !== totalChunks) {
        return NextResponse.json(
          { error: `Inconsistência nos pedaços: recebidos ${allChunks.length} de ${totalChunks}. Tente novamente.` },
          { status: 400 }
        );
      }

      const fullData = allChunks.map((c) => c.data).join('');

      const storedFile = await prisma.storedFile.create({
        data: {
          name: fileName || 'documento.pdf',
          mimeType: mimeType || 'application/pdf',
          size: fileSize || 0,
          data: fullData,
        },
      });

      // Limpa os pedaços temporários
      await prisma.uploadChunk.deleteMany({
        where: { uploadId },
      }).catch(console.error);

      return NextResponse.json({
        success: true,
        completed: true,
        fileUrl: `/api/files/${storedFile.id}`,
        fileName: storedFile.name,
      });
    }

    return NextResponse.json({
      success: true,
      completed: false,
      progress: Math.round(((chunkIndex + 1) / totalChunks) * 100),
    });
  } catch (error: any) {
    console.error('Chunk upload error:', error);
    return NextResponse.json({ error: error?.message || 'Erro ao processar envio do pedaço' }, { status: 500 });
  }
}
