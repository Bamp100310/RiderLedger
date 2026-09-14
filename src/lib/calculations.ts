import type {
  FinancialSummary,
  Shift,
  Transaction,
  TimeRange,
  CreditInstallment,
  CreditAnalysis,
  CreditCardAccount,
  CreditCardAnalysis,
  FinancialSettings,
  ThreeTierFinancials,
  LaborHealthMetrics,
  LaborOverloadStatus,
  PeriodComparisonResult,
  ExpenseHealthAnalysis,
  ExpenseItemAnalysis,
  ExpenseCategoryClassification,
  SavingsAndEmergencyHealth,
  SaveVsPayRecommendation,
  DashboardInsight,
  CalendarPeriodBarItem
} from '../types/index.ts';

/**
 * Formatea minutos a formato legible "Xh Ym" o "Ym", nunca decimales
 */
export function formatMinutes(totalMinutes: number): string {
  if (!totalMinutes || isNaN(totalMinutes) || totalMinutes <= 0) {
    return '0m';
  }
  const hours = Math.floor(totalMinutes / 60);
  const minutes = Math.round(totalMinutes % 60);

  if (hours > 0 && minutes > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (hours > 0) {
    return `${hours}h`;
  }
  return `${minutes}m`;
}

/**
 * Formatea minutos a formato "hh:mm"
 */
export function formatMinutesToHHMM(totalMinutes: number): string {
  if (!totalMinutes || isNaN(totalMinutes) || totalMinutes <= 0) {
    return '00:00';
  }
  const hours = Math.floor(totalMinutes / 60);
  const minutes = Math.round(totalMinutes % 60);
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

/**
 * Convierte horas y minutos a minutos totales
 */
export function toTotalMinutes(hours: number, minutes: number): number {
  return (Math.max(0, hours || 0) * 60) + Math.max(0, minutes || 0);
}

/**
 * Descompone minutos totales en { hours, minutes }
 */
export function fromTotalMinutes(totalMinutes: number): { hours: number; minutes: number } {
  const safeMin = Math.max(0, totalMinutes || 0);
  return {
    hours: Math.floor(safeMin / 60),
    minutes: Math.round(safeMin % 60)
  };
}

/**
 * Formateador de moneda adaptable y limpio
 */
export function formatCurrency(amount: number): string {
  const safeAmount = isNaN(amount) ? 0 : amount;
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
    minimumFractionDigits: 0
  }).format(safeAmount);
}

/**
 * Formateador de moneda corto (ej: $45k o $1.2M)
 */
export function formatCurrencyCompact(amount: number): string {
  const safe = isNaN(amount) ? 0 : amount;
  const abs = Math.abs(safe);
  const sign = safe < 0 ? '-' : '';

  if (abs >= 1_000_000) {
    return `${sign}$${(abs / 1_000_000).toFixed(1)}M`;
  }
  if (abs >= 1_000) {
    return `${sign}$${(abs / 1_000).toFixed(0)}k`;
  }
  return `${sign}$${abs.toLocaleString()}`;
}

/**
 * Configuración financiera de referencia por defecto para Colombia (2026)
 * Fuentes: Decreto 1469 de 2025 / Decreto 159 de 2026 (SMLMV $1.750.905), Ley 2101 de 2021 (42 h/semana)
 */
export const DEFAULT_FINANCIAL_SETTINGS: FinancialSettings = {
  metaIngresoMinimoMensual: 1750905, // SMLMV Colombia 2026
  horasSemanalesReferencia: 42, // Ley 2101 de 2021
  horasMensualesReferencia: 182, // (42 * 52) / 12 ≈ 182 horas
  metaIngresoHoraReferencia: 9620, // 1.750.905 / 182 ≈ 9.620 COP/h
  metaAhorroMensual: 300000,
  metaFondoEmergenciaMeses: 3, // Regla general 3-6 meses de gastos esenciales (CFPB/FDIC)
  limiteUtilizacionCreditoPct: 30, // Guía de salud crediticia (<30%)
  porcentajeNecesidadesRef: 50, // Regla presupuestaria de referencia 50/30/20
  porcentajeDeseosRef: 30,
  porcentajeAhorroDeudaRef: 20,
  metaGastoCombustibleMaxPct: 25
};

/**
 * Parsea una fecha en formato YYYY-MM-DD a las 12:00 del mediodía local
 * para evitar desfases de zona horaria o cambios de día por UTC medianoche.
 */
export function parseLocalDate(dateStr: string): Date {
  if (!dateStr) return new Date();
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]), 12, 0, 0);
  }
  return new Date(dateStr);
}

/**
 * Obtiene la fecha actual en formato local YYYY-MM-DD
 */
export function getLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Determina si una fecha está dentro del rango seleccionado
 */
export function isDateInRange(
  dateStr: string,
  range: TimeRange,
  customStart?: string,
  customEnd?: string
): boolean {
  if (!dateStr) return false;
  if (range === 'historico') return true;

  const todayStr = getLocalDateString();
  
  if (range === 'hoy') {
    return dateStr === todayStr;
  }

  const targetDate = new Date(`${dateStr}T00:00:00`);
  const now = new Date();
  
  if (range === 'semana') {
    // Lunes de la semana actual
    const currentDay = now.getDay();
    const distanceToMonday = currentDay === 0 ? 6 : currentDay - 1;
    const monday = new Date(now);
    monday.setDate(now.getDate() - distanceToMonday);
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    return targetDate >= monday && targetDate <= sunday;
  }

  if (range === 'mes') {
    // Primer y último día del mes actual
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    return targetDate >= startOfMonth && targetDate <= endOfMonth;
  }

  if (range === 'personalizado' && customStart && customEnd) {
    const start = new Date(`${customStart}T00:00:00`);
    const end = new Date(`${customEnd}T23:59:59`);
    return targetDate >= start && targetDate <= end;
  }

  return true;
}

/**
 * Calcula todas las métricas financieras y operativas del negocio
 */
export function calculateFinancialSummary(
  shifts: Shift[],
  transactions: Transaction[]
): FinancialSummary {
  let ingresosTotales = 0;
  let ingresosOperativos = 0; // Solo DOMICILIOS + PASAJEROS (excluye OTROS_INGRESOS)
  let gastosTotales = 0;
  let saldoAppTarifasPropinas = 0;
  let cobrosEfectivoApp = 0;
  let ingresosEfectivo = 0;
  let gastosEfectivo = 0;

  for (const t of transactions) {
    const monto = Number(t.monto) || 0;

    if (t.tipo === 'INGRESO') {
      ingresosTotales += monto;

      // Ingresos operativos: solo domicilios y pasajeros (excluye OTROS_INGRESOS)
      if (t.categoria === 'DOMICILIOS' || t.categoria === 'PASAJEROS') {
        ingresosOperativos += monto;
      }

      // Si el ingreso se registró a través de la App
      if (t.medio_pago === 'APP') {
        saldoAppTarifasPropinas += monto;
      } else if (t.medio_pago === 'EFECTIVO') {
        ingresosEfectivo += monto;
      }
    } else if (t.tipo === 'GASTO') {
      gastosTotales += monto;

      if (t.medio_pago === 'EFECTIVO') {
        gastosEfectivo += monto;
      }
    } else if (t.tipo === 'COBRO_EFECTIVO_APP') {
      // Dinero cobrado en efectivo al cliente por pedido de App.
      // Entra al bolsillo físico del repartidor, pero crea deuda con la plataforma.
      cobrosEfectivoApp += monto;
      ingresosEfectivo += monto;
    }
  }

  // Métricas Operativas de Turnos
  let totalMinutosReparto = 0;
  let totalMinutosEspera = 0;
  let kilometrosTotales = 0;

  for (const s of shifts) {
    totalMinutosReparto += Number(s.tiempo_reparto_minutos) || 0;
    totalMinutosEspera += Number(s.tiempo_espera_minutos) || 0;
    kilometrosTotales += Number(s.kilometros) || 0;
  }

  const totalMinutosTrabajados = totalMinutosReparto + totalMinutosEspera;
  const ratioProductividad = totalMinutosTrabajados > 0
    ? (totalMinutosReparto / totalMinutosTrabajados) * 100
    : 0;

  // Fórmulas requeridas
  // 1. Superávit Neto = Ingresos Brutos Totales - Gastos Totales
  const superavitNeto = ingresosTotales - gastosTotales;

  // 2. Saldo App = (Tarifas + Propinas en App) - Cobros Efectivo App
  // Positivo: Plataforma le debe al repartidor. Negativo: Repartidor le debe a la plataforma.
  const saldoApp = saldoAppTarifasPropinas - cobrosEfectivoApp;

  // 3. Efectivo en Mano Físico = Sum(Ingresos y Cobros en Efectivo) - Sum(Gastos en Efectivo)
  const efectivoEnMano = ingresosEfectivo - gastosEfectivo;

  // 4. Rendimiento por hora = Ingresos OPERATIVOS / Horas Totales
  //    (excluye OTROS_INGRESOS para no inflar la productividad real)
  const totalHoras = totalMinutosTrabajados / 60;
  const rendimientoPorHora = totalHoras > 0 ? ingresosOperativos / totalHoras : 0;

  // 5. Rendimiento por km = Ingresos OPERATIVOS / Kilómetros Totales
  //    (excluye OTROS_INGRESOS para no inflar la productividad real)
  const rendimientoPorKm = kilometrosTotales > 0 ? ingresosOperativos / kilometrosTotales : 0;

  return {
    ingresosTotales,
    ingresosOperativos,
    gastosTotales,
    superavitNeto,
    saldoApp,
    efectivoEnMano,
    totalMinutosReparto,
    totalMinutosEspera,
    totalMinutosTrabajados,
    ratioProductividad,
    kilometrosTotales,
    rendimientoPorHora,
    rendimientoPorKm,
    totalTransacciones: transactions.length,
    totalTurnos: shifts.length
  };
}

