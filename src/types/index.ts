export type TransactionType = 'INGRESO' | 'GASTO' | 'COBRO_EFECTIVO_APP';

// Categorización requerida: Efectivo, Bre-B, App
export type PaymentMethod = 'EFECTIVO' | 'BRE_B' | 'APP';

export type IncomeCategory = 'DOMICILIOS' | 'PASAJEROS' | 'OTROS_INGRESOS';

export type ExpenseCategory = 'COMBUSTIBLE' | 'MANTENIMIENTO_MOTO' | 'ALIMENTACION' | 'HONORARIOS_ACOMPANANTE' | 'OTROS_GASTOS' | 'CUOTA_CREDITO';

export type TransactionCategory = IncomeCategory | ExpenseCategory | string;

export interface Shift {
  id: string;
  userId?: string;
  fecha: string; // YYYY-MM-DD
  tiempo_reparto_minutos: number;
  tiempo_espera_minutos: number;
  kilometros: number;
  odometer_start?: number | null;
  odometer_end?: number | null;
  created_at?: string;
  sync_status?: 'synced' | 'pending' | 'error';
}

export interface Transaction {
  id: string;
  userId?: string;
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

export type TimeRange = 'hoy' | 'semana' | 'mes' | 'año' | 'historico' | 'personalizado';

export interface DateFilter {
  range: TimeRange;
  referenceDate: string; // YYYY-MM-DD (fecha focal para navegación temporal)
  startDate?: string;
  endDate?: string;
}

export interface CreditInstallment {
  id: string;
  userId?: string;
  nombre: string; // ej: "Cuota Moto", "Crédito Bancario"
  montoCuota: number;
  diaPago: 10 | 30 | number; // Días 10 y 30
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
  diferencia: number;
  porcentajeCobertura: number;
  estaCubierto: boolean;
  alertaVencimientoCercano: boolean;
  esHoy: boolean;
  cuotasAplicables: CreditInstallment[];
}

export interface FinancialSummary {
  ingresosTotales: number;
  ingresosOperativos: number; // Solo DOMICILIOS + PASAJEROS (excluye OTROS_INGRESOS)
  gastosTotales: number;
  gastosOperativos: number; // Gasolina, Mantenimiento, Acompañante
  gastosPersonales: number; // Alimentación, gastos discrecionales
  superavitNeto: number;
  saldoApp: number;
  efectivoEnMano: number;
  totalMinutosReparto: number;
  totalMinutosEspera: number;
  totalMinutosTrabajados: number;
  ratioProductividad: number;
  kilometrosTotales: number;
  // Métricas horarias inequívocas (con null si horas == 0 para 'No disponible'):
  facturacionBrutaPorHora: number | null; // ingresos / horas
  rendimientoOperativoPorHora: number | null; // (ingresos - costos directos ruta) / horas
  flujoNetoPorHora: number | null; // superavit neto / horas
  rendimientoPorHora: number; // compatibilidad regresiva
  rendimientoPorKm: number | null; // ingresos operativos / km (null si km == 0)
  totalTransacciones: number;
  totalTurnos: number;
}

export interface UserProfile {
  id: string;
  nombre: string;
  email?: string;
  avatarColor: string;
  rol?: string; // ej: "Repartidor Principal", "Mensajero", "Familiar"
  pin?: string;
  createdAt: string;
}

export interface UserApp {
  id: string;
  userId: string;
  nombre: string;
  tipo: 'DOMICILIOS' | 'PASAJEROS';
  color: string;
  icono?: string;
  activa: boolean;
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

export interface SyncQueueItem {
  id: string;
  entity: 'shifts' | 'transactions' | 'credits' | 'apps';
  action: 'insert' | 'update' | 'delete';
  payload: any;
  timestamp: number;
}

export type ThemeMode = 'dark' | 'light';

// ==============================================================================
// TIPOS PARA COPILOTO FINANCIERO Y PRODUCTIVIDAD (RIDERLEDGER 3.0)
// ==============================================================================

export interface CreditCardAccount {
  id: string;
  userId?: string;
  nombre: string; // ej: "Bancolombia Mastercard", "Nu"
  cupoTotal: number;
  saldoUtilizado: number;
  fechaCorte: number; // día del mes (1..31)
  fechaPago: number; // día del mes (1..31)
  pagoMinimo: number;
  pagoTotalEsperado?: number;
  tasaInteresEA?: number; // Tasa Efectiva Anual en % (opcional, ej: 25.4)
  cuotaMes?: number;
  bancoEntidad?: string;
  ultimosDigitos?: string;
  notas?: string;
  estado?: 'AL_DIA' | 'EN_ALERTA' | 'SOBREGIRO';
}

export interface CreditCardAnalysis {
  tarjetas: CreditCardAccount[];
  deudaTotalTarjetas: number;
  cupoTotalTarjetas: number;
  cupoDisponibleTotal: number;
  utilizacionGlobalPct: number;
  semaforoUtilizacion: 'VERDE' | 'AMARILLO' | 'ROJO';
  pagoMinimoTotal: number;
  pagoCompletoTotal: number;
  advertenciaPagoMinimo: string;
}

export interface FinancialSettings {
  // Salario mínimo de referencia Colombia 2026 (Decreto 1469/2025 - Decreto 159/2026)
  metaIngresoMinimoMensual: number; // Default: 1750905
  horasSemanalesReferencia: number; // Default: 42 (Ley 2101 de 2021)
  horasMensualesReferencia: number; // Default: 182 (42 * 52 / 12)
  metaIngresoHoraReferencia: number; // Default: 9620 (1750905 / 182)
  metaAhorroMensual: number; // Default: 300000
  metaFondoEmergenciaMeses: number; // Default: 3 (3 a 6 meses de gastos esenciales)
  limiteUtilizacionCreditoPct: number; // Default: 30 (%)
  porcentajeNecesidadesRef: number; // Default: 50 (%)
  porcentajeDeseosRef: number; // Default: 30 (%)
  porcentajeAhorroDeudaRef: number; // Default: 20 (%)
  metaGastoCombustibleMaxPct: number; // Default: 25 (%)
}

export interface ThreeTierFinancials {
  // Nivel A: Operativo (¿El trabajo de repartir es rentable?)
  ingresosOperativos: number;
  gastosOperativos: number;
  resultadoOperativo: number;
  margenOperativoPct: number;

