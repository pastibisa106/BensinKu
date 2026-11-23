import React, { useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import {
  formatIDR,
  formatNumberID,
  getTodayISO,
} from '../utils/fuelCalculations';
import type { FuelLog, FuelType, Vehicle } from '../types/fuel';

interface FuelFormSheetProps {
  isOpen: boolean;
  editingLog: FuelLog | null;
  vehicle: Vehicle;
  latestOdometer: number | null;
  onClose: () => void;
  onSave: (data: Omit<FuelLog, 'id' | 'createdAt'>, existingId?: string) => void;
}

const FUEL_TYPES: FuelType[] = [
  'Pertalite',
  'Pertamax',
  'Pertamax Turbo',
  'Dexlite / Solar',
  'Shell / BP',
  'Lainnya',
];

export const FuelFormSheet: React.FC<FuelFormSheetProps> = ({
  isOpen,
  editingLog,
  vehicle,
  latestOdometer,
  onClose,
  onSave,
}) => {
  const [date, setDate] = useState(getTodayISO());
  const [litersStr, setLitersStr] = useState('');
  const [totalPriceStr, setTotalPriceStr] = useState('');
  const [odometerStr, setOdometerStr] = useState('');
  const [fuelType, setFuelType] = useState<FuelType>(vehicle.defaultFuelType);
  const [isFullTank, setIsFullTank] = useState(true);
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    if (editingLog) {
      setDate(editingLog.date);
      setLitersStr(String(editingLog.liters));
      setTotalPriceStr(String(editingLog.totalPrice));
      setOdometerStr(String(editingLog.odometer));
      setFuelType(editingLog.fuelType);
      setIsFullTank(editingLog.isFullTank);
      setNote(editingLog.note ?? '');
    } else {
      setDate(getTodayISO());
      setLitersStr('');
      setTotalPriceStr('');
      setOdometerStr('');
      setFuelType(vehicle.defaultFuelType);
      setIsFullTank(true);
      setNote('');
    }
  }, [isOpen, editingLog, vehicle]);

  const parsedLiters = parseFloat(litersStr.replace(',', '.'));
  const parsedPrice = parseFloat(totalPriceStr.replace(/[^0-9.]/g, ''));
  const parsedOdo = parseFloat(odometerStr.replace(/[^0-9.]/g, ''));

  const livePreview = useMemo(() => {
    const validLiters = Number.isFinite(parsedLiters) && parsedLiters > 0;
    const validPrice = Number.isFinite(parsedPrice) && parsedPrice > 0;
    const validOdo = Number.isFinite(parsedOdo) && parsedOdo > 0;

    const pricePerLiter =
      validLiters && validPrice ? parsedPrice / parsedLiters : null;

    const dist =
      !editingLog &&
      validOdo &&
      latestOdometer !== null &&
      parsedOdo > latestOdometer
        ? parsedOdo - latestOdometer
        : null;

    const estKmPerLiter =
      dist !== null && validLiters && isFullTank ? dist / parsedLiters : null;

    return { pricePerLiter, dist, estKmPerLiter };
  }, [parsedLiters, parsedPrice, parsedOdo, latestOdometer, editingLog, isFullTank]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date) {
      setError('Tanggal pengisian wajib diisi.');
      return;
    }
    if (!Number.isFinite(parsedLiters) || parsedLiters <= 0) {
      setError('Jumlah liter harus lebih dari 0.');
      return;
    }
    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      setError('Total harga harus lebih dari Rp 0.');
      return;
    }
    if (!Number.isFinite(parsedOdo) || parsedOdo <= 0) {
      setError('Angka odometer saat pengisian harus lebih dari 0.');
      return;
    }

    onSave(
      {
        vehicleId: vehicle.id,
        date,
        liters: Math.round(parsedLiters * 1000) / 1000,
        totalPrice: Math.round(parsedPrice),
        odometer: Math.round(parsedOdo),
        fuelType,
        isFullTank,
        note: note.trim() || undefined,
      },
      editingLog?.id
    );
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-lg max-h-[92vh] flex flex-col rounded-t-3xl sm:rounded-2xl bg-white dark:bg-slate-900 border-t sm:border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Drag Handle */}
        <div className="sm:hidden pt-3 pb-1 flex justify-center shrink-0">
          <div className="w-10 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
        </div>

        {/* Sheet Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              {editingLog ? 'Ubah Catatan Pengisian' : 'Catat Pengisian BBM'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {vehicle.name}
              {vehicle.plateNumber ? ` · ${vehicle.plateNumber}` : ''}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Tutup form"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {error && (
            <div
              role="alert"
              className="rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 px-3.5 py-2.5 text-xs font-medium text-rose-700 dark:text-rose-300"
            >
              {error}
            </div>
          )}

          {/* Date & Fuel Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label
                htmlFor="fuel-date"
                className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Tanggal Pengisian
              </label>
              <input
                id="fuel-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 px-3.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-600"
              />
            </div>

            <div>
              <label
                htmlFor="fuel-type"
                className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Jenis BBM
              </label>
              <select
                id="fuel-type"
                value={fuelType}
                onChange={(e) => setFuelType(e.target.value as FuelType)}
                className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 px-3.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-600"
              >
                {FUEL_TYPES.map((ft) => (
                  <option key={ft} value={ft}>
                    {ft}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Liters & Total Price */}
          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label
                htmlFor="fuel-liters"
                className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Jumlah Liter (L)
              </label>
              <input
                id="fuel-liters"
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0.01"
                placeholder="4.50"
                value={litersStr}
                onChange={(e) => setLitersStr(e.target.value)}
                required
                className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 px-3.5 text-sm font-mono-num text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-600"
              />
            </div>

            <div>
              <label
                htmlFor="fuel-price"
                className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Total Harga (Rp)
              </label>
              <input
                id="fuel-price"
                type="number"
                inputMode="numeric"
                step="100"
                min="100"
                placeholder="58500"
                value={totalPriceStr}
                onChange={(e) => setTotalPriceStr(e.target.value)}
                required
                className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 px-3.5 text-sm font-mono-num text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-600"
              />
            </div>
          </div>

          {/* Odometer */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="fuel-odometer"
                className="text-xs font-medium text-slate-700 dark:text-slate-300"
              >
                Odometer Saat Pengisian (km)
              </label>
              {latestOdometer !== null && !editingLog && (
                <span className="text-[11px] font-mono-num text-slate-500 dark:text-slate-400">
                  Terakhir: {latestOdometer.toLocaleString('id-ID')} km
                </span>
              )}
            </div>
            <input
              id="fuel-odometer"
              type="number"
              inputMode="numeric"
              min="1"
              placeholder={latestOdometer ? String(latestOdometer + 180) : '12500'}
              value={odometerStr}
              onChange={(e) => setOdometerStr(e.target.value)}
              required
              className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 px-3.5 text-sm font-mono-num text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-600"
            />
          </div>

          {/* Full Tank Toggle & Note */}
          <div className="flex items-center justify-between gap-3 py-2 border-y border-slate-100 dark:border-slate-800">
            <div>
              <div className="text-xs font-medium text-slate-800 dark:text-slate-200">
                Isi Tangki Penuh (Full Tank)
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                Aktifkan agar perhitungan km/L akurat antar pengisian
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={isFullTank}
              onClick={() => setIsFullTank((v) => !v)}
              className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                isFullTank ? 'bg-teal-700' : 'bg-slate-300 dark:bg-slate-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-xs transition-transform ${
                  isFullTank ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div>
            <label
              htmlFor="fuel-note"
              className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
            >
              Catatan (opsional)
            </label>
            <input
              id="fuel-note"
              type="text"
              placeholder="Misal: SPBU Jl. Diponegoro"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={80}
              className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 px-3.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-600"
            />
          </div>

          {/* Live Calculation Preview */}
          {(livePreview.pricePerLiter !== null || livePreview.dist !== null) && (
            <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 px-4 py-3 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div>
                <span className="text-slate-500 dark:text-slate-400">Harga/Liter: </span>
                <strong className="font-mono-num text-slate-900 dark:text-slate-100">
                  {livePreview.pricePerLiter !== null
                    ? formatIDR(livePreview.pricePerLiter)
                    : '—'}
                </strong>
              </div>
              {livePreview.dist !== null && (
                <div>
                  <span className="text-slate-500 dark:text-slate-400">Jarak: </span>
                  <strong className="font-mono-num text-slate-900 dark:text-slate-100">
                    +{livePreview.dist.toLocaleString('id-ID')} km
                  </strong>
                </div>
              )}
              {livePreview.estKmPerLiter !== null && (
                <div>
                  <span className="text-slate-500 dark:text-slate-400">Estimasi: </span>
                  <strong className="font-mono-num text-teal-700 dark:text-teal-400">
                    {formatNumberID(livePreview.estKmPerLiter, 1)} km/L
                  </strong>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="pt-2 pb-safe flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 min-h-[46px] rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex-[2] min-h-[46px] rounded-xl bg-teal-700 text-white text-sm font-semibold hover:bg-teal-800 active:scale-[0.98] transition-all"
            >
              {editingLog ? 'Simpan Perubahan' : 'Simpan Pengisian'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
