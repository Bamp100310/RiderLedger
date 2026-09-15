import test from 'node:test';
import assert from 'node:assert/strict';
import {
  parseLocalDate,
  getLocalDateString,
  getCalendarWeekFinancialData,
  getCalendarMonthFinancialData,
  calculateShiftDistance,
  isDateInRange,
  navigatePeriod,
  getPeriodLabel,
  calculateFinancialSummary,
  calculateCreditAnalysis,
  getPeriodFinancialChartData,
  calculateThreeTierFinancials,
  calculateLaborBenchmark,
  analyzeCreditCards,
  analyzeExpenseHealth,
  recommendSaveVsPayDebt,
  groupShiftsByPeriod,
  comparePeriods,
  DEFAULT_FINANCIAL_SETTINGS
} from '../src/lib/calculations.ts';
import type { Shift, Transaction, CreditInstallment, CreditCardAccount, DateFilter } from '../src/types/index.ts';

test('parseLocalDate and getLocalDateString handles timezone and month boundaries', () => {
  const d1 = parseLocalDate('2026-02-28');
  assert.equal(d1.getFullYear(), 2026);
  assert.equal(d1.getMonth(), 1); // February is 1
  assert.equal(d1.getDate(), 28);
  assert.equal(getLocalDateString(d1), '2026-02-28');

  // Leap year 2024
  const dLeap = parseLocalDate('2024-02-29');
  assert.equal(dLeap.getFullYear(), 2024);
  assert.equal(dLeap.getDate(), 29);

  // Year rollover
  const dYearEnd = parseLocalDate('2025-12-31');
  assert.equal(dYearEnd.getFullYear(), 2025);
  assert.equal(dYearEnd.getMonth(), 11);
  assert.equal(dYearEnd.getDate(), 31);
});

test('Calendar Week: strictly Monday to Sunday with zero-filled missing days', () => {
  const txs: Transaction[] = [
    {
      id: 'tx-1',
      fecha: '2026-09-08', // Tuesday
      tipo: 'INGRESO',
      categoria: 'DOMICILIOS',
      subcategoria: 'Rappi',
      monto: 50000,
      medio_pago: 'EFECTIVO'
    },
    {
      id: 'tx-2',
      fecha: '2026-09-12', // Saturday
      tipo: 'GASTO',
      categoria: 'COMBUSTIBLE',
      subcategoria: 'Gasolina',
      monto: 15000,
      medio_pago: 'EFECTIVO'
    }
  ];

  const weekData = getCalendarWeekFinancialData(txs, parseLocalDate('2026-09-13'));
  assert.equal(weekData.length, 7, 'Calendar week must have exactly 7 items (Lun to Dom)');
  assert.ok(weekData[0].periodo.startsWith('Lun'));
  assert.ok(weekData[1].periodo.startsWith('Mar'));
  assert.ok(weekData[6].periodo.startsWith('Dom'));

  // Tuesday
  assert.equal(weekData[1].Domicilios, 50000);
  assert.equal(weekData[1].Ingresos, 50000);

  // Wednesday (inactive)
  assert.equal(weekData[2].Domicilios, 0);
  assert.equal(weekData[2].Gastos, 0);
  assert.equal(weekData[2].Superavit, 0);
  assert.equal(weekData[2].sinActividad, true);

  // Saturday
  assert.equal(weekData[5].Combustible, 15000);
  assert.equal(weekData[5].Gastos, 15000);
  assert.equal(weekData[5].Superavit, -15000);
});

test('Calendar Month: exactly 28/29/30/31 days with zeros for inactive days', () => {
  const txs: Transaction[] = [
    {
      id: 'tx-feb',
      fecha: '2026-02-14',
      tipo: 'INGRESO',
      categoria: 'DOMICILIOS',
      subcategoria: 'Didi',
      monto: 40000,
      medio_pago: 'EFECTIVO'
    }
  ];

  // 2026 February has 28 days (month is 1)
  const febData = getCalendarMonthFinancialData(txs, 2026, 1);
  assert.equal(febData.length, 28, 'Feb 2026 must have 28 days');
  assert.equal(febData[13].fechaISO, '2026-02-14');
  assert.equal(febData[13].Domicilios, 40000);
  assert.equal(febData[0].Domicilios, 0);
  assert.equal(febData[27].Domicilios, 0);

  // September has 30 days (month is 8)
  const sepData = getCalendarMonthFinancialData([], 2026, 8);
  assert.equal(sepData.length, 30, 'September must have 30 days');
});

