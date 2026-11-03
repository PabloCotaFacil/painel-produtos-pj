'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Layers, Briefcase, Video, FolderOpen } from 'lucide-react';

interface CategoryCardsProps {
  activeSlug?: string;
  floating?: boolean;
}

interface DynamicCategory {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  icon?: string | null;
}

export default function CategoryCards({ activeSlug, floating = false }: CategoryCardsProps) {
  const [dbCategories, setDbCategories] = useState<DynamicCategory[]>([]);

  useEffect(() => {
    fetch('/api/categories')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setDbCategories(data);
        }
      })
      .catch(console.error);
  }, []);

  // Card fixo "Todas as Categorias" + Categorias do banco (editáveis pelo admin)
  const allCard = {
    name: 'TODAS AS CATEGORIAS',
    slug: 'all',
    description: 'Acesse todas as esteiras, produtos e manuais PJ disponíveis.',
    icon: Layers,
    isDark: true,
  };

  const dynamicCards = (dbCategories.length > 0
    ? dbCategories
    : [
        {
          name: 'PRODUTOS PJ',
          slug: 'produtos-pj',
          description: 'Capital de Giro, Antecipação, Financiamento PJ e esteiras bancárias.',
          icon: 'briefcase',
        },
        {
          name: 'TREINAMENTOS E VIDEOAULAS',
          slug: 'treinamentos',
          description: 'Vídeos de treinamento, videoaulas e tutoriais operacionais PJ.',
          icon: 'video',
        },
      ]
  ).map((cat) => ({
    name: cat.name.toUpperCase(),
    slug: cat.slug,
    description: cat.description || 'Consulte regras e procedimentos operacionais.',
    icon:
      cat.slug === 'treinamentos'
        ? Video
        : cat.slug === 'produtos-pj'
        ? Briefcase
        : FolderOpen,
    isDark: false,
  }));

  const cards = [allCard, ...dynamicCards];

  return (
    <section className={floating ? '-mt-4 sm:-mt-6 relative z-20 mb-8' : 'py-4'}>
      {/* Grid responsivo de cards conforme categorias entram ou saem */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((cat) => {
          const Icon = cat.icon;
          const isSelected = activeSlug === cat.slug || (!activeSlug && cat.slug === 'all');
          const targetUrl = cat.slug === 'all' ? '/' : `/categorias/${cat.slug}`;

          return (
            <Link
              key={cat.slug}
              href={targetUrl}
              className={`p-6 rounded-3xl transition-all duration-300 flex flex-col justify-between min-h-[200px] hover:-translate-y-1.5 ${
                cat.isDark
                  ? 'bg-slate-900 text-white shadow-xl hover:shadow-2xl hover:bg-slate-950 border border-slate-800'
                  : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border border-slate-100 dark:border-slate-800 card-float hover:border-blue-300 dark:hover:border-blue-500 hover:shadow-xl'
              } ${
                isSelected
                  ? 'ring-4 ring-cyan-400/60 scale-[1.02]'
                  : ''
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                      cat.isDark
                        ? 'bg-white/10 text-cyan-300'
                        : 'bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-cyan-400'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  {isSelected && (
                    <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-cyan-400 text-slate-950 uppercase tracking-wide shrink-0">
                      Ativo
                    </span>
                  )}
                </div>

                <div>
                  <h3
                    className={`font-black text-xs sm:text-sm tracking-tight leading-snug uppercase ${
                      cat.isDark ? 'text-white' : 'text-slate-900 dark:text-white'
                    }`}
                  >
                    {cat.name}
                  </h3>
                  <p
                    className={`text-xs mt-1.5 line-clamp-2 leading-relaxed ${
                      cat.isDark ? 'text-slate-300' : 'text-slate-500 dark:text-slate-300'
                    }`}
                  >
                    {cat.description}
                  </p>
                </div>
              </div>

              <div
                className={`pt-3.5 flex items-center text-xs font-bold gap-1 transition ${
                  cat.isDark
                    ? 'text-cyan-300 hover:text-cyan-200'
                    : 'text-blue-600 dark:text-cyan-400 hover:text-blue-800 dark:hover:text-cyan-300'
                }`}
              >
                <span>Acessar</span>
                <span className="text-sm">→</span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
