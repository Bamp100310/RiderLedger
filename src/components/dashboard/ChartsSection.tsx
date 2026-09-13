import React, { useState } from 'react';
import { useAppData } from '../../context/AppDataContext';
import { formatCurrency, formatCurrencyCompact } from '../../lib/calculations';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { BarChart3, PieChart as PieIcon } from 'lucide-react';

const EXPENSE_COLORS = ['#f59e0b', '#f97316', '#06b6d4', '#ec4899', '#8b5cf6'];
const INCOME_COLORS = ['#10b981', '#06b6d4', '#f59e0b', '#3b82f6', '#8b5cf6'];

export const ChartsSection: React.FC = () => {
  const { filteredTransactions } = useAppData();
  const [activeChartTab, setActiveChartTab] = useState<'comparativo' | 'gastos' | 'ingresos'>('comparativo');

  // 1. Preparar datos para Gráfico de Barras (Ingresos vs Gastos por Fecha)
  const barDataMap = new Map<string, { fecha: string; label: string; Ingresos: number; Gastos: number }>();

  // Ordenar transacciones por fecha ascendente para la gráfica
  const sortedTx = [...filteredTransactions].sort((a, b) => a.fecha.localeCompare(b.fecha));

  for (const t of sortedTx) {
    const fecha = t.fecha;
    if (!barDataMap.has(fecha)) {
      const parts = fecha.split('-');
      const label = parts.length === 3 ? `${parts[2]}/${parts[1]}` : fecha;
      barDataMap.set(fecha, { fecha, label, Ingresos: 0, Gastos: 0 });
    }
    const item = barDataMap.get(fecha)!;
    const monto = Number(t.monto) || 0;
    if (t.tipo === 'INGRESO') {
      item.Ingresos += monto;
    } else if (t.tipo === 'GASTO') {
      item.Gastos += monto;
    }
  }

  const barChartData = Array.from(barDataMap.values()).slice(-10); // últimos 10 días para buena legibilidad móvil

  // 2. Preparar datos para Gráfico de Dona: Distribución de Gastos
  const expenseMap = new Map<string, number>();
  for (const t of filteredTransactions) {
    if (t.tipo === 'GASTO') {
      const cat = t.categoria === 'COMBUSTIBLE'
        ? 'Gasolina'
        : (t.categoria === 'HONORARIOS_ACOMPANANTE' || t.subcategoria?.toLowerCase().includes('jhony') || t.subcategoria?.toLowerCase().includes('acompañante'))
        ? 'Acompañante (Jhony)'
        : t.categoria === 'ALIMENTACION'
        ? 'Alimentación'
        : t.categoria === 'MANTENIMIENTO_MOTO'
        ? 'Mantenimiento'
        : 'Otros Gastos';
      expenseMap.set(cat, (expenseMap.get(cat) || 0) + Number(t.monto));
    }
  }
  const expensePieData = Array.from(expenseMap.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  // 3. Preparar datos para Gráfico de Dona: Distribución de Ingresos
  const incomeMap = new Map<string, number>();
  for (const t of filteredTransactions) {
    if (t.tipo === 'INGRESO') {
      const source = t.subcategoria || t.categoria;
      incomeMap.set(source, (incomeMap.get(source) || 0) + Number(t.monto));
    }
  }
  const incomePieData = Array.from(incomeMap.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 border border-white/20 p-2.5 rounded-xl shadow-xl text-xs space-y-1">
          <p className="font-bold text-white border-b border-white/10 pb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={`item-${index}`} style={{ color: entry.color }} className="font-semibold">
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-slate-900 border border-white/20 p-2.5 rounded-xl shadow-xl text-xs">
          <p className="font-bold text-white">{data.name}</p>
          <p className="text-emerald-400 font-extrabold">{formatCurrency(data.value)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-slate-900/80 border border-white/10 rounded-3xl p-4 sm:p-5 space-y-4">
      {/* Selector de tipo de gráfica */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
          <BarChart3 className="w-4 h-4 text-emerald-400" />
          Análisis Visual
        </h3>
        <div className="flex gap-1 p-0.5 bg-slate-950 rounded-xl border border-white/10">
          <button
            onClick={() => setActiveChartTab('comparativo')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
              activeChartTab === 'comparativo'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Ingresos vs Gastos
          </button>
          <button
            onClick={() => setActiveChartTab('gastos')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
              activeChartTab === 'gastos'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Gastos
          </button>
          <button
            onClick={() => setActiveChartTab('ingresos')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
              activeChartTab === 'ingresos'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Ingresos
          </button>
        </div>
      </div>

      {/* 1. Gráfico de Barras Comparativo */}
      {activeChartTab === 'comparativo' && (
        <div className="h-64 w-full">
          {barChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barChartData} margin={{ top: 10, right: 5, left: -20, bottom: 0 }}>
                <XAxis dataKey="label" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="#64748b"
                  fontSize={10}
                  tickFormatter={val => formatCurrencyCompact(val)}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  verticalAlign="top"
                  align="right"
                  iconType="circle"
                  wrapperStyle={{ fontSize: '11px', paddingBottom: '10px' }}
                />
                <Bar dataKey="Ingresos" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={28} />
                <Bar dataKey="Gastos" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-slate-500">
              Sin datos para este rango
            </div>
          )}
        </div>
      )}

      {/* 2. Gráfico de Dona: Gastos */}
      {activeChartTab === 'gastos' && (
        <div className="h-64 w-full">
          {expensePieData.length > 0 ? (
            <div className="flex flex-col sm:flex-row items-center justify-center h-full gap-4">
              <div className="w-48 h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={expensePieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={75}
                      paddingAngle={4}
                    >
                      {expensePieData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={EXPENSE_COLORS[index % EXPENSE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomPieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap sm:flex-col gap-2 max-w-xs text-xs">
                {expensePieData.map((entry, idx) => (
                  <div key={entry.name} className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: EXPENSE_COLORS[idx % EXPENSE_COLORS.length] }}
                    />
                    <span className="text-slate-300 truncate">{entry.name}:</span>
                    <span className="font-bold text-white">{formatCurrency(entry.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-slate-500">
              No hay gastos en este periodo
            </div>
          )}
        </div>
      )}

      {/* 3. Gráfico de Dona: Ingresos */}
      {activeChartTab === 'ingresos' && (
        <div className="h-64 w-full">
          {incomePieData.length > 0 ? (
            <div className="flex flex-col sm:flex-row items-center justify-center h-full gap-4">
              <div className="w-48 h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={incomePieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={75}
                      paddingAngle={4}
                    >
                      {incomePieData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={INCOME_COLORS[index % INCOME_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomPieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap sm:flex-col gap-2 max-w-xs text-xs">
                {incomePieData.map((entry, idx) => (
                  <div key={entry.name} className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: INCOME_COLORS[idx % INCOME_COLORS.length] }}
                    />
                    <span className="text-slate-300 truncate">{entry.name}:</span>
                    <span className="font-bold text-white">{formatCurrency(entry.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-slate-500">
              No hay ingresos en este periodo
            </div>
          )}
        </div>
      )}
    </div>
  );
};
