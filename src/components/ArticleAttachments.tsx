'use client';

import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  Eye,
  Maximize2,
  Minimize2,
  ExternalLink,
  X,
} from 'lucide-react';

interface Attachment {
  id: string;
  name: string;
  fileUrl: string;
}

interface ArticleAttachmentsProps {
  attachments: Attachment[];
}

export default function ArticleAttachments({ attachments }: ArticleAttachmentsProps) {
  const [selectedFile, setSelectedFile] = useState<Attachment | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  // Helper para converter URL em formato embeddable
  const getEmbedUrl = (rawUrl: string): string => {
    if (!rawUrl) return '';

    // Google Drive: converter link de visualização para /preview
    const gdriveMatch = rawUrl.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (gdriveMatch && gdriveMatch[1]) {
      return `https://drive.google.com/file/d/${gdriveMatch[1]}/preview`;
    }

    // Se for URL da API de arquivos (/api/files/[id])
    if (rawUrl.startsWith('/api/files/')) {
      return `${rawUrl}#toolbar=1&navpanes=1`;
    }

    return rawUrl;
  };

  // Gerencia conversão de data URI para Blob URL para evitar restrições de navegadores
  useEffect(() => {
    if (!selectedFile) {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
        setBlobUrl(null);
      }
      return;
    }

    const url = selectedFile.fileUrl;
    if (url.startsWith('data:application/pdf;base64,') || url.startsWith('data:application/octet-stream;base64,')) {
      try {
        const base64 = url.split(',')[1];
        const binary = atob(base64);
        const len = binary.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: 'application/pdf' });
        const newBlobUrl = URL.createObjectURL(blob);
        setBlobUrl(newBlobUrl);
      } catch (e) {
        setBlobUrl(url);
      }
    } else {
      setBlobUrl(getEmbedUrl(url));
    }

    return () => {
      if (blobUrl && blobUrl.startsWith('blob:')) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [selectedFile]);

  if (!attachments || attachments.length === 0) return null;

  const handleOpenViewer = (file: Attachment) => {
    setSelectedFile(file);
    // Rolagem suave até o leitor caso não esteja em tela cheia
    setTimeout(() => {
      const viewerEl = document.getElementById('pdf-viewer-section');
      if (viewerEl) {
        viewerEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const handleCloseViewer = () => {
    setSelectedFile(null);
    setIsFullscreen(false);
  };

  const currentEmbedUrl = blobUrl || (selectedFile ? getEmbedUrl(selectedFile.fileUrl) : '');

  return (
    <div className="space-y-4">
      {/* SEÇÃO PRINCIPAL DE DOCUMENTOS */}
      <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl p-5 border border-emerald-200 dark:border-emerald-800/60 space-y-3.5 shadow-sm transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-sm shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-black text-emerald-950 dark:text-emerald-200 uppercase tracking-wider">
                Documentos & Manuais Disponíveis ({attachments.length})
              </h3>
              <p className="text-[11px] text-emerald-800 dark:text-emerald-300/90">
                Você pode visualizar qualquer manual na tela ou fazer o download para seu dispositivo.
              </p>
            </div>
          </div>
        </div>

        {/* LISTAGEM DE ARQUIVOS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {attachments.map((file) => {
            const isViewingThis = selectedFile?.id === file.id;

            return (
              <div
                key={file.id}
                className={`bg-white dark:bg-slate-800/90 rounded-xl p-3.5 border transition-all duration-200 flex flex-col justify-between gap-3 shadow-sm ${
                  isViewingThis
                    ? 'border-blue-500 ring-2 ring-blue-400/40 shadow-md'
                    : 'border-emerald-200 dark:border-slate-700 hover:border-emerald-400 dark:hover:border-emerald-500'
                }`}
              >
                <div className="flex items-start space-x-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0 mt-0.5">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-900 dark:text-white leading-snug break-words">
                      {file.name}
                    </p>
                    <span className="inline-block text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded mt-1 border border-emerald-100 dark:border-emerald-800">
                      PDF Oficial
                    </span>
                  </div>
                </div>

                {/* BOTÕES DE AÇÃO: VISUALIZAR E BAIXAR */}
                <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-700/80">
                  {/* Botão de Visualizar na Tela */}
                  <button
                    type="button"
                    onClick={() => handleOpenViewer(file)}
                    className={`flex-1 inline-flex items-center justify-center space-x-1.5 py-2 px-3 rounded-lg text-xs font-extrabold transition shadow-sm ${
                      isViewingThis
                        ? 'bg-blue-600 text-white shadow-blue-500/20'
                        : 'bg-blue-50 dark:bg-blue-950/70 hover:bg-blue-600 dark:hover:bg-blue-600 text-blue-700 dark:text-blue-300 hover:text-white border border-blue-200 dark:border-blue-800 hover:border-transparent'
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>{isViewingThis ? 'Visualizando' : 'Visualizar no Site'}</span>
                  </button>

                  {/* Botão de Download */}
                  <a
                    href={file.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    download={file.fileUrl.startsWith('data:') ? file.name : undefined}
                    className="inline-flex items-center justify-center space-x-1 py-2 px-3 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-100 border border-slate-200 dark:border-slate-600 transition"
                    title="Baixar arquivo para o computador"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-600 dark:text-slate-200" />
                    <span className="hidden sm:inline">Baixar</span>
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ============================================================ */}
      {/* VISUALIZADOR DE PDF INTEGRADO NA PÁGINA                     */}
      {/* ============================================================ */}
      {selectedFile && !isFullscreen && (
        <div
          id="pdf-viewer-section"
          className="rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 shadow-2xl transition-all duration-300 animate-in fade-in"
        >
          {/* BARRA SUPERIOR DO LEITOR */}
          <div className="bg-slate-950 px-4 py-3 flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 text-white">
            <div className="flex items-center space-x-2.5 min-w-0 pr-2">
              <div className="w-6 h-6 rounded bg-blue-600 text-white flex items-center justify-center shrink-0">
                <Eye className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-black truncate block text-slate-100">
                  {selectedFile.name}
                </span>
                <span className="text-[10px] text-cyan-400 font-semibold block">
                  Leitor Interativo de PDF
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              {/* Botão de Tela Cheia */}
              <button
                type="button"
                onClick={() => setIsFullscreen(true)}
                className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-bold transition border border-slate-700"
                title="Expandir para tela cheia"
              >
                <Maximize2 className="w-3.5 h-3.5 text-cyan-400" />
                <span>Tela Cheia</span>
              </button>

              {/* Botão Abrir em Nova Aba */}
              <a
                href={selectedFile.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-bold transition border border-slate-700"
                title="Abrir em nova aba do navegador"
              >
                <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
                <span className="hidden sm:inline">Nova Aba</span>
              </a>

              {/* Botão de Download */}
              <a
                href={selectedFile.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                download={selectedFile.fileUrl.startsWith('data:') ? selectedFile.name : undefined}
                className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold transition shadow-sm"
                title="Baixar arquivo"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Baixar</span>
              </a>

              {/* Botão Fechar Visualizador */}
              <button
                type="button"
                onClick={handleCloseViewer}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/60 text-slate-400 hover:text-rose-300 transition border border-slate-700"
                title="Fechar leitor"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* ÁREA DO IFRAME / LEITOR NATIVO */}
          <div className="relative w-full h-[600px] sm:h-[720px] bg-slate-950">
            <iframe
              src={currentEmbedUrl}
              title={selectedFile.name}
              className="w-full h-full border-0"
              allow="autoplay; encrypted-media; fullscreen"
            />
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL EM TELA CHEIA (FULLSCREEN IMMERSIVE READER)           */}
      {/* ============================================================ */}
      {selectedFile && isFullscreen && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex flex-col p-2 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 flex flex-col flex-1 shadow-2xl">
            {/* Header Modal */}
            <div className="bg-slate-950 px-5 py-3 flex items-center justify-between border-b border-slate-800 text-white">
              <div className="flex items-center space-x-3 min-w-0 pr-3">
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm font-black text-white truncate">
                    {selectedFile.name}
                  </h4>
                  <span className="text-xs text-cyan-400 font-semibold">
                    Modo Leitura em Tela Cheia
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsFullscreen(false)}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition border border-slate-700"
                >
                  <Minimize2 className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Sair de Tela Cheia</span>
                </button>

                <a
                  href={selectedFile.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition border border-slate-700"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
                  <span className="hidden sm:inline">Nova Aba</span>
                </a>

                <a
                  href={selectedFile.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  download={selectedFile.fileUrl.startsWith('data:') ? selectedFile.name : undefined}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Baixar</span>
                </a>

                <button
                  type="button"
                  onClick={handleCloseViewer}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-rose-900/60 text-slate-300 hover:text-white transition border border-slate-700"
                  title="Fechar"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Iframe Tela Cheia */}
            <div className="flex-1 w-full bg-slate-950 relative">
              <iframe
                src={currentEmbedUrl}
                title={selectedFile.name}
                className="w-full h-full border-0"
                allow="autoplay; encrypted-media; fullscreen"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
