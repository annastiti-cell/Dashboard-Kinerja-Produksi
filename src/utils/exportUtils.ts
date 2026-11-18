import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { MonthlyTarget, ProductionLog } from '../types';
import { formatIndonesianDate, formatMonthLabel } from './dateUtils';

const STATUS_LABELS: Record<ProductionLog['status'], string> = {
  approved: 'Disetujui',
  pending: 'Menunggu Validasi',
  rejected: 'Perlu Revisi',
};

export interface ExportOptions {
  logs: ProductionLog[];
  monthKey: string;
  target: MonthlyTarget | null;
  scopeLabel: string;
}

export function exportToExcel({ logs, monthKey, target, scopeLabel }: ExportOptions): void {
  const wb = XLSX.utils.book_new();
  const periodLabel = formatMonthLabel(monthKey);

  const approvedTotal = logs
    .filter((l) => l.status === 'approved')
    .reduce((sum, l) => sum + l.quantity, 0);
  const pendingTotal = logs
    .filter((l) => l.status === 'pending')
    .reduce((sum, l) => sum + l.quantity, 0);
  const rejectedTotal = logs
    .filter((l) => l.status === 'rejected')
    .reduce((sum, l) => sum + l.quantity, 0);

  const targetTotal = target?.targetTotalOutput ?? 0;
  const pct = targetTotal > 0 ? ((approvedTotal / targetTotal) * 100).toFixed(1) : '—';

  // Aggregate by worker
  const workerMap = new Map<
    string,
    { name: string; unit: string; entries: number; approvedQty: number; pendingQty: number }
  >();
  for (const log of logs) {
    const cur = workerMap.get(log.workerId) ?? {
      name: log.workerName,
      unit: log.unitKerja,
      entries: 0,
      approvedQty: 0,
      pendingQty: 0,
    };
    cur.entries += 1;
    if (log.status === 'approved') cur.approvedQty += log.quantity;
    if (log.status === 'pending') cur.pendingQty += log.quantity;
    workerMap.set(log.workerId, cur);
  }

  const summaryRows: (string | number)[][] = [
    ['LAPORAN CAPAIAN KINERJA PRODUKSI — SEKSI PELAYANAN TEKNIS'],
    ['Periode Laporan', periodLabel],
    ['Cakupan Data', scopeLabel],
    ['Tanggal Ekspor', new Date().toLocaleString('id-ID')],
    [],
    ['RINGKASAN CAPAIAN BULANAN'],
    ['Total Output Disetujui', approvedTotal],
    ['Total Output Menunggu Validasi', pendingTotal],
    ['Total Output Perlu Revisi', rejectedTotal],
    ['Target Output Bulanan', targetTotal > 0 ? targetTotal : 'Belum diatur'],
    ['Persentase Capaian Tervalidasi (%)', pct],
    ['Jumlah Catatan Aktivitas', logs.length],
    [],
    ['RINGKASAN PER PEKERJA'],
    ['Nama Pekerja', 'Unit Kerja', 'Jumlah Entri', 'Output Disetujui', 'Output Menunggu'],
    ...Array.from(workerMap.values())
      .sort((a, b) => b.approvedQty - a.approvedQty)
      .map((w) => [w.name, w.unit, w.entries, w.approvedQty, w.pendingQty]),
  ];

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryRows);
  summarySheet['!cols'] = [
    { wch: 32 },
    { wch: 24 },
    { wch: 16 },
    { wch: 18 },
    { wch: 18 },
  ];
  XLSX.utils.book_append_sheet(wb, summarySheet, 'Ringkasan Bulanan');

  // Detail Sheet
  const detailHeader = [
    'No',
    'Tanggal Produksi',
    'Nama Pekerja',
    'Unit Kerja',
    'Aktivitas / Pekerjaan',
    'Kategori Layanan',
    'Jumlah Output',
    'Satuan',
    'Status Validasi',
    'Validator',
    'Produk atau Varian',
    'Catatan Validasi',
  ];

  const sortedLogs = [...logs].sort((a, b) =>
    a.productionDate.localeCompare(b.productionDate),
  );

  const detailRows = sortedLogs.map((log, idx) => [
    idx + 1,
    log.productionDate,
    log.workerName,
    log.unitKerja,
    log.activityTitle,
    log.category,
    log.quantity,
    log.unitMeasure,
    STATUS_LABELS[log.status],
    log.validatedByName ?? '—',
    log.notes || '—',
    log.validationNotes || '—',
  ]);

  const detailSheet = XLSX.utils.aoa_to_sheet([detailHeader, ...detailRows]);
  detailSheet['!cols'] = [
    { wch: 5 },
    { wch: 16 },
    { wch: 22 },
    { wch: 20 },
    { wch: 34 },
    { wch: 24 },
    { wch: 14 },
    { wch: 12 },
    { wch: 18 },
    { wch: 20 },
    { wch: 30 },
    { wch: 28 },
  ];
  XLSX.utils.book_append_sheet(wb, detailSheet, 'Detail Kinerja');

  const safeScope = scopeLabel.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  XLSX.writeFile(wb, `kinerja-produksi-${monthKey}-${safeScope}.xlsx`);
}

