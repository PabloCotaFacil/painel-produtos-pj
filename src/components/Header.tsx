'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import {
  Search,
  Home,
  Layers,
  Video,
  FileText,
  Sparkles,
  X,
  ArrowRight,
  Loader2,
  Briefcase,
} from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';

interface SearchArticleResult {
  id: string;
  title: string;
  summary: string;
  videoUrl?: string | null;
  videoType?: string | null;
  categoryName: string;
  categorySlug: string;
  attachmentsCount: number;
  firstAttachmentName?: string | null;
}

interface SearchReelResult {
  id: string;
  title: string;
  description?: string | null;
  categoryTag?: string | null;
  videoUrl: string;
}

export default function Header({ initialSearch = '' }: { initialSearch?: string }) {
    const [navCategories, setNavCategories] = useState<Array<{ id: string; name: string; slug: string }>>([]);

  useEffect(() => {
    fetch('/api/categories')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setNavCategories(data.filter((c: any) => c.slug !== 'treinamentos'));
        }
      })
      .catch(console.error);
  }, []);

  const [search, setSearch] = useState(initialSearch);
  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<{
    articles: SearchArticleResult[];
    reels: SearchReelResult[];
  }>({ articles: [], reels: [] });

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Fecha o dropdown ao clicar fora ou pressionar ESC
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Busca inteligente em tempo real (debounce de 220ms)
  useEffect(() => {
    const trimmed = search.trim();
    if (trimmed.length < 2) {
      setResults({ articles: [], reels: [] });
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`, {
          signal: controller.signal,
        });
        if (res.ok) {
          const data = await res.json();
          setResults({
            articles: data.articles || [],
            reels: data.reels || [],
          });
        }
      } catch (err: any) {
        if (err?.name !== 'AbortError') {
          console.error('Erro na busca rápida:', err);
        }
      } finally {
        setIsSearching(false);
      }
    }, 220);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [search]);

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsOpen(false);
    if (search.trim()) {
      router.push(`/?q=${encodeURIComponent(search.trim())}#materiais-section`);
      setTimeout(() => {
        const target = document.getElementById('materiais-section');
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    } else {
      router.push('/');
    }
  };

  const handleClearSearch = () => {
    setSearch('');
    setResults({ articles: [], reels: [] });
    setIsOpen(false);
    router.push('/');
  };

  const totalResults = results.articles.length + results.reels.length;

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200/90 dark:border-slate-800 shadow-sm sticky top-0 z-40 transition-colors">
      {/* Top Utility Bar */}
      <div className="bg-slate-50 dark:bg-slate-950/80 border-b border-slate-100 dark:border-slate-800/80 py-1.5 px-4 sm:px-6 lg:px-8 text-[11px] text-slate-500 dark:text-slate-400">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <span className="bg-blue-600 text-white font-extrabold px-2 py-0.5 rounded text-[10px] tracking-wide uppercase">
              COTAFÁCIL
            </span>
            <span className="hidden sm:inline font-medium text-slate-600 dark:text-slate-400">
              Hub de Apoio Operacional — Produtos PJ
            </span>
          </div>
          <div className="flex items-center space-x-3">
            <span className="text-slate-400 dark:text-slate-500 font-medium hidden md:inline">
              Portal Oficial de Manuais & Regras PJ
            </span>
            <ThemeToggle />
          </div>
        </div>
      </div>

      {/* Main Header Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Brand / Logo */}
        <Link href="/" className="flex items-center space-x-3.5 group shrink-0">
          <div className="flex items-center">
            <Image
              src="/cotafacil-logo.png"
              alt="CotaFácil Painel PJ"
              width={180}
              height={58}
              priority
              className="h-11 sm:h-12 w-auto object-contain transition-transform group-hover:scale-102"
            />
          </div>
          <div className="hidden sm:block border-l border-slate-200 dark:border-slate-800 pl-3.5">
            <span className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white block leading-tight">
              Hub de Apoio <span className="text-blue-600 dark:text-blue-400">Operacional</span>
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold tracking-wide">
              Produtos PJ
            </span>
          </div>
        </Link>

        {/* Smart Search Bar no Topo com Autocomplete Multi-Termos */}
        <div ref={searchContainerRef} className="w-full md:max-w-lg relative">
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="text"
              placeholder="Pesquise por produtos, bancos, taxas ou esteiras PJ..."
              value={search}
              onFocus={() => {
                if (search.trim().length >= 2) setIsOpen(true);
              }}
              onChange={(e) => {
                setSearch(e.target.value);
                setIsOpen(e.target.value.trim().length >= 2);
              }}
              className="w-full pl-4 pr-20 py-2.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-xs sm:text-sm border border-slate-200 dark:border-slate-700 focus:bg-white dark:focus:bg-slate-850 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition shadow-inner"
            />

            {search && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-10 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-full transition"
                title="Limpar pesquisa"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              type="submit"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition shrink-0"
              title="Pesquisar"
            >
              {isSearching ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Search className="w-3.5 h-3.5" />
              )}
            </button>
          </form>

          {/* Dropdown de Resultados Inteligentes em Tempo Real */}
          {isOpen && search.trim().length >= 2 && (
            <div className="absolute left-0 right-0 mt-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden z-50 max-h-[75vh] flex flex-col">
              <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
                <span className="font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>Busca Inteligente:</span>
                  <strong className="text-slate-900 dark:text-white">&quot;{search.trim()}&quot;</strong>
                </span>
                <span className="text-slate-400 font-semibold">
                  {isSearching ? 'Buscando...' : `${totalResults} resultado(s)`}
                </span>
              </div>

              <div className="overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                {!isSearching && totalResults === 0 ? (
                  <div className="p-6 text-center space-y-1">
                    <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                      Nenhum material encontrado para &quot;{search.trim()}&quot;.
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Tente outras palavras-chave ou termos mais gerais (ex: capital de giro, antecipação, banco).
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Lista de Materiais, Manuais e Treinamentos 16:9 */}
                    {results.articles.length > 0 && (
                      <div className="p-2 space-y-1">
                        <div className="px-2 py-1 text-[10px] font-black uppercase tracking-wider text-slate-400">
                          Manuais, Regras & Treinamentos ({results.articles.length})
                        </div>
                        {results.articles.map((art) => {
                          const isReel =
                            art.videoType === 'reel' ||
                            (art.videoUrl?.includes('/shorts/') && art.videoType !== 'training');
                          return (
                            <Link
                              key={art.id}
                              href={`/artigos/${art.id}`}
                              onClick={() => setIsOpen(false)}
                              className="flex items-start justify-between gap-3 p-2.5 rounded-xl hover:bg-blue-50/80 dark:hover:bg-slate-800 transition group"
                            >
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5 flex-wrap mb-1">
                                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/50">
                                    {art.categoryName}
                                  </span>
                                  {art.videoUrl && (
                                    <span
                                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md flex items-center gap-1 ${
                                        isReel
                                          ? 'bg-cyan-50 text-cyan-800 dark:bg-cyan-950/60 dark:text-cyan-300'
                                          : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                                      }`}
                                    >
                                      <Video className="w-2.5 h-2.5" />
                                      <span>{isReel ? 'Reel 9:16' : 'Treinamento 16:9'}</span>
                                    </span>
                                  )}
                                  {art.attachmentsCount > 0 && (
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                                      <FileText className="w-2.5 h-2.5" />
                                      <span>{art.attachmentsCount} PDF</span>
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs font-extrabold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 truncate">
                                  {art.title}
                                </p>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                                  {art.summary}
                                </p>
                              </div>
                              <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 shrink-0 mt-2 transition-transform group-hover:translate-x-0.5" />
                            </Link>
                          );
                        })}
                      </div>
                    )}

                    {/* Lista de Pílulas / Reels */}
                    {results.reels.length > 0 && (
                      <div className="p-2 space-y-1">
                        <div className="px-2 py-1 text-[10px] font-black uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
                          ⚡ Pílulas Rápidas / Reels ({results.reels.length})
                        </div>
                        {results.reels.map((reel) => (
                          <Link
                            key={reel.id}
                            href={`/categorias/treinamentos?reel=${encodeURIComponent(reel.id)}`}
                            onClick={() => setIsOpen(false)}
                            className="flex items-center justify-between gap-3 p-2.5 rounded-xl hover:bg-cyan-50/70 dark:hover:bg-slate-800 transition group"
                          >
                            <div className="min-w-0 flex-1">
                              <span className="text-[10px] font-bold text-cyan-700 dark:text-cyan-400 block truncate">
                                📱 {reel.categoryTag || 'Dica Rápida'}
                              </span>
                              <p className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-blue-600 truncate">
                                {reel.title}
                              </p>
                            </div>
                            <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-cyan-600 shrink-0" />
                          </Link>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Rodapé do Dropdown para Ver Todos na Página */}
              {totalResults > 0 && (
                <button
                  type="button"
                  onClick={() => handleSearchSubmit()}
                  className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold flex items-center justify-center gap-1.5 transition"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Ver todos os resultados na página ({totalResults})</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Sub Navigation Bar com Links Rápidos */}
      <div className="bg-slate-50/80 dark:bg-slate-950/60 border-t border-slate-100 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex space-x-6 overflow-x-auto py-2.5 text-xs font-bold text-slate-600 dark:text-slate-300 scrollbar-none">
          <Link href="/" className="hover:text-blue-600 dark:hover:text-blue-400 transition flex items-center space-x-1.5 whitespace-nowrap shrink-0">
            <Home className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
            <span>Início</span>
          </Link>
          <Link href="/categorias/all" className="hover:text-blue-600 dark:hover:text-blue-400 transition flex items-center space-x-1 whitespace-nowrap shrink-0">
            <Layers className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>Todas as Categorias</span>
          </Link>
          <Link href="/categorias/treinamentos" className="hover:text-blue-600 dark:hover:text-blue-400 transition flex items-center space-x-1.5 whitespace-nowrap shrink-0">
            <Video className="w-3.5 h-3.5 text-rose-500 shrink-0" />
            <span>Treinamentos e Videoaulas</span>
          </Link>
          {navCategories.map((c) => (
            <Link
              key={c.id}
              href={/categorias/}
              className="hover:text-blue-600 dark:hover:text-blue-400 transition flex items-center space-x-1.5 whitespace-nowrap shrink-0"
            >
              <span>{c.name}</span>
            </Link>
          ))}
        </div>
      </div>
    </header>
  );
}
