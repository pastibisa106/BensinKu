import React, { useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  CalendarRange,
  Fuel,
  History,
  LayoutDashboard,
  Plus,
  Settings,
  ArrowRight,
} from 'lucide-react';
import { DEFAULT_VEHICLES, SAMPLE_FUEL_LOGS } from './data/sampleData';
import type { FuelLog, Vehicle } from './types/fuel';
import {
  computeMonthlyRecap,
  computeMonthlyTrends,
  computeOverallStats,
  enrichFuelLogs,
  exportLogsToCSV,
  formatDateID,
  formatIDR,
  formatNumberID,
  getAvailableMonths,
  getTodayISO,
} from './utils/fuelCalculations';
import { DailyAverageChart, MonthlySpendingChart } from './components/FuelCharts';
import { MonthlyRecapCard } from './components/MonthlyRecapCard';
import { FuelFormSheet } from './components/FuelFormSheet';
import { FuelHistoryList } from './components/FuelHistoryList';
import { VehicleSettingsModal } from './components/VehicleSettingsModal';
import { PWAInstallButton } from './components/PWAInstallButton';
import { OfflineIndicator } from './components/OfflineIndicator';

type TabKey = 'overview' | 'recap' | 'charts' | 'history';

const STORAGE_KEYS = {
  logs: 'bensinku_logs_v1',
  vehicles: 'bensinku_vehicles_v1',
  activeVehicleId: 'bensinku_active_vehicle_v1',
  isSample: 'bensinku_is_sample_v1',
  theme: 'bensinku_theme_v1',
};

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export default function App() {
  const [activeTab, setActiveTab] = useState<TabKey>('overview');

  const [vehicles, setVehicles] = useState<Vehicle[]>(() =>
    loadFromStorage(STORAGE_KEYS.vehicles, DEFAULT_VEHICLES)
  );
  const [activeVehicleId, setActiveVehicleId] = useState<string>(() =>
    loadFromStorage(STORAGE_KEYS.activeVehicleId, DEFAULT_VEHICLES[0].id)
  );
  const [logs, setLogs] = useState<FuelLog[]>(() =>
    loadFromStorage(STORAGE_KEYS.logs, SAMPLE_FUEL_LOGS)
  );
  const [isSampleData, setIsSampleData] = useState<boolean>(() =>
    loadFromStorage(STORAGE_KEYS.isSample, true)
  );
  const [isDark, setIsDark] = useState<boolean>(() =>
    loadFromStorage(STORAGE_KEYS.theme, false)
  );

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingLog, setEditingLog] = useState<FuelLog | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Sync dark mode class with documentElement
  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem(STORAGE_KEYS.theme, JSON.stringify(isDark));
    } catch {
      // ignore storage errors
    }
  }, [isDark]);

  // Persist state
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.logs, JSON.stringify(logs));
      localStorage.setItem(STORAGE_KEYS.vehicles, JSON.stringify(vehicles));
      localStorage.setItem(STORAGE_KEYS.activeVehicleId, JSON.stringify(activeVehicleId));
      localStorage.setItem(STORAGE_KEYS.isSample, JSON.stringify(isSampleData));
    } catch {
      // ignore storage quota errors
    }
  }, [logs, vehicles, activeVehicleId, isSampleData]);

  const activeVehicle = useMemo(
    () => vehicles.find((v) => v.id === activeVehicleId) ?? vehicles[0],
    [vehicles, activeVehicleId]
  );

  const vehicleLogs = useMemo(
    () => logs.filter((l) => l.vehicleId === activeVehicle.id),
    [logs, activeVehicle.id]
  );

  const enrichedLogs = useMemo(() => enrichFuelLogs(vehicleLogs), [vehicleLogs]);

  const todayISO = useMemo(() => getTodayISO(), []);
  const availableMonths = useMemo(() => {
    const list = getAvailableMonths(vehicleLogs);
    const currentMonth = todayISO.slice(0, 7);
    if (!list.includes(currentMonth) && list.length === 0) {
      return [currentMonth];
    }
    return list;
  }, [vehicleLogs, todayISO]);

  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const months = getAvailableMonths(vehicleLogs);
    return months[months.length - 1] ?? todayISO.slice(0, 7);
  });

  // Ensure selectedMonth stays valid when logs or vehicle change
  useEffect(() => {
    if (!availableMonths.includes(selectedMonth)) {
      setSelectedMonth(
        availableMonths[availableMonths.length - 1] ?? todayISO.slice(0, 7)
      );
    }
  }, [availableMonths, selectedMonth, todayISO]);

  const monthlyTrends = useMemo(
    () => computeMonthlyTrends(enrichedLogs, todayISO),
    [enrichedLogs, todayISO]
  );

  const currentRecap = useMemo(
    () => computeMonthlyRecap(selectedMonth, enrichedLogs, todayISO),
    [selectedMonth, enrichedLogs, todayISO]
  );

  const prevRecap = useMemo(() => {
    const idx = availableMonths.indexOf(selectedMonth);
    if (idx <= 0) return null;
    return computeMonthlyRecap(availableMonths[idx - 1], enrichedLogs, todayISO);
  }, [availableMonths, selectedMonth, enrichedLogs, todayISO]);

  const overallStats = useMemo(
    () => computeOverallStats(enrichedLogs),
    [enrichedLogs]
  );

  const latestOdometer = useMemo(() => {
    if (enrichedLogs.length === 0) return null;
    return enrichedLogs[enrichedLogs.length - 1].odometer;
  }, [enrichedLogs]);

  const handleSaveLog = (
    data: Omit<FuelLog, 'id' | 'createdAt'>,
    existingId?: string
  ) => {
    if (existingId) {
      setLogs((prev) =>
        prev.map((item) =>
          item.id === existingId ? { ...item, ...data } : item
        )
      );
    } else {
      const newLog: FuelLog = {
        ...data,
        id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        createdAt: Date.now(),
      };
      setLogs((prev) => [...prev, newLog]);
      setSelectedMonth(data.date.slice(0, 7));
    }
    setIsSampleData(false);
    setEditingLog(null);
  };

  const handleDeleteLog = (id: string) => {
    setLogs((prev) => prev.filter((item) => item.id !== id));
    setIsSampleData(false);
  };

  const handleAddVehicle = (v: Omit<Vehicle, 'id'>) => {
    const newVehicle: Vehicle = {
      ...v,
      id: `veh-${Date.now()}`,
    };
    setVehicles((prev) => [...prev, newVehicle]);
    setActiveVehicleId(newVehicle.id);
  };

  const handleClearVehicleLogs = () => {
    setLogs((prev) => prev.filter((l) => l.vehicleId !== activeVehicle.id));
    setIsSampleData(false);
  };

  const handleRestoreSample = () => {
    setVehicles(DEFAULT_VEHICLES);
    setActiveVehicleId(DEFAULT_VEHICLES[0].id);
    setLogs(SAMPLE_FUEL_LOGS);
    setIsSampleData(true);
    setSelectedMonth('2026-11');
  };

  const triggerCSVDownload = (csvContent: string, filename: string) => {
    const blob = new Blob(['\uFEFF' + csvContent], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportMonthCSV = (monthKey: string) => {
    const monthLogs = enrichedLogs.filter((l) => l.date.startsWith(monthKey));
    const csv = exportLogsToCSV(monthLogs, activeVehicle.name);
    triggerCSVDownload(csv, `bensinku-${monthKey}.csv`);
  };

  const handleExportAllCSV = () => {
    const csv = exportLogsToCSV(enrichedLogs, activeVehicle.name);
    triggerCSVDownload(csv, `bensinku-semua-riwayat.csv`);
  };

  const openAddSheet = () => {
    setEditingLog(null);
    setIsFormOpen(true);
  };

  const openEditSheet = (log: FuelLog) => {
    setEditingLog(log);
    setIsFormOpen(true);
  };

  const recentLogs = useMemo(() => [...enrichedLogs].reverse().slice(0, 5), [enrichedLogs]);

  return (
    <div className="min-h-screen bg-[#f6f7f9] dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-24 md:pb-12">
      <OfflineIndicator />

      {/* Desktop Top Bar (3-Zone Contract: Brand — 4 nav links — 1 primary CTA) */}
      <header className="hidden md:block sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between gap-8">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-teal-600 rounded-md"
          >
            BensinKu
          </button>

          <nav className="flex items-center gap-6 text-sm font-medium">
            {(
              [
                { id: 'overview', label: 'Ringkasan' },
                { id: 'recap', label: 'Rekap Bulanan' },
                { id: 'charts', label: 'Grafik' },
                { id: 'history', label: 'Riwayat' },
              ] as { id: TabKey; label: string }[]
            ).map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2 border-b-2 transition-colors whitespace-nowrap shrink-0 ${
                    active
                      ? 'border-teal-700 text-teal-800 dark:border-teal-400 dark:text-teal-300 font-semibold'
                      : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </nav>

          <div className="shrink-0">
            <button
              type="button"
              onClick={openAddSheet}
              className="min-h-[40px] inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-700 text-white text-xs font-semibold hover:bg-teal-800 active:scale-[0.98] transition-all whitespace-nowrap shrink-0"
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span>Catat BBM</span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Compact Sticky Top App Bar (52px height) */}
      <header className="md:hidden sticky top-0 z-30 h-[52px] bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-base font-bold tracking-tight text-slate-900 dark:text-slate-100 whitespace-nowrap shrink-0">
            BensinKu
          </span>
          <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">
            ·
          </span>
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate">
            {activeVehicle.name}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <PWAInstallButton compact />
          <button
            type="button"
            onClick={() => setIsSettingsOpen(true)}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Pengaturan kendaraan"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-4 sm:pt-6 space-y-5">
        {/* Workspace Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {activeVehicle.name}
            </span>
            {activeVehicle.plateNumber && (
              <>
                <span aria-hidden="true">·</span>
                <span className="font-mono-num">{activeVehicle.plateNumber}</span>
              </>
            )}
            <span aria-hidden="true">·</span>
            <span>{activeVehicle.defaultFuelType}</span>
            {isSampleData && (
              <>
                <span aria-hidden="true">·</span>
                <button
                  type="button"
                  onClick={handleClearVehicleLogs}
                  className="text-teal-700 dark:text-teal-400 font-medium hover:underline"
                >
                  Data contoh aktif (Kosongkan)
                </button>
              </>
            )}
          </div>

          <div className="hidden md:flex items-center gap-2">
            <PWAInstallButton />
            <button
              type="button"
              onClick={() => setIsSettingsOpen(true)}
              className="min-h-[40px] inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
            >
              <Settings className="w-3.5 h-3.5 shrink-0" />
              <span>Kendaraan & Data</span>
            </button>
          </div>
        </div>

        {/* OVERVIEW VIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-5">
            {/* 4-Column KPI Strip */}
            <section
              aria-label="Ringkasan statistik konsumsi bahan bakar"
              className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4"
            >
              {/* KPI 1: Consumption per km */}
              <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4">
                <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Konsumsi Rata-Rata
                </div>
                <div className="mt-1.5 text-xl sm:text-2xl font-bold font-mono-num text-teal-700 dark:text-teal-400">
                  {overallStats.avgKmPerLiter !== null
                    ? `${formatNumberID(overallStats.avgKmPerLiter, 1)} km/L`
                    : '—'}
                </div>
                <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 font-mono-num">
                  {overallStats.avgLiterPerKm !== null
                    ? `${formatNumberID(overallStats.avgLiterPerKm, 3)} L/km · ${formatIDR(
                        overallStats.avgCostPerKm ?? 0
                      )}/km`
                    : 'Catat 2x isi penuh'}
                </div>
              </div>

              {/* KPI 2: Selected Month Spend */}
              <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4">
                <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Belanja {currentRecap.shortLabel}
                </div>
                <div className="mt-1.5 text-xl sm:text-2xl font-bold font-mono-num text-slate-900 dark:text-slate-100">
                  {formatIDR(currentRecap.totalSpent)}
                </div>
                <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 font-mono-num">
                  {formatNumberID(currentRecap.totalLiters, 1)} L · {currentRecap.fillCount}x isi
                </div>
              </div>

              {/* KPI 3: Daily Average Cost */}
              <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4">
                <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Rata-Rata / Hari ({currentRecap.shortLabel})
                </div>
                <div className="mt-1.5 text-xl sm:text-2xl font-bold font-mono-num text-amber-700 dark:text-amber-400">
                  {formatIDR(currentRecap.avgDailyCost)}
                </div>
                <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 font-mono-num">
                  Harga BBM: {formatIDR(currentRecap.avgPricePerLiter)}/L
                </div>
              </div>

              {/* KPI 4: Odometer & Distance */}
              <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4">
                <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Odometer Terakhir
                </div>
                <div className="mt-1.5 text-xl sm:text-2xl font-bold font-mono-num text-slate-900 dark:text-slate-100">
                  {overallStats.latestOdometer > 0
                    ? `${overallStats.latestOdometer.toLocaleString('id-ID')} km`
                    : '—'}
                </div>
                <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 font-mono-num">
                  Total jarak: {overallStats.totalDistanceKm.toLocaleString('id-ID')} km
                </div>
              </div>
            </section>

            {/* 2-Column Visual Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
              <MonthlySpendingChart
                trends={monthlyTrends}
                selectedMonth={selectedMonth}
                onSelectMonth={setSelectedMonth}
              />
              <DailyAverageChart
                monthKey={selectedMonth}
                monthLabel={currentRecap.monthLabel}
                enrichedLogs={enrichedLogs}
                monthlyAvgDailyCost={currentRecap.avgDailyCost}
                monthlyAvgPricePerLiter={currentRecap.avgPricePerLiter}
                referenceTodayISO={todayISO}
              />
            </div>

            {/* Monthly Recap + Recent Fill-ups Split on Desktop */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
              <div className="lg:col-span-7">
                <MonthlyRecapCard
                  recap={currentRecap}
                  prevRecap={prevRecap}
                  availableMonths={availableMonths}
                  onSelectMonth={setSelectedMonth}
                  onExportMonthCSV={handleExportMonthCSV}
                />
              </div>

              {/* Compact Recent Entries Card */}
              <section className="lg:col-span-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 overflow-hidden">
                <div className="px-4 sm:px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <div>
                    <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                      Pengisian Terakhir
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {enrichedLogs.length} total catatan tersimpan
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('history')}
                    className="min-h-[36px] inline-flex items-center gap-1 text-xs font-semibold text-teal-700 dark:text-teal-400 hover:underline whitespace-nowrap shrink-0"
                  >
                    <span>Semua</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {recentLogs.length === 0 ? (
                  <div className="p-8 text-center">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Belum ada catatan pengisian bensin.
                    </p>
                    <button
                      type="button"
                      onClick={openAddSheet}
                      className="mt-3 min-h-[40px] px-4 rounded-xl bg-teal-700 text-white text-xs font-semibold"
                    >
                      Catat Sekarang
                    </button>
                  </div>
                ) : (
                  <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                    {recentLogs.map((log) => (
                      <li key={log.id}>
                        <button
                          type="button"
                          onClick={() => openEditSheet(log)}
                          className="w-full min-h-[60px] px-4 sm:px-5 py-3 flex items-center justify-between gap-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 text-teal-700 dark:text-teal-400 flex items-center justify-center shrink-0">
                              <Fuel className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <div className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                                {formatDateID(log.date)} · {log.fuelType}
                              </div>
                              <div className="text-xs text-slate-500 dark:text-slate-400 font-mono-num">
                                {formatNumberID(log.liters, 2)} L · Odo{' '}
                                {log.odometer.toLocaleString('id-ID')} km
                              </div>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <div className="text-sm font-semibold font-mono-num text-slate-900 dark:text-slate-100">
                              {formatIDR(log.totalPrice)}
                            </div>
                            <div className="text-xs font-mono-num text-teal-700 dark:text-teal-400">
                              {log.kmPerLiter !== null
                                ? `${formatNumberID(log.kmPerLiter, 1)} km/L`
                                : 'Baseline'}
                            </div>
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
          </div>
        )}

        {/* RECAP TAB */}
        {activeTab === 'recap' && (
          <div className="space-y-5">
            <MonthlyRecapCard
              recap={currentRecap}
              prevRecap={prevRecap}
              availableMonths={availableMonths}
              onSelectMonth={setSelectedMonth}
              onExportMonthCSV={handleExportMonthCSV}
            />

            {/* All Months Comparison Table */}
            <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 overflow-hidden">
              <div className="px-4 sm:px-5 py-4 border-b border-slate-100 dark:border-slate-800">
                <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                  Perbandingan Rekap Antar Bulan
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Pilih baris bulan untuk melihat detail grafik dan rekapannya
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                      <th className="py-3 px-4 sm:px-5">Bulan</th>
                      <th className="py-3 px-3 text-right">Total Belanja</th>
                      <th className="py-3 px-3 text-right">Rata-Rata / Hari</th>
                      <th className="py-3 px-3 text-right">Liter</th>
                      <th className="py-3 px-3 text-right">Jarak</th>
                      <th className="py-3 px-4 sm:px-5 text-right">Konsumsi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs sm:text-sm">
                    {[...monthlyTrends].reverse().map((m) => {
                      const active = m.monthKey === selectedMonth;
                      return (
                        <tr
                          key={m.monthKey}
                          onClick={() => setSelectedMonth(m.monthKey)}
                          className={`cursor-pointer transition-colors ${
                            active
                              ? 'bg-teal-50/70 dark:bg-teal-950/30'
                              : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                          }`}
                        >
                          <td className="py-3 px-4 sm:px-5 font-medium text-slate-900 dark:text-slate-100 whitespace-nowrap">
                            {m.monthLabel}
                          </td>
                          <td className="py-3 px-3 text-right font-mono-num font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                            {formatIDR(m.totalSpent)}
                          </td>
                          <td className="py-3 px-3 text-right font-mono-num text-amber-700 dark:text-amber-400 whitespace-nowrap">
                            {formatIDR(m.avgDailyCost)}
                          </td>
                          <td className="py-3 px-3 text-right font-mono-num text-slate-600 dark:text-slate-300 whitespace-nowrap">
                            {formatNumberID(m.totalLiters, 1)} L
                          </td>
                          <td className="py-3 px-3 text-right font-mono-num text-slate-600 dark:text-slate-300 whitespace-nowrap">
                            {m.totalDistanceKm.toLocaleString('id-ID')} km
                          </td>
                          <td className="py-3 px-4 sm:px-5 text-right font-mono-num font-semibold text-teal-700 dark:text-teal-400 whitespace-nowrap">
                            {m.avgKmPerLiter !== null
                              ? `${formatNumberID(m.avgKmPerLiter, 1)} km/L`
                              : '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}

        {/* CHARTS TAB */}
        {activeTab === 'charts' && (
          <div className="space-y-5">
            {/* Month quick selector for daily chart */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {availableMonths.map((mk) => {
                const active = mk === selectedMonth;
                const label = monthlyTrends.find((t) => t.monthKey === mk)?.shortLabel ?? mk;
                return (
                  <button
                    key={mk}
                    type="button"
                    onClick={() => setSelectedMonth(mk)}
                    className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                      active
                        ? 'bg-teal-700 text-white'
                        : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <MonthlySpendingChart
                trends={monthlyTrends}
                selectedMonth={selectedMonth}
                onSelectMonth={setSelectedMonth}
              />
              <DailyAverageChart
                monthKey={selectedMonth}
                monthLabel={currentRecap.monthLabel}
                enrichedLogs={enrichedLogs}
                monthlyAvgDailyCost={currentRecap.avgDailyCost}
                monthlyAvgPricePerLiter={currentRecap.avgPricePerLiter}
                referenceTodayISO={todayISO}
              />
            </div>

            {/* Fuel Consumption Per Kilometer Summary */}
            <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5">
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Statistik Konsumsi per Kilometer (Keseluruhan)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Dihitung dari {overallStats.fillCount} pengisian sejauh{' '}
                {overallStats.totalDistanceKm.toLocaleString('id-ID')} km
              </p>

              <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                <div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Jarak per Liter
                  </div>
                  <div className="mt-1 text-lg font-bold font-mono-num text-teal-700 dark:text-teal-400">
                    {overallStats.avgKmPerLiter !== null
                      ? `${formatNumberID(overallStats.avgKmPerLiter, 2)} km/L`
                      : '—'}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Liter per Kilometer
                  </div>
                  <div className="mt-1 text-lg font-bold font-mono-num text-slate-900 dark:text-slate-100">
                    {overallStats.avgLiterPerKm !== null
                      ? `${formatNumberID(overallStats.avgLiterPerKm, 4)} L/km`
                      : '—'}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Biaya per Kilometer
                  </div>
                  <div className="mt-1 text-lg font-bold font-mono-num text-slate-900 dark:text-slate-100">
                    {overallStats.avgCostPerKm !== null
                      ? `${formatIDR(overallStats.avgCostPerKm)}/km`
                      : '—'}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Rata-Rata Harian Total
                  </div>
                  <div className="mt-1 text-lg font-bold font-mono-num text-amber-700 dark:text-amber-400">
                    {formatIDR(overallStats.avgDailyCost)}/hari
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* HISTORY TAB */}
        {activeTab === 'history' && (
          <FuelHistoryList
            logs={enrichedLogs}
            availableMonths={availableMonths}
            onEdit={openEditSheet}
            onDelete={handleDeleteLog}
            onAddNew={openAddSheet}
          />
        )}
      </main>

      {/* Mobile Fixed Bottom Navigation Bar (64px height, <=15% total sticky height) */}
      <nav
        aria-label="Navigasi utama"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 pb-safe"
      >
        <div className="grid grid-cols-5 items-center h-16">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`min-h-[44px] flex flex-col items-center justify-center transition-colors ${
              activeTab === 'overview'
                ? 'text-teal-700 dark:text-teal-400'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span className="text-[10px] font-medium tracking-tight mt-1">
              Ringkasan
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('recap')}
            className={`min-h-[44px] flex flex-col items-center justify-center transition-colors ${
              activeTab === 'recap'
                ? 'text-teal-700 dark:text-teal-400'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <CalendarRange className="w-5 h-5" />
            <span className="text-[10px] font-medium tracking-tight mt-1">
              Rekap
            </span>
          </button>

          {/* Center Primary Thumb Action */}
          <div className="flex items-center justify-center">
            <button
              type="button"
              onClick={openAddSheet}
              aria-label="Catat pengisian bensin"
              className="w-12 h-12 rounded-2xl bg-teal-700 text-white flex items-center justify-center shadow-md shadow-teal-900/20 active:scale-95 transition-transform"
            >
              <Plus className="w-6 h-6" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => setActiveTab('charts')}
            className={`min-h-[44px] flex flex-col items-center justify-center transition-colors ${
              activeTab === 'charts'
                ? 'text-teal-700 dark:text-teal-400'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <BarChart3 className="w-5 h-5" />
            <span className="text-[10px] font-medium tracking-tight mt-1">
              Grafik
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`min-h-[44px] flex flex-col items-center justify-center transition-colors ${
              activeTab === 'history'
                ? 'text-teal-700 dark:text-teal-400'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <History className="w-5 h-5" />
            <span className="text-[10px] font-medium tracking-tight mt-1">
              Riwayat
            </span>
          </button>
        </div>
      </nav>

      {/* Modals & Sheets */}
      <FuelFormSheet
        isOpen={isFormOpen}
        editingLog={editingLog}
        vehicle={activeVehicle}
        latestOdometer={latestOdometer}
        onClose={() => {
          setIsFormOpen(false);
          setEditingLog(null);
        }}
        onSave={handleSaveLog}
      />

      <VehicleSettingsModal
        isOpen={isSettingsOpen}
        vehicles={vehicles}
        activeVehicleId={activeVehicle.id}
        isDark={isDark}
        isSampleData={isSampleData}
        onClose={() => setIsSettingsOpen(false)}
        onToggleDark={() => setIsDark((d) => !d)}
        onSelectVehicle={(id) => {
          setActiveVehicleId(id);
          setIsSettingsOpen(false);
        }}
        onAddVehicle={handleAddVehicle}
        onExportAllCSV={handleExportAllCSV}
        onClearAllLogs={handleClearVehicleLogs}
        onRestoreSampleData={handleRestoreSample}
      />
    </div>
  );
}
