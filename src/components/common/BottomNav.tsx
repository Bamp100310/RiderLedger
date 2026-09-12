import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FileSpreadsheet, Plus, Bike, ReceiptText } from 'lucide-react';
import { useAppData } from '../../context/AppDataContext';

export const BottomNav: React.FC = () => {
  const { openDrawer } = useAppData();

  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/reportes', label: 'Reportes', icon: FileSpreadsheet },
    { isAction: true, label: 'Registrar', icon: Plus },
    { to: '/turnos', label: 'Turnos', icon: Bike },
    { to: '/movimientos', label: 'Movimientos', icon: ReceiptText },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 glass-nav border-t border-white/10 safe-bottom">
      <div className="max-w-md mx-auto px-3 py-1.5 flex items-center justify-between">
        {navItems.map((item, idx) => {
          if (item.isAction) {
            return (
              <div key="action-fab" className="relative -top-5 flex flex-col items-center">
                <button
                  id="fab-quick-action"
                  onClick={() => openDrawer()}
                  className="w-14 h-14 rounded-full bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-500 flex items-center justify-center text-slate-950 shadow-xl shadow-emerald-500/30 hover:scale-105 active:scale-95 transition-all focus:outline-none focus:ring-4 focus:ring-emerald-400/40 border-2 border-slate-900"
                  aria-label="Registrar turno o movimiento rápido"
                >
                  <Plus className="w-7 h-7 stroke-[2.5]" />
                </button>
                <span className="text-[10px] font-bold text-emerald-400 mt-1">Registrar</span>
              </div>
            );
          }

          const IconComponent = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to!}
              className={({ isActive }) =>
                `flex flex-col items-center py-1 px-2.5 rounded-xl transition-all ${
                  isActive
                    ? 'text-emerald-400 font-semibold scale-105'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <IconComponent className={`w-5 h-5 ${isActive ? 'stroke-[2.3]' : 'stroke-1.5'}`} />
                  <span className="text-[11px] mt-0.5 tracking-tight">{item.label}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};
