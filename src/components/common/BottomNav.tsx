import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FileSpreadsheet, Plus, HeartPulse, CalendarClock } from 'lucide-react';
import { useAppData } from '../../context/AppDataContext';

export const BottomNav: React.FC = () => {
  const { openDrawer, creditAnalysis } = useAppData();

  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/salud-financiera', label: 'Salud', icon: HeartPulse },
    { isAction: true, label: 'Registrar', icon: Plus },
    { to: '/reportes', label: 'Reportes', icon: FileSpreadsheet },
    { to: '/creditos', label: 'Créditos', icon: CalendarClock, badge: creditAnalysis.alertaVencimientoCercano },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 glass-nav border-t border-slate-200 dark:border-white/10 safe-bottom">
      <div className="max-w-md mx-auto px-3 py-1.5 flex items-center justify-between">
        {navItems.map((item) => {
          if (item.isAction) {
            return (
              <div key="action-fab" className="relative -top-5 flex flex-col items-center">
                <button
                  id="fab-quick-action"
                  onClick={() => openDrawer()}
                  className="w-13 h-13 rounded-full bg-gradient-to-tr from-cyan-500 via-teal-500 to-emerald-500 flex items-center justify-center text-white shadow-xl shadow-cyan-500/30 hover:scale-105 active:scale-95 transition-all focus:outline-none border-2 border-white dark:border-slate-900"
                  aria-label="Registrar turno o movimiento rápido"
                >
                  <Plus className="w-6 h-6 stroke-[2.5]" />
                </button>
                <span className="text-[10px] font-bold text-cyan-600 dark:text-cyan-400 mt-1">Registrar</span>
              </div>
            );
          }

          const IconComponent = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to!}
              className={({ isActive }) =>
                `flex flex-col items-center py-1 px-2 rounded-xl transition-all relative ${
                  isActive
                    ? 'text-cyan-600 dark:text-cyan-400 font-bold scale-105'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className="relative">
                    <IconComponent className={`w-5 h-5 ${isActive ? 'stroke-[2.3]' : 'stroke-1.5'}`} />
                    {item.badge && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                    )}
                  </div>
                  <span className="text-[10px] mt-0.5 tracking-tight">{item.label}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};
