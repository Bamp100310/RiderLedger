import React, { useState } from 'react';
import { CreditCardAccount } from '../../types';
import { X, CreditCard, DollarSign, Calendar, Percent } from 'lucide-react';

interface EditCreditCardModalProps {
  card: CreditCardAccount | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (card: Omit<CreditCardAccount, 'id' | 'userId'> & { id?: string }) => void;
}

export const EditCreditCardModal: React.FC<EditCreditCardModalProps> = ({
  card,
  isOpen,
  onClose,
  onSave
}) => {
  if (!isOpen) return null;

  const [nombre, setNombre] = useState(card?.nombre || '');
  const [bancoEntidad, setBancoEntidad] = useState(card?.bancoEntidad || '');
  const [ultimosDigitos, setUltimosDigitos] = useState(card?.ultimosDigitos || '');
  const [cupoTotal, setCupoTotal] = useState(card ? String(card.cupoTotal) : '');
  const [saldoUtilizado, setSaldoUtilizado] = useState(card ? String(card.saldoUtilizado) : '');
  const [pagoMinimo, setPagoMinimo] = useState(card ? String(card.pagoMinimo) : '');
  const [fechaCorte, setFechaCorte] = useState<number>(card?.fechaCorte || 15);
  const [fechaPago, setFechaPago] = useState<number>(card?.fechaPago || 30);
  const [tasaInteresEA, setTasaInteresEA] = useState(card?.tasaInteresEA ? String(card.tasaInteresEA) : '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cupo = parseFloat(cupoTotal);
    const saldo = parseFloat(saldoUtilizado) || 0;
    const minimo = parseFloat(pagoMinimo) || 0;
    const tasa = tasaInteresEA ? parseFloat(tasaInteresEA) : undefined;

    if (!nombre.trim() || isNaN(cupo) || cupo <= 0) {
      alert('Ingresa un nombre de tarjeta y un cupo total válido.');
      return;
    }

    onSave({
      id: card?.id,
      nombre: nombre.trim(),
      bancoEntidad: bancoEntidad.trim() || undefined,
      ultimosDigitos: ultimosDigitos.trim() || undefined,
      cupoTotal: cupo,
      saldoUtilizado: Math.max(0, saldo),
      pagoMinimo: Math.max(0, minimo),
      fechaCorte: Math.min(31, Math.max(1, fechaCorte)),
      fechaPago: Math.min(31, Math.max(1, fechaPago)),
      tasaInteresEA: tasa
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">
                {card ? 'Editar Tarjeta de Crédito' : 'Nueva Tarjeta de Crédito'}
              </h3>
              <p className="text-xs text-slate-400">
                Lleva el control de cupo, utilización del 30% y fecha de corte
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-bold mb-1">Nombre de la Tarjeta *</label>
              <input
                type="text"
                placeholder="ej: Nu, Bancolombia, RappiCard"
                value={nombre}
                onChange={e => setNombre(e.target.value)}
                className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-white font-medium focus:border-purple-500 focus:outline-hidden"
                required
              />
            </div>
            <div>
              <label className="block text-slate-300 font-bold mb-1">Banco / Entidad (Opcional)</label>
              <input
                type="text"
                placeholder="ej: Nu Colombia, BBVA"
                value={bancoEntidad}
                onChange={e => setBancoEntidad(e.target.value)}
                className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-white font-medium focus:border-purple-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-bold mb-1 flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                Cupo Total Aprobado ($ COP) *
              </label>
              <input
                type="number"
                placeholder="ej: 1500000"
                value={cupoTotal}
                onChange={e => setCupoTotal(e.target.value)}
                className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-white font-bold text-sm focus:border-purple-500 focus:outline-hidden"
                required
              />
            </div>
            <div>
              <label className="block text-slate-300 font-bold mb-1 flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-rose-400" />
                Saldo Utilizado Actualmente ($ COP)
              </label>
              <input
                type="number"
                placeholder="ej: 350000"
                value={saldoUtilizado}
                onChange={e => setSaldoUtilizado(e.target.value)}
                className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-white font-bold text-sm focus:border-purple-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-300 font-bold mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                Día de Corte (1-31)
              </label>
              <input
                type="number"
                min="1"
                max="31"
                value={fechaCorte}
                onChange={e => setFechaCorte(parseInt(e.target.value) || 1)}
                className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-white font-bold focus:border-purple-500 focus:outline-hidden"
                required
              />
            </div>
            <div>
              <label className="block text-slate-300 font-bold mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                Límite de Pago (1-31)
              </label>
              <input
                type="number"
                min="1"
                max="31"
                value={fechaPago}
                onChange={e => setFechaPago(parseInt(e.target.value) || 1)}
                className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-white font-bold focus:border-purple-500 focus:outline-hidden"
                required
              />
            </div>
            <div>
              <label className="block text-slate-300 font-bold mb-1 flex items-center gap-1">
                <Percent className="w-3.5 h-3.5 text-purple-400" />
                Tasa E.A. % (Opcional)
              </label>
              <input
                type="number"
                step="0.1"
                placeholder="ej: 25.8"
                value={tasaInteresEA}
                onChange={e => setTasaInteresEA(e.target.value)}
                className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-white font-medium focus:border-purple-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-bold mb-1">Pago Mínimo Sugerido ($ COP)</label>
              <input
                type="number"
                placeholder="ej: 30000"
                value={pagoMinimo}
                onChange={e => setPagoMinimo(e.target.value)}
                className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-white font-medium focus:border-purple-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-bold mb-1">Últimos 4 Dígitos (Opcional)</label>
              <input
                type="text"
                maxLength={4}
                placeholder="ej: 4092"
                value={ultimosDigitos}
                onChange={e => setUltimosDigitos(e.target.value)}
                className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-white font-medium focus:border-purple-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-xs transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 transition-all"
            >
              {card ? 'Guardar Cambios' : 'Crear Tarjeta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
