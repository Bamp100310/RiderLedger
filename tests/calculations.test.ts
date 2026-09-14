import test from 'node:test';
import assert from 'node:assert/strict';
import {
  parseLocalDate,
  getLocalDateString,
  getCalendarWeekFinancialData,
  getCalendarMonthFinancialData,
  calculateFinancialSummary,
  calculateThreeTierFinancials,
  calculateLaborBenchmark,
  analyzeCreditCards,
  analyzeExpenseHealth,
  recommendSaveVsPayDebt,
  comparePeriods,
  DEFAULT_FINANCIAL_SETTINGS
} from '../src/lib/calculations.ts';
import type { Shift, Transaction, CreditInstallment, CreditCardAccount } from '../src/types/index.ts';

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
  // Let's test a week around Sunday 2026-09-13
  const txs: Transaction[] = [
    {
      id: 'tx-1',
      fecha: '2026-09-08', // Tuesday
      tipo: 'INGRESO',
      categoria: 'DOMICILIOS',
      monto: 50000,
      medio_pago: 'EFECTIVO'
    },
    {
      id: 'tx-2',
      fecha: '2026-09-12', // Saturday
      tipo: 'GASTO',
      categoria: 'COMBUSTIBLE',
      monto: 15000,
      medio_pago: 'EFECTIVO'
    }
  ];

  const weekData = getCalendarWeekFinancialData(txs, parseLocalDate('2026-09-13'));
  assert.equal(weekData.length, 7, 'Calendar week must have exactly 7 items (Lun to Dom)');
  assert.ok(weekData[0].periodo.startsWith('Lun'));
  assert.ok(weekData[1].periodo.startsWith('Mar'));
  assert.ok(weekData[6].periodo.startsWith('Dom'));

  // Check Tuesday (index 1)
  assert.equal(weekData[1].Domicilios, 50000);
  assert.equal(weekData[1].Ingresos, 50000);

  // Check Wednesday (index 2) should be all 0s
  assert.equal(weekData[2].Domicilios, 0);
  assert.equal(weekData[2].Gastos, 0);
  assert.equal(weekData[2].Superavit, 0);
  assert.equal(weekData[2].sinActividad, true);

  // Check Saturday (index 5)
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

test('Summary with 0 hours, 0 km, 0 transactions produces no NaN/Infinity', () => {
  const summary = calculateFinancialSummary([], []);
  assert.equal(summary.ingresosTotales, 0);
  assert.equal(summary.gastosTotales, 0);
  assert.equal(summary.superavitNeto, 0);
  assert.equal(summary.rendimientoPorHora, 0);
  assert.equal(summary.rendimientoPorKm, 0);
  assert.ok(!isNaN(summary.rendimientoPorHora));
  assert.ok(!isNaN(summary.rendimientoPorKm));
});

test('Three-tier financials separates Operativo, Obligaciones, and Flujo Disponible', () => {
  const shifts: Shift[] = [
    { id: 's1', fecha: '2026-09-10', tiempo_reparto_minutos: 300, tiempo_espera_minutos: 60, kilometros: 80 }
  ];
  const txs: Transaction[] = [
    { id: 't1', fecha: '2026-09-10', tipo: 'INGRESO', categoria: 'DOMICILIOS', monto: 120000, medio_pago: 'EFECTIVO' },
    { id: 't2', fecha: '2026-09-10', tipo: 'GASTO', categoria: 'COMBUSTIBLE', monto: 20000, medio_pago: 'EFECTIVO' },
    { id: 't3', fecha: '2026-09-10', tipo: 'GASTO', categoria: 'HONORARIOS_ACOMPANANTE', monto: 30000, medio_pago: 'EFECTIVO' },
    { id: 't4', fecha: '2026-09-10', tipo: 'INGRESO', categoria: 'OTROS_INGRESOS', monto: 50000, medio_pago: 'TRANSFERENCIA' }
  ];
  const credits: CreditInstallment[] = [
    { id: 'c1', nombre: 'Moto', montoCuota: 25000, diaPago: 10, pagadoEsteMes: false }
  ];
  const cards: CreditCardAccount[] = [
    { id: 'cc1', nombre: 'Tarjeta', saldoUtilizado: 100000, cupoTotal: 1000000, pagoMinimo: 15000, diaCorte: 15, diaLimitePago: 30 }
  ];

  const threeTier = calculateThreeTierFinancials(txs, shifts, credits, cards);

  // Operativo: Incomes (120000) - Route Expenses (20000 + 30000) = 70000
  assert.equal(threeTier.ingresosOperativos, 120000);
  assert.equal(threeTier.gastosOperativos, 50000);
  assert.equal(threeTier.resultadoOperativo, 70000);

  // Obligations: 25000 cuota + 15000 tarjeta = 40000
  assert.equal(threeTier.cuotasCreditosMes, 25000);
  assert.equal(threeTier.pagosTarjetasMes, 15000);
  assert.equal(threeTier.totalObligacionesDeuda, 40000);

  // Available Flow: 70000 - 40000 (after obligations) + 50000 (other non-operational income) = 80000
  assert.equal(threeTier.resultadoDespuesObligaciones, 30000);
  assert.equal(threeTier.flujoDisponible, 80000);
});

