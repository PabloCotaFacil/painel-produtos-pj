'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { getEmbedInfo, getVideoThumbnail } from './VideoPlayer';
import {
  Volume2,
  VolumeX,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ArrowDownCircle,
  Smartphone,
  Play,
  MonitorPlay,
  Search,
  ListVideo,
  Info,
  ExternalLink,
} from 'lucide-react';
import type { ShortReelItem } from '@/lib/reels';

export interface ReelFeedItem extends ShortReelItem {
  isArticle?: boolean;
}

interface TreinamentosReelsFeedProps {
  reels: ReelFeedItem[];
  catalogSectionId?: string;
  trainingsCount?: number;
  latestTrainingTitle?: string | null;
  latestTrainingId?: string | null;
}

export default function TreinamentosReelsFeed({
  reels,
  catalogSectionId = 'catalog-videoaulas',
  trainingsCount = 0,
  latestTrainingTitle = null,
  latestTrainingId = null,
}: TreinamentosReelsFeedProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const [showHint, setShowHint] = useState(true);
  const [slideDirection, setSlideDirection] = useState<'up' | 'down' | null>(null);
  const [reelFilter, setReelFilter] = useState('');

  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef<number | null>(null);
  const touchEndY = useRef<number | null>(null);

  useEffect(() => {
    setIsMounted(true);
    if (reels && reels.length > 0) {
      // Verifica se veio ?reel=ID na URL
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const reelIdParam = params.get('reel');
        if (reelIdParam) {
          const foundIdx = reels.findIndex((r) => r.id === reelIdParam);
          if (foundIdx >= 0) {
            setCurrentIndex(foundIdx);
            return;
          }
        }
      }
      setCurrentIndex(0);
    }

    const timer = setTimeout(() => setShowHint(false), 4000);
    return () => clearTimeout(timer);
  }, [reels]);

  // Navegação por teclado: Setas Cima / Baixo e M para som
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['input', 'textarea', 'select'].includes((e.target as HTMLElement)?.tagName?.toLowerCase())) {
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === 'm' || e.key === 'M') {
        setIsMuted((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [reels.length]);

  if (!reels || reels.length === 0) {
    return null;
  }

  const currentReel = reels[currentIndex] || reels[0];

  const triggerSlide = (dir: 'up' | 'down') => {
    setSlideDirection(dir);
    setTimeout(() => setSlideDirection(null), 250);
  };

  const handleNext = () => {
    triggerSlide('up');
    setCurrentIndex((prev) => (prev + 1) % reels.length);
  };

  const handlePrev = () => {
    triggerSlide('down');
    setCurrentIndex((prev) => (prev - 1 + reels.length) % reels.length);
  };

  const handleSelectReel = (idx: number) => {
    if (idx === currentIndex) return;
    triggerSlide(idx > currentIndex ? 'up' : 'down');
    setCurrentIndex(idx);
  };

  // Suporte a Touch Swipe no Celular
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.targetTouches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndY.current = e.targetTouches[0].clientY;
  };

  const handleTouchEnd = () => {
    if (touchStartY.current === null || touchEndY.current === null) return;
    const distance = touchStartY.current - touchEndY.current;
    const minSwipeDistance = 45;

    if (distance > minSwipeDistance) {
      handleNext();
    } else if (distance < -minSwipeDistance) {
      handlePrev();
    }

    touchStartY.current = null;
    touchEndY.current = null;
  };

  const scrollToCatalog = () => {
    const target = document.getElementById(catalogSectionId);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const embed = getEmbedInfo(currentReel.videoUrl, {
    autoplay: true,
    muted: isMuted,
    loop: true,
  });
  const isIframe = embed.type === 'iframe';
  const embedSrc = embed.src;

  const filteredReelsWithIndex = reels
    .map((item, idx) => ({ item, idx }))
    .filter(({ item }) => {
      if (!reelFilter.trim()) return true;
      const q = reelFilter.toLowerCase();
      return (
        item.title.toLowerCase().includes(q) ||
        (item.description || '').toLowerCase().includes(q) ||
        (item.categoryTag || '').toLowerCase().includes(q)
      );
    });

  return (
    <div
      ref={containerRef}
      className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 card-shadow p-5 sm:p-7 transition-colors"
    >
      {/* GRID DE 2 COLUNAS: PLAYER VERTICAL NO CANTO ESQUERDO + PAINEL DE INFORMAÇÕES À DIREITA */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* ============================================================ */}
        {/* COLUNA DA ESQUERDA (CANTO): PLAYER VERTICAL DE REELS (9:16)   */}
        {/* ============================================================ */}
        <div className="lg:col-span-5 xl:col-span-4 flex flex-col justify-between bg-slate-50/90 dark:bg-slate-950/80 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800/80">
          {/* Topo do Card Esquerdo */}
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200/80 dark:border-slate-800 gap-2">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-lg bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0 border border-cyan-500/30">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white leading-tight">
                  Pílulas Rápidas (Reels)
                </h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Dicas verticais 9:16
                </p>
              </div>
            </div>

            <span className="bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-extrabold font-mono px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
              {currentIndex + 1} / {reels.length}
            </span>
          </div>

          {/* Frame Estilo Smartphone (Proporção 9:16 Compacta) */}
          <div className="flex flex-col items-center justify-center my-auto">
            <div
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              className={`relative w-full max-w-[295px] sm:max-w-[305px] h-[480px] sm:h-[510px] bg-slate-950 rounded-[28px] border-[5px] border-slate-800 dark:border-slate-700 shadow-xl overflow-hidden flex flex-col justify-between transition-transform duration-250 ${
                slideDirection === 'up'
                  ? '-translate-y-2'
                  : slideDirection === 'down'
                  ? 'translate-y-2'
                  : 'translate-y-0'
              }`}
            >
              {/* Alto-falante sutil */}
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-14 h-1 rounded-full bg-slate-700/60 z-30 pointer-events-none"></div>

              {/* Dica visual flutuante temporária */}
              {showHint && (
                <div className="absolute top-10 left-1/2 -translate-x-1/2 z-30 bg-black/85 backdrop-blur-md text-white text-[10px] font-bold px-3 py-1 rounded-full border border-white/20 shadow-md pointer-events-none flex items-center space-x-1 animate-bounce whitespace-nowrap">
                  <span>👆</span>
                  <span>Use os botões ou clique na lista ao lado</span>
                </div>
              )}

              {/* Vídeo / Iframe */}
              <div className="absolute inset-0 w-full h-full bg-black">
                {isMounted && (
                  <>
                    {isIframe ? (
                      <iframe
                        key={`${currentReel.id}-${currentIndex}-${isMuted}`}
                        src={embedSrc}
                        title={currentReel.title}
                        loading="eager"
                        className="w-full h-full border-0 object-cover"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
                        allowFullScreen
                      />
                    ) : (
                      <video
                        key={`${currentReel.id}-${currentIndex}`}
                        src={embedSrc}
                        autoPlay
                        loop
                        playsInline
                        muted={isMuted}
                        controls
                        className="w-full h-full object-cover"
                      />
                    )}
                  </>
                )}
              </div>

              {/* Topo do Reel: Tag e Botão de Áudio */}
              <div className="relative z-20 p-3 pt-4 flex items-center justify-between bg-gradient-to-b from-black/80 via-black/25 to-transparent pointer-events-auto">
                <span className="text-[10px] font-bold text-white bg-black/60 backdrop-blur px-2.5 py-0.5 rounded-full border border-white/20">
                  ⚡ Reel {currentIndex + 1}
                </span>

                {/* Controle de Áudio */}
                <button
                  onClick={() => setIsMuted((prev) => !prev)}
                  className={`px-2.5 py-1 rounded-full text-xs font-bold transition flex items-center space-x-1 backdrop-blur shadow-md ${
                    isMuted
                      ? 'bg-black/70 hover:bg-black/90 text-slate-200 border border-white/25'
                      : 'bg-blue-600 hover:bg-blue-500 text-white border border-blue-400'
                  }`}
                  title="Ativar/Desativar som (Tecla M)"
                >
                  {isMuted ? (
                    <>
                      <VolumeX className="w-3 h-3 text-amber-400" />
                      <span className="text-[10px]">Ativar Som</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-3 h-3 text-white" />
                      <span className="text-[10px]">Som Ativo</span>
                    </>
                  )}
                </button>
              </div>

              {/* Rodapé do Reel: Título e Atalho de Próximo Vídeo */}
              <div className="relative z-20 p-3.5 pb-2.5 bg-gradient-to-t from-black/95 via-black/70 to-transparent pointer-events-auto">
                <div className="flex items-end justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    {currentReel.categoryTag && (
                      <span className="text-[10px] font-extrabold text-cyan-400 uppercase tracking-wider block mb-0.5 truncate">
                        {currentReel.categoryTag}
                      </span>
                    )}
                    <h3 className="text-xs sm:text-sm font-bold text-white leading-snug drop-shadow-md line-clamp-2">
                      {currentReel.title}
                    </h3>
                  </div>

                  <button
                    onClick={handleNext}
                    className="shrink-0 bg-blue-600 hover:bg-blue-500 text-white p-2 rounded-xl shadow-md border border-blue-400/50 flex items-center justify-center transition active:scale-90"
                    title="Próximo Vídeo"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>

                {/* Barra de Progresso */}
                <div className="w-full bg-white/20 h-1 rounded-full mt-2 overflow-hidden">
                  <div
                    className="bg-cyan-400 h-full transition-all duration-300"
                    style={{ width: `${((currentIndex + 1) / reels.length) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Botões Anterior / Próximo abaixo do celular */}
            <div className="mt-3.5 w-full max-w-[305px] flex items-center justify-center gap-2">
              <button
                onClick={handlePrev}
                className="flex-1 py-2 px-3 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-bold shadow-sm transition flex items-center justify-center space-x-1 active:scale-95"
              >
                <ChevronUp className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                <span>Anterior</span>
              </button>

              <button
                onClick={handleNext}
                className="flex-1 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black shadow-md transition flex items-center justify-center space-x-1 active:scale-95 group"
              >
                <span>Próximo</span>
                <ChevronDown className="w-3.5 h-3.5 group-hover:translate-y-0.5 transition-transform" />
              </button>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* COLUNA DA DIREITA: INFORMAÇÕES, PLAYLIST & ATALHO 16:9        */}
        {/* ============================================================ */}
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col justify-between space-y-5">
          {/* BLOCO 1: DETALHES DA DICA EM REPRODUÇÃO */}
          <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white rounded-2xl p-5 sm:p-6 shadow-lg border border-slate-800 relative overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider bg-cyan-500/20 text-cyan-300 px-3 py-1 rounded-full border border-cyan-400/30">
                <Sparkles className="w-3 h-3" />
                <span>{currentReel.categoryTag || 'Dica Rápida em Reprodução'}</span>
              </span>

              <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1">
                <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
                <span>Assistindo Pílula {currentIndex + 1} de {reels.length}</span>
              </span>
            </div>

            <h3 className="text-lg sm:text-xl font-black text-white leading-snug">
              {currentReel.title}
            </h3>

            <p className="text-xs sm:text-sm text-blue-100/90 mt-2 leading-relaxed">
              {currentReel.description ||
                'Assista à pílula rápida no reprodutor ao lado para conferir as dicas práticas e orientações operacionais.'}
            </p>

            {currentReel.isArticle && (
              <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-end">
                <Link
                  href={`/artigos/${currentReel.id}`}
                  className="inline-flex items-center space-x-1.5 text-xs font-extrabold text-cyan-300 hover:text-white bg-white/10 hover:bg-white/20 px-3.5 py-1.5 rounded-xl border border-white/15 transition"
                >
                  <Info className="w-3.5 h-3.5" />
                  <span>Ver página completa e anexos desta dica</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            )}
          </div>

          {/* BLOCO 2: PLAYLIST / ÍNDICE CLICÁVEL DE TODAS AS PÍLULAS RÁPIDAS */}
          <div className="bg-slate-50 dark:bg-slate-950/60 rounded-2xl p-4 sm:p-5 border border-slate-200/90 dark:border-slate-800 flex-1 flex flex-col justify-between space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200/80 dark:border-slate-800">
              <div className="flex items-center space-x-2">
                <ListVideo className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                <div>
                  <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white uppercase tracking-wide">
                    Índice de Pílulas Rápidas ({reels.length})
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Clique em qualquer dica abaixo para reproduzir diretamente no player ao lado
                  </p>
                </div>
              </div>

              {reels.length > 3 && (
                <div className="relative w-full sm:w-52">
                  <input
                    type="text"
                    placeholder="Filtrar pílula..."
                    value={reelFilter}
                    onChange={(e) => setReelFilter(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                </div>
              )}
            </div>

            {/* Lista Rolável de Pílulas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[260px] overflow-y-auto pr-1">
              {filteredReelsWithIndex.map(({ item, idx }) => {
                const isSelected = idx === currentIndex;
                const itemThumb = getVideoThumbnail(item.videoUrl);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectReel(idx)}
                    className={`p-2.5 rounded-xl border text-left transition flex items-center space-x-3 group ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                        : 'bg-white dark:bg-slate-900 hover:bg-blue-50/70 dark:hover:bg-slate-800/80 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    {/* Miniatura 9:16 */}
                    <div className="w-11 h-16 rounded-lg bg-slate-900 overflow-hidden shrink-0 relative flex items-center justify-center border border-black/20">
                      {itemThumb ? (
                        <img
                          src={itemThumb}
                          alt={item.title}
                          loading="lazy"
                          decoding="async"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Play className="w-4 h-4 text-white" />
                      )}
                      <div
                        className={`absolute inset-0 flex items-center justify-center ${
                          isSelected ? 'bg-blue-900/40' : 'bg-black/30 group-hover:bg-black/10'
                        }`}
                      >
                        <Play
                          className={`w-3.5 h-3.5 fill-current ${
                            isSelected ? 'text-cyan-300 animate-pulse' : 'text-white'
                          }`}
                        />
                      </div>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span
                          className={`text-[10px] font-extrabold uppercase truncate ${
                            isSelected ? 'text-cyan-200' : 'text-blue-600 dark:text-blue-400'
                          }`}
                        >
                          #{idx + 1} • {item.categoryTag || 'Dica Rápida'}
                        </span>
                        {isSelected && (
                          <span className="text-[9px] font-black bg-white/20 text-white px-1.5 py-0.5 rounded uppercase shrink-0">
                            Tocando
                          </span>
                        )}
                      </div>
                      <p
                        className={`text-xs font-extrabold line-clamp-2 mt-0.5 leading-snug ${
                          isSelected ? 'text-white' : 'text-slate-900 dark:text-white'
                        }`}
                      >
                        {item.title}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* BLOCO 3: DESTAQUE & CHAMADA PARA OS TREINAMENTOS COMPLETOS (16:9) ABAIXO */}
          <div className="bg-rose-50/80 dark:bg-rose-950/30 rounded-2xl p-4 sm:p-5 border border-rose-200 dark:border-rose-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start space-x-3.5">
              <div className="w-11 h-11 rounded-2xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-md">
                <MonitorPlay className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-sm font-black text-slate-900 dark:text-white">
                    Treinamentos Completos em 16:9
                  </h4>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300">
                    {trainingsCount} {trainingsCount === 1 ? 'aula disponível' : 'aulas disponíveis'}
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                  {latestTrainingTitle
                    ? `Último treinamento: "${latestTrainingTitle}"`
                    : 'Assista às videoaulas horizontais completas (16:9) e baixe os materiais logo abaixo.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
              {latestTrainingId && (
                <Link
                  href={`/artigos/${latestTrainingId}`}
                  className="text-xs font-bold text-rose-700 dark:text-rose-300 bg-white dark:bg-slate-900 hover:bg-rose-100 px-3.5 py-2.5 rounded-xl border border-rose-200 dark:border-rose-800 transition"
                >
                  Abrir Última Aula
                </Link>
              )}
              <button
                type="button"
                onClick={scrollToCatalog}
                className="inline-flex items-center space-x-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black px-4 py-2.5 rounded-xl shadow-md transition group"
              >
                <span>Ver Treinamentos (16:9)</span>
                <ArrowDownCircle className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
