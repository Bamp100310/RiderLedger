import React, { useState, useEffect } from 'react';
import { Shift } from '../../types';
import { useAppData } from '../../context/AppDataContext';
import { toTotalMinutes, fromTotalMinutes, formatMinutes } from '../../lib/calculations';
import { X, Check, Calendar, Clock, Gauge, Bike, Activity } from 'lucide-react';

interface EditShiftModalProps {
  shift: Shift | null;
  isOpen: boolean;
  onClose: () => void;
}

export const EditShiftModal: React.FC<EditShiftModalProps> = ({
  shift,
  isOpen,
  onClose
}) => {
  const { updateShift } = useAppData();

  const [fecha, setFecha] = useState('');
  const [repartoHoras, setRepartoHoras] = useState(0);
  const [repartoMinutos, setRepartoMinutos] = useState(0);
  const [esperaHoras, setEsperaHoras] = useState(0);
  const [esperaMinutos, setEsperaMinutos] = useState(0);
  const [kilometros, setKilometros] = useState('0.0');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (shift) {
      setFecha(shift.fecha || '');
      const rep = fromTotalMinutes(shift.tiempo_reparto_minutos || 0);
      setRepartoHoras(rep.hours);
      setRepartoMinutos(rep.minutes);

      const esp = fromTotalMinutes(shift.tiempo_espera_minutos || 0);
      setEsperaHoras(esp.hours);
      setEsperaMinutos(esp.minutes);

      setKilometros(String(shift.kilometros ?? '0.0'));
    }
  }, [shift]);

  if (!isOpen || !shift) return null;

  const totalRepartoMin = toTotalMinutes(repartoHoras, repartoMinutos);
  const totalEsperaMin = toTotalMinutes(esperaHoras, esperaMinutos);
  const totalMin = totalRepartoMin + totalEsperaMin;
  const ratioProductividad = totalMin > 0 ? Math.round((totalRepartoMin / totalMin) * 100) : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fecha) {
      alert('Por favor selecciona una fecha');
      return;
    }
    if (totalMin <= 0) {
      alert('Debes ingresar al menos algún tiempo de reparto o espera.');
      return;
    }

    setIsSubmitting(true);
    try {
      await updateShift({
        ...shift,
        fecha,
        tiempo_reparto_minutos: totalRepartoMin,
        tiempo_espera_minutos: totalEsperaMin,
        kilometros: parseFloat(kilometros) || 0
      });
      onClose();
    } catch (err) {
      console.error('Error al actualizar turno:', err);
      alert('Error al guardar los cambios');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs animate-fade-in overflow-y-auto">
      <div className="app-card rounded-2xl w-full max-w-lg shadow-2xl border border-white/10 my-8 overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-white/10 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/15 text-cyan-600 dark:text-cyan-400">
              <Bike className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Editar Turno / Jornada
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Ajusta tiempos de reparto, espera y kilometraje
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          {/* Fecha */}
          <div>
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-cyan-500" />
              Fecha de la Jornada
            </label>
            <input
              type="date"
              value={fecha}
              onChange={e => setFecha(e.target.value)}
              required
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500 transition-colors"
            />
          </div>

          {/* Tiempo Reparto */}
          <div className="bg-slate-50 dark:bg-slate-900/50 p-3.5 rounded-2xl border border-slate-200 dark:border-white/5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-cyan-600 dark:text-cyan-400 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                Tiempo en Reparto (Activo)
              </span>
              <span className="text-xs font-bold text-white bg-cyan-500/20 text-cyan-500 px-2 py-0.5 rounded-full">
                {formatMinutes(totalRepartoMin)}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-[11px] text-slate-400 block mb-1">Horas</span>
                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={() => setRepartoHoras(Math.max(0, repartoHoras - 1))}
                    className="w-9 h-9 bg-slate-200 dark:bg-slate-800 rounded-l-xl text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-700 font-bold"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="0"
                    max="24"
                    value={repartoHoras}
                    onChange={e => setRepartoHoras(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full h-9 bg-white dark:bg-slate-900 border-y border-slate-200 dark:border-white/10 text-center text-sm font-bold text-slate-900 dark:text-white focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setRepartoHoras(repartoHoras + 1)}
                    className="w-9 h-9 bg-slate-200 dark:bg-slate-800 rounded-r-xl text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-700 font-bold"
                  >
                    +
                  </button>
                </div>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block mb-1">Minutos</span>
                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={() => setRepartoMinutos(Math.max(0, repartoMinutos - 5))}
                    className="w-9 h-9 bg-slate-200 dark:bg-slate-800 rounded-l-xl text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-700 font-bold"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    step="1"
                    value={repartoMinutos}
                    onChange={e => setRepartoMinutos(Math.min(59, Math.max(0, parseInt(e.target.value) || 0)))}
                    className="w-full h-9 bg-white dark:bg-slate-900 border-y border-slate-200 dark:border-white/10 text-center text-sm font-bold text-slate-900 dark:text-white focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setRepartoMinutos(Math.min(59, repartoMinutos + 5))}
                    className="w-9 h-9 bg-slate-200 dark:bg-slate-800 rounded-r-xl text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-700 font-bold"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Tiempo Espera */}
          <div className="bg-slate-50 dark:bg-slate-900/50 p-3.5 rounded-2xl border border-slate-200 dark:border-white/5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                Tiempo de Espera (Inactivo)
              </span>
              <span className="text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                {formatMinutes(totalEsperaMin)}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-[11px] text-slate-400 block mb-1">Horas</span>
                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={() => setEsperaHoras(Math.max(0, esperaHoras - 1))}
                    className="w-9 h-9 bg-slate-200 dark:bg-slate-800 rounded-l-xl text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-700 font-bold"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="0"
                    max="24"
                    value={esperaHoras}
                    onChange={e => setEsperaHoras(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full h-9 bg-white dark:bg-slate-900 border-y border-slate-200 dark:border-white/10 text-center text-sm font-bold text-slate-900 dark:text-white focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setEsperaHoras(esperaHoras + 1)}
                    className="w-9 h-9 bg-slate-200 dark:bg-slate-800 rounded-r-xl text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-700 font-bold"
                  >
                    +
                  </button>
                </div>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block mb-1">Minutos</span>
                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={() => setEsperaMinutos(Math.max(0, esperaMinutos - 5))}
                    className="w-9 h-9 bg-slate-200 dark:bg-slate-800 rounded-l-xl text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-700 font-bold"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    step="1"
                    value={esperaMinutos}
                    onChange={e => setEsperaMinutos(Math.min(59, Math.max(0, parseInt(e.target.value) || 0)))}
                    className="w-full h-9 bg-white dark:bg-slate-900 border-y border-slate-200 dark:border-white/10 text-center text-sm font-bold text-slate-900 dark:text-white focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setEsperaMinutos(Math.min(59, esperaMinutos + 5))}
                    className="w-9 h-9 bg-slate-200 dark:bg-slate-800 rounded-r-xl text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-700 font-bold"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Kilómetros */}
          <div>
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1 flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5 text-purple-500" />
              Kilómetros Recorridos
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.1"
                min="0"
                value={kilometros}
                onChange={e => setKilometros(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white font-bold focus:outline-none focus:border-purple-500 transition-colors pr-12"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                km
              </span>
            </div>
          </div>

          {/* Resumen del Turno */}
          <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-500" />
              <span className="text-slate-600 dark:text-slate-300">Total Jornada:</span>
              <span className="font-bold text-slate-900 dark:text-white">{formatMinutes(totalMin)}</span>
            </div>
            <div className="flex items-center gap-1 font-bold text-cyan-600 dark:text-cyan-400">
              <span>{ratioProductividad}%</span>
              <span className="text-[10px] text-slate-400 font-normal">activo</span>
            </div>
          </div>

          {/* Acciones */}
          <div className="flex gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 rounded-xl bg-cyan-500 text-white text-xs font-bold shadow-lg shadow-cyan-500/25 hover:bg-cyan-400 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>{isSubmitting ? 'Guardando...' : 'Guardar Cambios'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
