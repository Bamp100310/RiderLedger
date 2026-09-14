import React, { useMemo } from 'react';
import { useAppData } from '../../context/AppDataContext';
import {
  formatCurrency,
  getLocalDateString,
  comparePeriods
} from '../../lib/calculations';
import {
  TrendingUp,
  TrendingDown,
  CalendarClock,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  Lightbulb,
  DollarSign,
  HeartPulse,
  CreditCard,
  Bike,
  FileSpreadsheet
} from 'lucide-react';
import { Link } from 'react-router-dom';
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
    creditCardAnalysis
  } = useAppData();

  // Comparación contextual con el período anterior
  const periodComparison = useMemo(() => {
    if (filter.range === 'historico') return null;
    const ref = new Date(filter.referenceDate || getLocalDateString());
    let prevStart = '';
    let prevEnd = '';
    let periodName = 'período';

    if (filter.range === 'mes') {
      periodName = 'Mes actual vs Mes anterior';
      const curYear = ref.getFullYear();
      const curMonth = ref.getMonth();
      const prevMonthDate = new Date(curYear, curMonth - 1, 1, 12, 0, 0);
      const prevYear = prevMonthDate.getFullYear();
      const prevMonth = prevMonthDate.getMonth();
      const lastDayPrev = new Date(prevYear, prevMonth + 1, 0).getDate();
      prevStart = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-01`;
      prevEnd = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(lastDayPrev).padStart(2, '0')}`;
    } else if (filter.range === 'semana') {
      periodName = 'Esta semana vs Semana anterior';
      const dayOfWeek = ref.getDay();
      const distToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      const curMon = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate() - distToMonday, 12, 0, 0);
      const prevMon = new Date(curMon.getFullYear(), curMon.getMonth(), curMon.getDate() - 7, 12, 0, 0);
      const prevSun = new Date(curMon.getFullYear(), curMon.getMonth(), curMon.getDate() - 1, 12, 0, 0);
      prevStart = getLocalDateString(prevMon);
      prevEnd = getLocalDateString(prevSun);
    } else if (filter.range === 'hoy') {
      periodName = 'Hoy vs Ayer';
      const yest = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate() - 1, 12, 0, 0);
      prevStart = getLocalDateString(yest);
      prevEnd = prevStart;
    } else if (filter.range === 'año') {
      periodName = 'Año actual vs Año anterior';
      const prevYear = ref.getFullYear() - 1;
      prevStart = `${prevYear}-01-01`;
      prevEnd = `${prevYear}-12-31`;
    }

    if (!prevStart || !prevEnd) return null;

    const prevTx = transactions.filter(t => t.fecha >= prevStart && t.fecha <= prevEnd);
    const prevSh = shifts.filter(s => s.fecha >= prevStart && s.fecha <= prevEnd);
    return comparePeriods(filteredTransactions, prevTx, filteredShifts, prevSh, periodName);
  }, [filter, transactions, shifts, filteredTransactions, filteredShifts]);

  // Selección de 1 a 2 recomendaciones de máxima prioridad para no sobrecargar
  const topRecommendations = useMemo(() => {
    return smartInsights.slice(0, 2);
  }, [smartInsights]);

  const isNetPositive = threeTierFinancials.flujoDisponible >= 0;

  return (
    <div className="w-full max-w-7xl mx-auto space-y-5 px-1 sm:px-2 pb-24">
      {/* 1. NAVEGADOR TEMPORAL UNIVERSAL (← Período Focal →) */}
      <TimeRangeFilter />

      {/* Alerta si hay vencimiento de cuota de crédito cercano */}
      {creditAnalysis.alertaVencimientoCercano && (
        <div
          className={`p-3 sm:p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm transition-all ${
            creditAnalysis.estaCubierto
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-200'
              : 'bg-amber-500/10 border-amber-500/30 text-amber-800 dark:text-amber-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div
              className={`p-2 rounded-xl shrink-0 ${
                creditAnalysis.estaCubierto
                  ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                  : 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
              }`}
            >
              <CalendarClock className="w-4 h-4" />
            </div>
            <div className="text-xs">
              <p className="font-extrabold uppercase tracking-wider">
                {creditAnalysis.esHoy
                  ? `¡Hoy es día ${creditAnalysis.proximoDiaPago} de pago!`
                  : `Vencimiento próximo: Día ${creditAnalysis.proximoDiaPago} (faltan ${creditAnalysis.diasRestantes} días)`}
              </p>
              <p className="text-slate-600 dark:text-slate-300 mt-0.5">
                Total cuotas: <b>{formatCurrency(creditAnalysis.totalCuotasPendientes)}</b> |{' '}
                {creditAnalysis.estaCubierto ? (
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                    Cubierto con tu superávit.
                  </span>
                ) : (
                  <span className="text-rose-600 dark:text-rose-400 font-bold">
                    Faltan {formatCurrency(Math.abs(creditAnalysis.diferencia))} para cubrir tus compromisos.
                  </span>
                )}
              </p>
            </div>
          </div>
          <Link
            to="/creditos"
            className="text-xs font-bold text-cyan-500 hover:text-cyan-400 whitespace-nowrap self-start sm:self-center"
          >
            Ver Cuotas →
          </Link>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. RESUMEN EN 5 SEGUNDOS (HERO STRIP DE 4 CIFRAS CLAVE)                  */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* KPI 1: Ingresos Totales */}
        <div className="app-card rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-sm">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">
              Ingresos del Período
            </span>
            <p className="text-xl sm:text-2xl lg:text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1 truncate">
              {formatCurrency(summary.ingresosTotales)}
            </p>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 dark:border-white/5 text-[11px] text-slate-500 dark:text-slate-400 truncate">
            Ruta: <b>{formatCurrency(summary.ingresosOperativos)}</b>
          </div>
        </div>

        {/* KPI 2: Gastos Totales */}
        <div className="app-card rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-sm">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-rose-600 dark:text-rose-400 block">
              Gastos del Período
            </span>
            <p className="text-xl sm:text-2xl lg:text-3xl font-black text-rose-600 dark:text-rose-400 mt-1 truncate">
              {formatCurrency(summary.gastosTotales)}
            </p>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 dark:border-white/5 text-[11px] text-slate-500 dark:text-slate-400 truncate">
            Costos Ruta: <b>{formatCurrency(summary.gastosOperativos)}</b>
          </div>
        </div>

        {/* KPI 3: Flujo Disponible Real */}
        <div className="app-card rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-sm border-l-4 border-l-cyan-500">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-cyan-600 dark:text-cyan-400 block">
                Flujo Disponible
              </span>
              <span
                className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                  isNetPositive
                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                    : 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                }`}
              >
                {isNetPositive ? 'Superávit' : 'Déficit'}
              </span>
            </div>
            <p
              className={`text-xl sm:text-2xl lg:text-3xl font-black mt-1 truncate ${
                isNetPositive ? 'text-slate-900 dark:text-white' : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {formatCurrency(threeTierFinancials.flujoDisponible)}
            </p>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 dark:border-white/5 text-[11px] text-slate-500 dark:text-slate-400 truncate flex justify-between">
            <span>Efectivo: <b>{formatCurrency(summary.efectivoEnMano)}</b></span>
          </div>
        </div>

        {/* KPI 4: Rendimiento Operativo por Hora */}
        <div className="app-card rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-sm">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-purple-600 dark:text-purple-400 block">
              Rendimiento Operativo / h
            </span>
            <p className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 dark:text-white mt-1 truncate">
              {summary.rendimientoOperativoPorHora !== null
                ? `${formatCurrency(summary.rendimientoOperativoPorHora)}/h`
                : 'No disponible'}
            </p>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 dark:border-white/5 text-[11px] text-slate-500 dark:text-slate-400 truncate flex justify-between">
            <span>Facturación:</span>
            <b>{summary.facturacionBrutaPorHora !== null ? `${formatCurrency(summary.facturacionBrutaPorHora)}/h` : 'N/A'}</b>
          </div>
        </div>
      </div>

      {/* Si el período es 'Mes', mostrar indicador informativo de planificación */}
      {filter.range === 'mes' && threeTierFinancials.obligacionesMensualesPactadas > 0 && (
        <div className="bg-slate-900/60 border border-white/5 rounded-xl px-4 py-2 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-400 gap-1">
          <span>
            📋 <b>Planificación mensual:</b> Obligaciones fijas pactadas del mes:{' '}
            <b className="text-slate-200">{formatCurrency(threeTierFinancials.obligacionesMensualesPactadas)}</b>
          </span>
          <span className="text-[11px] text-slate-400">
            Pagos reales registrados este mes: <b className="text-emerald-400">{formatCurrency(threeTierFinancials.pagosDeudaEfectivosPeriodo)}</b>
          </span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. TENDENCIA: EVOLUCIÓN VISUAL LIMPIA (GRÁFICA QUE RESPONDE PREGUNTAS)   */}
      {/* ========================================================================= */}
      <ChartsSection />

      {/* ========================================================================= */}
      {/* 4. DIAGNÓSTICO: ¿CÓMO VOY ESTE PERÍODO? & RECOMENDACIONES CLAVE          */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Variaciones vs Período Anterior */}
        <div className="app-card rounded-2xl p-5 lg:col-span-2 space-y-3 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-cyan-400" />
                ¿Cómo vas frente al período anterior?
              </h3>
              {periodComparison && (
                <span className="text-[10px] text-slate-500 font-semibold">
                  {periodComparison.periodoAnteriorNombre}
                </span>
              )}
            </div>

            {/* 4 Pills de Variación */}
            {periodComparison ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-3">
                <div className="bg-slate-900/50 p-2.5 rounded-xl border border-white/5">
                  <span className="text-[10px] text-slate-400 block">Ingresos</span>
                  <span
                    className={`text-sm font-black ${
                      periodComparison.variacionIngresosPct >= 0
                        ? 'text-emerald-400'
                        : 'text-rose-400'
                    }`}
                  >
                    {periodComparison.variacionIngresosPct >= 0 ? '+' : ''}
                    {periodComparison.variacionIngresosPct}%
                  </span>
                </div>

                <div className="bg-slate-900/50 p-2.5 rounded-xl border border-white/5">
                  <span className="text-[10px] text-slate-400 block">Gastos</span>
                  <span
                    className={`text-sm font-black ${
                      periodComparison.variacionGastosPct <= 0
                        ? 'text-emerald-400'
                        : 'text-rose-400'
                    }`}
                  >
                    {periodComparison.variacionGastosPct >= 0 ? '+' : ''}
                    {periodComparison.variacionGastosPct}%
                  </span>
                </div>

                <div className="bg-slate-900/50 p-2.5 rounded-xl border border-white/5">
                  <span className="text-[10px] text-slate-400 block">Superávit</span>
                  <span
                    className={`text-sm font-black ${
                      periodComparison.variacionSuperavitPct >= 0
                        ? 'text-emerald-400'
                        : 'text-rose-400'
                    }`}
                  >
                    {periodComparison.variacionSuperavitPct >= 0 ? '+' : ''}
                    {periodComparison.variacionSuperavitPct}%
                  </span>
                </div>

                <div className="bg-slate-900/50 p-2.5 rounded-xl border border-white/5">
                  <span className="text-[10px] text-slate-400 block">Tarjetas</span>
                  <span
                    className={`text-sm font-black ${
                      creditCardAnalysis.semaforoUtilizacion === 'VERDE'
                        ? 'text-emerald-400'
                        : creditCardAnalysis.semaforoUtilizacion === 'AMARILLO'
                        ? 'text-amber-400'
                        : 'text-rose-400'
                    }`}
                  >
                    {creditCardAnalysis.tarjetas.length > 0
                      ? `${creditCardAnalysis.utilizacionGlobalPct}%`
                      : 'Sin deuda'}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400 pt-3">
                No hay suficiente historial del período anterior para calcular variaciones comparativas.
              </p>
            )}
          </div>

          {periodComparison && (
            <p className="text-xs text-slate-300 bg-slate-950/40 p-3 rounded-xl border border-white/5 leading-relaxed">
              {periodComparison.explicacionNarrativa}
            </p>
          )}
        </div>

        {/* 1-2 Recomendaciones Accionables Máximas */}
        <div className="app-card rounded-2xl p-5 space-y-3 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Lightbulb className="w-4 h-4 text-amber-400" />
              Prioridades para este período
            </h3>

            <div className="space-y-2.5 pt-3">
              {topRecommendations.map(rec => (
                <div
                  key={rec.id}
                  className="p-3 rounded-xl bg-slate-900/60 border border-white/5 space-y-1"
                >
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs">{rec.badge}</span>
                    <h4 className="text-xs font-bold text-white truncate">{rec.titulo}</h4>
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-snug">
                    {rec.descripcion}
                  </p>
                </div>
              ))}

              {topRecommendations.length === 0 && (
                <div className="p-3 rounded-xl bg-slate-900/40 text-xs text-slate-400">
                  Operación equilibrada sin alertas críticas de deuda o sobrecarga.
                </div>
              )}
            </div>
          </div>

          <Link
            to="/salud-financiera"
            className="inline-flex items-center gap-1 text-xs font-bold text-cyan-400 hover:text-cyan-300 pt-1"
          >
            Ver análisis y diagnóstico completo →
          </Link>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. DETALLE: ACCESO RÁPIDO A VISTAS ESPECIALIZADAS                         */}
      {/* ========================================================================= */}
      <div className="pt-2">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3">
          Profundizar en tu información
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Link
            to="/salud-financiera"
            className="app-card rounded-2xl p-3.5 hover:border-cyan-500/40 transition-all flex items-center gap-3 group"
          >
            <div className="p-2.5 rounded-xl bg-cyan-500/15 text-cyan-400 group-hover:scale-105 transition-transform">
              <HeartPulse className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-bold text-white truncate">Salud Financiera</h4>
              <p className="text-[10px] text-slate-400 truncate">Copiloto & 50/30/20</p>
            </div>
          </Link>

          <Link
            to="/turnos"
            className="app-card rounded-2xl p-3.5 hover:border-emerald-500/40 transition-all flex items-center gap-3 group"
          >
            <div className="p-2.5 rounded-xl bg-emerald-500/15 text-emerald-400 group-hover:scale-105 transition-transform">
              <Bike className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-bold text-white truncate">Jornadas & Km</h4>
              <p className="text-[10px] text-slate-400 truncate">Horas y kilometraje</p>
            </div>
          </Link>

          <Link
            to="/creditos"
            className="app-card rounded-2xl p-3.5 hover:border-purple-500/40 transition-all flex items-center gap-3 group"
          >
            <div className="p-2.5 rounded-xl bg-purple-500/15 text-purple-400 group-hover:scale-105 transition-transform">
              <CreditCard className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-bold text-white truncate">Tarjetas & Cuotas</h4>
              <p className="text-[10px] text-slate-400 truncate">Gestión de pasivos</p>
            </div>
          </Link>

          <Link
            to="/reportes"
            className="app-card rounded-2xl p-3.5 hover:border-amber-500/40 transition-all flex items-center gap-3 group"
          >
            <div className="p-2.5 rounded-xl bg-amber-500/15 text-amber-400 group-hover:scale-105 transition-transform">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-bold text-white truncate">Reportes</h4>
              <p className="text-[10px] text-slate-400 truncate">Consolidado y exportar</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};