test('Summary with 0 hours, 0 km, 0 transactions produces null (No disponible) instead of misleading $0/h', () => {
  const summary = calculateFinancialSummary([], []);
  assert.equal(summary.ingresosTotales, 0);
  assert.equal(summary.gastosTotales, 0);
  assert.equal(summary.superavitNeto, 0);
  // Hourly rates must be null ("No disponible"), not $0/h
  assert.equal(summary.facturacionBrutaPorHora, null);
  assert.equal(summary.rendimientoOperativoPorHora, null);
  assert.equal(summary.flujoNetoPorHora, null);
  assert.equal(summary.rendimientoPorKm, null);
  assert.equal(summary.rendimientoPorHora, 0); // compatibilidad regresiva
});

test('Odometer vs Distance calculation handles valid, invalid and missing readings safely', () => {
  // Case A: Valid readings (end > start)
  const sValid = { kilometros: 50, odometer_start: 12450.5, odometer_end: 12510.5 };
  assert.equal(calculateShiftDistance(sValid), 60);

  // Case B: Inverted/invalid readings (end <= start) -> Fallback to kilometros
  const sInvalid = { kilometros: 42.5, odometer_start: 13000, odometer_end: 12900 };
  assert.equal(calculateShiftDistance(sInvalid), 42.5);

  // Case C: Missing odometer -> Uses kilometros
  const sMissing = { kilometros: 35.8 };
  assert.equal(calculateShiftDistance(sMissing), 35.8);
});

test('Period Navigation: moves forward and backward across months, years, and weeks', () => {
  // Month navigation
  const fMonth: DateFilter = { range: 'mes', referenceDate: '2026-09-13' };
  const fPrevMonth = navigatePeriod(fMonth, -1);
  assert.equal(fPrevMonth.referenceDate, '2026-08-13');
  assert.equal(getPeriodLabel(fPrevMonth), 'Agosto 2026');

  // Year transition in months (Jan -> Dec)
  const fJan: DateFilter = { range: 'mes', referenceDate: '2026-01-15' };
  const fDec = navigatePeriod(fJan, -1);
  assert.equal(fDec.referenceDate, '2025-12-15');
  assert.equal(getPeriodLabel(fDec), 'Diciembre 2025');

  // Week navigation (moves 7 days)
  const fWeek: DateFilter = { range: 'semana', referenceDate: '2026-09-13' };
  const fPrevWeek = navigatePeriod(fWeek, -1);
  assert.equal(fPrevWeek.referenceDate, '2026-09-06');
});

test('isDateInRange filters correctly based on focal referenceDate', () => {
  // Target date is in August 2026
  const augustDate = '2026-08-15';

  // If reference date is September 2026, August date is NOT in range
  assert.equal(isDateInRange(augustDate, 'mes', undefined, undefined, '2026-09-13'), false);

  // If reference date is navigated to August 2026, August date IS in range!
  assert.equal(isDateInRange(augustDate, 'mes', undefined, undefined, '2026-08-10'), true);
});

