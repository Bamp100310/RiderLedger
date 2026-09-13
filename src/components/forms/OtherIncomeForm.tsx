import React, { useState } from 'react';
import { useAppData } from '../../context/AppDataContext';
import { getLocalDateString } from '../../lib/calculations';
import { Check } from 'lucide-react';
import confetti from 'canvas-confetti';

interface OtherIncomeFormProps {
  onSuccess?: () => void;
}

export const OtherIncomeForm: React.FC<OtherIncomeFormProps> = ({ onSuccess }) => {
  const { addTransaction, shifts, activePassengerApps } = useAppData();

  const passengerApps = activePassengerApps.length > 0
    ? activePassengerApps
    : [
        { id: '1', nombre: 'Yango Pro', color: '#f43f5e' },
        { id: '2', nombre: 'InDrive Moto', color: '#10b981' },
        { id: '3', nombre: 'Uber Pasajeros', color: '#06b6d4' },
        { id: '4', nombre: 'Particular', color: '#8b5cf6' }
      ];

  const [fecha] = useState(getLocalDateString());
  const [selectedSubcat, setSelectedSubcat] = useState(passengerApps[0]?.nombre || 'Yango Pro');
  const [monto, setMonto] = useState('');
  const [medioPago, setMedioPago] = useState<'EFECTIVO' | 'BRE_B' | 'APP'>('EFECTIVO');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const todayShift = shifts.find(s => s.fecha === fecha);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numMonto = parseFloat(monto);
    if (!numMonto || numMonto <= 0) {
      alert('Ingresa un monto válido.');
      return;
    }

    setIsSubmitting(true);
    try {
      await addTransaction({
        fecha,
        tipo: 'INGRESO',
        categoria: 'PASAJEROS',
        subcategoria: selectedSubcat,
        descripcion: `Viaje ${selectedSubcat}`,
        monto: numMonto,
        medio_pago: medioPago,
        shift_id: todayShift ? todayShift.id : null
      });

      try {
        confetti({
          particleCount: 25,
          spread: 45,
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
      {/* Selector Dinámico de Pasajeros */}
      <div>
        <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
          Plataforma de Pasajeros / Servicio
        </label>
        <div className="grid grid-cols-2 gap-2">
          {passengerApps.map(app => {
            const isSelected = selectedSubcat === app.nombre;
            return (
              <button
                key={app.id || app.nombre}
                type="button"
                onClick={() => setSelectedSubcat(app.nombre)}
                className={`flex items-center justify-center p-2.5 rounded-xl border text-xs font-bold transition-all ${
                  isSelected
                    ? 'bg-cyan-500/15 border-cyan-500 text-cyan-600 dark:text-cyan-400 shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-900/60 border-slate-200 dark:border-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
                }`}
              >
                <span>{app.nombre}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Monto Recibido */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
          Monto Ganado ($)
        </label>
        <div className="relative">
          <span className="absolute left-3.5 top-2.5 text-xs text-slate-400 font-bold">$</span>
          <input
            type="number"
            min="0"
            step="any"
            placeholder="15000"
            value={monto}
            onChange={e => setMonto(e.target.value)}
            className="w-full bg-white dark:bg-slate-900/80 border border-slate-300 dark:border-white/10 rounded-xl pl-8 pr-3 py-2.5 text-base text-cyan-600 dark:text-cyan-400 font-bold focus:outline-none focus:border-cyan-500"
            required
          />
        </div>
      </div>

      {/* Medio de Pago Requerido: Efectivo, Bre-B, App */}
      <div>
        <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
          Medio de Pago
        </label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { id: 'EFECTIVO', label: '💵 Efectivo' },
            { id: 'BRE_B', label: '⚡ Bre-B' },
            { id: 'APP', label: '📱 App' }
          ].map(m => (
            <button
              key={m.id}
              type="button"
              onClick={() => setMedioPago(m.id as any)}
              className={`p-2.5 rounded-xl text-center border text-xs font-semibold transition-all ${
                medioPago === m.id
                  ? 'bg-slate-900 dark:bg-slate-800 text-white border-cyan-500/50 shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-900/50 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/5 hover:bg-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Botón Guardar */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 text-white font-bold text-sm shadow-md shadow-cyan-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
      >
        <Check className="w-4 h-4 stroke-[3]" />
        {isSubmitting ? 'Guardando...' : 'Registrar Ingreso'}
      </button>
    </form>
  );
};
