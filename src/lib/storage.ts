import { Shift, Transaction, SyncQueueItem, SupabaseConfig, CreditInstallment, ThemeMode } from '../types';
import { getLocalDateString } from './calculations';

const STORAGE_KEYS = {
  SHIFTS: 'riderledger_shifts_v1',
  TRANSACTIONS: 'riderledger_transactions_v1',
  SYNC_QUEUE: 'riderledger_sync_queue_v1',
  CONFIG: 'riderledger_supabase_config_v1',
  LAST_SYNC: 'riderledger_last_sync_v1',
  CREDITS: 'riderledger_credits_v1',
  THEME: 'riderledger_theme_v1'
};

export function getStoredTheme(): ThemeMode {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.THEME);
    if (raw === 'light' || raw === 'dark') return raw;
  } catch (e) {
    console.error('Error reading theme from localStorage', e);
  }
  return 'dark';
}

export function saveStoredTheme(theme: ThemeMode): void {
  localStorage.setItem(STORAGE_KEYS.THEME, theme);
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
    document.documentElement.classList.remove('light');
  } else {
    document.documentElement.classList.remove('dark');
    document.documentElement.classList.add('light');
  }
}

export function getStoredCredits(): CreditInstallment[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CREDITS);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Error loading credits from localStorage', e);
  }

  // Cuotas por defecto para los días 10 y 30
  const defaults: CreditInstallment[] = [
    {
      id: 'cred-1',
      nombre: 'Cuota Moto (Financiamiento)',
      montoCuota: 240000,
      diaPago: 30,
      descripcion: 'Pago quincena fin de mes (Día 30)',
      pagadoEsteMes: false
    },
    {
      id: 'cred-2',
      nombre: 'Crédito Celular / Libre Inversión',
      montoCuota: 160000,
      diaPago: 10,
      descripcion: 'Pago corte primer tercio (Día 10)',
      pagadoEsteMes: false
    }
  ];
  saveStoredCredits(defaults);
  return defaults;
}

export function saveStoredCredits(credits: CreditInstallment[]): void {
  localStorage.setItem(STORAGE_KEYS.CREDITS, JSON.stringify(credits));
}

export function getStoredSupabaseConfig(): SupabaseConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CONFIG);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Error reading supabase config from localStorage', e);
  }

  return {
    url: (import.meta.env.VITE_SUPABASE_URL as string) || '',
    anonKey: (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || ''
  };
}

export function saveStoredSupabaseConfig(config: SupabaseConfig): void {
  localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(config));
}

export function getStoredShifts(): Shift[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SHIFTS);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Error loading shifts from localStorage', e);
  }
  return [];
}

export function saveStoredShifts(shifts: Shift[]): void {
  localStorage.setItem(STORAGE_KEYS.SHIFTS, JSON.stringify(shifts));
}

export function getStoredTransactions(): Transaction[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Error loading transactions from localStorage', e);
  }
  return [];
}

export function saveStoredTransactions(transactions: Transaction[]): void {
  localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
}

export function getStoredSyncQueue(): SyncQueueItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SYNC_QUEUE);
    if (raw) {
      return JSON.parse(raw);
    }
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

export function removeFromSyncQueue(id: string, entity: 'shifts' | 'transactions' | 'credits'): void {
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
 * Genera datos de demostración con las nuevas plataformas solicitadas
 */
export function generateDemoData(): { shifts: Shift[]; transactions: Transaction[] } {
  const today = new Date();
  const shifts: Shift[] = [];
  const transactions: Transaction[] = [];

  // Plataformas requeridas: Rappi, Didi Food, Mensajeros Urbanos, Armi, Farmatodo (FarmaEnvíos)
  const apps = ['Rappi', 'Didi Food', 'Mensajeros Urbanos', 'Armi', 'Farmatodo (FarmaEnvíos)'];

  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const fecha = getLocalDateString(d);
    const shiftId = `demo-shift-${i + 1}`;

    const deliveryMin = 240 + Math.floor(Math.random() * 90);
    const waitMin = 60 + Math.floor(Math.random() * 45);
    const km = +(38 + Math.random() * 32).toFixed(1);

    shifts.push({
      id: shiftId,
      fecha,
      tiempo_reparto_minutos: deliveryMin,
      tiempo_espera_minutos: waitMin,
      kilometros: km,
      notas: i === 0 ? 'Turno tarde con alta demanda en FarmaEnvíos y Rappi' : 'Jornada normal de entregas urbanas',
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
        id: `demo-tx-order-${i}-${j}`,
        fecha,
        tipo: 'INGRESO',
        categoria: 'DOMICILIOS',
        subcategoria: app,
        descripcion: `Entrega #${j + 1} (${app})${propina > 0 ? ' + Propina' : ''}`,
        monto: tarifa + propina,
        medio_pago: 'APP',
        shift_id: shiftId,
        created_at: new Date(d.setHours(13 + j, 15, 0)).toISOString(),
        sync_status: 'synced'
      });

      if (isCash) {
        const cashCollected = 35000 + Math.floor(Math.random() * 40000);
        transactions.push({
          id: `demo-tx-cash-${i}-${j}`,
          fecha,
          tipo: 'COBRO_EFECTIVO_APP',
          categoria: 'DOMICILIOS',
          subcategoria: app,
          descripcion: `Cobro efectivo pedido cliente (${app})`,
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
        id: `demo-tx-passenger-${i}`,
        fecha,
        tipo: 'INGRESO',
        categoria: 'PASAJEROS',
        subcategoria: 'Yango Pro',
        descripcion: 'Viaje pasajero Yango Pro Centro a Chapinero',
        monto: 18000,
        medio_pago: 'EFECTIVO',
        shift_id: shiftId,
        created_at: new Date(d.setHours(18, 0, 0)).toISOString(),
        sync_status: 'synced'
      });
    }

    // Gastos diarios
    transactions.push({
      id: `demo-tx-gas-${i}`,
      fecha,
      tipo: 'GASTO',
      categoria: 'COMBUSTIBLE',
      subcategoria: 'Gasolina',
      descripcion: 'Tanqueada corriente Terpel',
      monto: 18000,
      medio_pago: 'EFECTIVO',
      shift_id: shiftId,
      created_at: new Date(d.setHours(11, 30, 0)).toISOString(),
      sync_status: 'synced'
    });

    transactions.push({
      id: `demo-tx-food-${i}`,
      fecha,
      tipo: 'GASTO',
      categoria: 'ALIMENTACION',
      subcategoria: 'Almuerzo / Comida',
      descripcion: 'Almuerzo corriente del día',
      monto: 14000,
      medio_pago: 'EFECTIVO',
      shift_id: shiftId,
      created_at: new Date(d.setHours(14, 0, 0)).toISOString(),
      sync_status: 'synced'
    });
  }

  return { shifts, transactions };
}
