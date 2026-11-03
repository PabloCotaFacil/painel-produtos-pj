'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  FolderPlus,
  Edit2,
  Trash2,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Layers,
  ArrowRight,
  RefreshCw,
  FolderOpen,
} from 'lucide-react';

export interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  icon?: string | null;
  _count?: {
    articles?: number;
  };
}

interface AdminCategoriesManagerProps {
  categories: CategoryItem[];
  onCategoriesChanged: () => void;
}

export default function AdminCategoriesManager({
  categories,
  onCategoriesChanged,
}: AdminCategoriesManagerProps) {
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const resetForm = () => {
    setEditingCatId(null);
    setName('');
    setSlug('');
    setDescription('');
  };

  const handleStartEdit = (cat: CategoryItem) => {
    setEditingCatId(cat.id);
    setName(cat.name);
    setSlug(cat.slug);
    setDescription(cat.description || '');
    setMessage(null);
    window.scrollTo({ top: 200, behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setMessage({ type: 'error', text: 'Informe o nome da categoria.' });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const url = editingCatId ? `/api/categories/${editingCatId}` : '/api/categories';
      const method = editingCatId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          slug: slug.trim() || undefined,
          description: description.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao salvar categoria');
      }

      setMessage({
        type: 'success',
        text: editingCatId
          ? `Categoria "${name}" atualizada com sucesso!`
          : `Nova categoria "${name}" criada com sucesso!`,
      });

      resetForm();
      onCategoriesChanged();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Erro ao processar requisição.' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (cat: CategoryItem) => {
    const confirmDelete = window.confirm(
      `Tem certeza que deseja excluir a categoria "${cat.name}"?\n(Não poderá ser desfeita)`
    );
    if (!confirmDelete) return;

    setDeletingId(cat.id);
    setMessage(null);

    try {
      const res = await fetch(`/api/categories/${cat.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao excluir categoria');
      }

      setMessage({
        type: 'success',
        text: `Categoria "${cat.name}" excluída com sucesso!`,
      });

      if (editingCatId === cat.id) {
        resetForm();
      }

      onCategoriesChanged();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Erro ao excluir categoria.' });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Notificação */}
      {message && (
        <div
          className={`p-4 rounded-2xl text-sm font-bold flex items-center gap-2 ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
              : 'bg-rose-50 text-rose-800 border border-rose-300'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Formulário de Criação/Edição */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 card-shadow space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-2">
          <div>
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <FolderPlus className="w-5 h-5 text-blue-700" />
              <span>{editingCatId ? 'Editar Categoria' : 'Criar Nova Categoria de Produtos PJ'}</span>
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Adicione novas esteiras ou produtos para manter o sistema atualizado conforme produtos entram ou saem.
            </p>
          </div>
          {editingCatId && (
            <button
              type="button"
              onClick={resetForm}
              className="text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition self-start sm:self-auto"
            >
              Cancelar Edição
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-extrabold text-slate-700 block mb-1">
                Nome da Categoria / Produto *
              </label>
              <input
                type="text"
                placeholder="Ex: Capital de Giro, Antecipação, Cartões PJ..."
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (!editingCatId) {
                    setSlug(
                      e.target.value
                        .toLowerCase()
                        .normalize('NFD')
                        .replace(/[\u0300-\u036f]/g, '')
                        .replace(/[^a-z0-9]+/g, '-')
                        .replace(/^-+|-+$/g, '')
                    );
                  }
                }}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="text-xs font-extrabold text-slate-700 block mb-1">
                Identificador URL (Slug)
              </label>
              <input
                type="text"
                placeholder="Ex: capital-de-giro"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-600 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Link da categoria: /categorias/{slug || '...'}
              </span>
            </div>
          </div>

          <div>
            <label className="text-xs font-extrabold text-slate-700 block mb-1">
              Descrição / Resumo Operacional
            </label>
            <input
              type="text"
              placeholder="Ex: Regras de faturamento mínimo, bancos parceiros e esteiras de liberação."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-extrabold rounded-xl text-xs transition shadow flex items-center space-x-2"
            >
              <Sparkles className="w-4 h-4 text-cyan-300" />
              <span>{saving ? 'Salvando...' : editingCatId ? 'Atualizar Categoria' : 'Adicionar Categoria'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Lista de Categorias Cadastradas */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 card-shadow space-y-6">
        <div className="border-b border-slate-100 pb-4">
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-700" />
            <span>Categorias Ativas ({categories.length})</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Cada categoria possui sua página própria onde os franqueados acessam materiais, manuais e videoaulas específicos.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="p-5 rounded-2xl border border-slate-200 hover:border-blue-400 transition flex flex-col justify-between gap-4 bg-slate-50/50"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-black shrink-0">
                    <FolderOpen className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 truncate max-w-[140px]">
                    /categorias/{cat.slug}
                  </span>
                </div>
                <h3 className="font-black text-slate-900 text-sm">{cat.name}</h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                  {cat.description || 'Sem descrição cadastrada.'}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-between gap-2">
                <Link
                  href={`/categorias/${cat.slug}`}
                  target="_blank"
                  className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  <span>Abrir</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>

                <div className="flex items-center space-x-1">
                  <button
                    type="button"
                    onClick={() => handleStartEdit(cat)}
                    className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-600 hover:text-blue-700 transition"
                    title="Editar categoria"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(cat)}
                    disabled={deletingId === cat.id}
                    className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition"
                    title="Excluir categoria"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
