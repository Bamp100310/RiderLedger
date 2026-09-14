import React, { useState } from 'react';
import { useAppData } from '../../context/AppDataContext';
import { TimeRange } from '../../types';
import { getPeriodLabel, getLocalDateString } from '../../lib/calculations';
import { Calendar, ChevronLeft, ChevronRight, X, RefreshCw, RotateCcw } from 'lucide-react';

export const TimeRangeFilter: React.FC = () => {
  const {
    filter,
    setFilterRange,
    navigateFilter,
    resetFilterToToday,
    triggerSync,
    isSyncing
  } = useAppData();

  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customStart, setCustomStart] = useState(filter.startDate || '');
  const [customEnd, setCustomEnd] = useState(filter.endDate || '');

  const RANGES: { id: TimeRange; label: string }[] = [
    { id: 'hoy', label: 'Día' },
    { id: 'semana', label: 'Semana' },
    { id: 'mes', label: 'Mes' },
    { id: 'año', label: 'Año' },
    { id: 'historico', label: 'Histórico' }
  ];

  const currentLabel = getPeriodLabel(filter);
  const isNavigable = filter.range !== 'historico';
  const todayStr = getLocalDateString();
  const isCurrentPeriod = filter.referenceDate === todayStr;

  const handleApplyCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (customStart && customEnd) {
      setFilterRange('personalizado', customStart, customEnd);
      setShowCustomModal(false);
    }
  };

  return (
    <div className="w-full space-y-2">
      {/* 1. Barra de Navegación Temporal (← Período Focal →) */}
      <div className="bg-slate-900/90 border border-white/10 rounded-2xl p-2.5 sm:p-3 shadow-md flex items-center justify-between gap-2">
        {/* Botón Período Anterior */}
        <button
          onClick={() => navigateFilter(-1)}
          disabled={!isNavigable}
          className={`p-2 rounded-xl border border-white/5 transition-colors flex items-center justify-center ${
            isNavigable
              ? 'bg-slate-800 text-white hover:bg-slate-700 active:scale-95'
              : 'opacity-30 cursor-not-allowed text-slate-500'
          }`}
          title="Período anterior"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Etiqueta Central del Período */}
        <div className="flex flex-col items-center justify-center min-w-0 text-center px-1">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400">
              Período Activo
            </span>
            {!isCurrentPeriod && filter.range !== 'historico' && (
              <button
                onClick={resetFilterToToday}
                className="text-[10px] bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 px-1.5 py-0.5 rounded-md font-bold transition-all flex items-center gap-0.5"
                title="Volver a la fecha de hoy"
              >
                <RotateCcw className="w-2.5 h-2.5" />
                <span>Hoy</span>
              </button>
            )}
          </div>
          <h2 className="text-sm sm:text-base font-black text-white truncate max-w-[280px] sm:max-w-md">
            {currentLabel}
          </h2>
        </div>

        {/* Botón Período Siguiente */}
        <button
          onClick={() => navigateFilter(1)}
          disabled={!isNavigable}
          className={`p-2 rounded-xl border border-white/5 transition-colors flex items-center justify-center ${
            isNavigable
              ? 'bg-slate-800 text-white hover:bg-slate-700 active:scale-95'
              : 'opacity-30 cursor-not-allowed text-slate-500'
          }`}
          title="Período siguiente"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* 2. Selector de Granularidad y Rango */}
      <div className="flex items-center justify-between gap-1 p-1 bg-slate-900/60 border border-white/5 rounded-xl">
        <div className="flex items-center gap-1 overflow-x-auto w-full scrollbar-none">
          {RANGES.map(r => {
            const isSelected = filter.range === r.id;
            return (
              <button
                key={r.id}
                onClick={() => setFilterRange(r.id)}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all whitespace-nowrap text-center ${
                  isSelected
                    ? 'bg-cyan-500 text-white shadow-sm font-extrabold'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
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
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
            title="Filtrar por fechas personalizadas"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Rango</span>
          </button>

          {/* Sincronización en Vivo */}
          <button
            onClick={() => triggerSync()}
            disabled={isSyncing}
            className={`py-1.5 px-2.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 ${
              isSyncing ? 'opacity-70' : ''
            }`}
            title="Sincronizar con Supabase"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-cyan-400' : ''}`} />
            <span className="hidden sm:inline">{isSyncing ? 'Sync...' : 'Sync'}</span>
          </button>
        </div>
      </div>

      {/* Modal de Fechas Personalizadas */}
      {showCustomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-5 w-full max-w-xs shadow-2xl space-y-4">
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
                <label className="block text-xs font-semibold text-slate-400 mb-1">Fecha Inicial</label>
                <input
                  type="date"
                  value={customStart}
                  onChange={e => setCustomStart(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Fecha Final</label>
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
                  className="flex-1 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-cyan-500 text-white text-xs font-bold shadow-md hover:bg-cyan-400"
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
