'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Lock, User, ArrowRight } from 'lucide-react';

export default function AdminLoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Usuário ou senha incorretos');
        setLoading(false);
      } else {
        router.push('/admin/materiais');
        router.refresh();
      }
    } catch (err) {
      setError('Erro ao conectar ao servidor');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-12 px-4">
      <div className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200 card-shadow space-y-6">
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-3">
            <Image
              src="/painel-icon.png"
              alt="Painel Operacional CotaFácil"
              width={64}
              height={64}
              className="w-16 h-16 object-contain drop-shadow-md"
            />
          </div>
          <h1 className="text-2xl font-black text-slate-900">Acesso Administrativo</h1>
          <p className="text-xs text-slate-500">
            Digite seu login e senha para gerenciar materiais, treinamentos e regras.
          </p>
        </div>

        {error && (
          <div className="bg-rose-50 text-rose-800 text-xs font-bold p-3.5 rounded-xl border border-rose-200 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-xs font-extrabold text-slate-700 block mb-1">USUÁRIO / LOGIN</label>
            <div className="relative">
              <input
                type="text"
                placeholder="ex: admin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                required
                autoFocus
              />
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            </div>
          </div>

          <div>
            <label className="text-xs font-extrabold text-slate-700 block mb-1">SENHA</label>
            <div className="relative">
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                required
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-blue-700 hover:bg-blue-800 text-white font-extrabold rounded-xl transition shadow-md text-sm flex items-center justify-center space-x-2 mt-2"
          >
            <span>{loading ? 'Validando acesso...' : 'Entrar no Painel'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