test('Three-tier financials strictly separates period actual payments from planned monthly obligations', () => {
  const shifts: Shift[] = [
    { id: 's1', fecha: '2026-09-10', tiempo_reparto_minutos: 300, tiempo_espera_minutos: 60, kilometros: 80 }
  ];
  const txs: Transaction[] = [
    { id: 't1', fecha: '2026-09-10', tipo: 'INGRESO', categoria: 'DOMICILIOS', subcategoria: 'Rappi', monto: 120000, medio_pago: 'EFECTIVO' },
    { id: 't2', fecha: '2026-09-10', tipo: 'GASTO', categoria: 'COMBUSTIBLE', subcategoria: 'Gasolina', monto: 20000, medio_pago: 'EFECTIVO' },
    { id: 't3', fecha: '2026-09-10', tipo: 'GASTO', categoria: 'HONORARIOS_ACOMPANANTE', subcategoria: 'Jhony', monto: 30000, medio_pago: 'EFECTIVO' },
    { id: 't4', fecha: '2026-09-10', tipo: 'GASTO', categoria: 'ALIMENTACION', subcategoria: 'Almuerzo', monto: 15000, medio_pago: 'EFECTIVO' },
    { id: 't5', fecha: '2026-09-10', tipo: 'INGRESO', categoria: 'OTROS_INGRESOS', subcategoria: 'Propina Extra', monto: 10000, medio_pago: 'EFECTIVO' }
  ];
  // Monthly planned obligations ($500.000)
  const credits: CreditInstallment[] = [
    { id: 'c1', nombre: 'Moto', montoCuota: 350000, diaPago: 10, pagadoEsteMes: false }
  ];
  const cards: CreditCardAccount[] = [
    { id: 'cc1', nombre: 'Tarjeta', saldoUtilizado: 100000, cupoTotal: 1000000, pagoMinimo: 150000, fechaCorte: 15, fechaPago: 30 }
  ];

  const threeTier = calculateThreeTierFinancials(txs, shifts, credits, cards);

  // Nivel A: Resultado Operativo = Incomes (120000) - Route Costs (20000 + 30000) = 70000
  assert.equal(threeTier.ingresosOperativos, 120000);
  assert.equal(threeTier.gastosOperativos, 50000);
  assert.equal(threeTier.resultadoOperativo, 70000);

  // In this period, NO actual CUOTA_CREDITO transactions were registered -> actual debt payments = 0!
  assert.equal(threeTier.pagosDeudaEfectivosPeriodo, 0);
  assert.equal(threeTier.resultadoDespuesObligaciones, 70000, 'Must NOT deduct $500k monthly obligation when 0 payments were made in this period');

  // Informative planned monthly obligations = 350k + 150k = 500k
  assert.equal(threeTier.obligacionesMensualesPactadas, 500000);

  // Nivel C: Flujo Disponible = 70000 + 10000 (otros ingresos) - 15000 (gastos personales) = 65000
  assert.equal(threeTier.flujoDisponible, 65000);
});

test('Labor Benchmark detects overload and marginal return decay', () => {
  const shifts: Shift[] = [
    { id: 's1', fecha: '2026-09-01', tiempo_reparto_minutos: 240 * 60, tiempo_espera_minutos: 0, kilometros: 1000 }
  ];
  const txs: Transaction[] = [
    { id: 't1', fecha: '2026-09-01', tipo: 'INGRESO', categoria: 'DOMICILIOS', subcategoria: 'Rappi', monto: 1200000, medio_pago: 'EFECTIVO' },
    { id: 't2', fecha: '2026-09-01', tipo: 'GASTO', categoria: 'COMBUSTIBLE', subcategoria: 'Gasolina', monto: 200000, medio_pago: 'EFECTIVO' }
  ];

  const labor = calculateLaborBenchmark(shifts, txs, DEFAULT_FINANCIAL_SETTINGS);
  assert.equal(labor.estadoCargaLaboral, 'CRITICA');
  assert.equal(labor.rendimientoMarginalDecreciente, true);
  assert.ok(labor.horasAdicionalesSobreReferencia > 50);
  assert.ok(!labor.cumpleMetaHora);
});

