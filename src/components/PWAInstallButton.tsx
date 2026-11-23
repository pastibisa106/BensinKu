import React, { useState } from 'react';
import { Download, Smartphone, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  compact?: boolean;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ compact = false }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={install}
        className="inline-flex items-center justify-center gap-2 min-h-[40px] px-3.5 py-2 rounded-xl bg-teal-700 text-white text-xs font-semibold hover:bg-teal-800 active:scale-[0.98] transition-all whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600"
      >
        <Download className="w-4 h-4 shrink-0" />
        <span>{compact ? 'Pasang' : 'Pasang di Android'}</span>
      </button>
    );
  }

  // Fallback guide for iOS Safari or Android Chrome when beforeinstallprompt hasn't fired
  return (
    <>
      <button
        type="button"
        onClick={() => setShowGuide(true)}
        className="inline-flex items-center justify-center gap-1.5 min-h-[40px] px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600"
        title="Cara pasang sebagai aplikasi Android / HP"
      >
        <Smartphone className="w-3.5 h-3.5 shrink-0 text-teal-700 dark:text-teal-400" />
        <span>{compact ? 'App' : 'Pasang App'}</span>
      </button>

      {showGuide && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs p-0 sm:p-4"
          onClick={() => setShowGuide(false)}
        >
          <div
            className="w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-xl border border-slate-200 dark:border-slate-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Pasang BensinKu di Layar Utama
              </h3>
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                aria-label="Tutup panduan"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {isIOS ? (
              <ol className="mt-4 space-y-2.5 text-sm text-slate-600 dark:text-slate-300 list-decimal list-inside">
                <li>Ketuk tombol <strong>Bagikan (Share)</strong> di bar bawah Safari.</li>
                <li>Gulir ke bawah lalu pilih <strong>Tambah ke Layar Utama (Add to Home Screen)</strong>.</li>
                <li>Ketuk <strong>Tambah</strong> untuk menjalankan layaknya aplikasi native.</li>
              </ol>
            ) : (
              <ol className="mt-4 space-y-2.5 text-sm text-slate-600 dark:text-slate-300 list-decimal list-inside">
                <li>Buka halaman ini lewat <strong>Google Chrome</strong> di HP Android Anda.</li>
                <li>Ketuk ikon menu titik tiga <strong>(⋮)</strong> di pojok kanan atas Chrome.</li>
                <li>Pilih <strong>Tambahkan ke Layar utama</strong> atau <strong>Instal aplikasi</strong>.</li>
              </ol>
            )}

            <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
              Setelah terpasang, seluruh catatan pengisian bensin tetap tersimpan dan dapat dibuka tanpa koneksi internet.
            </p>

            <button
              type="button"
              onClick={() => setShowGuide(false)}
              className="mt-5 w-full min-h-[44px] rounded-xl bg-teal-700 text-white text-sm font-semibold hover:bg-teal-800 transition-colors"
            >
              Mengerti
            </button>
          </div>
        </div>
      )}
    </>
  );
};
