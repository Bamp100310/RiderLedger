import { FinancialSummary, Shift, Transaction, TimeRange } from '../types';

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
  let gastosTotales = 0;
  let saldoAppTarifasPropinas = 0;
  let cobrosEfectivoApp = 0;
  let ingresosEfectivo = 0;
  let gastosEfectivo = 0;

  for (const t of transactions) {
    const monto = Number(t.monto) || 0;

    if (t.tipo === 'INGRESO') {
      ingresosTotales += monto;

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

  // 4. Rendimiento por hora = Ingresos Totales / Horas Totales
  const totalHoras = totalMinutosTrabajados / 60;
  const rendimientoPorHora = totalHoras > 0 ? ingresosTotales / totalHoras : 0;

  // 5. Rendimiento por km = Ingresos Totales / Kilómetros Totales
  const rendimientoPorKm = kilometrosTotales > 0 ? ingresosTotales / kilometrosTotales : 0;

  return {
    ingresosTotales,
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
  groupBy: 'semana' | 'mes'
): ConsolidatedPeriodReport[] {
  const map = new Map<string, {
    label: string;
    domicilios: number;
    pasajeros: number;
    otrosIngresos: number;
    gasolina: number;
    otrosGastos: number;
    minutosReparto: number;
    minutosEspera: number;
    kilometros: number;
  }>();

  // Función para obtener la clave de grupo
  const getGroupKey = (dateStr: string): { key: string; label: string } => {
    const d = new Date(`${dateStr}T00:00:00`);
    if (groupBy === 'mes') {
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
      if (t.categoria === 'COMBUSTIBLE' || t.subcategoria.toLowerCase().includes('gasolina')) {
        item.gasolina += monto;
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
    const totalGastos = data.gasolina + data.otrosGastos;
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
