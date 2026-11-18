import React, { useEffect, useState } from 'react';
import { Database, Edit3, Shield, ShieldOff, Target, Trash2, UserPlus, X } from 'lucide-react';
import { useFirebase } from '../context/FirebaseContext';
import { BLUEPRINT_LIMITS, type WorkerProfile } from '../types';
import { formatMonthLabel } from '../utils/dateUtils';

export function AdminTargetAndRolesView() {
  const {
    user,
    isAdmin,
    selectedMonth,
    targets,
    workers,
    admins,
    saveMonthlyTarget,
    deleteMonthlyTarget,
    adminUpdateWorkerProfile,
    adminDeleteWorkerProfile,
    grantAdminAccess,
    revokeAdminAccess,
    seedingData,
    seedInitialOktoberData,
  } = useFirebase();

  const existingTarget = targets[selectedMonth];

  const [targetTotalOutput, setTargetTotalOutput] = useState<string>('200');
  const [workingDaysTarget, setWorkingDaysTarget] = useState<string>('22');
  const [dailyPerWorkerTarget, setDailyPerWorkerTarget] = useState<string>('2');
  const [notes, setNotes] = useState<string>('');
  const [savingTarget, setSavingTarget] = useState(false);
  const [busyUid, setBusyUid] = useState<string | null>(null);

  const [editingWorker, setEditingWorker] = useState<WorkerProfile | null>(null);
  const [wName, setWName] = useState('');
  const [wUnit, setWUnit] = useState('');
  const [wJabatan, setWJabatan] = useState('');
  const [wReminderEnabled, setWReminderEnabled] = useState(true);
  const [wReminderHour, setWReminderHour] = useState(16);
  const [savingWorker, setSavingWorker] = useState(false);
  const [workerErr, setWorkerErr] = useState('');

  useEffect(() => {
    if (existingTarget) {
      setTargetTotalOutput(String(existingTarget.targetTotalOutput));
      setWorkingDaysTarget(String(existingTarget.workingDaysTarget));
      setDailyPerWorkerTarget(String(existingTarget.dailyPerWorkerTarget));
      setNotes(existingTarget.notes || '');
    } else {
      setTargetTotalOutput('200');
      setWorkingDaysTarget('22');
      setDailyPerWorkerTarget('2');
      setNotes('');
    }
  }, [existingTarget, selectedMonth]);

  if (!isAdmin) return null;

  const adminUidSet = new Set(admins.map((a) => a.uid));

  const handleSaveTarget = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingTarget(true);
    try {
      await saveMonthlyTarget({
        monthKey: selectedMonth,
        targetTotalOutput: Number(targetTotalOutput),
        workingDaysTarget: Number(workingDaysTarget),
        dailyPerWorkerTarget: Number(dailyPerWorkerTarget),
        notes,
      });
    } finally {
      setSavingTarget(false);
    }
  };

  const openEditWorker = (w: WorkerProfile) => {
    setEditingWorker(w);
    setWName(w.displayName);
    setWUnit(w.unitKerja);
    setWJabatan(w.jabatan);
    setWReminderEnabled(w.dailyReminderEnabled);
    setWReminderHour(w.reminderHour);
    setWorkerErr('');
  };

  const handleSaveWorker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWorker) return;
    setWorkerErr('');
    setSavingWorker(true);
    try {
      await adminUpdateWorkerProfile(editingWorker.uid, {
        displayName: wName,
        unitKerja: wUnit,
        jabatan: wJabatan,
        dailyReminderEnabled: wReminderEnabled,
        reminderHour: wReminderHour,
      });
      setEditingWorker(null);
    } catch (err) {
      setWorkerErr(err instanceof Error ? err.message : 'Gagal memperbarui profil pekerja.');
    } finally {
      setSavingWorker(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Monthly Target Settings */}
      <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 space-y-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-base font-semibold text-slate-900">
              Target Bulanan — {formatMonthLabel(selectedMonth)}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Digunakan sebagai tolok ukur capaian pada dasbor visual & laporan Excel/PDF
            </p>
          </div>
          <Target className="w-5 h-5 text-blue-700 shrink-0" />
        </div>

        <form onSubmit={handleSaveTarget} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="t-total" className="block text-xs font-semibold text-slate-700">
              Target Total Output Seksi (Unit/Pekerjaan)
            </label>
            <input
              id="t-total"
              type="number"
              min={1}
              max={BLUEPRINT_LIMITS.monthlyTarget.targetTotalOutputMax}
              step="any"
              required
              value={targetTotalOutput}
              onChange={(e) => setTargetTotalOutput(e.target.value)}
              className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label htmlFor="t-days" className="block text-xs font-semibold text-slate-700">
                Hari Kerja Efektif
              </label>
              <input
                id="t-days"
                type="number"
                min={1}
                max={31}
                required
                value={workingDaysTarget}
                onChange={(e) => setWorkingDaysTarget(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="t-daily" className="block text-xs font-semibold text-slate-700">
                Target Harian / Pekerja
              </label>
              <input
                id="t-daily"
                type="number"
                min={0.1}
                step="any"
                required
                value={dailyPerWorkerTarget}
                onChange={(e) => setDailyPerWorkerTarget(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="t-notes" className="block text-xs font-semibold text-slate-700">
              Catatan Target Operasional
            </label>
            <textarea
              id="t-notes"
              rows={3}
              maxLength={BLUEPRINT_LIMITS.monthlyTarget.notesMax}
              placeholder="Contoh: Fokus penyelesaian kalibrasi kuartal IV & pemeliharaan berkala"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700 resize-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={savingTarget}
              className="flex-1 px-4 py-2.5 bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-60"
            >
              {savingTarget ? 'Menyimpan...' : 'Simpan Target Bulanan'}
            </button>
            {existingTarget && (
              <button
                type="button"
                onClick={() => void deleteMonthlyTarget(selectedMonth)}
                title="Hapus target bulan ini"
                className="px-3 py-2.5 text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </form>

        <div className="pt-5 border-t border-slate-200 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-display text-sm font-semibold text-slate-900">
                Data Awal Laporan Oktober (PDF)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                34 Order · 118 proses terdata · 8 Operator & 1 Vendor Percetakan Offset. Muat ulang atau sinkronkan tanpa menimpa perubahan Anda.
              </p>
            </div>
            <Database className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
          </div>
          <button
            type="button"
            disabled={seedingData}
            onClick={() => void seedInitialOktoberData()}
            className="w-full px-3.5 py-2 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-60"
          >
            {seedingData ? 'Menyinkronkan Data Oktober...' : 'Sinkronkan Data Awal Laporan Oktober'}
          </button>
        </div>
      </div>

      {/* Worker Directory & Admin Validator Access */}
      <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="font-display text-base font-semibold text-slate-900">
              Kelola Data Pekerja & Hak Akses Validator
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Ubah profil pekerja, hapus data pekerja, atau tunjuk Admin Validator tambahan
            </p>
          </div>
          <span className="font-mono text-xs text-slate-500 tabular-nums">
            {workers.length} pekerja terdaftar
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {workers.length === 0 ? (
            <p className="p-8 text-center text-sm text-slate-500">
              Belum ada pekerja yang masuk ke sistem.
            </p>
          ) : (
            workers.map((w) => {
              const hasAdminRole = adminUidSet.has(w.uid);
              const isSelf = w.uid === user?.uid;
              return (
                <div
                  key={w.uid}
                  className="px-6 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {w.displayName}
                      {isSelf && (
                        <span className="ml-2 text-xs font-normal text-blue-700">(Anda)</span>
                      )}
                    </p>
                    <p className="text-xs text-slate-500">
                      {w.jabatan} · {w.unitKerja}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => openEditWorker(w)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      Edit
                    </button>

                    {hasAdminRole ? (
                      <>
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 px-1">
                          <Shield className="w-3.5 h-3.5" />
                          Admin
                        </span>
                        {!isSelf && (
                          <button
                            type="button"
                            disabled={busyUid === w.uid}
                            onClick={async () => {
                              setBusyUid(w.uid);
                              try {
                                await revokeAdminAccess(w.uid);
                              } finally {
                                setBusyUid(null);
                              }
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-md transition-colors disabled:opacity-50"
                          >
                            <ShieldOff className="w-3.5 h-3.5" />
                            Cabut
                          </button>
                        )}
                      </>
                    ) : (
                      <button
                        type="button"
                        disabled={busyUid === w.uid}
                        onClick={async () => {
                          setBusyUid(w.uid);
                          try {
                            await grantAdminAccess(w);
                          } finally {
                            setBusyUid(null);
                          }
                        }}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors disabled:opacity-50"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        Jadikan Admin
                      </button>
                    )}

                    {!isSelf && (
                      <button
                        type="button"
                        disabled={busyUid === w.uid}
                        title="Hapus profil pekerja"
                        onClick={async () => {
                          setBusyUid(w.uid);
                          try {
                            await adminDeleteWorkerProfile(w.uid);
                          } finally {
                            setBusyUid(null);
                          }
                        }}
                        className="inline-flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-md transition-colors disabled:opacity-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Edit Worker Profile Modal */}
      {editingWorker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50">
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-md bg-white border border-slate-200 rounded-xl overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-display text-base font-semibold text-slate-900">
                Edit Profil Pekerja
              </h3>
              <button
                type="button"
                onClick={() => setEditingWorker(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveWorker} className="p-6 space-y-4">
              {workerErr && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 font-medium">
                  {workerErr}
                </div>
              )}

              <div className="space-y-1.5">
                <label htmlFor="aw-name" className="block text-xs font-semibold text-slate-700">
                  Nama Lengkap
                </label>
                <input
                  id="aw-name"
                  type="text"
                  required
                  minLength={BLUEPRINT_LIMITS.workerProfile.displayNameMin}
                  maxLength={BLUEPRINT_LIMITS.workerProfile.displayNameMax}
                  value={wName}
                  onChange={(e) => setWName(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="aw-unit" className="block text-xs font-semibold text-slate-700">
                  Unit Kerja
                </label>
                <input
                  id="aw-unit"
                  type="text"
                  required
                  minLength={BLUEPRINT_LIMITS.workerProfile.unitKerjaMin}
                  maxLength={BLUEPRINT_LIMITS.workerProfile.unitKerjaMax}
                  value={wUnit}
                  onChange={(e) => setWUnit(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="aw-jab" className="block text-xs font-semibold text-slate-700">
                  Jabatan
                </label>
                <input
                  id="aw-jab"
                  type="text"
                  required
                  minLength={BLUEPRINT_LIMITS.workerProfile.jabatanMin}
                  maxLength={BLUEPRINT_LIMITS.workerProfile.jabatanMax}
                  value={wJabatan}
                  onChange={(e) => setWJabatan(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700"
                />
              </div>

              <div className="flex items-center justify-between gap-3 pt-1">
                <label htmlFor="aw-rem" className="text-xs font-semibold text-slate-700">
                  Pengingat Harian Aktif
                </label>
                <input
                  id="aw-rem"
                  type="checkbox"
                  checked={wReminderEnabled}
                  onChange={(e) => setWReminderEnabled(e.target.checked)}
                  className="w-4 h-4 accent-blue-700 rounded"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="aw-hour" className="block text-xs font-semibold text-slate-700">
                  Jam Pengingat
                </label>
                <select
                  id="aw-hour"
                  value={wReminderHour}
                  onChange={(e) => setWReminderHour(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm font-mono bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700"
                >
                  {Array.from({ length: 14 }, (_, idx) => idx + 8).map((hour) => (
                    <option key={hour} value={hour}>
                      {String(hour).padStart(2, '0')}:00 WIB
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingWorker(null)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingWorker}
                  className="px-4 py-2 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors disabled:opacity-60"
                >
                  {savingWorker ? 'Menyimpan...' : 'Simpan Profil'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
