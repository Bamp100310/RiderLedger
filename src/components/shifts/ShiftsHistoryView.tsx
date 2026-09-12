import React from 'react';
import { useAppData } from '../../context/AppDataContext';
import { formatMinutes, formatCurrency } from '../../lib/calculations';
import { Bike, Trash2, Plus, Calendar, Cloud, CloudOff } from 'lucide-react';

export const ShiftsHistoryView: React.FC = () => {
  const { shifts, deleteShift, openDrawer, transactions } = useAppData();

  const handleDelete = (id: string, fecha: string) => {
    if (window.confirm(`¿Estás seguro de eliminar el turno del ${fecha}?`)) {
      deleteShift(id);
    }
  };

  return (
    <div className="space-y-4 pb-20 max-w-2xl mx-auto">
      <div className="app-card p-5 rounded-2xl flex items-center justify-between">
        <div>
          <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Bike className="w-5 h-5 text-cyan-500" />
            Historial de Jornadas
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Control de horas activas, tiempos de espera y kilometraje
          </p>
        </div>
        <button
          onClick={() => openDrawer('shift')}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-500 text-white text-xs font-bold shadow-md hover:bg-cyan-400 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Turno</span>
        </button>
      </div>

      {/* Lista de Turnos */}
      <div className="space-y-3">
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
              className="app-card rounded-2xl p-4 space-y-3 transition-all shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-cyan-500/15 text-cyan-600 dark:text-cyan-400">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">{shift.fecha}</h4>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Total: {formatMinutes(totalMin)} en ruta
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {shift.sync_status === 'pending' ? (
                    <span title="Pendiente de sincronizar" className="text-amber-500">
                      <CloudOff className="w-4 h-4" />
                    </span>
                  ) : (
                    <span title="Sincronizado" className="text-emerald-500/70">
                      <Cloud className="w-4 h-4" />
                    </span>
                  )}
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
              <div className="grid grid-cols-3 gap-2 bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-200 dark:border-white/5 text-center">
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
              <div className="space-y-1">
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

              {/* Ingresos generados */}
              {shiftIncome > 0 && (
                <div className="pt-2 border-t border-slate-100 dark:border-white/5 flex justify-between items-center text-xs">
                  <span className="text-slate-500 dark:text-slate-400">Ingresos generados:</span>
                  <span className="font-black text-emerald-600 dark:text-emerald-400">{formatCurrency(shiftIncome)}</span>
                </div>
              )}
            </div>
          );
        })}

        {shifts.length === 0 && (
          <div className="text-center py-12 app-card rounded-2xl border-dashed">
            <Bike className="w-10 h-10 text-slate-400 dark:text-slate-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No hay jornadas registradas</p>
            <p className="text-xs text-slate-500 mb-4">Registra tu primer turno para medir tiempos y kilometraje</p>
            <button
              onClick={() => openDrawer('shift')}
              className="px-4 py-2 rounded-xl bg-cyan-500 text-white text-xs font-bold shadow-md"
            >
              Registrar Turno
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