test('Labor Benchmark detects overload and marginal return decay', () => {
  // 240 hours (exceeds 182h reference by >25%), but income is only $1.000.000 (hourly = $4.166/h < $9.620/h)
  const shifts: Shift[] = [
    { id: 's1', fecha: '2026-09-01', tiempo_reparto_minutos: 240 * 60, tiempo_espera_minutos: 0, kilometros: 1000 }
  ];
  const txs: Transaction[] = [
    { id: 't1', fecha: '2026-09-01', tipo: 'INGRESO', categoria: 'DOMICILIOS', monto: 1200000, medio_pago: 'EFECTIVO' },
    { id: 't2', fecha: '2026-09-01', tipo: 'GASTO', categoria: 'COMBUSTIBLE', monto: 200000, medio_pago: 'EFECTIVO' }
  ];

  const labor = calculateLaborBenchmark(shifts, txs, DEFAULT_FINANCIAL_SETTINGS);
  assert.equal(labor.estadoCargaLaboral, 'CRITICA');
  assert.equal(labor.rendimientoMarginalDecreciente, true);
  assert.ok(labor.horasAdicionalesSobreReferencia > 50);
  assert.ok(!labor.cumpleMetaHora);
});

test('Credit Cards analysis evaluates utilization and traffic light correctly', () => {
  const cardsGreen: CreditCardAccount[] = [
    { id: 'c1', nombre: 'Nu', saldoUtilizado: 200000, cupoTotal: 1000000, pagoMinimo: 20000, diaCorte: 10, diaLimitePago: 25 }
  ];
  const aGreen = analyzeCreditCards(cardsGreen);
  assert.equal(aGreen.utilizacionGlobalPct, 20);
  assert.equal(aGreen.semaforoUtilizacion, 'VERDE');

  const cardsYellow: CreditCardAccount[] = [
    { id: 'c2', nombre: 'Bancolombia', saldoUtilizado: 450000, cupoTotal: 1000000, pagoMinimo: 45000, diaCorte: 10, diaLimitePago: 25 }
  ];
  const aYellow = analyzeCreditCards(cardsYellow);
  assert.equal(aYellow.utilizacionGlobalPct, 45);
  assert.equal(aYellow.semaforoUtilizacion, 'AMARILLO');

  const cardsRed: CreditCardAccount[] = [
    { id: 'c3', nombre: 'RappiCard', saldoUtilizado: 750000, cupoTotal: 1000000, pagoMinimo: 80000, diaCorte: 10, diaLimitePago: 25 }
  ];
  const aRed = analyzeCreditCards(cardsRed);
  assert.equal(aRed.utilizacionGlobalPct, 75);
  assert.equal(aRed.semaforoUtilizacion, 'ROJO');
});

