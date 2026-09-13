import React, { useState } from 'react';
import { useAppData } from '../../context/AppDataContext';
import { getLocalDateString } from '../../lib/calculations';
import { Fuel, Utensils, Wrench, CircleDollarSign, Check } from 'lucide-react';
import confetti from 'canvas-confetti';

interface QuickExpenseFormProps {
  onSuccess?: () => void;
}

const PRESET_CATEGORIES = [
  {
    id: 'COMBUSTIBLE',
    subcat: 'Gasolina',
    label: 'Tanqueada Gasolina',
    icon: Fuel,
    color: 'text-amber-500 border-amber-500/30 bg-amber-500/10',
    defaultAmount: '18000'
  },
  {
    id: 'ALIMENTACION',
    subcat: 'Almuerzo / Comida',
    label: 'Almuerzo / Comida',
    icon: Utensils,
    color: 'text-orange-500 border-orange-500/30 bg-orange-500/10',
    defaultAmount: '14000'
  },
  {
    id: 'MANTENIMIENTO_MOTO',
    subcat: 'Taller y Aceite',
    label: 'Mantenimiento Moto',
    icon: Wrench,
    color: 'text-cyan-500 border-cyan-500/30 bg-cyan-500/10',
    defaultAmount: '45000'
  },
  {
    id: 'OTROS_GASTOS',
    subcat: 'Imprevisto',
    label: 'Otro Gasto',
    icon: CircleDollarSign,
    color: 'text-purple-500 border-purple-500/30 bg-purple-500/10',
    defaultAmount: '10000'
  }
];

const QUICK_AMOUNTS = ['10000', '15000', '20000', '30000', '50000'];

export const QuickExpenseForm: React.FC<QuickExpenseFormProps> = ({ onSuccess }) => {
  const { addTransaction, shifts } = useAppData();

  const [fecha] = useState(getLocalDateString());
  const [selectedCategory, setSelectedCategory] = useState(PRESET_CATEGORIES[0]);
  const [monto, setMonto] = useState(PRESET_CATEGORIES[0].defaultAmount);
  const [medioPago, setMedioPago] = useState<'EFECTIVO' | 'BRE_B' | 'APP'>('EFECTIVO');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const todayShift = shifts.find(s => s.fecha === fecha);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numMonto = parseFloat(monto);
    if (!numMonto || numMonto <= 0) {
      alert('Por favor ingresa un monto válido.');
      return;
    }

    setIsSubmitting(true);
    try {
      await addTransaction({
        fecha,
        tipo: 'GASTO',
        categoria: selectedCategory.id,
        subcategoria: selectedCategory.subcat,
        descripcion: selectedCategory.label,
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
      {/* Botones de Categorías Rápidas */}
      <div>
        <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
          Categoría de Gasto
        </label>
        <div className="grid grid-cols-2 gap-2">
          {PRESET_CATEGORIES.map(cat => {
            const isSelected = selectedCategory.id === cat.id;
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  setSelectedCategory(cat);
                  setMonto(cat.defaultAmount);
                }}
                className={`flex items-center gap-2 p-2.5 rounded-xl text-left border transition-all ${
                  isSelected
                    ? `${cat.color} font-bold shadow-sm ring-1 ring-rose-500/40`
                    : 'bg-slate-100 dark:bg-slate-900/60 border-slate-200 dark:border-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="text-xs truncate">{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Monto del Gasto */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
          Monto del Gasto ($)
        </label>
        <div className="relative">
          <span className="absolute left-3.5 top-2.5 text-xs text-slate-400 font-bold">$</span>
          <input
            type="number"
            min="0"
            step="any"
            value={monto}
            onChange={e => setMonto(e.target.value)}
            className="w-full bg-white dark:bg-slate-900/80 border border-slate-300 dark:border-white/10 rounded-xl pl-8 pr-3 py-2.5 text-base text-rose-500 dark:text-rose-400 font-bold focus:outline-none focus:border-rose-500"
            required
          />
        </div>

        {/* Atajos de Monto */}
        <div className="flex gap-1.5 mt-2 overflow-x-auto pb-1">
          {QUICK_AMOUNTS.map(amt => (
            <button
              key={amt}
              type="button"
              onClick={() => setMonto(amt)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                monto === amt
                  ? 'bg-rose-500/20 text-rose-600 dark:text-rose-300 border-rose-500/40 font-bold'
                  : 'bg-slate-100 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/5 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              ${parseInt(amt).toLocaleString()}
            </button>
          ))}
        </div>
      </div>

      {/* Medio de Pago Requerido: Efectivo, Bre-B, App */}
      <div>
        <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
          ¿Cómo se pagó?
        </label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { id: 'EFECTIVO', label: '💵 Efectivo' },
            { id: 'BRE_B', label: '⚡ Bre-B' },
            { id: 'APP', label: '📱 App' }
          ].map(method => (
            <button
              key={method.id}
              type="button"
              onClick={() => setMedioPago(method.id as any)}
              className={`p-2.5 rounded-xl text-center border text-xs font-semibold transition-all ${
                medioPago === method.id
                  ? 'bg-slate-900 dark:bg-slate-800 text-white border-rose-500/50 shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-900/50 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/5 hover:bg-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              {monto && method.id === 'EFECTIVO' ? '💵 Efectivo' : method.label}
            </button>
          ))}
        </div>
      </div>

      {/* Botón de Guardado */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-400 text-white font-bold text-sm shadow-md shadow-rose-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
      >
        <Check className="w-4 h-4 stroke-[3]" />
        {isSubmitting ? 'Guardando...' : `Registrar ${selectedCategory.label}`}
      </button>
    </form>
  );
};
