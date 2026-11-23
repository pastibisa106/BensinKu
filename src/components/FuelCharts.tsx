import React, { useMemo, useState } from 'react';
import {
  computeDailySeriesForMonth,
  formatDateID,
  formatIDR,
  formatNumberID,
} from '../utils/fuelCalculations';
import type { FuelLogWithMetrics, MonthlyRecap } from '../types/fuel';

interface MonthlySpendingChartProps {
  trends: MonthlyRecap[];
  selectedMonth: string;
  onSelectMonth: (monthKey: string) => void;
}

type MonthlyMetricMode = 'spent' | 'daily' | 'efficiency';

export const MonthlySpendingChart: React.FC<MonthlySpendingChartProps> = ({
  trends,
  selectedMonth,
  onSelectMonth,
}) => {
  const [mode, setMode] = useState<MonthlyMetricMode>('spent');
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);

  const visibleTrends = useMemo(() => trends.slice(-8), [trends]);

  const activeItem = useMemo(() => {
    const key = hoveredKey ?? selectedMonth;
    return (
      visibleTrends.find((t) => t.monthKey === key) ??
      visibleTrends[visibleTrends.length - 1] ??
      null
    );
  }, [visibleTrends, hoveredKey, selectedMonth]);

  if (visibleTrends.length === 0) {
    return (
      <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5">
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
          Tren Pengeluaran Bulanan
        </h2>
        <p className="mt-6 text-sm text-slate-500 dark:text-slate-400">
          Belum ada data pengisian untuk menampilkan grafik bulanan.
        </p>
      </section>
    );
  }

  const getValue = (item: MonthlyRecap) => {
    if (mode === 'spent') return item.totalSpent;
    if (mode === 'daily') return item.avgDailyCost;
    return item.avgKmPerLiter ?? 0;
  };

  const maxVal = Math.max(
    1,
    ...visibleTrends.map((t) => getValue(t))
  );
  const niceMax = maxVal * 1.15;

  const avgAcrossMonths =
    visibleTrends.reduce((s, t) => s + getValue(t), 0) / visibleTrends.length;

  const svgW = 640;
  const svgH = 230;
  const padL = 58;
  const padR = 16;
  const padT = 18;
  const padB = 34;
  const plotW = svgW - padL - padR;
  const plotH = svgH - padT - padB;

  const step = plotW / visibleTrends.length;
  const barW = Math.min(44, Math.max(18, step * 0.52));

  const formatYTick = (v: number) => {
    if (mode === 'efficiency') return `${formatNumberID(v, 0)} km/L`;
    if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}jt`;
    if (v >= 1_000) return `${Math.round(v / 1_000)}rb`;
    return `${Math.round(v)}`;
  };

  const avgY = padT + plotH - (avgAcrossMonths / niceMax) * plotH;

  return (
    <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Tren Pengeluaran Bulanan
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Ketuk batang bulan untuk melihat rekap detail
          </p>
        </div>

        <div className="inline-flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 self-start">
          <button
            type="button"
            onClick={() => setMode('spent')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
              mode === 'spent'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Total Rp
          </button>
          <button
            type="button"
            onClick={() => setMode('daily')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
              mode === 'daily'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Rp / Hari
          </button>
          <button
            type="button"
            onClick={() => setMode('efficiency')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
              mode === 'efficiency'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            km / Liter
          </button>
        </div>
      </div>

      {activeItem && (
        <div className="mt-3 flex flex-wrap items-baseline justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-baseline gap-2">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {activeItem.monthLabel}:
            </span>
            <span className="text-lg font-bold font-mono-num text-slate-900 dark:text-slate-100">
              {mode === 'spent' && formatIDR(activeItem.totalSpent)}
              {mode === 'daily' && `${formatIDR(activeItem.avgDailyCost)}/hari`}
              {mode === 'efficiency' &&
                (activeItem.avgKmPerLiter !== null
                  ? `${formatNumberID(activeItem.avgKmPerLiter, 1)} km/L`
                  : '—')}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-mono-num">
            <span>{formatNumberID(activeItem.totalLiters, 1)} L</span>
            <span aria-hidden="true">·</span>
            <span>{activeItem.totalDistanceKm.toLocaleString('id-ID')} km</span>
            <span aria-hidden="true">·</span>
            <span>{activeItem.fillCount}x isi</span>
          </div>
        </div>
      )}

      <div className="mt-3 w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${svgW} ${svgH}`}
          className="w-full h-auto select-none"
          role="img"
          aria-label="Grafik tren pengeluaran bahan bakar bulanan"
        >
          {/* Horizontal gridlines */}
          {[0, 0.25, 0.5, 0.75, 1].map((frac) => {
            const y = padT + plotH * (1 - frac);
            const val = niceMax * frac;
            return (
              <g key={frac}>
                <line
                  x1={padL}
                  y1={y}
                  x2={svgW - padR}
                  y2={y}
                  className="stroke-slate-100 dark:stroke-slate-800"
                  strokeWidth="1"
                />
                <text
                  x={padL - 8}
                  y={y + 4}
                  textAnchor="end"
                  className="fill-slate-400 dark:fill-slate-500 text-[10px] font-mono-num"
                >
                  {formatYTick(val)}
                </text>
              </g>
            );
          })}

          {/* Average dashed line */}
          {avgAcrossMonths > 0 && (
            <g>
              <line
                x1={padL}
                y1={avgY}
                x2={svgW - padR}
                y2={avgY}
                className="stroke-amber-500/70"
                strokeWidth="1.25"
                strokeDasharray="4 4"
              />
            </g>
          )}

          {/* Bars */}
          {visibleTrends.map((item, idx) => {
            const val = getValue(item);
            const barH = Math.max(4, (val / niceMax) * plotH);
            const x = padL + idx * step + (step - barW) / 2;
            const y = padT + plotH - barH;
            const isSelected = item.monthKey === selectedMonth;
            const isHovered = item.monthKey === hoveredKey;

            return (
              <g
                key={item.monthKey}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredKey(item.monthKey)}
                onMouseLeave={() => setHoveredKey(null)}
                onClick={() => onSelectMonth(item.monthKey)}
              >
                {/* Invisible full-height touch column */}
                <rect
                  x={padL + idx * step}
                  y={padT}
                  width={step}
                  height={plotH + padB}
                  fill="transparent"
                />
                <rect
                  x={x}
                  y={y}
                  width={barW}
                  height={barH}
                  rx="6"
                  className={
                    isSelected
                      ? 'fill-teal-700 dark:fill-teal-500'
                      : isHovered
                      ? 'fill-teal-500 dark:fill-teal-400'
                      : 'fill-slate-300 dark:fill-slate-700'
                  }
                />
                <text
                  x={x + barW / 2}
                  y={svgH - 10}
                  textAnchor="middle"
                  className={`text-[11px] ${
                    isSelected
                      ? 'fill-teal-800 dark:fill-teal-300 font-semibold'
                      : 'fill-slate-500 dark:fill-slate-400'
                  }`}
                >
                  {item.shortLabel}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </section>
  );
};

interface DailyAverageChartProps {
  monthKey: string;
  monthLabel: string;
  enrichedLogs: FuelLogWithMetrics[];
  monthlyAvgDailyCost: number;
  monthlyAvgPricePerLiter: number;
  referenceTodayISO: string;
}

type DailyChartMode = 'daily_cost' | 'price_per_liter';

export const DailyAverageChart: React.FC<DailyAverageChartProps> = ({
  monthKey,
  monthLabel,
  enrichedLogs,
  monthlyAvgDailyCost,
  monthlyAvgPricePerLiter,
  referenceTodayISO,
}) => {
  const [mode, setMode] = useState<DailyChartMode>('daily_cost');
  const [selectedDayIndex, setSelectedDayIndex] = useState<number | null>(null);
  const [selectedPriceIndex, setSelectedPriceIndex] = useState<number | null>(null);

  const dailySeries = useMemo(
    () => computeDailySeriesForMonth(monthKey, enrichedLogs, referenceTodayISO),
    [monthKey, enrichedLogs, referenceTodayISO]
  );

  const priceHistory = useMemo(
    () => enrichedLogs.slice(-14),
    [enrichedLogs]
  );

  const activeDay =
    dailySeries[selectedDayIndex ?? dailySeries.length - 1] ?? null;
  const activePriceLog =
    priceHistory[selectedPriceIndex ?? priceHistory.length - 1] ?? null;

  const svgW = 640;
  const svgH = 230;
  const padL = 58;
  const padR = 16;
  const padT = 18;
  const padB = 34;
  const plotW = svgW - padL - padR;
  const plotH = svgH - padT - padB;

  const formatY = (v: number) => {
    if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}jt`;
    if (v >= 1_000) return `${Math.round(v / 1_000)}rb`;
    return `${Math.round(v)}`;
  };

  if (mode === 'daily_cost') {
    const maxVal = Math.max(
      monthlyAvgDailyCost * 1.35,
      ...dailySeries.map((d) => Math.max(d.spentOnDay, d.amortizedDailyCost, d.runningDailyAvg)),
      5000
    );
    const niceMax = maxVal * 1.1;
    const step = dailySeries.length > 0 ? plotW / dailySeries.length : plotW;
    const barW = Math.max(4, Math.min(14, step * 0.55));

    const runningPath = dailySeries
      .map((pt, i) => {
        const x = padL + i * step + step / 2;
        const y = padT + plotH - (pt.runningDailyAvg / niceMax) * plotH;
        return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(' ');

    const amortizedPath = dailySeries
      .map((pt, i) => {
        const x = padL + i * step + step / 2;
        const y = padT + plotH - (pt.amortizedDailyCost / niceMax) * plotH;
        return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(' ');

    const avgLineY =
      padT + plotH - (monthlyAvgDailyCost / niceMax) * plotH;

    return (
      <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Grafik Biaya Rata-Rata per Hari
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {monthLabel} · Rata-rata {formatIDR(monthlyAvgDailyCost)}/hari
            </p>
          </div>

          <div className="inline-flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 self-start">
            <button
              type="button"
              onClick={() => setMode('daily_cost')}
              className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs whitespace-nowrap shrink-0"
            >
              Biaya / Hari
            </button>
            <button
              type="button"
              onClick={() => setMode('price_per_liter')}
              className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 whitespace-nowrap shrink-0"
            >
              Harga / Liter
            </button>
          </div>
        </div>

        {activeDay ? (
          <div className="mt-3 flex flex-wrap items-baseline justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-baseline gap-2">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {activeDay.label}:
              </span>
              <span className="text-lg font-bold font-mono-num text-amber-700 dark:text-amber-400">
                {formatIDR(activeDay.runningDailyAvg)}/hari
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-mono-num">
              <span>
                Isi tgl ini:{' '}
                <strong className="text-slate-800 dark:text-slate-200">
                  {activeDay.spentOnDay > 0 ? formatIDR(activeDay.spentOnDay) : 'Rp 0'}
                </strong>
              </span>
              <span aria-hidden="true">·</span>
              <span>Laju harian: {formatIDR(activeDay.amortizedDailyCost)}/hr</span>
            </div>
          </div>
        ) : (
          <div className="mt-3 pb-3 text-xs text-slate-500">
            Tidak ada catatan di bulan ini.
          </div>
        )}

        <div className="mt-3 w-full overflow-hidden">
          <svg
            viewBox={`0 0 ${svgW} ${svgH}`}
            className="w-full h-auto select-none"
            role="img"
            aria-label="Grafik biaya rata-rata bahan bakar per hari"
          >
            {[0, 0.25, 0.5, 0.75, 1].map((frac) => {
              const y = padT + plotH * (1 - frac);
              return (
                <g key={frac}>
                  <line
                    x1={padL}
                    y1={y}
                    x2={svgW - padR}
                    y2={y}
                    className="stroke-slate-100 dark:stroke-slate-800"
                    strokeWidth="1"
                  />
                  <text
                    x={padL - 8}
                    y={y + 4}
                    textAnchor="end"
                    className="fill-slate-400 dark:fill-slate-500 text-[10px] font-mono-num"
                  >
                    {formatY(niceMax * frac)}
                  </text>
                </g>
              );
            })}

            {/* Month Average horizontal reference line */}
            {monthlyAvgDailyCost > 0 && (
              <line
                x1={padL}
                y1={avgLineY}
                x2={svgW - padR}
                y2={avgLineY}
                className="stroke-teal-600/60 dark:stroke-teal-400/60"
                strokeWidth="1.25"
                strokeDasharray="4 4"
              />
            )}

            {/* Spend bars on fill-up days */}
            {dailySeries.map((pt, idx) => {
              const xCenter = padL + idx * step + step / 2;
              const barH =
                pt.spentOnDay > 0
                  ? Math.max(4, (pt.spentOnDay / niceMax) * plotH)
                  : 0;
              const y = padT + plotH - barH;
              const isActive =
                (selectedDayIndex ?? dailySeries.length - 1) === idx;

              return (
                <g
                  key={pt.date}
                  className="cursor-pointer"
                  onMouseEnter={() => setSelectedDayIndex(idx)}
                  onClick={() => setSelectedDayIndex(idx)}
                >
                  <rect
                    x={padL + idx * step}
                    y={padT}
                    width={step}
                    height={plotH + padB}
                    fill="transparent"
                  />
                  {barH > 0 && (
                    <rect
                      x={xCenter - barW / 2}
                      y={y}
                      width={barW}
                      height={barH}
                      rx="3"
                      className={
                        isActive
                          ? 'fill-teal-700 dark:fill-teal-400'
                          : 'fill-teal-200 dark:fill-teal-900/80'
                      }
                    />
                  )}
                  {(pt.day === 1 ||
                    pt.day % 5 === 0 ||
                    pt.day === dailySeries.length) && (
                    <text
                      x={xCenter}
                      y={svgH - 10}
                      textAnchor="middle"
                      className="fill-slate-400 dark:fill-slate-500 text-[10px] font-mono-num"
                    >
                      {pt.day}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Amortized daily burn rate line */}
            {dailySeries.length > 1 && (
              <path
                d={amortizedPath}
                fill="none"
                className="stroke-slate-400/70 dark:stroke-slate-500/70"
                strokeWidth="1.5"
                strokeDasharray="2 3"
              />
            )}

            {/* Running daily average curve */}
            {dailySeries.length > 1 && (
              <path
                d={runningPath}
                fill="none"
                className="stroke-amber-600 dark:stroke-amber-400"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* Active day dot */}
            {activeDay && dailySeries.length > 0 && (
              <circle
                cx={
                  padL +
                  (selectedDayIndex ?? dailySeries.length - 1) * step +
                  step / 2
                }
                cy={
                  padT +
                  plotH -
                  (activeDay.runningDailyAvg / niceMax) * plotH
                }
                r="4.5"
                className="fill-amber-600 dark:fill-amber-400 stroke-white dark:stroke-slate-900"
                strokeWidth="2"
              />
            )}
          </svg>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-4 text-[11px] text-slate-500 dark:text-slate-400">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-amber-600 dark:bg-amber-400 inline-block" />
            Rata-rata berjalan (Rp/hari)
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-teal-300 dark:bg-teal-800 inline-block" />
            Belanja saat isi BBM
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3 h-0.5 border-t border-dashed border-teal-600 inline-block" />
            Rata-rata bulan ({formatIDR(monthlyAvgDailyCost)}/hr)
          </span>
        </div>
      </section>
    );
  }

  // Mode 2: Fuel Price per Liter (Rp/L) trend across recent fill-ups
  const prices = priceHistory.map((l) => l.pricePerLiter);
  const minP = prices.length ? Math.min(...prices) * 0.92 : 8000;
  const maxP = prices.length ? Math.max(...prices) * 1.06 : 15000;
  const spanP = Math.max(1000, maxP - minP);

  const stepX =
    priceHistory.length > 1 ? plotW / (priceHistory.length - 1) : plotW;

  const pricePath = priceHistory
    .map((log, i) => {
      const x =
        priceHistory.length === 1 ? padL + plotW / 2 : padL + i * stepX;
      const y = padT + plotH - ((log.pricePerLiter - minP) / spanP) * plotH;
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(' ');

  return (
    <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Grafik Harga BBM per Liter
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Rata-rata bulan ini: {formatIDR(monthlyAvgPricePerLiter)} / liter
          </p>
        </div>

        <div className="inline-flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 self-start">
          <button
            type="button"
            onClick={() => setMode('daily_cost')}
            className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 whitespace-nowrap shrink-0"
          >
            Biaya / Hari
          </button>
          <button
            type="button"
            onClick={() => setMode('price_per_liter')}
            className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs whitespace-nowrap shrink-0"
          >
            Harga / Liter
          </button>
        </div>
      </div>

      {activePriceLog && (
        <div className="mt-3 flex flex-wrap items-baseline justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-baseline gap-2">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {formatDateID(activePriceLog.date)}:
            </span>
            <span className="text-lg font-bold font-mono-num text-teal-700 dark:text-teal-400">
              {formatIDR(activePriceLog.pricePerLiter)} / L
            </span>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-mono-num">
            {activePriceLog.fuelType} · {formatNumberID(activePriceLog.liters, 2)} L
          </span>
        </div>
      )}

      <div className="mt-3 w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${svgW} ${svgH}`}
          className="w-full h-auto select-none"
          role="img"
          aria-label="Grafik harga rata-rata bahan bakar per liter"
        >
          {[0, 0.33, 0.66, 1].map((frac) => {
            const y = padT + plotH * (1 - frac);
            const val = minP + spanP * frac;
            return (
              <g key={frac}>
                <line
                  x1={padL}
                  y1={y}
                  x2={svgW - padR}
                  y2={y}
                  className="stroke-slate-100 dark:stroke-slate-800"
                  strokeWidth="1"
                />
                <text
                  x={padL - 8}
                  y={y + 4}
                  textAnchor="end"
                  className="fill-slate-400 dark:fill-slate-500 text-[10px] font-mono-num"
                >
                  {formatY(val)}
                </text>
              </g>
            );
          })}

          {priceHistory.length > 1 && (
            <path
              d={pricePath}
              fill="none"
              className="stroke-teal-700 dark:stroke-teal-400"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {priceHistory.map((log, i) => {
            const x =
              priceHistory.length === 1 ? padL + plotW / 2 : padL + i * stepX;
            const y =
              padT + plotH - ((log.pricePerLiter - minP) / spanP) * plotH;
            const isActive =
              (selectedPriceIndex ?? priceHistory.length - 1) === i;

            return (
              <g
                key={log.id}
                className="cursor-pointer"
                onMouseEnter={() => setSelectedPriceIndex(i)}
                onClick={() => setSelectedPriceIndex(i)}
              >
                <circle cx={x} cy={y} r="14" fill="transparent" />
                <circle
                  cx={x}
                  cy={y}
                  r={isActive ? '5.5' : '3.5'}
                  className={
                    isActive
                      ? 'fill-amber-500 stroke-white dark:stroke-slate-900'
                      : 'fill-teal-700 dark:fill-teal-400 stroke-white dark:stroke-slate-900'
                  }
                  strokeWidth="2"
                />
                {(i === 0 ||
                  i === priceHistory.length - 1 ||
                  i % 3 === 0) && (
                  <text
                    x={x}
                    y={svgH - 10}
                    textAnchor="middle"
                    className="fill-slate-400 dark:fill-slate-500 text-[10px]"
                  >
                    {formatDateID(log.date, false)}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </section>
  );
};
