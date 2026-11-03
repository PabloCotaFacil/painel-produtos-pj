'use client';

import { useState } from 'react';
import { Video, Loader2 } from 'lucide-react';

interface VideoPlayerProps {
  url: string;
  title?: string;
  videoType?: 'reel' | 'training' | string | null;
}

export function extractYouTubeId(rawUrl: string): string | null {
  if (!rawUrl) return null;
  const regExp = /(?:youtube(?:-nocookie)?\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=|(?:shorts|live)\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  const match = rawUrl.match(regExp);
  return match ? match[1] : null;
}

export function extractVimeoInfo(rawUrl: string): { id: string; hash?: string } | null {
  if (!rawUrl) return null;
  const trimmed = rawUrl.trim();
  if (!trimmed.includes('vimeo.com')) return null;

  // Extrai parâmetro ?h= se existir na query string
  const queryHashMatch = trimmed.match(/[?&]h=([a-zA-Z0-9]+)/);
  const queryHash = queryHashMatch ? queryHashMatch[1] : undefined;

  // Suporta vimeo.com/123456, vimeo.com/123456/hash, player.vimeo.com/video/123456, vimeo.com/manage/videos/123456
  const pathMatch = trimmed.match(
    /vimeo\.com\/(?:manage\/videos\/|video\/|channels\/[^\/]+\/|groups\/[^\/]+\/videos\/|album\/\d+\/video\/)?(\d+)(?:\/([a-zA-Z0-9]+))?/
  );

  if (pathMatch && pathMatch[1]) {
    return {
      id: pathMatch[1],
      hash: pathMatch[2] || queryHash,
    };
  }

  return null;
}

export function getVideoThumbnail(rawUrl?: string | null): string | null {
  if (!rawUrl) return null;
  const ytId = extractYouTubeId(rawUrl);
  if (ytId) {
    return `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
  }
  const vimeo = extractVimeoInfo(rawUrl);
  if (vimeo) {
    return `https://vumbnail.com/${vimeo.id}.jpg`;
  }
  return null;
}

export function getEmbedInfo(
  rawUrl: string,
  options?: { autoplay?: boolean; muted?: boolean; loop?: boolean }
): { type: 'iframe' | 'video'; src: string; provider: 'youtube' | 'vimeo' | 'other' } {
  const trimmed = (rawUrl || '').trim();

  // 1. YouTube
  const ytId = extractYouTubeId(trimmed);
  if (ytId) {
    const params = new URLSearchParams({
      rel: '0',
      modestbranding: '1',
      playsinline: '1',
      enablejsapi: '1',
    });
    if (options?.autoplay) params.set('autoplay', '1');
    if (options?.muted !== undefined) params.set('mute', options.muted ? '1' : '0');
    if (options?.loop) {
      params.set('loop', '1');
      params.set('playlist', ytId);
    }
    return {
      type: 'iframe',
      provider: 'youtube',
      src: `https://www.youtube-nocookie.com/embed/${ytId}?${params.toString()}`,
    };
  }

  // 2. Vimeo (Otimizado com dnt=1 e preload=auto para carregamento ultrarrápido + suporte a vídeos não listados com hash)
  const vimeo = extractVimeoInfo(trimmed);
  if (vimeo) {
    const params = new URLSearchParams();
    if (vimeo.hash) params.set('h', vimeo.hash);
    params.set('dnt', '1'); // Desativa rastreamento pesado do Vimeo (carrega até 3x mais rápido)
    params.set('title', '0');
    params.set('byline', '0');
    params.set('portrait', '0');
    params.set('badge', '0');
    params.set('autopause', '0');
    params.set('preload', 'auto');
    if (options?.autoplay) params.set('autoplay', '1');
    if (options?.muted !== undefined) params.set('muted', options.muted ? '1' : '0');
    if (options?.loop) params.set('loop', '1');

    return {
      type: 'iframe',
      provider: 'vimeo',
      src: `https://player.vimeo.com/video/${vimeo.id}?${params.toString()}`,
    };
  }

  // 3. Loom
  const loomMatch = trimmed.match(/loom\.com\/(?:share|embed)\/([a-zA-Z0-9]+)/);
  if (loomMatch && loomMatch[1]) {
    return {
      type: 'iframe',
      provider: 'other',
      src: `https://www.loom.com/embed/${loomMatch[1]}`,
    };
  }

  // 4. Google Drive
  const gdriveMatch = trimmed.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (gdriveMatch && gdriveMatch[1]) {
    return {
      type: 'iframe',
      provider: 'other',
      src: `https://drive.google.com/file/d/${gdriveMatch[1]}/preview`,
    };
  }

  // 5. Iframe já formatado
  if (trimmed.includes('/embed/') || trimmed.includes('player.vimeo.com')) {
    return { type: 'iframe', provider: 'other', src: trimmed };
  }

  // 6. Arquivo de vídeo direto (MP4 / WebM)
  return { type: 'video', provider: 'other', src: trimmed };
}

export default function VideoPlayer({
  url,
  title = 'Vídeo de Treinamento',
  videoType,
}: VideoPlayerProps) {
  const [iframeLoaded, setIframeLoaded] = useState(false);

  if (!url) return null;

  const trimmedUrl = url.trim();
  const isShorts =
    videoType === 'reel'
      ? true
      : videoType === 'training'
      ? false
      : trimmedUrl.includes('/shorts/');

  const embed = getEmbedInfo(trimmedUrl);

  return (
    <div className="rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-xl my-6">
      <div className="bg-slate-900/90 px-4 py-2.5 flex items-center justify-between border-b border-slate-800 text-xs">
        <div className="flex items-center space-x-2 text-cyan-400 font-bold">
          <Video className="w-4 h-4" />
          <span>
            {isShorts
              ? 'Pílula Rápida / Reel Vertical (9:16)'
              : 'Reprodutor de Treinamento Completo (16:9)'}
          </span>
        </div>
        <span className="text-[11px] text-slate-400 truncate max-w-xs">{title}</span>
      </div>

      <div
        className={
          isShorts
            ? 'p-4 sm:p-6 bg-slate-950 flex items-center justify-center'
            : 'relative w-full aspect-video bg-black flex items-center justify-center'
        }
      >
        <div
          className={
            isShorts
              ? 'relative w-full max-w-[340px] aspect-[9/16] bg-black rounded-2xl overflow-hidden border border-slate-800 shadow-2xl'
              : 'relative w-full h-full'
          }
        >
          {embed.type === 'iframe' ? (
            <>
              {!iframeLoaded && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 text-slate-400 z-10 pointer-events-none">
                  <Loader2 className="w-7 h-7 text-cyan-400 animate-spin mb-2" />
                  <span className="text-xs font-semibold">Carregando reprodutor de vídeo...</span>
                </div>
              )}
              <iframe
                src={embed.src}
                title={title}
                loading="eager"
                onLoad={() => setIframeLoaded(true)}
                className="w-full h-full border-0 relative z-20"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
                allowFullScreen
              />
            </>
          ) : (
            <video
              src={embed.src}
              controls
              playsInline
              className="w-full h-full object-contain"
              preload="metadata"
            >
              Seu navegador não suporta a reprodução deste formato de vídeo.
            </video>
          )}
        </div>
      </div>
    </div>
  );
}
