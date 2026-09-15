import {
  Shift,
  Transaction,
  SyncQueueItem,
  SupabaseConfig,
  CreditInstallment,
  CreditCardAccount,
  FinancialSettings,
  ThemeMode,
  UserProfile,
  UserApp
} from '../types';
import { getLocalDateString, DEFAULT_FINANCIAL_SETTINGS } from './calculations';

const STORAGE_KEYS = {
  SHIFTS: 'riderledger_shifts_v2',
  TRANSACTIONS: 'riderledger_transactions_v2',
  SYNC_QUEUE: 'riderledger_sync_queue_v2',
  CONFIG: 'riderledger_supabase_config_v2',
  LAST_SYNC: 'riderledger_last_sync_v2',
  CREDITS: 'riderledger_credits_v2',
  CREDIT_CARDS: 'riderledger_credit_cards_v2',
  FINANCIAL_SETTINGS: 'riderledger_financial_settings_v2',
  THEME: 'riderledger_theme_v2',
  USERS: 'riderledger_users_v2',
  ACTIVE_USER: 'riderledger_active_user_v2',
  USER_APPS: 'riderledger_user_apps_v2'
};

// ==========================================
// USUARIOS Y PERFILES FAMILIARES
// ==========================================
const DEFAULT_USERS: UserProfile[] = [
  {
    id: 'user-alejo',
    nombre: 'Alejo (Repartidor)',
    email: 'alejo@familia.com',
    rol: 'Repartidor Principal',
    avatarColor: '#0ea5e9',
    createdAt: new Date().toISOString()
  },
  {
    id: 'user-jhony',
    nombre: 'Jhony (Familiar)',
    email: 'jhony@familia.com',
    rol: 'Mensajero Urbano',
    avatarColor: '#10b981',
    createdAt: new Date().toISOString()
  }
];

export function getStoredUsers(): UserProfile[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.USERS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Error loading users from localStorage', e);
  }
  saveStoredUsers(DEFAULT_USERS);
  return DEFAULT_USERS;
}

export function saveStoredUsers(users: UserProfile[]): void {
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
}

export function getActiveUser(): UserProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ACTIVE_USER);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Error loading active user', e);
  }
  const users = getStoredUsers();
  const def = users[0] || DEFAULT_USERS[0];
  saveActiveUser(def);
  return def;
}

export function saveActiveUser(user: UserProfile): void {
  localStorage.setItem(STORAGE_KEYS.ACTIVE_USER, JSON.stringify(user));
}

// ==========================================
// APLICACIONES CONFIGURABLES POR USUARIO
// ==========================================
// Armi usa Azul (Farmatodo eliminado)
export function getDefaultAppsForUser(userId: string): UserApp[] {
  return [
    // Domicilios
    { id: `${userId}-app-rappi`, userId, nombre: 'Rappi', tipo: 'DOMICILIOS', color: '#f97316', icono: '🟠', activa: true },
    { id: `${userId}-app-didi`, userId, nombre: 'Didi Food', tipo: 'DOMICILIOS', color: '#eab308', icono: '🟡', activa: true },
    { id: `${userId}-app-mensajeros`, userId, nombre: 'Mensajeros Urbanos', tipo: 'DOMICILIOS', color: '#ef4444', icono: '🔴', activa: true },
    { id: `${userId}-app-armi`, userId, nombre: 'Armi', tipo: 'DOMICILIOS', color: '#0284c7', icono: '🔵', activa: true }, // Armi en azul
    
    // Pasajeros
    { id: `${userId}-app-yango`, userId, nombre: 'Yango Pro', tipo: 'PASAJEROS', color: '#f43f5e', icono: '🔴', activa: true },
    { id: `${userId}-app-indrive`, userId, nombre: 'InDrive Moto', tipo: 'PASAJEROS', color: '#10b981', icono: '🟢', activa: true },
    { id: `${userId}-app-uber`, userId, nombre: 'Uber Pasajeros', tipo: 'PASAJEROS', color: '#06b6d4', icono: '⚫', activa: true },
    { id: `${userId}-app-particular`, userId, nombre: 'Particular', tipo: 'PASAJEROS', color: '#8b5cf6', icono: '🟣', activa: true },
  ];
}

