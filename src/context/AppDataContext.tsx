import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  Shift,
  Transaction,
  DateFilter,
  FinancialSummary,
  SupabaseConfig,
  TimeRange,
  CreditInstallment,
  CreditAnalysis,
  ThemeMode
} from '../types';
import {
  getStoredShifts,
  saveStoredShifts,
  getStoredTransactions,
  saveStoredTransactions,
  getStoredSupabaseConfig,
  saveStoredSupabaseConfig,
  getStoredSyncQueue,
  addToSyncQueue,
  removeFromSyncQueue,
  getStoredLastSync,
  saveStoredLastSync,
  generateDemoData,
  getStoredCredits,
  saveStoredCredits,
  getStoredTheme,
  saveStoredTheme
} from '../lib/storage';
import { calculateFinancialSummary, isDateInRange, calculateCreditAnalysis } from '../lib/calculations';
import { getSupabaseClient, syncWithSupabase } from '../lib/supabase';

interface AppDataContextType {
  shifts: Shift[];
  transactions: Transaction[];
  filteredShifts: Shift[];
  filteredTransactions: Transaction[];
  summary: FinancialSummary;
  filter: DateFilter;
  setFilterRange: (range: TimeRange, customStart?: string, customEnd?: string) => void;
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncTime: string | null;
  pendingSyncCount: number;
  supabaseConfig: SupabaseConfig;
  isSupabaseConfigured: boolean;
  syncErrorMessage: string | null;
  isQuickActionOpen: boolean;
  activeDrawerTab: 'shift' | 'app_income' | 'quick_expense' | 'other_income';
  openDrawer: (tab?: 'shift' | 'app_income' | 'quick_expense' | 'other_income') => void;
  closeDrawer: () => void;
  addShift: (shift: Omit<Shift, 'id'> & { id?: string }) => Promise<Shift>;
  updateShift: (shift: Shift) => Promise<void>;
  deleteShift: (id: string) => Promise<void>;
  addTransaction: (tx: Omit<Transaction, 'id'> & { id?: string }) => Promise<Transaction>;
  updateTransaction: (tx: Transaction) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  triggerSync: () => Promise<void>;
  updateSupabaseConfig: (config: SupabaseConfig) => Promise<void>;
  loadDemoData: () => void;
  clearAllData: () => void;

  // Nuevas capacidades de Créditos y Cuotas (Días 10 y 30)
  credits: CreditInstallment[];
  creditAnalysis: CreditAnalysis;
  addCredit: (credit: Omit<CreditInstallment, 'id'>) => void;
  updateCredit: (credit: CreditInstallment) => void;
  deleteCredit: (id: string) => void;
  toggleCreditPaid: (id: string) => void;
  requestNotificationPermission: () => Promise<boolean>;

  // Tema Claro / Oscuro
  theme: ThemeMode;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
}

const AppDataContext = createContext<AppDataContextType | undefined>(undefined);

