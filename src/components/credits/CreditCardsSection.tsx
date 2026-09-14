import React, { useState } from 'react';
import { useAppData } from '../../context/AppDataContext';
import { CreditCardAccount } from '../../types';
import { formatCurrency } from '../../lib/calculations';
import { EditCreditCardModal } from './EditCreditCardModal';
import {
  CreditCard,
  Plus,
  Trash2,
  Pencil,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  Calendar,
  DollarSign,
  TrendingDown,
  Info
} from 'lucide-react';

export const CreditCardsSection: React.FC = () => {
  const {
    creditCards,
    creditCardAnalysis,
    addCreditCard,
    updateCreditCard,
    deleteCreditCard
  } = useAppData();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState<CreditCardAccount | null>(null);

  const handleOpenNew = () => {
    setSelectedCard(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (card: CreditCardAccount) => {
    setSelectedCard(card);
    setIsModalOpen(true);
  };

  const handleSaveCard = (cardData: Omit<CreditCardAccount, 'id' | 'userId'> & { id?: string }) => {
    if (cardData.id) {
      updateCreditCard(cardData as CreditCardAccount);
    } else {
      addCreditCard(cardData);
    }
  };

  return (
    <div className="space-y-4">
      {/* Cabecera de Sección */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/60 border border-white/10 rounded-2xl p-4">
        <div>
          <h3 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-purple-400" />
            Tarjetas de Crédito y Cuentas Revolventes
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Monitorea el cupo utilizado, mantén la regla de oro del &lt;30% y evita la trampa del pago mínimo.
          </p>
        </div>

        <button
          onClick={handleOpenNew}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg shadow-purple-600/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Añadir Tarjeta</span>
        </button>
      </div>

      {/* Tarjetas Resumen Global */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Deuda Total Tarjetas */}
        <div className="app-card rounded-2xl p-4 border-l-4 border-l-rose-500 shadow-md">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Deuda Total en Tarjetas
          </span>
          <p className="text-2xl font-black text-rose-500 mt-1">
            {formatCurrency(creditCardAnalysis.deudaTotalTarjetas)}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Pago mínimo total: <b className="text-slate-300">{formatCurrency(creditCardAnalysis.pagoMinimoTotal)}</b>
          </p>
        </div>

        {/* Cupo Total Disponible */}
        <div className="app-card rounded-2xl p-4 border-l-4 border-l-emerald-500 shadow-md">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Cupo Total Disponible
          </span>
          <p className="text-2xl font-black text-emerald-500 mt-1">
            {formatCurrency(creditCardAnalysis.cupoDisponibleTotal)}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Cupo global aprobado: <b className="text-slate-300">{formatCurrency(creditCardAnalysis.cupoTotalTarjetas)}</b>
          </p>
        </div>

        {/* Semáforo de Utilización */}
        <div className="app-card rounded-2xl p-4 border-l-4 border-l-purple-500 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Semáforo de Utilización
              </span>
              <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${
                creditCardAnalysis.semaforoUtilizacion === 'VERDE'
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : creditCardAnalysis.semaforoUtilizacion === 'AMARILLO'
                  ? 'bg-amber-500/20 text-amber-400'
                  : 'bg-rose-500/20 text-rose-400'
              }`}>
                {creditCardAnalysis.semaforoUtilizacion === 'VERDE'
                  ? '🟢 Saludable (&lt;30%)'
                  : creditCardAnalysis.semaforoUtilizacion === 'AMARILLO'
                  ? '🟡 Precaución (30-60%)'
                  : '🔴 Crítico (&gt;60%)'}
              </span>
            </div>
            <p className="text-2xl font-black text-white mt-1">
              {creditCardAnalysis.utilizacionGlobalPct}%
            </p>
          </div>
          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden mt-2">
            <div
              style={{ width: `${Math.min(100, creditCardAnalysis.utilizacionGlobalPct)}%` }}
              className={`h-full ${
                creditCardAnalysis.semaforoUtilizacion === 'VERDE'
                  ? 'bg-emerald-500'
                  : creditCardAnalysis.semaforoUtilizacion === 'AMARILLO'
                  ? 'bg-amber-500'
                  : 'bg-rose-500'
              }`}
            />
          </div>
        </div>
      </div>

      {/* Advertencia Educativa del Pago Mínimo */}
      <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-start gap-2.5">
        <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <p className="font-bold text-amber-300">
            Regla de oro financiera: El pago mínimo no reduce tu deuda
          </p>
          <p className="text-slate-300 text-[11px] leading-relaxed">
            {creditCardAnalysis.advertenciaPagoMinimo} Siempre que tus ingresos en ruta lo permitan, realiza abonos a capital o paga el saldo total para no regalar tus ganancias al interés bancario.
          </p>
        </div>
      </div>

      {/* Lista de Tarjetas */}
      {creditCards.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {creditCards.map((card) => {
            const deuda = Number(card.saldoUtilizado) || 0;
            const cupo = Number(card.cupoTotal) || 1;
            const disponible = Math.max(0, cupo - deuda);
            const utilPct = Math.round((deuda / cupo) * 100);

            const isRed = utilPct >= 60;
            const isYellow = utilPct >= 30 && utilPct < 60;

            return (
              <div
                key={card.id}
                className="app-card rounded-3xl p-5 shadow-lg border border-white/10 relative overflow-hidden flex flex-col justify-between space-y-4 bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950"
              >
                {/* Header de la tarjeta */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-black text-xs">
                      💳
                    </div>
                    <div>
                      <h4 className="font-black text-sm text-white">{card.nombre}</h4>
                      <p className="text-[11px] text-slate-400">
                        {card.bancoEntidad || 'Tarjeta de Crédito'}
                        {card.ultimosDigitos ? ` •••• ${card.ultimosDigitos}` : ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(card)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                      title="Editar"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`¿Eliminar ${card.nombre}?`)) {
                          deleteCreditCard(card.id);
                        }
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Barra y % de Utilización */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-400 text-[11px]">Uso del cupo:</span>
                    <span className={isRed ? 'text-rose-400' : isYellow ? 'text-amber-400' : 'text-emerald-400'}>
                      {utilPct}% {utilPct > 30 ? (isRed ? '(Crítico >60%)' : '(Alerta >30%)') : '(Óptimo)'}
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-white/5">
                    <div
                      style={{ width: `${Math.min(100, utilPct)}%` }}
                      className={`h-full transition-all duration-300 ${
                        isRed ? 'bg-rose-500' : isYellow ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                    />
                  </div>
                </div>

                {/* Métricas de Saldo */}
                <div className="grid grid-cols-2 gap-2 p-3 rounded-2xl bg-white/5 border border-white/5 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Deuda / Saldo:</span>
                    <b className="text-rose-400 font-black text-sm block mt-0.5">
                      {formatCurrency(deuda)}
                    </b>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Cupo Libre:</span>
                    <b className="text-emerald-400 font-black text-sm block mt-0.5">
                      {formatCurrency(disponible)}
                    </b>
                  </div>
                </div>

                {/* Fechas de corte y pago */}
                <div className="pt-2 border-t border-white/5 grid grid-cols-2 gap-2 text-[11px] text-slate-300">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Corte: <b>Día {card.fechaCorte}</b></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-amber-400" />
                    <span>Límite: <b>Día {card.fechaPago}</b></span>
                  </div>
                </div>

                {/* Footer con Pago Mínimo */}
                <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs">
                  <span className="text-slate-400 text-[11px]">Pago mínimo sugerido:</span>
                  <b className="text-white font-black">{formatCurrency(card.pagoMinimo)}</b>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="app-card rounded-3xl p-8 text-center border border-white/10 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center mx-auto text-xl">
            💳
          </div>
          <h4 className="text-sm font-bold text-white">No has registrado tarjetas de crédito</h4>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Registra tus tarjetas para saber con exactitud cuánto debes, cuánto cupo te queda disponible y recibir recomendaciones para liquidar deuda de alto interés.
          </p>
          <button
            onClick={handleOpenNew}
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md shadow-purple-600/30 transition-all inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Registrar primera tarjeta</span>
          </button>
        </div>
      )}

      {/* Modal para crear o editar tarjeta */}
      <EditCreditCardModal
        card={selectedCard}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveCard}
      />
    </div>
  );
};