  // Nivel B: Después de obligaciones (¿Cuánto queda tras pagar deudas del período?)
  pagosDeudaEfectivosPeriodo: number; // Pagos reales realizados en el período filtrado
  obligacionesMensualesPactadas: number; // Cuotas pactadas del mes (para planificación)
  cuotasCreditosMes: number;
  pagosTarjetasMes: number;
  totalObligacionesDeuda: number;
  resultadoDespuesObligaciones: number; // resultadoOperativo - pagosDeudaEfectivosPeriodo

  // Nivel C: Flujo de caja disponible (Libre para ahorro, abonos o imprevistos)
  flujoDisponible: number; // resultadoDespuesObligaciones + otrosIngresos - gastosPersonales
  otrosIngresos: number;
  gastosPersonales: number;
  efectivoEnMano: number;
  saldoApp: number;
}

export type LaborOverloadStatus = 'NORMAL' | 'ALTA' | 'MUY_ALTA' | 'CRITICA';

export interface LaborHealthMetrics {
  horasTotalesTrabajadas: number;
  horasRepartoActivo: number;
  horasEspera: number;
  porcentajeReferenciaMensual: number;
  horasAdicionalesSobreReferencia: number;
  ingresoNetoEfectivoPorHora: number; // superávit operativo / horas totales
  ingresoBrutoPorHora: number;
  flujoDisponiblePorHora: number; // flujo disponible / horas totales
  referenciaHora: number;
  cumpleMetaHora: boolean;
  cumpleMetaMensual: boolean;
  ingresoMensualProyectado: number;
  diferenciaMetaMensual: number;
  porcentajeCumplimientoMetaMensual: number;
  estadoCargaLaboral: LaborOverloadStatus;
  rendimientoMarginalDecreciente: boolean; // detecta si horas suben pero $/h cae
  explicacionLaboral: string;
  recomendacionLaboral: string;
}

export interface PeriodComparisonResult {
  periodoActualNombre: string;
  periodoAnteriorNombre: string;
  ingresosActual: number;
  ingresosAnterior: number;
  variacionIngresosPct: number;
  gastosActual: number;
  gastosAnterior: number;
  variacionGastosPct: number;
  superavitActual: number;
  superavitAnterior: number;
  variacionSuperavitPct: number;
  horasActual: number;
  horasAnterior: number;
  variacionHorasPct: number;
  ingresoHoraActual: number;
  ingresoHoraAnterior: number;
  variacionIngresoHoraPct: number;
  explicacionNarrativa: string;
}

export type ExpenseCategoryClassification =
  | 'PRODUCTIVO'
  | 'NECESARIO'
  | 'DISCRECIONAL'
  | 'POTENCIALMENTE_PROBLEMATICO'
  | 'FINANCIERO';

export interface ExpenseItemAnalysis {
  categoria: string;
  monto: number;
  porcentajeIngreso: number;
  porcentajeSuperavit: number;
  clasificacion: ExpenseCategoryClassification;
  clasificacionLabel: string;
  descripcion: string;
}

export interface ExpenseHealthAnalysis {
  items: ExpenseItemAnalysis[];
  totalGastos: number;
  ratioGastoIngresoPct: number;
  necesidadesTotal: number;
  deseosTotal: number;
  ahorroDeudaTotal: number;
  porcentajeNecesidadesReal: number;
  porcentajeDeseosReal: number;
  porcentajeAhorroDeudaReal: number;
  explicacion50_30_20: string;
  alertaGastos: string | null;
}

export interface SavingsAndEmergencyHealth {
  ahorroActualEstimado: number;
  gastosEsencialesMes: number;
  fondoEmergenciaMinimo: number; // 3 meses
  fondoEmergenciaRecomendado: number; // 6 meses
  porcentajeFondoCubierto: number;
  mesesCoberturaActual: number;
  metaAhorroMensual: number;
  ahorroMesActual: number;
  porcentajeMetaAhorroMes: number;
  tiempoEstimadoMesesParaMeta: number;
}

export interface SaveVsPayRecommendation {
  prioridadPrincipal: 'CREAR_FONDO_EMERGENCIA' | 'ABONAR_DEUDA_INTERES_ALTO' | 'RESERVA_OBLIGACIONES' | 'EQUILIBRIO_AHORRO_ABONO' | 'DEFICIT_RECUPERAR_FLUJO';
  titulo: string;
  explicacion: string;
  montoRecomendadoAbono: number;
  montoRecomendadoAhorro: number;
  ahorroInteresEstimadoTexto?: string;
  resilienciaTexto: string;
  esDeficit?: boolean;
  tasaIncompleta?: boolean;
}

export interface ShiftGroupedPeriod {
  periodoKey: string; // ej: "2026-09", "2026-W37"
  periodoLabel: string; // ej: "Septiembre 2026"
  horasTotales: number;
  horasFormatted: string;
  kilometros: number;
  ingresos: number;
  gastosRuta: number;
  rendimientoOperativoHora: number | null;
  totalTurnos: number;
}

export interface DashboardInsight {
  id: string;
  tipo: 'positivo' | 'alerta' | 'peligro' | 'accion';
  badge: '🟢' | '🟡' | '🔴' | '💡';
  titulo: string;
  descripcion: string;
  accionSugerida?: string;
}

export interface CalendarPeriodBarItem {
  key: string;
  periodo: string; // ej: "Lun 07", "1", "Ene 2026"
  fechaISO?: string;
  Ingresos: number;
  Gastos: number;
  Superavit: number;
  Domicilios: number;
  Pasajeros: number;
  OtrosIngresos: number;
  Combustible: number;
  Acompanante: number;
  Alimentacion: number;
  Mantenimiento: number;
  OtrosGastos: number;
  CuotaCredito: number;
  sinActividad?: boolean;
}
