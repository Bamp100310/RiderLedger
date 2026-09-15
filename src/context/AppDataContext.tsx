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
  getAllStoredShifts,
  saveStoredShifts,
  getStoredTransactions,
  getAllStoredTransactions,
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
  getAllStoredCredits,
  saveStoredCredits,
  getStoredCreditCards,
  getAllStoredCreditCards,
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
  generateSmartInsights,
  navigatePeriod,
  getLocalDateString,
  parseLocalDate
} from '../lib/calculations';
import {
  getSupabaseClient,
  syncWithSupabase,
  mapCreditToRemote,
  mapRemoteToCredit,
  mapCardToRemote,
  mapRemoteToCard,
  mapSettingsToRemote,
  mapRemoteToSettings
} from '../lib/supabase';

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
  setFilterRange: (range: TimeRange, customStart?: string, customEnd?: string, referenceDate?: string) => void;
  navigateFilter: (direction: -1 | 1) => void;
  resetFilterToToday: () => void;
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

// Normalizadores robustos para eventos Realtime de PostgreSQL / Supabase
function normalizeRealtimeTransaction(raw: any): Transaction {
  return {
    id: String(raw.id),
    userId: raw.userId || raw.user_id || raw.userid,
    fecha: String(raw.fecha || ''),
    tipo: raw.tipo,
    categoria: raw.categoria,
    subcategoria: raw.subcategoria || '',
    descripcion: raw.descripcion || null,
    monto: Number(raw.monto) || 0,
    medio_pago: raw.medio_pago,
    shift_id: raw.shift_id || null,
    created_at: raw.created_at || new Date().toISOString(),
    updated_at: raw.updated_at || new Date().toISOString(),
    deleted_at: raw.deleted_at || null,
    sync_status: 'synced'
  };
}

function normalizeRealtimeShift(raw: any): Shift {
  return {
    id: String(raw.id),
    userId: raw.userId || raw.user_id || raw.userid,
    fecha: String(raw.fecha || ''),
    tiempo_reparto_minutos: Number(raw.tiempo_reparto_minutos) || 0,
    tiempo_espera_minutos: Number(raw.tiempo_espera_minutos) || 0,
    kilometros: Number(raw.kilometros) || 0,
    odometer_start: raw.odometer_start != null ? Number(raw.odometer_start) : null,
    odometer_end: raw.odometer_end != null ? Number(raw.odometer_end) : null,
    created_at: raw.created_at || new Date().toISOString(),
    updated_at: raw.updated_at || new Date().toISOString(),
    deleted_at: raw.deleted_at || null,
    sync_status: 'synced'
  };
}

function broadcastSyncEvent(type: string, payload: any) {
  try {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      const channel = new BroadcastChannel('riderledger_sync_channel');
      channel.postMessage({ type, payload });
      channel.close();
    }
  } catch {}
}

const AppDataContext = createContext<AppDataContextType | undefined>(undefined);

