import React, { useState } from 'react';
import { useAppData } from '../../context/AppDataContext';
import { getLocalDateString, formatCurrency } from '../../lib/calculations';
import { Wallet, AlertTriangle, Check } from 'lucide-react';
import confetti from 'canvas-confetti';

interface AppIncomeFormProps {
  onSuccess?: () => void;
}

export const AppIncomeForm: React.FC<AppIncomeFormProps> = ({ onSuccess }) => {
  const { addTransaction, shifts, activeDeliveryApps } = useAppData();

  const deliveryApps = activeDeliveryApps.length > 0
    ? activeDeliveryApps
    : [
        { id: '1', nombre: 'Rappi', icono: '🟠', color: '#f97316' },
        { id: '2', nombre: 'Didi Food', icono: '🟡', color: '#eab308' },
        { id: '3', nombre: 'Mensajeros Urbanos', icono: '🔴', color: '#ef4444' },
        { id: '4', nombre: 'Armi', icono: '🔵', color: '#0284c7' }
      ];

  const [fecha] = useState(getLocalDateString());
  const [selectedApp, setSelectedApp] = useState(deliveryApps[0]?.nombre || 'Rappi');
  const [tarifa, setTarifa] = useState('');
  const [propina, setPropina] = useState('');
  const [cobroEfectivo, setCobroEfectivo] = useState(false);
  const [montoCobradoEfectivo, setMontoCobradoEfectivo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      if (totalIngresoApp > 0) {
        await addTransaction({
          fecha,
          tipo: 'INGRESO',
          categoria: 'DOMICILIOS',
          subcategoria: selectedApp,
          descripcion: `Entrega ${selectedApp}`,
          monto: totalIngresoApp,
          medio_pago: 'APP',
          shift_id: todayShift ? todayShift.id : null
        });
      }

      if (cobroEfectivo && numCobroEfectivo > 0) {
        await addTransaction({
          fecha,
          tipo: 'COBRO_EFECTIVO_APP',
          categoria: 'DOMICILIOS',
          subcategoria: selectedApp,
          descripcion: `Cobro efectivo pedido ${selectedApp}`,
          monto: numCobroEfectivo,
          medio_pago: 'EFECTIVO',
          shift_id: todayShift ? todayShift.id : null
        });
      }

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
      {/* Selector Dinámico de Apps de Domicilio */}
      <div>
        <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
          Plataforma de Entrega
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {deliveryApps.map(app => {
            const isSelected = selectedApp === app.nombre;
            return (
              <button
                key={app.id || app.nombre}
                type="button"
                onClick={() => setSelectedApp(app.nombre)}
                className={`flex items-center gap-2 p-2.5 rounded-xl text-xs font-bold transition-all border text-left ${
                  isSelected
                    ? 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border-cyan-500 shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/5 hover:bg-slate-200 dark:hover:bg-slate-800'
                }`}
              >
                <span className="text-base">{app.icono || '🛵'}</span>
                <span className="truncate">{app.nombre}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Montos: Tarifa Base y Propina */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Tarifa del Pedido ($)
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
              className="w-full bg-white dark:bg-slate-900/80 border border-slate-300 dark:border-white/10 rounded-xl pl-7 pr-3 py-2.5 text-sm text-slate-900 dark:text-white font-semibold focus:outline-none focus:border-cyan-500"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Propina en App ($)
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
              className="w-full bg-white dark:bg-slate-900/80 border border-slate-300 dark:border-white/10 rounded-xl pl-7 pr-3 py-2.5 text-sm text-slate-900 dark:text-white font-semibold focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>
      </div>

      {/* Switch: Cobro en Efectivo al Cliente */}
      <div className="bg-slate-100 dark:bg-slate-900/70 p-3.5 rounded-2xl border border-slate-200 dark:border-white/10 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet className="w-4 h-4 text-amber-500 dark:text-amber-400" />
            <div>
              <p className="text-xs font-bold text-slate-800 dark:text-white">¿Cobraste pedido en efectivo?</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">Dinero entregado por el cliente</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setCobroEfectivo(!cobroEfectivo)}
            className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
              cobroEfectivo ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-800'
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
          <div className="pt-2 border-t border-slate-200 dark:border-white/5 space-y-2">
            <label className="block text-xs font-semibold text-amber-600 dark:text-amber-300">
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
                className="w-full bg-white dark:bg-slate-950 border border-amber-500/40 rounded-xl pl-7 pr-3 py-2 text-sm text-slate-900 dark:text-white font-bold focus:outline-none focus:border-amber-400"
                required={cobroEfectivo}
              />
            </div>
            <p className="text-[10px] text-amber-600 dark:text-amber-300/90 flex items-start gap-1">
              <AlertTriangle className="w-3 h-3 flex-shrink-0 mt-0.5 text-amber-500" />
              <span>
                Entra a tu <b>bolsillo físico (+ Efectivo)</b>, pero crea deuda con la app <b>(- Saldo App)</b>.
              </span>
            </p>
          </div>
        )}
      </div>

      {/* Resumen del impacto */}
      {(totalIngresoApp > 0 || numCobroEfectivo > 0) && (
        <div className="bg-slate-100 dark:bg-slate-900/90 p-3 rounded-xl border border-slate-200 dark:border-white/10 text-xs space-y-1.5">
          <div className="flex justify-between">
            <span className="text-slate-500 dark:text-slate-400">Ingreso por Envío:</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">+{formatCurrency(totalIngresoApp)}</span>
          </div>
          {numCobroEfectivo > 0 && (
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Cobro en Efectivo:</span>
              <span className="font-bold text-amber-600 dark:text-amber-400">+{formatCurrency(numCobroEfectivo)} (en mano)</span>
            </div>
          )}
          <div className="pt-1 border-t border-slate-200 dark:border-white/10 flex justify-between font-bold">
            <span className="text-slate-700 dark:text-slate-300">Impacto Saldo App:</span>
            <span className={impactoSaldoApp >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
              {impactoSaldoApp >= 0 ? `+${formatCurrency(impactoSaldoApp)} a favor` : `${formatCurrency(impactoSaldoApp)} a deber`}
            </span>
          </div>
        </div>
      )}

      {/* Botón de Guardado */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 text-white font-bold text-sm shadow-md shadow-cyan-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
      >
        <Check className="w-4 h-4 stroke-[3]" />
        {isSubmitting ? 'Guardando...' : `Registrar en ${selectedApp}`}
      </button>
    </form>
  );
};
