import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdminUsername, getAdminPassword } from '@/lib/auth';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();
    const adminUsername = await getAdminUsername();
    const adminPassword = await getAdminPassword();

    // Validação de Usuário
    if (!username || username.trim().toLowerCase() !== adminUsername.toLowerCase()) {
      return NextResponse.json({ error: 'Usuário ou senha incorretos' }, { status: 401 });
    }

    // Validação de Senha
    if (!password || password !== adminPassword) {
      return NextResponse.json({ error: 'Usuário ou senha incorretos' }, { status: 401 });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await prisma.adminSession.create({
      data: { token, expiresAt },
    });

    const response = NextResponse.json({ success: true });
    response.cookies.set('admin_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: expiresAt,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Erro no login:', error);
    return NextResponse.json({ error: 'Erro no servidor' }, { status: 500 });
  }
}