/**
 * Reporte agrupado para la tabla de consolidación mensual y semanal
 */
export interface ConsolidatedPeriodReport {
  periodo: string; // ej: "Semana 38 (11/09 - 17/09)" o "Septiembre 2026"
  key: string;
  domicilios: number;
  pasajeros: number;
  otrosIngresos: number;
  totalIngresos: number;
  gasolina: number;
  acompanante: number;
  otrosGastos: number;
  totalGastos: number;
  superavit: number;
  minutosReparto: number;
  minutosEspera: number;
  kilometros: number;
  rendimientoHora: number;
}

/**
 * Genera el consolidado semanal o mensual
 */
export function generateConsolidatedReport(
  shifts: Shift[],
  transactions: Transaction[],
  groupBy: 'dia' | 'semana' | 'mes'
): ConsolidatedPeriodReport[] {
  const map = new Map<string, {
    label: string;
    domicilios: number;
    pasajeros: number;
    otrosIngresos: number;
    gasolina: number;
    acompanante: number;
    otrosGastos: number;
    minutosReparto: number;
    minutosEspera: number;
    kilometros: number;
  }>();

  // Función para obtener la clave de grupo
  const getGroupKey = (dateStr: string): { key: string; label: string } => {
    const d = new Date(`${dateStr}T00:00:00`);
    if (groupBy === 'dia') {
      const parts = dateStr.split('-');
      const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
      const dayName = days[d.getDay()];
      const formattedDay = parts.length === 3 ? `${parts[2]}/${parts[1]}` : dateStr;
      return {
        key: dateStr,
        label: `${dayName} ${formattedDay}`
      };
    } else if (groupBy === 'mes') {
      const year = d.getFullYear();
      const month = d.getMonth();
      const monthNames = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
      ];
      return {
        key: `${year}-${String(month + 1).padStart(2, '0')}`,
        label: `${monthNames[month]} ${year}`
      };
    } else {
      // Semana ISO
      const temp = new Date(d.valueOf());
      const dayNum = (d.getDay() + 6) % 7;
      temp.setDate(temp.getDate() - dayNum + 3);
      const firstThursday = temp.valueOf();
      temp.setMonth(0, 1);
      if (temp.getDay() !== 4) {
        temp.setMonth(0, 1 + ((4 - temp.getDay()) + 7) % 7);
      }
      const weekNum = 1 + Math.ceil((firstThursday - temp.valueOf()) / 604800000);
      const year = d.getFullYear();
      
      // Fechas de inicio y fin de la semana
      const monday = new Date(d);
      monday.setDate(d.getDate() - dayNum);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      
      const formatShort = (dt: Date) => `${dt.getDate()}/${dt.getMonth() + 1}`;
      return {
        key: `${year}-W${String(weekNum).padStart(2, '0')}`,
        label: `Sem. ${weekNum} (${formatShort(monday)} - ${formatShort(sunday)})`
      };
    }
  };

  const getOrCreate = (key: string, label: string) => {
    if (!map.has(key)) {
      map.set(key, {
        label,
        domicilios: 0,
        pasajeros: 0,
        otrosIngresos: 0,
        gasolina: 0,
        acompanante: 0,
        otrosGastos: 0,
        minutosReparto: 0,
        minutosEspera: 0,
        kilometros: 0
      });
    }
    return map.get(key)!;
  };

  // Procesar transacciones
  for (const t of transactions) {
    if (!t.fecha) continue;
    const { key, label } = getGroupKey(t.fecha);
    const item = getOrCreate(key, label);
    const monto = Number(t.monto) || 0;

    if (t.tipo === 'INGRESO') {
      if (t.categoria === 'DOMICILIOS') {
        item.domicilios += monto;
      } else if (t.categoria === 'PASAJEROS') {
        item.pasajeros += monto;
      } else {
        item.otrosIngresos += monto;
      }
    } else if (t.tipo === 'GASTO') {
      if (t.categoria === 'COMBUSTIBLE' || (t.subcategoria && t.subcategoria.toLowerCase().includes('gasolina'))) {
        item.gasolina += monto;
      } else if (
        t.categoria === 'HONORARIOS_ACOMPANANTE' ||
        (t.subcategoria && (t.subcategoria.toLowerCase().includes('acompañante') || t.subcategoria.toLowerCase().includes('jhony')))
      ) {
        item.acompanante += monto;
      } else {
        item.otrosGastos += monto;
      }
    }
  }

  // Procesar turnos
  for (const s of shifts) {
    if (!s.fecha) continue;
    const { key, label } = getGroupKey(s.fecha);
    const item = getOrCreate(key, label);
    item.minutosReparto += Number(s.tiempo_reparto_minutos) || 0;
    item.minutosEspera += Number(s.tiempo_espera_minutos) || 0;
    item.kilometros += Number(s.kilometros) || 0;
  }

  // Convertir a lista y ordenar por fecha descendente
  const result: ConsolidatedPeriodReport[] = [];
  for (const [key, data] of map.entries()) {
    const totalIngresos = data.domicilios + data.pasajeros + data.otrosIngresos;
    const totalGastos = data.gasolina + data.acompanante + data.otrosGastos;
    const superavit = totalIngresos - totalGastos;
    const totalHoras = (data.minutosReparto + data.minutosEspera) / 60;
    const rendimientoHora = totalHoras > 0 ? totalIngresos / totalHoras : 0;

    result.push({
      periodo: data.label,
      key,
      domicilios: data.domicilios,
      pasajeros: data.pasajeros,
      otrosIngresos: data.otrosIngresos,
      totalIngresos,
      gasolina: data.gasolina,
      acompanante: data.acompanante,
      otrosGastos: data.otrosGastos,
      totalGastos,
      superavit,
      minutosReparto: data.minutosReparto,
      minutosEspera: data.minutosEspera,
      kilometros: data.kilometros,
      rendimientoHora
    });
  }

  return result.sort((a, b) => b.key.localeCompare(a.key));
}

/**
 * Exporta el reporte consolidado a formato CSV
 */
