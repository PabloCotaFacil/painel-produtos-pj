import { prisma } from '@/lib/prisma';
import { checkIsAdmin } from '@/lib/auth';
import { redirect } from 'next/navigation';
import AdminComissoesClient from './AdminComissoesClient';

export const revalidate = 0;

export default async function AdminComissoesPage() {
  const isAdmin = await checkIsAdmin();
  if (!isAdmin) {
    redirect('/admin/login');
  }

  const products = await prisma.institutionProduct.findMany({
    include: {
      triggerTiers: {
        orderBy: { minVolume: 'asc' },
      },
    },
    orderBy: { bankName: 'asc' },
  });

  return <AdminComissoesClient initialProducts={products} />;
}
