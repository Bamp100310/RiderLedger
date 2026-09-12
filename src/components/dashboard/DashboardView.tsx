import React from 'react';
import { useAppData } from '../../context/AppDataContext';
import { TimeRangeFilter } from './TimeRangeFilter';
import { KpiCards } from './KpiCards';
import { OperationalMetrics } from './OperationalMetrics';
import { ChartsSection } from './ChartsSection';
import { Plus, Bike, Smartphone, Fuel, CloudOff, Database, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const DashboardView: React.FC = () => {
  const { isSupabaseConfigured, openDrawer, isOnline, pendingSyncCount } = useAppData();

  return (
    <div className="space-y-4 pb-20 max-w-2xl mx-auto">
      {/* Banner de Aviso si Supabase no está conectado todavía */}
      {!isSupabaseConfigured && (
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-cyan-950/70 to-slate-900 border border-cyan-500/30 flex items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-300">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Modo Local Offline Activo</p>
              <p className="text-[11px] text-slate-300">
                Conecta tu base de datos Supabase para sincronizar con tu móvil y PC.
              </p>
            </div>
          </div>
          <Link
            to="/ajustes"
            className="px-3 py-1.5 rounded-xl bg-cyan-500 text-slate-950 text-xs font-black flex items-center gap-1 hover:bg-cyan-400 transition-colors whitespace-nowrap"
          >
            Conectar <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Banner si hay registros pendientes de subir por falta de conexión */}
      {!isOnline && pendingSyncCount > 0 && (
        <div className="p-3 rounded-2xl bg-amber-950/60 border border-amber-500/40 flex items-center gap-2 text-xs text-amber-200">
          <CloudOff className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <span>
            <b>{pendingSyncCount} registros guardados localmente.</b> Se sincronizarán automáticamente con Supabase en cuanto recuperes señal.
          </span>
        </div>
      )}

      {/* Filtro de Rango Temporal */}
      <TimeRangeFilter />

      {/* Tarjetas KPI de Alto Impacto */}
      <KpiCards />

      {/* Accesos Rápidos Táctiles tipo "Pastillas" */}
      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={() => openDrawer('app_income')}
          className="p-3 rounded-2xl bg-slate-900/80 border border-white/10 hover:border-emerald-500/40 text-left transition-all active:scale-95 group"
        >
          <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
            <Smartphone className="w-4 h-4" />
          </div>
          <p className="text-xs font-bold text-white">+ Pedido App</p>
          <p className="text-[10px] text-slate-400">Rappi, Didi, Uber</p>
        </button>

        <button
          onClick={() => openDrawer('quick_expense')}
          className="p-3 rounded-2xl bg-slate-900/80 border border-white/10 hover:border-rose-500/40 text-left transition-all active:scale-95 group"
        >
          <div className="w-7 h-7 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
            <Fuel className="w-4 h-4" />
          </div>
          <p className="text-xs font-bold text-white">+ Gasto Rápido</p>
          <p className="text-[10px] text-slate-400">Gasolina, comida</p>
        </button>

        <button
          onClick={() => openDrawer('shift')}
          className="p-3 rounded-2xl bg-slate-900/80 border border-white/10 hover:border-cyan-500/40 text-left transition-all active:scale-95 group"
        >
          <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
            <Bike className="w-4 h-4" />
          </div>
          <p className="text-xs font-bold text-white">Nuevo Turno</p>
          <p className="text-[10px] text-slate-400">Horas y km</p>
        </button>
      </div>

      {/* Métricas Operativas de Eficiencia */}
      <OperationalMetrics />

      {/* Gráficas Interactivas */}
      <ChartsSection />
    </div>
  );
};
