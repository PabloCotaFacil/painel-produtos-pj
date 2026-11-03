import { NextResponse } from 'next/server';
import { checkIsAdmin, getAdminUsername, setAdminUsername, setAdminPassword } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const isAdmin = await checkIsAdmin();
  if (!isAdmin) {
    return NextResponse.json({ isAdmin: false, error: 'Não autorizado' }, { status: 401 });
  }

  const username = await getAdminUsername();
  return NextResponse.json({ isAdmin: true, username });
}

export async function POST(request: Request) {
  try {
    const isAdmin = await checkIsAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { newUsername, newPassword } = await request.json();

    if (newUsername && typeof newUsername === 'string') {
      const trimmedUser = newUsername.trim();
      if (trimmedUser.length < 3) {
        return NextResponse.json({ error: 'O nome de usuário deve ter no mínimo 3 caracteres' }, { status: 400 });
      }
      await setAdminUsername(trimmedUser);
    }

    if (newPassword && typeof newPassword === 'string') {
      const trimmedPass = newPassword.trim();
      if (trimmedPass.length < 4) {
        return NextResponse.json({ error: 'A senha deve ter no mínimo 4 caracteres' }, { status: 400 });
      }
      await setAdminPassword(trimmedPass);
    }

    return NextResponse.json({
      success: true,
      message: 'Credenciais de acesso atualizadas com sucesso!',
    });
  } catch (error) {
    console.error('Erro ao atualizar credenciais:', error);
    return NextResponse.json({ error: 'Erro interno ao salvar credenciais' }, { status: 500 });
  }
}
