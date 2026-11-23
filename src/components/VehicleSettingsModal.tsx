import React, { useState } from 'react';
import { X, Download, Trash2, Plus, Moon, Sun, RotateCcw } from 'lucide-react';
import type { FuelType, Vehicle } from '../types/fuel';

interface VehicleSettingsModalProps {
  isOpen: boolean;
  vehicles: Vehicle[];
  activeVehicleId: string;
  isDark: boolean;
  isSampleData: boolean;
  onClose: () => void;
  onToggleDark: () => void;
  onSelectVehicle: (id: string) => void;
  onAddVehicle: (vehicle: Omit<Vehicle, 'id'>) => void;
  onExportAllCSV: () => void;
  onClearAllLogs: () => void;
  onRestoreSampleData: () => void;
}

export const VehicleSettingsModal: React.FC<VehicleSettingsModalProps> = ({
  isOpen,
  vehicles,
  activeVehicleId,
  isDark,
  isSampleData,
  onClose,
  onToggleDark,
  onSelectVehicle,
  onAddVehicle,
  onExportAllCSV,
  onClearAllLogs,
  onRestoreSampleData,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [plateNumber, setPlateNumber] = useState('');
  const [kind, setKind] = useState<'motor' | 'mobil'>('motor');
  const [defaultFuelType, setDefaultFuelType] = useState<FuelType>('Pertamax');
  const [confirmClear, setConfirmClear] = useState(false);

  if (!isOpen) return null;

  const handleCreateVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAddVehicle({
      name: name.trim(),
      plateNumber: plateNumber.trim() || undefined,
      kind,
      defaultFuelType,
    });
    setName('');
    setPlateNumber('');
    setShowAddForm(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-md max-h-[90vh] flex flex-col rounded-t-3xl sm:rounded-2xl bg-white dark:bg-slate-900 border-t sm:border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sm:hidden pt-3 pb-1 flex justify-center shrink-0">
          <div className="w-10 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
        </div>

        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Kendaraan & Pengaturan
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Tutup pengaturan"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {/* Vehicle Selector */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Daftar Kendaraan
              </span>
              <button
                type="button"
                onClick={() => setShowAddForm((v) => !v)}
                className="inline-flex items-center gap-1 text-xs font-medium text-teal-700 dark:text-teal-400 hover:underline min-h-[32px]"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah</span>
              </button>
            </div>

            <div className="space-y-2">
              {vehicles.map((v) => {
                const active = v.id === activeVehicleId;
                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => onSelectVehicle(v.id)}
                    className={`w-full min-h-[48px] flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-left transition-colors ${
                      active
                        ? 'border-teal-600 bg-teal-50/60 dark:bg-teal-950/40 dark:border-teal-500'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <div>
                      <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {v.name}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {v.kind === 'motor' ? 'Sepeda Motor' : 'Mobil'} · {v.defaultFuelType}
                        {v.plateNumber ? ` · ${v.plateNumber}` : ''}
                      </div>
                    </div>
                    {active && (
                      <span className="text-xs font-semibold text-teal-700 dark:text-teal-400">
                        Aktif
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {showAddForm && (
              <form
                onSubmit={handleCreateVehicle}
                className="mt-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3"
              >
                <input
                  type="text"
                  placeholder="Nama kendaraan (misal: Toyota Avanza)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full min-h-[40px] rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-xs text-slate-900 dark:text-slate-100"
                />
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={kind}
                    onChange={(e) => setKind(e.target.value as 'motor' | 'mobil')}
                    className="min-h-[40px] rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 text-xs text-slate-900 dark:text-slate-100"
                  >
                    <option value="motor">Motor</option>
                    <option value="mobil">Mobil</option>
                  </select>
                  <select
                    value={defaultFuelType}
                    onChange={(e) => setDefaultFuelType(e.target.value as FuelType)}
                    className="min-h-[40px] rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 text-xs text-slate-900 dark:text-slate-100"
                  >
                    <option value="Pertalite">Pertalite</option>
                    <option value="Pertamax">Pertamax</option>
                    <option value="Pertamax Turbo">Pertamax Turbo</option>
                    <option value="Dexlite / Solar">Dexlite / Solar</option>
                    <option value="Shell / BP">Shell / BP</option>
                  </select>
                </div>
                <input
                  type="text"
                  placeholder="Plat nomor (opsional)"
                  value={plateNumber}
                  onChange={(e) => setPlateNumber(e.target.value)}
                  className="w-full min-h-[40px] rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-xs text-slate-900 dark:text-slate-100"
                />
                <button
                  type="submit"
                  className="w-full min-h-[40px] rounded-lg bg-teal-700 text-white text-xs font-semibold hover:bg-teal-800"
                >
                  Simpan Kendaraan
                </button>
              </form>
            )}
          </div>

          {/* Theme Toggle */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
            <div>
              <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                Tampilan Gelap (Dark Mode)
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Nyaman dipakai saat mengisi bensin malam hari
              </div>
            </div>
            <button
              type="button"
              onClick={onToggleDark}
              className="min-h-[42px] px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 inline-flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
              <span>{isDark ? 'Mode Terang' : 'Mode Gelap'}</span>
            </button>
          </div>

          {/* Data Management */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
            <span className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Data & Ekspor
            </span>

            <button
              type="button"
              onClick={onExportAllCSV}
              className="w-full min-h-[44px] flex items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Ekspor Semua Riwayat ke CSV</span>
            </button>

            {!isSampleData && (
              <button
                type="button"
                onClick={onRestoreSampleData}
                className="w-full min-h-[44px] flex items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Muat Ulang Data Contoh</span>
              </button>
            )}

            {confirmClear ? (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 space-y-2">
                <p className="text-xs text-rose-700 dark:text-rose-300 font-medium">
                  Hapus seluruh riwayat pengisian kendaraan aktif agar mulai dari nol?
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      onClearAllLogs();
                      setConfirmClear(false);
                    }}
                    className="flex-1 min-h-[40px] rounded-lg bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700"
                  >
                    Ya, Kosongkan
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmClear(false)}
                    className="flex-1 min-h-[40px] rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-slate-700 dark:text-slate-200"
                  >
                    Batal
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmClear(true)}
                className="w-full min-h-[44px] flex items-center justify-center gap-2 rounded-xl border border-rose-200 dark:border-rose-900 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>Kosongkan Catatan Kendaraan Ini</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
