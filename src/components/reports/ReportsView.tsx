import React, { useState, useMemo } from 'react';
import { useAppData } from '../../context/AppDataContext';
import {
  generateConsolidatedReport,
  exportToCSV,
  formatCurrency,
  formatMinutes
} from '../../lib/calculations';
import { FileSpreadsheet, Download } from 'lucide-react';

export const ReportsView: React.FC = () => {
  const { shifts, transactions } = useAppData();
  const [groupBy, setGroupBy] = useState<'semana' | 'mes'>('semana');

  const reports = useMemo(() => {
    return generateConsolidatedReport(shifts, transactions, groupBy);
  }, [shifts, transactions, groupBy]);

  const totals = useMemo(() => {
    return reports.reduce(
      (acc, r) => ({
        domicilios: acc.domicilios + r.domicilios,
        pasajeros: acc.pasajeros + r.pasajeros,
        otrosIngresos: acc.otrosIngresos + r.otrosIngresos,
        totalIngresos: acc.totalIngresos + r.totalIngresos,
        gasolina: acc.gasolina + r.gasolina,
        otrosGastos: acc.otrosGastos + r.otrosGastos,
        totalGastos: acc.totalGastos + r.totalGastos,
        superavit: acc.superavit + r.superavit,
        minutosReparto: acc.minutosReparto + r.minutosReparto,
        minutosEspera: acc.minutosEspera + r.minutosEspera,
        kilometros: acc.kilometros + r.kilometros
      }),
      {
        domicilios: 0,
        pasajeros: 0,
        otrosIngresos: 0,
        totalIngresos: 0,
        gasolina: 0,
        otrosGastos: 0,
        totalGastos: 0,
        superavit: 0,
        minutosReparto: 0,
        minutosEspera: 0,
        kilometros: 0
      }
    );
  }, [reports]);

  const totalHorasGen = (totals.minutosReparto + totals.minutosEspera) / 60;
  const avgRendimientoHora = totalHorasGen > 0 ? totals.totalIngresos / totalHorasGen : 0;

  return (
    <div className="space-y-4 pb-20 max-w-5xl mx-auto">
      {/* Header del Reporte */}
      <div className="app-card p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-cyan-500" />
            Consolidado Contable
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Desglose financiero y operativo por periodo para análisis y balances
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Toggle Semana / Mes */}
          <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-white/10">
            <button
              onClick={() => setGroupBy('semana')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                groupBy === 'semana'
                  ? 'bg-cyan-500 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Semanas
            </button>
            <button
              onClick={() => setGroupBy('mes')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                groupBy === 'mes'
                  ? 'bg-cyan-500 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Meses
            </button>
          </div>

          {/* Botón Descarga CSV */}
          <button
            onClick={() => exportToCSV(reports)}
            disabled={reports.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-bold shadow-md hover:opacity-90 transition-all disabled:opacity-40"
            title="Exportar a archivo Excel / CSV"
          >
            <Download className="w-4 h-4" />
            <span>CSV</span>
          </button>
        </div>
      </div>

      {/* Tarjetas Resumen Acumulado del Reporte */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="app-card p-3.5 rounded-xl">
          <span className="text-[10px] uppercase font-bold text-slate-400">Ingresos Totales</span>
          <p className="text-base font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
            {formatCurrency(totals.totalIngresos)}
          </p>
        </div>
        <div className="app-card p-3.5 rounded-xl">
          <span className="text-[10px] uppercase font-bold text-slate-400">Gastos Totales</span>
          <p className="text-base font-black text-rose-600 dark:text-rose-400 mt-0.5">
            {formatCurrency(totals.totalGastos)}
          </p>
        </div>
        <div className="app-card p-3.5 rounded-xl">
          <span className="text-[10px] uppercase font-bold text-slate-400">Superávit Libre</span>
          <p className={`text-base font-black mt-0.5 ${totals.superavit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
            {formatCurrency(totals.superavit)}
          </p>
        </div>
        <div className="app-card p-3.5 rounded-xl">
          <span className="text-[10px] uppercase font-bold text-slate-400">Promedio $/h</span>
          <p className="text-base font-black text-cyan-600 dark:text-cyan-400 mt-0.5">
            {formatCurrency(avgRendimientoHora)}/h
          </p>
        </div>
      </div>

      {/* Tabla Responsiva */}
      <div className="app-card rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-white/10 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <th className="py-3 px-3.5 sticky left-0 bg-slate-50 dark:bg-slate-900 z-10">Periodo</th>
                <th className="py-3 px-3 text-right">Domicilios</th>
                <th className="py-3 px-3 text-right">Pasajeros</th>
                <th className="py-3 px-3 text-right">Otros Ing.</th>
                <th className="py-3 px-3 text-right text-emerald-600 dark:text-emerald-400 font-extrabold">Total Ing.</th>
                <th className="py-3 px-3 text-right">Gasolina</th>
                <th className="py-3 px-3 text-right">Otros Gastos</th>
                <th className="py-3 px-3 text-right text-rose-600 dark:text-rose-400 font-extrabold">Total Gastos</th>
                <th className="py-3 px-3 text-right font-black">Superávit</th>
                <th className="py-3 px-3 text-center">Horas (Rep/Esp)</th>
                <th className="py-3 px-3 text-right">Km</th>
                <th className="py-3 px-3 text-right text-cyan-600 dark:text-cyan-400 font-bold">$/h</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {reports.map((row, idx) => (
                <tr
                  key={row.key}
                  className={`hover:bg-slate-50 dark:hover:bg-white/5 transition-colors ${
                    idx % 2 === 0 ? 'bg-transparent' : 'bg-slate-50/50 dark:bg-slate-900/30'
                  }`}
                >
                  <td className="py-3 px-3.5 font-bold text-slate-900 dark:text-white whitespace-nowrap sticky left-0 bg-white dark:bg-slate-900 z-10">
                    {row.periodo}
                  </td>
                  <td className="py-3 px-3 text-right text-slate-700 dark:text-slate-300 font-medium">
                    {formatCurrency(row.domicilios)}
                  </td>
                  <td className="py-3 px-3 text-right text-slate-700 dark:text-slate-300 font-medium">
                    {formatCurrency(row.pasajeros)}
                  </td>
                  <td className="py-3 px-3 text-right text-slate-700 dark:text-slate-300 font-medium">
                    {formatCurrency(row.otrosIngresos)}
                  </td>
                  <td className="py-3 px-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(row.totalIngresos)}
                  </td>
                  <td className="py-3 px-3 text-right text-slate-700 dark:text-slate-300 font-medium">
                    {formatCurrency(row.gasolina)}
                  </td>
                  <td className="py-3 px-3 text-right text-slate-700 dark:text-slate-300 font-medium">
                    {formatCurrency(row.otrosGastos)}
                  </td>
                  <td className="py-3 px-3 text-right font-bold text-rose-600 dark:text-rose-400">
                    {formatCurrency(row.totalGastos)}
                  </td>
                  <td className="py-3 px-3 text-right font-black">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[11px] ${
                        row.superavit >= 0
                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-extrabold'
                          : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 font-extrabold'
                      }`}
                    >
                      {formatCurrency(row.superavit)}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center whitespace-nowrap text-slate-600 dark:text-slate-300">
                    <span className="text-cyan-600 dark:text-cyan-400 font-semibold">{formatMinutes(row.minutosReparto)}</span>
                    <span className="text-slate-400 mx-1">/</span>
                    <span className="text-slate-600 dark:text-slate-400 font-semibold">{formatMinutes(row.minutosEspera)}</span>
                  </td>
                  <td className="py-3 px-3 text-right text-slate-700 dark:text-slate-300 font-medium">
                    {row.kilometros.toFixed(1)} km
                  </td>
                  <td className="py-3 px-3 text-right text-cyan-600 dark:text-cyan-400 font-bold whitespace-nowrap">
                    {formatCurrency(row.rendimientoHora)}
                  </td>
                </tr>
              ))}

              {reports.length === 0 && (
                <tr>
                  <td colSpan={12} className="py-8 text-center text-slate-400">
                    No hay turnos o movimientos registrados para generar el reporte.
                  </td>
                </tr>
              )}
            </tbody>
            {reports.length > 0 && (
              <tfoot>
                <tr className="bg-slate-100 dark:bg-slate-950 font-black border-t border-slate-300 dark:border-white/10 text-slate-900 dark:text-white">
                  <td className="py-3.5 px-3.5 sticky left-0 bg-slate-100 dark:bg-slate-950 z-10 text-cyan-600 dark:text-cyan-400">
                    TOTALES
                  </td>
                  <td className="py-3.5 px-3 text-right">{formatCurrency(totals.domicilios)}</td>
                  <td className="py-3.5 px-3 text-right">{formatCurrency(totals.pasajeros)}</td>
                  <td className="py-3.5 px-3 text-right">{formatCurrency(totals.otrosIngresos)}</td>
                  <td className="py-3.5 px-3 text-right text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(totals.totalIngresos)}
                  </td>
                  <td className="py-3.5 px-3 text-right">{formatCurrency(totals.gasolina)}</td>
                  <td className="py-3.5 px-3 text-right">{formatCurrency(totals.otrosGastos)}</td>
                  <td className="py-3.5 px-3 text-right text-rose-600 dark:text-rose-400">
                    {formatCurrency(totals.totalGastos)}
                  </td>
                  <td className="py-3.5 px-3 text-right text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(totals.superavit)}
                  </td>
                  <td className="py-3.5 px-3 text-center whitespace-nowrap">
                    {formatMinutes(totals.minutosReparto)} / {formatMinutes(totals.minutosEspera)}
                  </td>
                  <td className="py-3.5 px-3 text-right">{totals.kilometros.toFixed(1)} km</td>
                  <td className="py-3.5 px-3 text-right text-cyan-600 dark:text-cyan-400">
                    {formatCurrency(avgRendimientoHora)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
};
