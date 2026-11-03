'use client';

import Link from 'next/link';
import { Info, Calendar, Video, Eye } from 'lucide-react';

interface Attachment {
  id: string;
  name: string;
  fileUrl?: string;
  fileType: string;
}

interface Article {
  id: string;
  title: string;
  summary: string;
  videoUrl?: string | null;
  updatedAt: Date | string;
  category: {
    name: string;
    slug: string;
  };
  attachments: Attachment[];
}

export default function ArticleCard({ article }: { article: Article }) {
  const formattedDate = new Date(article.updatedAt).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 card-shadow hover:border-blue-400 dark:hover:border-blue-500 transition flex flex-col justify-between group">
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            <Link
              href={`/categorias/${article.category.slug}`}
              className="text-[11px] font-extrabold px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/60 transition uppercase tracking-wide shrink-0 border border-transparent dark:border-blue-900/40"
            >
              {article.category.name}
            </Link>
            {article.videoUrl && (
              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60 shrink-0">
                <Video className="w-3 h-3 text-rose-500 dark:text-rose-400" />
                <span>Vídeo Aula</span>
              </span>
            )}
          </div>
          <div className="flex items-center text-xs text-slate-400 dark:text-slate-500 gap-1 shrink-0">
            <Calendar className="w-3.5 h-3.5 shrink-0 text-cyan-500 dark:text-cyan-400" />
            <span>{formattedDate}</span>
          </div>
        </div>

        <Link href={`/artigos/${article.id}`}>
          <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition line-clamp-2 mb-2 flex items-start gap-2">
            <Info className="w-4 h-4 text-cyan-500 dark:text-cyan-400 shrink-0 mt-0.5" />
            <span>{article.title}</span>
          </h3>
        </Link>

        <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-3 mb-4 leading-relaxed">
          {article.summary}
        </p>
      </div>

      {/* Footer Attachments & Action */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
        {article.attachments && article.attachments.length > 0 ? (
          <Link
            href={`/artigos/${article.id}#pdf-viewer-section`}
            className="inline-flex items-center space-x-1.5 text-xs font-bold text-blue-700 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-200 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/50 px-2.5 py-1.5 rounded-lg border border-blue-200 dark:border-blue-900/50 transition shrink-0 max-w-[70%]"
            title="Visualizar manual diretamente no site"
          >
            <Eye className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
            <span className="truncate">{article.attachments[0].name}</span>
          </Link>
        ) : article.videoUrl ? (
          <span className="text-xs text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1">
            <Video className="w-3.5 h-3.5" />
            Vídeo disponível
          </span>
        ) : (
          <span className="text-xs text-slate-400 dark:text-slate-500 italic shrink-0">Regra em texto</span>
        )}

        <Link
          href={`/artigos/${article.id}`}
          className="text-xs font-bold text-blue-700 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 flex items-center gap-1 group-hover:translate-x-0.5 transition transform shrink-0 whitespace-nowrap"
        >
          <span>Acessar</span>
          <span>→</span>
        </Link>
      </div>
    </div>
  );
}
