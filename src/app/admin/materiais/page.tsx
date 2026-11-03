import { prisma } from '@/lib/prisma';
import { checkIsAdmin } from '@/lib/auth';
import { getOrSeedCategories } from '@/lib/categories';
import { redirect } from 'next/navigation';
import AdminMateriaisClient from './AdminMateriaisClient';

export const revalidate = 0;

export default async function AdminMateriaisPage() {
  const isAdmin = await checkIsAdmin();
  if (!isAdmin) {
    redirect('/admin/login');
  }

  const categories = await getOrSeedCategories();
  const articles = await prisma.article.findMany({
    include: {
      category: true,
      attachments: true,
    },
    orderBy: { updatedAt: 'desc' },
  });

  return (
    <AdminMateriaisClient initialCategories={categories} initialArticles={articles} />
  );
}