export function getStoredUserApps(userId: string): UserApp[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.USER_APPS);
    if (raw) {
      const all: UserApp[] = JSON.parse(raw);
      const userList = all.filter(a => a.userId === userId);
      if (userList.length > 0) return userList;
    }
  } catch (e) {
    console.error('Error loading user apps from localStorage', e);
  }

  const defaults = getDefaultAppsForUser(userId);
  saveStoredUserApps([...getAllStoredApps().filter(a => a.userId !== userId), ...defaults]);
  return defaults;
}

function getAllStoredApps(): UserApp[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.USER_APPS);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

export function saveStoredUserApps(apps: UserApp[]): void {
  localStorage.setItem(STORAGE_KEYS.USER_APPS, JSON.stringify(apps));
}

// ==========================================
// TEMA CLARO / OSCURO
// ==========================================
export function getStoredTheme(): ThemeMode {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.THEME);
    if (raw === 'light' || raw === 'dark') return raw;
  } catch (e) {
    console.error('Error reading theme', e);
  }
  return 'dark';
}

export function saveStoredTheme(theme: ThemeMode): void {
  localStorage.setItem(STORAGE_KEYS.THEME, theme);
  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
    root.classList.remove('light');
  } else {
    root.classList.remove('dark');
    root.classList.add('light');
  }
}

// ==========================================
// CRÉDITOS Y CUOTAS
// ==========================================
export function getAllStoredCredits(): CreditInstallment[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CREDITS);
    if (raw) {
      const parsed: CreditInstallment[] = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Error loading all credits from localStorage', e);
  }
  return [];
}

export function getStoredCredits(userId?: string): CreditInstallment[] {
  try {
    const all = getAllStoredCredits();
    if (all.length > 0) {
      return all.filter(c => !c.deleted_at && (!userId || !c.userId || c.userId === userId));
    }
  } catch (e) {
    console.error('Error loading credits from localStorage', e);
  }

  const uId = userId || 'user-alejo';
  const defaults: CreditInstallment[] = [
    {
      id: crypto.randomUUID(),
      userId: uId,
      nombre: 'Cuota Moto',
      montoCuota: 240000,
      diaPago: 30,
      descripcion: 'Pago quincena fin de mes (Día 30)',
      pagadoEsteMes: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: crypto.randomUUID(),
      userId: uId,
      nombre: 'Crédito Celular',
      montoCuota: 160000,
      diaPago: 10,
      descripcion: 'Pago corte primer tercio (Día 10)',
      pagadoEsteMes: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];
  saveStoredCredits(defaults);
  return defaults;
}

export function saveStoredCredits(credits: CreditInstallment[]): void {
  localStorage.setItem(STORAGE_KEYS.CREDITS, JSON.stringify(credits));
}

// ==========================================
// TARJETAS DE CRÉDITO Y CUENTAS REVOLVENTES
// ==========================================
export function getAllStoredCreditCards(): CreditCardAccount[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CREDIT_CARDS);
    if (raw) {
      const parsed: CreditCardAccount[] = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        // Migración automática de IDs legados 'cc-timestamp' a UUID estándar
        let changed = false;
        const normalized = parsed.map(c => {
          if (c.id && c.id.startsWith('cc-')) {
            changed = true;
            return { ...c, id: crypto.randomUUID() };
          }
          return c;
        });
        if (changed) {
          saveStoredCreditCards(normalized);
        }
        return normalized;
      }
    }
  } catch (e) {
    console.error('Error loading credit cards from storage', e);
  }
  return [];
}

export function getStoredCreditCards(userId?: string): CreditCardAccount[] {
  const all = getAllStoredCreditCards();
  return all.filter(c => !c.deleted_at && (!userId || !c.userId || c.userId === userId));
}

export function saveStoredCreditCards(cards: CreditCardAccount[]): void {
  localStorage.setItem(STORAGE_KEYS.CREDIT_CARDS, JSON.stringify(cards));
}

// ==========================================
// METAS Y REFERENCIAS FINANCIERAS
// ==========================================
export function getStoredFinancialSettings(userId?: string): FinancialSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.FINANCIAL_SETTINGS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (userId && parsed[userId]) {
        return { ...DEFAULT_FINANCIAL_SETTINGS, userId, ...parsed[userId] };
      } else if (parsed.metaIngresoMinimoMensual !== undefined) {
        return { ...DEFAULT_FINANCIAL_SETTINGS, ...parsed };
      }
    }
  } catch (e) {
    console.error('Error loading financial settings from storage', e);
  }
  return { ...DEFAULT_FINANCIAL_SETTINGS, userId };
}

