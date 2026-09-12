import React, { useState, useMemo } from 'react';
import { useAppData } from '../../context/AppDataContext';
import { formatCurrency } from '../../lib/calculations';
import { TransactionType } from '../../types';
import {
  ReceiptText,
  Search,
  TrendingUp,
  TrendingDown,
  Wallet,
  Trash2,
  Plus,
  Cloud,
  CloudOff
} from 'lucide-react';

export const TransactionsLedger: React.FC = () => {
  const { transactions, deleteTransaction, openDrawer } = useAppData();
  const [selectedType, setSelectedType] = useState<'TODOS' | TransactionType>('TODOS');
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = useMemo(() => {
    return transactions.filter(t => {
      const matchType = selectedType === 'TODOS' || t.tipo === selectedType;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        t.subcategoria.toLowerCase().includes(q) ||
        t.categoria.toLowerCase().includes(q) ||
        (t.descripcion && t.descripcion.toLowerCase().includes(q)) ||
        t.fecha.includes(q);
      return matchType && matchSearch;
    });
  }, [transactions, selectedType, searchQuery]);

  const handleDelete = (id: string, desc: string) => {
    if (window.confirm(`¿Deseas eliminar "${desc}"?`)) {
      deleteTransaction(id);
    }
  };

  return (
    <div className="space-y-4 pb-20 max-w-3xl mx-auto">
      {/* Header */}
      <div className="app-card p-5 rounded-2xl flex items-center justify-between">
        <div>
          <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
            <ReceiptText className="w-5 h-5 text-cyan-500" />
            Libro de Movimientos
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Registro detallado de ingresos, gastos y cobros en efectivo
          </p>
        </div>
        <button
          onClick={() => openDrawer('app_income')}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-500 text-white text-xs font-bold shadow-md hover:bg-cyan-400 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo</span>
        </button>
      </div>

      {/* Barra de Búsqueda y Filtros */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Buscar por app, gasto o fecha..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-white/10 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* Píldoras de Tipo */}
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {[
            { id: 'TODOS', label: 'Todos' },
            { id: 'INGRESO', label: 'Ingresos' },
            { id: 'GASTO', label: 'Gastos' },
            { id: 'COBRO_EFECTIVO_APP', label: 'Cobros Efectivo' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedType(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                selectedType === tab.id
                  ? 'bg-cyan-500 text-white border-cyan-500 shadow-sm'
                  : 'bg-white dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/5 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Lista de Transacciones */}
      <div className="space-y-2">
        {filtered.map(t => {
          const isIngreso = t.tipo === 'INGRESO';
          const isGasto = t.tipo === 'GASTO';
          const isCobroApp = t.tipo === 'COBRO_EFECTIVO_APP';

          return (
            <div
              key={t.id}
              className="app-card rounded-2xl p-3.5 flex items-center justify-between gap-3 shadow-sm"
            >
              <div className="flex items-center gap-3 min-w-0">
                {/* Icono de Tipo */}
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    isIngreso
                      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                      : isGasto
                      ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                      : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                  }`}
                >
                  {isIngreso && <TrendingUp className="w-5 h-5" />}
                  {isGasto && <TrendingDown className="w-5 h-5" />}
                  {isCobroApp && <Wallet className="w-5 h-5" />}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {t.subcategoria}
                    </span>
                    <span className="text-[10px] text-slate-400">{t.fecha}</span>
                  </div>

                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                    {t.descripcion || t.categoria}
                  </p>

                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border border-slate-200 dark:border-white/5">
                      {t.medio_pago === 'APP'
                        ? '📱 Saldo App'
                        : t.medio_pago === 'BRE_B'
                        ? '⚡ Bre-B'
                        : '💵 Efectivo'}
                    </span>
                    {isCobroApp && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-300 font-bold border border-amber-500/30">
                        Deuda App
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Monto y Acciones */}
              <div className="flex items-center gap-3 flex-shrink-0">
                <div className="text-right">
                  <p
                    className={`text-sm font-black ${
                      isIngreso
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : isGasto
                        ? 'text-rose-600 dark:text-rose-400'
                        : 'text-amber-600 dark:text-amber-400'
                    }`}
                  >
                    {isGasto ? '-' : '+'}
                    {formatCurrency(t.monto)}
                  </p>
                  <span className="text-[10px] text-slate-400">
                    {isCobroApp ? 'En mano' : isIngreso ? 'Ingreso' : 'Egreso'}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  {t.sync_status === 'pending' ? (
                    <span title="Pendiente de sincronizar"><CloudOff className="w-3.5 h-3.5 text-amber-500" /></span>
                  ) : (
                    <span title="Sincronizado"><Cloud className="w-3.5 h-3.5 text-emerald-500/60" /></span>
                  )}
                  <button
                    onClick={() => handleDelete(t.id, t.descripcion || t.subcategoria)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                    title="Eliminar movimiento"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="text-center py-10 app-card rounded-2xl text-slate-400 text-xs">
            No se encontraron movimientos con los filtros actuales.
          </div>
        )}
      </div>
    </div>
  );
};
