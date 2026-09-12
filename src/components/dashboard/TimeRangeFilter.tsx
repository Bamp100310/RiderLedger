import React, { useState } from 'react';
import { useAppData } from '../../context/AppDataContext';
import { TimeRange } from '../../types';
import { Calendar, Filter, X } from 'lucide-react';

export const TimeRangeFilter: React.FC = () => {
  const { filter, setFilterRange } = useAppData();
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
      <div className="flex items-center justify-between gap-1.5 p-1 bg-slate-900/90 border border-white/10 rounded-2xl">
        <div className="flex items-center gap-1 overflow-x-auto w-full">
          {RANGES.map(r => {
            const isSelected = filter.range === r.id;
            return (
              <button
                key={r.id}
                onClick={() => setFilterRange(r.id)}
                className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all whitespace-nowrap text-center ${
                  isSelected
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 shadow-md shadow-emerald-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
              >
                {r.label}
              </button>
            );
          })}
          
          <button
            onClick={() => setShowCustomModal(true)}
            className={`py-1.5 px-2.5 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all ${
              filter.range === 'personalizado'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
            title="Filtrar por rango personalizado"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Rango</span>
          </button>
        </div>
      </div>

      {/* Modal de fechas personalizadas */}
      {showCustomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-white/15 rounded-2xl p-5 w-full max-w-xs shadow-2xl space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-cyan-400" />
                Rango Personalizado
              </h4>
              <button
                onClick={() => setShowCustomModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleApplyCustom} className="space-y-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Fecha Inicial</label>
                <input
                  type="date"
                  value={customStart}
                  onChange={e => setCustomStart(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Fecha Final</label>
                <input
                  type="date"
                  value={customEnd}
                  onChange={e => setCustomEnd(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                  required
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCustomModal(false)}
                  className="flex-1 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-emerald-500 text-slate-950 text-xs font-bold shadow-lg shadow-emerald-500/20"
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
