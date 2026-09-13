import React, { useState, useEffect } from 'react';
import { CreditInstallment } from '../../types';
import { useAppData } from '../../context/AppDataContext';
import { formatCurrency } from '../../lib/calculations';
import { X, Check, CreditCard, DollarSign, Calendar, FileText } from 'lucide-react';

interface EditCreditModalProps {
  credit: CreditInstallment | null;
  isOpen: boolean;
  onClose: () => void;
}

export const EditCreditModal: React.FC<EditCreditModalProps> = ({
  credit,
  isOpen,
  onClose
}) => {
  const { updateCredit } = useAppData();

  const [nombre, setNombre] = useState('');
  const [montoCuota, setMontoCuota] = useState('');
  const [diaPago, setDiaPago] = useState<10 | 30>(30);
  const [descripcion, setDescripcion] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (credit) {
      setNombre(credit.nombre || '');
      setMontoCuota(String(credit.montoCuota || ''));
      setDiaPago(credit.diaPago === 10 ? 10 : 30);
      setDescripcion(credit.descripcion || '');
    }
  }, [credit]);

  if (!isOpen || !credit) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(montoCuota);
    if (!nombre.trim() || !num || num <= 0) {
      alert('Ingresa un nombre y un valor de cuota válido');
      return;
    }

    setIsSubmitting(true);
    try {
      updateCredit({
        ...credit,
        nombre: nombre.trim(),
        montoCuota: num,
        diaPago,
        descripcion: descripcion.trim() || undefined
      });
      onClose();
    } catch (err) {
      console.error('Error al actualizar crédito:', err);
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
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Editar Cuota / Crédito
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Modifica los datos de tu compromiso financiero
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
          {/* Nombre de la Cuota */}
          <div>
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1 flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-cyan-500" />
              Nombre de la Obligación o Crédito
            </label>
            <input
              type="text"
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              placeholder="Ej: Cuota Moto, Tarjeta, Préstamo"
              required
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white font-medium focus:outline-none focus:border-cyan-500 transition-colors"
            />
          </div>

          {/* Valor de la Cuota */}
          <div>
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1 flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
              Valor de la Cuota ($)
            </label>
            <input
              type="number"
              min="100"
              step="100"
              value={montoCuota}
              onChange={e => setMontoCuota(e.target.value)}
              placeholder="0"
              required
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-base font-black text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500 transition-colors"
            />
            {parseFloat(montoCuota) > 0 && (
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-1 block">
                {formatCurrency(parseFloat(montoCuota))}
              </span>
            )}
          </div>

          {/* Día de Pago */}
          <div>
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-indigo-500" />
              Día de Pago en el Mes
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setDiaPago(10)}
                className={`py-3 rounded-xl border text-xs font-bold transition-all flex flex-col items-center gap-0.5 ${
                  diaPago === 10
                    ? 'bg-cyan-500 text-white border-cyan-500 shadow-md'
                    : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:border-cyan-500/50'
                }`}
              >
                <span className="text-sm font-black">Día 10</span>
                <span className="text-[10px] opacity-80">Primera quincena</span>
              </button>
              <button
                type="button"
                onClick={() => setDiaPago(30)}
                className={`py-3 rounded-xl border text-xs font-bold transition-all flex flex-col items-center gap-0.5 ${
                  diaPago === 30
                    ? 'bg-cyan-500 text-white border-cyan-500 shadow-md'
                    : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:border-cyan-500/50'
                }`}
              >
                <span className="text-sm font-black">Día 30</span>
                <span className="text-[10px] opacity-80">Fin de mes</span>
              </button>
            </div>
          </div>

          {/* Descripción / Entidad */}
          <div>
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              Descripción o Entidad (Opcional)
            </label>
            <input
              type="text"
              value={descripcion}
              onChange={e => setDescripcion(e.target.value)}
              placeholder="Ej: Banco de Bogotá, Concesionario, Jhony"
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500 transition-colors"
            />
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
