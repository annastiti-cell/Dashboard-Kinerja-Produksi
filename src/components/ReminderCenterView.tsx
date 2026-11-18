import React, { useEffect, useMemo, useState } from 'react';
import { Bell, BellRing, CheckCircle2, Clock, Plus } from 'lucide-react';
import { useFirebase } from '../context/FirebaseContext';
import type { ProductionLog } from '../types';
import { formatIndonesianDate, getTodayLocalDate } from '../utils/dateUtils';

interface ReminderCenterViewProps {
  allLogs: ProductionLog[];
  onQuickLogToday: () => void;
}

export function ReminderCenterView({ allLogs, onQuickLogToday }: ReminderCenterViewProps) {
  const {
    profile,
    workers,
    hasLoggedToday,
    browserNotificationPermission,
    requestBrowserNotifications,
    triggerTestReminder,
    updateMyProfile,
  } = useFirebase();

  const today = getTodayLocalDate();
  const [enabled, setEnabled] = useState(profile?.dailyReminderEnabled ?? true);
  const [reminderHour, setReminderHour] = useState(profile?.reminderHour ?? 16);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setEnabled(profile.dailyReminderEnabled);
      setReminderHour(profile.reminderHour);
    }
  }, [profile]);

  const todayCompliance = useMemo(() => {
    const loggedMap = new Map<string, number>();
    for (const log of allLogs) {
      if (log.productionDate === today) {
        loggedMap.set(log.workerId, (loggedMap.get(log.workerId) ?? 0) + 1);
      }
    }
    return workers.map((w) => ({
      worker: w,
      countToday: loggedMap.get(w.uid) ?? 0,
    }));
  }, [workers, allLogs, today]);

  const handleSaveSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    try {
      await updateMyProfile({
        displayName: profile.displayName,
        unitKerja: profile.unitKerja,
        jabatan: profile.jabatan,
        dailyReminderEnabled: enabled,
        reminderHour,
      });
    } finally {
      setSaving(false);
    }
  };

  const loggedWorkerCount = todayCompliance.filter((item) => item.countToday > 0).length;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Personal Reminder Settings */}
      <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 space-y-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-base font-semibold text-slate-900">
              Jadwal Notifikasi Otomatis Harian
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Mengingatkan Anda secara otomatis jika belum mencatat kinerja pada hari kerja berjalan
            </p>
          </div>
          <Bell className="w-5 h-5 text-blue-700 shrink-0" />
        </div>

        <div
          className={`p-4 rounded-lg border ${
            hasLoggedToday
              ? 'bg-emerald-50 border-emerald-200'
              : 'bg-amber-50 border-amber-200'
          }`}
        >
          <div className="flex items-start gap-2.5">
            {hasLoggedToday ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-700 mt-0.5 shrink-0" />
            ) : (
              <Clock className="w-4 h-4 text-amber-700 mt-0.5 shrink-0" />
            )}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-900">
                Status Hari Ini ({formatIndonesianDate(today)})
              </p>
              <p className="text-xs text-slate-700 leading-relaxed">
                {hasLoggedToday
                  ? 'Anda sudah mencatat kinerja produksi hari ini. Pengingat otomatis tidak akan muncul lagi hari ini.'
                  : 'Anda belum menginput catatan kinerja untuk hari ini. Catat sekarang agar tanggal produksi tidak terlupa.'}
              </p>
              {!hasLoggedToday && (
                <button
                  type="button"
                  onClick={onQuickLogToday}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold rounded-md transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Catat Kinerja Hari Ini
                </button>
              )}
            </div>
          </div>
        </div>

        <form onSubmit={handleSaveSchedule} className="space-y-4 pt-2 border-t border-slate-200">
          <label className="flex items-center justify-between gap-3 cursor-pointer">
            <div>
              <span className="block text-sm font-medium text-slate-900">
                Aktifkan Pengingat Harian Otomatis
              </span>
              <span className="block text-xs text-slate-500">
                Tampilkan notifikasi pengingat jika belum ada input di tanggal aktif
              </span>
            </div>
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              className="w-4 h-4 accent-blue-700 rounded"
            />
          </label>

          <div className="space-y-1.5">
            <label htmlFor="rem-hour" className="block text-xs font-semibold text-slate-700">
              Jam Mulai Pengingat Otomatis
            </label>
            <select
              id="rem-hour"
              value={reminderHour}
              onChange={(e) => setReminderHour(Number(e.target.value))}
              disabled={!enabled}
              className="w-full px-3 py-2 text-sm font-mono bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700 disabled:bg-slate-100"
            >
              {Array.from({ length: 14 }, (_, idx) => idx + 8).map((hour) => (
                <option key={hour} value={hour}>
                  {String(hour).padStart(2, '0')}:00 WIB
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-60"
          >
            {saving ? 'Menyimpan...' : 'Simpan Pengaturan Pengingat'}
          </button>
        </form>

        <div className="pt-4 border-t border-slate-200 space-y-2.5">
          <p className="text-xs font-semibold text-slate-700">
            Notifikasi Desktop Browser
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            {browserNotificationPermission !== 'granted' &&
              browserNotificationPermission !== 'unsupported' && (
                <button
                  type="button"
                  onClick={() => void requestBrowserNotifications()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                >
                  <BellRing className="w-3.5 h-3.5" />
                  Izinkan Notifikasi Browser
                </button>
              )}
            <button
              type="button"
              onClick={triggerTestReminder}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Uji Notifikasi Sekarang
            </button>
          </div>
          <p className="text-[11px] text-slate-500">
            Status izin browser:{' '}
            <span className="font-mono">
              {browserNotificationPermission === 'granted'
                ? 'Diizinkan'
                : browserNotificationPermission === 'denied'
                  ? 'Diblokir browser'
                  : browserNotificationPermission === 'unsupported'
                    ? 'Tidak didukung'
                    : 'Belum diminta'}
            </span>
          </p>
        </div>
      </div>

      {/* Live Section Daily Input Compliance */}
      <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-base font-semibold text-slate-900">
              Pemantauan Input Harian Tim — {formatIndonesianDate(today)}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Pantau kepatuhan input harian secara real-time di seluruh Seksi Pelayanan Teknis
            </p>
          </div>
          <span className="font-mono text-xs font-semibold text-slate-700 tabular-nums shrink-0">
            {loggedWorkerCount} / {workers.length} sudah input
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {todayCompliance.length === 0 ? (
            <p className="p-8 text-center text-sm text-slate-500">
              Belum ada pekerja yang terdaftar.
            </p>
          ) : (
            todayCompliance.map(({ worker, countToday }) => (
              <div
                key={worker.uid}
                className="px-6 py-3.5 flex items-center justify-between gap-4"
              >
                <div>
                  <p className="text-sm font-medium text-slate-900">{worker.displayName}</p>
                  <p className="text-xs text-slate-500">
                    {worker.jabatan} · {worker.unitKerja}
                  </p>
                </div>
                {countToday > 0 ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {countToday} entri hari ini
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 shrink-0">
                    <Clock className="w-3.5 h-3.5" />
                    Belum input hari ini
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