export const AppDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [shifts, setShifts] = useState<Shift[]>(() => {
    const stored = getStoredShifts();
    if (stored.length > 0) return stored;
    const demo = generateDemoData();
    saveStoredShifts(demo.shifts);
    saveStoredTransactions(demo.transactions);
    return demo.shifts;
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    return getStoredTransactions();
  });

  const [credits, setCredits] = useState<CreditInstallment[]>(() => {
    return getStoredCredits();
  });

  const [theme, setThemeState] = useState<ThemeMode>(() => {
    const saved = getStoredTheme();
    // Inicializar clase en documentElement
    if (saved === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
    return saved;
  });

  const [filter, setFilter] = useState<DateFilter>({ range: 'hoy' });
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(getStoredLastSync);
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(() => getStoredSyncQueue().length);
  const [supabaseConfig, setSupabaseConfigState] = useState<SupabaseConfig>(getStoredSupabaseConfig);
  const [syncErrorMessage, setSyncErrorMessage] = useState<string | null>(null);

  const [isQuickActionOpen, setIsQuickActionOpen] = useState(false);
  const [activeDrawerTab, setActiveDrawerTab] = useState<'shift' | 'app_income' | 'quick_expense' | 'other_income'>('shift');

  const isSupabaseConfigured = Boolean(supabaseConfig.url && supabaseConfig.anonKey);

  // Tema
  const setTheme = useCallback((mode: ThemeMode) => {
    setThemeState(mode);
    saveStoredTheme(mode);
  }, []);

  const toggleTheme = useCallback(() => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
  }, [theme, setTheme]);

  // Escuchar estado de conexión del navegador
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (getStoredSyncQueue().length > 0) {
        syncData();
      }
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const refreshPendingCount = useCallback(() => {
    setPendingSyncCount(getStoredSyncQueue().length);
  }, []);

  const syncData = useCallback(async () => {
    if (!navigator.onLine || !getSupabaseClient()) {
      return;
    }

    setIsSyncing(true);
    setSyncErrorMessage(null);

    try {
      const result = await syncWithSupabase(shifts, transactions);
      if (result.success) {
        setShifts(result.shifts);
        saveStoredShifts(result.shifts);
        setTransactions(result.transactions);
        saveStoredTransactions(result.transactions);

        const nowIso = new Date().toISOString();
        setLastSyncTime(nowIso);
        saveStoredLastSync(nowIso);
        refreshPendingCount();
      } else if (result.errorMessage) {
        setSyncErrorMessage(result.errorMessage);
      }
    } catch (err: any) {
      console.error('Sync failed:', err);
      setSyncErrorMessage(err?.message || 'Error durante la sincronización');
    } finally {
      setIsSyncing(false);
      refreshPendingCount();
    }
  }, [shifts, transactions, refreshPendingCount]);

  useEffect(() => {
    if (isSupabaseConfigured && navigator.onLine) {
      syncData();
    }
  }, [isSupabaseConfigured]);

  const filteredShifts = useMemo(() => {
    return shifts.filter(s => isDateInRange(s.fecha, filter.range, filter.startDate, filter.endDate));
  }, [shifts, filter]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => isDateInRange(t.fecha, filter.range, filter.startDate, filter.endDate));
  }, [transactions, filter]);

  const summary = useMemo(() => {
    return calculateFinancialSummary(filteredShifts, filteredTransactions);
  }, [filteredShifts, filteredTransactions]);

  // Análisis inteligente de créditos
  const creditAnalysis = useMemo(() => {
    // Calculamos la cobertura comparando las cuotas con el superávit generado en el periodo actual
    return calculateCreditAnalysis(credits, summary.superavitNeto);
  }, [credits, summary.superavitNeto]);

  // Recordatorios automáticos en el navegador si es el día de pago
  useEffect(() => {
    if (creditAnalysis.esHoy && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification('📅 Recordatorio de Pago - RiderLedger', {
          body: `¡Hoy es día ${creditAnalysis.proximoDiaPago}! Tienes cuotas pendientes por pagar.`,
          icon: './favicon.svg'
        });
      } catch (e) {
        console.warn('Could not trigger notification', e);
      }
    }
  }, [creditAnalysis.esHoy, creditAnalysis.proximoDiaPago]);

  const requestNotificationPermission = async (): Promise<boolean> => {
    if (!('Notification' in window)) {
      alert('Tu navegador no soporta notificaciones de escritorio/móvil.');
      return false;
    }
    const perm = await Notification.requestPermission();
    if (perm === 'granted') {
      new Notification('🔔 Notificaciones Activadas', {
        body: 'Te avisaremos los días 10 y 30 para tus cuotas de crédito.',
        icon: './favicon.svg'
      });
      return true;
    }
    return false;
  };

  const setFilterRange = (range: TimeRange, customStart?: string, customEnd?: string) => {
    setFilter({ range, startDate: customStart, endDate: customEnd });
  };

  const openDrawer = (tab?: 'shift' | 'app_income' | 'quick_expense' | 'other_income') => {
    if (tab) setActiveDrawerTab(tab);
    setIsQuickActionOpen(true);
  };

  const closeDrawer = () => {
    setIsQuickActionOpen(false);
  };

  // Créditos CRUD
  const addCredit = (creditData: Omit<CreditInstallment, 'id'>) => {
    const newCredit: CreditInstallment = {
      ...creditData,
      id: crypto.randomUUID()
    };
    const updated = [...credits, newCredit];
    setCredits(updated);
    saveStoredCredits(updated);
  };

  const updateCredit = (updatedCredit: CreditInstallment) => {
    const updated = credits.map(c => (c.id === updatedCredit.id ? updatedCredit : c));
    setCredits(updated);
    saveStoredCredits(updated);
  };

  const deleteCredit = (id: string) => {
    const updated = credits.filter(c => c.id !== id);
    setCredits(updated);
    saveStoredCredits(updated);
  };

  const toggleCreditPaid = (id: string) => {
    const now = new Date();
    const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const updated = credits.map(c => {
      if (c.id === id) {
        const nextState = !c.pagadoEsteMes;
        return {
          ...c,
          pagadoEsteMes: nextState,
          ultimoMesPagado: nextState ? currentMonthStr : undefined
        };
      }
      return c;
    });
    setCredits(updated);
    saveStoredCredits(updated);
  };

  // Turnos CRUD
  const addShift = async (newShiftData: Omit<Shift, 'id'> & { id?: string }): Promise<Shift> => {
    const id = newShiftData.id || crypto.randomUUID();
    const created_at = new Date().toISOString();
    const isClientOnline = navigator.onLine && Boolean(getSupabaseClient());

    const newShift: Shift = {
      ...newShiftData,
      id,
      created_at,
      sync_status: isClientOnline ? 'synced' : 'pending'
    };

    const updated = [newShift, ...shifts];
    setShifts(updated);
    saveStoredShifts(updated);

    addToSyncQueue({
      id,
      entity: 'shifts',
      action: 'insert',
      payload: newShift
    });
    refreshPendingCount();

    if (isClientOnline) {
      getSupabaseClient()
        ?.from('shifts')
        .upsert(newShiftData)
        .then(({ error }) => {
          if (!error) {
            removeFromSyncQueue(id, 'shifts');
            refreshPendingCount();
          }
        });
    }

    return newShift;
  };

  const updateShift = async (updatedShift: Shift): Promise<void> => {
    const updated = shifts.map(s => (s.id === updatedShift.id ? updatedShift : s));
    setShifts(updated);
    saveStoredShifts(updated);

    addToSyncQueue({
      id: updatedShift.id,
      entity: 'shifts',
      action: 'insert',
      payload: updatedShift
    });
    refreshPendingCount();

    if (navigator.onLine && getSupabaseClient()) {
      getSupabaseClient()
        ?.from('shifts')
        .upsert(updatedShift)
        .then(({ error }) => {
          if (!error) {
            removeFromSyncQueue(updatedShift.id, 'shifts');
            refreshPendingCount();
          }
        });
    }
  };

  const deleteShift = async (id: string): Promise<void> => {
    const updated = shifts.filter(s => s.id !== id);
    setShifts(updated);
    saveStoredShifts(updated);

    addToSyncQueue({
      id,
      entity: 'shifts',
      action: 'delete',
      payload: { id }
    });
    refreshPendingCount();

    if (navigator.onLine && getSupabaseClient()) {
      getSupabaseClient()
        ?.from('shifts')
        .delete()
        .eq('id', id)
        .then(({ error }) => {
          if (!error) {
            removeFromSyncQueue(id, 'shifts');
            refreshPendingCount();
          }
        });
    }
  };

  // Transacciones CRUD
  const addTransaction = async (txData: Omit<Transaction, 'id'> & { id?: string }): Promise<Transaction> => {
    const id = txData.id || crypto.randomUUID();
    const created_at = new Date().toISOString();
    const isClientOnline = navigator.onLine && Boolean(getSupabaseClient());

    const newTx: Transaction = {
      ...txData,
      id,
      created_at,
      sync_status: isClientOnline ? 'synced' : 'pending'
    };

    const updated = [newTx, ...transactions];
    setTransactions(updated);
    saveStoredTransactions(updated);

    addToSyncQueue({
      id,
      entity: 'transactions',
      action: 'insert',
      payload: newTx
    });
    refreshPendingCount();

    if (isClientOnline) {
      getSupabaseClient()
        ?.from('transactions')
        .upsert(txData)
        .then(({ error }) => {
          if (!error) {
            removeFromSyncQueue(id, 'transactions');
            refreshPendingCount();
          }
        });
    }

    return newTx;
  };

  const updateTransaction = async (updatedTx: Transaction): Promise<void> => {
    const updated = transactions.map(t => (t.id === updatedTx.id ? updatedTx : t));
    setTransactions(updated);
    saveStoredTransactions(updated);

    addToSyncQueue({
      id: updatedTx.id,
      entity: 'transactions',
      action: 'insert',
      payload: updatedTx
    });
    refreshPendingCount();

    if (navigator.onLine && getSupabaseClient()) {
      getSupabaseClient()
        ?.from('transactions')
        .upsert(updatedTx)
        .then(({ error }) => {
          if (!error) {
            removeFromSyncQueue(updatedTx.id, 'transactions');
            refreshPendingCount();
          }
        });
    }
  };

  const deleteTransaction = async (id: string): Promise<void> => {
    const updated = transactions.filter(t => t.id !== id);
    setTransactions(updated);
    saveStoredTransactions(updated);

    addToSyncQueue({
      id,
      entity: 'transactions',
      action: 'delete',
      payload: { id }
    });
    refreshPendingCount();

    if (navigator.onLine && getSupabaseClient()) {
      getSupabaseClient()
        ?.from('transactions')
        .delete()
        .eq('id', id)
        .then(({ error }) => {
          if (!error) {
            removeFromSyncQueue(id, 'transactions');
            refreshPendingCount();
          }
        });
    }
  };

  const updateSupabaseConfig = async (config: SupabaseConfig): Promise<void> => {
    saveStoredSupabaseConfig(config);
    setSupabaseConfigState(config);
    if (config.url && config.anonKey) {
      await syncData();
    }
  };

  const loadDemoData = () => {
    const demo = generateDemoData();
    setShifts(demo.shifts);
    saveStoredShifts(demo.shifts);
    setTransactions(demo.transactions);
    saveStoredTransactions(demo.transactions);
    refreshPendingCount();
  };

  const clearAllData = () => {
    setShifts([]);
    setTransactions([]);
    saveStoredShifts([]);
    saveStoredTransactions([]);
    localStorage.removeItem('riderledger_sync_queue_v1');
    refreshPendingCount();
  };

  return (
    <AppDataContext.Provider
      value={{
        shifts,
        transactions,
        filteredShifts,
        filteredTransactions,
        summary,
        filter,
        setFilterRange,
        isOnline,
        isSyncing,
        lastSyncTime,
        pendingSyncCount,
        supabaseConfig,
        isSupabaseConfigured,
        syncErrorMessage,
        isQuickActionOpen,
        activeDrawerTab,
        openDrawer,
        closeDrawer,
        addShift,
        updateShift,
        deleteShift,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        triggerSync: syncData,
        updateSupabaseConfig,
        loadDemoData,
        clearAllData,
        credits,
        creditAnalysis,
        addCredit,
        updateCredit,
        deleteCredit,
        toggleCreditPaid,
        requestNotificationPermission,
        theme,
        toggleTheme,
        setTheme
      }}
    >
      {children}
    </AppDataContext.Provider>
  );
};

export const useAppData = () => {
  const context = useContext(AppDataContext);
  if (!context) {
    throw new Error('useAppData must be used within an AppDataProvider');
  }
  return context;
};
