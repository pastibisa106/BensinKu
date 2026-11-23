import type {
  DailyChartPoint,
  FuelLog,
  FuelLogWithMetrics,
  MonthlyRecap,
} from '../types/fuel';

const MONTH_NAMES_ID = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

const SHORT_MONTH_NAMES_ID = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'Mei',
  'Jun',
  'Jul',
  'Agu',
  'Sep',
  'Okt',
  'Nov',
  'Des',
];

export function formatIDR(amount: number, compact = false): string {
  if (!Number.isFinite(amount)) return 'Rp 0';
  if (compact) {
    const abs = Math.abs(amount);
    if (abs >= 1_000_000) {
      return `Rp ${(amount / 1_000_000).toLocaleString('id-ID', {
        maximumFractionDigits: 1,
      })} jt`;
    }
    if (abs >= 1_000) {
      return `Rp ${(amount / 1_000).toLocaleString('id-ID', {
        maximumFractionDigits: 0,
      })} rb`;
    }
  }
  return `Rp ${Math.round(amount).toLocaleString('id-ID')}`;
}

export function formatNumberID(value: number, decimals = 1): string {
  if (!Number.isFinite(value)) return '0';
  return value.toLocaleString('id-ID', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatDateID(dateStr: string, withYear = true): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  if (!y || !m || !d) return dateStr;
  const month = SHORT_MONTH_NAMES_ID[m - 1] ?? '';
  return withYear ? `${d} ${month} ${y}` : `${d} ${month}`;
}

export function formatMonthLabel(monthKey: string, short = false): string {
  const [y, m] = monthKey.split('-').map(Number);
  if (!y || !m) return monthKey;
  if (short) {
    return `${SHORT_MONTH_NAMES_ID[m - 1]} '${String(y).slice(-2)}`;
  }
  return `${MONTH_NAMES_ID[m - 1]} ${y}`;
}

export function getDaysInMonth(year: number, month1Based: number): number {
  return new Date(year, month1Based, 0).getDate();
}

export function diffDays(startDate: string, endDate: string): number {
  const s = new Date(`${startDate}T00:00:00`).getTime();
  const e = new Date(`${endDate}T00:00:00`).getTime();
  return Math.round((e - s) / (1000 * 60 * 60 * 24));
}

export function getTodayISO(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function enrichFuelLogs(rawLogs: FuelLog[]): FuelLogWithMetrics[] {
  const sorted = [...rawLogs].sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    if (a.odometer !== b.odometer) return a.odometer - b.odometer;
    return a.createdAt - b.createdAt;
  });

  let prevLog: FuelLog | null = null;
  let lastFullLog: FuelLog | null = null;
  let pendingLiters = 0;
  let pendingCost = 0;

  return sorted.map((log, index) => {
    const pricePerLiter = log.liters > 0 ? log.totalPrice / log.liters : 0;
    const isBaseline = index === 0;

    let distanceFromPrevKm: number | null = null;
    let daysFromPrev: number | null = null;
    let dailyCostFromPrev: number | null = null;

    if (prevLog && log.odometer >= prevLog.odometer) {
      distanceFromPrevKm = log.odometer - prevLog.odometer;
      const rawDays = diffDays(prevLog.date, log.date);
      daysFromPrev = Math.max(1, rawDays);
      dailyCostFromPrev = log.totalPrice / daysFromPrev;
    }

    let segmentDistanceKm: number | null = null;
    let segmentLiters: number | null = null;
    let segmentCost: number | null = null;
    let kmPerLiter: number | null = null;
    let literPerKm: number | null = null;
    let literPer100Km: number | null = null;
    let costPerKm: number | null = null;

    if (log.isFullTank) {
      if (lastFullLog && log.odometer > lastFullLog.odometer) {
        const dist = log.odometer - lastFullLog.odometer;
        const totLiters = pendingLiters + log.liters;
        const totCost = pendingCost + log.totalPrice;
        if (totLiters > 0 && dist > 0) {
          segmentDistanceKm = dist;
          segmentLiters = totLiters;
          segmentCost = totCost;
          kmPerLiter = dist / totLiters;
          literPerKm = totLiters / dist;
          literPer100Km = literPerKm * 100;
          costPerKm = totCost / dist;
        }
      }
      pendingLiters = 0;
      pendingCost = 0;
      lastFullLog = log;
    } else {
      if (lastFullLog) {
        pendingLiters += log.liters;
        pendingCost += log.totalPrice;
      }
    }

    prevLog = log;

    return {
      ...log,
      pricePerLiter,
      distanceFromPrevKm,
      daysFromPrev,
      dailyCostFromPrev,
      segmentDistanceKm,
      segmentLiters,
      segmentCost,
      kmPerLiter,
      literPerKm,
      literPer100Km,
      costPerKm,
      isBaseline,
    };
  });
}

