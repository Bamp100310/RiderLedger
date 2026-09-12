import React from 'react';
import { useAppData } from '../../context/AppDataContext';
import { RefreshCw, Wifi, WifiOff, Settings, CheckCircle2, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Navbar: React.FC = () => {
  const {
    isOnline,
    isSyncing,
    pendingSyncCount,
    lastSyncTime,
    triggerSync,
    isSupabaseConfigured,
    syncErrorMessage
  } = useAppData();

  const formatLastSync = (timeStr: string | null) => {
    if (!timeStr) return 'Nunca sincronizado';
    try {
      const d = new Date(timeStr);
      return `Sinc: ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } catch {
      return '';
    }
  };

  return (
    <header className="sticky top-0 z-30 w-full glass-nav px-4 py-2.5 flex items-center justify-between border-b border-white/10 shadow-lg">
      <div className="flex items-center gap-2.5">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
            <span className="text-xl">🛵</span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-black text-base tracking-tight text-white group-hover:text-emerald-400 transition-colors">
                RiderLedger
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full">
                PWA
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium">Contabilidad en Ruta</p>
          </div>
        </Link>
      </div>

      {/* Acciones superiores de conexión y sincronización */}
      <div className="flex items-center gap-2">
        {/* Badge de Red */}
        <div
          title={isOnline ? 'Conexión a Internet activa' : 'Sin señal de internet (Modo Offline activo)'}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${
            isOnline
              ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/30'
              : 'bg-amber-950/80 text-amber-400 border border-amber-500/30 animate-pulse'
          }`}
        >
          {isOnline ? (
            <>
              <Wifi className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Online</span>
            </>
          ) : (
            <>
              <WifiOff className="w-3.5 h-3.5" />
              <span>Offline</span>
            </>
          )}
        </div>

        {/* Botón de Sincronización */}
        {isSupabaseConfigured && (
          <button
            onClick={() => triggerSync()}
            disabled={isSyncing || !isOnline}
            title={syncErrorMessage || `Sincronizar con Supabase. ${formatLastSync(lastSyncTime)}`}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all ${
              isSyncing
                ? 'bg-cyan-950/80 text-cyan-300 border-cyan-500/40'
                : pendingSyncCount > 0
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                : 'bg-slate-800/80 text-slate-300 border-white/10 hover:bg-slate-700/80'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-sync text-cyan-400' : ''}`} />
            {pendingSyncCount > 0 ? (
              <span className="bg-amber-500 text-slate-950 px-1.5 py-0.2 rounded-full text-[10px] font-black">
                {pendingSyncCount}
              </span>
            ) : (
              <span className="hidden md:inline text-[11px] text-slate-400">
                {formatLastSync(lastSyncTime)}
              </span>
            )}
          </button>
        )}

        {/* Enlace a Ajustes */}
        <Link
          to="/ajustes"
          className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-white/10 text-slate-300 hover:text-white transition-colors"
          title="Configuración y Supabase"
        >
          <Settings className="w-4 h-4" />
        </Link>
      </div>
    </header>
  );
};