test('Decision engine: handles deficit state and missing interest rates with fallbacks', () => {
  // Case A: Deficit (availableCash <= 0)
  const recDeficit = recommendSaveVsPayDebt(-50000, [], [], 100000, 500000);
  assert.equal(recDeficit.prioridadPrincipal, 'DEFICIT_RECUPERAR_FLUJO');
  assert.equal(recDeficit.esDeficit, true);
  assert.equal(recDeficit.montoRecomendadoAbono, 0);
  assert.equal(recDeficit.montoRecomendadoAhorro, 0);

  // Case B: Card without interest rate specified -> Flags tasaIncompleta, does not invent 25%
  const cardNoRate: CreditCardAccount = {
    id: 'cc-norate',
    nombre: 'Tuya',
    saldoUtilizado: 300000,
    cupoTotal: 1000000,
    pagoMinimo: 30000,
    fechaCorte: 5,
    fechaPago: 20
  };
  const recNoRate = recommendSaveVsPayDebt(200000, [], [cardNoRate], 1500000, 500000);
  assert.equal(recNoRate.tasaIncompleta, true);
  assert.ok(recNoRate.titulo.includes('Tasa no especificada'));
});

test('Shift grouping aggregates shifts and route expenses by month correctly', () => {
  const shifts: Shift[] = [
    { id: 's1', fecha: '2026-09-05', tiempo_reparto_minutos: 180, tiempo_espera_minutos: 20, kilometros: 40 },
    { id: 's2', fecha: '2026-09-10', tiempo_reparto_minutos: 120, tiempo_espera_minutos: 40, kilometros: 30 },
    { id: 's3', fecha: '2026-08-20', tiempo_reparto_minutos: 240, tiempo_espera_minutos: 60, kilometros: 70 }
  ];
  const txs: Transaction[] = [
    { id: 't1', fecha: '2026-09-05', tipo: 'INGRESO', categoria: 'DOMICILIOS', subcategoria: 'Rappi', monto: 80000, medio_pago: 'EFECTIVO' },
    { id: 't2', fecha: '2026-09-05', tipo: 'GASTO', categoria: 'COMBUSTIBLE', subcategoria: 'Gasolina', monto: 15000, medio_pago: 'EFECTIVO' },
    { id: 't3', fecha: '2026-08-20', tipo: 'INGRESO', categoria: 'DOMICILIOS', subcategoria: 'Rappi', monto: 100000, medio_pago: 'EFECTIVO' }
  ];

  const grouped = groupShiftsByPeriod(shifts, txs, 'mes');
  assert.equal(grouped.length, 2, 'Should group into Sep 2026 and Ago 2026');
  assert.equal(grouped[0].periodoKey, '2026-09');
  assert.equal(grouped[0].kilometros, 70);
  assert.equal(grouped[0].totalTurnos, 2);
  assert.equal(grouped[0].ingresos, 80000);
  assert.equal(grouped[0].gastosRuta, 15000);
});

test('calculateCreditAnalysis: 0 cuotas pendientes produces 100% coverage and no false deficit', () => {
  // Case A: No credits at all
  const analysisEmpty = calculateCreditAnalysis([], 500000, parseLocalDate('2026-09-14'));
  assert.equal(analysisEmpty.sinCuotasPendientes, true);
  assert.equal(analysisEmpty.estaCubierto, true);
  assert.equal(analysisEmpty.porcentajeCobertura, 100);
  assert.equal(analysisEmpty.totalCuotasPendientes, 0);
  assert.equal(analysisEmpty.diferencia, 500000);

  // Case B: Credits exist but are already paid for this cycle
  const creditsPaid: CreditInstallment[] = [
    { id: 'c-1', nombre: 'Moto', montoCuota: 300000, diaPago: 10, pagadoEsteMes: true },
    { id: 'c-2', nombre: 'Préstamo', montoCuota: 200000, diaPago: 30, pagadoEsteMes: true }
  ];
  const analysisPaid = calculateCreditAnalysis(creditsPaid, 150000, parseLocalDate('2026-09-14'));
  assert.equal(analysisPaid.sinCuotasPendientes, true);
  assert.equal(analysisPaid.estaCubierto, true);
  assert.equal(analysisPaid.porcentajeCobertura, 100);
  assert.equal(analysisPaid.totalCuotasPendientes, 0);
  assert.equal(analysisPaid.diferencia, 150000);

  // Case C: Pending cuota with sufficient surplus
  const creditsPending: CreditInstallment[] = [
    { id: 'c-3', nombre: 'Cuota Fin de Mes', montoCuota: 250000, diaPago: 30, pagadoEsteMes: false }
  ];
  const analysisCovered = calculateCreditAnalysis(creditsPending, 300000, parseLocalDate('2026-09-14'));
  assert.equal(analysisCovered.sinCuotasPendientes, false);
  assert.equal(analysisCovered.estaCubierto, true);
  assert.equal(analysisCovered.porcentajeCobertura, 120); // 300k / 250k = 120%
  assert.equal(analysisCovered.totalCuotasPendientes, 250000);
  assert.equal(analysisCovered.diferencia, 50000);

  // Case D: Pending cuota with deficit (surplus < cuota)
  const analysisDeficit = calculateCreditAnalysis(creditsPending, 100000, parseLocalDate('2026-09-14'));
  assert.equal(analysisDeficit.sinCuotasPendientes, false);
  assert.equal(analysisDeficit.estaCubierto, false);
  assert.equal(analysisDeficit.porcentajeCobertura, 40); // 100k / 250k = 40%
  assert.equal(analysisDeficit.diferencia, -150000);
});

