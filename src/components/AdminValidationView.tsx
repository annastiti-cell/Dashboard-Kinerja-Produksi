import React, { useMemo, useState } from 'react';
import {
  Check,
  CheckCircle2,
  Clock,
  Edit3,
  Search,
  ShieldCheck,
  Trash2,
  X,
  XCircle,
} from 'lucide-react';
import { useFirebase } from '../context/FirebaseContext';
import { BLUEPRINT_LIMITS, type LogStatus, type ProductionLog } from '../types';
import { formatIndonesianDate, formatMonthLabel } from '../utils/dateUtils';

interface AdminValidationViewProps {
  monthLogs: ProductionLog[];
  onEditLog: (log: ProductionLog) => void;
}

export function AdminValidationView({ monthLogs, onEditLog }: AdminValidationViewProps) {
  const { isAdmin, selectedMonth, validateProductionLog, deleteProductionLog } = useFirebase();
  const [statusFilter, setStatusFilter] = useState<'pending' | 'all' | 'approved' | 'rejected'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [reviewingLog, setReviewingLog] = useState<ProductionLog | null>(null);
  const [validationNotes, setValidationNotes] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);

  const counts = useMemo(() => {
    let pending = 0;
    let approved = 0;
    let rejected = 0;
    for (const l of monthLogs) {
      if (l.status === 'pending') pending += 1;
      else if (l.status === 'approved') approved += 1;
      else rejected += 1;
    }
    return { pending, approved, rejected, total: monthLogs.length };
  }, [monthLogs]);

  const filteredLogs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return monthLogs.filter((log) => {
      if (statusFilter !== 'all' && log.status !== statusFilter) return false;
      if (q) {
        const hay = `${log.workerName} ${log.activityTitle} ${log.category} ${log.unitKerja}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [monthLogs, statusFilter, searchQuery]);

  if (!isAdmin) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-8 text-center space-y-2">
        <ShieldCheck className="w-8 h-8 text-slate-400 mx-auto" />
        <h2 className="font-display text-base font-semibold text-slate-900">
          Akses Terbatas Admin Validator
        </h2>
        <p className="text-sm text-slate-600">
          Halaman ini hanya dapat diakses oleh Pengelola Layanan Operasional yang terdaftar sebagai Admin.
        </p>
      </div>
    );
  }

  const handleQuickValidate = async (
    log: ProductionLog,
    decision: Exclude<LogStatus, 'pending'>,
    note: string,
  ) => {
    setProcessingId(log.id);
    try {
      await validateProductionLog(log.id, decision, note);
      setReviewingLog(null);
      setValidationNotes('');
    } finally {
      setProcessingId(null);
    }
  };

  const handleDelete = async (log: ProductionLog) => {
    setProcessingId(log.id);
    try {
      await deleteProductionLog(log.id);
    } finally {
      setProcessingId(null);
    }
  };

  const openReviewModal = (log: ProductionLog) => {
    setReviewingLog(log);
    setValidationNotes(log.validationNotes || '');
  };

  return (
    <div className="space-y-6">
      {/* Validation Summary Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Menunggu Validasi</p>
            <p className="font-mono text-2xl font-bold text-amber-700 tabular-nums mt-1">
              {counts.pending}
            </p>
          </div>
          <Clock className="w-5 h-5 text-amber-600" />
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Telah Disetujui</p>
            <p className="font-mono text-2xl font-bold text-emerald-700 tabular-nums mt-1">
              {counts.approved}
            </p>
          </div>
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Diminta Revisi</p>
            <p className="font-mono text-2xl font-bold text-red-700 tabular-nums mt-1">
              {counts.rejected}
            </p>
          </div>
          <XCircle className="w-5 h-5 text-red-600" />
        </div>
      </div>

      {/* Validation Queue Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-base font-semibold text-slate-900">
              Validasi & Kelola Data Masuk — {formatMonthLabel(selectedMonth)}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Setujui, tolak, ubah langsung rincian catatan, atau hapus data yang tidak valid
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
              {(
                [
                  { id: 'pending', label: `Menunggu (${counts.pending})` },
                  { id: 'all', label: 'Semua' },
                  { id: 'approved', label: 'Disetujui' },
                  { id: 'rejected', label: 'Revisi' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setStatusFilter(tab.id)}
                  className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                    statusFilter === tab.id
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter pekerja atau aktivitas..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700 focus:border-blue-700"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold text-slate-600">
                <th className="py-2.5 px-5 whitespace-nowrap">Tanggal</th>
                <th className="py-2.5 px-4">Pekerja</th>
                <th className="py-2.5 px-4">Rincian Kinerja</th>
                <th className="py-2.5 px-4 text-right whitespace-nowrap">Output</th>
                <th className="py-2.5 px-4 whitespace-nowrap">Status</th>
                <th className="py-2.5 px-5 text-right whitespace-nowrap">Aksi Admin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 px-6 text-center text-sm text-slate-500">
                    {statusFilter === 'pending'
                      ? 'Seluruh catatan produksi untuk bulan ini sudah divalidasi.'
                      : 'Tidak ada data yang cocok dengan pencarian Anda.'}
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition-colors align-top">
                    <td className="py-3.5 px-5 font-mono text-xs text-slate-700 whitespace-nowrap tabular-nums">
                      {formatIndonesianDate(log.productionDate)}
                    </td>
                    <td className="py-3.5 px-4 min-w-[150px]">
                      <p className="font-medium text-slate-900">{log.workerName}</p>
                      <p className="text-xs text-slate-500">{log.unitKerja}</p>
                    </td>
                    <td className="py-3.5 px-4 min-w-[260px]">
                      <p className="font-medium text-slate-900">{log.activityTitle}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {log.category}
                        {log.notes ? ` · ${log.notes}` : ''}
                      </p>
                      {log.validationNotes && (
                        <p className="text-xs text-slate-600 mt-1">
                          Catatan Validator: {log.validationNotes}
                        </p>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-semibold text-slate-900 whitespace-nowrap tabular-nums">
                      {log.quantity.toLocaleString('id-ID')} {log.unitMeasure}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {log.status === 'approved' && (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Disetujui
                        </span>
                      )}
                      {log.status === 'pending' && (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700">
                          <Clock className="w-3.5 h-3.5" />
                          Menunggu
                        </span>
                      )}
                      {log.status === 'rejected' && (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-700">
                          <XCircle className="w-3.5 h-3.5" />
                          Ditolak
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-5 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        {log.status !== 'approved' && (
                          <button
                            type="button"
                            disabled={processingId === log.id}
                            onClick={() =>
                              void handleQuickValidate(
                                log,
                                'approved',
                                log.validationNotes || 'Tervalidasi sesuai laporan operasional',
                              )
                            }
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-md transition-colors disabled:opacity-50"
                          >
                            <Check className="w-3.5 h-3.5" />
                            Setujui
                          </button>
                        )}
                        <button
                          type="button"
                          disabled={processingId === log.id}
                          onClick={() => openReviewModal(log)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
                        >
                          {log.status === 'pending' ? 'Tinjau' : 'Status'}
                        </button>
                        <button
                          type="button"
                          onClick={() => onEditLog(log)}
                          title="Edit seluruh detail data"
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          Edit
                        </button>
                        <button
                          type="button"
                          disabled={processingId === log.id}
                          onClick={() => void handleDelete(log)}
                          title="Hapus data"
                          className="inline-flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-md transition-colors disabled:opacity-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review / Validation Modal */}
      {reviewingLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50">
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-lg bg-white border border-slate-200 rounded-xl overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-display text-base font-semibold text-slate-900">
                Validasi Catatan Kinerja
              </h3>
              <button
                type="button"
                onClick={() => setReviewingLog(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>{reviewingLog.workerName} · {reviewingLog.unitKerja}</span>
                  <span className="font-mono tabular-nums">
                    {formatIndonesianDate(reviewingLog.productionDate)}
                  </span>
                </div>
                <p className="text-sm font-semibold text-slate-900">
                  {reviewingLog.activityTitle}
                </p>
                <p className="text-xs text-slate-600">
                  {reviewingLog.category} ·{' '}
                  <span className="font-mono font-semibold text-slate-900">
                    {reviewingLog.quantity} {reviewingLog.unitMeasure}
                  </span>
                </p>
                {reviewingLog.notes && (
                  <p className="text-xs text-slate-600 pt-1 border-t border-slate-200">
                    {reviewingLog.notes}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="val-notes" className="block text-xs font-semibold text-slate-700">
                  Catatan Validator (Wajib diisi jika menolak / meminta revisi)
                </label>
                <textarea
                  id="val-notes"
                  rows={3}
                  maxLength={BLUEPRINT_LIMITS.productionLog.validationNotesMax}
                  value={validationNotes}
                  onChange={(e) => setValidationNotes(e.target.value)}
                  placeholder="Contoh: Disetujui, atau mohon perbaiki volume output sesuai berita acara..."
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700 focus:border-blue-700 resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setReviewingLog(null)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={processingId === reviewingLog.id}
                  onClick={() => {
                    const note = validationNotes.trim() || 'Mohon lengkapi rincian dan ajukan ulang.';
                    void handleQuickValidate(reviewingLog, 'rejected', note);
                  }}
                  className="px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50"
                >
                  Tolak / Minta Revisi
                </button>
                <button
                  type="button"
                  disabled={processingId === reviewingLog.id}
                  onClick={() =>
                    void handleQuickValidate(
                      reviewingLog,
                      'approved',
                      validationNotes.trim() || 'Tervalidasi sesuai laporan operasional',
                    )
                  }
                  className="px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors disabled:opacity-50"
                >
                  Setujui Data
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
