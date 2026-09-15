import React, { useState, useMemo } from 'react';
import { useAppData } from '../../context/AppDataContext';
import {
  generateConsolidatedReport,
  exportToCSV,
  formatCurrency,
  formatCurrencyCompact,
  formatMinutes
} from '../../lib/calculations';
import {
  FileSpreadsheet,
  Download,
  BarChart3,
  PieChart as PieIcon,
  TrendingUp,
  Table as TableIcon,
  LayoutGrid,
  Users,
  Fuel,
  Sparkles
} from 'lucide-react';
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
  CartesianGrid,
  AreaChart,
  Area
} from 'recharts';

const EXPENSE_CATEGORY_COLORS: Record<string, string> = {
  'Gasolina': '#f59e0b',
  'Honorarios Jhony': '#6366f1',
  'Acompañante (Jhony)': '#6366f1',
  'Alimentación': '#ec4899',
  'Mantenimiento Moto': '#8b5cf6',
  'Cuota Crédito': '#06b6d4',
  'Otros Gastos': '#64748b'
};

export const ReportsView: React.FC = () => {
  const { shifts, transactions } = useAppData();
  const [groupBy, setGroupBy] = useState<'dia' | 'semana' | 'mes'>('dia');
  const [viewMode, setViewMode] = useState<'combinada' | 'graficas' | 'tabla'>('combinada');

  const reports = useMemo(() => {
    return generateConsolidatedReport(shifts, transactions, groupBy);
  }, [shifts, transactions, groupBy]);

  const chronologicalReports = useMemo(() => {
    return [...reports].reverse();
  }, [reports]);

  const dataSignature = useMemo(() => {
    const txLen = transactions.length;
    const sum = transactions.reduce((acc, t) => acc + (Number(t.monto) || 0), 0);
    const shLen = shifts.length;
    return `${groupBy}_${txLen}_${sum}_${shLen}`;
  }, [transactions, shifts, groupBy]);

  const totals = useMemo(() => {
    return reports.reduce(
      (acc, r) => ({
        domicilios: acc.domicilios + r.domicilios,
        pasajeros: acc.pasajeros + r.pasajeros,
        otrosIngresos: acc.otrosIngresos + r.otrosIngresos,
        totalIngresos: acc.totalIngresos + r.totalIngresos,
        gasolina: acc.gasolina + r.gasolina,
        acompanante: acc.acompanante + (r.acompanante || 0),
        otrosGastos: acc.otrosGastos + r.otrosGastos,
        totalGastos: acc.totalGastos + r.totalGastos,
        superavit: acc.superavit + r.superavit,
        minutosReparto: acc.minutosReparto + r.minutosReparto,
        minutosEspera: acc.minutosEspera + r.minutosEspera,
        kilometros: acc.kilometros + r.kilometros
      }),
      {
        domicilios: 0,
        pasajeros: 0,
        otrosIngresos: 0,
        totalIngresos: 0,
        gasolina: 0,
        acompanante: 0,
        otrosGastos: 0,
        totalGastos: 0,
        superavit: 0,
        minutosReparto: 0,
        minutosEspera: 0,
        kilometros: 0
      }
    );
  }, [reports]);

  const totalHorasGen = (totals.minutosReparto + totals.minutosEspera) / 60;
  const rendimientoOperativoHora = totalHorasGen > 0 ? (totals.totalIngresos - totals.totalGastos) / totalHorasGen : null;
  const facturacionBrutaHora = totalHorasGen > 0 ? totals.totalIngresos / totalHorasGen : null;

  // Desglose de gastos por categorías reales para el gráfico de dona
  const expenseBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of transactions) {
      if (t.tipo !== 'GASTO') continue;
      let label = 'Otros Gastos';
      if (t.categoria === 'COMBUSTIBLE' || (t.subcategoria && t.subcategoria.toLowerCase().includes('gasolina'))) {
        label = 'Gasolina';
      } else if (
        t.categoria === 'HONORARIOS_ACOMPANANTE' ||
        (t.subcategoria && (t.subcategoria.toLowerCase().includes('acompañante') || t.subcategoria.toLowerCase().includes('jhony')))
      ) {
        label = 'Honorarios Jhony';
      } else if (t.categoria === 'ALIMENTACION') {
        label = 'Alimentación';
      } else if (t.categoria === 'MANTENIMIENTO_MOTO') {
        label = 'Mantenimiento Moto';
      } else if (t.categoria === 'CUOTA_CREDITO') {
        label = 'Cuota Crédito';
      }
      map.set(label, (map.get(label) || 0) + (Number(t.monto) || 0));
    }
    return Array.from(map.entries())
      .map(([name, value]) => ({
        name,
        value,
        color: EXPENSE_CATEGORY_COLORS[name] || '#64748b'
      }))
      .filter(d => d.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [transactions]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 border border-white/20 p-3 rounded-xl shadow-2xl text-xs space-y-1 z-50">
          <p className="font-bold text-white border-b border-white/10 pb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={`item-${index}`} style={{ color: entry.color }} className="font-semibold flex justify-between gap-4">
              <span>{entry.name}:</span>
              <span className="font-bold">{formatCurrency(entry.value)}</span>
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
      const totalExp = totals.totalGastos > 0 ? totals.totalGastos : 1;
      const pct = Math.round((data.value / totalExp) * 100);
      return (
        <div className="bg-slate-900 border border-white/20 p-2.5 rounded-xl shadow-2xl text-xs z-50">
          <p className="font-bold text-white">{data.name}</p>
          <p className="text-slate-300 font-semibold mt-0.5">
            {formatCurrency(data.value)} ({pct}%)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-5 pb-24 max-w-7xl mx-auto">
      {/* Header del Reporte */}
      <div className="app-card p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-cyan-500" />
            Reportes & Gráficas Contables
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Analítica visual interactiva y consolidado contable por semanas y meses
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Toggle Modo de Vista */}
          <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-white/10">
            <button
              onClick={() => setViewMode('combinada')}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'combinada'
                  ? 'bg-cyan-500 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Ver gráficas y tabla"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Combinada</span>
            </button>
            <button
              onClick={() => setViewMode('graficas')}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'graficas'
                  ? 'bg-cyan-500 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Ver solo gráficas interactivas"
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Gráficas</span>
            </button>
            <button
              onClick={() => setViewMode('tabla')}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'tabla'
                  ? 'bg-cyan-500 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Ver solo tabla de datos"
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>Tabla</span>
            </button>
          </div>

          {/* Toggle Día / Semana / Mes */}
          <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-white/10">
            <button
              onClick={() => setGroupBy('dia')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                groupBy === 'dia'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Día a Día
            </button>
            <button
              onClick={() => setGroupBy('semana')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                groupBy === 'semana'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Semanas
            </button>
            <button
              onClick={() => setGroupBy('mes')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                groupBy === 'mes'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Meses
            </button>
          </div>

          {/* Botón Descarga CSV */}
          <button
            onClick={() => exportToCSV(reports)}
            disabled={reports.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-md hover:bg-emerald-500 transition-all disabled:opacity-40"
            title="Exportar a archivo Excel / CSV"
          >
            <Download className="w-4 h-4" />
            <span className="font-extrabold">CSV</span>
          </button>
        </div>
      </div>

      {/* Tarjetas Resumen Acumulado */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
        <div className="app-card p-3.5 rounded-xl border-l-4 border-l-emerald-500">
          <span className="text-[10px] uppercase font-bold text-slate-400">Ingresos Totales</span>
          <p className="text-base sm:text-lg font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
            {formatCurrency(totals.totalIngresos)}
          </p>
        </div>
        <div className="app-card p-3.5 rounded-xl border-l-4 border-l-rose-500">
          <span className="text-[10px] uppercase font-bold text-slate-400">Gastos Totales</span>
          <p className="text-base sm:text-lg font-black text-rose-600 dark:text-rose-400 mt-0.5">
            {formatCurrency(totals.totalGastos)}
          </p>
        </div>
        <div className="app-card p-3.5 rounded-xl border-l-4 border-l-indigo-500">
          <div className="flex items-center gap-1">
            <Users className="w-3 h-3 text-indigo-500" />
            <span className="text-[10px] uppercase font-bold text-indigo-500 dark:text-indigo-400">Jhony (Acompañante)</span>
          </div>
          <p className="text-base sm:text-lg font-black text-indigo-600 dark:text-indigo-400 mt-0.5">
            {formatCurrency(totals.acompanante)}
          </p>
        </div>
        <div className="app-card p-3.5 rounded-xl border-l-4 border-l-cyan-500">
          <span className="text-[10px] uppercase font-bold text-slate-400">Superávit Libre</span>
          <p className={`text-base sm:text-lg font-black mt-0.5 ${totals.superavit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
            {formatCurrency(totals.superavit)}
          </p>
        </div>
        <div className="app-card p-3.5 rounded-xl border-l-4 border-l-amber-500 col-span-2 sm:col-span-1">
          <span className="text-[10px] uppercase font-bold text-slate-400">Rendimiento Operativo/h</span>
          <p className="text-base sm:text-lg font-black text-slate-900 dark:text-white mt-0.5">
            {rendimientoOperativoHora !== null ? `${formatCurrency(rendimientoOperativoHora)}/h` : 'No disponible'}
          </p>
          {facturacionBrutaHora !== null && (
            <span className="text-[10px] text-slate-400 block truncate">
              Bruto: {formatCurrency(facturacionBrutaHora)}/h
            </span>
          )}
        </div>
      </div>

      {/* SECCIÓN DE GRÁFICAS */}
      {(viewMode === 'graficas' || viewMode === 'combinada') && (
        <div className="space-y-4">
          {/* Fila 1: Evolución Financiera de Periodos + Dona de Gastos */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Gráfica 1: Barras Evolución Ingresos vs Gastos vs Superávit */}
            <div className="lg:col-span-2 app-card p-4 sm:p-5 rounded-2xl">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-cyan-500" />
                  Evolución Financiera por {groupBy === 'dia' ? 'Días' : groupBy === 'semana' ? 'Semanas' : 'Meses'}
                </h3>
                <span className="text-[11px] font-semibold text-slate-400">
                  Ingresos vs Gastos vs Superávit
                </span>
              </div>

              {chronologicalReports.length > 0 ? (
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart key={`rep-bar-${dataSignature}`} data={chronologicalReports} barGap={4} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} vertical={false} />
                      <XAxis
                        dataKey="periodo"
                        tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }}
                        stroke="#475569"
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fill: '#94a3b8', fontSize: 10 }}
                        stroke="#475569"
                        tickFormatter={(val) => formatCurrencyCompact(val)}
                        tickLine={false}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                      <Bar dataKey="totalIngresos" name="Ingresos" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={32} isAnimationActive={false} />
                      <Bar dataKey="totalGastos" name="Gastos" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={32} isAnimationActive={false} />
                      <Bar dataKey="superavit" name="Superávit" fill="#06b6d4" radius={[4, 4, 0, 0]} maxBarSize={32} isAnimationActive={false} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-72 flex items-center justify-center text-xs text-slate-400">
                  Sin datos suficientes para graficar
                </div>
              )}
            </div>

            {/* Gráfica 2: Dona Composición de Gastos (incluyendo Honorarios Jhony) */}
            <div className="app-card p-4 sm:p-5 rounded-2xl flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <PieIcon className="w-4 h-4 text-indigo-500" />
                  Distribución de Gastos
                </h3>
                <span className="text-[10px] uppercase font-bold bg-indigo-500/10 text-indigo-500 px-2 py-0.5 rounded-full">
                  Incluye Jhony
                </span>
              </div>

              {expenseBreakdown.length > 0 ? (
                <>
                  <div className="h-48 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart key={`rep-pie-${dataSignature}`}>
                        <Pie
                          data={expenseBreakdown}
                          cx="50%"
                          cy="50%"
                          innerRadius={48}
                          outerRadius={75}
                          paddingAngle={3}
                          dataKey="value"
                          isAnimationActive={false}
                        >
                          {expenseBreakdown.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomPieTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Leyenda con montos y porcentajes */}
                  <div className="mt-2 space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {expenseBreakdown.map((item) => {
                      const totalExp = totals.totalGastos > 0 ? totals.totalGastos : 1;
                      const pct = Math.round((item.value / totalExp) * 100);
                      return (
                        <div key={item.name} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2 truncate">
                            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                            <span className="text-slate-600 dark:text-slate-300 truncate font-medium">{item.name}</span>
                          </div>
                          <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white flex-shrink-0">
                            <span>{formatCurrency(item.value)}</span>
                            <span className="text-slate-400 font-normal text-[10px] w-7 text-right">{pct}%</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div className="h-64 flex items-center justify-center text-xs text-slate-400">
                  Sin gastos registrados para graficar
                </div>
              )}
            </div>
          </div>

          {/* Fila 2: Tendencia de Eficiencia ($/h y Horas trabajadas) */}
          <div className="app-card p-4 sm:p-5 rounded-2xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-3">
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
                Rendimiento por Hora ($/h) & Horas Trabajadas
              </h3>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Productividad real acumulada por periodo
              </span>
            </div>

            {chronologicalReports.length > 0 ? (
              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart key={`rep-area-${dataSignature}`} data={chronologicalReports} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRendimiento" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} vertical={false} />
                    <XAxis
                      dataKey="periodo"
                      tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }}
                      stroke="#475569"
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: '#94a3b8', fontSize: 10 }}
                      stroke="#475569"
                      tickFormatter={(val) => `$${Math.round(val / 1000)}k`}
                      tickLine={false}
                    />
                    <Tooltip
                      formatter={(value: any) => [formatCurrency(Number(value)) + '/h', 'Rendimiento']}
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: 'rgba(255,255,255,0.15)',
                        borderRadius: '0.75rem',
                        fontSize: '12px',
                        color: '#fff'
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="rendimientoHora"
                      name="Rendimiento $/h"
                      stroke="#06b6d4"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorRendimiento)"
                      dot={{ r: 5, fill: '#06b6d4', stroke: '#ffffff', strokeWidth: 2 }}
                      activeDot={{ r: 7 }}
                      isAnimationActive={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-60 flex items-center justify-center text-xs text-slate-400">
                Sin datos operativos para calcular rendimiento por hora
              </div>
            )}
          </div>
        </div>
      )}

      {/* SECCIÓN TABLA CONSOLIDADA */}
      {(viewMode === 'tabla' || viewMode === 'combinada') && (
        <div className="app-card rounded-2xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-200 dark:border-white/10 flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              <TableIcon className="w-4 h-4 text-cyan-500" />
              Detalle Numérico Consolidado
            </h3>
            <span className="text-[11px] font-semibold text-slate-400">
              {reports.length} periodos calculados
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-white/10 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <th className="py-3 px-3.5 sticky left-0 bg-slate-50 dark:bg-slate-900 z-10">Periodo</th>
                  <th className="py-3 px-3 text-right">Domicilios</th>
                  <th className="py-3 px-3 text-right">Pasajeros</th>
                  <th className="py-3 px-3 text-right">Otros Ing.</th>
                  <th className="py-3 px-3 text-right text-emerald-600 dark:text-emerald-400 font-extrabold">Total Ing.</th>
                  <th className="py-3 px-3 text-right">Gasolina</th>
                  <th className="py-3 px-3 text-right text-indigo-500 dark:text-indigo-400 font-extrabold">Jhony</th>
                  <th className="py-3 px-3 text-right">Otros Gastos</th>
                  <th className="py-3 px-3 text-right text-rose-600 dark:text-rose-400 font-extrabold">Total Gastos</th>
                  <th className="py-3 px-3 text-right font-black">Superávit</th>
                  <th className="py-3 px-3 text-center">Horas (Rep/Esp)</th>
                  <th className="py-3 px-3 text-right">Km Recorridos</th>
                  <th className="py-3 px-3 text-right text-cyan-600 dark:text-cyan-400 font-bold">Rendimiento/h</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {reports.map((row, idx) => {
                  const rowHours = (row.minutosReparto + row.minutosEspera) / 60;
                  const rowYield = rowHours > 0 ? (row.totalIngresos - row.totalGastos) / rowHours : null;

                  return (
                    <tr
                      key={row.key}
                      className={`hover:bg-slate-50 dark:hover:bg-white/5 transition-colors ${
                        idx % 2 === 0 ? 'bg-transparent' : 'bg-slate-50/50 dark:bg-slate-900/30'
                      }`}
                    >
                      <td className="py-3 px-3.5 font-bold text-slate-900 dark:text-white whitespace-nowrap sticky left-0 bg-white dark:bg-slate-900 z-10">
                        {row.periodo}
                      </td>
                      <td className="py-3 px-3 text-right text-slate-700 dark:text-slate-300 font-medium">
                        {formatCurrency(row.domicilios)}
                      </td>
                      <td className="py-3 px-3 text-right text-slate-700 dark:text-slate-300 font-medium">
                        {formatCurrency(row.pasajeros)}
                      </td>
                      <td className="py-3 px-3 text-right text-slate-700 dark:text-slate-300 font-medium">
                        {formatCurrency(row.otrosIngresos)}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(row.totalIngresos)}
                      </td>
                      <td className="py-3 px-3 text-right text-slate-700 dark:text-slate-300 font-medium">
                        {formatCurrency(row.gasolina)}
                      </td>
                      <td className="py-3 px-3 text-right text-indigo-500 dark:text-indigo-400 font-bold">
                        {formatCurrency(row.acompanante || 0)}
                      </td>
                      <td className="py-3 px-3 text-right text-slate-700 dark:text-slate-300 font-medium">
                        {formatCurrency(row.otrosGastos)}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-rose-600 dark:text-rose-400">
                        {formatCurrency(row.totalGastos)}
                      </td>
                      <td className="py-3 px-3 text-right font-black">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[11px] ${
                            row.superavit >= 0
                              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-extrabold'
                              : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 font-extrabold'
                          }`}
                        >
                          {formatCurrency(row.superavit)}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center whitespace-nowrap text-slate-600 dark:text-slate-300">
                        <span className="text-cyan-600 dark:text-cyan-400 font-semibold">{formatMinutes(row.minutosReparto)}</span>
                        <span className="text-slate-400 mx-1">/</span>
                        <span className="text-slate-600 dark:text-slate-400 font-semibold">{formatMinutes(row.minutosEspera)}</span>
                      </td>
                      <td className="py-3 px-3 text-right text-slate-700 dark:text-slate-300 font-medium">
                        {row.kilometros.toFixed(1)} km
                      </td>
                      <td className="py-3 px-3 text-right text-cyan-600 dark:text-cyan-400 font-bold whitespace-nowrap">
                        {rowYield !== null ? formatCurrency(rowYield) : 'No disponible'}
                      </td>
                    </tr>
                  );
                })}

                {reports.length === 0 && (
                  <tr>
                    <td colSpan={13} className="py-8 text-center text-slate-400">
                      No hay turnos o movimientos registrados para generar el reporte.
                    </td>
                  </tr>
                )}
              </tbody>
              {reports.length > 0 && (
                <tfoot>
                  <tr className="bg-slate-100 dark:bg-slate-950 font-black border-t border-slate-300 dark:border-white/10 text-slate-900 dark:text-white">
                    <td className="py-3.5 px-3.5 sticky left-0 bg-slate-100 dark:bg-slate-950 z-10 text-cyan-600 dark:text-cyan-400">
                      TOTALES
                    </td>
                    <td className="py-3.5 px-3 text-right">{formatCurrency(totals.domicilios)}</td>
                    <td className="py-3.5 px-3 text-right">{formatCurrency(totals.pasajeros)}</td>
                    <td className="py-3.5 px-3 text-right">{formatCurrency(totals.otrosIngresos)}</td>
                    <td className="py-3.5 px-3 text-right text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(totals.totalIngresos)}
                    </td>
                    <td className="py-3.5 px-3 text-right">{formatCurrency(totals.gasolina)}</td>
                    <td className="py-3.5 px-3 text-right text-indigo-500 dark:text-indigo-400 font-bold">
                      {formatCurrency(totals.acompanante)}
                    </td>
                    <td className="py-3.5 px-3 text-right">{formatCurrency(totals.otrosGastos)}</td>
                    <td className="py-3.5 px-3 text-right text-rose-600 dark:text-rose-400">
                      {formatCurrency(totals.totalGastos)}
                    </td>
                    <td className="py-3.5 px-3 text-right text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(totals.superavit)}
                    </td>
                    <td className="py-3.5 px-3 text-center whitespace-nowrap">
                      {formatMinutes(totals.minutosReparto)} / {formatMinutes(totals.minutosEspera)}
                    </td>
                    <td className="py-3.5 px-3 text-right">{totals.kilometros.toFixed(1)} km</td>
                    <td className="py-3.5 px-3 text-right text-cyan-600 dark:text-cyan-400">
                      {rendimientoOperativoHora !== null ? formatCurrency(rendimientoOperativoHora) : 'No disponible'}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
