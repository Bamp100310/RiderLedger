import React, { useState, useMemo } from 'react';
import { useAppData } from '../../context/AppDataContext';
import {
  formatCurrency,
  recommendSaveVsPayDebt
} from '../../lib/calculations';
import {
  HeartPulse,
  ShieldCheck,
  TrendingDown,
  Clock,
  Activity,
  AlertTriangle,
  PiggyBank,
  DollarSign,
  ChevronDown,
  ChevronUp,
  Scale,
  Layers,
  Sparkles,
  Sliders,
  CheckCircle2,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const FinancialHealthView: React.FC = () => {
  const {
    summary,
    threeTierFinancials,
    laborBenchmark,
    expenseHealth,
    creditCardAnalysis,
    creditAnalysis,
    credits,
    creditCards,
    financialSettings
  } = useAppData();

  // Estados UI
  const [showSimulator, setShowSimulator] = useState<boolean>(false);
  const [customSurplusInput, setCustomSurplusInput] = useState<string>('');
  const [showMethodology, setShowMethodology] = useState<boolean>(false);

  // 1. Cálculo del Score Secundario (0 a 100)
  const healthScore = useMemo(() => {
    let score = 50; // base neutra

    // Rendimiento por hora vs benchmark ($9.620/h) (+/- 20 pts)
    if (laborBenchmark.ingresoNetoEfectivoPorHora >= laborBenchmark.referenciaHora * 1.2) {
      score += 20;
    } else if (laborBenchmark.ingresoNetoEfectivoPorHora >= laborBenchmark.referenciaHora) {
      score += 12;
    } else if (laborBenchmark.ingresoNetoEfectivoPorHora >= laborBenchmark.referenciaHora * 0.7) {
      score += 0;
    } else {
      score -= 15;
    }

    // Sobrecarga laboral (+/- 15 pts)
    if (laborBenchmark.estadoCargaLaboral === 'NORMAL') {
      score += 10;
    } else if (laborBenchmark.estadoCargaLaboral === 'ALTA') {
      score += 2;
    } else if (laborBenchmark.estadoCargaLaboral === 'MUY_ALTA') {
      score -= 8;
    } else if (laborBenchmark.estadoCargaLaboral === 'CRITICA') {
      score -= 15;
    }

    // Absorción de gastos vs ingresos (+/- 15 pts)
    if (expenseHealth.ratioGastoIngresoPct <= 60 && summary.ingresosTotales > 0) {
      score += 15;
    } else if (expenseHealth.ratioGastoIngresoPct <= 80) {
      score += 5;
    } else if (expenseHealth.ratioGastoIngresoPct > 90) {
      score -= 15;
    }

    // Utilización de tarjetas de crédito (+/- 15 pts)
    if (creditCardAnalysis.tarjetas.length > 0) {
      if (creditCardAnalysis.semaforoUtilizacion === 'VERDE') {
        score += 15;
      } else if (creditCardAnalysis.semaforoUtilizacion === 'AMARILLO') {
        score -= 5;
      } else {
        score -= 15;
      }
    } else {
      score += 5;
    }

    // Cobertura de cuotas fijas (+/- 15 pts)
    if (creditAnalysis.estaCubierto) {
      score += 15;
    } else if (creditAnalysis.totalCuotasPendientes > 0) {
      score -= 10;
    }

    return Math.max(10, Math.min(100, Math.round(score)));
  }, [laborBenchmark, expenseHealth, summary.ingresosTotales, creditCardAnalysis, creditAnalysis]);

  // 2. Estado Cualitativo Principal: ESTABLE | PRECAUCIÓN | CRÍTICO (Regla 6)
  const qualitativeStatus = useMemo(() => {
    if (healthScore >= 70 && threeTierFinancials.flujoDisponible > 0) {
      return {
        key: 'ESTABLE',
        label: 'ESTABLE',
        color: 'emerald',
        badgeClass: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
        cardBorder: 'border-emerald-500/30',
        icon: '🟢',
        resumen: 'Finanzas equilibradas con margen operativo saludable y bajo estrés de endeudamiento.'
      };
    }
    if (healthScore >= 45 && threeTierFinancials.flujoDisponible >= 0) {
      return {
        key: 'PRECAUCION',
        label: 'PRECAUCIÓN',
        color: 'amber',
        badgeClass: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
        cardBorder: 'border-amber-500/30',
        icon: '🟡',
        resumen: 'Existen puntos de fricción: costos de ruta elevados, cuotas ajustadas o sobrecarga de horas.'
      };
    }
    return {
      key: 'CRITICO',
      label: 'CRÍTICO',
      color: 'rose',
      badgeClass: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30',
      cardBorder: 'border-rose-500/30',
      icon: '🔴',
      resumen: 'Déficit de flujo o alto riesgo financiero. Prioridad inmediata: contener gastos y evitar nuevo endeudamiento.'
    };
  }, [healthScore, threeTierFinancials.flujoDisponible]);

  // 3. Recomendación de Ahorro vs Deuda (Regla 7: DÉFICIT y no inventar tasas)
  const decisionResult = useMemo(() => {
    const parsed = parseFloat(customSurplusInput);
    const amount = !isNaN(parsed) && parsed > 0 ? parsed : Math.max(0, threeTierFinancials.flujoDisponible);
    return recommendSaveVsPayDebt(
      amount,
      credits,
      creditCards,
      financialSettings.metaAhorroMensual || 300000,
      threeTierFinancials.gastosOperativos,
      financialSettings
    );
  }, [customSurplusInput, threeTierFinancials.flujoDisponible, credits, creditCards, financialSettings, threeTierFinancials.gastosOperativos]);

  const budgetChartData = useMemo(() => {
    return [
      { name: 'Costos Ruta / Operativos', porcentaje: expenseHealth.porcentajeNecesidadesReal, referencia: financialSettings.porcentajeNecesidadesRef || 50, fill: '#0284c7' },
      { name: 'Gastos Personales', porcentaje: expenseHealth.porcentajeDeseosReal, referencia: financialSettings.porcentajeDeseosRef || 30, fill: '#ec4899' },
      { name: 'Obligaciones y Deuda', porcentaje: expenseHealth.porcentajeAhorroDeudaReal, referencia: financialSettings.porcentajeAhorroDeudaRef || 20, fill: '#6366f1' }
    ];
  }, [expenseHealth, financialSettings]);

  return (
    <div className="w-full max-w-6xl mx-auto space-y-5 px-1 sm:px-2 pb-24">
      {/* 1. RESUMEN: Cabecera con Estado Cualitativo Inmediato (Regla 6 y Regla 8) */}
      <div className={`app-card rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-sm border ${qualitativeStatus.cardBorder} flex flex-col md:flex-row md:items-center justify-between gap-4`}>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-cyan-500/15 text-cyan-600 dark:text-cyan-400">
              <HeartPulse className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              Diagnóstico de Salud Financiera
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <span className={`px-3 py-1 rounded-full text-xs font-black border flex items-center gap-1.5 ${qualitativeStatus.badgeClass}`}>
              <span>{qualitativeStatus.icon}</span>
              <span>ESTADO: {qualitativeStatus.label}</span>
            </span>

            <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
              Score secundario: <b className="text-slate-900 dark:text-white font-mono">{healthScore}/100</b>
            </span>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl pt-1">
            {qualitativeStatus.resumen}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <Link
            to="/ajustes"
            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
          >
            Ajustar Metas
          </Link>
        </div>
      </div>

      {/* 2. LOS 5 PILARES DE SALUD INMEDIATAMENTE COMPRENSIBLES (Regla 6) */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5 sm:gap-3">
        {/* Pilar 1: Ingresos */}
        <div className="app-card rounded-xl sm:rounded-2xl p-3 sm:p-3.5 space-y-1">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
            1. Ingresos
          </span>
          <div className="text-sm font-bold text-slate-900 dark:text-white">
            {formatCurrency(summary.ingresosTotales)}
          </div>
          <span className={`text-[11px] font-medium block truncate ${
            laborBenchmark.cumpleMetaMensual ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
          }`}>
            {laborBenchmark.cumpleMetaMensual ? '🟢 Sobre meta' : '🟡 En construcción'}
          </span>
        </div>

        {/* Pilar 2: Gastos */}
        <div className="app-card rounded-xl sm:rounded-2xl p-3 sm:p-3.5 space-y-1">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
            2. Gastos
          </span>
          <div className="text-sm font-bold text-slate-900 dark:text-white">
            {expenseHealth.ratioGastoIngresoPct}% ingreso
          </div>
          <span className={`text-[11px] font-medium block truncate ${
            expenseHealth.ratioGastoIngresoPct <= 75 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'
          }`}>
            {expenseHealth.ratioGastoIngresoPct <= 75 ? '🟢 Margen viable' : '🔴 Alto costo ruta'}
          </span>
        </div>

        {/* Pilar 3: Deuda */}
        <div className="app-card rounded-xl sm:rounded-2xl p-3 sm:p-3.5 space-y-1">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
            3. Deuda
          </span>
          <div className="text-sm font-bold text-slate-900 dark:text-white">
            {creditCards.length > 0 ? `${creditCardAnalysis.utilizacionGlobalPct}% cupo` : 'Sin tarjetas'}
          </div>
          <span className={`text-[11px] font-medium block truncate ${
            creditCardAnalysis.semaforoUtilizacion === 'VERDE' ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
          }`}>
            {creditCardAnalysis.semaforoUtilizacion === 'VERDE' ? '🟢 Deuda controlada' : '🟡 Uso elevado'}
          </span>
        </div>

        {/* Pilar 4: Flujo / Ahorro */}
        <div className="app-card rounded-xl sm:rounded-2xl p-3 sm:p-3.5 space-y-1">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
            4. Flujo Real
          </span>
          <div className={`text-sm font-bold ${
            threeTierFinancials.flujoDisponible > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'
          }`}>
            {formatCurrency(threeTierFinancials.flujoDisponible)}
          </div>
          <span className={`text-[11px] font-medium block truncate ${
            threeTierFinancials.flujoDisponible > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500 font-bold'
          }`}>
            {threeTierFinancials.flujoDisponible > 0 ? '🟢 Superávit neto' : '🔴 Déficit de caja'}
          </span>
        </div>

        {/* Pilar 5: Horas y Carga */}
        <div className="app-card rounded-xl sm:rounded-2xl p-3 sm:p-3.5 space-y-1 col-span-2 md:col-span-1">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
            5. Jornada
          </span>
          <div className="text-sm font-bold text-slate-900 dark:text-white">
            {laborBenchmark.horasTotalesTrabajadas}h trabajadas
          </div>
          <span className={`text-[11px] font-medium block truncate ${
            laborBenchmark.estadoCargaLaboral === 'NORMAL'
              ? 'text-emerald-600 dark:text-emerald-400'
              : laborBenchmark.estadoCargaLaboral === 'ALTA'
              ? 'text-amber-600 dark:text-amber-400'
              : 'text-rose-500 font-bold'
          }`}>
            {laborBenchmark.estadoCargaLaboral === 'NORMAL' ? '🟢 Carga regular' : `⚠️ Carga ${laborBenchmark.estadoCargaLaboral.toLowerCase()}`}
          </span>
        </div>
      </div>

      {/* 3. DECISIÓN: "¿AHORRAR O ABONAR A CAPITAL?" (Regla 7: DÉFICIT y tasas) */}
      <div className="app-card rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-sm border border-cyan-500/20 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-white/5">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400 flex items-center gap-1.5">
              <PiggyBank className="w-4 h-4" />
              Prioridad Estratégica de Flujo
            </span>
            <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
              ¿Ahorrar o Abonar a Capital?
            </h3>
          </div>

          <button
            onClick={() => setShowSimulator(!showSimulator)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors self-start sm:self-auto"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>{showSimulator ? 'Ocultar Simulador' : 'Simular otro monto'}</span>
          </button>
        </div>

        {/* Input del Simulador si está expandido */}
        {showSimulator && (
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-white/10 space-y-2 text-xs">
            <span className="font-semibold text-slate-700 dark:text-slate-300 block">
              Simular distribución con excedente alternativo:
            </span>
            <div className="flex items-center gap-2 max-w-sm">
              <input
                type="number"
                placeholder={`Ej: ${formatCurrency(Math.max(100000, threeTierFinancials.flujoDisponible))}`}
                value={customSurplusInput}
                onChange={e => setCustomSurplusInput(e.target.value)}
                className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white font-semibold focus:outline-none focus:border-cyan-500"
              />
              {customSurplusInput && (
                <button
                  onClick={() => setCustomSurplusInput('')}
                  className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-white font-bold"
                >
                  Restablecer
                </button>
              )}
            </div>
          </div>
        )}

        {/* Mensaje de DÉFICIT o Distribución Recomendada */}
        {decisionResult.esDeficit ? (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-800 dark:text-rose-200 text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-rose-600 dark:text-rose-400">
              <AlertCircle className="w-4 h-4" />
              <span>Estado: DÉFICIT ({formatCurrency(threeTierFinancials.flujoDisponible)})</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              No existe excedente disponible para destinar a ahorro ni abono extraordinario a pasivos.
              <b> Prioridad inmediata:</b> contener gastos personales, recortar costos directos de ruta o aumentar horas en franjas óptimas para recuperar liquidez positiva.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold block">
                    A Fondo de Emergencia
                  </span>
                  <span className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                    {formatCurrency(decisionResult.montoRecomendadoAhorro)}
                  </span>
                </div>
                <PiggyBank className="w-6 h-6 text-emerald-500/60" />
              </div>

              <div className="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-purple-600 dark:text-purple-400 font-semibold block">
                    A Abono a Deuda / Capital
                  </span>
                  <span className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                    {formatCurrency(decisionResult.montoRecomendadoAbono)}
                  </span>
                </div>
                <DollarSign className="w-6 h-6 text-purple-500/60" />
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-white/5 text-xs text-slate-600 dark:text-slate-300 space-y-1">
              <span className="font-bold text-slate-900 dark:text-white block">
                {decisionResult.titulo}
              </span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                {decisionResult.explicacion}
              </p>
              {decisionResult.tasaIncompleta && (
                <p className="text-[10px] text-amber-600 dark:text-amber-400 pt-1 font-medium">
                  ℹ Tasa no especificada en tarjetas: se utiliza la tasa de usura de referencia para el orden de amortización.
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 4. COMPARATIVA LABORAL COLOMBIA 2026 (SMLMV & 42h) */}
      <div className="app-card rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-200 dark:border-white/10 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-white/5">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 flex items-center gap-1">
              <Scale className="w-3.5 h-3.5" />
              Benchmark Laboral Colombia 2026
            </span>
            <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
              Productividad frente al Salario Mínimo Ordinario
            </h3>
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 px-2.5 py-1 rounded-xl font-medium self-start sm:self-auto">
            SMLMV $1.750.905 • 42h/semana (182h/mes)
          </span>
        </div>

        {/* Alerta de Rendimiento Decreciente si aplica */}
        {laborBenchmark.rendimientoMarginalDecreciente && (
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-800 dark:text-amber-200 text-xs flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <div className="text-[11px] leading-relaxed">
              <span className="font-bold block">Rendimiento marginal decreciente detectado:</span>
              Superaste la jornada de 182h pero tu ganancia por hora cayó por debajo del umbral óptimo. Conviene descansar o reubicar horas a momentos de mayor demanda.
            </div>
          </div>
        )}

        {/* Grid de 3 Indicadores Laborales */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/5 space-y-1">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Ingreso Neto vs SMLMV</span>
            <div className="text-base font-black text-slate-900 dark:text-white">
              {formatCurrency(summary.superavitNeto)}
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
              {laborBenchmark.porcentajeCumplimientoMetaMensual}% de la meta mensual
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/5 space-y-1">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Carga de Jornada</span>
            <div className="text-base font-black text-slate-900 dark:text-white">
              {laborBenchmark.horasTotalesTrabajadas}h registradas
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
              {laborBenchmark.porcentajeReferenciaMensual}% de 182h ordinarias
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/5 space-y-1">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Rendimiento Horario Neto</span>
            <div className="text-base font-black text-slate-900 dark:text-white">
              {laborBenchmark.horasTotalesTrabajadas > 0 ? `${formatCurrency(laborBenchmark.ingresoNetoEfectivoPorHora)}/h` : 'No disponible'}
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
              Tarifa ref: ${formatCurrency(laborBenchmark.referenciaHora)}/h
            </span>
          </div>
        </div>
      </div>

      {/* 5. MARCO PRESUPUESTARIO 50 / 30 / 20 */}
      <div className="app-card rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-200 dark:border-white/10 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-white/5">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Distribución Presupuestaria 50 / 30 / 20
            </h3>
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            Total Egresos: {formatCurrency(expenseHealth.totalGastos)}
          </span>
        </div>

        <div className="space-y-3 pt-1">
          {budgetChartData.map(item => (
            <div key={item.name} className="space-y-1 text-xs">
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-700 dark:text-slate-300 font-semibold">{item.name}</span>
                <span className="text-slate-500 dark:text-slate-400">
                  Real: <b className="text-slate-900 dark:text-white">{item.porcentaje}%</b> (Meta: {item.referencia}%)
                </span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  style={{ width: `${Math.min(100, item.porcentaje)}%`, backgroundColor: item.fill }}
                  className="h-full rounded-full transition-all duration-300"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 6. METODOLOGÍA Y SCORE DETALLADO (Accordion Colapsible - Regla 6) */}
      <div className="app-card rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden">
        <button
          onClick={() => setShowMethodology(!showMethodology)}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
        >
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <HeartPulse className="w-4 h-4 text-cyan-500" />
            Metodología del Score (0-100) y Fuentes Oficiales Colombia 2026
          </span>
          {showMethodology ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </button>

        {showMethodology && (
          <div className="p-4 sm:p-5 pt-0 border-t border-slate-100 dark:border-white/5 text-xs text-slate-500 dark:text-slate-400 space-y-3 leading-relaxed">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-white/5 space-y-1">
              <span className="font-bold text-slate-900 dark:text-white block">
                Composición del Score (0-100):
              </span>
              <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
                <li><b>Rendimiento horario (±20 pts):</b> comparado con la tarifa horaria de referencia ($9.620/h).</li>
                <li><b>Carga laboral (±15 pts):</b> penaliza jornadas excesivas que degradan la salud.</li>
                <li><b>Absorción de costos (±15 pts):</b> evalúa la porción del ingreso consumida por costos directos.</li>
                <li><b>Apalancamiento en tarjetas (±15 pts):</b> evalúa cupos utilizados y tasa de interés.</li>
                <li><b>Cobertura de cuotas (±15 pts):</b> verifica que el resultado operativo cubra obligaciones pactadas.</li>
              </ul>
            </div>

            <div className="space-y-1 text-[11px]">
              <p>
                • <b>SMLMV Colombia 2026:</b> Fijado en <b>$1.750.905 COP</b> según decretos nacionales vigentes.
              </p>
              <p>
                • <b>Jornada Máxima Ordinaria (Ley 2101 de 2021):</b> Reducción a <b>42 horas semanales</b> (182 horas mensuales de referencia).
              </p>
              <p>
                • <b>Aclaración:</b> RiderLedger es una herramienta de productividad personal. Estas métricas son indicativas para planificar tu bienestar y no constituyen asesoría legal.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
