export type TransactionType = 'INGRESO' | 'GASTO' | 'COBRO_EFECTIVO_APP';

export type PaymentMethod = 'APP' | 'EFECTIVO' | 'TRANSFERENCIA_BANCO';

export type IncomeCategory = 'DOMICILIOS' | 'PASAJEROS' | 'OTROS_INGRESOS';

export type ExpenseCategory = 'COMBUSTIBLE' | 'MANTENIMIENTO_MOTO' | 'ALIMENTACION' | 'OTROS_GASTOS' | 'CUOTA_CREDITO';

export type TransactionCategory = IncomeCategory | ExpenseCategory | string;

export interface Shift {
  id: string;
  fecha: string; // YYYY-MM-DD
  tiempo_reparto_minutos: number;
  tiempo_espera_minutos: number;
  kilometros: number;
  notas?: string | null;
  created_at?: string;
  sync_status?: 'synced' | 'pending' | 'error';
}

export interface Transaction {
  id: string;
  fecha: string; // YYYY-MM-DD
  tipo: TransactionType;
  categoria: string;
  subcategoria: string;
  descripcion?: string | null;
  monto: number;
  medio_pago: PaymentMethod;
  shift_id?: string | null;
  created_at?: string;
  sync_status?: 'synced' | 'pending' | 'error';
}

export type TimeRange = 'hoy' | 'semana' | 'mes' | 'historico' | 'personalizado';

export interface DateFilter {
  range: TimeRange;
  startDate?: string;
  endDate?: string;
}

export interface CreditInstallment {
  id: string;
  nombre: string; // ej: "Cuota Moto", "Crédito Bancario", "Cuota Celular"
  montoCuota: number;
  diaPago: 10 | 30 | number; // Días 10 y 30 de cada mes
  descripcion?: string;
  pagadoEsteMes?: boolean;
  ultimoMesPagado?: string; // "YYYY-MM"
}

export interface CreditAnalysis {
  proximoDiaPago: number; // 10 o 30
  proximaFechaCompleta: string; // "YYYY-MM-DD"
  diasRestantes: number;
  totalCuotasPendientes: number;
  superavitActual: number;
  diferencia: number; // superavitActual - totalCuotasPendientes
  porcentajeCobertura: number;
  estaCubierto: boolean;
  alertaVencimientoCercano: boolean;
  esHoy: boolean;
  cuotasAplicables: CreditInstallment[];
}

export interface FinancialSummary {
  ingresosTotales: number;
  gastosTotales: number;
  superavitNeto: number;
  saldoApp: number;
  efectivoEnMano: number;
  totalMinutosReparto: number;
  totalMinutosEspera: number;
  totalMinutosTrabajados: number;
  ratioProductividad: number; // Porcentaje de 0 a 100
  kilometrosTotales: number;
  rendimientoPorHora: number;
  rendimientoPorKm: number;
  totalTransacciones: number;
  totalTurnos: number;
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

export interface SyncQueueItem {
  id: string;
  entity: 'shifts' | 'transactions' | 'credits';
  action: 'insert' | 'update' | 'delete';
  payload: any;
  timestamp: number;
}

export type ThemeMode = 'dark' | 'light';
