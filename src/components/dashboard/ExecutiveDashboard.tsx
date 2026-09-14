import React, { useState, useMemo } from 'react';
import { useAppData } from '../../context/AppDataContext';
import {
  formatCurrency,
  formatMinutes,
  getLocalDateString,
  comparePeriods,
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
  ArrowRight,
  Sparkles,
  PieChart as PieChartIcon,
  ShieldCheck,
  AlertTriangle,
  Lightbulb,
  DollarSign,
  HeartPulse,
  CreditCard
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip
} from 'recharts';
import { TimeRangeFilter } from './TimeRangeFilter';
import { ChartsSection } from './ChartsSection';

export const ExecutiveDashboard: React.FC = () => {
  const {
    summary,
    creditAnalysis,
    filteredTransactions,
    transactions,
    filteredShifts,
    shifts,
    filter,
    threeTierFinancials,
    laborBenchmark,
    smartInsights,
    creditCards,
    creditCardAnalysis
  } = useAppData();

  // Métricas avanzadas reales de productividad
  const prodMetrics = useMemo(() => {
    return getProductivityDeepMetrics(filteredShifts, filteredTransactions, summary);
  }, [filteredShifts, filteredTransactions, summary]);

  // Comparación entre períodos con narrativa humana
  const periodComparison = useMemo(() => {
    if (filter.range === 'historico') return null;
    const now = new Date();
    let prevStart = '';
    let prevEnd = '';
    let periodName = 'período';

    if (filter.range === 'mes') {
      periodName = 'Mes actual vs Mes anterior';
      const curYear = now.getFullYear();
      const curMonth = now.getMonth();
      const prevMonthDate = new Date(curYear, curMonth - 1, 1, 12, 0, 0);
      const prevYear = prevMonthDate.getFullYear();
      const prevMonth = prevMonthDate.getMonth();
      const lastDayPrev = new Date(prevYear, prevMonth + 1, 0).getDate();
      prevStart = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-01`;
      prevEnd = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(lastDayPrev).padStart(2, '0')}`;
    } else if (filter.range === 'semana') {
      periodName = 'Esta semana vs Semana anterior';
      const dayOfWeek = now.getDay();
      const distToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      const curMon = new Date(now.getFullYear(), now.getMonth(), now.getDate() - distToMonday, 12, 0, 0);
      const prevMon = new Date(curMon.getFullYear(), curMon.getMonth(), curMon.getDate() - 7, 12, 0, 0);
      const prevSun = new Date(curMon.getFullYear(), curMon.getMonth(), curMon.getDate() - 1, 12, 0, 0);
      prevStart = getLocalDateString(prevMon);
      prevEnd = getLocalDateString(prevSun);
    } else if (filter.range === 'hoy') {
      periodName = 'Hoy vs Ayer';
      const yest = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 12, 0, 0);
      prevStart = getLocalDateString(yest);
      prevEnd = prevStart;
    }

    if (!prevStart || !prevEnd) return null;

    const prevTx = transactions.filter(t => t.fecha >= prevStart && t.fecha <= prevEnd);
    const prevSh = shifts.filter(s => s.fecha >= prevStart && s.fecha <= prevEnd);
    return comparePeriods(filteredTransactions, prevTx, filteredShifts, prevSh, periodName);
  }, [filter.range, transactions, shifts, filteredTransactions, filteredShifts]);

  // Distribuciones de ingresos y egresos para gráficos de dona
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

  return (
    <div className="w-full max-w-[1600px] mx-auto space-y-5 px-1 sm:px-2">
      {/* 1. Selector de Rango Temporal Contextual */}
      <TimeRangeFilter />

      {/* 2. Alerta de Cuota si está próxima */}
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

      {/* 3. MODELO FINANCIERO DE 3 NIVELES (Estructura de Capital para Repartidores) */}
      <div className="app-card rounded-3xl p-5 shadow-lg border border-cyan-500/20 bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-950 text-white relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
              Modelo Financiero de 3 Niveles
            </span>
            <h2 className="text-base sm:text-lg font-black text-white mt-0.5">
              Radiografía Financiera de tu Actividad
            </h2>
          </div>
          <Link
            to="/salud-financiera"
            className="inline-flex items-center gap-1.5 text-xs font-extrabold text-cyan-400 hover:text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/20 px-3 py-1.5 rounded-xl border border-cyan-500/30 transition-all self-start sm:self-auto"
          >
            <HeartPulse className="w-3.5 h-3.5" />
            Ver Salud Financiera Completa →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
          {/* Nivel A: Resultado Operativo */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase text-slate-400">Nivel A • Operativo</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-extrabold px-2 py-0.5 rounded-full">
                  Margen {threeTierFinancials.margenOperativoPct}%
                </span>
              </div>
              <h4 className="text-xs font-extrabold text-slate-200 mt-1">¿Repartir es rentable?</h4>
              <p className="text-2xl font-black text-emerald-400 mt-2">
                {formatCurrency(threeTierFinancials.resultadoOperativo)}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Ingresos operativos ({formatCurrency(threeTierFinancials.ingresosOperativos)}) menos costos de ruta ({formatCurrency(threeTierFinancials.gastosOperativos)}).
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-white/5 text-[10px] text-slate-400 flex justify-between">
              <span>Combustible + Jhony:</span>
              <b className="text-slate-300">{formatCurrency(threeTierFinancials.gastosOperativos)}</b>
            </div>
          </div>

          {/* Nivel B: Después de Obligaciones */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase text-slate-400">Nivel B • Obligaciones</span>
                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                  threeTierFinancials.resultadoDespuesObligaciones >= 0 ? 'bg-cyan-500/20 text-cyan-400' : 'bg-rose-500/20 text-rose-400'
                }`}>
                  {threeTierFinancials.resultadoDespuesObligaciones >= 0 ? 'Superávit' : 'Déficit'}
                </span>
              </div>
              <h4 className="text-xs font-extrabold text-slate-200 mt-1">Tras pagar cuotas y tarjetas</h4>
              <p className={`text-2xl font-black mt-2 ${
                threeTierFinancials.resultadoDespuesObligaciones >= 0 ? 'text-white' : 'text-rose-400'
              }`}>
                {formatCurrency(threeTierFinancials.resultadoDespuesObligaciones)}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                {threeTierFinancials.totalObligacionesDeuda > 0
                  ? `Se descuentan ${formatCurrency(threeTierFinancials.totalObligacionesDeuda)} en compromisos pactados del mes.`
                  : 'Sin deudas o cuotas pactadas pendientes para este período.'}
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-white/5 text-[10px] text-slate-400 flex justify-between">
              <span>Cuotas + Tarjetas:</span>
              <b className="text-slate-300">{formatCurrency(threeTierFinancials.totalObligacionesDeuda)}</b>
            </div>
          </div>

          {/* Nivel C: Flujo de Caja Disponible */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-cyan-950/40 to-slate-900 border border-cyan-500/30 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase text-cyan-400">Nivel C • Flujo Disponible</span>
                <span className="text-[10px] bg-cyan-500/20 text-cyan-300 font-extrabold px-2 py-0.5 rounded-full">
                  Libre
                </span>
              </div>
              <h4 className="text-xs font-extrabold text-slate-200 mt-1">Para ahorro o imprevistos</h4>
              <p className="text-2xl font-black text-cyan-400 mt-2">
                {formatCurrency(threeTierFinancials.flujoDisponible)}
              </p>
              <p className="text-[11px] text-slate-300 mt-1">
                Dinero efectivamente libre para alimentar tu fondo de emergencia, realizar abonos o compras familiares.
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-cyan-500/20 text-[10px] text-cyan-200 flex justify-between">
              <span>Efectivo en mano:</span>
              <b className="text-white">{formatCurrency(summary.efectivoEnMano)}</b>
            </div>
          </div>
        </div>
      </div>

      {/* 4. FILA 1: HERO METRICS (4 Tarjetas Principales) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* HERO 1: Ganancia Limpia */}
        <div className="app-card rounded-2xl p-5 border-l-4 border-l-cyan-500 shadow-md flex flex-col justify-between">
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
              Dinero disponible tras restar combustible, acompañante y ruta
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
              {prodMetrics.totalServicios} entregas / servicios registrados
            </p>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-xs text-slate-500">
            <span>Ticket Promedio:</span>
            <b className="text-slate-900 dark:text-white">{formatCurrency(prodMetrics.ingresoPorServicio)} / serv</b>
          </div>
        </div>

        {/* HERO 3: Gastos Operativos (Con Jhony) */}
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
              Gasolina, Jhony (acompañante), mantenimiento y comidas
            </p>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-xs text-slate-500">
            <span>Costo por Hora:</span>
            <b className="text-slate-900 dark:text-white">-{formatCurrency(prodMetrics.costoPorHora)} / h</b>
          </div>
        </div>

        {/* HERO 4: Rendimiento Horario vs Benchmark */}
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
              <span className="text-xs font-normal text-slate-400"> / hora</span>
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Referencia ordinaria: <b className="text-purple-600 dark:text-purple-400">${formatCurrency(laborBenchmark.referenciaHora)}/h</b>
            </p>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-xs text-slate-500">
            <span>Jornada acumulada:</span>
            <b className="text-slate-900 dark:text-white">{laborBenchmark.horasTotalesTrabajadas}h ({laborBenchmark.porcentajeReferenciaMensual}%)</b>
          </div>
        </div>
      </div>

      {/* 5. DIAGNÓSTICO INTELIGENTE Y RECOMENDACIONES (Smart Insights 🟢 🟡 🔴 💡) */}
      <div className="app-card rounded-3xl p-5 shadow-md border border-slate-200 dark:border-white/5 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-white/5">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
              Tu Situación Este Período • Copiloto RiderLedger
            </h3>
          </div>
          <span className="text-[10px] text-slate-400 font-bold">
            {smartInsights.length} diagnósticos clave
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {smartInsights.map((insight) => (
            <div
              key={insight.id}
              className={`p-3.5 rounded-2xl border text-xs space-y-1.5 transition-all ${
                insight.tipo === 'positivo'
                  ? 'bg-emerald-500/5 border-emerald-500/20 text-slate-800 dark:text-slate-200'
                  : insight.tipo === 'peligro'
                  ? 'bg-rose-500/5 border-rose-500/20 text-slate-800 dark:text-slate-200'
                  : insight.tipo === 'alerta'
                  ? 'bg-amber-500/5 border-amber-500/20 text-slate-800 dark:text-slate-200'
                  : 'bg-cyan-500/5 border-cyan-500/20 text-slate-800 dark:text-slate-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-extrabold flex items-center gap-1.5 text-slate-900 dark:text-white">
                  <span>{insight.badge}</span>
                  {insight.titulo}
                </span>
              </div>
              <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
                {insight.descripcion}
              </p>
              {insight.accionSugerida && (
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium italic pt-1 border-t border-slate-200/40 dark:border-white/5">
                  💡 {insight.accionSugerida}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 6. COMPARACIÓN CON EL PERÍODO ANTERIOR Y NARRATIVA HUMANA */}
      {periodComparison && (
        <div className="app-card rounded-3xl p-5 shadow-md border border-slate-200 dark:border-white/5 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-white/5">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Evolución Temporal
              </span>
              <h3 className="text-sm font-black text-slate-900 dark:text-white">
                {periodComparison.periodoActualNombre}
              </h3>
            </div>
            <div className="flex items-center gap-3 text-xs font-bold">
              <span className={periodComparison.variacionIngresosPct >= 0 ? 'text-emerald-500' : 'text-rose-500'}>
                Ingresos: {periodComparison.variacionIngresosPct >= 0 ? '+' : ''}{periodComparison.variacionIngresosPct}%
              </span>
              <span className={periodComparison.variacionSuperavitPct >= 0 ? 'text-cyan-500' : 'text-rose-500'}>
                Superávit: {periodComparison.variacionSuperavitPct >= 0 ? '+' : ''}{periodComparison.variacionSuperavitPct}%
              </span>
            </div>
          </div>

          {/* Narrativa Humana */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-white/5 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
            <p>🗣️ {periodComparison.explicacionNarrativa}</p>
          </div>
        </div>
      )}

      {/* 7. SECCIÓN DE GRÁFICAS VISUALES (Strict Calendar Week / Month sin slice) */}
      <ChartsSection />

      {/* 8. DOBLE REALIDAD DE LIQUIDEZ Y CONTROL DE TARJETAS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Doble Realidad de Liquidez (6 cols) */}
        <div className="lg:col-span-6 app-card rounded-2xl p-5 shadow-md space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-white/5">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Wallet className="w-4 h-4 text-cyan-500" />
              Doble Realidad de Liquidez
            </h3>
            <span className="text-[10px] text-slate-400 font-semibold">Corte al instante</span>
          </div>

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

        {/* Control de Tarjetas y Cuentas Revolventes (6 cols) */}
        <div className="lg:col-span-6 app-card rounded-2xl p-5 shadow-md space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-white/5">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-purple-500" />
              Tarjetas de Crédito y Cuentas
            </h3>
            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${
              creditCardAnalysis.semaforoUtilizacion === 'VERDE'
                ? 'bg-emerald-500/15 text-emerald-500'
                : creditCardAnalysis.semaforoUtilizacion === 'AMARILLO'
                ? 'bg-amber-500/15 text-amber-500'
                : 'bg-rose-500/15 text-rose-500'
            }`}>
              {creditCardAnalysis.utilizacionGlobalPct}% Utilización
            </span>
          </div>

          {creditCards.length > 0 ? (
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Saldo utilizado total:</span>
                <b className="text-rose-500">{formatCurrency(creditCardAnalysis.deudaTotalTarjetas)}</b>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Cupo total disponible:</span>
                <b className="text-emerald-500">{formatCurrency(creditCardAnalysis.cupoDisponibleTotal)}</b>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-white/5 text-[11px] text-slate-400">
                ⚠️ {creditCardAnalysis.advertenciaPagoMinimo}
              </div>
            </div>
          ) : (
            <div className="py-4 text-center text-xs text-slate-500">
              No tienes tarjetas registradas.{' '}
              <Link to="/creditos" className="text-cyan-500 font-bold hover:underline">
                Añadir tarjeta →
              </Link>
            </div>
          )}

          <div className="pt-2 border-t border-slate-100 dark:border-white/5 flex justify-between items-center text-xs">
            <span className="text-slate-400 text-[11px]">{creditCards.length} cuentas registradas</span>
            <Link to="/creditos" className="text-cyan-600 dark:text-cyan-400 font-bold hover:underline text-[11px] flex items-center gap-1">
              Ver créditos y tarjetas <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* 9. DISTRIBUCIÓN DE INGRESOS, GASTOS Y PRODUCTIVIDAD */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {/* Distribución de Ingresos */}
        <div className="app-card rounded-2xl p-5 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-white/5">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <PieChartIcon className="w-4 h-4 text-cyan-500" />
                Ingresos por Plataforma
              </h3>
            </div>

            <div className="h-44 w-full my-2 flex items-center justify-center">
              {incomeDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={incomeDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={48}
                      outerRadius={68}
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

        {/* Distribución de Gastos */}
        <div className="app-card rounded-2xl p-5 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-white/5">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <PieChartIcon className="w-4 h-4 text-rose-500" />
                Gastos por Rubro
              </h3>
            </div>

            <div className="h-44 w-full my-2 flex items-center justify-center">
              {expenseDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={expenseDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={48}
                      outerRadius={68}
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

        {/* Productividad y Tiempos de Reparto */}
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

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-white/5">
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-white/5">
                <span className="text-[10px] text-slate-400 block font-semibold">Total Servicios</span>
                <b className="text-sm text-slate-900 dark:text-white block mt-0.5">
                  {prodMetrics.totalServicios} entregas
                </b>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-white/5">
                <span className="text-[10px] text-slate-400 block font-semibold">Odómetro Total</span>
                <b className="text-sm text-slate-900 dark:text-white block mt-0.5">
                  {prodMetrics.kilometrosTotales.toFixed(0)} km
                </b>
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
