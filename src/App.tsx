import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { AppDataProvider } from './context/AppDataContext';
import { Navbar } from './components/common/Navbar';
import { BottomNav } from './components/common/BottomNav';
import { QuickActionDrawer } from './components/common/QuickActionDrawer';
import { DashboardView } from './components/dashboard/DashboardView';
import { ReportsView } from './components/reports/ReportsView';
import { ShiftsHistoryView } from './components/shifts/ShiftsHistoryView';
import { TransactionsLedger } from './components/transactions/TransactionsLedger';
import { SettingsView } from './components/settings/SettingsView';

export const App: React.FC = () => {
  return (
    <HashRouter>
      <AppDataProvider>
        <div className="min-h-screen bg-[#070a12] text-slate-100 flex flex-col selection:bg-emerald-500/30 selection:text-emerald-200">
          {/* Barra Superior con Estado Online/Sincronización */}
          <Navbar />

          {/* Contenido Principal de Rutas */}
          <main className="flex-1 px-3 sm:px-4 pt-3 pb-16 safe-top">
            <Routes>
              <Route path="/" element={<DashboardView />} />
              <Route path="/reportes" element={<ReportsView />} />
              <Route path="/turnos" element={<ShiftsHistoryView />} />
              <Route path="/movimientos" element={<TransactionsLedger />} />
              <Route path="/ajustes" element={<SettingsView />} />
            </Routes>
          </main>

          {/* Cajón Táctil de Acciones Rápidas (Modal Bottom Sheet) */}
          <QuickActionDrawer />

          {/* Barra de Navegación Inferior Mobile-First */}
          <BottomNav />
        </div>
      </AppDataProvider>
    </HashRouter>
  );
};

export default App;
