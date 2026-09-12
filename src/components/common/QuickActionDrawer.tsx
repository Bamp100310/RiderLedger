import React from 'react';
import { useAppData } from '../../context/AppDataContext';
import { X, Bike, Smartphone, Fuel, Users } from 'lucide-react';
import { ShiftForm } from '../forms/ShiftForm';
import { AppIncomeForm } from '../forms/AppIncomeForm';
import { QuickExpenseForm } from '../forms/QuickExpenseForm';
import { OtherIncomeForm } from '../forms/OtherIncomeForm';

export const QuickActionDrawer: React.FC = () => {
  const { isQuickActionOpen, closeDrawer, activeDrawerTab, openDrawer } = useAppData();

  if (!isQuickActionOpen) return null;

  const tabs = [
    { id: 'shift' as const, label: 'Turno', icon: Bike, color: 'text-emerald-400' },
    { id: 'app_income' as const, label: 'Pedido App', icon: Smartphone, color: 'text-emerald-400' },
    { id: 'quick_expense' as const, label: 'Gasto', icon: Fuel, color: 'text-rose-400' },
    { id: 'other_income' as const, label: 'Pasajero / Otro', icon: Users, color: 'text-cyan-400' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm transition-opacity animate-fade-in">
      {/* Backdrop click */}
      <div className="fixed inset-0" onClick={closeDrawer} />

      {/* Drawer Container */}
      <div className="relative z-10 w-full max-w-lg bg-slate-900 border-t border-white/10 rounded-t-3xl shadow-2xl p-4 safe-bottom max-h-[92vh] flex flex-col">
        {/* Grab Handle */}
        <div className="w-12 h-1.5 bg-slate-700 rounded-full mx-auto mb-3" />

        {/* Drawer Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div>
            <h3 className="text-base font-black text-white tracking-tight">Registro Rápido</h3>
            <p className="text-[11px] text-slate-400">Guarda en ruta sin perder conexión</p>
          </div>
          <button
            onClick={closeDrawer}
            className="p-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector Buttons */}
        <div className="flex gap-1.5 py-3 overflow-x-auto">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeDrawerTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => openDrawer(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                  isActive
                    ? 'bg-slate-800 text-white border-white/20 shadow-md shadow-black/30'
                    : 'bg-slate-950/60 text-slate-400 border-white/5 hover:bg-slate-850'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${tab.color}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Form Content Area */}
        <div className="overflow-y-auto flex-1 pt-1 pb-4">
          {activeDrawerTab === 'shift' && <ShiftForm onSuccess={closeDrawer} />}
          {activeDrawerTab === 'app_income' && <AppIncomeForm onSuccess={closeDrawer} />}
          {activeDrawerTab === 'quick_expense' && <QuickExpenseForm onSuccess={closeDrawer} />}
          {activeDrawerTab === 'other_income' && <OtherIncomeForm onSuccess={closeDrawer} />}
        </div>
      </div>
    </div>
  );
};
