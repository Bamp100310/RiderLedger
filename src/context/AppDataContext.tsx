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
  ThemeMode,
  UserProfile,
  UserApp
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
  saveStoredTheme,
  getStoredUsers,
  saveStoredUsers,
  getActiveUser,
  saveActiveUser,
  getStoredUserApps,
  saveStoredUserApps,
  getDefaultAppsForUser
} from '../lib/storage';
import { calculateFinancialSummary, isDateInRange, calculateCreditAnalysis } from '../lib/calculations';
import { getSupabaseClient, syncWithSupabase } from '../lib/supabase';

interface AppDataContextType {
  // Usuario Activo y Familia
  activeUser: UserProfile;
  users: UserProfile[];
  switchUser: (userId: string) => void;
  createUser: (nombre: string, rol?: string) => UserProfile;
  deleteUser: (userId: string) => void;

  // Apps Configurables
  userApps: UserApp[];
  activeDeliveryApps: UserApp[];
  activePassengerApps: UserApp[];
  addUserApp: (nombre: string, tipo: 'DOMICILIOS' | 'PASAJEROS', color: string, icono?: string) => void;
  updateUserApp: (app: UserApp) => void;
  deleteUserApp: (id: string) => void;
  toggleUserApp: (id: string) => void;

  // Datos financieros aislados por usuario
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
  addShift: (shift: Omit<Shift, 'id' | 'userId'> & { id?: string }) => Promise<Shift>;
  updateShift: (shift: Shift) => Promise<void>;
  deleteShift: (id: string) => Promise<void>;
  addTransaction: (tx: Omit<Transaction, 'id' | 'userId'> & { id?: string }) => Promise<Transaction>;
  updateTransaction: (tx: Transaction) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  triggerSync: () => Promise<void>;
  updateSupabaseConfig: (config: SupabaseConfig) => Promise<void>;
  loadDemoData: () => void;
  clearAllData: () => void;

  // Créditos del usuario activo
  credits: CreditInstallment[];
  creditAnalysis: CreditAnalysis;
  addCredit: (credit: Omit<CreditInstallment, 'id' | 'userId'>) => void;
  updateCredit: (credit: CreditInstallment) => void;
  deleteCredit: (id: string) => void;
  toggleCreditPaid: (id: string) => void;
  requestNotificationPermission: () => Promise<boolean>;

  // Tema
  theme: ThemeMode;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
}

const AppDataContext = createContext<AppDataContextType | undefined>(undefined);

