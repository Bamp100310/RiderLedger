import React from 'react';
import { useAppData } from '../../context/AppDataContext';
import { formatMinutes, formatCurrency } from '../../lib/calculations';
import { Bike, Clock, Gauge, Trash2, Plus, Calendar, Cloud, CloudOff } from 'lucide-react';

export const ShiftsHistoryView: React.FC = () => {
  const { shifts, deleteShift, openDrawer, transactions } = useAppData();

  const handleDelete = (id: string, fecha: string) => {
    if (window.confirm(`¿Estás seguro de eliminar el turno del ${fecha}?`)) {
      deleteShift(id);
    }
  };

  return (
    <div className="space-y-4 pb-20 max-w-2xl mx-auto">
      <div className="flex items-center justify-between bg-slate-900/80 p-4 rounded-3xl border border-white/10">
        <div>
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <Bike className="w-5 h-5 text-cyan-400" />
            Historial de Jornadas
          </h2>
          <p className="text-xs text-slate-400">
            Control de horas activas, esperas y kilometraje por turno
          </p>
        </div>
        <button
          onClick={() => openDrawer('shift')}
          className="flex items-center gap-1 px-3 py-2 rounded-xl bg-cyan-500 text-slate-950 text-xs font-bold shadow-md hover:bg-cyan-400 transition-colors"
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

          // Calcular ingresos generados durante este turno
          const shiftTxs = transactions.filter(t => t.shift_id === shift.id || t.fecha === shift.fecha);
          const shiftIncome = shiftTxs
            .filter(t => t.tipo === 'INGRESO')
            .reduce((sum, t) => sum + Number(t.monto), 0);

          return (
            <div
              key={shift.id}
              className="bg-slate-900/80 border border-white/10 rounded-2xl p-4 space-y-3 hover:border-white/20 transition-all shadow-md"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">{shift.fecha}</h4>
                    <span className="text-[11px] text-slate-400">
                      Total: {formatMinutes(totalMin)} en ruta
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {shift.sync_status === 'pending' ? (
                    <span title="Pendiente de subir a Supabase" className="text-amber-400">
                      <CloudOff className="w-4 h-4" />
                    </span>
                  ) : (
                    <span title="Sincronizado" className="text-emerald-500/60">
                      <Cloud className="w-4 h-4" />
                    </span>
                  )}
                  <button
                    onClick={() => handleDelete(shift.id, shift.fecha)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
                    title="Eliminar jornada"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Tiempos y odómetro */}
              <div className="grid grid-cols-3 gap-2 bg-slate-950/60 p-2.5 rounded-xl border border-white/5 text-center">
                <div>
                  <span className="text-[10px] text-slate-400 block">Reparto</span>
                  <span className="text-xs font-bold text-emerald-400">
                    {formatMinutes(shift.tiempo_reparto_minutos)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Espera</span>
                  <span className="text-xs font-bold text-amber-400">
                    {formatMinutes(shift.tiempo_espera_minutos)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Odómetro</span>
                  <span className="text-xs font-bold text-cyan-400">
                    {Number(shift.kilometros).toFixed(1)} km
                  </span>
                </div>
              </div>

              {/* Barra de productividad y notas */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-400">Productividad:</span>
                  <span className="font-bold text-emerald-400">{ratio}% activo</span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${ratio}%` }}
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-400"
                  />
                </div>
              </div>

              {/* Ingresos generados si los hay */}
              {shiftIncome > 0 && (
                <div className="pt-2 border-t border-white/5 flex justify-between items-center text-xs">
                  <span className="text-slate-400">Ingresos del día:</span>
                  <span className="font-extrabold text-emerald-400">{formatCurrency(shiftIncome)}</span>
                </div>
              )}

              {shift.notas && (
                <p className="text-[11px] text-slate-400 italic bg-slate-950/30 px-2.5 py-1 rounded-lg">
                  "{shift.notas}"
                </p>
              )}
            </div>
          );
        })}

        {shifts.length === 0 && (
          <div className="text-center py-12 bg-slate-900/40 rounded-3xl border border-dashed border-white/10">
            <Bike className="w-10 h-10 text-slate-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-400">No hay jornadas registradas</p>
            <p className="text-xs text-slate-500 mb-4">Registra tu primer turno para medir tiempos y kilometraje</p>
            <button
              onClick={() => openDrawer('shift')}
              className="px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 text-xs font-bold shadow-md"
            >
              Registrar Turno
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
