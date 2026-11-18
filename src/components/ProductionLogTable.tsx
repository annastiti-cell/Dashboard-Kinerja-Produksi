import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  Clock,
  Edit3,
  FileSpreadsheet,
  FileText,
  Lock,
  Plus,
  Search,
  Trash2,
  XCircle,
} from 'lucide-react';
import { useFirebase } from '../context/FirebaseContext';
import type { LogStatus, ProductionLog } from '../types';
import { formatIndonesianDate, formatMonthLabel } from '../utils/dateUtils';
import { exportToExcel, exportToPdf } from '../utils/exportUtils';

interface ProductionLogTableProps {
  monthLogs: ProductionLog[];
  onAddLog: () => void;
  onEditLog: (log: ProductionLog) => void;
}

export function ProductionLogTable({
  monthLogs,
  onAddLog,
  onEditLog,
}: ProductionLogTableProps) {
  const { user, isAdmin, targets, selectedMonth, deleteProductionLog } = useFirebase();
  const [scope, setScope] = useState<'all' | 'mine'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | LogStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filteredLogs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return monthLogs.filter((log) => {
      if (scope === 'mine' && log.workerId !== user?.uid) return false;
      if (statusFilter !== 'all' && log.status !== statusFilter) return false;
      if (q) {
        const hay = `${log.activityTitle} ${log.workerName} ${log.category} ${log.unitKerja} ${log.notes}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [monthLogs, scope, statusFilter, searchQuery, user?.uid]);

  const handleDelete = async (log: ProductionLog) => {
    if (deletingId) return;
    setDeletingId(log.id);
    try {
      await deleteProductionLog(log.id);
    } finally {
      setDeletingId(null);
    }
  };

  const target = targets[selectedMonth] ?? null;
  const scopeLabel =
    scope === 'mine' ? 'Data Pribadi' : statusFilter === 'approved' ? 'Tervalidasi Seksi' : 'Semua Seksi';

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      {/* Toolbar */}
      <div className="p-5 border-b border-slate-200 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-base font-semibold text-slate-900">
              Catatan Kinerja Produksi — {formatMonthLabel(selectedMonth)}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Menampilkan {filteredLogs.length} dari {monthLogs.length} catatan di bulan terpilih
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() =>
                exportToExcel({
                  logs: filteredLogs,
                  monthKey: selectedMonth,
                  target,
                  scopeLabel,
                })
              }
              disabled={filteredLogs.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap shrink-0 disabled:opacity-50"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
              Ekspor Excel
            </button>
            <button
              type="button"
              onClick={() =>
                exportToPdf({
                  logs: filteredLogs,
                  monthKey: selectedMonth,
                  target,
                  scopeLabel,
                })
              }
              disabled={filteredLogs.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap shrink-0 disabled:opacity-50"
            >
              <FileText className="w-3.5 h-3.5 text-red-700" />
              Ekspor PDF
            </button>
            <button
              type="button"
              onClick={onAddLog}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              Catat Kinerja
            </button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
              <button
                type="button"
                onClick={() => setScope('all')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  scope === 'all'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Semua Pekerja
              </button>
              <button
                type="button"
                onClick={() => setScope('mine')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  scope === 'mine'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Catatan Saya
              </button>
            </div>

            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
              {(
                [
                  { id: 'all', label: 'Semua' },
                  { id: 'pending', label: 'Menunggu' },
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
          </div>

          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari aktivitas, pekerja, kategori..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700 focus:border-blue-700"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold text-slate-600">
              <th className="py-2.5 px-5 whitespace-nowrap">Tanggal</th>
              <th className="py-2.5 px-4">Pekerja</th>
              <th className="py-2.5 px-4">Aktivitas & Kategori</th>
              <th className="py-2.5 px-4 text-right whitespace-nowrap">Output</th>
              <th className="py-2.5 px-4 whitespace-nowrap">Status Validasi</th>
              <th className="py-2.5 px-5 text-right whitespace-nowrap">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 px-6 text-center space-y-3">
                  <p className="text-sm text-slate-500">
                    Tidak ada catatan kinerja yang sesuai dengan filter saat ini.
                  </p>
                  <button
                    type="button"
                    onClick={onAddLog}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-700 text-white text-xs font-semibold rounded-lg hover:bg-blue-800 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Tambah Catatan Baru
                  </button>
                </td>
              </tr>
            ) : (
              filteredLogs.map((log) => {
                const isMine = log.workerId === user?.uid;
                const canModify = isAdmin || (isMine && log.status !== 'approved');
                return (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition-colors align-top">
                    <td className="py-3.5 px-5 font-mono text-xs text-slate-700 whitespace-nowrap tabular-nums">
                      {formatIndonesianDate(log.productionDate)}
                    </td>
                    <td className="py-3.5 px-4 min-w-[160px]">
                      <p className="font-medium text-slate-900 text-sm">{log.workerName}</p>
                      <p className="text-xs text-slate-500">{log.unitKerja}</p>
                    </td>
                    <td className="py-3.5 px-4 min-w-[260px]">
                      <p className="font-medium text-slate-900 text-sm">{log.activityTitle}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {log.category}
                        {log.notes ? ` · ${log.notes}` : ''}
                      </p>
                      {log.validationNotes && (
                        <p
                          className={`text-xs mt-1 ${
                            log.status === 'rejected' ? 'text-red-700 font-medium' : 'text-slate-600'
                          }`}
                        >
                          Catatan Validator: {log.validationNotes}
                        </p>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-sm font-semibold text-slate-900 whitespace-nowrap tabular-nums">
                      {log.quantity.toLocaleString('id-ID')} {log.unitMeasure}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {log.status === 'approved' && (
                        <div className="space-y-0.5">
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                            Disetujui
                          </span>
                          {log.validatedByName && (
                            <p className="text-[11px] text-slate-500">
                              oleh {log.validatedByName}
                            </p>
                          )}
                        </div>
                      )}
                      {log.status === 'pending' && (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700">
                          <Clock className="w-3.5 h-3.5 shrink-0" />
                          Menunggu Validasi
                        </span>
                      )}
                      {log.status === 'rejected' && (
                        <div className="space-y-0.5">
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-700">
                            <XCircle className="w-3.5 h-3.5 shrink-0" />
                            Perlu Revisi
                          </span>
                          {log.validatedByName && (
                            <p className="text-[11px] text-slate-500">
                              oleh {log.validatedByName}
                            </p>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-5 text-right whitespace-nowrap">
                      {canModify ? (
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => onEditLog(log)}
                            title={
                              isAdmin
                                ? 'Ubah data kinerja'
                                : log.status === 'rejected'
                                  ? 'Revisi & ajukan ulang'
                                  : 'Ubah catatan'
                            }
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            {!isAdmin && log.status === 'rejected' ? 'Revisi' : 'Ubah'}
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDelete(log)}
                            disabled={deletingId === log.id}
                            title="Hapus catatan"
                            className="inline-flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-md transition-colors disabled:opacity-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : log.status === 'approved' ? (
                        <span
                          className="inline-flex items-center gap-1 text-xs text-slate-400"
                          title="Sudah divalidasi dan dikunci"
                        >
                          <Lock className="w-3.5 h-3.5" />
                          Terkunci
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
