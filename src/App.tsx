import React, { useState } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { AppDataProvider } from './context/AppDataContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { BottomNav } from './components/common/BottomNav';
import { QuickActionDrawer } from './components/common/QuickActionDrawer';
import { ExecutiveDashboard } from './components/dashboard/ExecutiveDashboard';
import { ReportsView } from './components/reports/ReportsView';
import { CreditsView } from './components/credits/CreditsView';
import { ShiftsHistoryView } from './components/shifts/ShiftsHistoryView';
import { TransactionsLedger } from './components/transactions/TransactionsLedger';
import { SettingsView } from './components/settings/SettingsView';
import { X } from 'lucide-react';

const AppLayout: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-[var(--bg-page)] text-[var(--text-primary)] transition-colors duration-200">
      {/* 1. Sidebar Fijo en Pantallas Grandes (Desktop / Tablet) */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* 2. Menú Deslizable Lateral para Móviles */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative z-10 w-72 h-full bg-[#1e2638] shadow-2xl flex flex-col">
            <div className="p-3 flex justify-end">
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto" onClick={() => setMobileMenuOpen(false)}>
              <Sidebar />
            </div>
          </div>
        </div>
      )}

      {/* 3. Área de Contenido Principal */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header Superior con Buscador, Filtros y Modo Claro/Oscuro */}
        <Header onToggleMobileMenu={() => setMobileMenuOpen(true)} />

        {/* Contenido de la Página */}
        <main className="flex-1 p-3 sm:p-5 pb-24 lg:pb-8 overflow-y-auto">
          <Routes>
            <Route path="/" element={<ExecutiveDashboard />} />
            <Route path="/reportes" element={<ReportsView />} />
            <Route path="/creditos" element={<CreditsView />} />
            <Route path="/turnos" element={<ShiftsHistoryView />} />
            <Route path="/movimientos" element={<TransactionsLedger />} />
            <Route path="/ajustes" element={<SettingsView />} />
          </Routes>
        </main>
      </div>

      {/* Cajón Táctil de Acciones Rápidas (Modal Bottom Sheet) */}
      <QuickActionDrawer />

      {/* Barra de Navegación Inferior en Móvil (Oculta en Desktop) */}
      <div className="lg:hidden">
        <BottomNav />
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <HashRouter>
      <AppDataProvider>
        <AppLayout />
      </AppDataProvider>
    </HashRouter>
  );
};

export default App;
