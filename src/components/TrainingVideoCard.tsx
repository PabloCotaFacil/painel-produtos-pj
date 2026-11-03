'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Play,
  Calendar,
  FileText,
  ExternalLink,
  MonitorPlay,
  Eye,
  Loader2,
} from 'lucide-react';
import { getEmbedInfo, getVideoThumbnail } from './VideoPlayer';

interface Attachment {
  id: string;
  name: string;
  fileUrl?: string;
  fileType: string;
}

interface TrainingArticle {
  id: string;
  title: string;
  summary: string;
  videoUrl?: string | null;
  videoType?: string | null;
  updatedAt: Date | string;
  category: {
    name: string;
    slug: string;
  };
  attachments: Attachment[];
}

export default function TrainingVideoCard({ article }: { article: TrainingArticle }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [iframeLoaded, setIframeLoaded] = useState(false);

  const formattedDate = new Date(article.updatedAt).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const videoUrl = (article.videoUrl || '').trim();
  const thumbnailUrl = getVideoThumbnail(videoUrl);
  const embed = getEmbedInfo(videoUrl, { autoplay: true });

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 card-shadow hover:border-blue-400 dark:hover:border-blue-500 transition flex flex-col justify-between group">
      <div>
        {/* Player / Thumbnail 16:9 Widescreen */}
        <div className="relative w-full aspect-video bg-slate-950 overflow-hidden border-b border-slate-200 dark:border-slate-800">
          {isPlaying && videoUrl ? (
            embed.type === 'iframe' ? (
              <div className="relative w-full h-full">
                {!iframeLoaded && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 text-slate-400 z-10 pointer-events-none">
                    <Loader2 className="w-7 h-7 text-cyan-400 animate-spin mb-1.5" />
                    <span className="text-xs font-bold">Iniciando aula...</span>
                  </div>
                )}
                <iframe
                  src={embed.src}
                  title={article.title}
                  loading="eager"
                  onLoad={() => setIframeLoaded(true)}
                  className="w-full h-full border-0 relative z-20"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
                  allowFullScreen
                />
              </div>
            ) : (
              <video
                src={embed.src}
                controls
                autoPlay
                playsInline
                className="w-full h-full object-contain bg-black"
              />
            )
          ) : (
            <button
              type="button"
              onClick={() => setIsPlaying(true)}
              className="w-full h-full relative flex items-center justify-center group/play text-left focus:outline-none"
              title="Clique para reproduzir o treinamento 16:9 aqui mesmo"
            >
              {thumbnailUrl ? (
                <img
                  src={thumbnailUrl}
                  alt={article.title}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover opacity-90 group-hover/play:scale-105 group-hover/play:opacity-100 transition duration-300"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex flex-col items-center justify-center p-6 text-center">
                  <MonitorPlay className="w-12 h-12 text-cyan-400 mb-2 opacity-80" />
                  <span className="text-xs font-bold text-slate-300 line-clamp-1">
                    {article.title}
                  </span>
                </div>
              )}

              {/* Gradiente escuro suave para leitura das tags */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-black/30" />

              {/* Selo 16:9 no canto superior esquerdo */}
              <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-rose-600/95 backdrop-blur-sm text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg shadow">
                <MonitorPlay className="w-3.5 h-3.5" />
                <span>Treinamento 16:9</span>
              </div>

              {/* Botão Central de Play */}
              <div className="relative z-10 flex flex-col items-center gap-2">
                <div className="w-14 h-14 rounded-full bg-blue-600/95 group-hover/play:bg-blue-500 text-white flex items-center justify-center shadow-2xl border-2 border-white/80 group-hover/play:scale-110 transition-transform">
                  <Play className="w-6 h-6 fill-current ml-0.5" />
                </div>
                <span className="text-[11px] font-extrabold text-white bg-black/70 backdrop-blur-sm px-3 py-1 rounded-full border border-white/20">
                  Assistir Aula Agora
                </span>
              </div>

              {/* Data no canto inferior direito */}
              <div className="absolute bottom-2.5 right-3 flex items-center gap-1 text-[11px] font-bold text-slate-200 bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded-md">
                <Calendar className="w-3 h-3 text-cyan-400" />
                <span>{formattedDate}</span>
              </div>
            </button>
          )}
        </div>

        {/* Corpo do Card */}
        <div className="p-5">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 uppercase tracking-wide border border-blue-200/60 dark:border-blue-900/40">
              {article.category.name}
            </span>

            {article.attachments && article.attachments.length > 0 && (
              <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-900/40 flex items-center gap-1">
                <FileText className="w-3 h-3" />
                <span>{article.attachments.length} PDF(s) de Apoio</span>
              </span>
            )}
          </div>

          <Link href={`/artigos/${article.id}`}>
            <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition line-clamp-2 mb-2">
              {article.title}
            </h3>
          </Link>

          <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
            {article.summary}
          </p>
        </div>
      </div>

      {/* Rodapé com Ações */}
      <div className="px-5 py-3.5 bg-slate-50/70 dark:bg-slate-950/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
        {article.attachments && article.attachments.length > 0 ? (
          <Link
            href={`/artigos/${article.id}#pdf-viewer-section`}
            className="inline-flex items-center space-x-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300 hover:text-emerald-800 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-900/50 transition max-w-[60%]"
            title="Ver PDF / Material de Apoio"
          >
            <Eye className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{article.attachments[0].name}</span>
          </Link>
        ) : !isPlaying ? (
          <button
            type="button"
            onClick={() => setIsPlaying(true)}
            className="inline-flex items-center space-x-1.5 text-xs font-extrabold text-rose-600 dark:text-rose-400 hover:text-rose-700 transition"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Reproduzir no card</span>
          </button>
        ) : (
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            ▶ Reproduzindo aula
          </span>
        )}

        <Link
          href={`/artigos/${article.id}`}
          className="inline-flex items-center space-x-1.5 text-xs font-extrabold text-blue-700 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition shrink-0"
        >
          <span>Abrir Aula Completa</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
