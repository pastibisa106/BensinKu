import React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Download,
  TrendingDown,
  TrendingUp,
  Minus,
} from 'lucide-react';
import { formatIDR, formatNumberID } from '../utils/fuelCalculations';
import type { MonthlyRecap } from '../types/fuel';

interface MonthlyRecapCardProps {
  recap: MonthlyRecap;
  prevRecap: MonthlyRecap | null;
  availableMonths: string[];
  onSelectMonth: (monthKey: string) => void;
  onExportMonthCSV: (monthKey: string) => void;
}

export const MonthlyRecapCard: React.FC<MonthlyRecapCardProps> = ({
  recap,
  prevRecap,
  availableMonths,
  onSelectMonth,
  onExportMonthCSV,
}) => {
  const currentIdx = availableMonths.indexOf(recap.monthKey);
  const canPrev = currentIdx > 0;
  const canNext = currentIdx >= 0 && currentIdx < availableMonths.length - 1;

  const spendDelta =
    prevRecap && prevRecap.totalSpent > 0
      ? ((recap.totalSpent - prevRecap.totalSpent) / prevRecap.totalSpent) * 100
      : null;

  const diffNominal = prevRecap ? recap.totalSpent - prevRecap.totalSpent : null;

  return (
    <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 sm:p-6">
      {/* Header & Month Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-slate-100">
            Rekapan Akhir Bulan
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Ringkasan pengeluaran, jarak tempuh, dan efisiensi per kilometer
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex items-center rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 p-0.5">
            <button
              type="button"
              disabled={!canPrev}
              onClick={() => canPrev && onSelectMonth(availableMonths[currentIdx - 1])}
              className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none transition-colors"
              aria-label="Bulan sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">
              {recap.monthLabel}
            </span>
            <button
              type="button"
              disabled={!canNext}
              onClick={() => canNext && onSelectMonth(availableMonths[currentIdx + 1])}
              className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none transition-colors"
              aria-label="Bulan berikutnya"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => onExportMonthCSV(recap.monthKey)}
            disabled={recap.fillCount === 0}
            className="min-h-[40px] inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 whitespace-nowrap shrink-0 transition-colors"
            title="Unduh rekap CSV bulan ini"
          >
            <Download className="w-3.5 h-3.5 shrink-0" />
            <span>CSV</span>
          </button>
        </div>
      </div>

      {/* Primary Total Spending Hero Band */}
      <div className="mt-4 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 pb-5 border-b border-slate-100 dark:border-slate-800">
        <div>
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Total Pengeluaran · {recap.monthLabel}
          </span>
          <div className="mt-1 text-2xl sm:text-3xl font-bold font-mono-num tracking-tight text-slate-900 dark:text-slate-100">
            {formatIDR(recap.totalSpent)}
          </div>
        </div>

        {spendDelta !== null && diffNominal !== null && prevRecap ? (
          <div className="flex items-center gap-1.5 text-xs font-medium">
            {spendDelta > 0.5 ? (
              <>
                <TrendingUp className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span className="text-amber-700 dark:text-amber-300 font-mono-num">
                  Naik {formatNumberID(Math.abs(spendDelta), 1)}% (+{formatIDR(diffNominal)})
                </span>
              </>
            ) : spendDelta < -0.5 ? (
              <>
                <TrendingDown className="w-4 h-4 text-teal-700 dark:text-teal-400 shrink-0" />
                <span className="text-teal-700 dark:text-teal-300 font-mono-num">
                  Hemat {formatNumberID(Math.abs(spendDelta), 1)}% ({formatIDR(Math.abs(diffNominal))})
                </span>
              </>
            ) : (
              <>
                <Minus className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="text-slate-600 dark:text-slate-400">
                  Stabil dibanding {prevRecap.shortLabel}
                </span>
              </>
            )}
            <span className="text-slate-400 dark:text-slate-500">
              vs {prevRecap.shortLabel}
            </span>
          </div>
        ) : (
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {recap.fillCount} kali pengisian tercatat
          </span>
        )}
      </div>

      {/* Metrics Grid (clean whitespace + hairline dividers, zero nested bordered boxes) */}
      <div className="mt-5 grid grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-5">
        <div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Rata-Rata Biaya / Hari
          </div>
          <div className="mt-1 text-lg font-bold font-mono-num text-amber-700 dark:text-amber-400">
            {formatIDR(recap.avgDailyCost)}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Dihitung {recap.daysCounted} dari {recap.daysInMonth} hari
          </div>
        </div>

        <div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Efisiensi Rata-Rata
          </div>
          <div className="mt-1 text-lg font-bold font-mono-num text-teal-700 dark:text-teal-400">
            {recap.avgKmPerLiter !== null
              ? `${formatNumberID(recap.avgKmPerLiter, 1)} km/L`
              : '—'}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono-num mt-0.5">
            {recap.avgLiterPerKm !== null
              ? `${formatNumberID(recap.avgLiterPerKm, 3)} L/km · ${formatNumberID(recap.avgLiterPer100Km ?? 0, 2)} L/100km`
              : 'Butuh min. 2 pengisian penuh'}
          </div>
        </div>

        <div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Biaya per Kilometer
          </div>
          <div className="mt-1 text-lg font-bold font-mono-num text-slate-900 dark:text-slate-100">
            {recap.avgCostPerKm !== null
              ? `${formatIDR(recap.avgCostPerKm)}/km`
              : '—'}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono-num mt-0.5">
            Jarak: {recap.totalDistanceKm.toLocaleString('id-ID')} km
          </div>
        </div>

        <div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Total Bahan Bakar
          </div>
          <div className="mt-1 text-lg font-bold font-mono-num text-slate-900 dark:text-slate-100">
            {formatNumberID(recap.totalLiters, 2)} L
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            {recap.fillCount} kali pengisian
          </div>
        </div>

        <div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Harga Rata-Rata BBM
          </div>
          <div className="mt-1 text-lg font-bold font-mono-num text-slate-900 dark:text-slate-100">
            {recap.avgPricePerLiter > 0
              ? `${formatIDR(recap.avgPricePerLiter)}/L`
              : '—'}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Rata-rata tertimbang
          </div>
        </div>

        <div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Rentang Odometer
          </div>
          <div className="mt-1 text-lg font-bold font-mono-num text-slate-900 dark:text-slate-100">
            {recap.maxOdometer !== null
              ? `${recap.maxOdometer.toLocaleString('id-ID')} km`
              : '—'}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono-num mt-0.5">
            {recap.minOdometer !== null && recap.maxOdometer !== null
              ? `Awal ${recap.minOdometer.toLocaleString('id-ID')} km`
              : 'Belum ada odometer'}
          </div>
        </div>
      </div>

      {/* Best/Worst efficiency summary footer if available */}
      {recap.bestKmPerLiter !== null && recap.worstKmPerLiter !== null && (
        <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
          <span>
            Paling irit bulan ini:{' '}
            <strong className="font-mono-num text-teal-700 dark:text-teal-400">
              {formatNumberID(recap.bestKmPerLiter, 1)} km/L
            </strong>
          </span>
          <span>
            Terboros bulan ini:{' '}
            <strong className="font-mono-num text-slate-700 dark:text-slate-200">
              {formatNumberID(recap.worstKmPerLiter, 1)} km/L
            </strong>
          </span>
        </div>
      )}
    </section>
  );
};
