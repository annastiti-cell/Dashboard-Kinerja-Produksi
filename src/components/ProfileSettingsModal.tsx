import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useFirebase } from '../context/FirebaseContext';
import { BLUEPRINT_LIMITS } from '../types';

interface ProfileSettingsModalProps {
  open: boolean;
  onClose: () => void;
}

export function ProfileSettingsModal({ open, onClose }: ProfileSettingsModalProps) {
  const { user, profile, updateMyProfile } = useFirebase();
  const [displayName, setDisplayName] = useState('');
  const [unitKerja, setUnitKerja] = useState('');
  const [jabatan, setJabatan] = useState('');
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!open || !profile) return;
    setDisplayName(profile.displayName);
    setUnitKerja(profile.unitKerja);
    setJabatan(profile.jabatan);
    setErrorMsg('');
  }, [open, profile]);

  if (!open || !profile) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSaving(true);
    try {
      await updateMyProfile({
        displayName,
        unitKerja,
        jabatan,
        dailyReminderEnabled: profile.dailyReminderEnabled,
        reminderHour: profile.reminderHour,
      });
      onClose();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Gagal memperbarui profil.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50">
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-md bg-white border border-slate-200 rounded-xl overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="font-display text-base font-semibold text-slate-900">
            Pengaturan Profil Pekerja
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="p-1 text-slate-400 hover:text-slate-700 rounded-md"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 font-medium">
              {errorMsg}
            </div>
          )}

          <div className="space-y-1">
            <span className="block text-xs font-semibold text-slate-500">Email Akun</span>
            <p className="text-sm font-mono text-slate-700">{user?.email || '—'}</p>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="prof-name" className="block text-xs font-semibold text-slate-700">
              Nama Lengkap
            </label>
            <input
              id="prof-name"
              type="text"
              required
              minLength={BLUEPRINT_LIMITS.workerProfile.displayNameMin}
              maxLength={BLUEPRINT_LIMITS.workerProfile.displayNameMax}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="prof-unit" className="block text-xs font-semibold text-slate-700">
              Unit Kerja / Sub-Tim
            </label>
            <input
              id="prof-unit"
              type="text"
              required
              minLength={BLUEPRINT_LIMITS.workerProfile.unitKerjaMin}
              maxLength={BLUEPRINT_LIMITS.workerProfile.unitKerjaMax}
              value={unitKerja}
              onChange={(e) => setUnitKerja(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="prof-jabatan" className="block text-xs font-semibold text-slate-700">
              Jabatan
            </label>
            <input
              id="prof-jabatan"
              type="text"
              required
              minLength={BLUEPRINT_LIMITS.workerProfile.jabatanMin}
              maxLength={BLUEPRINT_LIMITS.workerProfile.jabatanMax}
              value={jabatan}
              onChange={(e) => setJabatan(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors disabled:opacity-60"
            >
              {saving ? 'Menyimpan...' : 'Simpan Profil'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
