import React, { useState, useMemo } from 'react';
import { useAppData } from '../../context/AppDataContext';
import {
  formatCurrency,
  formatCurrencyCompact,
  getPeriodFinancialChartData,
  parseLocalDate,
  getLocalDateString
} from '../../lib/calculations';
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
  Cell,
  CartesianGrid
} from 'recharts';
import { BarChart3, PieChart as PieIcon, Layers, Calendar, Activity } from 'lucide-react';

const EXPENSE_COLORS: Record<string, string> = {
  'Gasolina': '#f59e0b',
  'Acompañante (Jhony)': '#6366f1',
  'Honorarios Jhony': '#6366f1',
  'Alimentación': '#ec4899',
  'Mantenimiento': '#8b5cf6',
  'Cuota Crédito': '#06b6d4',
  'Otros Gastos': '#64748b'
};

const PIE_PALETTE = ['#f59e0b', '#6366f1', '#ec4899', '#8b5cf6', '#06b6d4', '#10b981', '#f43f5e', '#64748b'];

export const ChartsSection: React.FC = () => {
  const { filteredTransactions, filter } = useAppData();
  const [activeChartTab, setActiveChartTab] = useState<'comparativo' | 'apilado' | 'gastos' | 'ingresos'>('comparativo');
  const [historicalGranularity, setHistoricalGranularity] = useState<'dia' | 'semana' | 'mes'>('mes');

  // Obtener datos del período estricto utilizando la fecha focal referenceDate
  const chartData = useMemo(() => {
    const refDate = parseLocalDate(filter.referenceDate || getLocalDateString());
    return getPeriodFinancialChartData(filteredTransactions, filter.range, historicalGranularity, refDate);
  }, [filteredTransactions, filter.range, filter.referenceDate, historicalGranularity]);

  const hasActivity = useMemo(() => {
    return chartData.some(d => !d.sinActividad && (d.Ingresos > 0 || d.Gastos > 0));
  }, [chartData]);

  // Firma reactiva para forzar a Recharts a repintar el SVG sin conservar geometrías previas en caché
  const dataSignature = useMemo(() => {
    const txLen = filteredTransactions.length;
    const sum = filteredTransactions.reduce((acc, t) => acc + (Number(t.monto) || 0), 0);
    const lastTime = filteredTransactions[0]?.created_at || '';
    return `${filter.range}_${filter.referenceDate}_${txLen}_${sum}_${lastTime}`;
  }, [filteredTransactions, filter.range, filter.referenceDate]);

  // Donut: Distribución de Gastos
  const expensePieData = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of filteredTransactions) {
      if (t.tipo === 'GASTO') {
        let cat = 'Otros Gastos';
        if (t.categoria === 'COMBUSTIBLE') cat = 'Gasolina';
        else if (
          t.categoria === 'HONORARIOS_ACOMPANANTE' ||
          (t.subcategoria && (t.subcategoria.toLowerCase().includes('acompañante') || t.subcategoria.toLowerCase().includes('jhony')))
        ) cat = 'Acompañante (Jhony)';
        else if (t.categoria === 'ALIMENTACION') cat = 'Alimentación';
        else if (t.categoria === 'MANTENIMIENTO_MOTO') cat = 'Mantenimiento';
        else if (t.categoria === 'CUOTA_CREDITO') cat = 'Cuota Crédito';

        map.set(cat, (map.get(cat) || 0) + (Number(t.monto) || 0));
      }
    }
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredTransactions]);

  // Donut: Distribución de Ingresos por Fuente / App
  const incomePieData = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of filteredTransactions) {
      if (t.tipo === 'INGRESO') {
        const source = t.subcategoria || (t.categoria === 'DOMICILIOS' ? 'Domicilios' : t.categoria === 'PASAJEROS' ? 'Pasajeros' : 'Otros Ingresos');
        map.set(source, (map.get(source) || 0) + (Number(t.monto) || 0));
      }
    }
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredTransactions]);

  const CustomBarTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataItem = payload[0]?.payload;
      return (
        <div className="bg-slate-900 border border-white/20 p-3 rounded-2xl shadow-2xl text-xs space-y-1.5 min-w-[170px]">
          <div className="border-b border-white/10 pb-1 flex items-center justify-between">
            <span className="font-bold text-white">{dataItem?.periodo || label}</span>
            {dataItem?.sinActividad && (
              <span className="text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">Sin turnos</span>
            )}
          </div>
          {payload.map((entry: any, index: number) => (
            <div key={`item-${index}`} className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1 text-slate-300">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                {entry.name}:
              </span>
              <span className="font-extrabold text-white">{formatCurrency(entry.value)}</span>
            </div>
          ))}
          {dataItem && (
            <div className="border-t border-white/10 pt-1 flex items-center justify-between font-bold">
              <span className="text-slate-400">Superávit:</span>
              <span className={dataItem.Superavit >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                {formatCurrency(dataItem.Superavit)}
              </span>
            </div>
          )}
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
      {/* Header y Selectores */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <BarChart3 className="w-4 h-4 text-emerald-400" />
            Evolución y Rendimiento Visual
          </h3>
          <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            En vivo
          </span>
          {filter.range === 'semana' && (
            <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full font-bold">
              Lun → Dom
            </span>
          )}
          {filter.range === 'mes' && (
            <span className="text-[10px] bg-sky-500/10 text-sky-400 px-2 py-0.5 rounded-full font-bold">
              Mes Completo
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Selector de Granularidad Histórica si el filtro es histórico */}
          {filter.range === 'historico' && (
            <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-xl border border-white/10 text-[11px]">
              <span className="text-slate-500 px-1.5 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
              </span>
              <button
                type="button"
                onClick={() => setHistoricalGranularity('dia')}
                className={`px-2 py-1 rounded-lg font-bold transition-all ${
                  historicalGranularity === 'dia' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                Día
              </button>
              <button
                type="button"
                onClick={() => setHistoricalGranularity('semana')}
                className={`px-2 py-1 rounded-lg font-bold transition-all ${
                  historicalGranularity === 'semana' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                Semana
              </button>
              <button
                type="button"
                onClick={() => setHistoricalGranularity('mes')}
                className={`px-2 py-1 rounded-lg font-bold transition-all ${
                  historicalGranularity === 'mes' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                Mes
              </button>
            </div>
          )}

          {/* Selector de pestañas de gráfico */}
          <div className="flex gap-1 p-0.5 bg-slate-950 rounded-xl border border-white/10">
            <button
              onClick={() => setActiveChartTab('comparativo')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                activeChartTab === 'comparativo'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Comparativo
            </button>
            <button
              onClick={() => setActiveChartTab('apilado')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                activeChartTab === 'apilado'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className="hidden sm:inline">Desglose </span>Apilado
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
      </div>

      {/* 1. Gráfico de Barras Comparativo (Ingresos vs Gastos) */}
      {activeChartTab === 'comparativo' && (
        <div className="h-64 w-full">
          {hasActivity ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart key={`bar-comp-${dataSignature}`} data={chartData} margin={{ top: 10, right: 5, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                <XAxis dataKey="periodo" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="#64748b"
                  fontSize={10}
                  tickFormatter={val => formatCurrencyCompact(val)}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip content={<CustomBarTooltip />} />
                <Legend
                  verticalAlign="top"
                  align="right"
                  iconType="circle"
                  wrapperStyle={{ fontSize: '11px', paddingBottom: '10px' }}
                />
                <Bar dataKey="Ingresos" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={30} isAnimationActive={false} />
                <Bar dataKey="Gastos" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={30} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-xs text-slate-500 gap-1.5 p-6 text-center">
              <BarChart3 className="w-8 h-8 text-slate-600 stroke-1" />
              <p className="font-semibold text-slate-400">Sin movimientos financieros en este período</p>
              <p className="text-[11px] text-slate-500">Registra tus entregas, viajes o gastos de ruta para visualizar el comparativo.</p>
            </div>
          )}
        </div>
      )}

      {/* 2. Gráfico Apilado por Categorías Reales */}
      {activeChartTab === 'apilado' && (
        <div className="h-64 w-full">
          {hasActivity ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart key={`bar-stack-${dataSignature}`} data={chartData} margin={{ top: 10, right: 5, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                <XAxis dataKey="periodo" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="#64748b"
                  fontSize={10}
                  tickFormatter={val => formatCurrencyCompact(val)}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip content={<CustomBarTooltip />} />
                <Legend
                  verticalAlign="top"
                  align="right"
                  iconType="circle"
                  wrapperStyle={{ fontSize: '10px', paddingBottom: '10px' }}
                />
                {/* Ingresos Apilados */}
                <Bar dataKey="Domicilios" stackId="ingresos" fill="#10b981" radius={[0, 0, 0, 0]} isAnimationActive={false} />
                <Bar dataKey="Pasajeros" stackId="ingresos" fill="#06b6d4" radius={[0, 0, 0, 0]} isAnimationActive={false} />
                <Bar dataKey="OtrosIngresos" stackId="ingresos" fill="#3b82f6" radius={[4, 4, 0, 0]} isAnimationActive={false} />

                {/* Gastos Apilados */}
                <Bar dataKey="Combustible" stackId="gastos" fill="#f59e0b" radius={[0, 0, 0, 0]} isAnimationActive={false} />
                <Bar dataKey="Acompanante" stackId="gastos" fill="#6366f1" radius={[0, 0, 0, 0]} isAnimationActive={false} />
                <Bar dataKey="Alimentacion" stackId="gastos" fill="#ec4899" radius={[0, 0, 0, 0]} isAnimationActive={false} />
                <Bar dataKey="Mantenimiento" stackId="gastos" fill="#8b5cf6" radius={[0, 0, 0, 0]} isAnimationActive={false} />
                <Bar dataKey="CuotaCredito" stackId="gastos" fill="#0ea5e9" radius={[0, 0, 0, 0]} isAnimationActive={false} />
                <Bar dataKey="OtrosGastos" stackId="gastos" fill="#64748b" radius={[4, 4, 0, 0]} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-xs text-slate-500 gap-1.5 p-6 text-center">
              <Layers className="w-8 h-8 text-slate-600 stroke-1" />
              <p className="font-semibold text-slate-400">Sin desglose apilado para este período</p>
              <p className="text-[11px] text-slate-500">Agrega movimientos en el turno para ver las categorías apiladas.</p>
            </div>
          )}
        </div>
      )}

      {/* 3. Gráfico de Dona: Gastos con etiquetas claras */}
      {activeChartTab === 'gastos' && (
        <div className="h-64 w-full">
          {expensePieData.length > 0 ? (
            <div className="flex flex-col sm:flex-row items-center justify-center h-full gap-4">
              <div className="w-44 h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart key={`pie-exp-${dataSignature}`}>
                    <Pie
                      data={expensePieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={4}
                      isAnimationActive={false}
                    >
                      {expensePieData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={EXPENSE_COLORS[entry.name] || PIE_PALETTE[index % PIE_PALETTE.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomPieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-1 gap-x-3 gap-y-1.5 max-w-sm text-xs">
                {expensePieData.map((entry, idx) => (
                  <div key={entry.name} className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: EXPENSE_COLORS[entry.name] || PIE_PALETTE[idx % PIE_PALETTE.length] }}
                    />
                    <span className="text-slate-300 truncate">{entry.name}:</span>
                    <span className="font-bold text-white ml-auto">{formatCurrency(entry.value)}</span>
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

      {/* 4. Gráfico de Dona: Ingresos */}
      {activeChartTab === 'ingresos' && (
        <div className="h-64 w-full">
          {incomePieData.length > 0 ? (
            <div className="flex flex-col sm:flex-row items-center justify-center h-full gap-4">
              <div className="w-44 h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart key={`pie-inc-${dataSignature}`}>
                    <Pie
                      data={incomePieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={4}
                      isAnimationActive={false}
                    >
                      {incomePieData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_PALETTE[index % PIE_PALETTE.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomPieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-1 gap-x-3 gap-y-1.5 max-w-sm text-xs">
                {incomePieData.map((entry, idx) => (
                  <div key={entry.name} className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: PIE_PALETTE[idx % PIE_PALETTE.length] }}
                    />
                    <span className="text-slate-300 truncate">{entry.name}:</span>
                    <span className="font-bold text-white ml-auto">{formatCurrency(entry.value)}</span>
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
