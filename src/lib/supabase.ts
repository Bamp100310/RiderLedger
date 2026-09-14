import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Shift, Transaction, SupabaseConfig, SyncQueueItem, UserProfile } from '../types';
import { getStoredSupabaseConfig, getStoredSyncQueue, saveStoredSyncQueue } from './storage';

let supabaseInstance: SupabaseClient | null = null;
let currentConfigKey = '';

/**
 * Obtiene o inicializa la instancia singleton de Supabase
 */
export function getSupabaseClient(customConfig?: SupabaseConfig): SupabaseClient | null {
  const config = customConfig || getStoredSupabaseConfig();
  
  if (!config.url || !config.anonKey) {
    return null;
  }

  const key = `${config.url}_${config.anonKey}`;
  if (supabaseInstance && currentConfigKey === key) {
    return supabaseInstance;
  }

  try {
    supabaseInstance = createClient(config.url, config.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true
      }
    });
    currentConfigKey = key;
    return supabaseInstance;
  } catch (error) {
    console.error('Error creating Supabase client:', error);
    return null;
  }
}

/**
 * Prueba la conexión con Supabase e inspecciona las tablas requeridas
 */
export async function testSupabaseConnection(url: string, anonKey: string): Promise<{
  success: boolean;
  message: string;
  tablesStatus?: { shifts: boolean; transactions: boolean };
}> {
  if (!url || !anonKey) {
    return { success: false, message: 'URL o Clave Anónima vacía.' };
  }

  try {
    const testClient = createClient(url, anonKey);

    // Probar tabla shifts
    const { error: shiftErr } = await testClient
      .from('shifts')
      .select('id')
      .limit(1);

    // Probar tabla transactions
    const { error: txErr } = await testClient
      .from('transactions')
      .select('id')
      .limit(1);

    const shiftsOk = !shiftErr;
    const txsOk = !txErr;

    if (shiftsOk && txsOk) {
      return {
        success: true,
        message: '¡Conexión exitosa! Ambas tablas existen y responden correctamente.',
        tablesStatus: { shifts: true, transactions: true }
      };
    }

    if (shiftErr && shiftErr.message.includes('relation "public.shifts" does not exist')) {
      return {
        success: false,
        message: 'Conexión alcanzada, pero la tabla "shifts" no existe. Ejecuta el script SQL en Supabase.',
        tablesStatus: { shifts: false, transactions: txsOk }
      };
    }

    if (txErr && txErr.message.includes('relation "public.transactions" does not exist')) {
      return {
        success: false,
        message: 'Conexión alcanzada, pero la tabla "transactions" no existe. Ejecuta el script SQL en Supabase.',
        tablesStatus: { shifts: shiftsOk, transactions: false }
      };
    }

    const errDetail = shiftErr?.message || txErr?.message || 'Error desconocido al consultar tablas';
    return {
      success: false,
      message: `Error al consultar Supabase: ${errDetail}`,
      tablesStatus: { shifts: shiftsOk, transactions: txsOk }
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Fallo de red o URL inválida: ${err?.message || 'Verifica la URL de Supabase'}`
    };
  }
}

/**
 * Sincroniza la cola local de cambios hacia Supabase y descarga los registros actualizados
 */
export async function syncWithSupabase(
  localShifts: Shift[],
  localTransactions: Transaction[],
  localUsers?: UserProfile[]
): Promise<{
  success: boolean;
  shifts: Shift[];
  transactions: Transaction[];
  users?: UserProfile[];
  syncedCount: number;
  errorMessage?: string;
}> {
  const client = getSupabaseClient();
  if (!client) {
    return {
      success: false,
      shifts: localShifts,
      transactions: localTransactions,
      users: localUsers,
      syncedCount: 0,
      errorMessage: 'Supabase no está configurado aún.'
    };
  }

  let syncedCount = 0;
  const queue = getStoredSyncQueue();
  const remainingQueue: SyncQueueItem[] = [];

  // 1. Procesar la cola de sincronización pendiente (Offline mutations)
  for (const item of queue) {
    try {
      if (item.entity === 'shifts') {
        if (item.action === 'insert' || item.action === 'update') {
          // Excluir sync_status de la carga enviada a Supabase
          const { sync_status, ...payload } = item.payload;
          const { error } = await client.from('shifts').upsert(payload);
          if (error) {
            // Si la columna de odómetro aún no existe en Supabase remoto, reintentar sin esos campos
            if (error.code === '42703' || error.message?.includes('odometer')) {
              const { odometer_start, odometer_end, ...fallbackShift } = payload;
              const { error: retryErr } = await client.from('shifts').upsert(fallbackShift);
              if (retryErr) throw retryErr;
            } else {
              throw error;
            }
          }
          syncedCount++;
        } else if (item.action === 'delete') {
          const { error } = await client.from('shifts').delete().eq('id', item.id);
          if (error) throw error;
          syncedCount++;
        }
      } else if (item.entity === 'transactions') {
        if (item.action === 'insert' || item.action === 'update') {
          const { sync_status, ...payload } = item.payload;
          const { error } = await client.from('transactions').upsert(payload);
          if (error) {
            // Si viola clave foránea (ej: shift_id no existe en Supabase aún), reintentar sin shift_id
            if (error.code === '23503' || error.message?.includes('foreign key constraint') || error.message?.includes('fkey')) {
              const { shift_id, ...fallbackPayload } = payload;
              const { error: retryErr } = await client.from('transactions').upsert({ ...fallbackPayload, shift_id: null });
              if (retryErr) throw retryErr;
            } else {
              throw error;
            }
          }
          syncedCount++;
        } else if (item.action === 'delete') {
          const { error } = await client.from('transactions').delete().eq('id', item.id);
          if (error) throw error;
          syncedCount++;
        }
      }
    } catch (e: any) {
      console.warn(`Error al sincronizar item ${item.id}:`, e?.message);
      remainingQueue.push(item);
    }
  }

  saveStoredSyncQueue(remainingQueue);

  // 2. Sincronizar perfiles de usuario familiares (Alejo, Jhony, etc.)
  let finalUsers = localUsers;
  try {
    const { data: remoteProfiles, error: pErr } = await client
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: true });

    if (!pErr && remoteProfiles && remoteProfiles.length > 0) {
      finalUsers = remoteProfiles.map((p: any) => ({
        id: p.id,
        nombre: p.nombre,
        email: p.email || '',
        rol: p.rol || 'Miembro Familiar',
        avatarColor: p.avatarColor || '#0ea5e9',
        createdAt: p.created_at || new Date().toISOString()
      }));
    } else if (localUsers && localUsers.length > 0) {
      // Si Supabase no tiene perfiles aún, subir los locales iniciales
      for (const u of localUsers) {
        await client.from('profiles').upsert({
          id: u.id,
          nombre: u.nombre,
          email: u.email || null,
          rol: u.rol || 'Miembro Familiar',
          avatarColor: u.avatarColor || '#0ea5e9',
          created_at: u.createdAt || new Date().toISOString()
        });
      }
    }
  } catch (pGetErr) {
    console.warn('Tabla profiles no disponible todavía en Supabase:', pGetErr);
  }

  // 3. Descargar registros de Supabase
  try {
    const { data: remoteShifts, error: sErr } = await client
      .from('shifts')
      .select('*')
      .order('fecha', { ascending: false });

    if (sErr) throw sErr;

    const { data: remoteTransactions, error: tErr } = await client
      .from('transactions')
      .select('*')
      .order('fecha', { ascending: false });

    if (tErr) throw tErr;

    // Fusionar sin perder JAMÁS ningún registro local
    const remoteShiftMap = new Map((remoteShifts || []).map((s: any) => [s.id, s]));
    const finalShifts: Shift[] = (remoteShifts || []).map((s: any) => ({
      ...s,
      sync_status: 'synced'
    }));

    for (const localS of localShifts) {
      if (!remoteShiftMap.has(localS.id)) {
        finalShifts.push({ ...localS, sync_status: 'pending' });
        if (!remainingQueue.some(q => q.id === localS.id)) {
          remainingQueue.push({ id: localS.id, entity: 'shifts', action: 'insert', payload: localS, timestamp: Date.now() });
        }
      }
    }

    const remoteTxMap = new Map((remoteTransactions || []).map((t: any) => [t.id, t]));
    const finalTransactions: Transaction[] = (remoteTransactions || []).map((t: any) => ({
      ...t,
      sync_status: 'synced'
    }));

    for (const localT of localTransactions) {
      if (!remoteTxMap.has(localT.id)) {
        finalTransactions.push({ ...localT, sync_status: 'pending' });
        if (!remainingQueue.some(q => q.id === localT.id)) {
          remainingQueue.push({ id: localT.id, entity: 'transactions', action: 'insert', payload: localT, timestamp: Date.now() });
        }
      }
    }

    saveStoredSyncQueue(remainingQueue);

    return {
      success: true,
      shifts: finalShifts,
      transactions: finalTransactions,
      users: finalUsers,
      syncedCount
    };
  } catch (err: any) {
    return {
      success: false,
      shifts: localShifts,
      transactions: localTransactions,
      users: finalUsers,
      syncedCount,
      errorMessage: err?.message || 'Error al descargar datos de Supabase'
    };
  }
}
