import React, { useMemo, useState } from 'react';
import { Calendar, CheckCircle2, Clock, FileSpreadsheet, FileText, Plus, Users } from 'lucide-react';
import { useFirebase } from '../context/FirebaseContext';
import { PRODUCTION_CATEGORIES, type ProductionLog } from '../types';
import {
  formatIndonesianDate,
  formatMonthLabel,
  getDaysInMonth,
  getTodayLocalDate,
  isWeekday,
} from '../utils/dateUtils';
import { exportToExcel, exportToPdf } from '../utils/exportUtils';

interface MonthlyDashboardProps {
  monthLogs: ProductionLog[];
  onQuickLogForDate: (dateStr: string) => void;
  onOpenValidation?: () => void;
}

export function MonthlyDashboard({
  monthLogs,
  onQuickLogForDate,
  onOpenValidation,
}: MonthlyDashboardProps) {
  const { user, workers, targets, selectedMonth, isAdmin, loadingData } = useFirebase();
  const [hoveredDay, setHoveredDay] = useState<string | null>(null);

  const today = getTodayLocalDate();
  const target = targets[selectedMonth] ?? null;
  const days = useMemo(() => getDaysInMonth(selectedMonth), [selectedMonth]);

  const metrics = useMemo(() => {
    let approvedQty = 0;
    let pendingQty = 0;
    let rejectedQty = 0;
    let approvedCount = 0;
    let pendingCount = 0;
    let rejectedCount = 0;
    const activeDates = new Set<string>();
    const todayWorkers = new Set<string>();

    for (const log of monthLogs) {
      activeDates.add(log.productionDate);
      if (log.productionDate === today) {
        todayWorkers.add(log.workerId);
      }
      if (log.status === 'approved') {
        approvedQty += log.quantity;
        approvedCount += 1;
      } else if (log.status === 'pending') {
        pendingQty += log.quantity;
        pendingCount += 1;
      } else {
        rejectedQty += log.quantity;
        rejectedCount += 1;
      }
    }

    const totalRecordedQty = approvedQty + pendingQty;
    const targetOutput = target?.targetTotalOutput ?? 0;
    const progressPct =
      targetOutput > 0 ? Math.min(100, (approvedQty / targetOutput) * 100) : 0;
    const workingDaysTarget = target?.workingDaysTarget ?? days.filter(isWeekday).length;

    return {
      approvedQty,
      pendingQty,
      rejectedQty,
      totalRecordedQty,
      approvedCount,
      pendingCount,
      rejectedCount,
      activeDatesCount: activeDates.size,
      workingDaysTarget,
      todayWorkersCount: todayWorkers.size,
      targetOutput,
      progressPct,
    };
  }, [monthLogs, target, days, today]);

  const dailySeries = useMemo(() => {
    const map = new Map<
      string,
      { approved: number; pending: number; rejected: number; entries: number; myEntries: number }
    >();
    for (const d of days) {
      map.set(d, { approved: 0, pending: 0, rejected: 0, entries: 0, myEntries: 0 });
    }
    for (const log of monthLogs) {
      const bucket = map.get(log.productionDate);
      if (!bucket) continue;
      bucket.entries += 1;
      if (log.workerId === user?.uid) bucket.myEntries += 1;
      if (log.status === 'approved') bucket.approved += log.quantity;
      else if (log.status === 'pending') bucket.pending += log.quantity;
      else bucket.rejected += log.quantity;
    }

    let maxDaily = 10;
    for (const item of map.values()) {
      const total = item.approved + item.pending;
      if (total > maxDaily) maxDaily = total;
    }

    const expectedDailyPace =
      target && target.workingDaysTarget > 0
        ? target.targetTotalOutput / target.workingDaysTarget
        : 0;
    if (expectedDailyPace > maxDaily) maxDaily = expectedDailyPace;

    return { map, maxDaily, expectedDailyPace };
  }, [days, monthLogs, target, user?.uid]);

  const categoryBreakdown = useMemo(() => {
    const sums = new Map<string, { approved: number; pending: number; count: number }>();
    for (const cat of PRODUCTION_CATEGORIES) {
      sums.set(cat, { approved: 0, pending: 0, count: 0 });
    }
    for (const log of monthLogs) {
      const cur = sums.get(log.category) ?? { approved: 0, pending: 0, count: 0 };
      cur.count += 1;
      if (log.status === 'approved') cur.approved += log.quantity;
      else if (log.status === 'pending') cur.pending += log.quantity;
      sums.set(log.category, cur);
    }
    const items = Array.from(sums.entries()).map(([category, val]) => ({
      category,
      ...val,
      total: val.approved + val.pending,
    }));
    items.sort((a, b) => b.total - a.total);
    const maxCat = Math.max(1, ...items.map((i) => i.total));
    return { items, maxCat };
  }, [monthLogs]);

  const workerSummaries = useMemo(() => {
    const map = new Map<
      string,
      {
        uid: string;
        name: string;
        unit: string;
        entries: number;
        approvedQty: number;
        pendingQty: number;
        activeDays: Set<string>;
        loggedToday: boolean;
      }
    >();

    for (const w of workers) {
      map.set(w.uid, {
        uid: w.uid,
        name: w.displayName,
        unit: w.unitKerja,
        entries: 0,
        approvedQty: 0,
        pendingQty: 0,
        activeDays: new Set<string>(),
        loggedToday: false,
      });
    }

    for (const log of monthLogs) {
      const cur = map.get(log.workerId) ?? {
        uid: log.workerId,
        name: log.workerName,
        unit: log.unitKerja,
        entries: 0,
        approvedQty: 0,
        pendingQty: 0,
        activeDays: new Set<string>(),
        loggedToday: false,
      };
      cur.entries += 1;
      cur.activeDays.add(log.productionDate);
      if (log.productionDate === today) cur.loggedToday = true;
      if (log.status === 'approved') cur.approvedQty += log.quantity;
      else if (log.status === 'pending') cur.pendingQty += log.quantity;
      map.set(log.workerId, cur);
    }

    return Array.from(map.values()).sort(
      (a, b) => b.approvedQty + b.pendingQty - (a.approvedQty + a.pendingQty),
    );
  }, [workers, monthLogs, today]);

  const hoveredInfo = hoveredDay ? dailySeries.map.get(hoveredDay) : null;

  if (loadingData && monthLogs.length === 0) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-28 bg-white border border-slate-200 rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="h-72 bg-white border border-slate-200 rounded-xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 4-Column KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-slate-500">
              Output Disetujui
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-2xl font-bold text-slate-900 tabular-nums">
                {metrics.approvedQty.toLocaleString('id-ID')}
              </span>
              {metrics.targetOutput > 0 && (
                <span className="font-mono text-xs text-slate-500 tabular-nums">
                  / {metrics.targetOutput.toLocaleString('id-ID')} target
                </span>
              )}
            </div>
            {metrics.targetOutput > 0 ? (
              <div className="mt-2.5 space-y-1">
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-700 rounded-full transition-all"
                    style={{ width: `${metrics.progressPct}%` }}
                  />
                </div>
                <p className="font-mono text-xs text-slate-600 tabular-nums">
                  {metrics.progressPct.toFixed(1)}% tercapai
                </p>
              </div>
            ) : (
              <p className="mt-1.5 text-xs text-slate-500">
                +{metrics.pendingQty.toLocaleString('id-ID')} menunggu validasi
              </p>
            )}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-slate-500">
              Antrean & Status Validasi
            </span>
            <Clock className="w-4 h-4 text-amber-600 shrink-0" />
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-2xl font-bold text-slate-900 tabular-nums">
                {monthLogs.length}
              </span>
              <span className="text-xs text-slate-500">catatan bulan ini</span>
            </div>
            <div className="mt-2 flex items-center gap-2 text-xs text-slate-600 tabular-nums flex-wrap">
              <span className="text-emerald-700 font-medium">{metrics.approvedCount} disetujui</span>
              <span aria-hidden="true">·</span>
              <span className="text-amber-700 font-medium">{metrics.pendingCount} menunggu</span>
              {metrics.rejectedCount > 0 && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="text-red-700 font-medium">{metrics.rejectedCount} revisi</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-slate-500">
              Kepatuhan Hari Produksi
            </span>
            <Calendar className="w-4 h-4 text-blue-700 shrink-0" />
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-2xl font-bold text-slate-900 tabular-nums">
                {metrics.activeDatesCount}
              </span>
              <span className="font-mono text-xs text-slate-500 tabular-nums">
                / {metrics.workingDaysTarget} hari kerja
              </span>
            </div>
            <p className="mt-2 text-xs text-slate-600">
              Hari dengan input kinerja tercatat pada {formatMonthLabel(selectedMonth)}
            </p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-slate-500">
              Partisipasi Tim Hari Ini
            </span>
            <Users className="w-4 h-4 text-slate-600 shrink-0" />
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-2xl font-bold text-slate-900 tabular-nums">
                {metrics.todayWorkersCount}
              </span>
              <span className="font-mono text-xs text-slate-500 tabular-nums">
                / {Math.max(workers.length, metrics.todayWorkersCount)} pekerja
              </span>
            </div>
            <p className="mt-2 text-xs text-slate-600">
              Pekerja sudah input untuk {formatIndonesianDate(today)}
            </p>
          </div>
        </div>
      </div>

      {/* Main Chart + Quick Export Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-base font-semibold text-slate-900">
              Progres Produksi Harian — {formatMonthLabel(selectedMonth)}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Perbandingan output disetujui dan menunggu validasi per tanggal produksi
              {dailySeries.expectedDailyPace > 0 && (
                <>
                  {' · '}
                  <span className="font-mono tabular-nums">
                    Target harian: {dailySeries.expectedDailyPace.toFixed(1)} unit/hari
                  </span>
                </>
              )}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {isAdmin && metrics.pendingCount > 0 && onOpenValidation && (
              <button
                type="button"
                onClick={onOpenValidation}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-200 hover:bg-amber-100 rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                Tinjau {metrics.pendingCount} Data Masuk
              </button>
            )}
            <button
              type="button"
              onClick={() =>
                exportToExcel({
                  logs: monthLogs,
                  monthKey: selectedMonth,
                  target,
                  scopeLabel: 'Semua Seksi',
                })
              }
              disabled={monthLogs.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap shrink-0 disabled:opacity-50"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
              Ekspor Excel
            </button>
            <button
              type="button"
              onClick={() =>
                exportToPdf({
                  logs: monthLogs,
                  monthKey: selectedMonth,
                  target,
                  scopeLabel: 'Semua Seksi',
                })
              }
              disabled={monthLogs.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap shrink-0 disabled:opacity-50"
            >
              <FileText className="w-3.5 h-3.5 text-red-700" />
              Ekspor PDF
            </button>
          </div>
        </div>

        {/* Interactive Daily Bar Chart */}
        <div className="relative">
          <div className="h-56 flex items-end gap-1 pt-6 pb-2 border-b border-slate-200 relative">
            {dailySeries.expectedDailyPace > 0 && (
              <div
                className="absolute left-0 right-0 border-t border-dashed border-slate-400 pointer-events-none z-10"
                style={{
                  bottom: `${Math.min(100, (dailySeries.expectedDailyPace / dailySeries.maxDaily) * 100)}%`,
                }}
              />
            )}

            {days.map((dayStr) => {
              const item = dailySeries.map.get(dayStr)!;
              const approvedPct = (item.approved / dailySeries.maxDaily) * 100;
              const pendingPct = (item.pending / dailySeries.maxDaily) * 100;
              const dayNum = dayStr.slice(8, 10);
              const isToday = dayStr === today;

              return (
                <button
                  key={dayStr}
                  type="button"
                  onMouseEnter={() => setHoveredDay(dayStr)}
                  onMouseLeave={() => setHoveredDay(null)}
                  onFocus={() => setHoveredDay(dayStr)}
                  onClick={() => onQuickLogForDate(dayStr)}
                  aria-label={`Tanggal ${formatIndonesianDate(dayStr)}: ${item.approved} disetujui, ${item.pending} menunggu`}
                  className={`flex-1 h-full flex flex-col justify-end items-center group focus:outline-none rounded-t ${
                    isToday ? 'bg-blue-50/60' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="w-full max-w-[18px] flex flex-col justify-end h-full">
                    {item.pending > 0 && (
                      <div
                        className="w-full bg-amber-400 group-hover:bg-amber-500 transition-colors rounded-t-[2px]"
                        style={{ height: `${Math.max(3, pendingPct)}%` }}
                      />
                    )}
                    {item.approved > 0 && (
                      <div
                        className={`w-full bg-blue-700 group-hover:bg-blue-800 transition-colors ${
                          item.pending === 0 ? 'rounded-t-[2px]' : ''
                        }`}
                        style={{ height: `${Math.max(3, approvedPct)}%` }}
                      />
                    )}
                  </div>
                  <span
                    className={`mt-1.5 font-mono text-[10px] tabular-nums ${
                      isToday ? 'font-bold text-blue-700' : 'text-slate-400'
                    }`}
                  >
                    {Number(dayNum) % 2 === 1 || isToday ? dayNum : ''}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-600">
            <div className="flex items-center gap-4">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-blue-700 rounded-xs inline-block" />
                Disetujui Admin
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-amber-400 rounded-xs inline-block" />
                Menunggu Validasi
              </span>
              {dailySeries.expectedDailyPace > 0 && (
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-4 border-t border-dashed border-slate-500 inline-block" />
                  Target Harian Seksi
                </span>
              )}
            </div>

            <div className="font-mono text-xs text-slate-700 tabular-nums min-h-[1rem]">
              {hoveredDay && hoveredInfo ? (
                <span>
                  {formatIndonesianDate(hoveredDay)} · Disetujui: {hoveredInfo.approved} · Menunggu: {hoveredInfo.pending} ({hoveredInfo.entries} entri)
                </span>
              ) : (
                <span className="text-slate-400 font-sans">
                  Arahkan kursor atau klik tanggal untuk mencatat kinerja pada tanggal tersebut
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Category Distribution + Daily Compliance Calendar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-base font-semibold text-slate-900">
              Capaian per Kategori Layanan
            </h3>
            <span className="font-mono text-xs text-slate-500 tabular-nums">
              {monthLogs.length} entri
            </span>
          </div>

          {monthLogs.length === 0 ? (
            <div className="py-10 text-center space-y-3">
              <p className="text-sm text-slate-500">
                Belum ada catatan produksi pada {formatMonthLabel(selectedMonth)}.
              </p>
              <button
                type="button"
                onClick={() => onQuickLogForDate(today)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-700 text-white text-xs font-semibold rounded-lg hover:bg-blue-800 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Catat Entri Pertama
              </button>
            </div>
          ) : (
            <div className="space-y-3.5">
              {categoryBreakdown.items.map((item) => {
                const widthPct = (item.total / categoryBreakdown.maxCat) * 100;
                return (
                  <div key={item.category} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-800 truncate pr-2">
                        {item.category}
                      </span>
                      <span className="font-mono text-slate-600 tabular-nums shrink-0">
                        {item.total.toLocaleString('id-ID')} ({item.count} log)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-slate-800 rounded-full"
                        style={{ width: `${Math.max(item.total > 0 ? 4 : 0, widthPct)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="font-display text-base font-semibold text-slate-900">
                Kalender Kepatuhan Input Anda
              </h3>
              <p className="text-xs text-slate-500">
                Klik tanggal mana saja untuk menambah catatan produksi agar tanggal proses tidak terlupa
              </p>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {days.map((dayStr) => {
              const bucket = dailySeries.map.get(dayStr)!;
              const hasMine = bucket.myEntries > 0;
              const hasTeam = bucket.entries > 0;
              const isToday = dayStr === today;
              const weekday = isWeekday(dayStr);

              return (
                <button
                  key={dayStr}
                  type="button"
                  onClick={() => onQuickLogForDate(dayStr)}
                  className={`p-2 rounded-lg border text-left transition-colors ${
                    hasMine
                      ? 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100'
                      : hasTeam
                        ? 'bg-blue-50/50 border-blue-200 hover:bg-blue-50'
                        : weekday
                          ? 'bg-white border-slate-200 hover:bg-slate-50'
                          : 'bg-slate-50 border-slate-200/70 hover:bg-slate-100'
                  } ${isToday ? 'ring-2 ring-blue-700 ring-offset-1' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-semibold text-slate-900 tabular-nums">
                      {dayStr.slice(8, 10)}
                    </span>
                    {hasMine ? (
                      <span className="font-mono text-[10px] font-semibold text-emerald-700 tabular-nums">
                        {bucket.myEntries}
                      </span>
                    ) : null}
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1 truncate">
                    {hasMine ? 'Anda isi' : hasTeam ? `${bucket.entries} tim` : weekday ? 'Kosong' : 'Libur'}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Worker Contribution Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="font-display text-base font-semibold text-slate-900">
              Distribusi Kinerja per Pekerja — {formatMonthLabel(selectedMonth)}
            </h3>
            <p className="text-xs text-slate-500">
              Rekapitulasi real-time seluruh pekerja Seksi Pelayanan Teknis
            </p>
          </div>
          <span className="font-mono text-xs text-slate-500 tabular-nums">
            {workerSummaries.length} pekerja
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold text-slate-600">
                <th className="py-2.5 px-6">Nama Pekerja</th>
                <th className="py-2.5 px-4">Unit Kerja</th>
                <th className="py-2.5 px-4 text-right">Hari Aktif</th>
                <th className="py-2.5 px-4 text-right">Jumlah Entri</th>
                <th className="py-2.5 px-4 text-right">Output Disetujui</th>
                <th className="py-2.5 px-4 text-right">Menunggu</th>
                <th className="py-2.5 px-6 text-right">Input Hari Ini</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {workerSummaries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-sm text-slate-500">
                    Belum ada data pekerja yang tercatat.
                  </td>
                </tr>
              ) : (
                workerSummaries.map((w) => (
                  <tr key={w.uid} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-6 font-medium text-slate-900">
                      {w.name}
                      {w.uid === user?.uid && (
                        <span className="ml-2 text-xs font-normal text-blue-700">(Anda)</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-600">{w.unit}</td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-700">
                      {w.activeDays.size}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-700">
                      {w.entries}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-semibold tabular-nums text-emerald-700">
                      {w.approvedQty.toLocaleString('id-ID')}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-amber-700">
                      {w.pendingQty.toLocaleString('id-ID')}
                    </td>
                    <td className="py-3 px-6 text-right text-xs font-medium">
                      {w.loggedToday ? (
                        <span className="text-emerald-700">Sudah input</span>
                      ) : (
                        <span className="text-slate-400">Belum</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
