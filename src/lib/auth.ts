import { cookies } from 'next/headers';
import { prisma } from './prisma';

export async function checkIsAdmin() {
  const cookieStore = cookies();
  const token = cookieStore.get('admin_session')?.value;

  if (!token) return false;

  try {
    const session = await prisma.adminSession.findUnique({
      where: { token },
    });

    if (!session) return false;
    if (session.expiresAt < new Date()) {
      await prisma.adminSession.delete({ where: { id: session.id } }).catch(() => {});
      return false;
    }

    return true;
  } catch (error) {
    console.error('Erro ao verificar sessão admin:', error);
    return false;
  }
}

export async function getAdminUsername(): Promise<string> {
  try {
    const config = await prisma.systemConfig.findUnique({
      where: { key: 'admin_username' },
    });
    if (config?.value) {
      return config.value.trim();
    }
  } catch (error) {
    console.error('Erro ao buscar usuário no banco:', error);
  }
  return (process.env.ADMIN_USERNAME || 'admin').trim();
}

export async function setAdminUsername(newUsername: string): Promise<boolean> {
  try {
    await prisma.systemConfig.upsert({
      where: { key: 'admin_username' },
      update: { value: newUsername.trim() },
      create: { key: 'admin_username', value: newUsername.trim() },
    });
    return true;
  } catch (error) {
    console.error('Erro ao salvar novo usuário:', error);
    return false;
  }
}

export async function getAdminPassword(): Promise<string> {
  try {
    const config = await prisma.systemConfig.findUnique({
      where: { key: 'admin_password' },
    });
    if (config?.value) {
      return config.value;
    }
  } catch (error) {
    console.error('Erro ao buscar senha no banco:', error);
  }
  return process.env.ADMIN_PASSWORD || 'admin';
}

export async function setAdminPassword(newPassword: string): Promise<boolean> {
  try {
    await prisma.systemConfig.upsert({
      where: { key: 'admin_password' },
      update: { value: newPassword },
      create: { key: 'admin_password', value: newPassword },
    });
    return true;
  } catch (error) {
    console.error('Erro ao salvar nova senha:', error);
    return false;
  }
}