export const AppDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Usuarios y Sesión Familiar
  const [users, setUsers] = useState<UserProfile[]>(() => getStoredUsers());
  const [activeUser, setActiveUserState] = useState<UserProfile>(() => getActiveUser());

  // 2. Apps del usuario
  const [allApps, setAllApps] = useState<UserApp[]>(() => getStoredUserApps(activeUser.id));

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

  // 3. Estado local de turnos y transacciones (reactivo e instantáneo)
  const [allShifts, setAllShifts] = useState<Shift[]>(() => {
    return getAllStoredShifts();
  });

  const [allTransactions, setAllTransactions] = useState<Transaction[]>(() => {
    return getAllStoredTransactions();
  });

  const [allCredits, setAllCredits] = useState<CreditInstallment[]>(() => {
    return getAllStoredCredits();
  });

  const [allCreditCards, setAllCreditCards] = useState<CreditCardAccount[]>(() => {
    return getAllStoredCreditCards();
  });

  const [financialSettings, setFinancialSettingsState] = useState<FinancialSettings>(() => {
    return getStoredFinancialSettings(activeUser.id);
  });

  const [filter, setFilter] = useState<DateFilter>(() => {
    const today = getLocalDateString();
    try {
      const saved = localStorage.getItem('riderledger_filter_v3');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          range: parsed.range || 'mes',
          referenceDate: parsed.range === 'hoy' ? today : (parsed.referenceDate || today),
          startDate: parsed.startDate,
          endDate: parsed.endDate
        };
      }
    } catch {}
    return { range: 'mes', referenceDate: today };
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
      // Recargar configuración financiera aislada del usuario
      const uSettings = getStoredFinancialSettings(found.id);
      setFinancialSettingsState(uSettings);
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

  // Filtrar registros estrictamente del usuario activo (excluyendo soft-deletes)
  const shifts = useMemo(() => {
    return allShifts.filter(s => !s.deleted_at && (!s.userId || s.userId === activeUser.id));
  }, [allShifts, activeUser.id]);

  const transactions = useMemo(() => {
    return allTransactions.filter(t => !t.deleted_at && (!t.userId || t.userId === activeUser.id));
  }, [allTransactions, activeUser.id]);

  const credits = useMemo(() => {
    return allCredits.filter(c => !c.deleted_at && (!c.userId || c.userId === activeUser.id));
  }, [allCredits, activeUser.id]);

  const creditCards = useMemo(() => {
    return allCreditCards.filter(c => !c.deleted_at && (!c.userId || c.userId === activeUser.id));
  }, [allCreditCards, activeUser.id]);

  // Filtrado temporal
  const filteredShifts = useMemo(() => {
    return shifts.filter(s => isDateInRange(s.fecha, filter.range, filter.startDate, filter.endDate, filter.referenceDate));
  }, [shifts, filter]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => isDateInRange(t.fecha, filter.range, filter.startDate, filter.endDate, filter.referenceDate));
  }, [transactions, filter]);

  const summary = useMemo(() => {
    return calculateFinancialSummary(filteredShifts, filteredTransactions);
  }, [filteredShifts, filteredTransactions]);

  const creditAnalysis = useMemo(() => {
    const refDate = parseLocalDate(filter.referenceDate || getLocalDateString());
    return calculateCreditAnalysis(credits, summary.superavitNeto, refDate, creditCards);
  }, [credits, summary.superavitNeto, filter.referenceDate, creditCards]);

  // Motores analíticos del Copiloto Financiero
  const threeTierFinancials = useMemo(() => {
    return calculateThreeTierFinancials(filteredTransactions, filteredShifts, credits, creditCards);
  }, [filteredTransactions, filteredShifts, credits, creditCards]);

  const creditCardAnalysis = useMemo(() => {
    const refDate = parseLocalDate(filter.referenceDate || getLocalDateString());
    return analyzeCreditCards(creditCards, refDate);
  }, [creditCards, filter.referenceDate]);

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
  const allCreditsRef = React.useRef(allCredits);
  const allCreditCardsRef = React.useRef(allCreditCards);
  const settingsRef = React.useRef(financialSettings);
  React.useEffect(() => { allCreditsRef.current = allCredits; }, [allCredits]);
  React.useEffect(() => { allCreditCardsRef.current = allCreditCards; }, [allCreditCards]);
  React.useEffect(() => { settingsRef.current = financialSettings; }, [financialSettings]);

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
      const result = await syncWithSupabase(
        allShiftsRef.current,
        allTransactionsRef.current,
        usersRef.current,
        allCreditsRef.current,
        allCreditCardsRef.current,
        settingsRef.current,
        activeUser.id
      );
      if (result.success) {
        if (Date.now() - lastLocalChangeRef.current >= SYNC_GRACE_PERIOD_MS) {
          setAllShifts(result.shifts);
          saveStoredShifts(result.shifts);
          setAllTransactions(result.transactions);
          saveStoredTransactions(result.transactions);
          if (result.credits) {
            setAllCredits(result.credits);
            saveStoredCredits(result.credits);
          }
          if (result.creditCards) {
            setAllCreditCards(result.creditCards);
            saveStoredCreditCards(result.creditCards);
          }
          if (result.financialSettings) {
            setFinancialSettingsState(result.financialSettings);
            saveStoredFinancialSettings(result.financialSettings, activeUser.id);
          }
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

  // Sincronización instantánea entre pestañas abiertas en el mismo navegador (0ms)
  useEffect(() => {
    if (typeof window === 'undefined' || !('BroadcastChannel' in window)) return;
    const channel = new BroadcastChannel('riderledger_sync_channel');
    channel.onmessage = (event) => {
      const { type, payload } = event.data || {};
      if (type === 'TRANSACTIONS_CHANGED' && Array.isArray(payload)) {
        setAllTransactions(payload);
      } else if (type === 'SHIFTS_CHANGED' && Array.isArray(payload)) {
        setAllShifts(payload);
      } else if (type === 'CREDITS_CHANGED' && Array.isArray(payload)) {
        setAllCredits(payload);
      } else if (type === 'CREDIT_CARDS_CHANGED' && Array.isArray(payload)) {
        setAllCreditCards(payload);
      } else if (type === 'SETTINGS_CHANGED' && payload) {
        setFinancialSettingsState(payload);
      }
    };
    return () => {
      channel.close();
    };
  }, []);

  // Supabase Realtime: Recibir cambios de otros dispositivos al instante por WebSockets
  useEffect(() => {
    const client = getSupabaseClient();
    if (!client) return;

    const channelName = 'riderledger_realtime_global';
    const channel = client
      .channel(channelName)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, (payload) => {
        if ((payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') && payload.new) {
          const newRow = normalizeRealtimeTransaction(payload.new);
          if (newRow.deleted_at) {
            setAllTransactions(prev => {
              const updated = prev.filter(t => t.id !== newRow.id);
              saveStoredTransactions(updated);
              broadcastSyncEvent('TRANSACTIONS_CHANGED', updated);
              return updated;
            });
            return;
          }
          setAllTransactions(prev => {
            const exists = prev.some(t => t.id === newRow.id);
            const updated = exists
              ? prev.map(t => t.id === newRow.id ? newRow : t)
              : [newRow, ...prev];
            saveStoredTransactions(updated);
            broadcastSyncEvent('TRANSACTIONS_CHANGED', updated);
            return updated;
          });
        } else if (payload.eventType === 'DELETE') {
          const deletedId = (payload.old as any)?.id || (payload.new as any)?.id;
          if (deletedId) {
            setAllTransactions(prev => {
              const updated = prev.filter(t => t.id !== deletedId);
              saveStoredTransactions(updated);
              broadcastSyncEvent('TRANSACTIONS_CHANGED', updated);
              return updated;
            });
          }
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shifts' }, (payload) => {
        if ((payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') && payload.new) {
          const newRow = normalizeRealtimeShift(payload.new);
          if (newRow.deleted_at) {
            setAllShifts(prev => {
              const updated = prev.filter(s => s.id !== newRow.id);
              saveStoredShifts(updated);
              broadcastSyncEvent('SHIFTS_CHANGED', updated);
              return updated;
            });
            return;
          }
          setAllShifts(prev => {
            const exists = prev.some(s => s.id === newRow.id);
            const updated = exists
              ? prev.map(s => s.id === newRow.id ? newRow : s)
              : [newRow, ...prev];
            saveStoredShifts(updated);
            broadcastSyncEvent('SHIFTS_CHANGED', updated);
            return updated;
          });
        } else if (payload.eventType === 'DELETE') {
          const deletedId = (payload.old as any)?.id || (payload.new as any)?.id;
          if (deletedId) {
            setAllShifts(prev => {
              const updated = prev.filter(s => s.id !== deletedId);
              saveStoredShifts(updated);
              broadcastSyncEvent('SHIFTS_CHANGED', updated);
              return updated;
            });
          }
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'credits' }, (payload) => {
        if ((payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') && payload.new) {
          const newCredit = mapRemoteToCredit(payload.new);
          if (newCredit.deleted_at) {
            setAllCredits(prev => {
              const updated = prev.filter(c => c.id !== newCredit.id);
              saveStoredCredits(updated);
              broadcastSyncEvent('CREDITS_CHANGED', updated);
              return updated;
            });
            return;
          }
          setAllCredits(prev => {
            const exists = prev.some(c => c.id === newCredit.id);
            const updated = exists
              ? prev.map(c => c.id === newCredit.id ? newCredit : c)
              : [...prev, newCredit];
            saveStoredCredits(updated);
            broadcastSyncEvent('CREDITS_CHANGED', updated);
            return updated;
          });
        } else if (payload.eventType === 'DELETE') {
          const deletedId = (payload.old as any)?.id || (payload.new as any)?.id;
          if (deletedId) {
            setAllCredits(prev => {
              const updated = prev.filter(c => c.id !== deletedId);
              saveStoredCredits(updated);
              broadcastSyncEvent('CREDITS_CHANGED', updated);
              return updated;
            });
          }
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'credit_cards' }, (payload) => {
        if ((payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') && payload.new) {
          const newCard = mapRemoteToCard(payload.new);
          if (newCard.deleted_at) {
            setAllCreditCards(prev => {
              const updated = prev.filter(c => c.id !== newCard.id);
              saveStoredCreditCards(updated);
              broadcastSyncEvent('CREDIT_CARDS_CHANGED', updated);
              return updated;
            });
            return;
          }
          setAllCreditCards(prev => {
            const exists = prev.some(c => c.id === newCard.id);
            const updated = exists
              ? prev.map(c => c.id === newCard.id ? newCard : c)
              : [...prev, newCard];
            saveStoredCreditCards(updated);
            broadcastSyncEvent('CREDIT_CARDS_CHANGED', updated);
            return updated;
          });
        } else if (payload.eventType === 'DELETE') {
          const deletedId = (payload.old as any)?.id || (payload.new as any)?.id;
          if (deletedId) {
            setAllCreditCards(prev => {
              const updated = prev.filter(c => c.id !== deletedId);
              saveStoredCreditCards(updated);
              broadcastSyncEvent('CREDIT_CARDS_CHANGED', updated);
              return updated;
            });
          }
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'financial_settings' }, (payload) => {
        if (payload.new && (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE')) {
          const newSettings = mapRemoteToSettings(payload.new);
          if (newSettings.userId === activeUser.id) {
            setFinancialSettingsState(newSettings);
            saveStoredFinancialSettings(newSettings, activeUser.id);
            broadcastSyncEvent('SETTINGS_CHANGED', newSettings);
          }
        }
      })
      .subscribe((status, err) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.warn(`Supabase Realtime status (${status}):`, err);
          setTimeout(() => {
            if (navigator.onLine && getSupabaseClient()) {
              syncData();
            }
          }, 3000);
        }
      });

    return () => {
      client.removeChannel(channel);
    };
  }, [supabaseConfig.url, supabaseConfig.anonKey, activeUser.id, syncData]);

  useEffect(() => {
    const handleSyncTrigger = () => {
      if (navigator.onLine && getSupabaseClient()) {
        syncData();
      }
    };

    window.addEventListener('online', handleSyncTrigger);
    window.addEventListener('focus', handleSyncTrigger);

    // Polling rápido cada 5 segundos como respaldo secundario
    const timer = setInterval(handleSyncTrigger, 5000);

    return () => {
      window.removeEventListener('online', handleSyncTrigger);
      window.removeEventListener('focus', handleSyncTrigger);
      clearInterval(timer);
    };
  }, [syncData]);

  // Helper: enviar inmediatamente a Supabase en background (fire-and-forget)
  const pushToSupabaseNow = useCallback((
    entity: 'shifts' | 'transactions' | 'credits' | 'credit_cards' | 'financial_settings',
    action: 'upsert' | 'delete',
    payload: any,
    id?: string
  ) => {
    const client = getSupabaseClient();
    if (!client || !navigator.onLine) return;

    if (action === 'upsert') {
      const { sync_status, ...clean } = payload;
      let targetPayload = clean;
      if (entity === 'credits') targetPayload = mapCreditToRemote(clean);
      else if (entity === 'credit_cards') targetPayload = mapCardToRemote(clean);
      else if (entity === 'financial_settings') targetPayload = mapSettingsToRemote(clean, clean.userId || activeUser.id);

      client.from(entity).upsert(targetPayload).then(({ error }) => {
        if (error) {
          if (error.code === '23503' || error.message?.includes('foreign key constraint') || error.message?.includes('fkey')) {
            if (entity === 'transactions') {
              const { shift_id, ...fallback } = clean;
              client.from(entity).upsert({ ...fallback, shift_id: null }).then();
            }
          } else {
            console.warn(`Push ${entity} failed:`, error.message);
          }
        }
      });
    } else if (action === 'delete' && id) {
      client.from(entity).update({ deleted_at: new Date().toISOString() }).eq('id', id).then(({ error }) => {
        if (error) {
          client.from(entity).delete().eq('id', id).then();
        }
      });
    }
  }, [activeUser.id]);

  // Turnos CRUD
  const addShift = async (newShiftData: Omit<Shift, 'id' | 'userId'> & { id?: string }): Promise<Shift> => {
    const id = newShiftData.id || crypto.randomUUID();
    const created_at = new Date().toISOString();
    const isClientOnline = navigator.onLine && Boolean(getSupabaseClient());

    const newShift: Shift = {
      ...newShiftData,
      tiempo_reparto_minutos: Number(newShiftData.tiempo_reparto_minutos) || 0,
      tiempo_espera_minutos: Number(newShiftData.tiempo_espera_minutos) || 0,
      kilometros: Number(newShiftData.kilometros) || 0,
      id,
      userId: activeUser.id,
      created_at,
      sync_status: isClientOnline ? 'synced' : 'pending'
    };

    lastLocalChangeRef.current = Date.now();
    setAllShifts(prev => {
      const filtered = prev.filter(s => s.id !== newShift.id);
      const updated = [newShift, ...filtered];
      saveStoredShifts(updated);
      broadcastSyncEvent('SHIFTS_CHANGED', updated);
      return updated;
    });

    addToSyncQueue({ id, entity: 'shifts', action: 'insert', payload: newShift });
    pushToSupabaseNow('shifts', 'upsert', newShift);
    refreshPendingCount();
    return newShift;
  };

  const updateShift = async (updatedShift: Shift): Promise<void> => {
    lastLocalChangeRef.current = Date.now();
    const cleanShift: Shift = {
      ...updatedShift,
      tiempo_reparto_minutos: Number(updatedShift.tiempo_reparto_minutos) || 0,
      tiempo_espera_minutos: Number(updatedShift.tiempo_espera_minutos) || 0,
      kilometros: Number(updatedShift.kilometros) || 0,
      updated_at: new Date().toISOString()
    };
    setAllShifts(prev => {
      const updated = prev.map(s => (s.id === cleanShift.id ? cleanShift : s));
      saveStoredShifts(updated);
      broadcastSyncEvent('SHIFTS_CHANGED', updated);
      return updated;
    });
    addToSyncQueue({ id: cleanShift.id, entity: 'shifts', action: 'insert', payload: cleanShift });
    pushToSupabaseNow('shifts', 'upsert', cleanShift);
    refreshPendingCount();
  };

  const deleteShift = async (id: string): Promise<void> => {
    lastLocalChangeRef.current = Date.now();
    setAllShifts(prev => {
      const updated = prev.filter(s => s.id !== id);
      saveStoredShifts(updated);
      broadcastSyncEvent('SHIFTS_CHANGED', updated);
      return updated;
    });
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
      monto: Number(txData.monto) || 0,
      id,
      userId: activeUser.id,
      created_at,
      sync_status: isClientOnline ? 'synced' : 'pending'
    };

    lastLocalChangeRef.current = Date.now();
    setAllTransactions(prev => {
      const filtered = prev.filter(t => t.id !== newTx.id);
      const updated = [newTx, ...filtered];
      saveStoredTransactions(updated);
      broadcastSyncEvent('TRANSACTIONS_CHANGED', updated);
      return updated;
    });

    addToSyncQueue({ id, entity: 'transactions', action: 'insert', payload: newTx });
    pushToSupabaseNow('transactions', 'upsert', newTx);
    refreshPendingCount();
    return newTx;
  };

  const updateTransaction = async (updatedTx: Transaction): Promise<void> => {
    lastLocalChangeRef.current = Date.now();
    const cleanTx: Transaction = {
      ...updatedTx,
      monto: Number(updatedTx.monto) || 0,
      updated_at: new Date().toISOString()
    };
    setAllTransactions(prev => {
      const updated = prev.map(t => (t.id === cleanTx.id ? cleanTx : t));
      saveStoredTransactions(updated);
      broadcastSyncEvent('TRANSACTIONS_CHANGED', updated);
      return updated;
    });
    addToSyncQueue({ id: cleanTx.id, entity: 'transactions', action: 'update', payload: cleanTx });
    pushToSupabaseNow('transactions', 'upsert', cleanTx);
    refreshPendingCount();
  };

  const deleteTransaction = async (id: string): Promise<void> => {
    lastLocalChangeRef.current = Date.now();
    setAllTransactions(prev => {
      const updated = prev.filter(t => t.id !== id);
      saveStoredTransactions(updated);
      broadcastSyncEvent('TRANSACTIONS_CHANGED', updated);
      return updated;
    });
    addToSyncQueue({ id, entity: 'transactions', action: 'delete', payload: { id } });
    pushToSupabaseNow('transactions', 'delete', null, id);
    refreshPendingCount();
  };

  // Créditos CRUD con soporte para SyncQueue y UUID
  const addCredit = (creditData: Omit<CreditInstallment, 'id' | 'userId'>) => {
    const nowIso = new Date().toISOString();
    const newCredit: CreditInstallment = {
      ...creditData,
      id: crypto.randomUUID(),
      userId: activeUser.id,
      created_at: nowIso,
      updated_at: nowIso,
      sync_status: navigator.onLine ? 'synced' : 'pending'
    };
    const updated = [...allCredits, newCredit];
    setAllCredits(updated);
    saveStoredCredits(updated);
    addToSyncQueue({ id: newCredit.id, entity: 'credits', action: 'insert', payload: newCredit });
    pushToSupabaseNow('credits', 'upsert', newCredit);
    refreshPendingCount();
  };

  const updateCredit = (updatedCredit: CreditInstallment) => {
    const withTimestamp: CreditInstallment = {
      ...updatedCredit,
      updated_at: new Date().toISOString(),
      sync_status: navigator.onLine ? 'synced' : 'pending'
    };
    const updated = allCredits.map(c => (c.id === withTimestamp.id ? withTimestamp : c));
    setAllCredits(updated);
    saveStoredCredits(updated);
    addToSyncQueue({ id: withTimestamp.id, entity: 'credits', action: 'update', payload: withTimestamp });
    pushToSupabaseNow('credits', 'upsert', withTimestamp);
    refreshPendingCount();
  };

  const deleteCredit = (id: string) => {
    const nowIso = new Date().toISOString();
    const updated = allCredits.map(c => c.id === id ? { ...c, deleted_at: nowIso } : c);
    setAllCredits(updated);
    saveStoredCredits(updated);
    addToSyncQueue({ id, entity: 'credits', action: 'delete', payload: { id, deleted_at: nowIso } });
    pushToSupabaseNow('credits', 'delete', null, id);
    refreshPendingCount();
  };

  const toggleCreditPaid = (id: string) => {
    const now = new Date();
    const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const nowIso = now.toISOString();
    let changedItem: CreditInstallment | null = null;
    const updated = allCredits.map(c => {
      if (c.id === id) {
        const nextState = !c.pagadoEsteMes;
        changedItem = {
          ...c,
          pagadoEsteMes: nextState,
          ultimoMesPagado: nextState ? currentMonthStr : undefined,
          updated_at: nowIso,
          sync_status: navigator.onLine ? 'synced' : 'pending'
        };
        return changedItem;
      }
      return c;
    });
    setAllCredits(updated);
    saveStoredCredits(updated);
    if (changedItem) {
      addToSyncQueue({ id, entity: 'credits', action: 'update', payload: changedItem });
      pushToSupabaseNow('credits', 'upsert', changedItem);
      refreshPendingCount();
    }
  };

  const requestNotificationPermission = async (): Promise<boolean> => {
    if (!('Notification' in window)) return false;
    const perm = await Notification.requestPermission();
    if (perm === 'granted') {
      new Notification('🔔 Notificaciones Activadas', {
        body: 'Te avisaremos oportunamente sobre tus cuotas y fechas de corte.',
        icon: './favicon.svg'
      });
      return true;
    }
    return false;
  };

  // Handlers para Tarjetas de Crédito y Cuentas Revolventes (UUID garantizado)
  const addCreditCard = useCallback((card: Omit<CreditCardAccount, 'id' | 'userId'>) => {
    const nowIso = new Date().toISOString();
    const newCard: CreditCardAccount = {
      ...card,
      id: crypto.randomUUID(),
      userId: activeUser.id,
      created_at: nowIso,
      updated_at: nowIso,
      sync_status: navigator.onLine ? 'synced' : 'pending'
    };
    const updated = [...allCreditCards, newCard];
    setAllCreditCards(updated);
    saveStoredCreditCards(updated);
    addToSyncQueue({ id: newCard.id, entity: 'credit_cards', action: 'insert', payload: newCard });
    pushToSupabaseNow('credit_cards', 'upsert', newCard);
    refreshPendingCount();
  }, [allCreditCards, activeUser.id, pushToSupabaseNow, refreshPendingCount]);

  const updateCreditCard = useCallback((card: CreditCardAccount) => {
    const nowIso = new Date().toISOString();
    const withTimestamp: CreditCardAccount = {
      ...card,
      updated_at: nowIso,
      sync_status: navigator.onLine ? 'synced' : 'pending'
    };
    const updated = allCreditCards.map(c => c.id === withTimestamp.id ? withTimestamp : c);
    setAllCreditCards(updated);
    saveStoredCreditCards(updated);
    addToSyncQueue({ id: withTimestamp.id, entity: 'credit_cards', action: 'update', payload: withTimestamp });
    pushToSupabaseNow('credit_cards', 'upsert', withTimestamp);
    refreshPendingCount();
  }, [allCreditCards, pushToSupabaseNow, refreshPendingCount]);

  const deleteCreditCard = useCallback((id: string) => {
    const nowIso = new Date().toISOString();
    const updated = allCreditCards.map(c => c.id === id ? { ...c, deleted_at: nowIso } : c);
    setAllCreditCards(updated);
    saveStoredCreditCards(updated);
    addToSyncQueue({ id, entity: 'credit_cards', action: 'delete', payload: { id, deleted_at: nowIso } });
    pushToSupabaseNow('credit_cards', 'delete', null, id);
    refreshPendingCount();
  }, [allCreditCards, pushToSupabaseNow, refreshPendingCount]);

  // Handlers para Metas y Referencias Financieras aisladas por usuario
  const updateFinancialSettings = useCallback((newSettings: Partial<FinancialSettings>) => {
    setFinancialSettingsState(prev => {
      const updated = { ...prev, ...newSettings, userId: activeUser.id, updated_at: new Date().toISOString() };
      saveStoredFinancialSettings(updated, activeUser.id);
      addToSyncQueue({ id: activeUser.id, entity: 'financial_settings', action: 'update', payload: updated });
      pushToSupabaseNow('financial_settings', 'upsert', updated, activeUser.id);
      refreshPendingCount();
      return updated;
    });
  }, [activeUser.id, pushToSupabaseNow, refreshPendingCount]);

  const setFilterRange = useCallback((range: TimeRange, customStart?: string, customEnd?: string, referenceDate?: string) => {
    setFilter(prev => {
      const refDate = referenceDate || prev.referenceDate || getLocalDateString();
      const newFilter: DateFilter = { range, referenceDate: refDate, startDate: customStart, endDate: customEnd };
      try {
        localStorage.setItem('riderledger_filter_v3', JSON.stringify(newFilter));
      } catch {}
      return newFilter;
    });
  }, []);

  const navigateFilter = useCallback((direction: -1 | 1) => {
    setFilter(prev => {
      const next = navigatePeriod(prev, direction);
      try {
        localStorage.setItem('riderledger_filter_v3', JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  const resetFilterToToday = useCallback(() => {
    setFilter(prev => {
      const next: DateFilter = {
        ...prev,
        referenceDate: getLocalDateString()
      };
      try {
        localStorage.setItem('riderledger_filter_v3', JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

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
        navigateFilter,
        resetFilterToToday,
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
