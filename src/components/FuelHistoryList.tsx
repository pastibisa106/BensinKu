import React, { useMemo, useState } from 'react';
import { Fuel, Pencil, Trash2, Search } from 'lucide-react';
import {
  formatDateID,
  formatIDR,
  formatMonthLabel,
  formatNumberID,
} from '../utils/fuelCalculations';
import type { FuelLog, FuelLogWithMetrics } from '../types/fuel';

interface FuelHistoryListProps {
  logs: FuelLogWithMetrics[];
  availableMonths: string[];
  onEdit: (log: FuelLog) => void;
  onDelete: (id: string) => void;
  onAddNew: () => void;
}

export const FuelHistoryList: React.FC<FuelHistoryListProps> = ({
  logs,
  availableMonths,
  onEdit,
  onDelete,
  onAddNew,
}) => {
  const [monthFilter, setMonthFilter] = useState<string>('all');
  const [query, setQuery] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const reversed = [...logs].reverse();
    return reversed.filter((log) => {
      if (monthFilter !== 'all' && !log.date.startsWith(monthFilter)) {
        return false;
      }
      if (query.trim()) {
        const q = query.trim().toLowerCase();
        const hay = `${log.fuelType} ${log.note ?? ''} ${log.date} ${log.odometer}`.toLowerCase();
        return hay.includes(q);
      }
      return true;
    });
  }, [logs, monthFilter, query]);

  return (
    <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 overflow-hidden">
      {/* Header & Filter Bar */}
      <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Riwayat Pengisian BBM
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {filtered.length} catatan ditampilkan
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 sm:flex-none">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari BBM / catatan..."
              aria-label="Cari riwayat pengisian"
              className="w-full sm:w-44 min-h-[40px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 pl-9 pr-3 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-600"
            />
          </div>

          <select
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
            aria-label="Filter bulan riwayat"
            className="min-h-[40px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 px-3 text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-600"
          >
            <option value="all">Semua Bulan</option>
            {[...availableMonths].reverse().map((mk) => (
              <option key={mk} value={mk}>
                {formatMonthLabel(mk)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Empty State */}
      {filtered.length === 0 ? (
        <div className="p-10 text-center">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Belum ada catatan pengisian yang cocok.
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Mulai catat pengisian bensin untuk memantau efisiensi dan pengeluaran.
          </p>
          <button
            type="button"
            onClick={onAddNew}
            className="mt-4 min-h-[42px] px-5 rounded-xl bg-teal-700 text-white text-xs font-semibold hover:bg-teal-800 transition-colors"
          >
            Catat Pengisian Pertama
          </button>
        </div>
      ) : (
        <ul className="divide-y divide-slate-100 dark:divide-slate-800">
          {filtered.map((log) => {
            const isConfirming = confirmDeleteId === log.id;
            return (
              <li
                key={log.id}
                className="px-4 sm:px-5 py-3.5 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  {/* Left Icon + Details */}
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-400 flex items-center justify-center shrink-0 mt-0.5">
                      <Fuel className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                        <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                          {formatDateID(log.date)}
                        </span>
                        <span className="text-xs text-slate-400" aria-hidden="true">
                          ·
                        </span>
                        <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                          {log.fuelType}
                        </span>
                        {!log.isFullTank && (
                          <>
                            <span className="text-xs text-slate-400" aria-hidden="true">
                              ·
                            </span>
                            <span className="text-xs text-amber-600 dark:text-amber-400">
                              Isi sebagian
                            </span>
                          </>
                        )}
                      </div>

                      <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-xs text-slate-500 dark:text-slate-400 font-mono-num">
                        <span>{formatNumberID(log.liters, 2)} L</span>
                        <span aria-hidden="true">·</span>
                        <span>Odo {log.odometer.toLocaleString('id-ID')} km</span>
                        {log.distanceFromPrevKm !== null && log.distanceFromPrevKm > 0 && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span>+{log.distanceFromPrevKm.toLocaleString('id-ID')} km</span>
                          </>
                        )}
                      </div>

                      {log.note && (
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 truncate max-w-md">
                          {log.note}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right Price & Efficiency */}
                  <div className="text-right shrink-0">
                    <div className="text-sm font-bold font-mono-num text-slate-900 dark:text-slate-100">
                      {formatIDR(log.totalPrice)}
                    </div>
                    <div className="mt-0.5 text-xs font-mono-num text-slate-500 dark:text-slate-400">
                      {formatIDR(log.pricePerLiter)}/L
                    </div>
                    <div className="mt-0.5 text-xs font-mono-num font-semibold text-teal-700 dark:text-teal-400">
                      {log.kmPerLiter !== null
                        ? `${formatNumberID(log.kmPerLiter, 1)} km/L`
                        : log.isBaseline
                        ? 'Baseline awal'
                        : '—'}
                    </div>
                  </div>
                </div>

                {/* Action Row */}
                <div className="mt-2.5 pl-12 flex items-center justify-between gap-2">
                  <div className="text-[11px] font-mono-num text-slate-400 dark:text-slate-500">
                    {log.literPerKm !== null && (
                      <span>
                        {formatNumberID(log.literPerKm, 3)} L/km ·{' '}
                        {formatIDR(log.costPerKm ?? 0)}/km
                      </span>
                    )}
                  </div>

                  {isConfirming ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-rose-600 dark:text-rose-400 font-medium">
                        Hapus catatan?
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          onDelete(log.id);
                          setConfirmDeleteId(null);
                        }}
                        className="min-h-[36px] px-3 rounded-lg bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 transition-colors"
                      >
                        Ya, Hapus
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(null)}
                        className="min-h-[36px] px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        Batal
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onEdit(log)}
                        className="min-h-[36px] min-w-[36px] inline-flex items-center justify-center gap-1 px-2.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        aria-label="Ubah catatan"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        <span>Ubah</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(log.id)}
                        className="min-h-[36px] min-w-[36px] inline-flex items-center justify-center gap-1 px-2.5 rounded-lg text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                        aria-label="Hapus catatan"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Hapus</span>
                      </button>
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
};
