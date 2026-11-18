import React, { useState } from 'react';
import { ArrowRight, ShieldCheck, Users } from 'lucide-react';
import { useFirebase } from '../context/FirebaseContext';
import type { PortalMode } from '../types';

export function LoginPortal() {
  const { loginWithGoogle } = useFirebase();
  const [selectedPortal, setSelectedPortal] = useState<PortalMode>('worker');
  const [submitting, setSubmitting] = useState(false);

  const handleLogin = async () => {
    setSubmitting(true);
    try {
      await loginWithGoogle(selectedPortal);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      <header className="w-full border-b border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-8">
          <span className="font-display text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0">
            LintasTeknis
          </span>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <a href="#alur-kerja" className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0">
              Alur Kerja
            </a>
            <a href="#portal-akses" className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0">
              Portal Akses
            </a>
          </nav>
          <button
            type="button"
            onClick={handleLogin}
            disabled={submitting}
            className="px-4 py-2 text-xs font-semibold text-white bg-blue-700 rounded-lg hover:bg-blue-800 transition-colors whitespace-nowrap shrink-0 disabled:opacity-60"
          >
            {submitting ? 'Memproses...' : 'Masuk Sistem'}
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-12 lg:py-16 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        <section id="alur-kerja" className="lg:col-span-7 space-y-8">
          <div className="space-y-4">
            <p className="text-xs font-medium text-slate-500">
              Seksi Pelayanan Teknis · Pengelola Layanan Operasional
            </p>
            <h1 className="font-display text-3xl sm:text-4xl lg:text-[2.75rem] font-bold tracking-tight text-slate-900 leading-[1.15] text-balance">
              Pencatatan Kinerja Produksi Harian yang Terdistribusi dan Tervalidasi
            </h1>
            <p className="text-base text-slate-600 leading-relaxed max-w-2xl">
              Gantikan rekapitulasi terpusat di akhir bulan dengan pencatatan langsung oleh setiap pekerja di Seksi Pelayanan Teknis secara real-time, lengkap dengan pengingat harian otomatis dan validasi resmi Admin.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-slate-200">
            <div className="space-y-1.5">
              <h2 className="font-display text-sm font-semibold text-slate-900">
                01. Input Harian Real-Time
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                Setiap teknisi mencatat pekerjaan langsung pada tanggal pelaksanaan agar tidak ada log yang terlupa di akhir bulan.
              </p>
            </div>
            <div className="space-y-1.5">
              <h2 className="font-display text-sm font-semibold text-slate-900">
                02. Notifikasi Pengingat Otomatis
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                Sistem mendeteksi pekerja yang belum melakukan input hari ini dan mengirim pengingat otomatis terjadwal.
              </p>
            </div>
            <div className="space-y-1.5">
              <h2 className="font-display text-sm font-semibold text-slate-900">
                03. Dasbor Capaian & Ekspor Laporan
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                Pantau progres bulanan terhadap target seksi secara instan dan ekspor laporan rapi ke format Excel (.xlsx) atau PDF.
              </p>
            </div>
            <div className="space-y-1.5">
              <h2 className="font-display text-sm font-semibold text-slate-900">
                04. Validasi Terpisah Admin
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                Pengelola Layanan Operasional masuk melalui portal Admin khusus untuk meninjau, menyetujui, atau meminta revisi data.
              </p>
            </div>
          </div>
        </section>

        <section id="portal-akses" className="lg:col-span-5">
          <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-6">
            <div className="space-y-1.5">
              <h2 className="font-display text-xl font-semibold text-slate-900">
                Pilih Portal Masuk
              </h2>
              <p className="text-sm text-slate-600">
                Akses pekerja dan validator dipisahkan untuk menjaga integritas data kinerja bulanan.
              </p>
            </div>

            <div
              role="tablist"
              aria-label="Pilihan Portal Login"
              className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-lg"
            >
              <button
                type="button"
                role="tab"
                aria-selected={selectedPortal === 'worker'}
                onClick={() => setSelectedPortal('worker')}
                className={`flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  selectedPortal === 'worker'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Users className="w-4 h-4 shrink-0" />
                Portal Pekerja
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={selectedPortal === 'admin'}
                onClick={() => setSelectedPortal('admin')}
                className={`flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  selectedPortal === 'admin'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ShieldCheck className="w-4 h-4 shrink-0" />
                Portal Admin
              </button>
            </div>

            {selectedPortal === 'worker' ? (
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-2">
                <p className="text-sm font-semibold text-slate-900">
                  Akses Pekerja — Seksi Pelayanan Teknis
                </p>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Gunakan akun Google kerja Anda untuk mencatat hasil produksi harian, memantau capaian bulanan tim, mengatur pengingat harian, dan mengunduh laporan Excel/PDF.
                </p>
              </div>
            ) : (
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-2">
                <p className="text-sm font-semibold text-slate-900">
                  Akses Terpisah Admin / Validator
                </p>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Khusus Pengelola Layanan Operasional yang terdaftar sebagai validator untuk memverifikasi data masuk, memberi catatan revisi, menetapkan target bulanan, dan mengelola daftar validator.
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={handleLogin}
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2.5 px-4 py-3 bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-60"
            >
              <span>
                {submitting
                  ? 'Menghubungkan ke Google...'
                  : selectedPortal === 'admin'
                    ? 'Masuk ke Portal Admin dengan Google'
                    : 'Masuk ke Portal Pekerja dengan Google'}
              </span>
              <ArrowRight className="w-4 h-4 shrink-0" />
            </button>

            <p className="text-xs text-slate-500 text-center">
              Autentikasi aman melalui Google Sign-In dengan sinkronisasi basis data real-time.
            </p>
          </div>
        </section>
      </main>

      <footer className="w-full border-t border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <span>LintasTeknis · Sistem Pencatatan Kinerja Seksi Pelayanan Teknis</span>
          <span>Data tersimpan dan tersinkronisasi secara real-time</span>
        </div>
      </footer>
    </div>
  );
}
