import Link from 'next/link';
import { FileQuestion, Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="max-w-xl mx-auto py-16 px-4 text-center">
      <div className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200 card-shadow space-y-6">
        <div className="w-16 h-16 bg-blue-50 text-blue-700 rounded-3xl flex items-center justify-center mx-auto">
          <FileQuestion className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-cyan-600 bg-cyan-50 px-3 py-1 rounded-full">
            Página ou Material Não Encontrado
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
            Material ou Categoria Indisponível
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed max-w-sm mx-auto">
            O material ou categoria que você tentou acessar não foi localizado ou foi atualizado recentemente.
          </p>
        </div>

        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center justify-center space-x-2 bg-blue-700 hover:bg-blue-800 text-white font-extrabold px-5 py-3 rounded-xl transition shadow text-xs"
          >
            <Home className="w-4 h-4" />
            <span>Voltar para o Início</span>
          </Link>
          <Link
            href="/categorias/all"
            className="inline-flex items-center justify-center space-x-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold px-5 py-3 rounded-xl transition text-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Ver Todos os Materiais</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