export const AppDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Usuarios y Sesión Familiar
  const [users, setUsers] = useState<UserProfile[]>(() => getStoredUsers());
  const [activeUser, setActiveUserState] = useState<UserProfile>(() => getActiveUser());

  // 2. Apps del usuario
  const [allApps, setAllApps] = useState<UserApp[]>(() => {
    return getStoredUserApps(activeUser.id);
  });

  // 3. Tema Claro/Oscuro
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    const saved = getStoredTheme();
    const root = document.documentElement;
    if (saved === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
    }
    return saved;
  });

  // 4. Datos financieros (todos los registros en localStorage)
  const [allShifts, setAllShifts] = useState<Shift[]>(() => {
    const stored = getStoredShifts();
    if (stored.length > 0) return stored;
    const demo = generateDemoData(activeUser.id);
    saveStoredShifts(demo.shifts);
    saveStoredTransactions(demo.transactions);
    return demo.shifts;
  });

  const [allTransactions, setAllTransactions] = useState<Transaction[]>(() => {
    return getStoredTransactions();
  });

  const [allCredits, setAllCredits] = useState<CreditInstallment[]>(() => {
    return getStoredCredits(activeUser.id);
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

  // Tema handler
  const setTheme = useCallback((mode: ThemeMode) => {
    setThemeState(mode);
    saveStoredTheme(mode);
  }, []);

  const toggleTheme = useCallback(() => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
  }, [theme, setTheme]);

  // Manejo de Usuario Activo
  const switchUser = useCallback((userId: string) => {
    const found = users.find(u => u.id === userId);
    if (found) {
      setActiveUserState(found);
      saveActiveUser(found);
      // Recargar apps del usuario
      const uApps = getStoredUserApps(found.id);
      setAllApps(uApps);
    }
  }, [users]);

  const createUser = useCallback((nombre: string, rol: string = 'Miembro Familiar'): UserProfile => {
    const colors = ['#0ea5e9', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4'];
    const newUser: UserProfile = {
      id: `user-${Date.now()}`,
      nombre: nombre.trim(),
      rol,
      avatarColor: colors[Math.floor(Math.random() * colors.length)],
      createdAt: new Date().toISOString()
    };
    const updated = [...users, newUser];
    setUsers(updated);
    saveStoredUsers(updated);

    // Inicializar apps por defecto para el nuevo usuario
    const defApps = getDefaultAppsForUser(newUser.id);
    setAllApps(prev => [...prev, ...defApps]);
    saveStoredUserApps([...allApps, ...defApps]);

    switchUser(newUser.id);
    return newUser;
  }, [users, allApps, switchUser]);

  const deleteUser = useCallback((userId: string) => {
    if (users.length <= 1) {
      alert('Debe existir al menos un usuario en la aplicación.');
      return;
    }
    const updated = users.filter(u => u.id !== userId);
    setUsers(updated);
    saveStoredUsers(updated);
    if (activeUser.id === userId) {
      switchUser(updated[0].id);
    }
  }, [users, activeUser.id, switchUser]);

  // Manejo de Apps Configurables para el usuario activo
  const userApps = useMemo(() => {
    return allApps.filter(a => a.userId === activeUser.id);
  }, [allApps, activeUser.id]);

  const activeDeliveryApps = useMemo(() => {
    return userApps.filter(a => a.tipo === 'DOMICILIOS' && a.activa);
  }, [userApps]);

  const activePassengerApps = useMemo(() => {
    return userApps.filter(a => a.tipo === 'PASAJEROS' && a.activa);
  }, [userApps]);

  const addUserApp = (nombre: string, tipo: 'DOMICILIOS' | 'PASAJEROS', color: string, icono: string = '📱') => {
    const newApp: UserApp = {
      id: `${activeUser.id}-app-${Date.now()}`,
      userId: activeUser.id,
      nombre: nombre.trim(),
      tipo,
      color,
      icono,
      activa: true
    };
    const updated = [...allApps, newApp];
    setAllApps(updated);
    saveStoredUserApps(updated);
  };

  const updateUserApp = (app: UserApp) => {
    const updated = allApps.map(a => (a.id === app.id ? app : a));
    setAllApps(updated);
    saveStoredUserApps(updated);
  };

  const deleteUserApp = (id: string) => {
    const updated = allApps.filter(a => a.id !== id);
    setAllApps(updated);
    saveStoredUserApps(updated);
  };

  const toggleUserApp = (id: string) => {
    const updated = allApps.map(a => (a.id === id ? { ...a, activa: !a.activa } : a));
    setAllApps(updated);
    saveStoredUserApps(updated);
  };

  // Filtrar registros estrictamente del usuario activo
  const shifts = useMemo(() => {
    return allShifts.filter(s => !s.userId || s.userId === activeUser.id);
  }, [allShifts, activeUser.id]);

  const transactions = useMemo(() => {
    return allTransactions.filter(t => !t.userId || t.userId === activeUser.id);
  }, [allTransactions, activeUser.id]);

  const credits = useMemo(() => {
    return allCredits.filter(c => !c.userId || c.userId === activeUser.id);
  }, [allCredits, activeUser.id]);

  // Filtrado temporal
  const filteredShifts = useMemo(() => {
    return shifts.filter(s => isDateInRange(s.fecha, filter.range, filter.startDate, filter.endDate));
  }, [shifts, filter]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => isDateInRange(t.fecha, filter.range, filter.startDate, filter.endDate));
  }, [transactions, filter]);

  const summary = useMemo(() => {
    return calculateFinancialSummary(filteredShifts, filteredTransactions);
  }, [filteredShifts, filteredTransactions]);

  const creditAnalysis = useMemo(() => {
    return calculateCreditAnalysis(credits, summary.superavitNeto);
  }, [credits, summary.superavitNeto]);

  const refreshPendingCount = useCallback(() => {
    setPendingSyncCount(getStoredSyncQueue().length);
  }, []);

  const syncData = useCallback(async () => {
    if (!navigator.onLine || !getSupabaseClient()) return;
    setIsSyncing(true);
    setSyncErrorMessage(null);

    try {
      const result = await syncWithSupabase(allShifts, allTransactions);
      if (result.success) {
        setAllShifts(result.shifts);
        saveStoredShifts(result.shifts);
        setAllTransactions(result.transactions);
        saveStoredTransactions(result.transactions);
        const nowIso = new Date().toISOString();
        setLastSyncTime(nowIso);
        saveStoredLastSync(nowIso);
        refreshPendingCount();
      } else if (result.errorMessage) {
        setSyncErrorMessage(result.errorMessage);
      }
    } catch (err: any) {
      setSyncErrorMessage(err?.message || 'Error en sincronización');
    } finally {
      setIsSyncing(false);
      refreshPendingCount();
    }
  }, [allShifts, allTransactions, refreshPendingCount]);

  // Turnos CRUD
  const addShift = async (newShiftData: Omit<Shift, 'id' | 'userId'> & { id?: string }): Promise<Shift> => {
    const id = newShiftData.id || crypto.randomUUID();
    const created_at = new Date().toISOString();
    const isClientOnline = navigator.onLine && Boolean(getSupabaseClient());

    const newShift: Shift = {
      ...newShiftData,
      id,
      userId: activeUser.id,
      created_at,
      sync_status: isClientOnline ? 'synced' : 'pending'
    };

    const updated = [newShift, ...allShifts];
    setAllShifts(updated);
    saveStoredShifts(updated);

    addToSyncQueue({ id, entity: 'shifts', action: 'insert', payload: newShift });
    refreshPendingCount();
    return newShift;
  };

  const updateShift = async (updatedShift: Shift): Promise<void> => {
    const updated = allShifts.map(s => (s.id === updatedShift.id ? updatedShift : s));
    setAllShifts(updated);
    saveStoredShifts(updated);
    addToSyncQueue({ id: updatedShift.id, entity: 'shifts', action: 'insert', payload: updatedShift });
    refreshPendingCount();
  };

  const deleteShift = async (id: string): Promise<void> => {
    const updated = allShifts.filter(s => s.id !== id);
    setAllShifts(updated);
    saveStoredShifts(updated);
    addToSyncQueue({ id, entity: 'shifts', action: 'delete', payload: { id } });
    refreshPendingCount();
  };

  // Transacciones CRUD
  const addTransaction = async (txData: Omit<Transaction, 'id' | 'userId'> & { id?: string }): Promise<Transaction> => {
    const id = txData.id || crypto.randomUUID();
    const created_at = new Date().toISOString();
    const isClientOnline = navigator.onLine && Boolean(getSupabaseClient());

    const newTx: Transaction = {
      ...txData,
      id,
      userId: activeUser.id,
      created_at,
      sync_status: isClientOnline ? 'synced' : 'pending'
    };

    const updated = [newTx, ...allTransactions];
    setAllTransactions(updated);
    saveStoredTransactions(updated);

    addToSyncQueue({ id, entity: 'transactions', action: 'insert', payload: newTx });
    refreshPendingCount();
    return newTx;
  };

  const updateTransaction = async (updatedTx: Transaction): Promise<void> => {
    const updated = allTransactions.map(t => (t.id === updatedTx.id ? updatedTx : t));
    setAllTransactions(updated);
    saveStoredTransactions(updated);
    addToSyncQueue({ id: updatedTx.id, entity: 'transactions', action: 'insert', payload: updatedTx });
    refreshPendingCount();
  };

  const deleteTransaction = async (id: string): Promise<void> => {
    const updated = allTransactions.filter(t => t.id !== id);
    setAllTransactions(updated);
    saveStoredTransactions(updated);
    addToSyncQueue({ id, entity: 'transactions', action: 'delete', payload: { id } });
    refreshPendingCount();
  };

  // Créditos CRUD
  const addCredit = (creditData: Omit<CreditInstallment, 'id' | 'userId'>) => {
    const newCredit: CreditInstallment = {
      ...creditData,
      id: crypto.randomUUID(),
      userId: activeUser.id
    };
    const updated = [...allCredits, newCredit];
    setAllCredits(updated);
    saveStoredCredits(updated);
  };

  const updateCredit = (updatedCredit: CreditInstallment) => {
    const updated = allCredits.map(c => (c.id === updatedCredit.id ? updatedCredit : c));
    setAllCredits(updated);
    saveStoredCredits(updated);
  };

  const deleteCredit = (id: string) => {
    const updated = allCredits.filter(c => c.id !== id);
    setAllCredits(updated);
    saveStoredCredits(updated);
  };

  const toggleCreditPaid = (id: string) => {
    const now = new Date();
    const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const updated = allCredits.map(c => {
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
    setAllCredits(updated);
    saveStoredCredits(updated);
  };

  const requestNotificationPermission = async (): Promise<boolean> => {
    if (!('Notification' in window)) return false;
    const perm = await Notification.requestPermission();
    if (perm === 'granted') {
      new Notification('🔔 Notificaciones Activadas', {
        body: 'Te avisaremos los días 10 y 30 para tus cuotas.',
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

  const closeDrawer = () => setIsQuickActionOpen(false);

  const updateSupabaseConfig = async (config: SupabaseConfig): Promise<void> => {
    saveStoredSupabaseConfig(config);
    setSupabaseConfigState(config);
    if (config.url && config.anonKey) await syncData();
  };

  const loadDemoData = () => {
    const demo = generateDemoData(activeUser.id);
    const otherShifts = allShifts.filter(s => s.userId !== activeUser.id);
    const otherTxs = allTransactions.filter(t => t.userId !== activeUser.id);

    const mergedShifts = [...otherShifts, ...demo.shifts];
    const mergedTxs = [...otherTxs, ...demo.transactions];

    setAllShifts(mergedShifts);
    saveStoredShifts(mergedShifts);
    setAllTransactions(mergedTxs);
    saveStoredTransactions(mergedTxs);
    refreshPendingCount();
  };

  const clearAllData = () => {
    const otherShifts = allShifts.filter(s => s.userId !== activeUser.id);
    const otherTxs = allTransactions.filter(t => t.userId !== activeUser.id);
    const otherCredits = allCredits.filter(c => c.userId !== activeUser.id);

    setAllShifts(otherShifts);
    saveStoredShifts(otherShifts);
    setAllTransactions(otherTxs);
    saveStoredTransactions(otherTxs);
    setAllCredits(otherCredits);
    saveStoredCredits(otherCredits);
  };

  return (
    <AppDataContext.Provider
      value={{
        activeUser,
        users,
        switchUser,
        createUser,
        deleteUser,
        userApps,
        activeDeliveryApps,
        activePassengerApps,
        addUserApp,
        updateUserApp,
        deleteUserApp,
        toggleUserApp,
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
