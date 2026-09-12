import React, { useState } from 'react';
import { useAppData } from '../../context/AppDataContext';
import { getLocalDateString, formatCurrency } from '../../lib/calculations';
import { Smartphone, DollarSign, Wallet, AlertTriangle, Check } from 'lucide-react';
import confetti from 'canvas-confetti';

interface AppIncomeFormProps {
  onSuccess?: () => void;
}

const APPS = [
  { name: 'Rappi', color: 'from-orange-500 to-amber-600', icon: '🟠' },
  { name: 'Didi Food', color: 'from-amber-500 to-yellow-600', icon: '🟡' },
  { name: 'Uber Eats', color: 'from-emerald-500 to-teal-600', icon: '🟢' },
  { name: 'TaDa Delivery', color: 'from-blue-500 to-cyan-600', icon: '🔵' },
  { name: 'Mensajería', color: 'from-purple-500 to-indigo-600', icon: '🟣' }
];

export const AppIncomeForm: React.FC<AppIncomeFormProps> = ({ onSuccess }) => {
  const { addTransaction, shifts } = useAppData();

  const [fecha, setFecha] = useState(getLocalDateString());
  const [selectedApp, setSelectedApp] = useState('Rappi');
  const [tarifa, setTarifa] = useState('');
  const [propina, setPropina] = useState('');
  const [cobroEfectivo, setCobroEfectivo] = useState(false);
  const [montoCobradoEfectivo, setMontoCobradoEfectivo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Vincular con el turno de hoy si existe
  const todayShift = shifts.find(s => s.fecha === fecha);

  const numTarifa = parseFloat(tarifa) || 0;
  const numPropina = parseFloat(propina) || 0;
  const totalIngresoApp = numTarifa + numPropina;
  const numCobroEfectivo = cobroEfectivo ? (parseFloat(montoCobradoEfectivo) || 0) : 0;

  const impactoSaldoApp = totalIngresoApp - numCobroEfectivo;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (totalIngresoApp <= 0 && numCobroEfectivo <= 0) {
      alert('Ingresa una tarifa o un cobro en efectivo.');
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Registrar el ingreso ganado por la app (Tarifa + Propina)
      if (totalIngresoApp > 0) {
        await addTransaction({
          fecha,
          tipo: 'INGRESO',
          categoria: 'DOMICILIOS',
          subcategoria: selectedApp,
          descripcion: `Entrega ${selectedApp}${numPropina > 0 ? ` (Tarifa: ${formatCurrency(numTarifa)} + Propina: ${formatCurrency(numPropina)})` : ''}`,
          monto: totalIngresoApp,
          medio_pago: 'APP',
          shift_id: todayShift ? todayShift.id : null
        });
      }

      // 2. Si el repartidor cobró efectivo al cliente por el pedido (comida en efectivo)
      if (cobroEfectivo && numCobroEfectivo > 0) {
        await addTransaction({
          fecha,
          tipo: 'COBRO_EFECTIVO_APP',
          categoria: 'DOMICILIOS',
          subcategoria: selectedApp,
          descripcion: `Cobro en mano pedido cliente (${selectedApp})`,
          monto: numCobroEfectivo,
          medio_pago: 'EFECTIVO',
          shift_id: todayShift ? todayShift.id : null
        });
      }

      try {
        confetti({
          particleCount: 35,
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
      {/* Selector Rápido de App */}
      <div>
        <label className="block text-xs font-semibold text-slate-400 mb-2">
          Selecciona la Plataforma
        </label>
        <div className="grid grid-cols-3 gap-2">
          {APPS.map(app => {
            const isSelected = selectedApp === app.name;
            return (
              <button
                key={app.name}
                type="button"
                onClick={() => setSelectedApp(app.name)}
                className={`flex items-center gap-1.5 p-2 rounded-xl text-xs font-bold transition-all border ${
                  isSelected
                    ? 'bg-slate-800 text-white border-emerald-500 shadow-md shadow-emerald-500/10'
                    : 'bg-slate-900/60 text-slate-400 border-white/5 hover:bg-slate-850'
                }`}
              >
                <span>{app.icon}</span>
                <span className="truncate">{app.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Montos: Tarifa Base y Propina */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Tarifa de Envío ($)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">$</span>
            <input
              type="number"
              min="0"
              step="500"
              placeholder="12000"
              value={tarifa}
              onChange={e => setTarifa(e.target.value)}
              className="w-full bg-slate-900/80 border border-white/10 rounded-xl pl-7 pr-3 py-2.5 text-sm text-white font-semibold focus:outline-none focus:border-emerald-500"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Propina App ($)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">$</span>
            <input
              type="number"
              min="0"
              step="500"
              placeholder="3000"
              value={propina}
              onChange={e => setPropina(e.target.value)}
              className="w-full bg-slate-900/80 border border-white/10 rounded-xl pl-7 pr-3 py-2.5 text-sm text-white font-semibold focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* Switch: Cobro en Efectivo al Cliente */}
      <div className="bg-slate-900/70 p-3.5 rounded-2xl border border-white/10 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet className="w-4 h-4 text-amber-400" />
            <div>
              <p className="text-xs font-bold text-white">¿Cobraste pedido en efectivo?</p>
              <p className="text-[10px] text-slate-400">Dinero entregado por el cliente</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setCobroEfectivo(!cobroEfectivo)}
            className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
              cobroEfectivo ? 'bg-amber-500' : 'bg-slate-800'
            }`}
          >
            <div
              className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                cobroEfectivo ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {cobroEfectivo && (
          <div className="pt-2 border-t border-white/5 space-y-2">
            <label className="block text-xs font-semibold text-amber-300">
              Monto en Efectivo Recibido ($)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">$</span>
              <input
                type="number"
                min="0"
                step="500"
                placeholder="45000"
                value={montoCobradoEfectivo}
                onChange={e => setMontoCobradoEfectivo(e.target.value)}
                className="w-full bg-slate-950 border border-amber-500/40 rounded-xl pl-7 pr-3 py-2 text-sm text-white font-bold focus:outline-none focus:border-amber-400"
                required={cobroEfectivo}
              />
            </div>
            <p className="text-[10px] text-amber-300/80 flex items-start gap-1">
              <AlertTriangle className="w-3 h-3 flex-shrink-0 mt-0.5 text-amber-400" />
              <span>
                Este dinero va a tu <b>bolsillo físico</b>, pero aumenta tu deuda con la plataforma (saldo en app).
              </span>
            </p>
          </div>
        )}
      </div>

      {/* Resumen del impacto financiero de esta orden */}
      {(totalIngresoApp > 0 || numCobroEfectivo > 0) && (
        <div className="bg-slate-900/90 p-3 rounded-xl border border-white/10 text-xs space-y-1.5">
          <div className="flex justify-between">
            <span className="text-slate-400">Ingreso por Envío:</span>
            <span className="font-bold text-emerald-400">+{formatCurrency(totalIngresoApp)}</span>
          </div>
          {numCobroEfectivo > 0 && (
            <div className="flex justify-between">
              <span className="text-slate-400">Cobro Efectivo Cliente:</span>
              <span className="font-bold text-amber-400">+{formatCurrency(numCobroEfectivo)} (en mano)</span>
            </div>
          )}
          <div className="pt-1 border-t border-white/10 flex justify-between font-bold">
            <span className="text-slate-300">Impacto en Saldo App:</span>
            <span className={impactoSaldoApp >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
              {impactoSaldoApp >= 0 ? `+${formatCurrency(impactoSaldoApp)} a favor` : `${formatCurrency(impactoSaldoApp)} a deber`}
            </span>
          </div>
        </div>
      )}

      {/* Botón de Guardado */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
      >
        <Check className="w-4 h-4 stroke-[3]" />
        {isSubmitting ? 'Registrando...' : 'Registrar Ingreso de App'}
      </button>
    </form>
  );
};
