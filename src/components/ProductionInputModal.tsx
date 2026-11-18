import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useFirebase } from '../context/FirebaseContext';
import {
  BLUEPRINT_LIMITS,
  PRODUCTION_CATEGORIES,
  UNIT_MEASURES,
  type LogStatus,
  type ProductionCategory,
  type ProductionLog,
} from '../types';
import { getTodayLocalDate } from '../utils/dateUtils';

interface ProductionInputModalProps {
  open: boolean;
  onClose: () => void;
  initialDate?: string;
  editingLog?: ProductionLog | null;
}

export function ProductionInputModal({
  open,
  onClose,
  initialDate,
  editingLog,
}: ProductionInputModalProps) {
  const {
    user,
    isAdmin,
    workers,
    createProductionLog,
    updateProductionLog,
    adminCreateProductionLog,
    adminUpdateProductionLog,
  } = useFirebase();

  const [workerId, setWorkerId] = useState<string>('');
  const [productionDate, setProductionDate] = useState(getTodayLocalDate());
  const [activityTitle, setActivityTitle] = useState('');
  const [category, setCategory] = useState<ProductionCategory>(PRODUCTION_CATEGORIES[0]);
  const [quantity, setQuantity] = useState<string>('1');
  const [unitMeasure, setUnitMeasure] = useState<string>(UNIT_MEASURES[0]);
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<LogStatus>('pending');
  const [validationNotes, setValidationNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!open) return;
    setErrorMsg('');
    if (editingLog) {
      setWorkerId(editingLog.workerId);
      setProductionDate(editingLog.productionDate);
      setActivityTitle(editingLog.activityTitle);
      setCategory(
        PRODUCTION_CATEGORIES.includes(editingLog.category)
          ? editingLog.category
          : PRODUCTION_CATEGORIES[0],
      );
      setQuantity(String(editingLog.quantity));
      setUnitMeasure(editingLog.unitMeasure);
      setNotes(editingLog.notes);
      setStatus(editingLog.status);
      setValidationNotes(editingLog.validationNotes || '');
    } else {
      setWorkerId(user?.uid ?? workers[0]?.uid ?? '');
      setProductionDate(initialDate || getTodayLocalDate());
      setActivityTitle('');
      setCategory(PRODUCTION_CATEGORIES[0]);
      setQuantity('1');
      setUnitMeasure(UNIT_MEASURES[0]);
      setNotes('');
      setStatus('pending');
      setValidationNotes('');
    }
  }, [open, editingLog, initialDate, user?.uid, workers]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const trimmedTitle = activityTitle.trim();
    const numericQty = Number(quantity);

    if (!BLUEPRINT_LIMITS.productionLog.datePattern.test(productionDate)) {
      setErrorMsg('Pilih tanggal proses produksi yang valid.');
      return;
    }
    if (trimmedTitle.length < BLUEPRINT_LIMITS.productionLog.activityTitleMin) {
      setErrorMsg('Nama pekerjaan minimal 3 karakter.');
      return;
    }
    if (!Number.isFinite(numericQty) || numericQty <= 0) {
      setErrorMsg('Jumlah output harus lebih besar dari 0.');
      return;
    }

    setSubmitting(true);
    try {
      const draft = {
        productionDate,
        activityTitle: trimmedTitle,
        category,
        quantity: numericQty,
        unitMeasure: unitMeasure.trim() || 'Unit',
        notes: notes.trim(),
      };
      if (isAdmin) {
        const selectedWorkerId = workerId || editingLog?.workerId || user?.uid || '';
        if (editingLog) {
          await adminUpdateProductionLog(editingLog.id, {
            ...draft,
            workerId: selectedWorkerId,
            status,
            validationNotes,
          });
        } else {
          await adminCreateProductionLog({
            ...draft,
            workerId: selectedWorkerId,
            status,
            validationNotes,
          });
        }
      } else if (editingLog) {
        await updateProductionLog(editingLog.id, draft);
      } else {
        await createProductionLog(draft);
      }
      onClose();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Gagal menyimpan catatan produksi.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-production-title"
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white border border-slate-200 rounded-xl"
      >
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
          <div>
            <h2 id="modal-production-title" className="font-display text-base font-semibold text-slate-900">
              {editingLog ? 'Perbarui Catatan Produksi' : 'Catat Kinerja Produksi Harian'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {isAdmin
                ? 'Mode Admin: Anda dapat mengedit seluruh rincian, pekerja, dan status validasi'
                : 'Data langsung tersimpan real-time dan masuk ke antrean validasi Admin'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup dialog"
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
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

          {isAdmin && workers.length > 0 && (
            <div className="space-y-1.5">
              <label htmlFor="prod-worker" className="block text-xs font-semibold text-slate-700">
                Pekerja Pelaksana (Akses Admin)
              </label>
              <select
                id="prod-worker"
                value={workerId}
                onChange={(e) => setWorkerId(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700 focus:border-blue-700"
              >
                {workers.map((w) => (
                  <option key={w.uid} value={w.uid}>
                    {w.displayName} — {w.unitKerja}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="prod-date" className="block text-xs font-semibold text-slate-700">
                Tanggal Proses Produksi
              </label>
              <input
                id="prod-date"
                type="date"
                required
                value={productionDate}
                onChange={(e) => setProductionDate(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700 focus:border-blue-700"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="prod-category" className="block text-xs font-semibold text-slate-700">
                Kategori Mesin / Proses
              </label>
              <select
                id="prod-category"
                value={category}
                onChange={(e) => setCategory(e.target.value as ProductionCategory)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700 focus:border-blue-700"
              >
                {PRODUCTION_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat === 'Finishing'
                      ? 'Finishing (termasuk Pasang Tali & Mata Ayam)'
                      : cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="prod-title" className="block text-xs font-semibold text-slate-700">
                Nama Pekerjaan / Aktivitas Produksi
              </label>
              <span className="font-mono text-[11px] text-slate-400 tabular-nums">
                {activityTitle.length}/{BLUEPRINT_LIMITS.productionLog.activityTitleMax}
              </span>
            </div>
            <input
              id="prod-title"
              type="text"
              required
              minLength={BLUEPRINT_LIMITS.productionLog.activityTitleMin}
              maxLength={BLUEPRINT_LIMITS.productionLog.activityTitleMax}
              placeholder="Contoh: Pemeliharaan panel distribusi gardu sektor utara"
              value={activityTitle}
              onChange={(e) => setActivityTitle(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700 focus:border-blue-700"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="prod-qty" className="block text-xs font-semibold text-slate-700">
                Jumlah Output
              </label>
              <input
                id="prod-qty"
                type="number"
                step="any"
                min={0.01}
                max={BLUEPRINT_LIMITS.productionLog.quantityMax}
                required
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700 focus:border-blue-700"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="prod-unit" className="block text-xs font-semibold text-slate-700">
                Satuan Output
              </label>
              <select
                id="prod-unit"
                value={unitMeasure}
                onChange={(e) => setUnitMeasure(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700 focus:border-blue-700"
              >
                {UNIT_MEASURES.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="prod-notes" className="block text-xs font-semibold text-slate-700">
                Produk atau Varian (Opsional)
              </label>
              <span className="font-mono text-[11px] text-slate-400 tabular-nums">
                {notes.length}/{BLUEPRINT_LIMITS.productionLog.notesMax}
              </span>
            </div>
            <textarea
              id="prod-notes"
              rows={2}
              maxLength={BLUEPRINT_LIMITS.productionLog.notesMax}
              placeholder="Masukkan nama produk, varian kemasan, ukuran, atau keterangan tambahan"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700 focus:border-blue-700 resize-none"
            />
          </div>

          {isAdmin && (
            <div className="pt-3 border-t border-slate-200 space-y-3">
              <div className="space-y-1.5">
                <label htmlFor="prod-status" className="block text-xs font-semibold text-slate-700">
                  Status Validasi (Kontrol Admin)
                </label>
                <select
                  id="prod-status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as LogStatus)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700"
                >
                  <option value="pending">Menunggu Validasi</option>
                  <option value="approved">Disetujui</option>
                  <option value="rejected">Perlu Revisi / Ditolak</option>
                </select>
              </div>

              {status !== 'pending' && (
                <div className="space-y-1.5">
                  <label htmlFor="prod-val-notes" className="block text-xs font-semibold text-slate-700">
                    Catatan Validator
                  </label>
                  <input
                    id="prod-val-notes"
                    type="text"
                    maxLength={BLUEPRINT_LIMITS.productionLog.validationNotesMax}
                    placeholder="Keterangan validasi atau catatan koreksi..."
                    value={validationNotes}
                    onChange={(e) => setValidationNotes(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700"
                  />
                </div>
              )}
            </div>
          )}

          <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors disabled:opacity-60"
            >
              {submitting
                ? 'Menyimpan...'
                : editingLog
                  ? 'Simpan Perubahan'
                  : 'Simpan Kinerja'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
