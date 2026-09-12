import React, { useState } from 'react';
import { useAppData } from '../../context/AppDataContext';
import {
  Sun,
  Moon,
  Wifi,
  WifiOff,
  RefreshCw,
  Bell,
  Menu,
  User,
  Users,
  ChevronDown
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

interface HeaderProps {
  onToggleMobileMenu: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleMobileMenu }) => {
  const {
    theme,
    toggleTheme,
    isOnline,
    isSyncing,
    triggerSync,
    creditAnalysis,
    activeUser,
    users,
    switchUser
  } = useAppData();

  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const location = useLocation();

  // Título contextual según la ruta
  const getPageTitle = () => {
    switch (location.pathname) {
      case '/':
        return 'Panel Principal';
      case '/reportes':
        return 'Consolidado Contable';
      case '/creditos':
        return 'Créditos & Cuotas (10 y 30)';
      case '/turnos':
        return 'Jornadas y Odómetro';
      case '/movimientos':
        return 'Libro de Movimientos';
      case '/ajustes':
        return 'Configuración & Supabase';
      default:
        return 'RiderLedger';
    }
  };

  return (
    <header className="sticky top-0 z-30 flex-shrink-0 w-full bg-[#1e2638] text-white px-3 sm:px-5 py-3 border-b border-white/10 flex items-center justify-between gap-3 shadow-md select-none">
      {/* Lado Izquierdo: Botón Menú Móvil + Título Contextual */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileMenu}
          className="lg:hidden p-2 rounded-xl bg-slate-800 text-slate-200 hover:text-white transition-colors"
          aria-label="Abrir menú"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-baseline gap-2">
          <h1 className="text-sm sm:text-base font-black tracking-tight text-white">
            {getPageTitle()}
          </h1>
          <span className="hidden sm:inline-block text-[10px] text-cyan-400 font-bold uppercase tracking-wider">
            | Cuenta: {activeUser.nombre}
          </span>
        </div>
      </div>

      {/* Lado Derecho: Selector de Usuario Familiar, Tema Claro/Oscuro, Alertas y Sync */}
      <div className="flex items-center gap-2">
        {/* Selector Rápido de Miembro Familiar */}
        <div className="relative">
          <button
            onClick={() => setShowUserDropdown(!showUserDropdown)}
            className="flex items-center gap-1.5 py-1.5 px-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-750 border border-white/10 text-xs font-bold transition-all"
            title="Cambiar de usuario familiar"
          >
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-white font-black"
              style={{ backgroundColor: activeUser.avatarColor }}
            >
              {activeUser.nombre.charAt(0)}
            </div>
            <span className="hidden md:inline max-w-[100px] truncate text-slate-200">
              {activeUser.nombre}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {/* Menú Desplegable de Usuarios Familiares */}
          {showUserDropdown && (
            <div className="absolute right-0 top-full mt-2 w-52 bg-slate-900 border border-white/15 rounded-2xl shadow-2xl p-2 z-50 animate-fade-in">
              <div className="px-2 py-1.5 border-b border-white/10 mb-1 text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-cyan-400" />
                <span>Cuentas Familiares</span>
              </div>
              <div className="space-y-1">
                {users.map(u => (
                  <button
                    key={u.id}
                    onClick={() => {
                      switchUser(u.id);
                      setShowUserDropdown(false);
                    }}
                    className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-semibold text-left transition-colors ${
                      u.id === activeUser.id
                        ? 'bg-cyan-500 text-white font-bold'
                        : 'text-slate-300 hover:bg-white/5'
                    }`}
                  >
                    <div
                      className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] text-white font-black flex-shrink-0"
                      style={{ backgroundColor: u.avatarColor }}
                    >
                      {u.nombre.charAt(0)}
                    </div>
                    <span className="truncate">{u.nombre}</span>
                  </button>
                ))}
              </div>
              <div className="pt-2 border-t border-white/10 mt-1">
                <Link
                  to="/ajustes"
                  onClick={() => setShowUserDropdown(false)}
                  className="w-full block text-center py-1.5 text-[11px] font-bold text-cyan-400 hover:text-cyan-300"
                >
                  Gestionar perfiles en Ajustes →
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Notificación de Cuotas del 10 y 30 */}
        <Link
          to="/creditos"
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
