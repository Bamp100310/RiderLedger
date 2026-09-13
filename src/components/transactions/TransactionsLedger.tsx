import React, { useState, useMemo } from 'react';
import { useAppData } from '../../context/AppDataContext';
import { formatCurrency, isDateInRange, getLocalDateString } from '../../lib/calculations';
import { Transaction, TransactionType } from '../../types';
import { EditTransactionModal } from './EditTransactionModal';
import {
  ReceiptText,
  Search,
  TrendingUp,
  TrendingDown,
  Wallet,
  Trash2,
  Plus,
  Cloud,
  CloudOff,
  Scale,
  Pencil,
  Copy,
  ArrowUpDown,
  Calendar
} from 'lucide-react';

export const TransactionsLedger: React.FC = () => {
  const { transactions, addTransaction, deleteTransaction, openDrawer } = useAppData();
  const [selectedType, setSelectedType] = useState<'TODOS' | TransactionType>('TODOS');
  const [dateFilter, setDateFilter] = useState<'todos' | 'hoy' | 'semana' | 'mes'>('todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'fecha_desc' | 'fecha_asc' | 'monto_desc' | 'monto_asc'>('fecha_desc');
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);

  const handleDuplicate = async (tx: Transaction) => {
    try {
      await addTransaction({
        fecha: getLocalDateString(),
        tipo: tx.tipo,
        categoria: tx.categoria,
        subcategoria: tx.subcategoria,
        descripcion: tx.descripcion ? `${tx.descripcion} (copia)` : undefined,
        monto: tx.monto,
        medio_pago: tx.medio_pago
      });
    } catch (err) {
      console.error('Error al duplicar movimiento', err);
    }
  };

  const filtered = useMemo(() => {
    return transactions.filter(t => {
      const matchType = selectedType === 'TODOS' || t.tipo === selectedType;
      const matchDate = dateFilter === 'todos' || isDateInRange(t.fecha, dateFilter as any);
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        t.subcategoria.toLowerCase().includes(q) ||
        t.categoria.toLowerCase().includes(q) ||
        (t.descripcion && t.descripcion.toLowerCase().includes(q)) ||
        t.fecha.includes(q);
      return matchType && matchDate && matchSearch;
    });
  }, [transactions, selectedType, dateFilter, searchQuery]);

  const sortedTransactions = useMemo(() => {
    return [...filtered].sort((a, b) => {
      if (sortBy === 'fecha_desc') {
        const dateCmp = b.fecha.localeCompare(a.fecha);
        return dateCmp !== 0 ? dateCmp : (b.created_at || '').localeCompare(a.created_at || '');
      }
      if (sortBy === 'fecha_asc') {
        const dateCmp = a.fecha.localeCompare(b.fecha);
        return dateCmp !== 0 ? dateCmp : (a.created_at || '').localeCompare(b.created_at || '');
      }
      if (sortBy === 'monto_desc') {
        return Number(b.monto) - Number(a.monto);
      }
      if (sortBy === 'monto_asc') {
        return Number(a.monto) - Number(b.monto);
      }
      return 0;
    });
  }, [filtered, sortBy]);

  // Cálculos de KPI para la cabecera
  const kpis = useMemo(() => {
    let ingresos = 0;
    let gastos = 0;
    let cobrosEfectivo = 0;

    filtered.forEach(t => {
      const m = Number(t.monto) || 0;
      if (t.tipo === 'INGRESO') ingresos += m;
      else if (t.tipo === 'GASTO') gastos += m;
      else if (t.tipo === 'COBRO_EFECTIVO_APP') cobrosEfectivo += m;
    });

    return {
      ingresos,
      gastos,
      cobrosEfectivo,
      neto: ingresos - gastos
    };
  }, [filtered]);

  const handleDelete = (id: string, desc: string) => {
    if (window.confirm(`¿Deseas eliminar "${desc}"?`)) {
      deleteTransaction(id);
    }
  };

  return (
    <div className="space-y-4 pb-20 max-w-7xl mx-auto">
      {/* Header Principal */}
      <div className="app-card p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
        <div>
          <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
            <ReceiptText className="w-5 h-5 text-cyan-500" />
            Libro de Movimientos
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Registro contable completo: crea, edita y audita ingresos, gastos y cobros en efectivo
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => openDrawer('app_income')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-500 text-white text-xs font-bold shadow-md hover:bg-cyan-400 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>+ Ingreso</span>
          </button>
          <button
            onClick={() => openDrawer('quick_expense')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400 hover:bg-rose-500/25 border border-rose-500/30 text-xs font-bold transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>+ Gasto</span>
          </button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Total Ingresos */}
        <div className="app-card rounded-2xl p-3.5 sm:p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] sm:text-[11px] text-slate-400 font-semibold uppercase tracking-wider block truncate">
              Ingresos Totales
            </span>
            <span className="text-sm sm:text-lg font-black text-emerald-600 dark:text-emerald-400 truncate block">
              +{formatCurrency(kpis.ingresos)}
            </span>
          </div>
        </div>

        {/* Total Gastos */}
        <div className="app-card rounded-2xl p-3.5 sm:p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center flex-shrink-0">
            <TrendingDown className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] sm:text-[11px] text-slate-400 font-semibold uppercase tracking-wider block truncate">
              Gastos Operativos
            </span>
            <span className="text-sm sm:text-lg font-black text-rose-600 dark:text-rose-400 truncate block">
              -{formatCurrency(kpis.gastos)}
            </span>
          </div>
        </div>

        {/* Cobros Efectivo en Mano */}
        <div className="app-card rounded-2xl p-3.5 sm:p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0">
            <Wallet className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] sm:text-[11px] text-slate-400 font-semibold uppercase tracking-wider block truncate">
              Cobrado en Mano
            </span>
            <span className="text-sm sm:text-lg font-black text-amber-600 dark:text-amber-400 truncate block">
              {formatCurrency(kpis.cobrosEfectivo)}
            </span>
          </div>
        </div>

        {/* Ganancia Limpia en Filtro */}
        <div className="app-card rounded-2xl p-3.5 sm:p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 flex items-center justify-center flex-shrink-0">
            <Scale className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] sm:text-[11px] text-slate-400 font-semibold uppercase tracking-wider block truncate">
              Margen Neto
            </span>
            <span className={`text-sm sm:text-lg font-black truncate block ${kpis.neto >= 0 ? 'text-cyan-600 dark:text-cyan-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {formatCurrency(kpis.neto)}
            </span>
          </div>
        </div>
      </div>

      {/* Barra de Búsqueda, Filtros y Ordenamiento */}
      <div className="app-card p-3 sm:p-4 rounded-2xl space-y-3">
        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Buscar por app, concepto, descripción o fecha..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="flex items-center gap-2 justify-between lg:justify-end flex-wrap">
            {/* Filtros de Fecha Rápidos */}
            <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-white/10 text-xs">
              {[
                { id: 'todos', label: 'Todo' },
                { id: 'hoy', label: 'Hoy' },
                { id: 'semana', label: 'Semana' },
                { id: 'mes', label: 'Mes' }
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setDateFilter(f.id as any)}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                    dateFilter === f.id
                      ? 'bg-cyan-500 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Selector de Ordenamiento */}
            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-2.5 py-1.5 flex-shrink-0">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as any)}
                className="bg-transparent text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
              >
                <option value="fecha_desc">Más recientes</option>
                <option value="fecha_asc">Más antiguos</option>
                <option value="monto_desc">Mayor monto ($)</option>
                <option value="monto_asc">Menor monto ($)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Píldoras de Tipo */}
        <div className="flex gap-1 overflow-x-auto pb-0.5 pt-1 border-t border-slate-100 dark:border-white/5">
          {[
            { id: 'TODOS', label: `Todos (${transactions.length})` },
            { id: 'INGRESO', label: 'Ingresos' },
            { id: 'GASTO', label: 'Gastos' },
            { id: 'COBRO_EFECTIVO_APP', label: 'Cobros Efectivo' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedType(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                selectedType === tab.id
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-transparent shadow-sm'
                  : 'bg-white dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/5 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Lista de Transacciones en Grid Responsivo (2 columnas en pantallas grandes/ultrawide) */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
        {sortedTransactions.map(t => {
          const isIngreso = t.tipo === 'INGRESO';
          const isGasto = t.tipo === 'GASTO';
          const isCobroApp = t.tipo === 'COBRO_EFECTIVO_APP';

          return (
            <div
              key={t.id}
              className="app-card rounded-2xl p-4 flex items-center justify-between gap-3 shadow-xs hover:border-cyan-500/40 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                {/* Icono de Tipo */}
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
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

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                      {t.subcategoria}
                    </span>
                    <span className="text-[10px] text-slate-400 flex-shrink-0">{t.fecha}</span>
                  </div>

                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                    {t.descripcion || t.categoria}
                  </p>

                  <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                    <span className="text-[9px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border border-slate-200 dark:border-white/5">
                      {t.medio_pago === 'APP'
                        ? '📱 Saldo App'
                        : t.medio_pago === 'BRE_B'
                        ? '⚡ Bre-B'
                        : '💵 Efectivo'}
                    </span>
                    {isCobroApp && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-300 font-bold border border-amber-500/30">
                        Deuda App
                      </span>
                    )}
                    <span className="text-[9px] text-slate-400">
                      {isCobroApp ? 'En mano' : isIngreso ? 'Ingreso' : 'Egreso'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Monto y Acciones (Editar + Eliminar + Sync) */}
              <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                <div className="text-right">
                  <p
                    className={`text-sm sm:text-base font-black ${
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
                </div>

                <div className="flex items-center gap-0.5 sm:gap-1">
                  {t.sync_status === 'pending' ? (
                    <span title="Pendiente de sincronizar"><CloudOff className="w-3.5 h-3.5 text-amber-500" /></span>
                  ) : (
                    <span title="Sincronizado"><Cloud className="w-3.5 h-3.5 text-emerald-500/60" /></span>
                  )}
                  
                  {/* Botón Editar Movimiento */}
                  <button
                    onClick={() => setEditingTx(t)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-500 hover:bg-cyan-500/10 transition-colors"
                    title="Editar movimiento"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>

                  {/* Botón Duplicar Movimiento */}
                  <button
                    onClick={() => handleDuplicate(t)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-500 hover:bg-indigo-500/10 transition-colors"
                    title="Duplicar para hoy"
                  >
                    <Copy className="w-4 h-4" />
                  </button>

                  {/* Botón Eliminar Movimiento */}
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

        {sortedTransactions.length === 0 && (
          <div className="col-span-1 xl:col-span-2 text-center py-12 app-card rounded-2xl text-slate-400 text-xs">
            No se encontraron movimientos con los filtros actuales.
          </div>
        )}
      </div>

      {/* Modal para Editar Movimiento */}
      <EditTransactionModal
        transaction={editingTx}
        isOpen={Boolean(editingTx)}
        onClose={() => setEditingTx(null)}
      />
    </div>
  );
};