test('analyzeCreditCards: calculates real due date buckets (7d, 15d, month) and payment options', () => {
  // Reference date: September 14, 2026
  const refDate = parseLocalDate('2026-09-14');

  const cards: CreditCardAccount[] = [
    // Due on 18th (4 days away -> in 7 days, in 15 days, in this month)
    { id: 'cc-1', nombre: 'Nu', cupoTotal: 2000000, saldoUtilizado: 500000, pagoMinimo: 50000, fechaCorte: 8, fechaPago: 18 },
    // Due on 26th (12 days away -> NOT in 7 days, in 15 days, in this month)
    { id: 'cc-2', nombre: 'Bancolombia', cupoTotal: 3000000, saldoUtilizado: 800000, pagoMinimo: 80000, fechaCorte: 15, fechaPago: 26 },
    // Due on 5th (already passed for Sep, next due is Oct 5 -> NOT in 7d, NOT in 15d, NOT in this month)
    { id: 'cc-3', nombre: 'Rappi', cupoTotal: 1000000, saldoUtilizado: 200000, pagoMinimo: 20000, fechaCorte: 25, fechaPago: 5 }
  ];

  const analysis = analyzeCreditCards(cards, refDate);
  assert.equal(analysis.deudaTotalTarjetas, 1500000);
  assert.equal(analysis.cupoTotalTarjetas, 6000000);
  assert.equal(analysis.cupoDisponibleTotal, 4500000);
  assert.equal(analysis.pagoMinimoTotal, 150000);
  assert.equal(analysis.pagoCompletoTotal, 1500000);

  // Check due date buckets
  assert.equal(analysis.vencenEn7Dias.length, 1);
  assert.equal(analysis.vencenEn7Dias[0].nombre, 'Nu');

  assert.equal(analysis.vencenEn15Dias.length, 2);
  assert.equal(analysis.vencenEsteMes.length, 2);
  assert.ok(analysis.proximoVencimiento !== null);
  assert.equal(analysis.proximoVencimiento?.card.nombre, 'Nu');
});

