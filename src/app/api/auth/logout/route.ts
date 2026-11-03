import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST() {
  const token = cookies().get('admin_session')?.value;
  if (token) {
    await prisma.adminSession.deleteMany({ where: { token } }).catch(() => {});
  }
  const response = NextResponse.json({ success: true });
  response.cookies.delete('admin_session');
  return response;
}
