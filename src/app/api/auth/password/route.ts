import { NextResponse } from 'next/server';
import { checkIsAdmin, setAdminPassword } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const isAdmin = await checkIsAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { newPassword } = await request.json();
    if (!newPassword || typeof newPassword !== 'string' || newPassword.trim().length < 4) {
      return NextResponse.json(
        { error: 'A senha deve conter pelo menos 4 caracteres' },
        { status: 400 }
      );
    }

    const success = await setAdminPassword(newPassword.trim());
    if (!success) {
      return NextResponse.json({ error: 'Erro ao salvar a nova senha no banco' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Senha atualizada com sucesso!' });
  } catch (error) {
    console.error('Erro na rota de senha:', error);
    return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 });
  }
}
