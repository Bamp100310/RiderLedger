import React, { useState, useMemo } from 'react';
import { Shift } from '../../types';
import { useAppData } from '../../context/AppDataContext';
import {
  formatMinutes,
  formatCurrency,
  calculateShiftDistance,
  groupShiftsByPeriod,
  getPeriodLabel
} from '../../lib/calculations';
import { EditShiftModal } from './EditShiftModal';
import {
  Bike,
  Trash2,
  Pencil,
  Plus,
  Calendar,
  Cloud,
  CloudOff,
  Clock,
  Gauge,
  Activity,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Layers,
  List,
  TrendingUp,
  AlertCircle
} from 'lucide-react';

export const ShiftsHistoryView: React.FC = () => {
  const {
    shifts,
    deleteShift,
    openDrawer,
    transactions,
    filteredShifts,
    filteredTransactions,
    filter,
    setFilterRange,
    navigateFilter,
    resetFilterToToday
  } = useAppData();

  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  const [viewMode, setViewMode] = useState<'individual' | 'grouped'>('individual');
  const [groupBy, setGroupBy] = useState<'mes' | 'semana'>('mes');

  const handleDelete = (id: string, fecha: string) => {
    if (window.confirm(`¿Estás seguro de eliminar la jornada del ${fecha}?`)) {
      deleteShift(id);
    }
  };

  // Label del período activo
  const periodTitle = useMemo(() => {
    return getPeriodLabel(filter);
  }, [filter]);

  // KPIs del período activo
  const kpis = useMemo(() => {
    let totalMinReparto = 0;
    let totalMinEspera = 0;
    let totalKm = 0;
    let totalIngresosJornadas = 0;
    let totalGastosRuta = 0;

    filteredShifts.forEach(s => {
      totalMinReparto += Number(s.tiempo_reparto_minutos) || 0;
      totalMinEspera += Number(s.tiempo_espera_minutos) || 0;
      totalKm += calculateShiftDistance(s);

      // Ingresos directos asociados a esta jornada o fecha
      const shiftIncome = filteredTransactions
        .filter(t => t.tipo === 'INGRESO' && (t.shift_id === s.id || t.fecha === s.fecha))
        .reduce((sum, t) => sum + Number(t.monto), 0);
      totalIngresosJornadas += shiftIncome;

      // Costos directos de ruta
      const shiftExpenses = filteredTransactions
        .filter(t => t.tipo === 'GASTO' &&
          t.categoria !== 'PERSONAL' &&
          t.categoria !== 'CUOTA_CREDITO' &&
          (t.shift_id === s.id || t.fecha === s.fecha))
        .reduce((sum, t) => sum + Number(t.monto), 0);
      totalGastosRuta += shiftExpenses;
    });

    const totalMin = totalMinReparto + totalMinEspera;
    const totalHoras = totalMin / 60;
    const avgProductividad = totalMin > 0 ? Math.round((totalMinReparto / totalMin) * 100) : 0;

    // Métricas horarias inequívocas (Regla 2 y Regla 5)
    const rendimientoOperativoPorHora = totalHoras > 0
      ? (totalIngresosJornadas - totalGastosRuta) / totalHoras
      : null;

    const facturacionBrutaPorHora = totalHoras > 0
      ? totalIngresosJornadas / totalHoras
      : null;

    return {
      totalMin,
      totalHoras,
      totalMinReparto,
      totalMinEspera,
      avgProductividad,
      totalKm,
      totalIngresosJornadas,
      totalGastosRuta,
      rendimientoOperativoPorHora,
      facturacionBrutaPorHora
    };
  }, [filteredShifts, filteredTransactions]);

  // Datos agrupados históricos (por mes o semana)
  const groupedData = useMemo(() => {
    return groupShiftsByPeriod(shifts, transactions, groupBy);
  }, [shifts, transactions, groupBy]);

  return (
    <div className="space-y-4 pb-20 max-w-7xl mx-auto">
      {/* Cabecera Principal */}
      <div className="app-card p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
        <div>
          <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Bike className="w-5 h-5 text-cyan-500" />
            Historial de Jornadas y Productividad
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Control de horas en ruta, eficiencia de espera vs. reparto y rendimiento operativo por hora
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Switcher de Vista: Individual vs Agrupado */}
          <div className="inline-flex bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200 dark:border-white/5 text-xs font-semibold">
            <button
              onClick={() => setViewMode('individual')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                viewMode === 'individual'
                  ? 'bg-cyan-500 text-white shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Turnos</span>
            </button>
            <button
              onClick={() => setViewMode('grouped')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                viewMode === 'grouped'
                  ? 'bg-cyan-500 text-white shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Agrupado</span>
            </button>
          </div>

          <button
            onClick={() => openDrawer('shift')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-500 text-white text-xs font-bold shadow-md hover:bg-cyan-400 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Turno</span>
          </button>
        </div>
      </div>

      {/* Selector Temporal Unificado para Vista Individual */}
      {viewMode === 'individual' && (
        <div className="app-card p-3 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Navegación de Período */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200 dark:border-white/5">
              <button
                onClick={() => navigateFilter(-1)}
                disabled={filter.range === 'historico'}
                className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30"
                title="Período anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-2.5 text-xs font-bold text-slate-900 dark:text-white min-w-[130px] text-center">
                {periodTitle}
              </span>
              <button
                onClick={() => navigateFilter(1)}
                disabled={filter.range === 'historico'}
                className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30"
                title="Período siguiente"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={resetFilterToToday}
              className="p-2 text-slate-500 dark:text-slate-400 hover:text-cyan-500 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-white/5 text-xs font-medium flex items-center gap-1"
              title="Volver a hoy"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Hoy</span>
            </button>
          </div>

          {/* Rango de Tiempo */}
          <div className="flex flex-wrap gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200 dark:border-white/5 w-full sm:w-auto justify-center">
            {(['hoy', 'semana', 'mes', 'año', 'historico'] as const).map(r => (
              <button
                key={r}
                onClick={() => setFilterRange(r)}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all capitalize ${
                  filter.range === r
                    ? 'bg-cyan-500 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {r === 'historico' ? 'Histórico' : r}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Selector de Agrupación para Vista Agrupada */}
      {viewMode === 'grouped' && (
        <div className="app-card p-3 rounded-2xl flex items-center justify-between">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Agrupar histórico de todas las jornadas:
          </span>
          <div className="inline-flex bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200 dark:border-white/5 text-xs font-semibold">
            <button
              onClick={() => setGroupBy('mes')}
              className={`px-3 py-1 rounded-lg transition-all ${
                groupBy === 'mes'
                  ? 'bg-cyan-500 text-white shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-white'
              }`}
            >
              Por Mes
            </button>
            <button
              onClick={() => setGroupBy('semana')}
              className={`px-3 py-1 rounded-lg transition-all ${
                groupBy === 'semana'
                  ? 'bg-cyan-500 text-white shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-white'
              }`}
            >
              Por Semana
            </button>
          </div>
        </div>
      )}

      {/* KPI Cards de Jornadas del Período */}
      {viewMode === 'individual' && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Horas Trabajadas */}
          <div className="app-card rounded-2xl p-3.5 sm:p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 flex items-center justify-center flex-shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] sm:text-[11px] text-slate-400 font-semibold uppercase tracking-wider block truncate">
                Tiempo en Ruta ({filter.range})
              </span>
              <span className="text-sm sm:text-lg font-black text-slate-900 dark:text-white truncate block">
                {kpis.totalMin > 0 ? formatMinutes(kpis.totalMin) : '0h 0m'}
              </span>
            </div>
          </div>

          {/* Productividad / Eficiencia */}
          <div className="app-card rounded-2xl p-3.5 sm:p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
              <Activity className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] sm:text-[11px] text-slate-400 font-semibold uppercase tracking-wider block truncate">
                Eficiencia Activa
              </span>
              <span className="text-sm sm:text-lg font-black text-emerald-600 dark:text-emerald-400 truncate block">
                {kpis.totalMin > 0 ? `${kpis.avgProductividad}% activo` : 'No disponible'}
              </span>
            </div>
          </div>

          {/* Kilómetros Recorridos (Regla 4: Nunca 'Odómetro' para distancia acumulada) */}
          <div className="app-card rounded-2xl p-3.5 sm:p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center flex-shrink-0">
              <Gauge className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] sm:text-[11px] text-slate-400 font-semibold uppercase tracking-wider block truncate">
                Kilómetros Recorridos
              </span>
              <span className="text-sm sm:text-lg font-black text-slate-900 dark:text-white truncate block">
                {kpis.totalKm.toFixed(1)} km
              </span>
            </div>
          </div>

          {/* Rendimiento Operativo / h (Reglas 2 y 5: Nomenclatura inequívoca y No disponible si 0 horas) */}
          <div className="app-card rounded-2xl p-3.5 sm:p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] sm:text-[11px] text-slate-400 font-semibold uppercase tracking-wider block truncate">
                Rendimiento Operativo/h
              </span>
              <span className="text-sm sm:text-lg font-black text-slate-900 dark:text-white truncate block">
                {kpis.rendimientoOperativoPorHora !== null
                  ? formatCurrency(kpis.rendimientoOperativoPorHora)
                  : 'No disponible'}
              </span>
              {kpis.facturacionBrutaPorHora !== null && (
                <span className="text-[10px] text-slate-400 block truncate">
                  Bruto: {formatCurrency(kpis.facturacionBrutaPorHora)}/h
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* VISTA 1: Lista de Turnos Individuales */}
      {viewMode === 'individual' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredShifts.map(shift => {
            const totalMin = (shift.tiempo_reparto_minutos || 0) + (shift.tiempo_espera_minutos || 0);
            const ratio = totalMin > 0 ? Math.round((shift.tiempo_reparto_minutos / totalMin) * 100) : 0;
            const distance = calculateShiftDistance(shift);

            const shiftTxs = filteredTransactions.filter(t => t.shift_id === shift.id || t.fecha === shift.fecha);
            const shiftIncome = shiftTxs
              .filter(t => t.tipo === 'INGRESO')
              .reduce((sum, t) => sum + Number(t.monto), 0);

            const hasPhysicalOdo =
              typeof shift.odometer_start === 'number' &&
              typeof shift.odometer_end === 'number' &&
              shift.odometer_end >= shift.odometer_start;

            return (
              <div
                key={shift.id}
                className="app-card rounded-2xl p-4 space-y-3 shadow-xs hover:border-cyan-500/40 transition-colors flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-white/5">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-cyan-500/15 text-cyan-600 dark:text-cyan-400">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">{shift.fecha}</h4>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                          {formatMinutes(totalMin)} en ruta
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {shift.sync_status === 'pending' ? (
                        <span title="Pendiente de sincronizar" className="text-amber-500">
                          <CloudOff className="w-3.5 h-3.5" />
                        </span>
                      ) : (
                        <span title="Sincronizado" className="text-emerald-500/70">
                          <Cloud className="w-3.5 h-3.5" />
                        </span>
                      )}
                      <button
                        onClick={() => setEditingShift(shift)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-500 hover:bg-cyan-500/10 transition-colors"
                        title="Editar jornada"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(shift.id, shift.fecha)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                        title="Eliminar jornada"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Tiempos y distancia */}
                  <div className="grid grid-cols-3 gap-2 bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-200 dark:border-white/5 text-center mt-3">
                    <div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">Reparto</span>
                      <span className="text-xs font-bold text-cyan-600 dark:text-cyan-400">
                        {formatMinutes(shift.tiempo_reparto_minutos)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">Espera</span>
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        {formatMinutes(shift.tiempo_espera_minutos)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">Distancia</span>
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {distance.toFixed(1)} km
                      </span>
                    </div>
                  </div>

                  {/* Lectura de Odómetro Físico si está registrada */}
                  {hasPhysicalOdo && (
                    <div className="mt-2 text-[10px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/60 px-2.5 py-1 rounded-lg flex items-center justify-between">
                      <span>Odómetro inicial/final:</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300 font-mono">
                        {shift.odometer_start} → {shift.odometer_end}
                      </span>
                    </div>
                  )}

                  {/* Barra de productividad */}
                  <div className="space-y-1 mt-3">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-500 dark:text-slate-400">Eficiencia activa:</span>
                      <span className="font-bold text-cyan-600 dark:text-cyan-400">{ratio}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${ratio}%` }}
                        className="h-full bg-gradient-to-r from-cyan-500 to-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Ingresos generados */}
                <div className="pt-2 border-t border-slate-100 dark:border-white/5 flex justify-between items-center text-xs">
                  <span className="text-slate-500 dark:text-slate-400">Ingresos del día:</span>
                  <span className="font-black text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(shiftIncome)}
                  </span>
                </div>
              </div>
            );
          })}

          {filteredShifts.length === 0 && (
            <div className="col-span-1 md:col-span-2 xl:col-span-3 text-center py-12 app-card rounded-2xl border-dashed">
              <Bike className="w-12 h-12 text-slate-400 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Sin jornadas registradas en este período ({periodTitle})
              </p>
              <p className="text-xs text-slate-500 mb-4">
                Usa las flechas para navegar o cambia el filtro a "Mes" o "Histórico"
              </p>
              <div className="flex justify-center gap-2">
                <button
                  onClick={() => setFilterRange('mes')}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5"
                >
                  Ver este Mes
                </button>
                <button
                  onClick={() => openDrawer('shift')}
                  className="px-3.5 py-1.5 rounded-xl bg-cyan-500 text-white text-xs font-bold shadow-md hover:bg-cyan-400"
                >
                  + Registrar Turno
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* VISTA 2: Comparativa Histórica Agrupada (Por Mes o Semana) */}
      {viewMode === 'grouped' && (
        <div className="space-y-3">
          {groupedData.map(group => (
            <div
              key={group.periodoKey}
              className="app-card p-4 sm:p-5 rounded-2xl space-y-3 shadow-xs hover:border-cyan-500/30 transition-colors"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-white/5">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-cyan-500/15 text-cyan-600 dark:text-cyan-400">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                      {group.periodoLabel}
                    </h4>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {group.totalTurnos} {group.totalTurnos === 1 ? 'jornada registrada' : 'jornadas registradas'} • {group.horasFormatted}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-cyan-500/15 text-cyan-600 dark:text-cyan-400">
                    {group.horasFormatted}
                  </span>
                </div>
              </div>

              {/* Grid de Métricas del Bloque */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-xl border border-slate-200 dark:border-white/5">
                  <span className="text-[10px] text-slate-400 block uppercase font-medium">Distancia</span>
                  <span className="font-bold text-slate-900 dark:text-white text-sm">
                    {group.kilometros.toFixed(1)} km
                  </span>
                </div>

                <div className="bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-xl border border-slate-200 dark:border-white/5">
                  <span className="text-[10px] text-slate-400 block uppercase font-medium">Ingresos Reparto</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                    {formatCurrency(group.ingresos)}
                  </span>
                </div>

                <div className="bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-xl border border-slate-200 dark:border-white/5">
                  <span className="text-[10px] text-slate-400 block uppercase font-medium">Costos de Ruta</span>
                  <span className="font-bold text-rose-500 text-sm">
                    {formatCurrency(group.gastosRuta)}
                  </span>
                </div>

                <div className="bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-xl border border-slate-200 dark:border-white/5">
                  <span className="text-[10px] text-slate-400 block uppercase font-medium">Rendimiento Operativo/h</span>
                  <span className="font-black text-cyan-600 dark:text-cyan-400 text-sm">
                    {group.rendimientoOperativoHora !== null
                      ? `${formatCurrency(group.rendimientoOperativoHora)}/h`
                      : 'No disponible'}
                  </span>
                </div>
              </div>
            </div>
          ))}

          {groupedData.length === 0 && (
            <div className="text-center py-16 app-card rounded-2xl border-dashed">
              <Bike className="w-12 h-12 text-slate-400 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">No hay datos históricos para agrupar</p>
            </div>
          )}
        </div>
      )}

      {/* Modal para Editar Jornada */}
      <EditShiftModal
        shift={editingShift}
        isOpen={Boolean(editingShift)}
        onClose={() => setEditingShift(null)}
      />
    </div>
  );
};
