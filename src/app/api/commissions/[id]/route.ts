import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkIsAdmin } from '@/lib/auth';

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
    const { bankName, segment, description, triggerTiers } = body;

    // Remove old tiers
    await prisma.triggerTier.deleteMany({ where: { institutionProductId: params.id } });

    const product = await prisma.institutionProduct.update({
      where: { id: params.id },
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
    return NextResponse.json({ error: 'Erro ao atualizar produto de comissão' }, { status: 500 });
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
    await prisma.institutionProduct.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao remover produto' }, { status: 500 });
  }
}
