import React, { useState } from 'react';
import { useAppData } from '../../context/AppDataContext';
import { toTotalMinutes, formatMinutes, getLocalDateString } from '../../lib/calculations';
import { Bike, Clock, Gauge, Calendar, Check, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

interface ShiftFormProps {
  onSuccess?: () => void;
}

export const ShiftForm: React.FC<ShiftFormProps> = ({ onSuccess }) => {
  const { addShift } = useAppData();

  const [fecha, setFecha] = useState(getLocalDateString());
  const [repartoHoras, setRepartoHoras] = useState(4);
  const [repartoMinutos, setRepartoMinutos] = useState(30);
  const [esperaHoras, setEsperaHoras] = useState(1);
  const [esperaMinutos, setEsperaMinutos] = useState(15);
  const [kilometros, setKilometros] = useState('45.0');
  const [odometerStart, setOdometerStart] = useState('');
  const [odometerEnd, setOdometerEnd] = useState('');
  const [showOdometerInputs, setShowOdometerInputs] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Cálculos en tiempo real
  const totalRepartoMin = toTotalMinutes(repartoHoras, repartoMinutos);
  const totalEsperaMin = toTotalMinutes(esperaHoras, esperaMinutos);
  const totalMin = totalRepartoMin + totalEsperaMin;
  const ratioProductividad = totalMin > 0 ? ((totalRepartoMin / totalMin) * 100).toFixed(0) : '0';

  const numOdoStart = odometerStart.trim() !== '' ? parseFloat(odometerStart) : null;
  const numOdoEnd = odometerEnd.trim() !== '' ? parseFloat(odometerEnd) : null;
  const hasValidOdometer = numOdoStart !== null && numOdoEnd !== null && !isNaN(numOdoStart) && !isNaN(numOdoEnd) && numOdoEnd >= numOdoStart;
  const odoCalculatedDistance = hasValidOdometer ? (numOdoEnd - numOdoStart).toFixed(1) : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (totalMin <= 0) {
      alert('Debes ingresar al menos algún tiempo de reparto o espera.');
      return;
    }

    if (numOdoStart !== null && numOdoEnd !== null && numOdoEnd < numOdoStart) {
      alert('El odómetro final no puede ser menor al inicial.');
      return;
    }

    setIsSubmitting(true);
    try {
      const finalKm = hasValidOdometer ? (numOdoEnd! - numOdoStart!) : (parseFloat(kilometros) || 0);
      await addShift({
        fecha,
        tiempo_reparto_minutos: totalRepartoMin,
        tiempo_espera_minutos: totalEsperaMin,
        kilometros: finalKm,
        odometer_start: numOdoStart !== null && !isNaN(numOdoStart) ? numOdoStart : undefined,
        odometer_end: numOdoEnd !== null && !isNaN(numOdoEnd) ? numOdoEnd : undefined
      });

      // Celebración visual
      try {
        confetti({
          particleCount: 40,
          spread: 60,
          origin: { y: 0.8 }
        });
      } catch {}

      if (onSuccess) onSuccess();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Fecha */}
      <div>
        <label className="block text-xs font-semibold text-slate-400 mb-1 flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-emerald-400" />
          Fecha del Turno
        </label>
        <input
          type="date"
          value={fecha}
          onChange={e => setFecha(e.target.value)}
          className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
          required
        />
      </div>

      {/* Tiempo Activo en Reparto */}
      <div className="bg-slate-900/50 p-3 rounded-2xl border border-white/5 space-y-2">
        <label className="text-xs font-semibold text-emerald-400 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-emerald-400" />
            Tiempo de Reparto (Activo en Pedidos)
          </span>
          <span className="text-xs font-bold text-white bg-emerald-500/20 px-2 py-0.5 rounded-full">
            {formatMinutes(totalRepartoMin)}
          </span>
        </label>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <span className="text-[11px] text-slate-400 block mb-1">Horas</span>
            <div className="flex items-center">
              <button
                type="button"
                onClick={() => setRepartoHoras(Math.max(0, repartoHoras - 1))}
                className="w-9 h-9 bg-slate-800 rounded-l-xl text-slate-200 hover:bg-slate-700 active:bg-slate-600 font-bold"
              >
                -
              </button>
              <input
                type="number"
                min="0"
                max="24"
                value={repartoHoras}
                onChange={e => setRepartoHoras(parseInt(e.target.value) || 0)}
                className="w-full text-center bg-slate-950 border-y border-white/10 h-9 text-sm font-semibold text-white focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setRepartoHoras(repartoHoras + 1)}
                className="w-9 h-9 bg-slate-800 rounded-r-xl text-slate-200 hover:bg-slate-700 active:bg-slate-600 font-bold"
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
                onClick={() => setRepartoMinutos(Math.max(0, repartoMinutos - 15))}
                className="w-9 h-9 bg-slate-800 rounded-l-xl text-slate-200 hover:bg-slate-700 active:bg-slate-600 font-bold"
              >
                -
              </button>
              <input
                type="number"
                min="0"
                max="59"
                step="1"
                value={repartoMinutos}
                onChange={e => setRepartoMinutos(parseInt(e.target.value) || 0)}
                className="w-full text-center bg-slate-950 border-y border-white/10 h-9 text-sm font-semibold text-white focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setRepartoMinutos((repartoMinutos + 15) % 60)}
                className="w-9 h-9 bg-slate-800 rounded-r-xl text-slate-200 hover:bg-slate-700 active:bg-slate-600 font-bold"
              >
                +
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tiempo de Espera / Muerto */}
      <div className="bg-slate-900/50 p-3 rounded-2xl border border-white/5 space-y-2">
        <label className="text-xs font-semibold text-amber-400 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            Tiempo de Espera / Muerto (En Calle)
          </span>
          <span className="text-xs font-bold text-white bg-amber-500/20 px-2 py-0.5 rounded-full">
            {formatMinutes(totalEsperaMin)}
          </span>
        </label>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <span className="text-[11px] text-slate-400 block mb-1">Horas</span>
            <div className="flex items-center">
              <button
                type="button"
                onClick={() => setEsperaHoras(Math.max(0, esperaHoras - 1))}
                className="w-9 h-9 bg-slate-800 rounded-l-xl text-slate-200 hover:bg-slate-700 active:bg-slate-600 font-bold"
              >
                -
              </button>
              <input
                type="number"
                min="0"
                max="24"
                value={esperaHoras}
                onChange={e => setEsperaHoras(parseInt(e.target.value) || 0)}
                className="w-full text-center bg-slate-950 border-y border-white/10 h-9 text-sm font-semibold text-white focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setEsperaHoras(esperaHoras + 1)}
                className="w-9 h-9 bg-slate-800 rounded-r-xl text-slate-200 hover:bg-slate-700 active:bg-slate-600 font-bold"
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
                onClick={() => setEsperaMinutos(Math.max(0, esperaMinutos - 15))}
                className="w-9 h-9 bg-slate-800 rounded-l-xl text-slate-200 hover:bg-slate-700 active:bg-slate-600 font-bold"
              >
                -
              </button>
              <input
                type="number"
                min="0"
                max="59"
                step="1"
                value={esperaMinutos}
                onChange={e => setEsperaMinutos(parseInt(e.target.value) || 0)}
                className="w-full text-center bg-slate-950 border-y border-white/10 h-9 text-sm font-semibold text-white focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setEsperaMinutos((esperaMinutos + 15) % 60)}
                className="w-9 h-9 bg-slate-800 rounded-r-xl text-slate-200 hover:bg-slate-700 active:bg-slate-600 font-bold"
              >
                +
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Resumen Calculado en Vivo */}
      <div className="bg-gradient-to-r from-emerald-950/40 to-slate-900/80 p-3 rounded-xl border border-emerald-500/20 flex items-center justify-between text-xs">
        <div>
          <span className="text-slate-400">Tiempo Total: </span>
          <span className="font-bold text-white">{formatMinutes(totalMin)}</span>
        </div>
        <div>
          <span className="text-slate-400">Productividad: </span>
          <span className="font-bold text-emerald-400">{ratioProductividad}%</span>
        </div>
      </div>

      {/* Kilómetros Recorridos y Lectura de Odómetro Físico */}
      <div className="bg-slate-900/50 p-3.5 rounded-2xl border border-white/5 space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Gauge className="w-3.5 h-3.5 text-cyan-400" />
            Kilómetros Recorridos
          </label>
          <button
            type="button"
            onClick={() => setShowOdometerInputs(!showOdometerInputs)}
            className="text-[11px] text-cyan-400 hover:text-cyan-300 font-medium underline cursor-pointer"
          >
            {showOdometerInputs ? 'Ocultar Odómetro Físico' : '+ Lectura de Odómetro Físico'}
          </button>
        </div>

        {showOdometerInputs && (
          <div className="p-2.5 rounded-xl bg-slate-950/70 border border-white/10 space-y-2 text-xs">
            <p className="text-[11px] text-slate-400">
              Ingresa el odómetro del tablero del vehículo para calcular la distancia exacta automáticamente.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-[10px] text-slate-400 block mb-1">Odómetro Inicial</span>
                <input
                  type="number"
                  step="any"
                  placeholder="ej. 12450"
                  value={odometerStart}
                  onChange={e => setOdometerStart(e.target.value)}
                  className="w-full bg-slate-900 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block mb-1">Odómetro Final</span>
                <input
                  type="number"
                  step="any"
                  placeholder="ej. 12495"
                  value={odometerEnd}
                  onChange={e => setOdometerEnd(e.target.value)}
                  className="w-full bg-slate-900 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            {hasValidOdometer && (
              <div className="text-[11px] text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-1 rounded">
                ✓ Distancia calculada por odómetro: {odoCalculatedDistance} km
              </div>
            )}
            {numOdoStart !== null && numOdoEnd !== null && numOdoEnd < numOdoStart && (
              <div className="text-[11px] text-rose-400 font-medium bg-rose-500/10 px-2 py-1 rounded">
                ⚠ El odómetro final debe ser mayor o igual al inicial.
              </div>
            )}
          </div>
        )}

        <div className="relative">
          <input
            type="number"
            step="any"
            min="0"
            value={hasValidOdometer ? odoCalculatedDistance! : kilometros}
            onChange={e => setKilometros(e.target.value)}
            disabled={hasValidOdometer}
            placeholder="ej. 45.0"
            className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 disabled:opacity-75"
            required
          />
          <span className="absolute right-3.5 top-2.5 text-xs text-slate-400 font-medium">km</span>
        </div>
      </div>

      {/* Botón de Guardado */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 active:scale-[0.98] text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
      >
        <Check className="w-4 h-4 stroke-[3]" />
        {isSubmitting ? 'Guardando...' : 'Guardar Turno'}
      </button>
    </form>
  );
};
