import React from 'react';
import { useAppData } from '../../context/AppDataContext';
import { formatCurrency } from '../../lib/calculations';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  DollarSign
} from 'lucide-react';

export const KpiCards: React.FC = () => {
  const { summary } = useAppData();

  const isNetPositive = summary.superavitNeto >= 0;
  const isAppPositive = summary.saldoApp >= 0;
  const isCashPositive = summary.efectivoEnMano >= 0;

  return (
    <div className="space-y-3">
      {/* Tarjeta Principal: SUPERÁVIT NETO REAL */}
      <div
        className={`relative overflow-hidden rounded-3xl p-5 border transition-all ${
          isNetPositive
            ? 'bg-gradient-to-br from-emerald-950/80 via-slate-900/90 to-slate-950 border-emerald-500/40 shadow-xl shadow-emerald-950/40'
            : 'bg-gradient-to-br from-rose-950/80 via-slate-900/90 to-slate-950 border-rose-500/40 shadow-xl shadow-rose-950/40'
        }`}
      >
        {/* Glow de fondo */}
        <div
          className={`absolute -right-12 -top-12 w-44 h-44 rounded-full blur-3xl opacity-20 pointer-events-none ${
            isNetPositive ? 'bg-emerald-400' : 'bg-rose-400'
          }`}
        />

        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-wider text-slate-300">
              Resultado Neto Real
            </span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                isNetPositive
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
              }`}
            >
              {isNetPositive ? 'Superávit' : 'Déficit'}
            </span>
          </div>
          {isNetPositive ? (
            <TrendingUp className="w-5 h-5 text-emerald-400" />
          ) : (
            <TrendingDown className="w-5 h-5 text-rose-400" />
          )}
        </div>

        {/* Monto Gigante */}
        <div className="flex items-baseline gap-1 my-1">
          <h2
            className={`text-3xl sm:text-4xl font-black tracking-tight ${
              isNetPositive ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {formatCurrency(summary.superavitNeto)}
          </h2>
        </div>

        <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
          <span>Ganancia libre real: Ingresos Brutos − Gastos Operativos</span>
        </p>

        {/* Mini barra de progreso comparativa Ingresos vs Gastos */}
        <div className="mt-4 pt-3 border-t border-white/10 grid grid-cols-2 gap-3">
          <div>
            <span className="text-[11px] text-slate-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              Ingresos Totales
            </span>
            <p className="text-sm font-bold text-white mt-0.5">
              {formatCurrency(summary.ingresosTotales)}
            </p>
          </div>
          <div>
            <span className="text-[11px] text-slate-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-rose-400" />
              Gastos Totales
            </span>
            <p className="text-sm font-bold text-slate-200 mt-0.5">
              {formatCurrency(summary.gastosTotales)}
            </p>
          </div>
        </div>
      </div>

      {/* Grid de 2 Columnas: Doble Realidad del Efectivo vs Saldo App */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* 1. Saldo con la App / Plataforma */}
        <div
          className={`p-4 rounded-2xl border transition-all ${
            isAppPositive
              ? 'bg-slate-900/80 border-emerald-500/30'
              : 'bg-slate-900/80 border-rose-500/30'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5">
              <Smartphone className={`w-4 h-4 ${isAppPositive ? 'text-emerald-400' : 'text-rose-400'}`} />
              <span className="text-xs font-bold text-slate-200">Saldo con Apps</span>
            </div>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                isAppPositive
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : 'bg-rose-500/20 text-rose-300'
              }`}
            >
              {isAppPositive ? 'A Favor (+)' : 'Deuda Plataforma (-)'}
            </span>
          </div>

          <div className="my-1">
            <p
              className={`text-xl font-black ${
                isAppPositive ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {formatCurrency(summary.saldoApp)}
            </p>
          </div>

          <p className="text-[10px] text-slate-400 mt-1 leading-tight">
            {isAppPositive
              ? 'La plataforma te transferirá este saldo acumulado en el próximo ciclo de pago.'
              : 'Tienes deuda acumulada por cobros de pedidos en efectivo al cliente.'}
          </p>
        </div>

        {/* 2. Efectivo Físico en Mano / Bolsillo */}
        <div
          className={`p-4 rounded-2xl border transition-all ${
            isCashPositive
              ? 'bg-slate-900/80 border-cyan-500/30'
              : 'bg-slate-900/80 border-amber-500/30'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5">
              <Wallet className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold text-slate-200">Efectivo en Bolsillo</span>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300">
              Liquidez Física
            </span>
          </div>

          <div className="my-1">
            <p className="text-xl font-black text-cyan-400">
              {formatCurrency(summary.efectivoEnMano)}
            </p>
          </div>

          <p className="text-[10px] text-slate-400 mt-1 leading-tight">
            Dinero en mano disponible en tu bolsillo tras sumar cobros e ingresos y restar gastos en efectivo.
          </p>
        </div>
      </div>
    </div>
  );
};
