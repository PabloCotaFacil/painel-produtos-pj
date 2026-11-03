'use client';

import { useState, useEffect } from 'react';
import { getEmbedInfo, getVideoThumbnail } from './VideoPlayer';
import {
  Sparkles,
  Plus,
  Trash2,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Video,
  RotateCw,
  Eye,
  MonitorPlay,
} from 'lucide-react';
import type { ShortReelItem } from '@/lib/reels';

export default function AdminReelsManager({
  onConvertedToArticle,
}: {
  onConvertedToArticle?: (article: any) => void;
}) {
  const [reels, setReels] = useState<ShortReelItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [convertingId, setConvertingId] = useState<string | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [categoryTag, setCategoryTag] = useState('Crédito Imobiliário • Caixa');
  const [description, setDescription] = useState('');
  const [order, setOrder] = useState<number>(0);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Carrega os reels
  const loadReels = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/reels');
      if (res.ok) {
        const data = await res.json();
        setReels(data);
      }
    } catch (err) {
      console.error('Erro ao carregar reels:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReels();
  }, []);

  const handleCreateReel = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!title.trim() || !videoUrl.trim()) {
      setFeedback({ type: 'error', message: 'Preencha o título e o link do vídeo.' });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/reels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          videoUrl: videoUrl.trim(),
          categoryTag: categoryTag.trim(),
          description: description.trim() || null,
          order: Number(order) || 0,
          isActive: true,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao cadastrar reel');
      }

      setFeedback({ type: 'success', message: 'Pílula/Reel (9:16) cadastrado com sucesso!' });
      setTitle('');
      setVideoUrl('');
      setDescription('');
      setOrder(0);
      loadReels();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Erro ao salvar reel.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConvertReelToTraining = async (reel: ShortReelItem) => {
    if (
      !confirm(
        `Deseja mover "${reel.title}" do player de Reels (9:16) para a seção de Treinamentos Completos (16:9) logo abaixo dos Reels?`
      )
    ) {
      return;
    }

    setConvertingId(reel.id);
    setFeedback(null);
    try {
      const res = await fetch(`/api/reels/${reel.id}`, {
        method: 'POST',
      });
      const data = await res.json();
      if (res.ok && data.article) {
        setFeedback({
          type: 'success',
          message: `"${reel.title}" foi convertido para Treinamento Completo (16:9) e agora aparece abaixo dos Reels!`,
        });
        if (onConvertedToArticle) {
          onConvertedToArticle(data.article);
        }
        loadReels();
      } else {
        setFeedback({
          type: 'error',
          message: data.error || 'Erro ao converter para treinamento 16:9.',
        });
      }
    } catch (err) {
      setFeedback({ type: 'error', message: 'Erro de conexão ao converter vídeo.' });
    } finally {
      setConvertingId(null);
    }
  };

  const handleDeleteReel = async (id: string, reelTitle: string) => {
    if (!confirm(`Deseja realmente excluir a pílula "${reelTitle}"?`)) return;

    try {
      const res = await fetch(`/api/reels/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setFeedback({ type: 'success', message: 'Pílula excluída com sucesso!' });
        loadReels();
      } else {
        alert('Erro ao excluir pílula.');
      }
    } catch (err) {
      console.error(err);
      alert('Erro de conexão ao excluir.');
    }
  };

  const previewEmbed = videoUrl.trim() ? getEmbedInfo(videoUrl) : null;
  const looksLikeHorizontalVideo =
    videoUrl.trim().length > 0 &&
    !videoUrl.toLowerCase().includes('/shorts/') &&
    !videoUrl.toLowerCase().includes('vimeo.com');

  return (
    <div className="space-y-8">
      {/* Feedback Alert */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl flex items-center space-x-3 text-xs font-bold ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Formulário de Cadastro de Novo Reel */}
      <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 text-white flex items-center justify-center shadow-md">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900">Cadastrar Nova Pílula Rápida (Reel 9:16)</h3>
            <p className="text-xs text-slate-500">
              Exclusivo para vídeos verticais curtos (YouTube Shorts 9:16). Para vídeos em <strong>16:9 (Treinamento Padrão)</strong>, utilize a aba <strong>&quot;Publicar Novo Material&quot;</strong>.
            </p>
          </div>
        </div>

        <form onSubmit={handleCreateReel} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Título */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-extrabold text-slate-700">
                Título da Dica Rápida *
              </label>
              <input
                type="text"
                placeholder="Ex: Como calcular o LTV máximo no financiamento Caixa"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                required
              />
            </div>

            {/* URL do Vídeo */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-extrabold text-slate-700 flex items-center justify-between">
                <span>Link do YouTube Shorts Vertical (9:16) *</span>
                <span className="text-[11px] font-normal text-slate-400">
                  ex: https://youtube.com/shorts/kJQP7kiw5Fk
                </span>
              </label>
              <input
                type="url"
                placeholder="https://www.youtube.com/shorts/..."
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                required
              />
              {looksLikeHorizontalVideo && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs font-semibold flex items-start gap-2 mt-1.5">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Atenção:</strong> Este link parece ser um vídeo horizontal padrão (16:9) e não um Shorts (`/shorts/`). Se for um treinamento completo em 16:9, cadastre-o na aba <strong>&quot;Publicar Novo Material&quot;</strong> marcando <strong>&quot;Treinamento Completo (16:9)&quot;</strong> para que ele apareça abaixo dos Reels!
                  </span>
                </div>
              )}
            </div>

            {/* Tag / Assunto */}
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-700">
                Tag / Categoria da Dica
              </label>
              <input
                type="text"
                placeholder="Ex: Crédito Imobiliário • Caixa"
                value={categoryTag}
                onChange={(e) => setCategoryTag(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            {/* Ordem de Exibição */}
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-700">
                Ordem de Prioridade (Opcional)
              </label>
              <input
                type="number"
                placeholder="0"
                value={order}
                onChange={(e) => setOrder(Number(e.target.value))}
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            {/* Breve Descrição */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-extrabold text-slate-700">
                Breve Explicação / Dica Rápida (Opcional)
              </label>
              <textarea
                rows={2}
                placeholder="Explique em 1 ou 2 frases o resumo da dica operacional..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          {/* Pré-visualização do Shorts Vertical em Tempo Real */}
          {videoUrl.trim() && (
            <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center space-x-2 text-cyan-400 text-xs font-bold">
                <Eye className="w-4 h-4" />
                <span>Pré-visualização do Reel Vertical (9:16)</span>
              </div>
              <div className="max-w-[260px] mx-auto aspect-[9/16] bg-black rounded-2xl overflow-hidden border border-slate-700 shadow-xl">
                {previewEmbed && previewEmbed.type === 'iframe' ? (
                  <iframe
                    src={previewEmbed.src}
                    className="w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
                    allowFullScreen
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center p-4 text-center text-xs text-slate-400">
                    URL formatada. O vídeo carregará no reprodutor.
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center space-x-2 bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white font-extrabold px-6 py-3 rounded-xl text-xs transition shadow-md active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>{isSubmitting ? 'Salvando...' : 'Adicionar ao Feed de Reels (9:16)'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Lista de Reels Existentes */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-base font-black text-slate-900 flex items-center gap-2">
              <span>Pílulas Rápidas Disponíveis (Reels 9:16)</span>
              <span className="text-xs font-bold bg-slate-200 text-slate-700 px-2.5 py-0.5 rounded-full">
                {reels.length}
              </span>
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Subiu um vídeo 16:9 aqui por engano? Clique em <strong>&quot;Mover p/ Treinamento 16:9&quot;</strong> para transferi-lo para a grade abaixo dos Reels.
            </p>
          </div>
          <button
            onClick={loadReels}
            className="text-xs font-bold text-blue-700 hover:text-blue-800 flex items-center gap-1"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>Atualizar Lista</span>
          </button>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-xs text-slate-400 font-semibold">
            Carregando pílulas cadastradas...
          </div>
        ) : reels.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-2xl">
            Nenhuma pílula cadastrada ainda.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reels.map((reel) => {
              const reelThumb = getVideoThumbnail(reel.videoUrl);
              const isConverting = convertingId === reel.id;
              return (
                <div
                  key={reel.id}
                  className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition flex space-x-4 items-start"
                >
                  {/* Thumbnail / Miniatura */}
                  <div className="w-20 h-32 bg-slate-900 rounded-xl overflow-hidden shrink-0 relative flex items-center justify-center border border-slate-800">
                    {reelThumb ? (
                      <img
                        src={reelThumb}
                        alt={reel.title}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Video className="w-6 h-6 text-slate-500" />
                    )}
                    <span className="absolute bottom-1 right-1 bg-black/80 text-[9px] font-bold text-cyan-400 px-1 rounded">
                      9:16
                    </span>
                  </div>

                  {/* Informações */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between min-h-[8rem]">
                    <div>
                      {reel.categoryTag && (
                        <span className="text-[10px] font-extrabold text-blue-600 uppercase tracking-wide block truncate">
                          {reel.categoryTag}
                        </span>
                      )}
                      <h5 className="text-xs font-extrabold text-slate-900 line-clamp-2 leading-snug mt-0.5">
                        {reel.title}
                      </h5>
                      {reel.description && (
                        <p className="text-[11px] text-slate-500 line-clamp-2 mt-1">
                          {reel.description}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 mt-2 border-t border-slate-100">
                      <button
                        type="button"
                        disabled={isConverting}
                        onClick={() => handleConvertReelToTraining(reel)}
                        className="text-[11px] font-extrabold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2.5 py-1 rounded-lg flex items-center gap-1 transition disabled:opacity-50"
                        title="Converter para Treinamento Completo 16:9 (abaixo dos Reels)"
                      >
                        <MonitorPlay className="w-3.5 h-3.5 text-rose-600" />
                        <span>{isConverting ? 'Movendo...' : 'Mover p/ Treinamento 16:9'}</span>
                      </button>

                      <div className="flex items-center space-x-2">
                        <a
                          href={reel.videoUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] font-bold text-cyan-700 hover:text-cyan-800 flex items-center gap-1"
                        >
                          <span>Abrir</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>

                        <button
                          onClick={() => handleDeleteReel(reel.id, reel.title)}
                          className="text-xs text-rose-600 hover:text-rose-700 p-1 rounded-lg hover:bg-rose-50 transition"
                          title="Excluir Pílula"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