test('getPeriodFinancialChartData: hoy breakdown, semana Mon-Sun and año 12 months', () => {
  const refDate = parseLocalDate('2026-09-14'); // Monday
  const txs: Transaction[] = [
    { id: 't1', fecha: '2026-09-14', tipo: 'INGRESO', categoria: 'DOMICILIOS', subcategoria: 'Rappi', monto: 75000, medio_pago: 'EFECTIVO' },
    { id: 't2', fecha: '2026-09-14', tipo: 'GASTO', categoria: 'COMBUSTIBLE', subcategoria: 'Gasolina', monto: 20000, medio_pago: 'EFECTIVO' },
    { id: 't3', fecha: '2026-09-16', tipo: 'INGRESO', categoria: 'PASAJEROS', subcategoria: 'Didi', monto: 45000, medio_pago: 'EFECTIVO' }
  ];

  // Hoy: exactly 1 item representing referenceDate
  const hoyData = getPeriodFinancialChartData(txs, 'hoy', refDate);
  assert.equal(hoyData.length, 1);
  assert.equal(hoyData[0].fechaISO, '2026-09-14');
  assert.equal(hoyData[0].Ingresos, 75000);
  assert.equal(hoyData[0].Gastos, 20000);
  assert.equal(hoyData[0].Superavit, 55000);
  assert.equal(hoyData[0].sinActividad, false);

  // Semana: exactly 7 items from Monday 2026-09-14 to Sunday 2026-09-20
  const semanaData = getPeriodFinancialChartData(txs, 'semana', refDate);
  assert.equal(semanaData.length, 7);
  assert.equal(semanaData[0].fechaISO, '2026-09-14');
  assert.equal(semanaData[0].Ingresos, 75000);
  assert.equal(semanaData[2].fechaISO, '2026-09-16');
  assert.equal(semanaData[2].Pasajeros, 45000);
  assert.equal(semanaData[6].fechaISO, '2026-09-20');

  // Año: exactly 12 items (Ene to Dic)
  const anioData = getPeriodFinancialChartData(txs, 'año', refDate);
  assert.equal(anioData.length, 12);
  assert.equal(anioData[8].periodo, 'Sep');
  assert.equal(anioData[8].Ingresos, 120000);
});

test('analyzeExpenseHealth: 50/30/20 evaluated on total income and flags deficit', () => {
  // Case A: Balanced distribution
  const txsBalanced: Transaction[] = [
    { id: 't1', fecha: '2026-09-10', tipo: 'INGRESO', categoria: 'DOMICILIOS', monto: 1000000, medio_pago: 'EFECTIVO' },
    { id: 't2', fecha: '2026-09-10', tipo: 'GASTO', categoria: 'COMBUSTIBLE', monto: 300000, medio_pago: 'EFECTIVO' }, // Necesidades
    { id: 't3', fecha: '2026-09-10', tipo: 'GASTO', categoria: 'HONORARIOS_ACOMPANANTE', monto: 150000, medio_pago: 'EFECTIVO' }, // Necesidades
    { id: 't4', fecha: '2026-09-10', tipo: 'GASTO', categoria: 'OTROS_GASTOS', monto: 200000, medio_pago: 'EFECTIVO' } // Deseos
  ];
  const healthBalanced = analyzeExpenseHealth(txsBalanced);
  assert.equal(healthBalanced.totalGastos, 650000);
  assert.equal(healthBalanced.ratioGastoIngresoPct, 65);
  assert.equal(healthBalanced.porcentajeNecesidadesReal, 45); // 450k / 1M = 45%
  assert.equal(healthBalanced.porcentajeDeseosReal, 20); // 200k / 1M = 20%
  assert.equal(healthBalanced.alertaGastos, null);

  // Case B: Deficit (expenses > 100% of income)
  const txsDeficit: Transaction[] = [
    { id: 't1', fecha: '2026-09-10', tipo: 'INGRESO', categoria: 'DOMICILIOS', monto: 200000, medio_pago: 'EFECTIVO' },
    { id: 't2', fecha: '2026-09-10', tipo: 'GASTO', categoria: 'COMBUSTIBLE', monto: 150000, medio_pago: 'EFECTIVO' },
    { id: 't3', fecha: '2026-09-10', tipo: 'GASTO', categoria: 'MANTENIMIENTO_MOTO', monto: 120000, medio_pago: 'EFECTIVO' }
  ];
  const healthDeficit = analyzeExpenseHealth(txsDeficit);
  assert.equal(healthDeficit.totalGastos, 270000);
  assert.equal(healthDeficit.ratioGastoIngresoPct, 135);
  assert.ok(healthDeficit.alertaGastos !== null);
  assert.ok(healthDeficit.alertaGastos?.includes('Déficit presupuestario'));
  assert.ok(healthDeficit.explicacion50_30_20.includes('déficit presupuestario'));
});