export function saveStoredFinancialSettings(settings: FinancialSettings, userId?: string): void {
  try {
    const targetUserId = userId || settings.userId;
    let storedMap: Record<string, any> = {};
    const raw = localStorage.getItem(STORAGE_KEYS.FINANCIAL_SETTINGS);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') storedMap = parsed;
      } catch {}
    }

    if (targetUserId) {
      storedMap[targetUserId] = { ...settings, userId: targetUserId, updated_at: new Date().toISOString() };
      localStorage.setItem(STORAGE_KEYS.FINANCIAL_SETTINGS, JSON.stringify(storedMap));
    } else {
      localStorage.setItem(STORAGE_KEYS.FINANCIAL_SETTINGS, JSON.stringify({
        ...settings,
        updated_at: new Date().toISOString()
      }));
    }
  } catch (e) {
    console.error('Error saving financial settings', e);
  }
}


// ==========================================
// SUPABASE & CONFIG
// ==========================================
const DEFAULT_SUPABASE_CONFIG: SupabaseConfig = {
  url: (import.meta.env.VITE_SUPABASE_URL as string) || 'https://kfvhooedmfohkgdmckkt.supabase.co',
  anonKey: (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || 'sb_publishable_GIDDTTFcH44rDkjEacEg7A_jabdMpV0'
};

export function getStoredSupabaseConfig(): SupabaseConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CONFIG);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.url && parsed.anonKey) return parsed;
    }
  } catch (e) {
    console.error('Error reading supabase config', e);
  }

  return DEFAULT_SUPABASE_CONFIG;
}

export function saveStoredSupabaseConfig(config: SupabaseConfig): void {
  localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(config));
}

// ==========================================
// TURNOS Y TRANSACCIONES
// ==========================================
export function getAllStoredShifts(): Shift[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SHIFTS);
    if (raw) {
      const parsed: Shift[] = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Error loading all shifts', e);
  }
  return [];
}

export function getStoredShifts(userId?: string): Shift[] {
  const all = getAllStoredShifts();
  return all.filter(s => !s.deleted_at && (!userId || !s.userId || s.userId === userId));
}

export function saveStoredShifts(shifts: Shift[]): void {
  localStorage.setItem(STORAGE_KEYS.SHIFTS, JSON.stringify(shifts));
}

export function getAllStoredTransactions(): Transaction[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    if (raw) {
      const parsed: Transaction[] = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Error loading all transactions', e);
  }
  return [];
}

export function getStoredTransactions(userId?: string): Transaction[] {
  const all = getAllStoredTransactions();
  return all.filter(t => !t.deleted_at && (!userId || !t.userId || t.userId === userId));
}

export function saveStoredTransactions(transactions: Transaction[]): void {
  localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
}

export function getStoredSyncQueue(): SyncQueueItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SYNC_QUEUE);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading sync queue', e);
  }
  return [];
}

export function saveStoredSyncQueue(queue: SyncQueueItem[]): void {
  localStorage.setItem(STORAGE_KEYS.SYNC_QUEUE, JSON.stringify(queue));
}

export function addToSyncQueue(item: Omit<SyncQueueItem, 'timestamp'>): void {
  const queue = getStoredSyncQueue();
  const filtered = queue.filter(q => !(q.id === item.id && q.entity === item.entity));
  filtered.push({ ...item, timestamp: Date.now() });
  saveStoredSyncQueue(filtered);
}

export function removeFromSyncQueue(id: string, entity: 'shifts' | 'transactions' | 'credits' | 'credit_cards' | 'financial_settings' | 'apps'): void {
  const queue = getStoredSyncQueue();
  const filtered = queue.filter(q => !(q.id === id && q.entity === entity));
  saveStoredSyncQueue(filtered);
}

export function getStoredLastSync(): string | null {
  return localStorage.getItem(STORAGE_KEYS.LAST_SYNC);
}

export function saveStoredLastSync(timestamp: string): void {
  localStorage.setItem(STORAGE_KEYS.LAST_SYNC, timestamp);
}

/**
 * Datos de demo limpios (sin Farmatodo, Armi en azul, Bre-B, sin notas ruidosas)
 */
