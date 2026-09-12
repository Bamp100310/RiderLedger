import React, { useState } from 'react';
import { useAppData } from '../../context/AppDataContext';
import {
  Search,
  Sun,
  Moon,
  Wifi,
  WifiOff,
  RefreshCw,
  Bell,
  Menu,
  X,
  CreditCard
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface HeaderProps {
  onToggleMobileMenu: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleMobileMenu }) => {
  const {
    filter,
    setFilterRange,
    theme,
    toggleTheme,
    isOnline,
    isSyncing,
    pendingSyncCount,
    triggerSync,
    creditAnalysis,
    requestNotificationPermission
  } = useAppData();

  const [searchQuery, setSearchQuery] = useState('');

  const filterTabs = [
    { id: 'hoy' as const, label: 'Hoy' },
    { id: 'semana' as const, label: 'Esta Semana' },
    { id: 'mes' as const, label: 'Este Mes' },
    { id: 'historico' as const, label: 'Histórico' }
  ];

  return (
    <header className="sticky top-0 z-30 w-full bg-[#1e2638] text-white px-4 py-2.5 border-b border-white/10 flex items-center justify-between gap-3 shadow-md">
      {/* Botón Menú Móvil & Logo Móvil */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileMenu}
          className="lg:hidden p-2 rounded-xl bg-slate-800 text-slate-200 hover:text-white"
          aria-label="Abrir menú"
        >
          <Menu className="w-5 h-5" />
        </button>

        <Link to="/" className="lg:hidden flex items-center gap-2">
          <span className="font-black text-sm tracking-wider uppercase text-white">
            RiderLedger
          </span>
          <span className="text-[9px] font-bold px-1.5 py-0.2 bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded-full">
            PRO
          </span>
        </Link>
      </div>

      {/* Barra de Búsqueda (Estilo Maqueta Referencia) */}
      <div className="hidden md:flex items-center flex-1 max-w-xs">
        <div className="relative w-full">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Buscar pedido, gasto o turno..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900/90 border border-white/10 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-slate-400 focus:outline-none focus:border-cyan-500 transition-colors"
          />
        </div>
      </div>

      {/* Subnav / Píldoras de Rango (Estilo Maqueta: Lorem Ipsum | Dolor Sit | Amet Conse) */}
      <div className="hidden sm:flex items-center gap-1 text-xs">
        {filterTabs.map(tab => {
          const isActive = filter.range === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setFilterRange(tab.id)}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                isActive
                  ? 'bg-cyan-500 text-white shadow-sm shadow-cyan-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Acciones de Cabecera: Modo Claro/Oscuro, Notificaciones y Sincronización */}
      <div className="flex items-center gap-2">
        {/* Notificación de Cuotas del 10 y 30 */}
        <Link
          to="/creditos"
          onClick={() => {
            if ('Notification' in window && Notification.permission !== 'granted') {
              requestNotificationPermission();
            }
          }}
          className={`p-2 rounded-xl border transition-all relative ${
            creditAnalysis.alertaVencimientoCercano
              ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 animate-pulse'
              : 'bg-slate-800/80 border-white/10 text-slate-300 hover:text-white'
          }`}
          title={`Próxima cuota día ${creditAnalysis.proximoDiaPago}. Faltan ${creditAnalysis.diasRestantes} días.`}
        >
          <Bell className="w-4 h-4" />
          {creditAnalysis.alertaVencimientoCercano && (
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-500 rounded-full border-2 border-[#1e2638]" />
          )}
        </Link>

        {/* Alternador de Modo Claro / Modo Oscuro */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-white/10 text-slate-200 transition-colors"
          title={theme === 'dark' ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
          aria-label="Alternar tema"
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-cyan-400" />
          )}
        </button>

        {/* Indicador de Red */}
        <div
          className={`hidden xs:flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
            isOnline
              ? 'bg-emerald-950/80 text-emerald-400 border-emerald-500/30'
              : 'bg-amber-950/80 text-amber-400 border-amber-500/30'
          }`}
        >
          {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
          <span className="hidden sm:inline">{isOnline ? 'Online' : 'Offline'}</span>
        </div>

        {/* Botón de Sincronización */}
        <button
          onClick={() => triggerSync()}
          disabled={isSyncing || !isOnline}
          className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-white/10 text-slate-200 transition-colors"
          title="Sincronizar datos"
        >
          <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-sync text-cyan-400' : ''}`} />
        </button>
      </div>
    </header>
  );
};
