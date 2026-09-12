import React, { useState } from 'react';
import { useAppData } from '../../context/AppDataContext';
import { getLocalDateString } from '../../lib/calculations';
import { Users, Package, DollarSign, Check } from 'lucide-react';
import confetti from 'canvas-confetti';

interface OtherIncomeFormProps {
  onSuccess?: () => void;
}

const CATEGORIES = [
  { id: 'PASAJEROS', label: 'Pasajeros (Moto)', icon: Users, subcategories: ['Didi Moto', 'InDrive Moto', 'Uber Pasajeros', 'Particular'] },
  { id: 'OTROS_INGRESOS', label: 'Encomiendas / Otros', icon: Package, subcategories: ['Encomienda Directa', 'Mensajería Express', 'Otro Trabajo'] }
];

export const OtherIncomeForm: React.FC<OtherIncomeFormProps> = ({ onSuccess }) => {
  const { addTransaction, shifts } = useAppData();

  const [fecha, setFecha] = useState(getLocalDateString());
  const [categoria, setCategoria] = useState(CATEGORIES[0].id);
  const [subcategoria, setSubcategoria] = useState(CATEGORIES[0].subcategories[0]);
  const [monto, setMonto] = useState('');
  const [medioPago, setMedioPago] = useState<'EFECTIVO' | 'TRANSFERENCIA_BANCO' | 'APP'>('EFECTIVO');
  const [descripcion, setDescripcion] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const todayShift = shifts.find(s => s.fecha === fecha);

  const activeCategoryObj = CATEGORIES.find(c => c.id === categoria) || CATEGORIES[0];

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
        categoria,
        subcategoria,
        descripcion: descripcion.trim() || `${subcategoria}`,
        monto: numMonto,
        medio_pago: medioPago,
        shift_id: todayShift ? todayShift.id : null
      });

      try {
        confetti({
          particleCount: 30,
          spread: 50,
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
      {/* Selector de Tipo de Trabajo */}
      <div>
        <label className="block text-xs font-semibold text-slate-400 mb-1.5">
          Tipo de Ingreso
        </label>
        <div className="grid grid-cols-2 gap-2">
          {CATEGORIES.map(cat => {
            const Icon = cat.icon;
            const isSelected = categoria === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  setCategoria(cat.id);
                  setSubcategoria(cat.subcategories[0]);
                }}
                className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all ${
                  isSelected
                    ? 'bg-cyan-950/60 border-cyan-500 text-cyan-300'
                    : 'bg-slate-900/60 border-white/5 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Subcategorías / Apps de Pasajeros */}
      <div>
        <label className="block text-xs font-semibold text-slate-400 mb-1.5">
          Plataforma o Concepto
        </label>
        <div className="flex flex-wrap gap-1.5">
          {activeCategoryObj.subcategories.map(sub => (
            <button
              key={sub}
              type="button"
              onClick={() => setSubcategoria(sub)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                subcategoria === sub
                  ? 'bg-slate-800 text-cyan-400 border-cyan-500/50'
                  : 'bg-slate-900/50 text-slate-400 border-white/5 hover:text-white'
              }`}
            >
              {sub}
            </button>
          ))}
        </div>
      </div>

      {/* Monto Recibido */}
      <div>
        <label className="block text-xs font-semibold text-slate-300 mb-1">
          Monto Ganado ($)
        </label>
        <div className="relative">
          <span className="absolute left-3.5 top-2.5 text-xs text-slate-400 font-bold">$</span>
          <input
            type="number"
            min="0"
            step="500"
            placeholder="15000"
            value={monto}
            onChange={e => setMonto(e.target.value)}
            className="w-full bg-slate-900/80 border border-white/10 rounded-xl pl-8 pr-3 py-2.5 text-base text-cyan-400 font-bold focus:outline-none focus:border-cyan-500"
            required
          />
        </div>
      </div>

      {/* Medio de Pago */}
      <div>
        <label className="block text-xs font-semibold text-slate-400 mb-1">
          Medio de Pago Recibido
        </label>
        <div className="grid grid-cols-2 gap-2">
          {[
            { id: 'EFECTIVO', label: '💵 Efectivo (Mano)' },
            { id: 'TRANSFERENCIA_BANCO', label: '📱 Nequi / Daviplata' }
          ].map(m => (
            <button
              key={m.id}
              type="button"
              onClick={() => setMedioPago(m.id as any)}
              className={`p-2.5 rounded-xl text-center border text-xs font-semibold transition-all ${
                medioPago === m.id
                  ? 'bg-slate-800 text-white border-cyan-500/50'
                  : 'bg-slate-900/50 text-slate-400 border-white/5 hover:bg-slate-800'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Detalle */}
      <div>
        <label className="block text-xs font-semibold text-slate-400 mb-1">
          Ruta o Detalle (Opcional)
        </label>
        <input
          type="text"
          value={descripcion}
          onChange={e => setDescripcion(e.target.value)}
          placeholder="ej. Carrera de Galerías a Unicentro"
          className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-slate-500"
        />
      </div>

      {/* Botón Guardar */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 text-slate-950 font-bold text-sm shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
      >
        <Check className="w-4 h-4 stroke-[3]" />
        {isSubmitting ? 'Guardando...' : 'Registrar Ingreso'}
      </button>
    </form>
  );
};
