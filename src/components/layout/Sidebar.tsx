import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  BarChart2,
  CalendarClock,
  Bike,
  ReceiptText,
  Settings,
  Plus,
  CreditCard,
  User,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { useAppData } from '../../context/AppDataContext';
import { formatCurrency } from '../../lib/calculations';

export const Sidebar: React.FC = () => {
  const { openDrawer, summary, creditAnalysis } = useAppData();

  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/reportes', label: 'Reportes & Gráficas', icon: BarChart2 },
    { to: '/creditos', label: 'Créditos (10 y 30)', icon: CalendarClock, badge: creditAnalysis.alertaVencimientoCercano ? 'Alerta' : undefined },
    { to: '/turnos', label: 'Turnos y Horas', icon: Bike },
    { to: '/movimientos', label: 'Movimientos', icon: ReceiptText },
    { to: '/ajustes', label: 'Configuración', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-[#1e2638] text-slate-200 flex flex-col justify-between flex-shrink-0 border-r border-white/5 min-h-screen select-none">
      <div>
        {/* Brand Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-md shadow-cyan-500/30">
              <Zap className="w-5 h-5 fill-white" />
            </div>
            <div>
              <span className="font-black text-sm tracking-wider uppercase text-white">
                RIDERLEDGER
              </span>
              <span className="block text-[9px] text-cyan-400 font-bold uppercase tracking-widest">
                Gestión Financiera
              </span>
            </div>
          </div>
        </div>

        {/* User Panel Profile Card (Igual a la imagen de referencia) */}
        <div className="p-6 text-center border-b border-white/10 flex flex-col items-center">
          <div className="relative mb-2.5">
            <div className="w-20 h-20 rounded-full bg-cyan-500 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20 border-2 border-white/20">
              <User className="w-11 h-11 text-white" />
            </div>
            <div className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-emerald-500 border-2 border-[#1e2638] flex items-center justify-center" title="En servicio">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            </div>
          </div>
          <span className="text-xs font-black tracking-widest text-white uppercase block">
            USERPANEL
          </span>
          <span className="text-[11px] text-slate-400 font-medium">
            Repartidor Activo
          </span>

          {/* Botón Acción Rápida */}
          <button
            onClick={() => openDrawer()}
            className="mt-3 w-full py-2 px-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold shadow-md shadow-cyan-500/20 flex items-center justify-center gap-1.5 transition-all transform active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Registrar Movimiento</span>
          </button>
        </div>

        {/* Menu de Navegación Vertical */}
        <nav className="p-3 space-y-1">
          {navItems.map(item => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-cyan-500 text-white shadow-md shadow-cyan-500/25 font-extrabold'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="bg-amber-500 text-slate-950 text-[9px] font-black px-1.5 py-0.5 rounded-full animate-pulse">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Footer Mini Resumen en Sidebar */}
      <div className="p-4 border-t border-white/10 bg-black/20 m-3 rounded-2xl">
        <div className="flex justify-between items-center text-[10px] text-slate-400 mb-1">
          <span>Próxima Cuota (Día {creditAnalysis.proximoDiaPago}):</span>
          <span className={creditAnalysis.estaCubierto ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
            {creditAnalysis.diasRestantes}d
          </span>
        </div>
        <p className="text-xs font-black text-white">
          {formatCurrency(creditAnalysis.totalCuotasPendientes)}
        </p>
        <div className="w-full h-1.5 bg-slate-700 rounded-full mt-1.5 overflow-hidden">
          <div
            style={{ width: `${Math.min(100, creditAnalysis.porcentajeCobertura)}%` }}
            className={`h-full ${creditAnalysis.estaCubierto ? 'bg-emerald-400' : 'bg-amber-400'}`}
          />
        </div>
      </div>
    </aside>
  );
};
