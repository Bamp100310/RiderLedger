import { Shift, Transaction, SyncQueueItem, SupabaseConfig } from '../types';
import { getLocalDateString } from './calculations';

const STORAGE_KEYS = {
  SHIFTS: 'riderledger_shifts_v1',
  TRANSACTIONS: 'riderledger_transactions_v1',
  SYNC_QUEUE: 'riderledger_sync_queue_v1',
  CONFIG: 'riderledger_supabase_config_v1',
  LAST_SYNC: 'riderledger_last_sync_v1'
};

export function getStoredSupabaseConfig(): SupabaseConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CONFIG);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Error reading supabase config from localStorage', e);
  }

  // Fallback a variables de entorno de Vite si existen
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
  // Evitar duplicados exactos en la cola
  const filtered = queue.filter(q => !(q.id === item.id && q.entity === item.entity));
  filtered.push({ ...item, timestamp: Date.now() });
  saveStoredSyncQueue(filtered);
}

export function removeFromSyncQueue(id: string, entity: 'shifts' | 'transactions'): void {
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
 * Genera datos de demostración realistas para repartidores en moto/bici (Rappi, Didi, Uber)
 */
export function generateDemoData(): { shifts: Shift[]; transactions: Transaction[] } {
  const today = new Date();
  const shifts: Shift[] = [];
  const transactions: Transaction[] = [];

  const apps = ['Rappi', 'Didi Food', 'Uber Eats'];

  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const fecha = getLocalDateString(d);
    const shiftId = `demo-shift-${i + 1}`;

    const deliveryMin = 240 + Math.floor(Math.random() * 90); // 4h a 5.5h
    const waitMin = 60 + Math.floor(Math.random() * 45);      // 1h a 1.75h
    const km = +(38 + Math.random() * 32).toFixed(1);

    shifts.push({
      id: shiftId,
      fecha,
      tiempo_reparto_minutos: deliveryMin,
      tiempo_espera_minutos: waitMin,
      kilometros: km,
      notas: i === 0 ? 'Turno tarde-noche con alta demanda de lluvia' : 'Jornada normal de pedidos',
      created_at: new Date(d.setHours(12, 0, 0)).toISOString(),
      sync_status: 'synced'
    });

    // Pedidos de App
    const numOrders = 4 + Math.floor(Math.random() * 3);
    for (let j = 0; j < numOrders; j++) {
      const app = apps[j % apps.length];
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

      // Si cobró efectivo al cliente por el pedido
      if (isCash) {
        const cashCollected = 35000 + Math.floor(Math.random() * 40000);
        transactions.push({
          id: `demo-tx-cash-${i}-${j}`,
          fecha,
          tipo: 'COBRO_EFECTIVO_APP',
          categoria: 'DOMICILIOS',
          subcategoria: app,
          descripcion: `Cobro en efectivo pedido cliente (${app})`,
          monto: cashCollected,
          medio_pago: 'EFECTIVO',
          shift_id: shiftId,
          created_at: new Date(d.setHours(13 + j, 20, 0)).toISOString(),
          sync_status: 'synced'
        });
      }
    }

    // Pasajeros (Didi / InDrive) en días alternos
    if (i % 2 === 0) {
      transactions.push({
        id: `demo-tx-passenger-${i}`,
        fecha,
        tipo: 'INGRESO',
        categoria: 'PASAJEROS',
        subcategoria: 'Didi Moto',
        descripcion: 'Viaje pasajero Centro a Norte',
        monto: 16000,
        medio_pago: 'EFECTIVO',
        shift_id: shiftId,
        created_at: new Date(d.setHours(18, 0, 0)).toISOString(),
        sync_status: 'synced'
      });
    }

    // Gastos diarios (Gasolina, Almuerzo)
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
      subcategoria: 'Almuerzo / Arepas',
      descripcion: 'Almuerzo corriente con jugo',
      monto: 14000,
      medio_pago: 'EFECTIVO',
      shift_id: shiftId,
      created_at: new Date(d.setHours(14, 0, 0)).toISOString(),
      sync_status: 'synced'
    });

    // Mantenimiento esporádico
    if (i === 4) {
      transactions.push({
        id: `demo-tx-maint-${i}`,
        fecha,
        tipo: 'GASTO',
        categoria: 'MANTENIMIENTO_MOTO',
        subcategoria: 'Aceite y frenos',
        descripcion: 'Cambio de aceite Motul 10W40 y pastillas',
        monto: 55000,
        medio_pago: 'TRANSFERENCIA_BANCO',
        shift_id: shiftId,
        created_at: new Date(d.setHours(10, 0, 0)).toISOString(),
        sync_status: 'synced'
      });
    }
  }

  return { shifts, transactions };
}
