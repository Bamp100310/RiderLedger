import React from 'react';
import { useAppData } from '../../context/AppDataContext';
import { formatMinutes, formatCurrency } from '../../lib/calculations';
import { Clock, Bike, Gauge, Zap, Award, Hourglass } from 'lucide-react';

export const OperationalMetrics: React.FC = () => {
  const { summary } = useAppData();

  const prodRatio = Math.round(summary.ratioProductividad);

  return (
    <div className="bg-slate-900/80 border border-white/10 rounded-3xl p-4 sm:p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
          <Zap className="w-4 h-4 text-cyan-400" />
          Métricas Operativas de Jornada
        </h3>
        <span className="text-[11px] font-bold text-slate-400">
          {summary.totalTurnos} {summary.totalTurnos === 1 ? 'Turno' : 'Turnos'}
        </span>
      </div>

      {/* Tiempos en Ruta: Reparto vs Espera */}
      <div className="space-y-2 bg-slate-950/60 p-3 rounded-2xl border border-white/5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            Tiempo Total Activo:
          </span>
          <span className="font-extrabold text-white text-sm">
            {formatMinutes(summary.totalMinutosTrabajados)}
          </span>
        </div>

        {/* Barra dividida de productividad */}
        <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden flex">
          <div
            style={{ width: `${prodRatio}%` }}
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
            title={`Repartiendo: ${prodRatio}%`}
          />
          <div
            style={{ width: `${100 - prodRatio}%` }}
            className="h-full bg-amber-500/60 transition-all duration-500"
            title={`Esperando: ${100 - prodRatio}%`}
          />
        </div>

        {/* Desglose de minutos */}
        <div className="flex items-center justify-between text-[11px] pt-1">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span className="text-slate-300 font-semibold">Repartiendo:</span>
            <span className="text-emerald-400 font-bold">{formatMinutes(summary.totalMinutosReparto)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <span className="text-slate-300 font-semibold">Espera:</span>
            <span className="text-amber-400 font-bold">{formatMinutes(summary.totalMinutosEspera)}</span>
          </div>
        </div>
      </div>

      {/* Ratios de Eficiencia y Rentabilidad */}
      <div className="grid grid-cols-3 gap-2">
        {/* 1. Ratio Productividad */}
        <div className="bg-slate-950/50 p-2.5 rounded-xl border border-white/5 text-center">
          <span className="text-[10px] font-semibold text-slate-400 block mb-0.5">Productividad</span>
          <p className="text-base font-black text-emerald-400">{prodRatio}%</p>
          <span className="text-[9px] text-slate-400">tiempo activo</span>
        </div>

        {/* 2. Rendimiento por Hora */}
        <div className="bg-slate-950/50 p-2.5 rounded-xl border border-white/5 text-center">
          <span className="text-[10px] font-semibold text-slate-400 block mb-0.5">Rendimiento Operativo / h</span>
          <p className="text-sm sm:text-base font-black text-cyan-400">
            {summary.rendimientoPorHora !== null ? formatCurrency(summary.rendimientoPorHora) : 'No disponible'}
          </p>
          <span className="text-[9px] text-slate-400">por hora total</span>
        </div>

        {/* 3. Rendimiento por Km */}
        <div className="bg-slate-950/50 p-2.5 rounded-xl border border-white/5 text-center">
          <span className="text-[10px] font-semibold text-slate-400 block mb-0.5">Rendimiento Operativo / km</span>
          <p className="text-sm sm:text-base font-black text-indigo-400">
            {summary.rendimientoPorKm !== null ? formatCurrency(summary.rendimientoPorKm) : 'No disponible'}
          </p>
          <span className="text-[9px] text-slate-400">{summary.kilometrosTotales.toFixed(0)} km recorridos</span>
        </div>
      </div>
    </div>
  );
};
