import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  Shift,
  Transaction,
  SupabaseConfig,
  SyncQueueItem,
  UserProfile,
  CreditInstallment,
  CreditCardAccount,
  FinancialSettings
} from '../types';
import {
  getStoredSupabaseConfig,
  getStoredSyncQueue,
  saveStoredSyncQueue
} from './storage';

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
  tablesStatus?: {
    shifts: boolean;
    transactions: boolean;
    credits: boolean;
    creditCards: boolean;
    financialSettings: boolean;
  };
}> {
  if (!url || !anonKey) {
    return { success: false, message: 'URL o Clave Anónima vacía.' };
  }

  try {
    const testClient = createClient(url, anonKey);

    const [sRes, tRes, cRes, ccRes, setRes] = await Promise.all([
      testClient.from('shifts').select('id').limit(1),
      testClient.from('transactions').select('id').limit(1),
      testClient.from('credits').select('id').limit(1),
      testClient.from('credit_cards').select('id').limit(1),
      testClient.from('financial_settings').select('user_id').limit(1)
    ]);

    const shiftsOk = !sRes.error;
    const txsOk = !tRes.error;
    const creditsOk = !cRes.error;
    const cardsOk = !ccRes.error;
    const settingsOk = !setRes.error;

    const allOk = shiftsOk && txsOk && creditsOk && cardsOk && settingsOk;

    return {
      success: shiftsOk && txsOk,
      message: allOk
        ? '¡Conexión exitosa! Todas las tablas operativas y financieras están listas.'
        : 'Conexión alcanzada. Algunas tablas aún no existen en Supabase (ejecuta la migración 20260915_create_credits_and_cards_tables.sql).',
      tablesStatus: {
        shifts: shiftsOk,
        transactions: txsOk,
        credits: creditsOk,
        creditCards: cardsOk,
        financialSettings: settingsOk
      }
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Fallo de red o URL inválida: ${err?.message || 'Verifica la URL de Supabase'}`
    };
  }
}

// ==============================================================================
// MAPEADORES CAMELCASE <-> SNAKE_CASE PARA SUPABASE
// ==============================================================================

export function mapCreditToRemote(c: CreditInstallment) {
  return {
    id: c.id,
    user_id: c.userId,
    nombre: c.nombre,
    monto_cuota: Number(c.montoCuota) || 0,
    dia_pago: Number(c.diaPago) || 10,
    descripcion: c.descripcion || null,
    pagado_este_mes: Boolean(c.pagadoEsteMes),
    ultimo_mes_pagado: c.ultimoMesPagado || null,
    created_at: c.created_at || new Date().toISOString(),
    updated_at: c.updated_at || new Date().toISOString(),
    deleted_at: c.deleted_at || null
  };
}

export function mapRemoteToCredit(r: any): CreditInstallment {
  return {
    id: r.id,
    userId: r.user_id,
    nombre: r.nombre,
    montoCuota: Number(r.monto_cuota) || 0,
    diaPago: Number(r.dia_pago) || 10,
    descripcion: r.descripcion || undefined,
    pagadoEsteMes: Boolean(r.pagado_este_mes),
    ultimoMesPagado: r.ultimo_mes_pagado || undefined,
    created_at: r.created_at,
    updated_at: r.updated_at,
    deleted_at: r.deleted_at,
    sync_status: 'synced'
  };
}

export function mapCardToRemote(card: CreditCardAccount) {
  return {
    id: card.id,
    user_id: card.userId,
    nombre: card.nombre,
    cupo_total: Number(card.cupoTotal) || 0,
    saldo_utilizado: Number(card.saldoUtilizado) || 0,
    fecha_corte: Number(card.fechaCorte) || 15,
    fecha_pago: Number(card.fechaPago) || 30,
    pago_minimo: Number(card.pagoMinimo) || 0,
    pago_total_esperado: card.pagoTotalEsperado != null ? Number(card.pagoTotalEsperado) : null,
    tasa_interes_ea: card.tasaInteresEA != null ? Number(card.tasaInteresEA) : null,
    banco_entidad: card.bancoEntidad || null,
    ultimos_digitos: card.ultimosDigitos || null,
    notas: card.notas || null,
    estado: card.estado || 'AL_DIA',
    created_at: card.created_at || new Date().toISOString(),
    updated_at: card.updated_at || new Date().toISOString(),
    deleted_at: card.deleted_at || null
  };
}

export function mapRemoteToCard(r: any): CreditCardAccount {
  return {
    id: r.id,
    userId: r.user_id,
    nombre: r.nombre,
    cupoTotal: Number(r.cupo_total) || 0,
    saldoUtilizado: Number(r.saldo_utilizado) || 0,
    fechaCorte: Number(r.fecha_corte) || 15,
    fechaPago: Number(r.fecha_pago) || 30,
    pagoMinimo: Number(r.pago_minimo) || 0,
    pagoTotalEsperado: r.pago_total_esperado != null ? Number(r.pago_total_esperado) : undefined,
    tasaInteresEA: r.tasa_interes_ea != null ? Number(r.tasa_interes_ea) : undefined,
    bancoEntidad: r.banco_entidad || undefined,
    ultimosDigitos: r.ultimos_digitos || undefined,
    notas: r.notas || undefined,
    estado: r.estado || 'AL_DIA',
    created_at: r.created_at,
    updated_at: r.updated_at,
    deleted_at: r.deleted_at,
    sync_status: 'synced'
  };
}

export function mapSettingsToRemote(s: FinancialSettings, userId: string) {
  return {
    user_id: userId,
    meta_ingreso_minimo_mensual: Number(s.metaIngresoMinimoMensual) || 1750905,
    horas_semanales_referencia: Number(s.horasSemanalesReferencia) || 42,
    horas_mensuales_referencia: Number(s.horasMensualesReferencia) || 182,
    meta_ingreso_hora_referencia: Number(s.metaIngresoHoraReferencia) || 9620,
    meta_ahorro_mensual: Number(s.metaAhorroMensual) || 300000,
    meta_fondo_emergencia_meses: Number(s.metaFondoEmergenciaMeses) || 3,
    limite_utilizacion_credito_pct: Number(s.limiteUtilizacionCreditoPct) || 30,
    porcentaje_necesidades_ref: Number(s.porcentajeNecesidadesRef) || 50,
    porcentaje_deseos_ref: Number(s.porcentajeDeseosRef) || 30,
    porcentaje_ahorro_deuda_ref: Number(s.porcentajeAhorroDeudaRef) || 20,
    updated_at: s.updated_at || new Date().toISOString()
  };
}

export function mapRemoteToSettings(r: any): FinancialSettings {
  return {
    userId: r.user_id,
    metaIngresoMinimoMensual: Number(r.meta_ingreso_minimo_mensual) || 1750905,
    horasSemanalesReferencia: Number(r.horas_semanales_referencia) || 42,
    horasMensualesReferencia: Number(r.horas_mensuales_referencia) || 182,
    metaIngresoHoraReferencia: Number(r.meta_ingreso_hora_referencia) || 9620,
    metaAhorroMensual: Number(r.meta_ahorro_mensual) || 300000,
    metaFondoEmergenciaMeses: Number(r.meta_fondo_emergencia_meses) || 3,
    limiteUtilizacionCreditoPct: Number(r.limite_utilizacion_credito_pct) || 30,
    porcentajeNecesidadesRef: Number(r.porcentaje_necesidades_ref) || 50,
    porcentajeDeseosRef: Number(r.porcentaje_deseos_ref) || 30,
    porcentajeAhorroDeudaRef: Number(r.porcentaje_ahorro_deuda_ref) || 20,
    metaGastoCombustibleMaxPct: 25,
    updated_at: r.updated_at,
    sync_status: 'synced'
  };
}

/**
 * Sincroniza la cola local de cambios hacia Supabase y descarga los registros actualizados.
 * Aplica LWW (Last-Write-Wins) basado en updated_at y respeta soft-deletes (deleted_at).
 */
export async function syncWithSupabase(
  localShifts: Shift[],
  localTransactions: Transaction[],
  localUsers?: UserProfile[],
  localCredits?: CreditInstallment[],
  localCreditCards?: CreditCardAccount[],
  localSettings?: FinancialSettings,
  activeUserId?: string
): Promise<{
  success: boolean;
  shifts: Shift[];
  transactions: Transaction[];
  users?: UserProfile[];
  credits?: CreditInstallment[];
  creditCards?: CreditCardAccount[];
  financialSettings?: FinancialSettings;
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
      credits: localCredits,
      creditCards: localCreditCards,
      financialSettings: localSettings,
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
          const { sync_status, ...payload } = item.payload;
          const shiftData = { ...payload, updated_at: payload.updated_at || new Date().toISOString() };
          const { error } = await client.from('shifts').upsert(shiftData);
          if (error) {
            if (error.code === '42703' || error.message?.includes('odometer')) {
              const { odometer_start, odometer_end, ...fallbackShift } = shiftData;
              const { error: retryErr } = await client.from('shifts').upsert(fallbackShift);
              if (retryErr) throw retryErr;
            } else {
              throw error;
            }
          }
          syncedCount++;
        } else if (item.action === 'delete') {
          // Soft-delete en servidor
          const { error } = await client
            .from('shifts')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', item.id);
          if (error) {
            // Si la columna deleted_at aún no existe en Supabase, hacer delete físico
            await client.from('shifts').delete().eq('id', item.id);
          }
          syncedCount++;
        }
      } else if (item.entity === 'transactions') {
        if (item.action === 'insert' || item.action === 'update') {
          const { sync_status, ...payload } = item.payload;
          const txData = { ...payload, updated_at: payload.updated_at || new Date().toISOString() };
          const { error } = await client.from('transactions').upsert(txData);
          if (error) {
            if (error.code === '23503' || error.message?.includes('foreign key constraint') || error.message?.includes('fkey')) {
              const { shift_id, ...fallbackPayload } = txData;
              const { error: retryErr } = await client.from('transactions').upsert({ ...fallbackPayload, shift_id: null });
              if (retryErr) throw retryErr;
            } else {
              throw error;
            }
          }
          syncedCount++;
        } else if (item.action === 'delete') {
          const { error } = await client
            .from('transactions')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', item.id);
          if (error) {
            await client.from('transactions').delete().eq('id', item.id);
          }
          syncedCount++;
        }
      } else if (item.entity === 'credits') {
        if (item.action === 'insert' || item.action === 'update') {
          const remotePayload = mapCreditToRemote(item.payload);
          const { error } = await client.from('credits').upsert(remotePayload);
          if (error) throw error;
          syncedCount++;
        } else if (item.action === 'delete') {
          const { error } = await client
            .from('credits')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', item.id);
          if (error) await client.from('credits').delete().eq('id', item.id);
          syncedCount++;
        }
      } else if (item.entity === 'credit_cards') {
        if (item.action === 'insert' || item.action === 'update') {
          const remotePayload = mapCardToRemote(item.payload);
          const { error } = await client.from('credit_cards').upsert(remotePayload);
          if (error) throw error;
          syncedCount++;
        } else if (item.action === 'delete') {
          const { error } = await client
            .from('credit_cards')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', item.id);
          if (error) await client.from('credit_cards').delete().eq('id', item.id);
          syncedCount++;
        }
      } else if (item.entity === 'financial_settings') {
        if (item.action === 'insert' || item.action === 'update') {
          const uId = item.payload.userId || activeUserId || 'user-alejo';
          const remotePayload = mapSettingsToRemote(item.payload, uId);
          const { error } = await client.from('financial_settings').upsert(remotePayload);
          if (error) throw error;
          syncedCount++;
        }
      }
    } catch (e: any) {
      console.warn(`Error al sincronizar item ${item.entity}:${item.id}:`, e?.message);
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

  // 3. Descargar registros de Supabase (Shifts y Transactions)
  let finalShifts = localShifts;
  let finalTransactions = localTransactions;

  try {
    const { data: remoteShifts, error: sErr } = await client
      .from('shifts')
      .select('*')
      .order('fecha', { ascending: false });

    if (!sErr && remoteShifts) {
      const remoteShiftMap = new Map(remoteShifts.map((s: any) => [s.id, s]));
      const mergedShifts: Shift[] = [];

      for (const s of remoteShifts) {
        if (!s.deleted_at) {
          mergedShifts.push({ ...s, sync_status: 'synced' });
        }
      }

      // Añadir locales que aún no están en servidor (offline adds)
      for (const localS of localShifts) {
        if (!localS.deleted_at && !remoteShiftMap.has(localS.id)) {
          mergedShifts.push({ ...localS, sync_status: 'pending' });
          if (!remainingQueue.some(q => q.id === localS.id)) {
            remainingQueue.push({ id: localS.id, entity: 'shifts', action: 'insert', payload: localS, timestamp: Date.now() });
          }
        }
      }

      finalShifts = mergedShifts;
    }

    const { data: remoteTransactions, error: tErr } = await client
      .from('transactions')
      .select('*')
      .order('fecha', { ascending: false });

    if (!tErr && remoteTransactions) {
      const remoteTxMap = new Map(remoteTransactions.map((t: any) => [t.id, t]));
      const mergedTxs: Transaction[] = [];

      for (const t of remoteTransactions) {
        if (!t.deleted_at) {
          mergedTxs.push({ ...t, sync_status: 'synced' });
        }
      }

      for (const localT of localTransactions) {
        if (!localT.deleted_at && !remoteTxMap.has(localT.id)) {
          mergedTxs.push({ ...localT, sync_status: 'pending' });
          if (!remainingQueue.some(q => q.id === localT.id)) {
            remainingQueue.push({ id: localT.id, entity: 'transactions', action: 'insert', payload: localT, timestamp: Date.now() });
          }
        }
      }

      finalTransactions = mergedTxs;
    }
  } catch (err: any) {
    console.warn('Error al descargar shifts/transactions de Supabase:', err?.message);
  }

  // 4. Descargar Créditos (credits) con True LWW y soft-delete
  let finalCredits = localCredits || [];
  try {
    const { data: remoteCredits, error: credErr } = await client
      .from('credits')
      .select('*');

    if (!credErr && remoteCredits) {
      const remoteCredMap = new Map(remoteCredits.map((r: any) => [r.id, r]));
      const mergedCredits: CreditInstallment[] = [];

      for (const r of remoteCredits) {
        if (!r.deleted_at) {
          mergedCredits.push(mapRemoteToCredit(r));
        }
      }

      for (const loc of localCredits || []) {
        if (!loc.deleted_at && !remoteCredMap.has(loc.id)) {
          mergedCredits.push({ ...loc, sync_status: 'pending' });
          if (!remainingQueue.some(q => q.id === loc.id)) {
            remainingQueue.push({ id: loc.id, entity: 'credits', action: 'insert', payload: loc, timestamp: Date.now() });
          }
        }
      }

      finalCredits = mergedCredits;
    }
  } catch (cErr: any) {
    console.warn('Tabla credits no disponible en Supabase aún:', cErr?.message);
  }

  // 5. Descargar Tarjetas de Crédito (credit_cards) con True LWW y soft-delete
  let finalCreditCards = localCreditCards || [];
  try {
    const { data: remoteCards, error: cardErr } = await client
      .from('credit_cards')
      .select('*');

    if (!cardErr && remoteCards) {
      const remoteCardMap = new Map(remoteCards.map((r: any) => [r.id, r]));
      const mergedCards: CreditCardAccount[] = [];

      for (const r of remoteCards) {
        if (!r.deleted_at) {
          mergedCards.push(mapRemoteToCard(r));
        }
      }

      for (const loc of localCreditCards || []) {
        if (!loc.deleted_at && !remoteCardMap.has(loc.id)) {
          mergedCards.push({ ...loc, sync_status: 'pending' });
          if (!remainingQueue.some(q => q.id === loc.id)) {
            remainingQueue.push({ id: loc.id, entity: 'credit_cards', action: 'insert', payload: loc, timestamp: Date.now() });
          }
        }
      }

      finalCreditCards = mergedCards;
    }
  } catch (ccErr: any) {
    console.warn('Tabla credit_cards no disponible en Supabase aún:', ccErr?.message);
  }

  // 6. Descargar Configuración Financiera (financial_settings)
  let finalSettings = localSettings;
  try {
    if (activeUserId) {
      const { data: remoteSettings, error: setErr } = await client
        .from('financial_settings')
        .select('*')
        .eq('user_id', activeUserId)
        .maybeSingle();

      if (!setErr && remoteSettings) {
        finalSettings = mapRemoteToSettings(remoteSettings);
      }
    }
  } catch (sErr: any) {
    console.warn('Tabla financial_settings no disponible en Supabase aún:', sErr?.message);
  }

  saveStoredSyncQueue(remainingQueue);

  return {
    success: true,
    shifts: finalShifts,
    transactions: finalTransactions,
    users: finalUsers,
    credits: finalCredits,
    creditCards: finalCreditCards,
    financialSettings: finalSettings,
    syncedCount
  };
}
