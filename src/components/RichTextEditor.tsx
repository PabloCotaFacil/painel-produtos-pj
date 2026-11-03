'use client';

import React, { useRef, useState, useEffect } from 'react';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlertTriangle,
  CheckCircle2,
  Info,
  AlertCircle,
  Palette,
  Highlighter,
  Code,
  RotateCcw,
} from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = 'Escreva as regras, taxas, requisitos e orientações detalhadas...',
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showHighlightPicker, setShowHighlightPicker] = useState(false);
  const [showCodeMode, setShowCodeMode] = useState(false);
  const [htmlContent, setHtmlContent] = useState(value || '');

  const isInitializedRef = useRef(false);
  const lastHtmlRef = useRef(value || '');

  // Inicializa o conteúdo no editor e sincroniza apenas quando o valor vier de fora
  // (ex: carregar material para edição ou limpar formulário), sem resetar o cursor ao digitar.
  useEffect(() => {
    if (!isInitializedRef.current && editorRef.current) {
      editorRef.current.innerHTML = value || '';
      lastHtmlRef.current = value || '';
      isInitializedRef.current = true;
      return;
    }

    // Se o valor for exatamente o que o usuário acabou de digitar, não recria o DOM para preservar o cursor
    if (value === lastHtmlRef.current) {
      return;
    }

    lastHtmlRef.current = value || '';
    setHtmlContent(value || '');

    if (editorRef.current && !showCodeMode) {
      editorRef.current.innerHTML = value || '';
    }
  }, [value, showCodeMode]);

  const handleInput = () => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      lastHtmlRef.current = html;
      setHtmlContent(html);
      onChange(html);
    }
  };

  const exec = (command: string, val: string | undefined = undefined) => {
    if (showCodeMode) return;
    editorRef.current?.focus();
    document.execCommand(command, false, val);
    handleInput();
  };

  const handleToggleCodeMode = () => {
    if (showCodeMode) {
      // Voltando para modo visual
      setShowCodeMode(false);
      lastHtmlRef.current = htmlContent;
      onChange(htmlContent);
      setTimeout(() => {
        if (editorRef.current) {
          editorRef.current.innerHTML = htmlContent;
        }
      }, 0);
    } else {
      // Indo para modo código HTML
      if (editorRef.current) {
        const current = editorRef.current.innerHTML;
        lastHtmlRef.current = current;
        setHtmlContent(current);
      }
      setShowCodeMode(true);
    }
  };

  const applyTextColor = (color: string) => {
    exec('foreColor', color);
    setShowColorPicker(false);
  };

  const applyHighlightColor = (color: string) => {
    exec('hiliteColor', color);
    setShowHighlightPicker(false);
  };

  // Inserir Caixa de Alerta estilizada preservando a posição do cursor e permitindo digitação natural
  const insertAlertBox = (type: 'danger' | 'warning' | 'success' | 'info') => {
    if (showCodeMode) return;
    editorRef.current?.focus();

    // Se o usuário selecionou texto antes de clicar no botão, coloca o texto dentro da caixa
    const selection = typeof window !== 'undefined' ? window.getSelection() : null;
    const selectedText = selection && !selection.isCollapsed ? selection.toString().trim() : '';

    let alertHtml = '';
    if (type === 'danger') {
      const text = selectedText || 'Digite o aviso importante aqui...';
      alertHtml = `
        <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 12px 16px; border-radius: 8px; margin: 12px 0; color: #991b1b;">
          <strong>🚨 ATENÇÃO / REGRA CRÍTICA:</strong> ${text}
        </div><p><br></p>
      `;
    } else if (type === 'warning') {
      const text = selectedText || 'Digite a observação da esteira aqui...';
      alertHtml = `
        <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 12px 16px; border-radius: 8px; margin: 12px 0; color: #92400e;">
          <strong>⚠️ OBSERVAÇÃO / CUIDADO:</strong> ${text}
        </div><p><br></p>
      `;
    } else if (type === 'success') {
      const text = selectedText || 'Digite o passo a passo recomendado aqui...';
      alertHtml = `
        <div style="background-color: #f0fdf4; border-left: 4px solid #22c55e; padding: 12px 16px; border-radius: 8px; margin: 12px 0; color: #166534;">
          <strong>✅ DICA DE APROVAÇÃO:</strong> ${text}
        </div><p><br></p>
      `;
    } else {
      const text = selectedText || 'Digite as regras gerais aqui...';
      alertHtml = `
        <div style="background-color: #f0f9ff; border-left: 4px solid #0284c7; padding: 12px 16px; border-radius: 8px; margin: 12px 0; color: #075985;">
          <strong>ℹ️ INFORMAÇÃO BANCÁRIA:</strong> ${text}
        </div><p><br></p>
      `;
    }

    document.execCommand('insertHTML', false, alertHtml);
    handleInput();
  };

  const colors = [
    { name: 'Vermelho CotaFácil', hex: '#dc2626' },
    { name: 'Vermelho Escuro', hex: '#991b1b' },
    { name: 'Azul', hex: '#2563eb' },
    { name: 'Azul Escuro', hex: '#1e3a8a' },
    { name: 'Verde', hex: '#16a34a' },
    { name: 'Laranja', hex: '#ea580c' },
    { name: 'Amarelo Escuro', hex: '#d97706' },
    { name: 'Roxo', hex: '#9333ea' },
    { name: 'Cinza', hex: '#475569' },
    { name: 'Padrão Automático (Claro/Escuro)', hex: 'inherit' },
  ];

  const highlights = [
    { name: 'Amarelo', hex: '#fef08a' },
    { name: 'Verde', hex: '#bbf7d0' },
    { name: 'Vermelho suave', hex: '#fecaca' },
    { name: 'Azul suave', hex: '#bfdbfe' },
    { name: 'Laranja suave', hex: '#fed7aa' },
    { name: 'Sem marcação', hex: 'transparent' },
  ];

  return (
    <div className="border border-slate-300 dark:border-slate-700 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 shadow-sm focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition">
      {/* TOOLBAR */}
      <div className="bg-slate-100/90 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-2 flex flex-wrap items-center gap-1.5 text-xs text-slate-700 dark:text-slate-200 select-none">
        {/* TEXT COLORS (VERMELHO, AZUL, ETC.) */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setShowColorPicker(!showColorPicker);
              setShowHighlightPicker(false);
            }}
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 font-bold text-slate-800 dark:text-slate-200 transition"
            title="Mudar cor do texto"
          >
            <Palette className="w-3.5 h-3.5 text-rose-600" />
            <span>Cor da Letra</span>
            <span className="w-2.5 h-2.5 rounded-full bg-rose-600 inline-block ml-1"></span>
          </button>

          {showColorPicker && (
            <div className="absolute left-0 top-full mt-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-2.5 rounded-xl shadow-xl z-30 w-52 grid grid-cols-5 gap-2">
              {colors.map((c) => (
                <button
                  key={c.hex}
                  type="button"
                  onClick={() => {
                    if (c.hex === 'inherit') {
                      exec('removeFormat');
                      setShowColorPicker(false);
                    } else {
                      applyTextColor(c.hex);
                    }
                  }}
                  className="w-7 h-7 rounded-lg border border-slate-300 dark:border-slate-600 hover:scale-110 transition shadow-sm"
                  style={{ backgroundColor: c.hex === 'inherit' ? '#64748b' : c.hex }}
                  title={c.name}
                />
              ))}
              <div className="col-span-5 pt-1 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] font-bold text-slate-600 dark:text-slate-300">
                <span>Personalizada:</span>
                <input
                  type="color"
                  onChange={(e) => applyTextColor(e.target.value)}
                  className="w-6 h-6 p-0 border-0 rounded cursor-pointer"
                  title="Escolha qualquer cor"
                />
              </div>
            </div>
          )}
        </div>

        {/* HIGHLIGHT / MARCA-TEXTO */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setShowHighlightPicker(!showHighlightPicker);
              setShowColorPicker(false);
            }}
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 font-bold text-slate-800 dark:text-slate-200 transition"
            title="Marca-texto (fundo colorido)"
          >
            <Highlighter className="w-3.5 h-3.5 text-amber-500" />
            <span>Destaque</span>
          </button>

          {showHighlightPicker && (
            <div className="absolute left-0 top-full mt-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-2.5 rounded-xl shadow-xl z-30 w-44 space-y-1">
              {highlights.map((h) => (
                <button
                  key={h.hex}
                  type="button"
                  onClick={() => applyHighlightColor(h.hex)}
                  className="w-full text-left px-2 py-1 rounded text-xs font-bold flex items-center space-x-2 hover:opacity-80 text-slate-800 dark:text-slate-200"
                >
                  <span
                    className="w-4 h-4 rounded border border-slate-300 inline-block"
                    style={{ backgroundColor: h.hex === 'transparent' ? '#ffffff' : h.hex }}
                  ></span>
                  <span>{h.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="h-5 w-px bg-slate-300 dark:bg-slate-700 mx-0.5" />

        {/* FORMAT BUTTONS */}
        <button
          type="button"
          onClick={() => exec('bold')}
          className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 hover:shadow-sm font-black transition"
          title="Negrito (Ctrl+B)"
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => exec('italic')}
          className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 hover:shadow-sm italic transition"
          title="Itálico (Ctrl+I)"
        >
          <Italic className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => exec('underline')}
          className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 hover:shadow-sm underline transition"
          title="Sublinhado (Ctrl+U)"
        >
          <Underline className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => exec('strikeThrough')}
          className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 hover:shadow-sm line-through transition"
          title="Tachado"
        >
          <Strikethrough className="w-4 h-4" />
        </button>

        <div className="h-5 w-px bg-slate-300 dark:bg-slate-700 mx-0.5" />

        {/* HEADINGS */}
        <button
          type="button"
          onClick={() => exec('formatBlock', '<h2>')}
          className="px-2 py-1 rounded-lg hover:bg-white dark:hover:bg-slate-700 hover:shadow-sm font-extrabold text-xs transition"
          title="Título Principal"
        >
          H1
        </button>
        <button
          type="button"
          onClick={() => exec('formatBlock', '<h3>')}
          className="px-2 py-1 rounded-lg hover:bg-white dark:hover:bg-slate-700 hover:shadow-sm font-bold text-xs transition"
          title="Subtítulo"
        >
          H2
        </button>
        <button
          type="button"
          onClick={() => exec('formatBlock', '<p>')}
          className="px-2 py-1 rounded-lg hover:bg-white dark:hover:bg-slate-700 hover:shadow-sm font-medium text-xs transition"
          title="Parágrafo normal"
        >
          Normal
        </button>

        <div className="h-5 w-px bg-slate-300 dark:bg-slate-700 mx-0.5" />

        {/* LISTS */}
        <button
          type="button"
          onClick={() => exec('insertUnorderedList')}
          className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 hover:shadow-sm transition"
          title="Lista com marcadores"
        >
          <List className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => exec('insertOrderedList')}
          className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 hover:shadow-sm transition"
          title="Lista numerada"
        >
          <ListOrdered className="w-4 h-4" />
        </button>

        <div className="h-5 w-px bg-slate-300 dark:bg-slate-700 mx-0.5" />

        {/* ALIGN */}
        <button
          type="button"
          onClick={() => exec('justifyLeft')}
          className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 hover:shadow-sm transition"
          title="Alinhar à esquerda"
        >
          <AlignLeft className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => exec('justifyCenter')}
          className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 hover:shadow-sm transition"
          title="Centralizar"
        >
          <AlignCenter className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => exec('justifyRight')}
          className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 hover:shadow-sm transition"
          title="Alinhar à direita"
        >
          <AlignRight className="w-4 h-4" />
        </button>

        <div className="h-5 w-px bg-slate-300 dark:bg-slate-700 mx-0.5" />

        {/* CAIXAS DE ALERTA RÁPIDAS */}
        <div className="flex items-center space-x-1 bg-white dark:bg-slate-900 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
          <span className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase">Caixas:</span>
          <button
            type="button"
            onClick={() => insertAlertBox('danger')}
            className="p-1 rounded hover:bg-rose-100 text-rose-600 transition"
            title="Inserir Caixa Vermelha (Atenção / Proibido)"
          >
            <AlertCircle className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => insertAlertBox('warning')}
            className="p-1 rounded hover:bg-amber-100 text-amber-600 transition"
            title="Inserir Caixa Amarela (Observação)"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => insertAlertBox('success')}
            className="p-1 rounded hover:bg-emerald-100 text-emerald-600 transition"
            title="Inserir Caixa Verde (Dica / Aprovado)"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => insertAlertBox('info')}
            className="p-1 rounded hover:bg-blue-100 text-blue-600 transition"
            title="Inserir Caixa Azul (Informação)"
          >
            <Info className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="ml-auto flex items-center space-x-1">
          <button
            type="button"
            onClick={() => exec('removeFormat')}
            className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition"
            title="Limpar formatação da seleção"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleToggleCodeMode}
            className={`px-2.5 py-1 rounded-lg font-bold text-xs transition flex items-center space-x-1 ${
              showCodeMode
                ? 'bg-blue-700 text-white'
                : 'hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'
            }`}
            title="Alternar entre modo Visual e Código HTML"
          >
            <Code className="w-3.5 h-3.5" />
            <span>{showCodeMode ? 'Ver Visual' : 'Ver HTML'}</span>
          </button>
        </div>
      </div>

      {/* EDITOR AREA */}
      {showCodeMode ? (
        <textarea
          value={htmlContent}
          onChange={(e) => {
            setHtmlContent(e.target.value);
            onChange(e.target.value);
          }}
          className="w-full min-h-[350px] p-4 font-mono text-xs bg-slate-900 text-emerald-400 focus:outline-none"
          placeholder="Código HTML..."
        />
      ) : (
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={handleInput}
          onBlur={handleInput}
          className="min-h-[350px] max-h-[600px] overflow-y-auto p-5 text-sm sm:text-base text-slate-900 dark:text-slate-100 focus:outline-none leading-relaxed max-w-none article-body"
          style={{ whiteSpace: 'normal', wordBreak: 'break-word' }}
          data-placeholder={placeholder}
        />
      )}
    </div>
  );
}
