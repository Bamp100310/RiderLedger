import React, { useState } from 'react';
import { CreditInstallment } from '../../types';
import { useAppData } from '../../context/AppDataContext';
import { formatCurrency } from '../../lib/calculations';
import { EditCreditModal } from './EditCreditModal';
import { CreditCardsSection } from './CreditCardsSection';
import {
  CalendarClock,
  Plus,
  Trash2,
  Pencil,
  CheckCircle2,
  AlertCircle,
  Bell,
  CreditCard,
  Check,
  Clock,
  Calendar,
  Sparkles
} from 'lucide-react';

export const CreditsView: React.FC = () => {
  const {
    credits,
    creditAnalysis,
    addCredit,
    deleteCredit,
    toggleCreditPaid,
    requestNotificationPermission
  } = useAppData();

  const [activeTab, setActiveTab] = useState<'cuotas' | 'tarjetas'>('cuotas');
  const [editingCredit, setEditingCredit] = useState<CreditInstallment | null>(null);
  const [nombre, setNombre] = useState('');
  const [montoCuota, setMontoCuota] = useState('');
  const [diaPago, setDiaPago] = useState<10 | 30>(30);
  const [descripcion, setDescripcion] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [notifGranted, setNotifGranted] = useState(
    typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted'
  );

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(montoCuota);
    if (!nombre.trim() || !num || num <= 0) {
      alert('Ingresa un nombre y monto válido');
      return;
    }

    addCredit({
      nombre: nombre.trim(),
      montoCuota: num,
      diaPago,
      descripcion: descripcion.trim() || undefined,
      pagadoEsteMes: false
    });

    setNombre('');
    setMontoCuota('');
    setDescripcion('');
    setShowAddForm(false);
  };

  const handleRequestNotif = async () => {
    const granted = await requestNotificationPermission();
    setNotifGranted(granted);
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-20">
      {/* Cabecera */}
      <div className="app-card rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
            <CalendarClock className="w-5 h-5 text-cyan-500" />
            Gestión de Pasivos y Deuda
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Control de cuotas fijas (10 y 30) y monitoreo de tarjetas de crédito con alerta del 30%.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Selector de pestañas */}
          <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-white/10">
            <button
              onClick={() => setActiveTab('cuotas')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'cuotas'
                  ? 'bg-cyan-500 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <CalendarClock className="w-3.5 h-3.5" />
              <span>Cuotas (10 y 30)</span>
            </button>
            <button
              onClick={() => setActiveTab('tarjetas')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'tarjetas'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Tarjetas de Crédito</span>
            </button>
          </div>

          {activeTab === 'cuotas' && (
            <>
              {/* Botón Activar Recordatorios */}
              <button
                onClick={handleRequestNotif}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
                  notifGranted
                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                    : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/40 hover:bg-amber-500/25'
                }`}
              >
                <Bell className="w-3.5 h-3.5" />
                <span>{notifGranted ? 'Alertas Activas' : 'Alertas (10 y 30)'}</span>
              </button>

              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-white text-xs font-bold shadow-md shadow-cyan-500/20 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Nueva Cuota</span>
              </button>
            </>
          )}
        </div>
      </div>

      {activeTab === 'tarjetas' ? (
        <CreditCardsSection />
      ) : (
        <>
          {/* Tarjeta de Diagnóstico: "¿Te alcanza con lo generado?" */}
      <div className="app-card rounded-2xl p-5 border-l-4 border-l-cyan-500 shadow-md">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div>
            <span className="text-[10px] uppercase font-black tracking-wider text-cyan-600 dark:text-cyan-400">
              Diagnóstico de Cobertura Financiera
            </span>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
              Próximo Vencimiento: Día {creditAnalysis.proximoDiaPago} (en {creditAnalysis.diasRestantes} días)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Superávit acumulado: <b>{formatCurrency(creditAnalysis.superavitActual)}</b> | Cuotas pendientes: <b>{formatCurrency(creditAnalysis.totalCuotasPendientes)}</b>
            </p>
          </div>

          <div className="text-right sm:self-center">
            <span
              className={`px-3 py-1 rounded-full text-xs font-black inline-block ${
                creditAnalysis.estaCubierto
                  ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                  : 'bg-rose-500/20 text-rose-600 dark:text-rose-400'
              }`}
            >
              {creditAnalysis.estaCubierto ? '¡CUBIERTO!' : 'FONDOS INSUFICIENTES'}
            </span>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
              Cobertura al <b>{creditAnalysis.porcentajeCobertura}%</b>
            </p>
          </div>
        </div>

        {/* Barra de Progreso de Cobertura */}
        <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mt-3">
          <div
            style={{ width: `${Math.min(100, creditAnalysis.porcentajeCobertura)}%` }}
            className={`h-full ${
              creditAnalysis.estaCubierto ? 'bg-gradient-to-r from-emerald-500 to-teal-400' : 'bg-gradient-to-r from-amber-500 to-rose-500'
            }`}
          />
        </div>

        <div className="mt-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-white/5 text-xs">
          {creditAnalysis.estaCubierto ? (
            <span className="text-emerald-700 dark:text-emerald-300 font-semibold">
              🎉 ¡Felicidades! Con lo que has generado puedes pagar tus cuotas del día {creditAnalysis.proximoDiaPago} y aún te sobran <b>{formatCurrency(creditAnalysis.diferencia)}</b> de ganancia libre.
            </span>
          ) : (
            <span className="text-rose-700 dark:text-rose-300 font-semibold">
              ⚠️ Atención: Para estar al día con tus cuotas del día {creditAnalysis.proximoDiaPago}, aún necesitas generar <b>{formatCurrency(Math.abs(creditAnalysis.diferencia))}</b> en tus próximos turnos.
            </span>
          )}
        </div>
      </div>

      {/* Formulario para Crear / Añadir Cuota */}
      {showAddForm && (
        <form onSubmit={handleCreate} className="app-card rounded-2xl p-5 space-y-3 animate-fade-in border-2 border-cyan-500/40">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-white/10">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">Registrar Nuevo Crédito / Cuota</h4>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="text-xs text-slate-400 hover:text-slate-200"
            >
              Cancelar
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Nombre de la Cuota
              </label>
              <input
                type="text"
                placeholder="ej. Cuota Moto AKT / Préstamo Banco"
                value={nombre}
                onChange={e => setNombre(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Monto de la Cuota ($)
              </label>
              <input
                type="number"
                min="0"
                step="any"
                placeholder="220000"
                value={montoCuota}
                onChange={e => setMontoCuota(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Día de Pago del Mes
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setDiaPago(10)}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
                    diaPago === 10
                      ? 'bg-cyan-500 text-white border-cyan-500 shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-transparent'
                  }`}
                >
                  Día 10 de cada mes
                </button>
                <button
                  type="button"
                  onClick={() => setDiaPago(30)}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
                    diaPago === 30
                      ? 'bg-cyan-500 text-white border-cyan-500 shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-transparent'
                  }`}
                >
                  Día 30 (Fin de mes)
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Descripción / Notas (Opcional)
              </label>
              <input
                type="text"
                placeholder="ej. Pago a través de Bancolombia"
                value={descripcion}
                onChange={e => setDescripcion(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-white font-bold text-xs shadow-md"
          >
            Guardar Crédito
          </button>
        </form>
      )}

      {/* Lista de Cuotas Registradas */}
      <div className="space-y-2">
        <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-1">
          Tus Obligaciones Configuradas ({credits.length})
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {credits.map(credit => (
            <div
              key={credit.id}
              className={`app-card rounded-2xl p-4 flex flex-col justify-between border transition-all ${
                credit.pagadoEsteMes ? 'opacity-70 bg-slate-50 dark:bg-slate-900/40' : ''
              }`}
            >
              <div>
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-500">
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <div>
                      <h5 className="text-sm font-bold text-slate-900 dark:text-white">
                        {credit.nombre}
                      </h5>
                      <span className="text-[11px] text-slate-400">
                        Vence los días <b>{credit.diaPago}</b> de cada mes
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setEditingCredit(credit)}
                      className="text-slate-400 hover:text-cyan-500 p-1.5 rounded-lg hover:bg-cyan-500/10 transition-colors"
                      title="Editar cuota"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteCredit(credit.id)}
                      className="text-slate-400 hover:text-rose-500 p-1.5 rounded-lg hover:bg-rose-500/10 transition-colors"
                      title="Eliminar cuota"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="my-3">
                  <span className="text-2xl font-black text-slate-900 dark:text-white">
                    {formatCurrency(credit.montoCuota)}
                  </span>
                  {credit.descripcion && (
                    <p className="text-[11px] text-slate-400 mt-0.5">{credit.descripcion}</p>
                  )}
                </div>
              </div>

              {/* Botón de Estado de Pago este mes */}
              <div className="pt-2 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
                <span className="text-[11px] text-slate-500">
                  {credit.pagadoEsteMes ? '✅ Pagado este mes' : '⏳ Pendiente por pagar'}
                </span>
                <button
                  onClick={() => toggleCreditPaid(credit.id)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                    credit.pagadoEsteMes
                      ? 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      : 'bg-emerald-500 text-white shadow-sm'
                  }`}
                >
                  {credit.pagadoEsteMes ? 'Desmarcar' : 'Marcar Pagado'}
                </button>
              </div>
            </div>
          ))}

          {credits.length === 0 && (
            <div className="col-span-1 md:col-span-2 xl:col-span-3 text-center py-12 app-card rounded-2xl text-slate-400 text-xs">
              No tienes cuotas registradas aún. Haz clic en "Nueva Cuota" para agregar tus créditos del 10 y 30.
            </div>
          )}
        </div>
      </div>
        </>
      )}

      {/* Modal para Editar Cuota */}
      <EditCreditModal
        credit={editingCredit}
        isOpen={Boolean(editingCredit)}
        onClose={() => setEditingCredit(null)}
      />
    </div>
  );
};
