import React, { useState, useMemo } from 'react';
import { Shift } from '../../types';
import { useAppData } from '../../context/AppDataContext';
import { formatMinutes, formatCurrency } from '../../lib/calculations';
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
  DollarSign
} from 'lucide-react';

export const ShiftsHistoryView: React.FC = () => {
  const { shifts, deleteShift, openDrawer, transactions } = useAppData();
  const [editingShift, setEditingShift] = useState<Shift | null>(null);

  const handleDelete = (id: string, fecha: string) => {
    if (window.confirm(`¿Estás seguro de eliminar el turno del ${fecha}?`)) {
      deleteShift(id);
    }
  };

  // Resumen global de métricas de turnos
  const kpis = useMemo(() => {
    let totalMinReparto = 0;
    let totalMinEspera = 0;
    let totalKm = 0;
    let totalIngresosJornadas = 0;

    shifts.forEach(s => {
      totalMinReparto += Number(s.tiempo_reparto_minutos) || 0;
      totalMinEspera += Number(s.tiempo_espera_minutos) || 0;
      totalKm += Number(s.kilometros) || 0;

      const shiftIncome = transactions
        .filter(t => t.tipo === 'INGRESO' && (t.shift_id === s.id || t.fecha === s.fecha))
        .reduce((sum, t) => sum + Number(t.monto), 0);
      totalIngresosJornadas += shiftIncome;
    });

    const totalMin = totalMinReparto + totalMinEspera;
    const avgProductividad = totalMin > 0 ? Math.round((totalMinReparto / totalMin) * 100) : 0;

    return {
      totalMin,
      totalMinReparto,
      totalMinEspera,
      avgProductividad,
      totalKm,
      totalIngresosJornadas
    };
  }, [shifts, transactions]);

  return (
    <div className="space-y-4 pb-20 max-w-7xl mx-auto">
      {/* Cabecera Principal */}
      <div className="app-card p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
        <div>
          <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Bike className="w-5 h-5 text-cyan-500" />
            Historial de Jornadas y Turnos
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Control auditado de horas en ruta, tiempos activos vs. espera y rendimiento de kilometraje
          </p>
        </div>
        <button
          onClick={() => openDrawer('shift')}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-500 text-white text-xs font-bold shadow-md hover:bg-cyan-400 transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>+ Nuevo Turno</span>
        </button>
      </div>

      {/* KPI Cards de Jornadas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Total Tiempo en Ruta */}
        <div className="app-card rounded-2xl p-3.5 sm:p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 flex items-center justify-center flex-shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] sm:text-[11px] text-slate-400 font-semibold uppercase tracking-wider block truncate">
              Tiempo en Ruta
            </span>
            <span className="text-sm sm:text-lg font-black text-slate-900 dark:text-white truncate block">
              {formatMinutes(kpis.totalMin)}
            </span>
          </div>
        </div>

        {/* Productividad Promedio */}
        <div className="app-card rounded-2xl p-3.5 sm:p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
            <Activity className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] sm:text-[11px] text-slate-400 font-semibold uppercase tracking-wider block truncate">
              Eficiencia Activa
            </span>
            <span className="text-sm sm:text-lg font-black text-emerald-600 dark:text-emerald-400 truncate block">
              {kpis.avgProductividad}% activo
            </span>
          </div>
        </div>

        {/* Kilometraje Acumulado */}
        <div className="app-card rounded-2xl p-3.5 sm:p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center flex-shrink-0">
            <Gauge className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] sm:text-[11px] text-slate-400 font-semibold uppercase tracking-wider block truncate">
              Odómetro Total
            </span>
            <span className="text-sm sm:text-lg font-black text-slate-900 dark:text-white truncate block">
              {kpis.totalKm.toFixed(1)} km
            </span>
          </div>
        </div>

        {/* Ingresos Generados en Jornadas */}
        <div className="app-card rounded-2xl p-3.5 sm:p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0">
            <DollarSign className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] sm:text-[11px] text-slate-400 font-semibold uppercase tracking-wider block truncate">
              Ingresos de Turnos
            </span>
            <span className="text-sm sm:text-lg font-black text-emerald-600 dark:text-emerald-400 truncate block">
              {formatCurrency(kpis.totalIngresosJornadas)}
            </span>
          </div>
        </div>
      </div>

      {/* Grid de Jornadas Registradas (1 columna en móvil, 2 en tablet/laptop, 3 en pantallas grandes/ultrawide) */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {shifts.map(shift => {
          const totalMin = (shift.tiempo_reparto_minutos || 0) + (shift.tiempo_espera_minutos || 0);
          const ratio = totalMin > 0 ? Math.round((shift.tiempo_reparto_minutos / totalMin) * 100) : 0;

          const shiftTxs = transactions.filter(t => t.shift_id === shift.id || t.fecha === shift.fecha);
          const shiftIncome = shiftTxs
            .filter(t => t.tipo === 'INGRESO')
            .reduce((sum, t) => sum + Number(t.monto), 0);

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
                        {formatMinutes(totalMin)} totales
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

                {/* Tiempos y odómetro */}
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
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">Odómetro</span>
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {Number(shift.kilometros).toFixed(1)} km
                    </span>
                  </div>
                </div>

                {/* Barra de productividad */}
                <div className="space-y-1 mt-3">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-500 dark:text-slate-400">Productividad:</span>
                    <span className="font-bold text-cyan-600 dark:text-cyan-400">{ratio}% activo</span>
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
                <span className="text-slate-500 dark:text-slate-400">Ingresos generados:</span>
                <span className="font-black text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(shiftIncome)}
                </span>
              </div>
            </div>
          );
        })}

        {shifts.length === 0 && (
          <div className="col-span-1 md:col-span-2 xl:col-span-3 text-center py-16 app-card rounded-2xl border-dashed">
            <Bike className="w-12 h-12 text-slate-400 dark:text-slate-600 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">No hay jornadas registradas</p>
            <p className="text-xs text-slate-500 mb-4">Registra tu primer turno para medir tiempos, odómetro y rendimiento</p>
            <button
              onClick={() => openDrawer('shift')}
              className="px-4 py-2 rounded-xl bg-cyan-500 text-white text-xs font-bold shadow-md hover:bg-cyan-400"
            >
              Registrar Turno
            </button>
          </div>
        )}
      </div>

      {/* Modal para Editar Jornada */}
      <EditShiftModal
        shift={editingShift}
        isOpen={Boolean(editingShift)}
        onClose={() => setEditingShift(null)}
      />
    </div>
  );
};