export function generateDemoData(userId: string = 'user-carlos'): { shifts: Shift[]; transactions: Transaction[] } {
  const today = new Date();
  const shifts: Shift[] = [];
  const transactions: Transaction[] = [];

  // Armi en azul, Farmatodo eliminado
  const apps = ['Rappi', 'Didi Food', 'Mensajeros Urbanos', 'Armi'];

  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const fecha = getLocalDateString(d);
    const shiftId = `${userId}-demo-shift-${i + 1}`;

    const deliveryMin = 240 + Math.floor(Math.random() * 90);
    const waitMin = 60 + Math.floor(Math.random() * 45);
    const km = +(38 + Math.random() * 32).toFixed(1);

    shifts.push({
      id: shiftId,
      userId,
      fecha,
      tiempo_reparto_minutos: deliveryMin,
      tiempo_espera_minutos: waitMin,
      kilometros: km,
      created_at: new Date(d.setHours(12, 0, 0)).toISOString(),
      sync_status: 'synced'
    });

    // Pedidos de App
    const numOrders = 4 + Math.floor(Math.random() * 3);
    for (let j = 0; j < numOrders; j++) {
      const app = apps[(i + j) % apps.length];
      const tarifa = 14000 + Math.floor(Math.random() * 18000);
      const propina = Math.random() > 0.4 ? 3000 + Math.floor(Math.random() * 4000) : 0;
      const isCash = Math.random() > 0.65;

      transactions.push({
        id: `${userId}-demo-tx-order-${i}-${j}`,
        userId,
        fecha,
        tipo: 'INGRESO',
        categoria: 'DOMICILIOS',
        subcategoria: app,
        descripcion: `Entrega ${app}`,
        monto: tarifa + propina,
        medio_pago: 'APP',
        shift_id: shiftId,
        created_at: new Date(d.setHours(13 + j, 15, 0)).toISOString(),
        sync_status: 'synced'
      });

      if (isCash) {
        const cashCollected = 35000 + Math.floor(Math.random() * 40000);
        transactions.push({
          id: `${userId}-demo-tx-cash-${i}-${j}`,
          userId,
          fecha,
          tipo: 'COBRO_EFECTIVO_APP',
          categoria: 'DOMICILIOS',
          subcategoria: app,
          descripcion: `Cobro efectivo pedido ${app}`,
          monto: cashCollected,
          medio_pago: 'EFECTIVO',
          shift_id: shiftId,
          created_at: new Date(d.setHours(13 + j, 20, 0)).toISOString(),
          sync_status: 'synced'
        });
      }
    }

    // Pasajeros (Yango Pro / InDrive)
    if (i % 2 === 0) {
      transactions.push({
        id: `${userId}-demo-tx-passenger-${i}`,
        userId,
        fecha,
        tipo: 'INGRESO',
        categoria: 'PASAJEROS',
        subcategoria: 'Yango Pro',
        descripcion: 'Viaje Yango Pro',
        monto: 18000,
        medio_pago: 'EFECTIVO',
        shift_id: shiftId,
        created_at: new Date(d.setHours(18, 0, 0)).toISOString(),
        sync_status: 'synced'
      });
    }

    // Gastos diarios
    transactions.push({
      id: `${userId}-demo-tx-gas-${i}`,
      userId,
      fecha,
      tipo: 'GASTO',
      categoria: 'COMBUSTIBLE',
      subcategoria: 'Gasolina',
      descripcion: 'Tanqueada Terpel',
      monto: 18000,
      medio_pago: 'EFECTIVO',
      shift_id: shiftId,
      created_at: new Date(d.setHours(11, 30, 0)).toISOString(),
      sync_status: 'synced'
    });

    transactions.push({
      id: `${userId}-demo-tx-food-${i}`,
      userId,
      fecha,
      tipo: 'GASTO',
      categoria: 'ALIMENTACION',
      subcategoria: 'Almuerzo / Comida',
      descripcion: 'Almuerzo del día',
      monto: 14000,
      medio_pago: 'BRE_B', // Bre-B en lugar de transferencia genérica
      shift_id: shiftId,
      created_at: new Date(d.setHours(14, 0, 0)).toISOString(),
      sync_status: 'synced'
    });
  }

  return { shifts, transactions };
}