export function exportToCSV(reports: ConsolidatedPeriodReport[]): void {
  const headers = [
    'Periodo',
    'Domicilios ($)',
    'Pasajeros ($)',
    'Otros Ingresos ($)',
    'Total Ingresos ($)',
    'Gasolina ($)',
    'Acompañante Jhony ($)',
    'Otros Gastos ($)',
    'Total Gastos ($)',
    'Superavit ($)',
    'Tiempo Reparto',
    'Tiempo Espera',
    'Total Horas',
    'Kilometros (Km)',
    'Rendimiento ($/h)'
  ];

  const rows = reports.map(r => [
    `"${r.periodo}"`,
    r.domicilios,
    r.pasajeros,
    r.otrosIngresos,
    r.totalIngresos,
    r.gasolina,
    r.acompanante,
    r.otrosGastos,
    r.totalGastos,
    r.superavit,
    `"${formatMinutes(r.minutosReparto)}"`,
    `"${formatMinutes(r.minutosEspera)}"`,
    `"${formatMinutes(r.minutosReparto + r.minutosEspera)}"`,
    r.kilometros.toFixed(1),
    Math.round(r.rendimientoHora)
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `RiderLedger_Reporte_${getLocalDateString()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Calcula el análisis de cobertura de cuotas de crédito para los días 10 y 30 de cada mes
 */
export function calculateCreditAnalysis(
  credits: CreditInstallment[],
  currentSurplus: number,
  referenceDate: Date = new Date()
): CreditAnalysis {
  const day = referenceDate.getDate();
  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth();

  // Determinar si el próximo corte es el día 10 o el día 30
  let nextDueDay: number;
  let nextDueDate: Date;

  if (day <= 10) {
    nextDueDay = 10;
    nextDueDate = new Date(year, month, 10);
  } else if (day <= 30) {
    nextDueDay = 30;
    const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
    const actualDay = Math.min(30, lastDayOfMonth);
    nextDueDate = new Date(year, month, actualDay);
  } else {
    nextDueDay = 10;
    nextDueDate = new Date(year, month + 1, 10);
  }

  const oneDayMs = 24 * 60 * 60 * 1000;
  const todayOnly = new Date(year, month, day);
  const diffTime = nextDueDate.getTime() - todayOnly.getTime();
  const diasRestantes = Math.max(0, Math.ceil(diffTime / oneDayMs));

  // Filtrar cuotas aplicables para ese día de pago
  const currentMonthStr = `${year}-${String(month + 1).padStart(2, '0')}`;
  const cuotasAplicables = credits.filter(c => {
    if (nextDueDay === 10) {
      return c.diaPago <= 15;
    } else {
      return c.diaPago > 15;
    }
  });

  const totalCuotasPendientes = cuotasAplicables
    .filter(c => !(c.pagadoEsteMes && c.ultimoMesPagado === currentMonthStr))
    .reduce((sum, c) => sum + (Number(c.montoCuota) || 0), 0);

  const diferencia = currentSurplus - totalCuotasPendientes;
  const porcentajeCobertura = totalCuotasPendientes > 0
    ? Math.min(999, Math.round((Math.max(0, currentSurplus) / totalCuotasPendientes) * 100))
    : 100;

  const estaCubierto = diferencia >= 0 && totalCuotasPendientes > 0;
  const esHoy = diasRestantes === 0;
  const alertaVencimientoCercano = diasRestantes <= 3;

  const monthStr = String(nextDueDate.getMonth() + 1).padStart(2, '0');
  const dayStr = String(nextDueDate.getDate()).padStart(2, '0');
  const proximaFechaCompleta = `${nextDueDate.getFullYear()}-${monthStr}-${dayStr}`;

  return {
    proximoDiaPago: nextDueDay,
    proximaFechaCompleta,
    diasRestantes,
    totalCuotasPendientes,
    superavitActual: currentSurplus,
    diferencia,
    porcentajeCobertura,
    estaCubierto,
    alertaVencimientoCercano,
    esHoy,
    cuotasAplicables
  };
}

// ==========================================
// CÁLCULOS ANALÍTICOS PARA EL DASHBOARD 2.0
// ==========================================

export type StackedBarItem = CalendarPeriodBarItem;

/**
 * Crea un item vacío para las gráficas de período con valores en 0
 */
export function createEmptyCalendarPeriodBarItem(key: string, periodo: string, fechaISO?: string): CalendarPeriodBarItem {
  return {
    key,
    periodo,
    fechaISO,
    Ingresos: 0,
    Gastos: 0,
    Superavit: 0,
    Domicilios: 0,
    Pasajeros: 0,
    OtrosIngresos: 0,
    Combustible: 0,
    Acompanante: 0,
    Alimentacion: 0,
    Mantenimiento: 0,
    OtrosGastos: 0,
    CuotaCredito: 0,
    sinActividad: true
  };
}

/**
 * Genera la visualización semanal ESTRICTA: Lunes a Domingo (7 días completos).
 * Los días sin actividad aparecen con valor 0.
 */
export function getCalendarWeekFinancialData(
  transactions: Transaction[],
  referenceDate: Date = new Date()
): CalendarPeriodBarItem[] {
  const ref = new Date(referenceDate);
  ref.setHours(12, 0, 0, 0);

  // Lunes de la semana de referencia
  const dayOfWeek = ref.getDay(); // 0 = Domingo, 1 = Lunes, ... 6 = Sábado
  const distToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const monday = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate() - distToMonday, 12, 0, 0);

  const dayNames = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
  const weekItems: CalendarPeriodBarItem[] = [];

  for (let i = 0; i < 7; i++) {
    const d = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i, 12, 0, 0);
    const dateStr = getLocalDateString(d);
    const dayNum = String(d.getDate()).padStart(2, '0');
    const label = `${dayNames[i]} ${dayNum}`;

    const item = createEmptyCalendarPeriodBarItem(dateStr, label, dateStr);

    const dayTx = transactions.filter(t => t.fecha === dateStr);
    if (dayTx.length > 0) {
      item.sinActividad = false;
      for (const t of dayTx) {
        const monto = Number(t.monto) || 0;
        if (t.tipo === 'INGRESO') {
          item.Ingresos += monto;
          if (t.categoria === 'DOMICILIOS') item.Domicilios += monto;
          else if (t.categoria === 'PASAJEROS') item.Pasajeros += monto;
          else item.OtrosIngresos += monto;
        } else if (t.tipo === 'GASTO') {
          item.Gastos += monto;
          if (t.categoria === 'COMBUSTIBLE') item.Combustible += monto;
          else if (
            t.categoria === 'HONORARIOS_ACOMPANANTE' ||
            (t.subcategoria && (t.subcategoria.toLowerCase().includes('acompañante') || t.subcategoria.toLowerCase().includes('jhony')))
          ) item.Acompanante += monto;
          else if (t.categoria === 'ALIMENTACION') item.Alimentacion += monto;
          else if (t.categoria === 'MANTENIMIENTO_MOTO') item.Mantenimiento += monto;
          else if (t.categoria === 'CUOTA_CREDITO') item.CuotaCredito += monto;
          else item.OtrosGastos += monto;
        }
      }
      item.Superavit = item.Ingresos - item.Gastos;
    }

    weekItems.push(item);
  }

  return weekItems;
}

/**
 * Genera la visualización mensual ESTRICTA: Días 1 al 28/29/30/31 del mes.
 * Los días sin actividad aparecen con valor 0.
 */
export function getCalendarMonthFinancialData(
  transactions: Transaction[],
  year?: number,
  month?: number // 0 = Enero, 11 = Diciembre
): CalendarPeriodBarItem[] {
  const now = new Date();
  const targetYear = year ?? now.getFullYear();
  const targetMonth = month ?? now.getMonth();

  // Días totales del mes (respeta años bisiestos y meses de 28, 29, 30, 31 días)
  const daysInMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
  const monthItems: CalendarPeriodBarItem[] = [];

  for (let d = 1; d <= daysInMonth; d++) {
    const dateObj = new Date(targetYear, targetMonth, d, 12, 0, 0);
    const dateStr = getLocalDateString(dateObj);
    const label = `${d}`;

    const item = createEmptyCalendarPeriodBarItem(dateStr, label, dateStr);
    const dayTx = transactions.filter(t => t.fecha === dateStr);

    if (dayTx.length > 0) {
      item.sinActividad = false;
      for (const t of dayTx) {
        const monto = Number(t.monto) || 0;
        if (t.tipo === 'INGRESO') {
          item.Ingresos += monto;
          if (t.categoria === 'DOMICILIOS') item.Domicilios += monto;
          else if (t.categoria === 'PASAJEROS') item.Pasajeros += monto;
          else item.OtrosIngresos += monto;
        } else if (t.tipo === 'GASTO') {
          item.Gastos += monto;
          if (t.categoria === 'COMBUSTIBLE') item.Combustible += monto;
          else if (
            t.categoria === 'HONORARIOS_ACOMPANANTE' ||
            (t.subcategoria && (t.subcategoria.toLowerCase().includes('acompañante') || t.subcategoria.toLowerCase().includes('jhony')))
          ) item.Acompanante += monto;
          else if (t.categoria === 'ALIMENTACION') item.Alimentacion += monto;
          else if (t.categoria === 'MANTENIMIENTO_MOTO') item.Mantenimiento += monto;
          else if (t.categoria === 'CUOTA_CREDITO') item.CuotaCredito += monto;
          else item.OtrosGastos += monto;
        }
      }
      item.Superavit = item.Ingresos - item.Gastos;
    }

    monthItems.push(item);
  }

  return monthItems;
}

/**
 * Agrupa todos los meses históricos registrados en la aplicación
 */
export function getHistoricalMonthsFinancialData(transactions: Transaction[]): CalendarPeriodBarItem[] {
  if (!transactions || transactions.length === 0) {
    const now = new Date();
    const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    return [createEmptyCalendarPeriodBarItem(getLocalDateString(now).slice(0, 7), `${monthNames[now.getMonth()]} ${now.getFullYear()}`)];
  }

  const map = new Map<string, CalendarPeriodBarItem>();
  const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

  const sorted = [...transactions].sort((a, b) => a.fecha.localeCompare(b.fecha));

  for (const t of sorted) {
    const parts = t.fecha.split('-');
    if (parts.length < 2) continue;
    const yMonth = `${parts[0]}-${parts[1]}`;
    const mIndex = Number(parts[1]) - 1;
    const label = `${monthNames[mIndex] || parts[1]} ${parts[0]}`;

    if (!map.has(yMonth)) {
      map.set(yMonth, createEmptyCalendarPeriodBarItem(yMonth, label));
    }

    const item = map.get(yMonth)!;
    item.sinActividad = false;
    const monto = Number(t.monto) || 0;

    if (t.tipo === 'INGRESO') {
      item.Ingresos += monto;
      if (t.categoria === 'DOMICILIOS') item.Domicilios += monto;
      else if (t.categoria === 'PASAJEROS') item.Pasajeros += monto;
      else item.OtrosIngresos += monto;
    } else if (t.tipo === 'GASTO') {
      item.Gastos += monto;
      if (t.categoria === 'COMBUSTIBLE') item.Combustible += monto;
      else if (
        t.categoria === 'HONORARIOS_ACOMPANANTE' ||
        (t.subcategoria && (t.subcategoria.toLowerCase().includes('acompañante') || t.subcategoria.toLowerCase().includes('jhony')))
      ) item.Acompanante += monto;
      else if (t.categoria === 'ALIMENTACION') item.Alimentacion += monto;
      else if (t.categoria === 'MANTENIMIENTO_MOTO') item.Mantenimiento += monto;
      else if (t.categoria === 'CUOTA_CREDITO') item.CuotaCredito += monto;
      else item.OtrosGastos += monto;
    }
    item.Superavit = item.Ingresos - item.Gastos;
  }

  return Array.from(map.values());
}

/**
 * Función central unificada para generar datos de gráficas financieras según el período.
 * Reemplaza los slices ad-hoc y garantiza consistencia de calendario en toda la app.
 */
export function getPeriodFinancialChartData(
  transactions: Transaction[],
  range: TimeRange,
  historicalGranularity: 'dia' | 'semana' | 'mes' = 'dia',
  referenceDate: Date = new Date()
): CalendarPeriodBarItem[] {
  if (range === 'semana') {
    return getCalendarWeekFinancialData(transactions, referenceDate);
  }

  if (range === 'mes') {
    return getCalendarMonthFinancialData(transactions, referenceDate.getFullYear(), referenceDate.getMonth());
  }

  if (range === 'historico') {
    if (historicalGranularity === 'mes') {
      return getHistoricalMonthsFinancialData(transactions);
    }
    if (historicalGranularity === 'semana') {
      // Agrupar por semanas ISO cronológicas
      const map = new Map<string, CalendarPeriodBarItem>();
      const sorted = [...transactions].sort((a, b) => a.fecha.localeCompare(b.fecha));
      for (const t of sorted) {
        const d = parseLocalDate(t.fecha);
        const dayNum = (d.getDay() + 6) % 7;
        const monday = new Date(d);
        monday.setDate(d.getDate() - dayNum);
        const monStr = `${monday.getDate()}/${monday.getMonth() + 1}`;
        const key = getLocalDateString(monday);
        const label = `Sem. ${monStr}`;

        if (!map.has(key)) {
          map.set(key, createEmptyCalendarPeriodBarItem(key, label));
        }
        const item = map.get(key)!;
        item.sinActividad = false;
        const monto = Number(t.monto) || 0;
        if (t.tipo === 'INGRESO') {
          item.Ingresos += monto;
          if (t.categoria === 'DOMICILIOS') item.Domicilios += monto;
          else if (t.categoria === 'PASAJEROS') item.Pasajeros += monto;
          else item.OtrosIngresos += monto;
        } else if (t.tipo === 'GASTO') {
          item.Gastos += monto;
          if (t.categoria === 'COMBUSTIBLE') item.Combustible += monto;
          else if (
            t.categoria === 'HONORARIOS_ACOMPANANTE' ||
            (t.subcategoria && (t.subcategoria.toLowerCase().includes('acompañante') || t.subcategoria.toLowerCase().includes('jhony')))
          ) item.Acompanante += monto;
          else if (t.categoria === 'ALIMENTACION') item.Alimentacion += monto;
          else if (t.categoria === 'MANTENIMIENTO_MOTO') item.Mantenimiento += monto;
          else if (t.categoria === 'CUOTA_CREDITO') item.CuotaCredito += monto;
          else item.OtrosGastos += monto;
        }
        item.Superavit = item.Ingresos - item.Gastos;
      }
      return Array.from(map.values());
    }

    // Granularidad Día en histórico: todos los días con actividad
    const map = new Map<string, CalendarPeriodBarItem>();
    const sorted = [...transactions].sort((a, b) => a.fecha.localeCompare(b.fecha));
    const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

    for (const t of sorted) {
      const parts = t.fecha.split('-');
      if (parts.length !== 3) continue;
      const d = parseLocalDate(t.fecha);
      const label = `${dayNames[d.getDay()]} ${parts[2]}/${parts[1]}`;
      const key = t.fecha;

      if (!map.has(key)) {
        map.set(key, createEmptyCalendarPeriodBarItem(key, label, key));
      }
      const item = map.get(key)!;
      item.sinActividad = false;
      const monto = Number(t.monto) || 0;
      if (t.tipo === 'INGRESO') {
        item.Ingresos += monto;
        if (t.categoria === 'DOMICILIOS') item.Domicilios += monto;
        else if (t.categoria === 'PASAJEROS') item.Pasajeros += monto;
        else item.OtrosIngresos += monto;
      } else if (t.tipo === 'GASTO') {
        item.Gastos += monto;
        if (t.categoria === 'COMBUSTIBLE') item.Combustible += monto;
        else if (
          t.categoria === 'HONORARIOS_ACOMPANANTE' ||
          (t.subcategoria && (t.subcategoria.toLowerCase().includes('acompañante') || t.subcategoria.toLowerCase().includes('jhony')))
        ) item.Acompanante += monto;
        else if (t.categoria === 'ALIMENTACION') item.Alimentacion += monto;
        else if (t.categoria === 'MANTENIMIENTO_MOTO') item.Mantenimiento += monto;
        else if (t.categoria === 'CUOTA_CREDITO') item.CuotaCredito += monto;
        else item.OtrosGastos += monto;
      }
      item.Superavit = item.Ingresos - item.Gastos;
    }
    return Array.from(map.values());
  }

  // Por defecto (hoy o personalizado)
  return getCalendarWeekFinancialData(transactions, referenceDate);
}

/**
 * Wrapper de compatibilidad hacia atrás para componentes existentes
 */
export function getStackedFinancialData(
  transactions: Transaction[],
  range: TimeRange
): StackedBarItem[] {
  return getPeriodFinancialChartData(transactions, range, 'dia');
}

/**
 * Compara dos períodos financieros y genera variaciones porcentuales y explicación humana
 */
export function comparePeriods(
  currentTx: Transaction[],
  previousTx: Transaction[],
  currentShifts: Shift[] = [],
  previousShifts: Shift[] = [],
  periodName: string = 'período'
): PeriodComparisonResult {
  const sumMonto = (txs: Transaction[], tipo: 'INGRESO' | 'GASTO') =>
    txs.filter(t => t.tipo === tipo).reduce((sum, t) => sum + (Number(t.monto) || 0), 0);

  const sumMinutos = (sfts: Shift[]) =>
    sfts.reduce((sum, s) => sum + (Number(s.tiempo_reparto_minutos) || 0) + (Number(s.tiempo_espera_minutos) || 0), 0);

  const ingresosActual = sumMonto(currentTx, 'INGRESO');
  const ingresosAnterior = sumMonto(previousTx, 'INGRESO');
  const gastosActual = sumMonto(currentTx, 'GASTO');
  const gastosAnterior = sumMonto(previousTx, 'GASTO');

  const superavitActual = ingresosActual - gastosActual;
  const superavitAnterior = ingresosAnterior - gastosAnterior;

  const horasActual = sumMinutos(currentShifts) / 60;
  const horasAnterior = sumMinutos(previousShifts) / 60;

  const ingresoHoraActual = horasActual > 0 ? superavitActual / horasActual : 0;
  const ingresoHoraAnterior = horasAnterior > 0 ? superavitAnterior / horasAnterior : 0;

  const calcPct = (curr: number, prev: number): number => {
    if (prev === 0) return curr > 0 ? 100 : 0;
    return +(((curr - prev) / Math.abs(prev)) * 100).toFixed(1);
  };

  const variacionIngresosPct = calcPct(ingresosActual, ingresosAnterior);
  const variacionGastosPct = calcPct(gastosActual, gastosAnterior);
  const variacionSuperavitPct = calcPct(superavitActual, superavitAnterior);
  const variacionHorasPct = calcPct(horasActual, horasAnterior);
  const variacionIngresoHoraPct = calcPct(ingresoHoraActual, ingresoHoraAnterior);

  // Generación de narrativa humana explicativa
  let explicacionNarrativa = '';
  if (previousTx.length === 0 && previousShifts.length === 0) {
    explicacionNarrativa = `Este es tu primer período con actividad registrada (${periodName}). Se usará como línea base para comparar tu evolución futura.`;
  } else if (variacionIngresosPct > 0 && variacionGastosPct > variacionIngresosPct) {
    explicacionNarrativa = `Tus ingresos aumentaron ${Math.abs(variacionIngresosPct)}% respecto al ${periodName} anterior, pero tus gastos crecieron ${Math.abs(variacionGastosPct)}%, por lo que tu superávit neto cayó un ${Math.abs(variacionSuperavitPct)}%.`;
  } else if (variacionIngresosPct > 0 && variacionGastosPct <= variacionIngresosPct) {
    explicacionNarrativa = `Tus ingresos crecieron ${Math.abs(variacionIngresosPct)}% manteniendo los gastos bajo control (+${Math.max(0, variacionGastosPct)}%), logrando un superávit ${Math.abs(variacionSuperavitPct)}% superior.`;
  } else if (variacionIngresosPct <= 0 && variacionGastosPct < 0) {
    explicacionNarrativa = `Tus ingresos disminuyeron ${Math.abs(variacionIngresosPct)}%, pero lograste amortiguar el impacto recortando gastos un ${Math.abs(variacionGastosPct)}%.`;
  } else {
    explicacionNarrativa = `Tus ingresos disminuyeron ${Math.abs(variacionIngresosPct)}% mientras que tus gastos aumentaron ${Math.abs(variacionGastosPct)}%. Tu margen libre se redujo significativamente.`;
  }

  return {
    periodoActualNombre: `Actual (${periodName})`,
    periodoAnteriorNombre: `Anterior (${periodName})`,
    ingresosActual,
    ingresosAnterior,
    variacionIngresosPct,
    gastosActual,
    gastosAnterior,
    variacionGastosPct,
    superavitActual,
    superavitAnterior,
    variacionSuperavitPct,
    horasActual: +horasActual.toFixed(1),
    horasAnterior: +horasAnterior.toFixed(1),
    variacionHorasPct,
    ingresoHoraActual: Math.round(ingresoHoraActual),
    ingresoHoraAnterior: Math.round(ingresoHoraAnterior),
    variacionIngresoHoraPct,
    explicacionNarrativa
  };
}

/**
 * Calcula los 3 conceptos financieros fundamentales (Operativo, Después de Obligaciones, Flujo Disponible)
 */
export function calculateThreeTierFinancials(
  transactions: Transaction[],
  shifts: Shift[] = [],
  credits: CreditInstallment[] = [],
  cards: CreditCardAccount[] = []
): ThreeTierFinancials {
  let ingresosOperativos = 0;
  let otrosIngresos = 0;
  let gastosOperativos = 0;
  let otrosGastos = 0;
  let saldoAppTarifas = 0;
  let cobrosEfectivoApp = 0;
  let efectivoIngreso = 0;
  let efectivoGasto = 0;

  for (const t of transactions) {
    const monto = Number(t.monto) || 0;
    if (t.tipo === 'INGRESO') {
      if (t.categoria === 'DOMICILIOS' || t.categoria === 'PASAJEROS') {
        ingresosOperativos += monto;
      } else {
        otrosIngresos += monto;
      }

      if (t.medio_pago === 'APP') saldoAppTarifas += monto;
      if (t.medio_pago === 'EFECTIVO') efectivoIngreso += monto;
    } else if (t.tipo === 'GASTO') {
      if (t.categoria === 'CUOTA_CREDITO') {
        // Obligación de deuda
      } else if (['COMBUSTIBLE', 'MANTENIMIENTO_MOTO', 'ALIMENTACION', 'HONORARIOS_ACOMPANANTE'].includes(t.categoria)) {
        gastosOperativos += monto;
      } else {
        otrosGastos += monto;
      }

      if (t.medio_pago === 'EFECTIVO') efectivoGasto += monto;
    } else if (t.tipo === 'COBRO_EFECTIVO_APP') {
      cobrosEfectivoApp += monto;
      efectivoIngreso += monto;
    }
  }

  // Cuotas de créditos activos para el mes
  const cuotasCreditosMes = credits.reduce((sum, c) => sum + (Number(c.montoCuota) || 0), 0);
  const pagosTarjetasMes = cards.reduce((sum, card) => sum + (Number(card.pagoMinimo) || 0), 0);
  const totalObligacionesDeuda = cuotasCreditosMes + pagosTarjetasMes;

  // Nivel A: Resultado Operativo
  const resultadoOperativo = ingresosOperativos - gastosOperativos;
  const margenOperativoPct = ingresosOperativos > 0 ? Math.round((resultadoOperativo / ingresosOperativos) * 100) : 0;

  // Nivel B: Después de Obligaciones
  const resultadoDespuesObligaciones = resultadoOperativo - totalObligacionesDeuda;

  // Nivel C: Flujo Disponible
  const flujoDisponible = resultadoDespuesObligaciones + otrosIngresos - otrosGastos;
  const efectivoEnMano = efectivoIngreso - efectivoGasto;
  const saldoApp = saldoAppTarifas - cobrosEfectivoApp;

  return {
    ingresosOperativos,
    gastosOperativos,
    resultadoOperativo,
    margenOperativoPct,
    cuotasCreditosMes,
    pagosTarjetasMes,
    totalObligacionesDeuda,
    resultadoDespuesObligaciones,
    flujoDisponible,
    efectivoEnMano,
    saldoApp
  };
}

/**
 * Calcula las métricas de salud laboral comparadas contra benchmarks legales (42h / 182h y $1.750.905)
 */
export function calculateLaborBenchmark(
  shifts: Shift[],
  transactions: Transaction[],
  settings: FinancialSettings = DEFAULT_FINANCIAL_SETTINGS
): LaborHealthMetrics {
  let minutosReparto = 0;
  let minutosEspera = 0;
  for (const s of shifts) {
    minutosReparto += Number(s.tiempo_reparto_minutos) || 0;
    minutosEspera += Number(s.tiempo_espera_minutos) || 0;
  }

  const minutosTotales = minutosReparto + minutosEspera;
  const horasTotalesTrabajadas = +(minutosTotales / 60).toFixed(1);
  const horasRepartoActivo = +(minutosReparto / 60).toFixed(1);
  const horasEspera = +(minutosEspera / 60).toFixed(1);

  // Finanzas del período
  let ingresosOperativos = 0;
  let gastosTotales = 0;
  for (const t of transactions) {
    const monto = Number(t.monto) || 0;
    if (t.tipo === 'INGRESO' && (t.categoria === 'DOMICILIOS' || t.categoria === 'PASAJEROS')) {
      ingresosOperativos += monto;
    }
    if (t.tipo === 'GASTO') {
      gastosTotales += monto;
    }
  }
  const superavitNeto = ingresosOperativos - gastosTotales;

  const ingresoBrutoPorHora = horasTotalesTrabajadas > 0 ? Math.round(ingresosOperativos / horasTotalesTrabajadas) : 0;
  const ingresoNetoEfectivoPorHora = horasTotalesTrabajadas > 0 ? Math.round(superavitNeto / horasTotalesTrabajadas) : 0;
  const flujoDisponiblePorHora = ingresoNetoEfectivoPorHora; // aproximación operativa directa

  const refMensualHoras = settings.horasMensualesReferencia || 182;
  const refMinimoIngreso = settings.metaIngresoMinimoMensual || 1750905;
  const refHora = settings.metaIngresoHoraReferencia || 9620;

  const porcentajeReferenciaMensual = Math.round((horasTotalesTrabajadas / refMensualHoras) * 100);
  const horasAdicionalesSobreReferencia = Math.max(0, +(horasTotalesTrabajadas - refMensualHoras).toFixed(1));

  const cumpleMetaHora = ingresoNetoEfectivoPorHora >= refHora;
  const cumpleMetaMensual = superavitNeto >= refMinimoIngreso;
  const diferenciaMetaMensual = superavitNeto - refMinimoIngreso;
  const porcentajeCumplimientoMetaMensual = refMinimoIngreso > 0 ? Math.round((superavitNeto / refMinimoIngreso) * 100) : 0;

  // Detección de sobreexplotación y rendimiento marginal decreciente
  let estadoCargaLaboral: LaborOverloadStatus = 'NORMAL';
  let rendimientoMarginalDecreciente = false;

  if (horasTotalesTrabajadas > refMensualHoras * 1.25 && ingresoNetoEfectivoPorHora < refHora) {
    estadoCargaLaboral = 'CRITICA';
    rendimientoMarginalDecreciente = true;
  } else if (horasTotalesTrabajadas > refMensualHoras * 1.15) {
    estadoCargaLaboral = 'MUY_ALTA';
    if (ingresoNetoEfectivoPorHora < refHora) rendimientoMarginalDecreciente = true;
  } else if (horasTotalesTrabajadas > refMensualHoras) {
    estadoCargaLaboral = 'ALTA';
  }

  // Generación de explicaciones que no diagnostican jurídicamente sino que guían financieramente
  let explicacionLaboral = '';
  let recomendacionLaboral = '';

  if (horasTotalesTrabajadas === 0) {
    explicacionLaboral = 'Aún no registras turnos u horas de jornada en este período.';
    recomendacionLaboral = 'Registra tus jornadas al finalizar el turno para calcular tu ingreso real por hora.';
  } else if (cumpleMetaMensual && cumpleMetaHora) {
    explicacionLaboral = `Superas la referencia de ingreso mínimo ($${formatCurrencyCompact(refMinimoIngreso)}) y tu ingreso por hora ($${formatCurrency(ingresoNetoEfectivoPorHora)}/h) supera la referencia horaria ($${formatCurrency(refHora)}/h).`;
    recomendacionLaboral = 'Excelente rendimiento. Tu tiempo en ruta está siendo altamente eficiente.';
  } else if (cumpleMetaMensual && !cumpleMetaHora) {
    explicacionLaboral = `Tus ingresos mensuales superan la referencia, pero para conseguirlos acumulaste ${horasTotalesTrabajadas}h (${porcentajeReferenciaMensual}% de la jornada ordinaria). Tu rendimiento horario ($${formatCurrency(ingresoNetoEfectivoPorHora)}/h) está por debajo de la referencia.`;
    recomendacionLaboral = 'Cuidado con la sobrecarga: aumentar horas en franjas de baja demanda reduce tu ganancia neta por hora trabajada.';
  } else if (!cumpleMetaMensual && cumpleMetaHora) {
    explicacionLaboral = `Tu ingreso por hora ($${formatCurrency(ingresoNetoEfectivoPorHora)}/h) es bueno, pero has trabajado pocas horas acumuladas (${horasTotalesTrabajadas}h de ${refMensualHoras}h).`;
    recomendacionLaboral = 'Si mantienes esta velocidad en más horas de alta demanda, alcanzarás fácilmente la meta mensual.';
  } else {
    explicacionLaboral = `Tu ingreso neto por hora ($${formatCurrency(ingresoNetoEfectivoPorHora)}/h) y tu acumulado mensual están por debajo de los valores de referencia ordinarios.`;
    recomendacionLaboral = 'Revisa tus costos de ruta (especialmente combustible) y prioriza las horas pico con mejor tarifa.';
  }

  return {
    horasTotalesTrabajadas,
    horasRepartoActivo,
    horasEspera,
    porcentajeReferenciaMensual,
    horasAdicionalesSobreReferencia,
    ingresoNetoEfectivoPorHora,
    ingresoBrutoPorHora,
    flujoDisponiblePorHora,
    referenciaHora: refHora,
    cumpleMetaHora,
    cumpleMetaMensual,
    ingresoMensualProyectado: superavitNeto,
    diferenciaMetaMensual,
    porcentajeCumplimientoMetaMensual,
    estadoCargaLaboral,
    rendimientoMarginalDecreciente,
    explicacionLaboral,
    recomendacionLaboral
  };
}

/**
 * Clasifica los gastos y evalúa la salud presupuestaria bajo el marco 50/30/20 adaptable
 */
export function analyzeExpenseHealth(
  transactions: Transaction[],
  previousTransactions: Transaction[] = [],
  settings: FinancialSettings = DEFAULT_FINANCIAL_SETTINGS
): ExpenseHealthAnalysis {
  const expenseTx = transactions.filter(t => t.tipo === 'GASTO');
  const totalGastos = expenseTx.reduce((sum, t) => sum + (Number(t.monto) || 0), 0);
  const totalIngresos = transactions.filter(t => t.tipo === 'INGRESO').reduce((sum, t) => sum + (Number(t.monto) || 0), 0);
  const superavit = totalIngresos - totalGastos;

  const categoryMap = new Map<string, number>();
  for (const t of expenseTx) {
    const key = t.categoria || 'OTROS_GASTOS';
    categoryMap.set(key, (categoryMap.get(key) || 0) + (Number(t.monto) || 0));
  }

  const items: ExpenseItemAnalysis[] = [];
  let necesidadesTotal = 0;
  let deseosTotal = 0;
  let ahorroDeudaTotal = 0;

  for (const [cat, monto] of categoryMap.entries()) {
    let clasificacion: ExpenseCategoryClassification = 'DISCRECIONAL';
    let clasificacionLabel = 'Discrecional';
    let descripcion = 'Gasto no esencial para operar';

    if (cat === 'COMBUSTIBLE') {
      clasificacion = 'PRODUCTIVO';
      clasificacionLabel = 'Gasto Productivo';
      descripcion = 'Indispensable para generar ingresos en moto';
      necesidadesTotal += monto;
    } else if (cat === 'MANTENIMIENTO_MOTO') {
      clasificacion = 'NECESARIO';
      clasificacionLabel = 'Mantenimiento Necesario';
      descripcion = 'Protección de tu herramienta principal de trabajo';
      necesidadesTotal += monto;
    } else if (cat === 'ALIMENTACION') {
      clasificacion = 'NECESARIO';
      clasificacionLabel = 'Alimentación en Ruta';
      descripcion = 'Consumo de energía para la jornada laboral';
      necesidadesTotal += monto;
    } else if (cat === 'HONORARIOS_ACOMPANANTE') {
      clasificacion = 'PRODUCTIVO';
      clasificacionLabel = 'Apoyo Operativo (Jhony)';
      descripcion = 'Costo de acompañante para optimizar rutas de entrega';
      necesidadesTotal += monto;
    } else if (cat === 'CUOTA_CREDITO') {
      clasificacion = 'FINANCIERO';
      clasificacionLabel = 'Compromiso Financiero';
      descripcion = 'Cuota de crédito / obligación pactada';
      ahorroDeudaTotal += monto;
    } else {
      deseosTotal += monto;
    }

    const pctIngreso = totalIngresos > 0 ? +((monto / totalIngresos) * 100).toFixed(1) : 0;
    const pctSuperavit = superavit > 0 ? +((monto / superavit) * 100).toFixed(1) : 0;

    items.push({
      categoria: cat,
      monto,
      porcentajeIngreso: pctIngreso,
      porcentajeSuperavit: pctSuperavit,
      clasificacion,
      clasificacionLabel,
      descripcion
    });
  }

  const ratioGastoIngresoPct = totalIngresos > 0 ? Math.round((totalGastos / totalIngresos) * 100) : 0;
  const basePresupuesto = totalGastos > 0 ? totalGastos : 1;

  const porcentajeNecesidadesReal = Math.round((necesidadesTotal / basePresupuesto) * 100);
  const porcentajeDeseosReal = Math.round((deseosTotal / basePresupuesto) * 100);
  const porcentajeAhorroDeudaReal = Math.round((ahorroDeudaTotal / basePresupuesto) * 100);

  let explicacion50_30_20 = `Distribución de tus egresos: ${porcentajeNecesidadesReal}% Necesidades operativas, ${porcentajeDeseosReal}% Discrecional, ${porcentajeAhorroDeudaReal}% Obligaciones. `;
  if (porcentajeDeseosReal > (settings.porcentajeDeseosRef || 30)) {
    explicacion50_30_20 += 'Tus gastos discrecionales superan la referencia del 30%, reduciendo tu capacidad de ahorro.';
  } else {
    explicacion50_30_20 += 'Tus gastos están mayoritariamente concentrados en necesidades operativas esenciales.';
  }

  let alertaGastos: string | null = null;
  if (ratioGastoIngresoPct > 85) {
    alertaGastos = 'Tus gastos están absorbiendo más del 85% de tus ingresos. Revisa combustible y comidas en calle.';
  }

  return {
    items: items.sort((a, b) => b.monto - a.monto),
    totalGastos,
    ratioGastoIngresoPct,
    necesidadesTotal,
    deseosTotal,
    ahorroDeudaTotal,
    porcentajeNecesidadesReal,
    porcentajeDeseosReal,
    porcentajeAhorroDeudaReal,
    explicacion50_30_20,
    alertaGastos
  };
}

/**
 * Analiza el estado y salud de las tarjetas de crédito
 */
export function analyzeCreditCards(cards: CreditCardAccount[]): CreditCardAnalysis {
  const deudaTotalTarjetas = cards.reduce((sum, c) => sum + (Number(c.saldoUtilizado) || 0), 0);
  const cupoTotalTarjetas = cards.reduce((sum, c) => sum + (Number(c.cupoTotal) || 0), 0);
  const cupoDisponibleTotal = Math.max(0, cupoTotalTarjetas - deudaTotalTarjetas);
  const utilizacionGlobalPct = cupoTotalTarjetas > 0 ? Math.round((deudaTotalTarjetas / cupoTotalTarjetas) * 100) : 0;

  const pagoMinimoTotal = cards.reduce((sum, c) => sum + (Number(c.pagoMinimo) || 0), 0);
  const pagoCompletoTotal = deudaTotalTarjetas;

  let semaforoUtilizacion: 'VERDE' | 'AMARILLO' | 'ROJO' = 'VERDE';
  if (utilizacionGlobalPct >= 60) {
    semaforoUtilizacion = 'ROJO';
  } else if (utilizacionGlobalPct >= 30) {
    semaforoUtilizacion = 'AMARILLO';
  }

  const advertenciaPagoMinimo = 'Pagar solo el mínimo evita la mora inmediata, pero extiende drásticamente la deuda y multiplica los intereses pagados.';

  return {
    tarjetas: cards,
    deudaTotalTarjetas,
    cupoTotalTarjetas,
    cupoDisponibleTotal,
    utilizacionGlobalPct,
    semaforoUtilizacion,
    pagoMinimoTotal,
    pagoCompletoTotal,
    advertenciaPagoMinimo
  };
}

/**
 * Motor de decisión: "¿Ahorrar o Abonar a Capital?" basado en resiliencia y tasas reales
 */
export function recommendSaveVsPayDebt(
  availableCash: number,
  credits: CreditInstallment[] = [],
  cards: CreditCardAccount[] = [],
  currentSavings: number = 0,
  essentialExpenses: number = 0,
  settings: FinancialSettings = DEFAULT_FINANCIAL_SETTINGS
): SaveVsPayRecommendation {
  const totalDeuda = credits.reduce((sum, c) => sum + (Number(c.montoCuota) || 0), 0) +
    cards.reduce((sum, card) => sum + (Number(card.saldoUtilizado) || 0), 0);

  const mesesReserva = essentialExpenses > 0 ? currentSavings / essentialExpenses : 0;
  const safeCash = Math.max(0, availableCash);

  // 1. Si no existe un colchón básico (menos de 1 mes de gastos esenciales) -> Priorizar Fondo de Emergencia
  if (mesesReserva < 1 && safeCash > 0) {
    const destinoAhorro = Math.round(safeCash * 0.75);
    const destinoAbono = safeCash - destinoAhorro;
    return {
      prioridadPrincipal: 'CREAR_FONDO_EMERGENCIA',
      titulo: 'Prioriza fortalecer tu fondo de emergencia',
      explicacion: `Tu reserva actual cubre aproximadamente ${mesesReserva.toFixed(1)} meses de gastos esenciales. Para evitar endeudarte ante un pinchazo o imprevisto, recomendamos destinar al menos $${formatCurrency(destinoAhorro)} a ahorro antes de abonar a capital.`,
      montoRecomendadoAhorro: destinoAhorro,
      montoRecomendadoAbono: destinoAbono,
      resilienciaTexto: 'La resiliencia ante imprevistos es la primera barrera contra la deuda cara.'
    };
  }

  // 2. Si hay deuda de tarjeta con saldo utilizado alto -> Abonar a deuda cara
  const tarjetaCara = cards.find(c => c.saldoUtilizado > 0 && (c.tasaInteresEA || 25) > 20);
  if (tarjetaCara && safeCash > 0) {
    const destinoAbono = Math.round(safeCash * 0.7);
    const destinoAhorro = safeCash - destinoAbono;
    const tasaStr = tarjetaCara.tasaInteresEA ? `${tarjetaCara.tasaInteresEA}% E.A.` : 'interés bancario de tarjeta';
    return {
      prioridadPrincipal: 'ABONAR_DEUDA_INTERES_ALTO',
      titulo: 'Abona a capital de tu tarjeta de crédito',
      explicacion: `Tienes deuda activa en ${tarjetaCara.nombre} con una tasa estimada de ${tasaStr}. Abonar $${formatCurrency(destinoAbono)} a capital genera un ahorro financiero inmediato al reducir los intereses futuros.`,
      montoRecomendadoAbono: destinoAbono,
      montoRecomendadoAhorro: destinoAhorro,
      ahorroInteresEstimadoTexto: `Abonar a capital en esta tarjeta reduce la base de cobro de intereses para el próximo corte.`,
      resilienciaTexto: 'Tienes un colchón básico de emergencia que te permite acelerar el pago de pasivos costosos.'
    };
  }

  // 3. Situación balanceada
  const mitad = Math.round(safeCash / 2);
  return {
    prioridadPrincipal: 'EQUILIBRIO_AHORRO_ABONO',
    titulo: 'Equilibrio entre ahorro y reducción de pasivos',
    explicacion: `Cuentas con un colchón de emergencia razonable (${mesesReserva.toFixed(1)} meses). Recomendamos dividir tu excedente disponible: $${formatCurrency(mitad)} a tu fondo de ahorro y $${formatCurrency(mitad)} a tus obligaciones o abono extraordinario.`,
    montoRecomendadoAbono: mitad,
    montoRecomendadoAhorro: mitad,
    resilienciaTexto: 'Mantienes liquidez en mano mientras continúas reduciendo pasivos.'
  };
}

/**
 * Genera de 5 a 7 insights dinámicos de alto impacto para el Dashboard
 */
export function generateSmartInsights(
  threeTier: ThreeTierFinancials,
  labor: LaborHealthMetrics,
  expenseHealth: ExpenseHealthAnalysis,
  cards: CreditCardAnalysis,
  saveVsPay: SaveVsPayRecommendation,
  comparison?: PeriodComparisonResult | null,
  settings: FinancialSettings = DEFAULT_FINANCIAL_SETTINGS
): DashboardInsight[] {
  const insights: DashboardInsight[] = [];

  // 1. Insight de Ingreso vs Referencia Salario Mínimo
  if (labor.cumpleMetaMensual) {
    insights.push({
      id: 'ins-ingreso-positivo',
      tipo: 'positivo',
      badge: '🟢',
      titulo: 'Ingreso neto sobre la referencia',
      descripcion: `Tu superávit acumulado ($${formatCurrency(labor.ingresoMensualProyectado)}) supera la referencia de salario mínimo ($${formatCurrency(settings.metaIngresoMinimoMensual)}).`
    });
  } else if (labor.horasTotalesTrabajadas > 0) {
    insights.push({
      id: 'ins-ingreso-progreso',
      tipo: 'alerta',
      badge: '🟡',
      titulo: 'Progreso hacia la referencia mensual',
      descripcion: `Llevas un ${labor.porcentajeCumplimientoMetaMensual}% de la referencia mensual de $${formatCurrency(settings.metaIngresoMinimoMensual)}.`
    });
  }

  // 2. Insight de Rendimiento Horario y Carga
  if (labor.estadoCargaLaboral === 'CRITICA') {
    insights.push({
      id: 'ins-carga-critica',
      tipo: 'peligro',
      badge: '🔴',
      titulo: 'Alerta de sobrecarga con bajo rendimiento',
      descripcion: `Has trabajado ${labor.horasTotalesTrabajadas}h pero tu ganancia neta es $${formatCurrency(labor.ingresoNetoEfectivoPorHora)}/h (debajo de los $${formatCurrency(labor.referenciaHora)}/h esperados). Más horas no están rindiendo igual.`,
      accionSugerida: 'Descansa y concéntrate únicamente en las franjas de alta demanda.'
    });
  } else if (labor.horasAdicionalesSobreReferencia > 0) {
    insights.push({
      id: 'ins-horas-altas',
      tipo: 'alerta',
      badge: '🟡',
      titulo: 'Jornada superior a la referencia ordinaria',
      descripcion: `Has acumulado ${labor.horasTotalesTrabajadas}h, aproximadamente ${labor.horasAdicionalesSobreReferencia}h por encima de la referencia mensual de 182h.`
    });
  } else if (labor.ingresoNetoEfectivoPorHora >= labor.referenciaHora) {
    insights.push({
      id: 'ins-hora-buena',
      tipo: 'positivo',
      badge: '🟢',
      titulo: 'Excelente ganancia por hora',
      descripcion: `Estás generando $${formatCurrency(labor.ingresoNetoEfectivoPorHora)} limpios por cada hora de jornada.`
    });
  }

  // 3. Insight de Comparación respecto al período anterior
  if (comparison && comparison.ingresosAnterior > 0) {
    if (comparison.variacionIngresosPct > 0 && comparison.variacionGastosPct < comparison.variacionIngresosPct) {
      insights.push({
        id: 'ins-comp-buena',
        tipo: 'positivo',
        badge: '🟢',
        titulo: 'Crecimiento de margen positivo',
        descripcion: `Tus ingresos subieron +${comparison.variacionIngresosPct}% con gastos controlados (+${comparison.variacionGastosPct}%).`
      });
    } else if (comparison.variacionGastosPct > 15) {
      insights.push({
        id: 'ins-comp-gasto-alto',
        tipo: 'peligro',
        badge: '🔴',
        titulo: 'Alerta en crecimiento de gastos',
        descripcion: `Tus gastos aumentaron un +${comparison.variacionGastosPct}% comparado con el período previo.`
      });
    }
  }

  // 4. Insight de Tarjetas de Crédito
  if (cards.tarjetas.length > 0) {
    if (cards.semaforoUtilizacion === 'ROJO') {
      insights.push({
        id: 'ins-tc-rojo',
        tipo: 'peligro',
        badge: '🔴',
        titulo: 'Utilización de crédito elevada',
        descripcion: `Estás utilizando el ${cards.utilizacionGlobalPct}% de tu cupo total. Limita tu margen de crédito y genera intereses costosos.`,
        accionSugerida: 'Paga más del mínimo siempre que tengas excedente.'
      });
    } else if (cards.semaforoUtilizacion === 'AMARILLO') {
      insights.push({
        id: 'ins-tc-amarillo',
        tipo: 'alerta',
        badge: '🟡',
        titulo: 'Uso moderado de tarjetas',
        descripcion: `Utilizas el ${cards.utilizacionGlobalPct}% de tu cupo. La recomendación de salud financiera es mantenerlo por debajo del 30%.`
      });
    }
  }

  // 5. Insight de Decisión: Ahorro vs Deuda
  insights.push({
    id: 'ins-save-vs-pay',
    tipo: 'accion',
    badge: '💡',
    titulo: saveVsPay.titulo,
    descripcion: saveVsPay.explicacion,
    accionSugerida: saveVsPay.montoRecomendadoAbono > 0 ? `Abonar $${formatCurrencyCompact(saveVsPay.montoRecomendadoAbono)} a capital` : undefined
  });

  return insights.slice(0, 7);
}


export interface DistributionSlice {
  name: string;
  value: number;
  percentage: number;
  color: string;
}

const APP_BRAND_COLORS: Record<string, string> = {
  'Rappi': '#f97316',
  'Didi Food': '#eab308',
  'Mensajeros Urbanos': '#ef4444',
  'Armi': '#0284c7',
  'Yango Pro': '#dc2626',
  'Uber Pasajeros': '#00a8cc',
  'InDrive Moto': '#10b981',
  'Particular': '#8b5cf6',
  'Gasolina': '#f59e0b',
  'Combustible': '#f59e0b',
  'Almuerzo / Comida': '#ec4899',
  'Alimentación': '#ec4899',
  'Mantenimiento Moto': '#8b5cf6',
  'Honorarios Jhony': '#6366f1',
  'Acompañante (Jhony)': '#6366f1',
  'Honorarios Acompañante': '#6366f1',
  'Cuota Crédito': '#6366f1',
  'Otro Gasto': '#64748b'
};

const PALETTE = ['#0284c7', '#f97316', '#10b981', '#eab308', '#ec4899', '#8b5cf6', '#06b6d4', '#64748b'];

export function getCategoryDistribution(
  transactions: Transaction[],
  tipo: 'INGRESO' | 'GASTO'
): DistributionSlice[] {
  const filtered = transactions.filter(t => t.tipo === tipo);
  const total = filtered.reduce((acc, t) => acc + (Number(t.monto) || 0), 0);

  if (total <= 0) return [];

  const grouped = new Map<string, number>();

  for (const t of filtered) {
    const key = t.subcategoria || t.categoria || 'Otro';
    grouped.set(key, (grouped.get(key) || 0) + (Number(t.monto) || 0));
  }

  return Array.from(grouped.entries())
    .map(([name, value], index) => ({
      name,
      value,
      percentage: Math.round((value / total) * 100),
      color: APP_BRAND_COLORS[name] || PALETTE[index % PALETTE.length]
    }))
    .sort((a, b) => b.value - a.value);
}

export interface ProductivityDeepMetrics {
  totalServicios: number;
  totalHoras: number;
  ingresoPorServicio: number;
  serviciosPorHora: number;
  ingresoPorHora: number;
  costoPorHora: number;
  margenPorHora: number;
  minutosReparto: number;
  minutosEspera: number;
  ratioProductividad: number;
  kilometrosTotales: number;
  rendimientoKm: number;
}

export function getProductivityDeepMetrics(
  shifts: Shift[],
  transactions: Transaction[],
  summary: FinancialSummary
): ProductivityDeepMetrics {
  // Solo contar servicios operativos (DOMICILIOS + PASAJEROS), no OTROS_INGRESOS
  const totalServicios = transactions.filter(t =>
    t.tipo === 'INGRESO' && (t.categoria === 'DOMICILIOS' || t.categoria === 'PASAJEROS')
  ).length;
  const totalHoras = summary.totalMinutosTrabajados > 0 ? summary.totalMinutosTrabajados / 60 : 0;

  // Usar ingresosOperativos (excluye OTROS_INGRESOS) para métricas de productividad real
  const ingresosOp = summary.ingresosOperativos ?? summary.ingresosTotales;
  const ingresoPorServicio = totalServicios > 0 ? Math.round(ingresosOp / totalServicios) : 0;
  const serviciosPorHora = totalHoras > 0 ? +(totalServicios / totalHoras).toFixed(1) : 0;
  const ingresoPorHora = Math.round(summary.rendimientoPorHora);
  const costoPorHora = totalHoras > 0 ? Math.round(summary.gastosTotales / totalHoras) : 0;
  const margenPorHora = totalHoras > 0 ? Math.round((ingresosOp - summary.gastosTotales) / totalHoras) : 0;
  const rendimientoKm = summary.kilometrosTotales > 0 ? Math.round(ingresosOp / summary.kilometrosTotales) : 0;

  return {
    totalServicios,
    totalHoras,
    ingresoPorServicio,
    serviciosPorHora,
    ingresoPorHora,
    costoPorHora,
    margenPorHora,
    minutosReparto: summary.totalMinutosReparto,
    minutosEspera: summary.totalMinutosEspera,
    ratioProductividad: Math.round(summary.ratioProductividad),
    kilometrosTotales: summary.kilometrosTotales,
    rendimientoKm
  };
}