export function getAvailableMonths(logs: FuelLog[]): string[] {
  const set = new Set<string>();
  for (const log of logs) {
    if (log.date.length >= 7) {
      set.add(log.date.slice(0, 7));
    }
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

export function computeMonthlyRecap(
  monthKey: string,
  enrichedLogs: FuelLogWithMetrics[],
  referenceTodayISO: string = getTodayISO()
): MonthlyRecap {
  const monthLogs = enrichedLogs.filter((l) => l.date.startsWith(monthKey));
  const [y, m] = monthKey.split('-').map(Number);
  const daysInMonth = y && m ? getDaysInMonth(y, m) : 30;

  const currentMonthKey = referenceTodayISO.slice(0, 7);
  let daysCounted = daysInMonth;
  if (monthKey === currentMonthKey) {
    const todayDay = Number(referenceTodayISO.slice(8, 10)) || daysInMonth;
    const latestLogDay = monthLogs.reduce((max, l) => {
      const d = Number(l.date.slice(8, 10)) || 1;
      return Math.max(max, d);
    }, 1);
    daysCounted = Math.max(1, Math.min(daysInMonth, Math.max(todayDay, latestLogDay)));
  }

  const totalSpent = monthLogs.reduce((sum, l) => sum + l.totalPrice, 0);
  const totalLiters = monthLogs.reduce((sum, l) => sum + l.liters, 0);
  const fillCount = monthLogs.length;
  const avgPricePerLiter = totalLiters > 0 ? totalSpent / totalLiters : 0;

  const totalDistanceKm = monthLogs.reduce(
    (sum, l) => sum + (l.distanceFromPrevKm ?? 0),
    0
  );

  let validSegDist = 0;
  let validSegLiters = 0;
  let validSegCost = 0;
  let bestKmPerLiter: number | null = null;
  let worstKmPerLiter: number | null = null;

  for (const l of monthLogs) {
    if (l.kmPerLiter !== null && l.segmentDistanceKm && l.segmentLiters && l.segmentCost) {
      validSegDist += l.segmentDistanceKm;
      validSegLiters += l.segmentLiters;
      validSegCost += l.segmentCost;
      if (bestKmPerLiter === null || l.kmPerLiter > bestKmPerLiter) {
        bestKmPerLiter = l.kmPerLiter;
      }
      if (worstKmPerLiter === null || l.kmPerLiter < worstKmPerLiter) {
        worstKmPerLiter = l.kmPerLiter;
      }
    }
  }

  const avgKmPerLiter = validSegLiters > 0 ? validSegDist / validSegLiters : null;
  const avgLiterPerKm = validSegDist > 0 ? validSegLiters / validSegDist : null;
  const avgLiterPer100Km = avgLiterPerKm !== null ? avgLiterPerKm * 100 : null;
  const avgCostPerKm = validSegDist > 0 ? validSegCost / validSegDist : null;
  const avgDailyCost = daysCounted > 0 ? totalSpent / daysCounted : 0;

  const minOdometer =
    monthLogs.length > 0 ? Math.min(...monthLogs.map((l) => l.odometer)) : null;
  const maxOdometer =
    monthLogs.length > 0 ? Math.max(...monthLogs.map((l) => l.odometer)) : null;

  return {
    monthKey,
    monthLabel: formatMonthLabel(monthKey, false),
    shortLabel: formatMonthLabel(monthKey, true),
    totalSpent,
    totalLiters,
    totalDistanceKm,
    fillCount,
    avgPricePerLiter,
    avgKmPerLiter,
    avgLiterPerKm,
    avgLiterPer100Km,
    avgCostPerKm,
    avgDailyCost,
    daysCounted,
    daysInMonth,
    bestKmPerLiter,
    worstKmPerLiter,
    minOdometer,
    maxOdometer,
  };
}

export function computeMonthlyTrends(
  enrichedLogs: FuelLogWithMetrics[],
  referenceTodayISO: string = getTodayISO()
): MonthlyRecap[] {
  const months = getAvailableMonths(enrichedLogs);
  return months.map((mk) => computeMonthlyRecap(mk, enrichedLogs, referenceTodayISO));
}

export function computeOverallStats(enrichedLogs: FuelLogWithMetrics[]) {
  const totalSpent = enrichedLogs.reduce((s, l) => s + l.totalPrice, 0);
  const totalLiters = enrichedLogs.reduce((s, l) => s + l.liters, 0);
  const fillCount = enrichedLogs.length;

  const totalDistanceKm =
    enrichedLogs.length >= 2
      ? Math.max(
          0,
          enrichedLogs[enrichedLogs.length - 1].odometer - enrichedLogs[0].odometer
        )
      : 0;

  let validDist = 0;
  let validLiters = 0;
  let validCost = 0;

  for (const l of enrichedLogs) {
    if (l.kmPerLiter !== null && l.segmentDistanceKm && l.segmentLiters && l.segmentCost) {
      validDist += l.segmentDistanceKm;
      validLiters += l.segmentLiters;
      validCost += l.segmentCost;
    }
  }

  const avgKmPerLiter = validLiters > 0 ? validDist / validLiters : null;
  const avgLiterPerKm = validDist > 0 ? validLiters / validDist : null;
  const avgCostPerKm = validDist > 0 ? validCost / validDist : null;
  const avgPricePerLiter = totalLiters > 0 ? totalSpent / totalLiters : 0;

  let avgDailyCost = 0;
  let spanDays = 0;
  if (enrichedLogs.length >= 1) {
    const firstDate = enrichedLogs[0].date;
    const lastDate = enrichedLogs[enrichedLogs.length - 1].date;
    spanDays = Math.max(1, diffDays(firstDate, lastDate) + 1);
    avgDailyCost = totalSpent / spanDays;
  }

  return {
    totalSpent,
    totalLiters,
    fillCount,
    totalDistanceKm,
    avgKmPerLiter,
    avgLiterPerKm,
    avgCostPerKm,
    avgPricePerLiter,
    avgDailyCost,
    spanDays,
    latestOdometer:
      enrichedLogs.length > 0 ? enrichedLogs[enrichedLogs.length - 1].odometer : 0,
  };
}

export function computeDailySeriesForMonth(
  monthKey: string,
  enrichedLogs: FuelLogWithMetrics[],
  referenceTodayISO: string = getTodayISO()
): DailyChartPoint[] {
  const [y, m] = monthKey.split('-').map(Number);
  if (!y || !m) return [];

  const daysInMonth = getDaysInMonth(y, m);
  const currentMonthKey = referenceTodayISO.slice(0, 7);
  const monthLogs = enrichedLogs.filter((l) => l.date.startsWith(monthKey));

  let maxDay = daysInMonth;
  if (monthKey === currentMonthKey) {
    const todayDay = Number(referenceTodayISO.slice(8, 10)) || daysInMonth;
    const latestLogDay = monthLogs.reduce((mx, l) => {
      const d = Number(l.date.slice(8, 10)) || 1;
      return Math.max(mx, d);
    }, 1);
    maxDay = Math.max(1, Math.min(daysInMonth, Math.max(todayDay, latestLogDay)));
  }

  // Build interval amortized cost map across dates
  const getAmortizedRateForDate = (dateStr: string): number => {
    for (let i = 1; i < enrichedLogs.length; i++) {
      const prev = enrichedLogs[i - 1];
      const curr = enrichedLogs[i];
      if (dateStr > prev.date && dateStr <= curr.date) {
        const span = Math.max(1, diffDays(prev.date, curr.date));
        return curr.totalPrice / span;
      }
    }
    // Fallback to month average if outside interval
    const tot = monthLogs.reduce((s, l) => s + l.totalPrice, 0);
    return maxDay > 0 ? tot / maxDay : 0;
  };

  let cumulativeSpent = 0;
  const points: DailyChartPoint[] = [];

  for (let d = 1; d <= maxDay; d++) {
    const dateStr = `${monthKey}-${String(d).padStart(2, '0')}`;
    const dayLogs = monthLogs.filter((l) => l.date === dateStr);
    const spentOnDay = dayLogs.reduce((s, l) => s + l.totalPrice, 0);
    const litersOnDay = dayLogs.reduce((s, l) => s + l.liters, 0);

    cumulativeSpent += spentOnDay;
    const runningDailyAvg = cumulativeSpent / d;
    const amortizedDailyCost = getAmortizedRateForDate(dateStr);

    points.push({
      day: d,
      date: dateStr,
      label: `${d} ${SHORT_MONTH_NAMES_ID[m - 1]}`,
      spentOnDay,
      litersOnDay,
      fillCountOnDay: dayLogs.length,
      runningDailyAvg,
      amortizedDailyCost,
    });
  }

  return points;
}

export function exportLogsToCSV(logs: FuelLogWithMetrics[], vehicleName: string): string {
  const headers = [
    'Tanggal',
    'Kendaraan',
    'Jenis BBM',
    'Odometer (km)',
    'Jarak Segmen (km)',
    'Jumlah (Liter)',
    'Total Harga (Rp)',
    'Harga per Liter (Rp)',
    'Efisiensi (km/L)',
    'Konsumsi (L/km)',
    'Biaya per km (Rp)',
    'Isi Penuh',
    'Catatan',
  ];

  const rows = logs.map((l) => [
    l.date,
    `"${vehicleName.replace(/"/g, '""')}"`,
    l.fuelType,
    l.odometer,
    l.distanceFromPrevKm ?? '',
    l.liters.toFixed(2),
    Math.round(l.totalPrice),
    Math.round(l.pricePerLiter),
    l.kmPerLiter !== null ? l.kmPerLiter.toFixed(2) : '',
    l.literPerKm !== null ? l.literPerKm.toFixed(4) : '',
    l.costPerKm !== null ? Math.round(l.costPerKm) : '',
    l.isFullTank ? 'Ya' : 'Tidak',
    `"${(l.note ?? '').replace(/"/g, '""')}"`,
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}
