import React from 'react';
import { useAppData } from '../../context/AppDataContext';
import { formatCurrency, formatMinutes } from '../../lib/calculations';
import {
  CalendarClock,
  TrendingUp,
  TrendingDown,
  Wallet,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  Plus
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell
} from 'recharts';

import { TimeRangeFilter } from './TimeRangeFilter';

export const ExecutiveDashboard: React.FC = () => {
  const { summary, creditAnalysis, filteredTransactions, openDrawer } = useAppData();

  const prodRatio = Math.round(summary.ratioProductividad);
  const isNetPositive = summary.superavitNeto >= 0;
  const isAppPositive = summary.saldoApp >= 0;

  // Datos para Donut de Productividad (Card 1)
  const donutData = [
    { name: 'Repartiendo', value: summary.totalMinutosReparto || 1, color: '#00a8cc' },
    { name: 'Espera', value: summary.totalMinutosEspera || 0, color: '#e2e8f0' }
  ];

  // Datos para Barras Diarias (Card 3)
  const barDataMap = new Map<string, { label: string; Ingresos: number; Gastos: number }>();
  const sortedTx = [...filteredTransactions].sort((a, b) => a.fecha.localeCompare(b.fecha));
  for (const t of sortedTx) {
    const parts = t.fecha.split('-');
    const label = parts.length === 3 ? `${parts[2]}/${parts[1]}` : t.fecha;
    if (!barDataMap.has(label)) {
      barDataMap.set(label, { label, Ingresos: 0, Gastos: 0 });
    }
    const item = barDataMap.get(label)!;
    if (t.tipo === 'INGRESO') item.Ingresos += Number(t.monto) || 0;
    if (t.tipo === 'GASTO') item.Gastos += Number(t.monto) || 0;
  }
  const barChartData = Array.from(barDataMap.values()).slice(-7);

  // Meta de 8 horas diarias de jornada (480 min)
  const metaHorasMin = 480;
  const metaPorcentaje = Math.min(100, Math.round((summary.totalMinutosTrabajados / metaHorasMin) * 100));

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Filtro de Rango Temporal contextual del Dashboard */}
      <TimeRangeFilter />
      {/* Alerta de Cuota si es día de pago o falta poco */}
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
              className={`p-2 rounded-xl ${
                creditAnalysis.estaCubierto ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
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
            className="px-3.5 py-1.5 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-bold whitespace-nowrap self-start sm:self-center hover:opacity-90 transition-opacity"
          >
            Ver Cuotas →
          </Link>
        </div>
      )}

      {/* Grid de 6 Tarjetas Corporativas (Inspirado fielmente en la Maqueta) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* ============================================================ */}
        {/* TARJETA 1: Email Subscriptions -> Ratio de Productividad (Donut) */}
        {/* ============================================================ */}
        <div className="app-card rounded-2xl p-5 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                Productividad en Ruta
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Tiempo activo en pedidos vs. espera
              </p>
            </div>
          </div>

          <div className="relative w-44 h-44 mx-auto my-1 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={donutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={75}
                  startAngle={90}
                  endAngle={-270}
                  dataKey="value"
                >
                  <Cell fill="#00a8cc" />
                  <Cell fill="#334155" />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            {/* Porcentaje en el centro */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-black text-slate-900 dark:text-white">
                {prodRatio}%
              </span>
              <span className="text-[10px] text-slate-400 font-bold uppercase">
                Activo
              </span>
            </div>
          </div>

          <div className="flex justify-around text-center text-xs pt-2 border-t border-slate-100 dark:border-white/5">
            <div>
              <span className="text-[10px] text-slate-400 block">Reparto</span>
              <span className="font-bold text-cyan-600 dark:text-cyan-400">
                {formatMinutes(summary.totalMinutosReparto)}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">Espera</span>
              <span className="font-bold text-slate-600 dark:text-slate-400">
                {formatMinutes(summary.totalMinutosEspera)}
              </span>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* TARJETA 2: Completed Tasks -> Horas & Metas (Barras Horizontales) */}
        {/* ============================================================ */}
        <div className="app-card rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-1">
              Desglose de Jornada
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-4">
              Distribución de tiempos y cumplimiento de horas
            </p>

            <div className="space-y-4">
              {/* Barra 1: Reparto Activo (Cyan) */}
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-700 dark:text-slate-300">Tiempo de Reparto</span>
                  <span className="text-cyan-600 dark:text-cyan-400 font-bold">
                    {formatMinutes(summary.totalMinutosReparto)}
                  </span>
                </div>
                <div className="w-full h-3.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
                  <div
                    style={{ width: `${Math.min(100, prodRatio)}%` }}
                    className="h-full bg-cyan-500 rounded-full transition-all duration-500"
                  />
                </div>
              </div>

              {/* Barra 2: Tiempo de Espera (Rojo/Rosa) */}
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-700 dark:text-slate-300">Tiempo de Espera</span>
                  <span className="text-rose-600 dark:text-rose-400 font-bold">
                    {formatMinutes(summary.totalMinutosEspera)}
                  </span>
                </div>
                <div className="w-full h-3.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
                  <div
                    style={{ width: `${Math.min(100, 100 - prodRatio)}%` }}
                    className="h-full bg-rose-500 rounded-full transition-all duration-500"
                  />
                </div>
              </div>

              {/* Barra 3: Meta de Horas Diarias (Naranja / Ámbar) */}
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-700 dark:text-slate-300">Meta Diaria (8h)</span>
                  <span className="text-amber-600 dark:text-amber-400 font-bold">
                    {metaPorcentaje}% ({formatMinutes(summary.totalMinutosTrabajados)})
                  </span>
                </div>
                <div className="w-full h-3.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
                  <div
                    style={{ width: `${metaPorcentaje}%` }}
                    className="h-full bg-amber-500 rounded-full transition-all duration-500"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-white/5 flex justify-between text-[11px] text-slate-500">
            <span>Rendimiento: <b>{formatCurrency(summary.rendimientoPorHora)}/h</b></span>
            <span>Odómetro: <b>{summary.kilometrosTotales.toFixed(0)} km</b></span>
          </div>
        </div>

        {/* ============================================================ */}
        {/* TARJETA 3: Daily Sale -> Comparativa Ingresos vs Gastos (Barras Verticales) */}
        {/* ============================================================ */}
        <div className="app-card rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-1">
              Ingresos vs Gastos
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2">
              Comparativa de flujo de dinero diario
            </p>

            <div className="h-44 w-full">
              {barChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barChartData} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
                    <XAxis dataKey="label" stroke="#94a3b8" fontSize={10} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} axisLine={false} />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-slate-900 text-white text-[11px] p-2 rounded-xl shadow-lg border border-white/10">
                              <p className="font-bold">{label}</p>
                              <p className="text-emerald-400 font-semibold">
                                Ingresos: {formatCurrency(payload[0]?.value as number || 0)}
                              </p>
                              <p className="text-rose-400 font-semibold">
                                Gastos: {formatCurrency(payload[1]?.value as number || 0)}
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="Ingresos" fill="#00a8cc" radius={[4, 4, 0, 0]} maxBarSize={14} />
                    <Bar dataKey="Gastos" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={14} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">
                  Sin transacciones en este rango
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-between items-center text-xs pt-2 border-t border-slate-100 dark:border-white/5">
            <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-cyan-500" />
              Ing: {formatCurrency(summary.ingresosTotales)}
            </span>
            <span className="text-rose-600 dark:text-rose-400 font-bold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              Gas: {formatCurrency(summary.gastosTotales)}
            </span>
          </div>
        </div>

        {/* ============================================================ */}
        {/* TARJETA 4: Control de Créditos (Días 10 y 30) */}
        {/* ============================================================ */}
        <div className="app-card rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-1">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                <CalendarClock className="w-4 h-4 text-cyan-500" />
                Créditos (Días 10 y 30)
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-600 dark:text-cyan-300">
                Día {creditAnalysis.proximoDiaPago}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-3">
              ¿Alcanzas a pagar tus cuotas con lo que generaste?
            </p>

            <div className="space-y-2.5">
              <div className="flex justify-between items-baseline">
                <span className="text-xs text-slate-600 dark:text-slate-300 font-semibold">
                  Cuotas pendientes:
                </span>
                <span className="text-sm font-black text-slate-900 dark:text-white">
                  {formatCurrency(creditAnalysis.totalCuotasPendientes)}
                </span>
              </div>

              {/* Barra de Cobertura */}
              <div>
                <div className="flex justify-between text-[11px] font-semibold mb-1">
                  <span className="text-slate-500">Cobertura con superávit:</span>
                  <span className={creditAnalysis.estaCubierto ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-amber-600 dark:text-amber-400 font-bold'}>
                    {creditAnalysis.porcentajeCobertura}%
                  </span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${Math.min(100, creditAnalysis.porcentajeCobertura)}%` }}
                    className={`h-full ${creditAnalysis.estaCubierto ? 'bg-emerald-500' : 'bg-amber-500'}`}
                  />
                </div>
              </div>

              {/* Veredicto de pago */}
              <div
                className={`p-2.5 rounded-xl text-xs font-semibold border ${
                  creditAnalysis.estaCubierto
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300'
                }`}
              >
                {creditAnalysis.estaCubierto ? (
                  <span>✅ ¡Cubierto! Te sobran {formatCurrency(creditAnalysis.diferencia)}.</span>
                ) : (
                  <span>⚠️ Te faltan {formatCurrency(Math.abs(creditAnalysis.diferencia))} para la cuota.</span>
                )}
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-white/5 flex justify-between items-center text-xs">
            <span className="text-slate-500 text-[11px]">
              Faltan <b>{creditAnalysis.diasRestantes} días</b>
            </span>
            <Link
              to="/creditos"
              className="text-cyan-600 dark:text-cyan-400 font-bold hover:underline text-[11px]"
            >
              Administrar cuotas →
            </Link>
          </div>
        </div>

        {/* ============================================================ */}
        {/* TARJETA 5: Revenue Block -> Ganancia Real (Bloque Cyan Prominente) */}
        {/* ============================================================ */}
        <div className="app-card rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-1">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                Resultado Neto Real
              </h3>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                isNetPositive
                  ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                  : 'bg-rose-500/20 text-rose-700 dark:text-rose-300'
              }`}>
                {isNetPositive ? 'Superávit' : 'Déficit'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-3">
              Ingresos Brutos menos Gastos Operativos
            </p>

            {/* Bloque Cyan estilo "Revenue $ 0,000" de la imagen */}
            <div className="w-full bg-[#00a8cc] rounded-xl p-4 text-white shadow-lg shadow-cyan-500/20 my-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-cyan-100 block">
                Ganancia Limpia
              </span>
              <p className="text-3xl font-black tracking-tight mt-0.5">
                {formatCurrency(summary.superavitNeto)}
              </p>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-white/5 flex justify-between text-xs text-slate-500">
            <span>Ingresos: <b className="text-slate-800 dark:text-slate-200">{formatCurrency(summary.ingresosTotales)}</b></span>
            <span>Gastos: <b className="text-slate-800 dark:text-slate-200">{formatCurrency(summary.gastosTotales)}</b></span>
          </div>
        </div>

        {/* ============================================================ */}
        {/* TARJETA 6: Doble Realidad: Saldo en Apps vs Efectivo en Bolsillo */}
        {/* ============================================================ */}
        <div className="app-card rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-1">
              Doble Realidad de Liquidez
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-3">
              Plataformas (deuda/favor) vs. Dinero físico en mano
            </p>

            <div className="space-y-3">
              {/* Saldo con Apps */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-white/5">
                <div className="flex justify-between items-center text-xs">
                  <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-semibold">
                    <Smartphone className="w-4 h-4 text-cyan-500" />
                    Saldo en Apps:
                  </span>
                  <span
                    className={`font-black ${
                      isAppPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {formatCurrency(summary.saldoApp)}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  {isAppPositive ? 'Saldo a favor que te deben transferir' : 'Deuda pendiente por pedidos cobrados en efectivo'}
                </span>
              </div>

              {/* Efectivo en Mano */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-white/5">
                <div className="flex justify-between items-center text-xs">
                  <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-semibold">
                    <Wallet className="w-4 h-4 text-emerald-500" />
                    Efectivo en Bolsillo:
                  </span>
                  <span className="font-black text-slate-900 dark:text-white">
                    {formatCurrency(summary.efectivoEnMano)}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Liquidez real física para tanquear o pagar en calle
                </span>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-white/5 flex justify-end">
            <button
              onClick={() => openDrawer('app_income')}
              className="text-xs text-cyan-600 dark:text-cyan-400 font-bold hover:underline flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Registrar Pedido App
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