export function exportToPdf({ logs, monthKey, target, scopeLabel }: ExportOptions): void {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const periodLabel = formatMonthLabel(monthKey);

  const approvedTotal = logs
    .filter((l) => l.status === 'approved')
    .reduce((sum, l) => sum + l.quantity, 0);
  const pendingCount = logs.filter((l) => l.status === 'pending').length;
  const approvedCount = logs.filter((l) => l.status === 'approved').length;
  const targetTotal = target?.targetTotalOutput ?? 0;
  const pct = targetTotal > 0 ? `${((approvedTotal / targetTotal) * 100).toFixed(1)}%` : '—';

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text('LAPORAN KINERJA PRODUKSI BULANAN', 14, 16);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105);
  doc.text(
    `Seksi Pelayanan Teknis  |  Periode: ${periodLabel}  |  Cakupan: ${scopeLabel}`,
    14,
    22,
  );
  doc.text(
    `Dicetak: ${new Date().toLocaleString('id-ID')}`,
    14,
    27,
  );

  // Summary strip
  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, 31, 269, 14, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text(`Output Disetujui: ${approvedTotal.toLocaleString('id-ID')}`, 18, 39);
  doc.text(
    `Target Bulanan: ${targetTotal > 0 ? targetTotal.toLocaleString('id-ID') : 'Belum diatur'}`,
    82,
    39,
  );
  doc.text(`Capaian: ${pct}`, 148, 39);
  doc.text(`Entri Disetujui: ${approvedCount} / ${logs.length}`, 195, 39);
  doc.text(`Menunggu Validasi: ${pendingCount}`, 243, 39);

  const sortedLogs = [...logs].sort((a, b) =>
    a.productionDate.localeCompare(b.productionDate),
  );

  autoTable(doc, {
    startY: 50,
    head: [
      [
        'No',
        'Tanggal',
        'Pekerja',
        'Unit Kerja',
        'Aktivitas Produksi',
        'Kategori',
        'Output',
        'Status',
        'Validator',
      ],
    ],
    body: sortedLogs.map((log, idx) => [
      String(idx + 1),
      formatIndonesianDate(log.productionDate),
      log.workerName,
      log.unitKerja,
      log.activityTitle,
      log.category,
      `${log.quantity} ${log.unitMeasure}`,
      STATUS_LABELS[log.status],
      log.validatedByName ?? '—',
    ]),
    styles: {
      font: 'helvetica',
      fontSize: 8.5,
      cellPadding: 2.5,
      textColor: [15, 23, 42],
      lineColor: [226, 232, 240],
      lineWidth: 0.2,
    },
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 9, halign: 'center' },
      1: { cellWidth: 25 },
      2: { cellWidth: 32 },
      3: { cellWidth: 28 },
      4: { cellWidth: 62 },
      5: { cellWidth: 36 },
      6: { cellWidth: 22, halign: 'right' },
      7: { cellWidth: 27 },
      8: { cellWidth: 28 },
    },
  });

  const safeScope = scopeLabel.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  doc.save(`laporan-kinerja-${monthKey}-${safeScope}.pdf`);
}
