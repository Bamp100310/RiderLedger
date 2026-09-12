import React, { useState, useEffect } from 'react';
import { Transaction, TransactionType, PaymentMethod } from '../../types';
import { useAppData } from '../../context/AppDataContext';
import { formatCurrency } from '../../lib/calculations';
import { X, Check, TrendingUp, TrendingDown, Wallet, Calendar, DollarSign, Tag, Smartphone, FileText } from 'lucide-react';

interface EditTransactionModalProps {
  transaction: Transaction | null;
  isOpen: boolean;
  onClose: () => void;
}

export const EditTransactionModal: React.FC<EditTransactionModalProps> = ({
  transaction,
  isOpen,
  onClose
}) => {
  const { updateTransaction, activeDeliveryApps, activePassengerApps } = useAppData();

  const [fecha, setFecha] = useState('');
  const [monto, setMonto] = useState('');
  const [tipo, setTipo] = useState<TransactionType>('INGRESO');
  const [categoria, setCategoria] = useState('');
  const [subcategoria, setSubcategoria] = useState('');
  const [medioPago, setMedioPago] = useState<PaymentMethod>('APP');
  const [descripcion, setDescripcion] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (transaction) {
      setFecha(transaction.fecha || '');
      setMonto(String(transaction.monto || ''));
      setTipo(transaction.tipo);
      setCategoria(transaction.categoria);
      setSubcategoria(transaction.subcategoria);
      setMedioPago(transaction.medio_pago);
      setDescripcion(transaction.descripcion || '');
    }
  }, [transaction]);

  if (!isOpen || !transaction) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(monto);
    if (!monto || isNaN(num) || num <= 0) {
      alert('Por favor ingresa un monto válido mayor a 0');
      return;
    }
    if (!fecha) {
      alert('Por favor selecciona una fecha válida');
      return;
    }

    setIsSubmitting(true);
    try {
      await updateTransaction({
        ...transaction,
        fecha,
        monto: num,
        tipo,
        categoria: categoria.trim() || (tipo === 'INGRESO' ? 'DOMICILIOS' : 'OTROS_GASTOS'),
        subcategoria: subcategoria.trim() || 'General',
        medio_pago: medioPago,
        descripcion: descripcion.trim() || null
      });
      onClose();
    } catch (err) {
      console.error('Error al actualizar movimiento', err);
      alert('Error al guardar los cambios');
    } finally {
      setIsSubmitting(false);
    }
  };

  const deliveryPresets = activeDeliveryApps.length > 0
    ? activeDeliveryApps.map(a => a.nombre)
    : ['Rappi', 'Didi Food', 'Mensajeros Urbanos', 'Armi'];

  const passengerPresets = activePassengerApps.length > 0
    ? activePassengerApps.map(a => a.nombre)
    : ['Yango Pro', 'Uber Pasajeros', 'InDrive Moto', 'Particular'];

  const expensePresets = [
    { cat: 'COMBUSTIBLE', name: 'Gasolina' },
    { cat: 'ALIMENTACION', name: 'Almuerzo / Comida' },
    { cat: 'MANTENIMIENTO_MOTO', name: 'Mantenimiento Moto' },
    { cat: 'OTROS_GASTOS', name: 'Otro Gasto' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs animate-fade-in overflow-y-auto">
      <div className="app-card rounded-2xl w-full max-w-lg shadow-2xl border border-white/10 my-8 overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-white/10 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/40">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl ${
              tipo === 'INGRESO'
                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                : tipo === 'GASTO'
                ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
            }`}>
              {tipo === 'INGRESO' && <TrendingUp className="w-5 h-5" />}
              {tipo === 'GASTO' && <TrendingDown className="w-5 h-5" />}
              {tipo === 'COBRO_EFECTIVO_APP' && <Wallet className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Editar Movimiento
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Corrige datos, montos o métodos de pago registrados
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 max-h-[calc(85vh-120px)] overflow-y-auto">
          {/* Tipo de Movimiento */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Tipo de Movimiento
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  setTipo('INGRESO');
                  if (!categoria || categoria === 'COMBUSTIBLE' || categoria === 'ALIMENTACION') {
                    setCategoria('DOMICILIOS');
                  }
                }}
                className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                  tipo === 'INGRESO'
                    ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/5 hover:border-slate-300'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Ingreso</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setTipo('GASTO');
                  if (!categoria || categoria === 'DOMICILIOS' || categoria === 'PASAJEROS') {
                    setCategoria('COMBUSTIBLE');
                    setSubcategoria('Gasolina');
                  }
                }}
                className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                  tipo === 'GASTO'
                    ? 'bg-rose-500 text-white border-rose-500 shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/5 hover:border-slate-300'
                }`}
              >
                <TrendingDown className="w-3.5 h-3.5" />
                <span>Gasto</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setTipo('COBRO_EFECTIVO_APP');
                  setMedioPago('EFECTIVO');
                }}
                className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                  tipo === 'COBRO_EFECTIVO_APP'
                    ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/5 hover:border-slate-300'
                }`}
              >
                <Wallet className="w-3.5 h-3.5" />
                <span>Cobro App</span>
              </button>
            </div>
          </div>

          {/* Fecha y Monto */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Fecha del Movimiento
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                <input
                  type="date"
                  value={fecha}
                  onChange={e => setFecha(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Monto ($ COP)
              </label>
              <div className="relative">
                <span className="text-slate-400 font-bold text-xs absolute left-3 top-2.5">$</span>
                <input
                  type="number"
                  step="100"
                  value={monto}
                  onChange={e => setMonto(e.target.value)}
                  placeholder="ej. 25000"
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl pl-8 pr-3 py-2 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>
              {monto && !isNaN(Number(monto)) && Number(monto) > 0 && (
                <span className="text-[10px] text-cyan-600 dark:text-cyan-400 font-semibold mt-0.5 block">
                  {formatCurrency(Number(monto))}
                </span>
              )}
            </div>
          </div>

          {/* Categoría y Subcategoría / Plataforma */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Plataforma o Concepto
            </label>
            
            {/* Quick selector pills based on type */}
            <div className="flex flex-wrap gap-1.5">
              {(tipo === 'INGRESO' || tipo === 'COBRO_EFECTIVO_APP') ? (
                <>
                  {deliveryPresets.map(app => (
                    <button
                      key={app}
                      type="button"
                      onClick={() => {
                        setCategoria('DOMICILIOS');
                        setSubcategoria(app);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                        subcategoria === app
                          ? 'bg-cyan-500 text-white border-cyan-500'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-transparent hover:bg-slate-200'
                      }`}
                    >
                      {app}
                    </button>
                  ))}
                  {passengerPresets.map(app => (
                    <button
                      key={app}
                      type="button"
                      onClick={() => {
                        setCategoria('PASAJEROS');
                        setSubcategoria(app);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                        subcategoria === app
                          ? 'bg-cyan-500 text-white border-cyan-500'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-transparent hover:bg-slate-200'
                      }`}
                    >
                      {app}
                    </button>
                  ))}
                </>
              ) : (
                expensePresets.map(item => (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => {
                      setCategoria(item.cat);
                      setSubcategoria(item.name);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                      subcategoria === item.name
                        ? 'bg-rose-500 text-white border-rose-500'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-transparent hover:bg-slate-200'
                    }`}
                  >
                    {item.name}
                  </button>
                ))
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <div>
                <span className="text-[10px] text-slate-400 block mb-0.5">Nombre / Subcategoría</span>
                <input
                  type="text"
                  value={subcategoria}
                  onChange={e => setSubcategoria(e.target.value)}
                  placeholder="ej. Rappi / Gasolina"
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>

              <div>
                <span className="text-[10px] text-slate-400 block mb-0.5">Categoría General</span>
                <select
                  value={categoria}
                  onChange={e => setCategoria(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="DOMICILIOS">DOMICILIOS</option>
                  <option value="PASAJEROS">PASAJEROS</option>
                  <option value="OTROS_INGRESOS">OTROS INGRESOS</option>
                  <option value="COMBUSTIBLE">COMBUSTIBLE / GASOLINA</option>
                  <option value="ALIMENTACION">ALIMENTACIÓN</option>
                  <option value="MANTENIMIENTO_MOTO">MANTENIMIENTO MOTO</option>
                  <option value="CUOTA_CREDITO">CUOTA CRÉDITO</option>
                  <option value="OTROS_GASTOS">OTROS GASTOS</option>
                </select>
              </div>
            </div>
          </div>

          {/* Medio de Pago */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Medio de Pago
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setMedioPago('EFECTIVO')}
                className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                  medioPago === 'EFECTIVO'
                    ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/5'
                }`}
              >
                <span>💵 Efectivo</span>
              </button>

              <button
                type="button"
                onClick={() => setMedioPago('BRE_B')}
                className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                  medioPago === 'BRE_B'
                    ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/5'
                }`}
              >
                <span>⚡ Bre-B</span>
              </button>

              <button
                type="button"
                onClick={() => setMedioPago('APP')}
                className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                  medioPago === 'APP'
                    ? 'bg-cyan-500 text-white border-cyan-500 shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/5'
                }`}
              >
                <span>📱 Saldo App</span>
              </button>
            </div>
          </div>

          {/* Descripción / Detalle */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Descripción o Detalle (Opcional)
            </label>
            <div className="relative">
              <FileText className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                value={descripcion}
                onChange={e => setDescripcion(e.target.value)}
                placeholder="ej. Entrega Rappi / Almuerzo corrientazo"
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Modal Actions */}
          <div className="pt-3 border-t border-slate-100 dark:border-white/10 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-white shadow-md shadow-cyan-500/20 transition-all flex items-center gap-1.5"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>{isSubmitting ? 'Guardando...' : 'Guardar Cambios'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
