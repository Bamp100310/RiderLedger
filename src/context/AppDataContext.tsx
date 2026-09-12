import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { Shift, Transaction, DateFilter, FinancialSummary, SupabaseConfig, TimeRange } from '../types';
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
  generateDemoData
} from '../lib/storage';
import { calculateFinancialSummary, isDateInRange } from '../lib/calculations';
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
}

const AppDataContext = createContext<AppDataContextType | undefined>(undefined);

export const AppDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [shifts, setShifts] = useState<Shift[]>(() => {
    const stored = getStoredShifts();
    if (stored.length > 0) return stored;
    // Si no hay datos, inicializamos con datos de demo para dar una experiencia inmediata excelente
    const demo = generateDemoData();
    saveStoredShifts(demo.shifts);
    saveStoredTransactions(demo.transactions);
    return demo.shifts;
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    return getStoredTransactions();
  });

  const [filter, setFilter] = useState<DateFilter>({ range: 'hoy' });
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(getStoredLastSync);
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(() => getStoredSyncQueue().length);
  const [supabaseConfig, setSupabaseConfigState] = useState<SupabaseConfig>(getStoredSupabaseConfig);
  const [syncErrorMessage, setSyncErrorMessage] = useState<string | null>(null);

  // Control del modal / drawer inferior táctil
  const [isQuickActionOpen, setIsQuickActionOpen] = useState(false);
  const [activeDrawerTab, setActiveDrawerTab] = useState<'shift' | 'app_income' | 'quick_expense' | 'other_income'>('shift');

  const isSupabaseConfigured = Boolean(supabaseConfig.url && supabaseConfig.anonKey);

  // Escuchar estado de conexión del navegador
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Auto-sincronizar al recuperar internet si hay pendientes
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

  // Actualizar conteo de pendientes
  const refreshPendingCount = useCallback(() => {
    setPendingSyncCount(getStoredSyncQueue().length);
  }, []);

  // Función de sincronización bidireccional
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

  // Sincronizar al cargar si hay configuración
  useEffect(() => {
    if (isSupabaseConfigured && navigator.onLine) {
      syncData();
    }
  }, [isSupabaseConfigured]);

  // Filtrado de datos reactivo
  const filteredShifts = useMemo(() => {
    return shifts.filter(s => isDateInRange(s.fecha, filter.range, filter.startDate, filter.endDate));
  }, [shifts, filter]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => isDateInRange(t.fecha, filter.range, filter.startDate, filter.endDate));
  }, [transactions, filter]);

  const summary = useMemo(() => {
    return calculateFinancialSummary(filteredShifts, filteredTransactions);
  }, [filteredShifts, filteredTransactions]);

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

  // Operaciones CRUD de Turnos (Shifts)
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

    // Encolar mutación para sincronización offline
    addToSyncQueue({
      id,
      entity: 'shifts',
      action: 'insert',
      payload: newShift
    });
    refreshPendingCount();

    if (isClientOnline) {
      // Intentar subir de inmediato
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

  // Operaciones CRUD de Transacciones
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
        clearAllData
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
