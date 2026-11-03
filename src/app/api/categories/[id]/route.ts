import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkIsAdmin } from '@/lib/auth';
import { invalidateCache } from '@/lib/cache';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const isAdmin = await checkIsAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { name, slug, description, icon } = await request.json();

    if (!name) {
      return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 });
    }

    const finalSlug = (slug || name)
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const updated = await prisma.category.update({
      where: { id: params.id },
      data: {
        name: name.trim(),
        slug: finalSlug,
        description: description ? description.trim() : null,
        icon: icon || 'folder',
      },
    });

    invalidateCache('categories');
    invalidateCache('articles');

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Erro ao atualizar categoria:', error);
    return NextResponse.json(
      { error: error?.message || 'Erro ao atualizar categoria' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const isAdmin = await checkIsAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Conta se existem materiais vinculados
    const count = await prisma.article.count({
      where: { categoryId: params.id },
    });

    if (count > 0) {
      return NextResponse.json(
        {
          error: `Não é possível excluir esta categoria porque existem ${count} material(is) vinculado(s) a ela. Mova os materiais para outra categoria antes.`,
        },
        { status: 400 }
      );
    }

    await prisma.category.delete({
      where: { id: params.id },
    });

    invalidateCache('categories');
    invalidateCache('articles');

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Erro ao excluir categoria:', error);
    return NextResponse.json(
      { error: error?.message || 'Erro ao excluir categoria' },
      { status: 500 }
    );
  }
}