test('Decision engine: prioritizes emergency fund when cushion is low', () => {
  const recLowCushion = recommendSaveVsPayDebt(
    200000,
    [],
    [{ id: 'c1', nombre: 'Card', saldoUtilizado: 150000, cupoTotal: 500000, pagoMinimo: 15000, diaCorte: 1, diaLimitePago: 15 }],
    50000, // only $50.000 savings
    1000000, // essential expenses $1.000.000 -> <1 month
    DEFAULT_FINANCIAL_SETTINGS
  );

  assert.equal(recLowCushion.prioridadPrincipal, 'CREAR_FONDO_EMERGENCIA');
  assert.ok(recLowCushion.montoRecomendadoAhorro > recLowCushion.montoRecomendadoAbono);
});

test('Decision engine: prioritizes high interest debt when emergency fund is established', () => {
  const recHighDebt = recommendSaveVsPayDebt(
    300000,
    [],
    [{ id: 'c1', nombre: 'Card', saldoUtilizado: 500000, cupoTotal: 1000000, pagoMinimo: 50000, diaCorte: 1, diaLimitePago: 15, tasaInteresEA: 28 }],
    2500000, // $2.500.000 savings
    1000000, // essential expenses $1.000.000 -> 2.5 months!
    DEFAULT_FINANCIAL_SETTINGS
  );

  assert.equal(recHighDebt.prioridadPrincipal, 'ABONAR_DEUDA_INTERES_ALTO');
  assert.ok(recHighDebt.montoRecomendadoAbono > recHighDebt.montoRecomendadoAhorro);
});

test('Expense analysis classifies Jhony as Productive and checks 50/30/20', () => {
  const txs: Transaction[] = [
    { id: '1', fecha: '2026-09-01', tipo: 'INGRESO', categoria: 'DOMICILIOS', monto: 1000000, medio_pago: 'EFECTIVO' },
    { id: '2', fecha: '2026-09-01', tipo: 'GASTO', categoria: 'COMBUSTIBLE', monto: 200000, medio_pago: 'EFECTIVO' },
    { id: '3', fecha: '2026-09-01', tipo: 'GASTO', categoria: 'HONORARIOS_ACOMPANANTE', monto: 150000, medio_pago: 'EFECTIVO' },
    { id: '4', fecha: '2026-09-01', tipo: 'GASTO', categoria: 'ALIMENTACION', monto: 100000, medio_pago: 'EFECTIVO' }
  ];

  const analysis = analyzeExpenseHealth(txs);
  const jhonyItem = analysis.items.find(i => i.categoria === 'HONORARIOS_ACOMPANANTE');
  assert.ok(jhonyItem);
  assert.equal(jhonyItem?.clasificacion, 'PRODUCTIVO');
  assert.ok(analysis.necesidadesTotal >= 450000);
});

test('Period comparison returns valid percentage changes and human narrative', () => {
  const prevTxs: Transaction[] = [
    { id: 'p1', fecha: '2026-08-01', tipo: 'INGRESO', categoria: 'DOMICILIOS', monto: 800000, medio_pago: 'EFECTIVO' },
    { id: 'p2', fecha: '2026-08-01', tipo: 'GASTO', categoria: 'COMBUSTIBLE', monto: 100000, medio_pago: 'EFECTIVO' }
  ];
  const currTxs: Transaction[] = [
    { id: 'c1', fecha: '2026-09-01', tipo: 'INGRESO', categoria: 'DOMICILIOS', monto: 1200000, medio_pago: 'EFECTIVO' },
    { id: 'c2', fecha: '2026-09-01', tipo: 'GASTO', categoria: 'COMBUSTIBLE', monto: 150000, medio_pago: 'EFECTIVO' }
  ];

  const comp = comparePeriods(currTxs, prevTxs, [], [], 'Mes actual vs Mes anterior');
  assert.equal(comp.variacionIngresosPct, 50); // 800k -> 1200k = +50%
  assert.equal(comp.variacionSuperavitPct, 50); // 700k -> 1050k = +50%
  assert.ok(comp.explicacionNarrativa.length > 20);
});
