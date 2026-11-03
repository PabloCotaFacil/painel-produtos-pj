import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkIsAdmin } from '@/lib/auth';

export async function POST(request: Request) {
  const isAdmin = await checkIsAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { bankName, segment, description, triggerTiers } = body;

    if (!bankName || !segment) {
      return NextResponse.json({ error: 'Nome do banco e segmento são obrigatórios' }, { status: 400 });
    }

    const product = await prisma.institutionProduct.create({
      data: {
        bankName,
        segment,
        description,
        triggerTiers: {
          create: triggerTiers?.map((t: { minVolume: number; maxVolume: number | null; commissionRate: number }) => ({
            minVolume: Number(t.minVolume),
            maxVolume: t.maxVolume !== null && t.maxVolume !== undefined ? Number(t.maxVolume) : null,
            commissionRate: Number(t.commissionRate),
          })),
        },
      },
      include: { triggerTiers: true },
    });

    return NextResponse.json(product);
  } catch (error) {
    console.error('Commission error:', error);
    return NextResponse.json({ error: 'Erro ao criar banco/gatilho' }, { status: 500 });
  }
}
