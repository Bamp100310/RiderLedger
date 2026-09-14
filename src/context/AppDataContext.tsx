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
  CreditCardAccount,
  CreditCardAnalysis,
  FinancialSettings,
  ThreeTierFinancials,
  LaborHealthMetrics,
  ExpenseHealthAnalysis,
  SaveVsPayRecommendation,
  DashboardInsight,
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
  getStoredCreditCards,
  saveStoredCreditCards,
  getStoredFinancialSettings,
  saveStoredFinancialSettings,
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
import {
  calculateFinancialSummary,
  isDateInRange,
  calculateCreditAnalysis,
  calculateThreeTierFinancials,
  calculateLaborBenchmark,
  analyzeExpenseHealth,
  analyzeCreditCards,
  recommendSaveVsPayDebt,
  generateSmartInsights
} from '../lib/calculations';
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

  // Tarjetas de Crédito y Cuentas Revolventes
  creditCards: CreditCardAccount[];
  creditCardAnalysis: CreditCardAnalysis;
  addCreditCard: (card: Omit<CreditCardAccount, 'id' | 'userId'>) => void;
  updateCreditCard: (card: CreditCardAccount) => void;
  deleteCreditCard: (id: string) => void;

  // Metas y Referencias Financieras
  financialSettings: FinancialSettings;
  updateFinancialSettings: (settings: Partial<FinancialSettings>) => void;

  // Motores de análisis del Copiloto Financiero
  threeTierFinancials: ThreeTierFinancials;
  laborBenchmark: LaborHealthMetrics;
  expenseHealth: ExpenseHealthAnalysis;
  saveVsPayRecommendation: SaveVsPayRecommendation;
  smartInsights: DashboardInsight[];

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
    return getStoredShifts();
  });

  const [allTransactions, setAllTransactions] = useState<Transaction[]>(() => {
    return getStoredTransactions();
  });

  const [allCredits, setAllCredits] = useState<CreditInstallment[]>(() => {
    return getStoredCredits(activeUser.id);
  });

  const [allCreditCards, setAllCreditCards] = useState<CreditCardAccount[]>(() => {
    return getStoredCreditCards();
  });

  const [financialSettings, setFinancialSettingsState] = useState<FinancialSettings>(() => {
    return getStoredFinancialSettings();
  });

  const [filter, setFilter] = useState<DateFilter>(() => {
    try {
      const saved = localStorage.getItem('riderledger_filter_v2');
      if (saved) return JSON.parse(saved);
    } catch {}
    return { range: 'hoy' };
  });
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

    // Sincronizar inmediatamente a Supabase si está conectado
    const client = getSupabaseClient();
    if (client) {
      client.from('profiles').upsert({
        id: newUser.id,
        nombre: newUser.nombre,
        email: newUser.email || null,
        rol: newUser.rol,
        avatarColor: newUser.avatarColor,
        created_at: newUser.createdAt
      }).then();
    }

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

    const client = getSupabaseClient();
    if (client) {
      client.from('profiles').delete().eq('id', userId).then();
    }

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

  const creditCards = useMemo(() => {
    return allCreditCards.filter(c => !c.userId || c.userId === activeUser.id);
  }, [allCreditCards, activeUser.id]);

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

  // Motores analíticos del Copiloto Financiero
  const threeTierFinancials = useMemo(() => {
    return calculateThreeTierFinancials(filteredTransactions, filteredShifts, credits, creditCards);
  }, [filteredTransactions, filteredShifts, credits, creditCards]);

  const creditCardAnalysis = useMemo(() => {
    return analyzeCreditCards(creditCards);
  }, [creditCards]);

  const laborBenchmark = useMemo(() => {
    return calculateLaborBenchmark(filteredShifts, filteredTransactions, financialSettings);
  }, [filteredShifts, filteredTransactions, financialSettings]);

  const expenseHealth = useMemo(() => {
    return analyzeExpenseHealth(filteredTransactions, [], financialSettings);
  }, [filteredTransactions, financialSettings]);

  const saveVsPayRecommendation = useMemo(() => {
    return recommendSaveVsPayDebt(
      threeTierFinancials.flujoDisponible,
      credits,
      creditCards,
      financialSettings.metaAhorroMensual || 300000,
      threeTierFinancials.gastosOperativos,
      financialSettings
    );
  }, [threeTierFinancials.flujoDisponible, threeTierFinancials.gastosOperativos, credits, creditCards, financialSettings]);

  const smartInsights = useMemo(() => {
    return generateSmartInsights(
      threeTierFinancials,
      laborBenchmark,
      expenseHealth,
      creditCardAnalysis,
      saveVsPayRecommendation,
      null,
      financialSettings
    );
  }, [threeTierFinancials, laborBenchmark, expenseHealth, creditCardAnalysis, saveVsPayRecommendation, financialSettings]);

  const refreshPendingCount = useCallback(() => {
    setPendingSyncCount(getStoredSyncQueue().length);
  }, []);

  // Refs para evitar closures stale en syncData
  const allShiftsRef = React.useRef(allShifts);
  const allTransactionsRef = React.useRef(allTransactions);
  const usersRef = React.useRef(users);
  React.useEffect(() => { allShiftsRef.current = allShifts; }, [allShifts]);
  React.useEffect(() => { allTransactionsRef.current = allTransactions; }, [allTransactions]);
  React.useEffect(() => { usersRef.current = users; }, [users]);

  // Flag para evitar que el sync sobreescriba cambios locales recientes
  const lastLocalChangeRef = React.useRef<number>(0);
  const SYNC_GRACE_PERIOD_MS = 3000; // No sincronizar dentro de 3s después de un cambio local

  const syncData = useCallback(async () => {
    if (!navigator.onLine || !getSupabaseClient()) return;

    // No reemplazar estado si hubo un cambio local muy reciente
    const timeSinceLastChange = Date.now() - lastLocalChangeRef.current;
    if (timeSinceLastChange < SYNC_GRACE_PERIOD_MS) return;

    setIsSyncing(true);
    setSyncErrorMessage(null);

    try {
      const result = await syncWithSupabase(allShiftsRef.current, allTransactionsRef.current, usersRef.current);
      if (result.success) {
        // Solo actualizar si no hubo cambios locales durante la sincronización
        if (Date.now() - lastLocalChangeRef.current >= SYNC_GRACE_PERIOD_MS) {
          setAllShifts(result.shifts);
          saveStoredShifts(result.shifts);
          setAllTransactions(result.transactions);
          saveStoredTransactions(result.transactions);
          if (result.users && result.users.length > 0) {
            setUsers(result.users);
            saveStoredUsers(result.users);
            if (!result.users.find(u => u.id === activeUser.id)) {
              setActiveUserState(result.users[0]);
              saveActiveUser(result.users[0]);
              setAllApps(getStoredUserApps(result.users[0].id));
            }
          }
        }
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
  }, [activeUser.id, refreshPendingCount]);

  // Sincronización automática: Solo al cargar la app y al recuperar foco/conexión
  useEffect(() => {
    if (getSupabaseClient()) {
      syncData();
    }
  }, []);

  // Supabase Realtime: Recibir cambios de otros dispositivos al instante por WebSockets
  useEffect(() => {
    const client = getSupabaseClient();
    if (!client) return;

    const channel = client
      .channel('app_realtime_sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, (payload) => {
        if (payload.eventType === 'INSERT' && payload.new) {
          const newRow = { ...payload.new, sync_status: 'synced' } as Transaction;
          setAllTransactions(prev => {
            if (prev.some(t => t.id === newRow.id)) {
              return prev.map(t => t.id === newRow.id ? newRow : t);
            }
            const updated = [newRow, ...prev];
            saveStoredTransactions(updated);
            return updated;
          });
        } else if (payload.eventType === 'UPDATE' && payload.new) {
          const updatedRow = { ...payload.new, sync_status: 'synced' } as Transaction;
          setAllTransactions(prev => {
            const updated = prev.map(t => t.id === updatedRow.id ? updatedRow : t);
            saveStoredTransactions(updated);
            return updated;
          });
        } else if (payload.eventType === 'DELETE' && payload.old) {
          const deletedId = (payload.old as any)?.id;
          if (deletedId) {
            setAllTransactions(prev => {
              const updated = prev.filter(t => t.id !== deletedId);
              saveStoredTransactions(updated);
              return updated;
            });
          }
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shifts' }, (payload) => {
        if (payload.eventType === 'INSERT' && payload.new) {
          const newRow = { ...payload.new, sync_status: 'synced' } as Shift;
          setAllShifts(prev => {
            if (prev.some(s => s.id === newRow.id)) {
              return prev.map(s => s.id === newRow.id ? newRow : s);
            }
            const updated = [newRow, ...prev];
            saveStoredShifts(updated);
            return updated;
          });
        } else if (payload.eventType === 'UPDATE' && payload.new) {
          const updatedRow = { ...payload.new, sync_status: 'synced' } as Shift;
          setAllShifts(prev => {
            const updated = prev.map(s => s.id === updatedRow.id ? updatedRow : s);
            saveStoredShifts(updated);
            return updated;
          });
        } else if (payload.eventType === 'DELETE' && payload.old) {
          const deletedId = (payload.old as any)?.id;
          if (deletedId) {
            setAllShifts(prev => {
              const updated = prev.filter(s => s.id !== deletedId);
              saveStoredShifts(updated);
              return updated;
            });
          }
        }
      })
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    const handleSyncTrigger = () => {
      if (navigator.onLine && getSupabaseClient()) {
        syncData();
      }
    };

    window.addEventListener('online', handleSyncTrigger);
    window.addEventListener('focus', handleSyncTrigger);

    // Polling rápido cada 15 segundos como respaldo secundario
    const timer = setInterval(handleSyncTrigger, 15000);

    return () => {
      window.removeEventListener('online', handleSyncTrigger);
      window.removeEventListener('focus', handleSyncTrigger);
      clearInterval(timer);
    };
  }, [syncData]);

  // Helper: enviar inmediatamente a Supabase en background (fire-and-forget)
  const pushToSupabaseNow = useCallback((entity: 'shifts' | 'transactions', action: 'upsert' | 'delete', payload: any, id?: string) => {
    const client = getSupabaseClient();
    if (!client || !navigator.onLine) return;

    if (action === 'upsert') {
      const { sync_status, ...clean } = payload;
      client.from(entity).upsert(clean).then(({ error }) => {
        if (error) {
          // Reintentar sin shift_id si viola clave foránea (ej: shift no insertado aún)
          if (error.code === '23503' || error.message?.includes('foreign key constraint') || error.message?.includes('fkey')) {
            const { shift_id, ...fallback } = clean;
            client.from(entity).upsert({ ...fallback, shift_id: null }).then();
          } else {
            console.warn(`Push ${entity} failed:`, error.message);
          }
        }
      });
    } else if (action === 'delete' && id) {
      client.from(entity).delete().eq('id', id).then(({ error }) => {
        if (error) console.warn(`Delete ${entity} failed:`, error.message);
      });
    }
  }, []);

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

    lastLocalChangeRef.current = Date.now();
    const updated = [newShift, ...allShifts];
    setAllShifts(updated);
    saveStoredShifts(updated);

    addToSyncQueue({ id, entity: 'shifts', action: 'insert', payload: newShift });
    pushToSupabaseNow('shifts', 'upsert', newShift);
    refreshPendingCount();
    return newShift;
  };

  const updateShift = async (updatedShift: Shift): Promise<void> => {
    lastLocalChangeRef.current = Date.now();
    const updated = allShifts.map(s => (s.id === updatedShift.id ? updatedShift : s));
    setAllShifts(updated);
    saveStoredShifts(updated);
    addToSyncQueue({ id: updatedShift.id, entity: 'shifts', action: 'insert', payload: updatedShift });
    pushToSupabaseNow('shifts', 'upsert', updatedShift);
    refreshPendingCount();
  };

  const deleteShift = async (id: string): Promise<void> => {
    lastLocalChangeRef.current = Date.now();
    const updated = allShifts.filter(s => s.id !== id);
    setAllShifts(updated);
    saveStoredShifts(updated);
    addToSyncQueue({ id, entity: 'shifts', action: 'delete', payload: { id } });
    pushToSupabaseNow('shifts', 'delete', null, id);
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

    lastLocalChangeRef.current = Date.now();
    const updated = [newTx, ...allTransactions];
    setAllTransactions(updated);
    saveStoredTransactions(updated);

    addToSyncQueue({ id, entity: 'transactions', action: 'insert', payload: newTx });
    pushToSupabaseNow('transactions', 'upsert', newTx);
    refreshPendingCount();
    return newTx;
  };

  const updateTransaction = async (updatedTx: Transaction): Promise<void> => {
    lastLocalChangeRef.current = Date.now();
    const updated = allTransactions.map(t => (t.id === updatedTx.id ? updatedTx : t));
    setAllTransactions(updated);
    saveStoredTransactions(updated);
    addToSyncQueue({ id: updatedTx.id, entity: 'transactions', action: 'update', payload: updatedTx });
    pushToSupabaseNow('transactions', 'upsert', updatedTx);
    refreshPendingCount();
  };

  const deleteTransaction = async (id: string): Promise<void> => {
    lastLocalChangeRef.current = Date.now();
    const updated = allTransactions.filter(t => t.id !== id);
    setAllTransactions(updated);
    saveStoredTransactions(updated);
    addToSyncQueue({ id, entity: 'transactions', action: 'delete', payload: { id } });
    pushToSupabaseNow('transactions', 'delete', null, id);
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

  // Handlers para Tarjetas de Crédito y Cuentas Revolventes
  const addCreditCard = useCallback((card: Omit<CreditCardAccount, 'id' | 'userId'>) => {
    const newCard: CreditCardAccount = {
      ...card,
      id: `cc-${Date.now()}`,
      userId: activeUser.id
    };
    const updated = [...allCreditCards, newCard];
    setAllCreditCards(updated);
    saveStoredCreditCards(updated);
  }, [allCreditCards, activeUser.id]);

  const updateCreditCard = useCallback((card: CreditCardAccount) => {
    const updated = allCreditCards.map(c => c.id === card.id ? card : c);
    setAllCreditCards(updated);
    saveStoredCreditCards(updated);
  }, [allCreditCards]);

  const deleteCreditCard = useCallback((id: string) => {
    const updated = allCreditCards.filter(c => c.id !== id);
    setAllCreditCards(updated);
    saveStoredCreditCards(updated);
  }, [allCreditCards]);

  // Handlers para Metas y Referencias Financieras
  const updateFinancialSettings = useCallback((newSettings: Partial<FinancialSettings>) => {
    setFinancialSettingsState(prev => {
      const updated = { ...prev, ...newSettings };
      saveStoredFinancialSettings(updated);
      return updated;
    });
  }, []);

  const setFilterRange = (range: TimeRange, customStart?: string, customEnd?: string) => {
    const newFilter: DateFilter = { range, startDate: customStart, endDate: customEnd };
    setFilter(newFilter);
    try {
      localStorage.setItem('riderledger_filter_v2', JSON.stringify(newFilter));
    } catch {}
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
    const otherCreditCards = allCreditCards.filter(c => c.userId !== activeUser.id);

    setAllShifts(otherShifts);
    saveStoredShifts(otherShifts);
    setAllTransactions(otherTxs);
    saveStoredTransactions(otherTxs);
    setAllCredits(otherCredits);
    saveStoredCredits(otherCredits);
    setAllCreditCards(otherCreditCards);
    saveStoredCreditCards(otherCreditCards);
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
        creditCards,
        creditCardAnalysis,
        addCreditCard,
        updateCreditCard,
        deleteCreditCard,
        financialSettings,
        updateFinancialSettings,
        threeTierFinancials,
        laborBenchmark,
        expenseHealth,
        saveVsPayRecommendation,
        smartInsights,
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
