'use client';

import React from 'react';
import Link from 'next/link';
import {
  Home,
  Building2,
  Sprout,
  Video,
  FileText,
  DollarSign,
  Sparkles,
  ExternalLink,
  Layers,
  ChevronRight,
  Play,
} from 'lucide-react';
import { getEmbedInfo } from './VideoPlayer';

export interface HeroCardItem {
  id: string;
  title: string;
  subtitle?: string;
  url: string;
  icon?: string;
  color?: string;
}

interface HeroMediaProps {
  mediaType?: string;
  videoUrl?: string | null;
  videoTitle?: string | null;
  cardsJson?: string | null;
}

const defaultCards: HeroCardItem[] = [
  {
    id: '1',
    title: 'Crédito Imobiliário',
    subtitle: 'LTV, esteiras Caixa, Itaú, BB e Santander',
    url: '/categorias/imobiliario',
    icon: 'home',
    color: 'blue',
  },
];

function isRemovedPJOrAgroCard(card: HeroCardItem): boolean {
  const text = `${card.title || ''} ${card.subtitle || ''} ${card.url || ''}`.toLowerCase();
  return (
    text.includes('credito-pj') ||
    text.includes('credito-agro') ||
    text.includes('crédito pj') ||
    text.includes('credito pj') ||
    text.includes('crédito agro') ||
    text.includes('credito agro') ||
    text.includes('capital de giro')
  );
}

function getIconComponent(iconName?: string) {
  switch (iconName?.toLowerCase()) {
    case 'home':
      return <Home className="w-5 h-5" />;
    case 'building':
      return <Building2 className="w-5 h-5" />;
    case 'sprout':
      return <Sprout className="w-5 h-5" />;
    case 'video':
      return <Video className="w-5 h-5" />;
    case 'file':
      return <FileText className="w-5 h-5" />;
    case 'dollar':
      return <DollarSign className="w-5 h-5" />;
    case 'star':
      return <Sparkles className="w-5 h-5" />;
    case 'link':
      return <ExternalLink className="w-5 h-5" />;
    default:
      return <Layers className="w-5 h-5" />;
  }
}

function getColorClasses(colorName?: string) {
  switch (colorName?.toLowerCase()) {
    case 'emerald':
    case 'green':
      return 'bg-emerald-500/30 text-emerald-300';
    case 'cyan':
      return 'bg-cyan-500/30 text-cyan-300';
    case 'purple':
      return 'bg-purple-500/30 text-purple-300';
    case 'amber':
    case 'yellow':
      return 'bg-amber-500/30 text-amber-300';
    case 'rose':
    case 'red':
      return 'bg-rose-500/30 text-rose-300';
    case 'blue':
    default:
      return 'bg-blue-500/30 text-cyan-300';
  }
}

export default function HeroMedia({
  mediaType = 'cards',
  videoUrl,
  videoTitle,
  cardsJson,
}: HeroMediaProps) {
  let cards: HeroCardItem[] = defaultCards;
  if (cardsJson) {
    try {
      const parsed = JSON.parse(cardsJson);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const filtered = parsed.filter((c: HeroCardItem) => !isRemovedPJOrAgroCard(c));
        if (filtered.length > 0) {
          cards = filtered;
        }
      }
    } catch {
      // fallback to default
    }
  }

  // Se o modo for vídeo e houver URL válida
  if (mediaType === 'video' && videoUrl?.trim()) {
    const rawUrl = videoUrl.trim();
    const embedInfo = getEmbedInfo(rawUrl);
    const embedSrc = embedInfo.src;
    const isIframe = embedInfo.type === 'iframe';

    return (
      <div className="w-full flex flex-col justify-center max-w-[440px] mx-auto">
        <div className="bg-slate-950/85 backdrop-blur-md border border-white/20 rounded-xl overflow-hidden shadow-xl">
          <div className="bg-white/10 px-3 py-1.5 flex items-center justify-between border-b border-white/10 text-[11px]">
            <div className="flex items-center space-x-1.5 text-cyan-300 font-bold truncate">
              <Play className="w-3 h-3 shrink-0 fill-cyan-300" />
              <span className="truncate">{videoTitle || 'Vídeo em Destaque'}</span>
            </div>
            <span className="text-[9px] text-white/70 font-bold uppercase tracking-wider shrink-0 bg-white/10 px-1.5 py-0.5 rounded">
              Player
            </span>
          </div>

          <div className="relative w-full aspect-video bg-black">
            {isIframe ? (
              <iframe
                src={embedSrc}
                title={videoTitle || 'Vídeo de Destaque CotaFácil'}
                loading="eager"
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
                allowFullScreen
              />
            ) : (
              <video
                src={embedSrc}
                controls
                playsInline
                className="w-full h-full object-contain"
                preload="metadata"
              >
                Seu navegador não suporta este vídeo.
              </video>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Modo padrão: Cards Clicáveis Interativos Compactos
  return (
    <div className="w-full flex flex-col gap-2 justify-center">
      {cards.map((card, idx) => {
        const isExternal = card.url?.startsWith('http://') || card.url?.startsWith('https://');
        const href = card.url?.trim() || '#';

        const content = (
          <div className="group bg-white/10 hover:bg-white/20 active:scale-[0.99] backdrop-blur-md border border-white/20 hover:border-white/35 rounded-xl px-3 py-2 sm:py-2.5 shadow-md flex items-center justify-between transition-all duration-200 hover:scale-[1.01] cursor-pointer">
            <div className="flex items-center space-x-2.5 min-w-0">
              <div
                className={`w-8 h-8 rounded-lg ${getColorClasses(
                  card.color
                )} flex items-center justify-center shrink-0 shadow-inner group-hover:scale-105 transition-transform`}
              >
                {getIconComponent(card.icon)}
              </div>
              <div className="min-w-0 text-left">
                <h4 className="text-xs font-black text-white group-hover:text-cyan-200 transition truncate">
                  {card.title}
                </h4>
                {card.subtitle && (
                  <p className="text-[10px] text-blue-100/90 truncate">
                    {card.subtitle}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center text-white/50 group-hover:text-white shrink-0 ml-2">
              {isExternal ? (
                <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              )}
            </div>
          </div>
        );

        if (isExternal) {
          return (
            <a
              key={card.id || idx}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="block focus:outline-none"
            >
              {content}
            </a>
          );
        }

        return (
          <Link key={card.id || idx} href={href} className="block focus:outline-none">
            {content}
          </Link>
        );
      })}
    </div>
  );
}
