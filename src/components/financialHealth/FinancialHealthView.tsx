import React, { useState, useMemo } from 'react';
import { useAppData } from '../../context/AppDataContext';
import {
  formatCurrency,
  formatMinutes,
  recommendSaveVsPayDebt
} from '../../lib/calculations';
import {
  HeartPulse,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  Clock,
  Activity,
  AlertTriangle,
  Lightbulb,
  DollarSign,
  PiggyBank,
  CheckCircle2,
  HelpCircle,
  BookOpen,
  ArrowRight,
  Sparkles,
  Info,
  Scale,
  Gauge,
  Layers,
  ChevronRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis
} from 'recharts';

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
    financialSettings,
    filteredShifts,
    filteredTransactions
  } = useAppData();

  // Estado para el simulador interactivo "¿Ahorrar o Abonar a Capital?"
  const [customSurplusInput, setCustomSurplusInput] = useState<string>('');

  // Cálculo del Score de Salud Financiera (0 a 100)
  const healthScore = useMemo(() => {
    let score = 50; // base neutra

    // 1. Rendimiento por hora vs benchmark ($9.620/h) (+/- 20 pts)
    if (laborBenchmark.ingresoNetoEfectivoPorHora >= laborBenchmark.referenciaHora * 1.2) {
      score += 20;
    } else if (laborBenchmark.ingresoNetoEfectivoPorHora >= laborBenchmark.referenciaHora) {
      score += 12;
    } else if (laborBenchmark.ingresoNetoEfectivoPorHora >= laborBenchmark.referenciaHora * 0.7) {
      score += 0;
    } else {
      score -= 15;
    }

    // 2. Sobrecarga laboral (+/- 15 pts)
    if (laborBenchmark.estadoCargaLaboral === 'NORMAL') {
      score += 10;
    } else if (laborBenchmark.estadoCargaLaboral === 'ALTA') {
      score += 2;
    } else if (laborBenchmark.estadoCargaLaboral === 'MUY_ALTA') {
      score -= 8;
    } else if (laborBenchmark.estadoCargaLaboral === 'CRITICA') {
      score -= 15;
    }

    // 3. Absorción de gastos vs ingresos (+/- 15 pts)
    if (expenseHealth.ratioGastoIngresoPct <= 60 && summary.ingresosTotales > 0) {
      score += 15;
    } else if (expenseHealth.ratioGastoIngresoPct <= 80) {
      score += 5;
    } else if (expenseHealth.ratioGastoIngresoPct > 90) {
      score -= 15;
    }

    // 4. Utilización de tarjetas de crédito (+/- 15 pts)
    if (creditCardAnalysis.tarjetas.length > 0) {
      if (creditCardAnalysis.semaforoUtilizacion === 'VERDE') {
        score += 15;
      } else if (creditCardAnalysis.semaforoUtilizacion === 'AMARILLO') {
        score -= 5;
      } else {
        score -= 15;
      }
    } else {
      score += 5; // Sin deuda de tarjetas
    }

    // 5. Cobertura de cuotas fijas (+/- 15 pts)
    if (creditAnalysis.estaCubierto) {
      score += 15;
    } else if (creditAnalysis.totalCuotasPendientes > 0) {
      score -= 10;
    }

    return Math.max(10, Math.min(100, Math.round(score)));
  }, [laborBenchmark, expenseHealth, summary.ingresosTotales, creditCardAnalysis, creditAnalysis]);

  // Nivel y color del termómetro
  const scoreLevel = useMemo(() => {
    if (healthScore >= 80) return { label: 'Excelente Salud Financiera', color: 'emerald', badge: '🟢' };
    if (healthScore >= 65) return { label: 'Salud Financiera Fuerte', color: 'cyan', badge: '🟢' };
    if (healthScore >= 45) return { label: 'En Observación / Precaución', color: 'amber', badge: '🟡' };
    return { label: 'Estado Crítico de Carga o Deuda', color: 'rose', badge: '🔴' };
  }, [healthScore]);

  // Simulador interactivo: cálculo en tiempo real
  const interactiveDecision = useMemo(() => {
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
      { name: 'Necesidades Operativas', porcentaje: expenseHealth.porcentajeNecesidadesReal, referencia: financialSettings.porcentajeNecesidadesRef || 50, fill: '#0284c7' },
      { name: 'Gastos Discrecionales', porcentaje: expenseHealth.porcentajeDeseosReal, referencia: financialSettings.porcentajeDeseosRef || 30, fill: '#ec4899' },
      { name: 'Obligaciones / Pasivos', porcentaje: expenseHealth.porcentajeAhorroDeudaReal, referencia: financialSettings.porcentajeAhorroDeudaRef || 20, fill: '#6366f1' }
    ];
  }, [expenseHealth, financialSettings]);

  return (
    <div className="w-full max-w-[1600px] mx-auto space-y-6 px-1 sm:px-2 pb-24">
      {/* 1. Header con Badge Oficial y Explicación */}
      <div className="app-card rounded-3xl p-6 shadow-xl border border-white/10 bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-950 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2.5 rounded-2xl bg-cyan-500/20 text-cyan-400">
              <HeartPulse className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400">
                Copiloto Financiero y Productividad
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-white">
                Salud Financiera para Repartidores
              </h1>
            </div>
          </div>
          <p className="text-xs text-slate-300 mt-2 max-w-2xl leading-relaxed">
            Indicadores accionables, alertas tempranas de sobreexplotación y benchmarks basados en la normativa colombiana vigente (Ley 2101 de 2021 y Decretos SMLMV 2026).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/ajustes"
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs border border-white/10 transition-colors flex items-center gap-1.5"
          >
            Configurar Metas y Referencias →
          </Link>
        </div>
      </div>

      {/* 2. TERMÓMETRO GLOBAL DE SALUD FINANCIERA */}
      <div className="app-card rounded-3xl p-6 shadow-xl border border-white/10 relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Lado Izquierdo: Gauge / Termómetro Visual */}
          <div className="lg:col-span-4 flex flex-col items-center justify-center p-4 rounded-2xl bg-white/5 border border-white/10 text-center">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              Índice Global de Salud
            </span>
            <div className="relative my-3 flex items-center justify-center">
              <div className="text-5xl sm:text-6xl font-black text-white tracking-tight">
                {healthScore}
                <span className="text-lg font-bold text-slate-400">/100</span>
              </div>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-white/10 text-white border border-white/20">
              <span>{scoreLevel.badge}</span>
              <span>{scoreLevel.label}</span>
            </div>

            <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden mt-4 border border-white/10">
              <div
                style={{ width: `${healthScore}%` }}
                className={`h-full transition-all duration-500 ${
                  healthScore >= 70 ? 'bg-emerald-500' : healthScore >= 45 ? 'bg-amber-500' : 'bg-rose-500'
                }`}
              />
            </div>
          </div>

          {/* Lado Derecho: Los 4 Pilares del Diagnóstico */}
          <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {/* Pilar 1: Velocidad Operativa */}
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-300 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-purple-400" />
                  Rendimiento Horario
                </span>
                <span className={laborBenchmark.cumpleMetaHora ? 'text-emerald-400 font-extrabold' : 'text-amber-400 font-extrabold'}>
                  {laborBenchmark.cumpleMetaHora ? '🟢 Sobre meta' : '🟡 Bajo meta'}
                </span>
              </div>
              <p className="text-slate-400 text-[11px]">
                Tu neto real es de <b>{formatCurrency(laborBenchmark.ingresoNetoEfectivoPorHora)}/h</b> frente a la referencia de <b>{formatCurrency(laborBenchmark.referenciaHora)}/h</b>.
              </p>
            </div>

            {/* Pilar 2: Carga Laboral */}
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-300 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" />
                  Carga de Jornada
                </span>
                <span className={`font-extrabold ${
                  laborBenchmark.estadoCargaLaboral === 'NORMAL'
                    ? 'text-emerald-400'
                    : laborBenchmark.estadoCargaLaboral === 'ALTA'
                    ? 'text-amber-400'
                    : 'text-rose-400'
                }`}>
                  {laborBenchmark.estadoCargaLaboral}
                </span>
              </div>
              <p className="text-slate-400 text-[11px]">
                {laborBenchmark.horasTotalesTrabajadas}h trabajadas ({laborBenchmark.porcentajeReferenciaMensual}% de la jornada ordinaria mensual de 182h).
              </p>
            </div>

            {/* Pilar 3: Absorción de Gastos */}
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-300 flex items-center gap-1.5">
                  <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
                  Absorción de Gastos
                </span>
                <span className={expenseHealth.ratioGastoIngresoPct <= 75 ? 'text-emerald-400 font-extrabold' : 'text-rose-400 font-extrabold'}>
                  {expenseHealth.ratioGastoIngresoPct}% del ingreso
                </span>
              </div>
              <p className="text-slate-400 text-[11px]">
                {expenseHealth.ratioGastoIngresoPct > 80
                  ? 'Tus costos operativos están consumiendo una porción excesiva de la facturación.'
                  : 'Margen de retención saludable para ahorro o pago de pasivos.'}
              </p>
            </div>

            {/* Pilar 4: Deuda y Tarjetas */}
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Presión de Deuda
                </span>
                <span className={creditCardAnalysis.semaforoUtilizacion === 'VERDE' ? 'text-emerald-400 font-extrabold' : 'text-amber-400 font-extrabold'}>
                  {creditCardAnalysis.semaforoUtilizacion}
                </span>
              </div>
              <p className="text-slate-400 text-[11px]">
                {creditCards.length > 0
                  ? `Utilizas el ${creditCardAnalysis.utilizacionGlobalPct}% de tus cupos de tarjeta de crédito.`
                  : 'Sin tarjetas de crédito registradas. Riesgo de interés revolvente nulo.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 3. BENCHMARK LABORAL Y COMPARATIVA SALARIAL COLOMBIA 2026 */}
      <div className="app-card rounded-3xl p-6 shadow-xl border border-white/10 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/10">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-purple-400 flex items-center gap-1">
              <Scale className="w-3.5 h-3.5" />
              Comparativa Salarial y Rendimiento Marginal (Colombia 2026)
            </span>
            <h2 className="text-lg font-black text-white mt-0.5">
              ¿Tu esfuerzo rinde más que un salario mínimo ordinario?
            </h2>
          </div>
          <div className="text-xs text-slate-400 bg-white/5 px-3 py-1 rounded-xl border border-white/10 font-bold self-start sm:self-auto">
            Referencia: SMLMV {formatCurrency(financialSettings.metaIngresoMinimoMensual)} • 42h/sem
          </div>
        </div>

        {/* Alerta de Rendimiento Marginal Decreciente */}
        {laborBenchmark.rendimientoMarginalDecreciente && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-200 text-xs flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-extrabold text-rose-300">
                ⚠️ Alerta de Rendimiento Marginal Decreciente Detectada
              </p>
              <p className="text-slate-300 mt-0.5 leading-relaxed text-[11px]">
                Has acumulado <b>{laborBenchmark.horasTotalesTrabajadas} horas</b> (superando la jornada de referencia ordinaria), pero tu ganancia neta horaria ({formatCurrency(laborBenchmark.ingresoNetoEfectivoPorHora)}/h) está por debajo de la tarifa óptima. Estás aumentando horas en franjas de baja demanda o con costos de ruta excesivos, lo que castiga tu salud física sin generar retorno financiero proporcional.
              </p>
            </div>
          </div>
        )}

        {/* Comparativa Grid 3 Tarjetas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Tarjeta 1: Superávit vs SMLMV */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/10 space-y-2">
            <span className="text-[10px] font-bold uppercase text-slate-400">Ingreso Neto vs SMLMV 2026</span>
            <div className="flex items-baseline justify-between">
              <p className="text-2xl font-black text-white">
                {formatCurrency(summary.superavitNeto)}
              </p>
              <span className={`text-xs font-black px-2 py-0.5 rounded-md ${
                laborBenchmark.cumpleMetaMensual ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
              }`}>
                {laborBenchmark.porcentajeCumplimientoMetaMensual}%
              </span>
            </div>
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                style={{ width: `${Math.min(100, laborBenchmark.porcentajeCumplimientoMetaMensual)}%` }}
                className={`h-full ${laborBenchmark.cumpleMetaMensual ? 'bg-emerald-500' : 'bg-amber-500'}`}
              />
            </div>
            <p className="text-[11px] text-slate-400 pt-1">
              Referencia mensual: {formatCurrency(financialSettings.metaIngresoMinimoMensual)} COP.
            </p>
          </div>

          {/* Tarjeta 2: Horas vs 182h (Jornada 42h) */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/10 space-y-2">
            <span className="text-[10px] font-bold uppercase text-slate-400">Jornada vs 42h Ordinaria</span>
            <div className="flex items-baseline justify-between">
              <p className="text-2xl font-black text-white">
                {laborBenchmark.horasTotalesTrabajadas}h
              </p>
              <span className={`text-xs font-black px-2 py-0.5 rounded-md ${
                laborBenchmark.estadoCargaLaboral === 'NORMAL' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
              }`}>
                {laborBenchmark.porcentajeReferenciaMensual}%
              </span>
            </div>
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                style={{ width: `${Math.min(100, laborBenchmark.porcentajeReferenciaMensual)}%` }}
                className={`h-full ${laborBenchmark.estadoCargaLaboral === 'NORMAL' ? 'bg-cyan-500' : 'bg-rose-500'}`}
              />
            </div>
            <p className="text-[11px] text-slate-400 pt-1">
              Referencia de 182h mensuales (42 horas semanales, Ley 2101).
            </p>
          </div>

          {/* Tarjeta 3: Tarifa por Hora Real vs $9.620/h */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/10 space-y-2">
            <span className="text-[10px] font-bold uppercase text-slate-400">Ingreso Neto por Hora</span>
            <div className="flex items-baseline justify-between">
              <p className="text-2xl font-black text-white">
                {formatCurrency(laborBenchmark.ingresoNetoEfectivoPorHora)}/h
              </p>
              <span className={`text-xs font-black px-2 py-0.5 rounded-md ${
                laborBenchmark.cumpleMetaHora ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
              }`}>
                Ref: ${formatCurrency(laborBenchmark.referenciaHora)}/h
              </span>
            </div>
            <p className="text-[11px] text-slate-400 pt-1 leading-relaxed">
              {laborBenchmark.cumpleMetaHora
                ? '✅ Tu hora en moto está generando más que la tarifa ordinaria de referencia.'
                : '⚠️ Tu tarifa por hora neta está por debajo de la referencia ordinaria.'}
            </p>
          </div>
        </div>

        {/* Recomendación y Explicación */}
        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-xs space-y-1 text-slate-300">
          <p className="font-bold text-white">Diagnóstico del Copiloto:</p>
          <p className="text-slate-300 text-[11px] leading-relaxed">{laborBenchmark.explicacionLaboral}</p>
          <p className="text-cyan-400 text-[11px] font-semibold pt-1">💡 Recomendación: {laborBenchmark.recomendacionLaboral}</p>
        </div>
      </div>

      {/* 4. MOTOR INTERACTIVO: "¿AHORRAR O ABONAR A CAPITAL?" */}
      <div className="app-card rounded-3xl p-6 shadow-xl border border-cyan-500/20 bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-950 text-white space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
              <PiggyBank className="w-4 h-4 text-cyan-400" />
              Motor de Decisión Financiera
            </span>
            <h2 className="text-lg font-black text-white mt-0.5">
              ¿Ahorrar o Abonar a Capital? (Jerarquía de Resiliencia)
            </h2>
          </div>
          <span className="text-xs bg-cyan-500/10 text-cyan-300 px-3 py-1 rounded-xl border border-cyan-500/30 font-bold self-start sm:self-auto">
            Resiliencia primero
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Simulador Interactivo (5 cols) */}
          <div className="lg:col-span-5 space-y-3 p-4 rounded-2xl bg-white/5 border border-white/10">
            <label className="block text-xs font-bold text-slate-200">
              ¿Cuánto dinero extra tienes disponible para destinar?
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-400 font-bold text-sm">$</span>
              <input
                type="number"
                placeholder={`Ej: ${threeTierFinancials.flujoDisponible || 200000}`}
                value={customSurplusInput}
                onChange={e => setCustomSurplusInput(e.target.value)}
                className="w-full bg-slate-950 border border-white/15 rounded-xl pl-8 pr-3 py-2 text-white font-bold text-sm focus:border-cyan-400 focus:outline-hidden"
              />
            </div>
            <p className="text-[11px] text-slate-400">
              Flujo disponible actual calculado: <b className="text-cyan-400">{formatCurrency(threeTierFinancials.flujoDisponible)}</b>
            </p>

            <div className="pt-3 border-t border-white/10 space-y-2 text-xs">
              <span className="font-bold text-slate-300 block">Distribución recomendada por el motor:</span>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <span className="text-emerald-300 font-semibold flex items-center gap-1">
                  <PiggyBank className="w-3.5 h-3.5" /> A Fondo de Emergencia:
                </span>
                <b className="text-emerald-400 font-black">{formatCurrency(interactiveDecision.montoRecomendadoAhorro)}</b>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20">
                <span className="text-purple-300 font-semibold flex items-center gap-1">
                  <DollarSign className="w-3.5 h-3.5" /> A Abono a Capital / Pasivos:
                </span>
                <b className="text-purple-400 font-black">{formatCurrency(interactiveDecision.montoRecomendadoAbono)}</b>
              </div>
            </div>
          </div>

          {/* Justificación y Reglas de Decisión (7 cols) */}
          <div className="lg:col-span-7 flex flex-col justify-between space-y-3 p-4 rounded-2xl bg-white/5 border border-white/10">
            <div>
              <div className="flex items-center gap-2 text-cyan-400 font-extrabold text-sm">
                <Sparkles className="w-4 h-4" />
                <span>{interactiveDecision.titulo}</span>
              </div>
              <p className="text-slate-300 text-xs mt-2 leading-relaxed">
                {interactiveDecision.explicacion}
              </p>
              {interactiveDecision.ahorroInteresEstimadoTexto && (
                <p className="text-[11px] text-emerald-300 mt-2 bg-emerald-500/10 p-2 rounded-xl border border-emerald-500/20">
                  💡 {interactiveDecision.ahorroInteresEstimadoTexto}
                </p>
              )}
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-white/5 text-[11px] text-slate-400 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
              <span><b>Por qué esta regla:</b> {interactiveDecision.resilienciaTexto}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 5. ANÁLISIS DE GASTOS Y MARCO PRESUPUESTARIO 50/30/20 */}
      <div className="app-card rounded-3xl p-6 shadow-xl border border-white/10 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/10">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-cyan-400 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5" />
              Presupuesto Adaptable para Riders
            </span>
            <h2 className="text-lg font-black text-white mt-0.5">
              Marco Presupuestario 50 / 30 / 20
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-bold bg-white/5 px-3 py-1 rounded-xl border border-white/10 self-start sm:self-auto">
            Gastos Totales: {formatCurrency(expenseHealth.totalGastos)}
          </span>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          {expenseHealth.explicacion50_30_20}
        </p>

        {/* Barras de Comparativa Presupuestaria */}
        <div className="space-y-3 pt-2">
          {budgetChartData.map(item => (
            <div key={item.name} className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-300 font-bold">{item.name}</span>
                <span className="text-slate-400">
                  Real: <b className="text-white">{item.porcentaje}%</b> (Meta referencia: {item.referencia}%)
                </span>
              </div>
              <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-white/5">
                <div
                  style={{ width: `${Math.min(100, item.porcentaje)}%`, backgroundColor: item.fill }}
                  className="h-full transition-all duration-300"
                />
              </div>
            </div>
          ))}
        </div>

        {/* Tabla Desglosada de Gastos y Clasificación */}
        <div className="pt-4 border-t border-white/10">
          <h4 className="text-xs font-extrabold text-slate-200 mb-2">Clasificación de Egresos:</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
            {expenseHealth.items.map(item => (
              <div key={item.categoria} className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
                <div>
                  <span className="font-bold text-white block">{item.clasificacionLabel}</span>
                  <span className="text-[10px] text-slate-400 block">{item.descripcion}</span>
                </div>
                <div className="text-right">
                  <span className="font-black text-white block">{formatCurrency(item.monto)}</span>
                  <span className="text-[10px] text-slate-400 block">{item.porcentajeIngreso}% del ingreso</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 6. FUENTES Y METODOLOGÍA TRANSPARENTE */}
      <div className="app-card rounded-3xl p-6 shadow-md border border-white/10 space-y-3 text-xs text-slate-400">
        <div className="flex items-center gap-2 pb-2 border-b border-white/10">
          <BookOpen className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-200">
            Fuentes Oficiales y Metodología de Cálculo
          </h3>
        </div>

        <div className="space-y-2 leading-relaxed text-[11px]">
          <p>
            • <b>Salario Mínimo Legal Vigente (SMLMV Colombia 2026):</b> Fijado en <b>$1.750.905 COP</b> mensuales según los Decretos 1469 de 2025 y 159 de 2026.
          </p>
          <p>
            • <b>Jornada Ordinaria de Referencia (Ley 2101 de 2021):</b> La jornada laboral máxima ordinaria en Colombia es de <b>42 horas semanales</b>. A nivel mensual, esto equivale a <b>182 horas ordinarias de referencia</b> (calculadas como <i>(42 horas × 52 semanas) / 12 meses</i>).
          </p>
          <p>
            • <b>Tarifa Horaria de Referencia ($9.620 COP/h):</b> Calculada como el ingreso mínimo de referencia dividido entre las 182 horas mensuales de jornada ordinaria (<i>$1.750.905 / 182h $\approx$ $9.620</i> COP/h).
          </p>
          <p>
            • <b>Aclaración Conceptual:</b> RiderLedger es una herramienta de contabilidad y productividad personal. La comparación con la jornada de 42 horas y el SMLMV tiene un fin exclusivamente financiero y analítico para medir la dignidad de ingresos del rider independiente, sin constituir dictamen jurídico ni laboral.
          </p>
        </div>
      </div>
    </div>
  );
};
