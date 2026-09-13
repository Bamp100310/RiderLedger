import React, { useState } from 'react';
import { useAppData } from '../../context/AppDataContext';
import { TimeRange } from '../../types';
import { Calendar, X, RefreshCw } from 'lucide-react';

export const TimeRangeFilter: React.FC = () => {
  const { filter, setFilterRange, triggerSync, isSyncing } = useAppData();
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customStart, setCustomStart] = useState(filter.startDate || '');
  const [customEnd, setCustomEnd] = useState(filter.endDate || '');

  const RANGES: { id: TimeRange; label: string }[] = [
    { id: 'hoy', label: 'Hoy' },
    { id: 'semana', label: 'Esta Semana' },
    { id: 'mes', label: 'Este Mes' },
    { id: 'historico', label: 'Histórico' }
  ];

  const handleApplyCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (customStart && customEnd) {
      setFilterRange('personalizado', customStart, customEnd);
      setShowCustomModal(false);
    }
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between gap-1 p-1 app-card rounded-xl">
        <div className="flex items-center gap-1 overflow-x-auto w-full">
          {RANGES.map(r => {
            const isSelected = filter.range === r.id;
            return (
              <button
                key={r.id}
                onClick={() => setFilterRange(r.id)}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all whitespace-nowrap text-center ${
                  isSelected
                    ? 'bg-cyan-500 text-white shadow-sm font-extrabold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
                }`}
              >
                {r.label}
              </button>
            );
          })}

          <button
            onClick={() => setShowCustomModal(true)}
            className={`py-1.5 px-2.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
              filter.range === 'personalizado'
                ? 'bg-cyan-500 text-white font-bold shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
            }`}
            title="Filtrar por rango de fechas"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Rango</span>
          </button>

          {/* Botón de Sincronización Rápida en Vivo */}
          <button
            onClick={() => triggerSync()}
            disabled={isSyncing}
            className={`py-1.5 px-2.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all text-slate-500 dark:text-slate-400 hover:text-cyan-500 hover:bg-cyan-500/10 ${
              isSyncing ? 'opacity-70' : ''
            }`}
            title="Sincronizar datos con la nube"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-cyan-500' : ''}`} />
            <span className="hidden sm:inline">{isSyncing ? 'Sincronizando...' : 'Actualizar'}</span>
          </button>
        </div>
      </div>

      {/* Modal de fechas personalizadas */}
      {showCustomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="app-card rounded-2xl p-5 w-full max-w-xs shadow-2xl space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-cyan-500" />
                Rango Personalizado
              </h4>
              <button
                onClick={() => setShowCustomModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleApplyCustom} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Fecha Inicial</label>
                <input
                  type="date"
                  value={customStart}
                  onChange={e => setCustomStart(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Fecha Final</label>
                <input
                  type="date"
                  value={customEnd}
                  onChange={e => setCustomEnd(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                  required
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCustomModal(false)}
                  className="flex-1 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-cyan-500 text-white text-xs font-bold shadow-md"
                >
                  Aplicar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
