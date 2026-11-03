import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const file = await prisma.storedFile.findUnique({
      where: { id: params.id },
    });

    if (!file) {
      return new NextResponse('Arquivo não encontrado', { status: 404 });
    }

    // Decodifica a string Base64 para Buffer binário nativo
    const fileBuffer = Buffer.from(file.data, 'base64');
    const encodedFileName = encodeURIComponent(file.name);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': file.mimeType || 'application/pdf',
        'Content-Disposition': `inline; filename="${file.name}"; filename*=UTF-8''${encodedFileName}`,
        'Content-Length': fileBuffer.length.toString(),
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Download file error:', error);
    return new NextResponse('Erro ao carregar o arquivo', { status: 500 });
  }
}
