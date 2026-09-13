import React, { useState, useMemo } from 'react';
import { useAppData } from '../../context/AppDataContext';
import {
  formatCurrency,
  formatMinutes,
  getStackedFinancialData,
  getCategoryDistribution,
  getProductivityDeepMetrics
} from '../../lib/calculations';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Smartphone,
  CalendarClock,
  Clock,
  Activity,
  Gauge,
  Plus,
  ArrowRight,
  Layers,
  LineChart as LineChartIcon,
  Sparkles,
  PieChart as PieChartIcon
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend
} from 'recharts';
import { TimeRangeFilter } from './TimeRangeFilter';

export const ExecutiveDashboard: React.FC = () => {
  const { summary, creditAnalysis, filteredTransactions, transactions, filteredShifts, filter, openDrawer } = useAppData();

  const [chartMode, setChartMode] = useState<'stacked' | 'trend'>('stacked');

  // Métricas avanzadas reales
  const prodMetrics = useMemo(() => {
    return getProductivityDeepMetrics(filteredShifts, filteredTransactions, summary);
  }, [filteredShifts, filteredTransactions, summary]);

  // Datos para gráfico de barras apiladas y tendencias
  // Usamos transactions (todo el historial del usuario) para que la gráfica de barras apiladas y tendencias
  // siempre muestre la evolución temporal de los diferentes días, sin colapsar a un único día si el filtro superior está en "Hoy"
  const stackedData = useMemo(() => {
    return getStackedFinancialData(transactions, filter.range);
  }, [transactions, filter.range]);

  // Distribuciones de ingresos y egresos
  const incomeDistribution = useMemo(() => {
    return getCategoryDistribution(filteredTransactions, 'INGRESO');
  }, [filteredTransactions]);

  const expenseDistribution = useMemo(() => {
    return getCategoryDistribution(filteredTransactions, 'GASTO');
  }, [filteredTransactions]);

  const isNetPositive = summary.superavitNeto >= 0;
  const isAppPositive = summary.saldoApp >= 0;
  const marginPercentage = summary.ingresosTotales > 0
    ? Math.round((summary.superavitNeto / summary.ingresosTotales) * 100)
    : 0;

  // Donut de tiempo activo vs espera
  const timeDonutData = useMemo(() => {
    const reparto = summary.totalMinutosReparto || 0;
    const espera = summary.totalMinutosEspera || 0;
    if (reparto === 0 && espera === 0) {
      return [{ name: 'Sin jornada', value: 1, color: '#334155' }];
    }
    return [
      { name: 'Reparto Activo', value: reparto, color: '#0284c7' },
      { name: 'Tiempo de Espera', value: espera, color: '#64748b' }
    ];
  }, [summary.totalMinutosReparto, summary.totalMinutosEspera]);

  return (
    <div className="w-full max-w-[1600px] mx-auto space-y-5 px-1 sm:px-2">
      {/* 1. Selector de Rango Temporal Contextual */}
      <TimeRangeFilter />

      {/* 2. Alerta de Cuota (si está próxima o vencida) */}
      {creditAnalysis.alertaVencimientoCercano && (
        <div
          className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md transition-all ${
            creditAnalysis.estaCubierto
              ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-800 dark:text-emerald-200'
              : 'bg-amber-500/10 border-amber-500/40 text-amber-800 dark:text-amber-200'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-xl flex-shrink-0 ${
                creditAnalysis.estaCubierto
                  ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                  : 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
              }`}
            >
              <CalendarClock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-wider">
                {creditAnalysis.esHoy
                  ? `¡HOY ES DÍA ${creditAnalysis.proximoDiaPago} DE PAGO!`
                  : `Próximo vencimiento: Día ${creditAnalysis.proximoDiaPago} (Faltan ${creditAnalysis.diasRestantes} días)`}
              </p>
              <p className="text-xs mt-0.5">
                Total cuotas: <b>{formatCurrency(creditAnalysis.totalCuotasPendientes)}</b> |{' '}
                {creditAnalysis.estaCubierto ? (
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                    ✅ ¡Cubierto! Te sobran {formatCurrency(creditAnalysis.diferencia)} de ganancia.
                  </span>
                ) : (
                  <span className="text-rose-600 dark:text-rose-400 font-bold">
                    ⚠️ Te faltan {formatCurrency(Math.abs(creditAnalysis.diferencia))} para cubrir tus cuotas.
                  </span>
                )}
              </p>
            </div>
          </div>
          <Link
            to="/creditos"
            className="px-4 py-2 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-bold whitespace-nowrap self-start sm:self-center hover:opacity-90 transition-opacity shadow-sm"
          >
            Ver Cuotas →
          </Link>
        </div>
      )}

      {/* 3. FILA 1: HERO METRICS — MÁXIMA JERARQUÍA VISUAL (4 Tarjetas Principales) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* HERO 1: Ganancia Neta Real (Superávit / Déficit) */}
        <div className="app-card rounded-2xl p-5 border-l-4 border-l-cyan-500 shadow-md flex flex-col justify-between relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
                Resultado Neto
              </span>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                Ganancia Limpia
              </h3>
            </div>
            <span
              className={`px-2.5 py-1 rounded-full text-xs font-black ${
                isNetPositive
                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                  : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30'
              }`}
            >
              {isNetPositive ? `+${marginPercentage}% Margen` : `${marginPercentage}% Margen`}
            </span>
          </div>

          <div className="my-3">
            <p className={`text-3xl sm:text-4xl font-black tracking-tight ${
              isNetPositive ? 'text-slate-900 dark:text-white' : 'text-rose-600 dark:text-rose-400'
            }`}>
              {formatCurrency(summary.superavitNeto)}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Dinero disponible tras restar gasolina y gastos
            </p>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-xs text-slate-500">
            <span>Ingresos: <b className="text-emerald-600 dark:text-emerald-400">{formatCurrency(summary.ingresosTotales)}</b></span>
            <span>Gastos: <b className="text-rose-600 dark:text-rose-400">{formatCurrency(summary.gastosTotales)}</b></span>
          </div>
        </div>

        {/* HERO 2: Ingresos Brutos */}
        <div className="app-card rounded-2xl p-5 shadow-md flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Facturación Total
              </span>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                Ingresos Brutos
              </h3>
            </div>
            <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>

          <div className="my-3">
            <p className="text-3xl sm:text-4xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
              +{formatCurrency(summary.ingresosTotales)}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              {prodMetrics.totalServicios} servicios registrados en este rango
            </p>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-xs text-slate-500">
            <span>Ticket Promedio:</span>
            <b className="text-slate-900 dark:text-white">{formatCurrency(prodMetrics.ingresoPorServicio)} / servicio</b>
          </div>
        </div>

        {/* HERO 3: Gastos Operativos */}
        <div className="app-card rounded-2xl p-5 shadow-md flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-rose-600 dark:text-rose-400">
                Costos de Ruta
              </span>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                Gastos Operativos
              </h3>
            </div>
            <div className="p-2 rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>

          <div className="my-3">
            <p className="text-3xl sm:text-4xl font-black text-rose-600 dark:text-rose-400 tracking-tight">
              -{formatCurrency(summary.gastosTotales)}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Combustible, Jhony (acompañante), alimentos y mantenimiento
            </p>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-xs text-slate-500">
            <span>Costo por Hora:</span>
            <b className="text-slate-900 dark:text-white">-{formatCurrency(prodMetrics.costoPorHora)} / h</b>
          </div>
        </div>

        {/* HERO 4: Rendimiento Horario ($/h) y Productividad */}
        <div className="app-card rounded-2xl p-5 shadow-md flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-purple-600 dark:text-purple-400">
                Velocidad Operativa
              </span>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                Ingreso por Hora
              </h3>
            </div>
            <div className="p-2 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400">
              <Activity className="w-4 h-4" />
            </div>
          </div>

          <div className="my-3">
            <p className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              {formatCurrency(prodMetrics.ingresoPorHora)}
              <span className="text-xs font-bold text-slate-400 font-normal"> / hora</span>
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Margen neto real: <b className="text-cyan-600 dark:text-cyan-400">{formatCurrency(prodMetrics.margenPorHora)}/h</b>
            </p>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-xs text-slate-500">
            <span>Eficiencia en Ruta:</span>
            <span className="px-2 py-0.5 rounded-md bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 font-black text-[11px]">
              {prodMetrics.ratioProductividad}% activo
            </span>
          </div>
        </div>
      </div>

      {/* 4. FILA 2: GRÁFICA PRINCIPAL PANORÁMICA + DOBLE REALIDAD / CRÉDITOS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Columna Izquierda (8 cols): Gráfica Principal Interactiva (Barras Apiladas / Tendencia) */}
        <div className="lg:col-span-7 xl:col-span-8 app-card rounded-2xl p-5 shadow-md flex flex-col justify-between min-h-[380px]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-white/5">
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-500" />
                Flujo Financiero Desglosado
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {chartMode === 'stacked'
                  ? 'Composición apilada: Domicilios y Pasajeros vs. Combustible y Alimentación'
                  : 'Evolución continua de Ingresos, Gastos y Margen Neto en el tiempo'}
              </p>
            </div>

            {/* Selector de Modo de Gráfica */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-white/5 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setChartMode('stacked')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  chartMode === 'stacked'
                    ? 'bg-cyan-500 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Barras Apiladas</span>
              </button>
              <button
                type="button"
                onClick={() => setChartMode('trend')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  chartMode === 'trend'
                    ? 'bg-cyan-500 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <LineChartIcon className="w-3.5 h-3.5" />
                <span>Tendencia</span>
              </button>
            </div>
          </div>

          {/* Contenedor del Gráfico */}
          <div className="w-full h-72 sm:h-80 my-3">
            {stackedData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                {chartMode === 'stacked' ? (
                  <BarChart data={stackedData} margin={{ top: 15, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="periodo" stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} tickFormatter={v => `$${Math.round(v/1000)}k`} />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const item = payload[0]?.payload;
                          return (
                            <div className="app-card bg-slate-950/95 text-white text-xs p-3 rounded-xl shadow-xl border border-white/10 space-y-1.5 min-w-[200px]">
                              <p className="font-bold border-b border-white/10 pb-1 text-cyan-400">{label}</p>
                              <div className="space-y-1">
                                <p className="font-semibold text-emerald-400 text-[11px] uppercase tracking-wider">Ingresos (+{formatCurrency(item.TotalIngresos)})</p>
                                {item.Domicilios > 0 && <p className="text-slate-300 text-[11px] flex justify-between"><span>• Domicilios:</span> <b>{formatCurrency(item.Domicilios)}</b></p>}
                                {item.Pasajeros > 0 && <p className="text-slate-300 text-[11px] flex justify-between"><span>• Pasajeros:</span> <b>{formatCurrency(item.Pasajeros)}</b></p>}
                                {item.OtrosIngresos > 0 && <p className="text-slate-300 text-[11px] flex justify-between"><span>• Otros:</span> <b>{formatCurrency(item.OtrosIngresos)}</b></p>}
                              </div>
                              <div className="space-y-1 pt-1 border-t border-white/10">
                                <p className="font-semibold text-rose-400 text-[11px] uppercase tracking-wider">Gastos (-{formatCurrency(item.TotalGastos)})</p>
                                {item.Combustible > 0 && <p className="text-slate-300 text-[11px] flex justify-between"><span>• Gasolina:</span> <b>{formatCurrency(item.Combustible)}</b></p>}
                                {item.Acompanante > 0 && <p className="text-slate-300 text-[11px] flex justify-between"><span>• Jhony (Acompañante):</span> <b>{formatCurrency(item.Acompanante)}</b></p>}
                                {item.Alimentacion > 0 && <p className="text-slate-300 text-[11px] flex justify-between"><span>• Alimentos:</span> <b>{formatCurrency(item.Alimentacion)}</b></p>}
                                {item.Mantenimiento > 0 && <p className="text-slate-300 text-[11px] flex justify-between"><span>• Mantenimiento:</span> <b>{formatCurrency(item.Mantenimiento)}</b></p>}
                                {item.OtrosGastos > 0 && <p className="text-slate-300 text-[11px] flex justify-between"><span>• Otros:</span> <b>{formatCurrency(item.OtrosGastos)}</b></p>}
                              </div>
                              <div className="pt-1 border-t border-white/10 flex justify-between font-bold text-xs">
                                <span>Margen Neto:</span>
                                <span className={item.Neto >= 0 ? 'text-emerald-400' : 'text-rose-400'}>{formatCurrency(item.Neto)}</span>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                    <Bar dataKey="Domicilios" stackId="ingresos" fill="#0284c7" name="Domicilios" radius={[0, 0, 0, 0]} maxBarSize={20} />
                    <Bar dataKey="Pasajeros" stackId="ingresos" fill="#8b5cf6" name="Pasajeros" radius={[4, 4, 0, 0]} maxBarSize={20} />
                    <Bar dataKey="Combustible" stackId="gastos" fill="#f59e0b" name="Gasolina" radius={[0, 0, 0, 0]} maxBarSize={20} />
                    <Bar dataKey="Acompanante" stackId="gastos" fill="#6366f1" name="Jhony (Acompañante)" radius={[0, 0, 0, 0]} maxBarSize={20} />
                    <Bar dataKey="Alimentacion" stackId="gastos" fill="#ec4899" name="Alimentación" radius={[0, 0, 0, 0]} maxBarSize={20} />
                    <Bar dataKey="Mantenimiento" stackId="gastos" fill="#ef4444" name="Mantenimiento" radius={[4, 4, 0, 0]} maxBarSize={20} />
                  </BarChart>
                ) : (
                  <AreaChart data={stackedData} margin={{ top: 15, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="ingresosGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0284c7" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#0284c7" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="gastosGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="periodo" stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} tickFormatter={v => `$${Math.round(v/1000)}k`} />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="app-card bg-slate-950/95 text-white text-xs p-3 rounded-xl shadow-xl border border-white/10 space-y-1">
                              <p className="font-bold text-cyan-400">{label}</p>
                              <p className="text-emerald-400">Ingresos: {formatCurrency(payload[0]?.value as number || 0)}</p>
                              <p className="text-rose-400">Gastos: {formatCurrency(payload[1]?.value as number || 0)}</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                    <Area type="monotone" dataKey="TotalIngresos" stroke="#0284c7" strokeWidth={2.5} fillOpacity={1} fill="url(#ingresosGrad)" name="Ingresos Totales" />
                    <Area type="monotone" dataKey="TotalGastos" stroke="#ef4444" strokeWidth={2.5} fillOpacity={1} fill="url(#gastosGrad)" name="Gastos Totales" />
                  </AreaChart>
                )}
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 text-xs">
                <p className="font-bold text-slate-600 dark:text-slate-300">No hay movimientos registrados en este rango temporal</p>
                <p className="text-[11px] text-slate-400 mt-1">Registra turnos o pedidos de app para visualizar la comparativa</p>
                <button
                  onClick={() => openDrawer('app_income')}
                  className="mt-3 px-3 py-1.5 rounded-xl bg-cyan-500 text-white font-bold text-xs shadow-xs"
                >
                  + Registrar Pedido
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Columna Derecha (4 cols): Doble Realidad de Liquidez & Control de Créditos */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-4">
          {/* Card Doble Realidad de Liquidez */}
          <div className="app-card rounded-2xl p-5 shadow-md space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-white/5">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Wallet className="w-4 h-4 text-cyan-500" />
                Doble Realidad de Liquidez
              </h3>
              <span className="text-[10px] text-slate-400 font-semibold">Corte al día</span>
            </div>

            {/* Saldo en Plataformas */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 flex-shrink-0">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">Saldo en Plataformas</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    {isAppPositive ? 'Dinero a favor por dispersar' : 'Deuda acumulada por cobros en mano'}
                  </span>
                </div>
              </div>
              <span className={`text-base font-black ${isAppPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                {formatCurrency(summary.saldoApp)}
              </span>
            </div>

            {/* Efectivo Físico en Mano */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex-shrink-0">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">Efectivo en Mano</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Dinero físico disponible en calle</span>
                </div>
              </div>
              <span className="text-base font-black text-slate-900 dark:text-white">
                {formatCurrency(summary.efectivoEnMano)}
              </span>
            </div>
          </div>

          {/* Card Control de Cuotas del 10 y 30 */}
          <div className="app-card rounded-2xl p-5 shadow-md space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-white/5">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <CalendarClock className="w-4 h-4 text-cyan-500" />
                Cuotas (Días 10 y 30)
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-cyan-500/15 text-cyan-600 dark:text-cyan-400">
                Próximo Día {creditAnalysis.proximoDiaPago}
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Pendiente por pagar:</span>
                <b className="text-slate-900 dark:text-white">{formatCurrency(creditAnalysis.totalCuotasPendientes)}</b>
              </div>

              {/* Barra de Cobertura */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-400">Cobertura con ganancias:</span>
                  <b className={creditAnalysis.estaCubierto ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}>
                    {creditAnalysis.porcentajeCobertura}%
                  </b>
                </div>
                <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${Math.min(100, creditAnalysis.porcentajeCobertura)}%` }}
                    className={`h-full ${creditAnalysis.estaCubierto ? 'bg-emerald-500' : 'bg-amber-500'}`}
                  />
                </div>
              </div>

              {/* Veredicto */}
              <div className={`p-2.5 rounded-xl text-xs font-semibold ${
                creditAnalysis.estaCubierto
                  ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                  : 'bg-rose-500/15 text-rose-700 dark:text-rose-300'
              }`}>
                {creditAnalysis.estaCubierto ? (
                  <span>✅ ¡Cubierto! Te sobran {formatCurrency(creditAnalysis.diferencia)} de ganancia.</span>
                ) : (
                  <span>⚠️ Faltan {formatCurrency(Math.abs(creditAnalysis.diferencia))} para la cuota.</span>
                )}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-white/5 flex justify-between items-center text-xs">
              <span className="text-slate-400 text-[11px]">Vence en {creditAnalysis.diasRestantes} días</span>
              <Link to="/creditos" className="text-cyan-600 dark:text-cyan-400 font-bold hover:underline text-[11px] flex items-center gap-1">
                Administrar cuotas <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* 5. FILA 3: DISTRIBUCIONES ANALÍTICAS Y RENDIMIENTO EN RUTA (3 Columnas) */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {/* TARJETA 1: ¿De dónde vino mi dinero? (Distribución de Ingresos por Plataforma) */}
        <div className="app-card rounded-2xl p-5 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-white/5">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <PieChartIcon className="w-4 h-4 text-cyan-500" />
                ¿De dónde vino el dinero?
              </h3>
              <span className="text-[10px] text-slate-400 font-semibold">Por Plataforma</span>
            </div>

            <div className="h-44 w-full my-2 flex items-center justify-center">
              {incomeDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={incomeDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={72}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {incomeDistribution.map((entry, index) => (
                        <Cell key={`cell-inc-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: any) => formatCurrency(Number(val) || 0)}
                      contentStyle={{ backgroundColor: '#090e1a', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', fontSize: '11px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <span className="text-xs text-slate-400">Sin ingresos en este rango</span>
              )}
            </div>

            {/* Leyenda de Plataformas */}
            <div className="space-y-1.5 pt-1 max-h-36 overflow-y-auto pr-1">
              {incomeDistribution.map(item => (
                <div key={item.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="text-slate-700 dark:text-slate-300 font-medium truncate">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-2 font-bold flex-shrink-0">
                    <span className="text-slate-900 dark:text-white">{formatCurrency(item.value)}</span>
                    <span className="text-slate-400 text-[10px]">({item.percentage}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* TARJETA 2: ¿En qué se fue el dinero? (Distribución de Gastos por Rubro) */}
        <div className="app-card rounded-2xl p-5 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-white/5">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <PieChartIcon className="w-4 h-4 text-rose-500" />
                ¿En qué gasté?
              </h3>
              <span className="text-[10px] text-slate-400 font-semibold">Por Rubro</span>
            </div>

            <div className="h-44 w-full my-2 flex items-center justify-center">
              {expenseDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={expenseDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={72}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {expenseDistribution.map((entry, index) => (
                        <Cell key={`cell-exp-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: any) => formatCurrency(Number(val) || 0)}
                      contentStyle={{ backgroundColor: '#090e1a', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', fontSize: '11px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <span className="text-xs text-slate-400">Sin gastos en este rango</span>
              )}
            </div>

            {/* Leyenda de Gastos */}
            <div className="space-y-1.5 pt-1 max-h-36 overflow-y-auto pr-1">
              {expenseDistribution.map(item => (
                <div key={item.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="text-slate-700 dark:text-slate-300 font-medium truncate">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-2 font-bold flex-shrink-0">
                    <span className="text-rose-600 dark:text-rose-400">-{formatCurrency(item.value)}</span>
                    <span className="text-slate-400 text-[10px]">({item.percentage}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* TARJETA 3: Rendimiento y Productividad en Ruta */}
        <div className="app-card rounded-2xl p-5 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-white/5">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Clock className="w-4 h-4 text-cyan-500" />
                Productividad en Ruta
              </h3>
              <span className="text-[10px] text-cyan-600 dark:text-cyan-400 font-black">
                {prodMetrics.ratioProductividad}% ACTIVO
              </span>
            </div>

            {/* Comparativa Tiempos: Reparto vs Espera */}
            <div className="my-3 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Tiempo de Reparto:</span>
                <b className="text-cyan-600 dark:text-cyan-400">{formatMinutes(prodMetrics.minutosReparto)}</b>
              </div>
              <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
                <div
                  style={{ width: `${Math.min(100, prodMetrics.ratioProductividad)}%` }}
                  className="h-full bg-cyan-500"
                />
                <div
                  style={{ width: `${Math.min(100, 100 - prodMetrics.ratioProductividad)}%` }}
                  className="h-full bg-slate-400 dark:bg-slate-600"
                />
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Tiempo de Espera:</span>
                <b className="text-slate-600 dark:text-slate-400">{formatMinutes(prodMetrics.minutosEspera)}</b>
              </div>
            </div>

            {/* Grid de Métricas Operativas */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-white/5">
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-white/5">
                <span className="text-[10px] text-slate-400 block font-semibold">Total Servicios</span>
                <b className="text-sm text-slate-900 dark:text-white block mt-0.5">
                  {prodMetrics.totalServicios} entregas
                </b>
                <span className="text-[10px] text-cyan-600 dark:text-cyan-400 font-semibold">
                  {prodMetrics.serviciosPorHora} serv/h
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-white/5">
                <span className="text-[10px] text-slate-400 block font-semibold">Odómetro Total</span>
                <b className="text-sm text-slate-900 dark:text-white block mt-0.5">
                  {prodMetrics.kilometrosTotales.toFixed(0)} km
                </b>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                  {formatCurrency(prodMetrics.rendimientoKm)} / km
                </span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-xs text-slate-400">
            <span>Horas Totales: <b>{formatMinutes(prodMetrics.minutosReparto + prodMetrics.minutosEspera)}</b></span>
            <Link to="/turnos" className="text-cyan-600 dark:text-cyan-400 font-bold hover:underline text-[11px] flex items-center gap-1">
              Ver turnos <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
