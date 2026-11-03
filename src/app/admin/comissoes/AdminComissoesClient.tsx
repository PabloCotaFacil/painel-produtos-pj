'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, Percent, Trash2, Edit2, FileText, CheckCircle, AlertCircle } from 'lucide-react';

interface TriggerTier {
  id?: string;
  minVolume: number;
  maxVolume: number | null;
  commissionRate: number;
}

interface InstitutionProduct {
  id: string;
  bankName: string;
  segment: string;
  description: string | null;
  triggerTiers: TriggerTier[];
}

export default function AdminComissoesClient({
  initialProducts,
}: {
  initialProducts: InstitutionProduct[];
}) {
  const router = useRouter();

  const [products, setProducts] = useState<InstitutionProduct[]>(initialProducts);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [bankName, setBankName] = useState('');
  const [segment, setSegment] = useState('Crédito Imobiliário');
  const [description, setDescription] = useState('');
  const [triggerTiers, setTriggerTiers] = useState<TriggerTier[]>([
    { minVolume: 0, maxVolume: 499999, commissionRate: 1.2 },
    { minVolume: 500000, maxVolume: 999999, commissionRate: 1.5 },
    { minVolume: 1000000, maxVolume: null, commissionRate: 2.0 },
  ]);

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const resetForm = () => {
    setEditingId(null);
    setBankName('');
    setSegment('Crédito Imobiliário');
    setDescription('');
    setTriggerTiers([
      { minVolume: 0, maxVolume: 499999, commissionRate: 1.2 },
      { minVolume: 500000, maxVolume: 999999, commissionRate: 1.5 },
      { minVolume: 1000000, maxVolume: null, commissionRate: 2.0 },
    ]);
    setMessage(null);
  };

  const handleEditClick = (prod: InstitutionProduct) => {
    setEditingId(prod.id);
    setBankName(prod.bankName);
    setSegment(prod.segment);
    setDescription(prod.description || '');
    setTriggerTiers(
      prod.triggerTiers.map((t) => ({
        id: t.id,
        minVolume: t.minVolume,
        maxVolume: t.maxVolume,
        commissionRate: t.commissionRate,
      }))
    );
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddTierRow = () => {
    const lastTier = triggerTiers[triggerTiers.length - 1];
    const newMin = lastTier ? (lastTier.maxVolume ? lastTier.maxVolume + 1 : lastTier.minVolume + 500000) : 0;
    setTriggerTiers([...triggerTiers, { minVolume: newMin, maxVolume: null, commissionRate: 1.5 }]);
  };

  const handleRemoveTierRow = (index: number) => {
    if (triggerTiers.length <= 1) return;
    setTriggerTiers(triggerTiers.filter((_, i) => i !== index));
  };

  const handleTierChange = (index: number, field: keyof TriggerTier, value: any) => {
    const updated = [...triggerTiers];
    if (field === 'maxVolume') {
      updated[index].maxVolume = value === '' || value === null ? null : Number(value);
    } else if (field === 'minVolume') {
      updated[index].minVolume = Number(value);
    } else if (field === 'commissionRate') {
      updated[index].commissionRate = Number(value);
    }
    setTriggerTiers(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    const payload = { bankName, segment, description, triggerTiers };

    try {
      const url = editingId ? `/api/commissions/${editingId}` : '/api/commissions';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage({
          type: 'success',
          text: editingId ? 'Gatilho de comissão atualizado com sucesso!' : 'Novo banco e gatilhos cadastrados!',
        });
        resetForm();
        router.refresh();
      } else {
        setMessage({ type: 'error', text: data.error || 'Erro ao salvar gatilhos' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Erro de conexão com o servidor' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja excluir esta tabela de comissões/gatilhos?')) return;

    try {
      const res = await fetch(`/api/commissions/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setProducts((prev) => prev.filter((p) => p.id !== id));
        setMessage({ type: 'success', text: 'Produto de comissão removido' });
        router.refresh();
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Erro ao remover' });
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  return (
    <div className="space-y-8">
      {/* Top Admin Header */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Percent className="w-5 h-5 text-emerald-400" />
            <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider">Gestão de Comissões & Gatilhos</span>
          </div>
          <h1 className="text-2xl font-black mt-1">Configurar Regras de Gatilhos Mensais</h1>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            href="/admin/materiais"
            className="flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition"
          >
            <FileText className="w-4 h-4" />
            <span>Gerenciar PDFs & Materiais</span>
          </Link>
        </div>
      </div>

      {/* Notification Banner */}
      {message && (
        <div
          className={`p-4 rounded-2xl text-sm font-bold flex items-center gap-2 ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
              : 'bg-rose-50 text-rose-800 border border-rose-300'
          }`}
        >
          {message.type === 'success' ? <CheckCircle className="w-5 h-5 text-emerald-600" /> : <AlertCircle className="w-5 h-5 text-rose-600" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Create/Edit Form */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 card-shadow space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Plus className="w-5 h-5 text-emerald-600" />
            {editingId ? 'Editar Regra de Banco / Gatilhos' : 'Cadastrar Novo Banco / Tabela de Gatilhos'}
          </h2>
          {editingId && (
            <button onClick={resetForm} className="text-xs font-bold text-slate-500 hover:underline">
              Cancelar Edição
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-extrabold text-slate-700 block mb-1">INSTITUIÇÃO / BANCO</label>
              <input
                type="text"
                placeholder="ex: Itaú, Caixa Econômica, Banco do Brasil"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="text-xs font-extrabold text-slate-700 block mb-1">SEGMENTO</label>
              <select
                value={segment}
                onChange={(e) => setSegment(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="Crédito Imobiliário">Crédito Imobiliário</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-extrabold text-slate-700 block mb-1">DESCRICAO / OBSERVAÇÕES</label>
              <input
                type="text"
                placeholder="ex: Gatilho progressivo por faturamento mensal"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-900 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Trigger Tiers Builder */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                  Faixas de Gatilho por Faturamento Mensal
                </h3>
                <p className="text-[11px] text-slate-500">
                  Defina o volume inicial, volume final (deixe em branco para ilimitado +) e o % de comissão.
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddTierRow}
                className="inline-flex items-center space-x-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold px-3 py-1.5 rounded-lg transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Adicionar Faixa</span>
              </button>
            </div>

            <div className="space-y-3">
              {triggerTiers.map((tier, idx) => (
                <div key={idx} className="flex flex-col sm:flex-row items-center gap-3 bg-white p-3 rounded-xl border border-slate-200">
                  <div className="flex-1 w-full">
                    <label className="text-[10px] font-extrabold text-slate-500 block">VOL. MÍNIMO (R$)</label>
                    <input
                      type="number"
                      step={10000}
                      value={tier.minVolume}
                      onChange={(e) => handleTierChange(idx, 'minVolume', e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold"
                      required
                    />
                  </div>

                  <div className="flex-1 w-full">
                    <label className="text-[10px] font-extrabold text-slate-500 block">VOL. MÁXIMO (Vazio = Ilimitado +)</label>
                    <input
                      type="number"
                      step={10000}
                      placeholder="Sem limite (+)"
                      value={tier.maxVolume === null ? '' : tier.maxVolume}
                      onChange={(e) => handleTierChange(idx, 'maxVolume', e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold"
                    />
                  </div>

                  <div className="w-full sm:w-32">
                    <label className="text-[10px] font-extrabold text-emerald-700 block">TAXA COMISSÃO (%)</label>
                    <input
                      type="number"
                      step={0.1}
                      placeholder="ex: 1.5"
                      value={tier.commissionRate}
                      onChange={(e) => handleTierChange(idx, 'commissionRate', e.target.value)}
                      className="w-full px-3 py-1.5 bg-emerald-50 border border-emerald-300 rounded-lg text-xs font-black text-emerald-900"
                      required
                    />
                  </div>

                  {triggerTiers.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveTierRow(idx)}
                      className="text-rose-600 hover:text-rose-800 font-bold p-1 self-end sm:self-center"
                      title="Remover Faixa"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs transition shadow-lg"
            >
              {saving ? 'Salvando...' : editingId ? 'Atualizar Tabela de Gatilhos' : 'Cadastrar Tabela de Gatilhos'}
            </button>
          </div>
        </form>
      </div>

      {/* Product & Trigger Tiers List */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 card-shadow space-y-6">
        <h2 className="text-xl font-black text-slate-900">Tabelas de Comissão Cadastradas</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {products.map((prod) => (
            <div key={prod.id} className="bg-slate-50 rounded-2xl p-5 border border-slate-200 relative flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 uppercase">
                    {prod.segment}
                  </span>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleEditClick(prod)}
                      className="p-1.5 bg-white hover:bg-slate-200 text-slate-700 rounded-lg border border-slate-200 transition"
                      title="Editar"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(prod.id)}
                      className="p-1.5 bg-white hover:bg-rose-100 text-rose-700 rounded-lg border border-slate-200 transition"
                      title="Excluir"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h3 className="text-lg font-black text-slate-900">{prod.bankName}</h3>
                <p className="text-xs text-slate-500 mb-4">{prod.description || 'Gatilho progressivo'}</p>

                <div className="space-y-1.5">
                  {prod.triggerTiers.map((t) => (
                    <div key={t.id} className="bg-white p-2.5 rounded-xl border border-slate-200 text-xs flex justify-between font-bold">
                      <span className="text-slate-700">
                        {formatCurrency(t.minVolume)} {t.maxVolume ? `até ${formatCurrency(t.maxVolume)}` : '+'}
                      </span>
                      <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-black">
                        {t.commissionRate}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
