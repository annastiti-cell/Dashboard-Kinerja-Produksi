import { SECTION_CODE, type LogStatus, type ProductionCategory } from '../types';

export interface SeedWorker {
  uid: string;
  displayName: string;
  unitKerja: string;
  jabatan: string;
}

export interface SeedProductionLog {
  id: string;
  workerId: string;
  workerName: string;
  unitKerja: string;
  productionDate: string;
  activityTitle: string;
  category: ProductionCategory;
  quantity: number;
  unitMeasure: string;
  notes: string;
  status: LogStatus;
}

export const INITIAL_WORKERS: SeedWorker[] = [
  { uid: 'op-amanu', displayName: 'Amanu', unitKerja: 'Seksi Pelayanan Teknis', jabatan: 'Operator Produksi' },
  { uid: 'op-andre', displayName: 'Andre', unitKerja: 'Seksi Pelayanan Teknis', jabatan: 'Operator Produksi' },
  { uid: 'op-suharmoko', displayName: 'Suharmoko', unitKerja: 'Seksi Pelayanan Teknis', jabatan: 'Operator Produksi' },
  { uid: 'op-mustono', displayName: 'Mustono', unitKerja: 'Seksi Pelayanan Teknis', jabatan: 'Operator Produksi' },
  { uid: 'op-andri', displayName: 'Andri', unitKerja: 'Seksi Pelayanan Teknis', jabatan: 'Operator Produksi' },
  { uid: 'op-toha', displayName: 'Toha', unitKerja: 'Seksi Pelayanan Teknis', jabatan: 'Operator Produksi' },
  { uid: 'op-falik', displayName: 'Falik', unitKerja: 'Seksi Pelayanan Teknis', jabatan: 'Operator Produksi' },
  { uid: 'op-kurniawan', displayName: 'Kurniawan', unitKerja: 'Seksi Pelayanan Teknis', jabatan: 'Operator Produksi' },
  {
    uid: 'vendor-percetakan-offset',
    displayName: 'Vendor Percetakan Offset',
    unitKerja: 'Vendor Eksternal Offset',
    jabatan: 'Vendor Percetakan Offset',
  },
];

export const DEPRECATED_SEED_WORKER_IDS = [
  'op-tanjung',
  'op-toha-falik',
  'op-toha-moko',
  'op-amanutono',
  'op-toha-andri',
  'op-falik-andri',
];

const WORKER_MAP = new Map(INITIAL_WORKERS.map((w) => [w.displayName, w]));

function row(
  idx: number,
  orderNo: number,
  merek: string,
  bahan: string,
  productionDate: string,
  mesin: string,
  category: ProductionCategory,
  operatorName: string,
  quantity: number,
  unitMeasure: string,
  notes: string,
  status: LogStatus = 'approved',
): SeedProductionLog {
  const worker = WORKER_MAP.get(operatorName);
  if (!worker) {
    throw new Error(`Unknown seed operator: ${operatorName}`);
  }
  return {
    id: `okt26-row-${String(idx).padStart(3, '0')}`,
    workerId: worker.uid,
    workerName: worker.displayName,
    unitKerja: worker.unitKerja,
    productionDate,
    activityTitle: `#${orderNo} ${merek} — ${mesin} (${bahan})`.slice(0, 140),
    category,
    quantity,
    unitMeasure,
    notes: notes.slice(0, 600),
    status,
  };
}

export const INITIAL_OKTOBER_LOGS: SeedProductionLog[] = [
  // Order 1: OMAH KERIPIK / SELERAKU
  row(1, 1, 'OMAH KERIPIK', 'PP MIKA', '2026-09-25', 'CUT PLASTIK', 'Mesin Paper Cutting', 'Amanu', 317, 'Pcs', 'OMAH KERIPIK · Order 01/08/26 (300) · Bahan: 317 · Est. selesai: 09/10/26 · KALKIR FIX TGL 23/9'),
  row(2, 1, 'OMAH KERIPIK (SELERAKU)', 'PP MIKA', '2026-10-02', 'SABLON', 'Sablon', 'Amanu', 317, 'Pcs', 'Varian: SELERAKU · Order 01/08/26 · Bahan: 317 · Hasil: 317'),
  row(3, 1, 'OMAH KERIPIK (SELERAKU)', 'PP MIKA', '2026-10-05', 'BAND SEALER', 'Mesin Band Sealer', 'Andre', 317, 'Pcs', 'Varian: SELERAKU · Order 01/08/26 · Baik: 317 (Selesai)'),

  // Order 2: EONNI
  row(4, 2, 'EONNI', 'IVORY', '2026-09-03', 'PP CUTTING', 'Mesin Paper Cutting', 'Suharmoko', 1044, 'Pcs', 'EONNI (IVORY) · Order 04/08/26 (1,000) · Est. selesai: 01/09/26 · ADA REVISI DESAIN'),
  row(5, 2, 'EONNI', 'MIKA', '2026-09-01', 'CUTTING MIKA', 'Mesin Paper Cutting', 'Mustono', 1000, 'Pcs', 'EONNI (MIKA) · Order 04/08/26 · Bahan: 1,000 · Hasil: 1,000'),
  row(6, 2, 'EONNI', 'MIKA', '2026-09-03', 'SABLON', 'Sablon', 'Amanu', 500, 'Pcs', 'EONNI (MIKA) · Order 04/08/26 · Bahan: 500 · Hasil: 500'),
  row(7, 2, 'EONNI', 'MIKA', '2026-09-08', 'PLONG', 'Mesin Plong', 'Mustono', 500, 'Pcs', 'EONNI (MIKA) · Order 04/08/26 · DIAMBIL 500 DULU'),
  row(8, 2, 'EONNI', 'MIKA', '2026-10-06', 'PLONG', 'Mesin Plong', 'Andri', 517, 'Pcs', 'EONNI (MIKA) · Order 04/08/26 · Baik: 517 (Selesai)'),

  // Order 3: HIJJAH
  row(9, 3, 'HIJJAH', 'PP 0,8X17', '2026-09-29', 'CUTTING', 'Mesin Paper Cutting', 'Andri', 280, 'Pcs', 'HIJJAH (PP 0,8X17) · Order 19/08/26 (300) · Est. selesai: 16/09/26 · MASTER CETAK RUSAK'),
  row(10, 3, 'HIJJAH', 'PP 0,8X17', '2026-10-05', 'SABLON', 'Sablon', 'Amanu', 280, 'Pcs', 'HIJJAH (PP 0,8X17) · Order 19/08/26 · Bahan: 280 · Hasil: 280'),
  row(11, 3, 'HIJJAH', 'PP 0,8X17', '2026-10-06', 'BAND SEALER', 'Mesin Band Sealer', 'Andri', 280, 'Pcs', 'HIJJAH (PP 0,8X17) · Order 19/08/26 · Baik: 280 (Selesai)'),

  // Order 4: BAFIRA
  row(12, 4, 'BAFIRA', 'PE', '2026-08-20', 'CUTTING PLSTK', 'Mesin Paper Cutting', 'Mustono', 220, 'Pcs', 'BAFIRA (PE) · Order 20/08/26 (220) · Est. selesai: 10/09/26 · 150, 200, 450 = 800'),
  row(13, 4, 'BAFIRA', 'PE', '2026-10-01', 'SABLON', 'Sablon', 'Mustono', 220, 'Pcs', 'BAFIRA (PE) · Order 20/08/26 · Bahan: 220 · Hasil: 220'),
  row(14, 4, 'BAFIRA', 'PE', '2026-10-06', 'BANDSEALER', 'Mesin Band Sealer', 'Andri', 220, 'Pcs', 'BAFIRA (PE) · Order 20/08/26 · Baik: 220 (Selesai)'),

  // Order 5: NING NINIK 3 LAMA
  row(15, 5, 'NING NINIK 3 LAMA', 'SHEET', '2026-09-17', 'SLITTER', 'Mesin Slitter', 'Suharmoko', 2000, 'Sheet', 'Varian: LAMA · Order 04/09/26 (2,000) · Est. selesai: 02/10/26 · DIAMBIL 500 DULU'),
  row(16, 5, 'NING NINIK 3 LAMA', 'SHEET', '2026-09-21', 'SABLON', 'Sablon', 'Amanu', 500, 'Sheet', 'Varian: LAMA · Order 04/09/26 · Tahap 1 · Hasil: 500'),
  row(17, 5, 'NING NINIK 3 LAMA', 'SHEET', '2026-09-22', 'PLONG', 'Mesin Plong', 'Mustono', 500, 'Sheet', 'Varian: LAMA · Order 04/09/26 · Tahap 1 · Hasil: 500'),
  row(18, 5, 'NING NINIK 3 LAMA', 'SHEET', '2026-09-25', 'FINISHING', 'Finishing', 'Mustono', 500, 'Sheet', 'Varian: LAMA · Order 04/09/26 · Tahap 1 · Hasil: 500'),
  row(19, 5, 'NING NINIK 3 LAMA', 'SHEET', '2026-09-25', 'BTB', 'Mesin Board To B', 'Toha', 500, 'Sheet', 'Varian: LAMA · Operator: Toha & Falik · Order 04/09/26 · Tahap 1 · Hasil: 500'),
  row(20, 5, 'NING NINIK 3 LAMA', 'SHEET', '2026-10-06', 'SABLON', 'Sablon', 'Mustono', 596, 'Sheet', 'Varian: LAMA · Order 04/09/26 · Tahap 2 · Hasil: 596'),
  row(21, 5, 'NING NINIK 3 LAMA', 'SHEET', '2026-10-09', 'PLONG', 'Mesin Plong', 'Mustono', 596, 'Sheet', 'Varian: LAMA · Order 04/09/26 · Tahap 2 · Hasil: 596'),
  row(22, 5, 'NING NINIK 3 LAMA', 'SHEET', '2026-10-16', 'FINISHING', 'Finishing', 'Falik', 596, 'Sheet', 'Varian: LAMA · Operator: Toha & Falik · Order 04/09/26 · Tahap 2 · Hasil: 596'),
  row(23, 5, 'NING NINIK 3 LAMA', 'SHEET', '2026-10-16', 'BTB', 'Mesin Board To B', 'Toha', 596, 'Sheet', 'Varian: LAMA · Operator: Toha & Falik · Order 04/09/26 · Baik: 596 (Selesai)'),

  // Order 6: NING ITA 12
  row(24, 6, 'NING ITA 12', 'SHEET', '2026-09-24', 'SLITTER', 'Mesin Slitter', 'Suharmoko', 104, 'Sheet', 'NING ITA 12 · Order 07/09/26 (100) · Est. selesai: 05/10/26 · ADA REVISI DESAIN'),
  row(25, 6, 'NING ITA 12', 'SHEET', '2026-10-23', 'SABLON', 'Sablon', 'Amanu', 104, 'Sheet', 'NING ITA 12 · Order 07/09/26 · Hasil: 104'),
  row(26, 6, 'NING ITA 12', 'SHEET', '2026-10-23', 'SLOTTER', 'Mesin Slitter', 'Amanu', 104, 'Sheet', 'NING ITA 12 · Order 07/09/26 · Hasil: 104'),
  row(27, 6, 'NING ITA 12', 'SHEET', '2026-10-28', 'BTB', 'Mesin Board To B', 'Toha', 104, 'Sheet', 'NING ITA 12 · Operator: Toha & Falik · Order 07/09/26 · Baik: 104 (Selesai)'),

  // Order 7: DEWA DEWI
  row(28, 7, 'DEWA DEWI', 'DPLX310', '2026-09-25', 'PP CUTTING', 'Mesin Paper Cutting', 'Kurniawan', 510, 'Lembar', 'DEWA DEWI · Order 25/09/26 (1,000) · Bahan: 510 · Est. selesai: 23/10/26'),
  row(29, 7, 'DEWA DEWI', 'DPLX310', '2026-09-25', 'OFFSET', 'Offset', 'Vendor Percetakan Offset', 968, 'Pcs', 'DEWA DEWI · Order 25/09/26 · Bahan: 484 · Rusak: 52 · Hasil: 968'),
  row(30, 7, 'DEWA DEWI', 'DPLX310', '2026-10-05', 'PLG WINDOW', 'Mesin Plong', 'Kurniawan', 968, 'Pcs', 'DEWA DEWI · Order 25/09/26 · Hasil: 968'),
  row(31, 7, 'DEWA DEWI', 'DPLX310', '2026-10-05', 'LAMINASI', 'Mesin Laminasi', 'Toha', 968, 'Pcs', 'DEWA DEWI · Operator: Toha & Suharmoko · Order 25/09/26 · Hasil: 968'),
  row(32, 7, 'DEWA DEWI', 'DPLX310', '2026-10-05', 'PLONG', 'Mesin Plong', 'Andri', 966, 'Pcs', 'DEWA DEWI · Order 25/09/26 · Bahan: 968 · Rusak: 2 · Baik: 966 (Selesai)'),

  // Order 8: CREFOW
  row(33, 8, 'CREFOW', 'DPLX250 / SHEET', '2026-10-01', 'PP CUTTING', 'Mesin Paper Cutting', 'Suharmoko', 215, 'Sheet', 'CREFOW · Order 21/09/26 (200) · Est. selesai: 19/10/26'),
  row(34, 8, 'CREFOW', 'SHEET', '2026-10-09', 'SLITTER', 'Mesin Slitter', 'Suharmoko', 215, 'Sheet', 'CREFOW · Order 21/09/26 · Hasil: 215'),
  row(35, 8, 'CREFOW', 'SHEET', '2026-10-12', 'SABLON', 'Sablon', 'Amanu', 215, 'Sheet', 'CREFOW · Operator: Amanu & Mustono · Order 21/09/26 · Hasil: 215'),
  row(36, 8, 'CREFOW', 'SHEET', '2026-10-22', 'BTB', 'Mesin Board To B', 'Toha', 215, 'Sheet', 'CREFOW · Operator: Toha & Andri · Order 21/09/26 · Hasil: 215'),
  row(37, 8, 'CREFOW', 'SHEET', '2026-10-24', 'PLONG', 'Mesin Plong', 'Suharmoko', 215, 'Sheet', 'CREFOW · Order 21/09/26 · Baik: 215 (Selesai)'),

  // Order 9: DEVA DIVI
  row(38, 9, 'DEVA DIVI', 'IVORY300', '2026-10-01', 'PP CUTTING', 'Mesin Paper Cutting', 'Kurniawan', 110, 'Pcs', 'DEVA DIVI · Order 21/09/26 (100) · Est. selesai: 19/10/26 · Menunggu Sablon, Plong Wdw, Laminasi, Plong, BTB', 'pending'),

  // Order 10: D REZEL
  row(39, 10, 'D REZEL', 'IVORY300', '2026-10-02', 'PP CUTTING', 'Mesin Paper Cutting', 'Kurniawan', 1050, 'Pcs', 'D REZEL · Order 28/09/26 (1,000) · Est. selesai: 26/10/26'),
  row(40, 10, 'D REZEL', 'IVORY300', '2026-10-02', 'OFFSET', 'Offset', 'Vendor Percetakan Offset', 1034, 'Pcs', 'D REZEL · Order 28/09/26 · Bahan: 1,050 · Rusak: 16 · Hasil: 1,034'),
  row(41, 10, 'D REZEL', 'IVORY300', '2026-10-08', 'LAMINASI', 'Mesin Laminasi', 'Falik', 1034, 'Pcs', 'D REZEL · Operator: Toha & Falik · Order 28/09/26 · Hasil: 1,034'),
  row(42, 10, 'D REZEL', 'IVORY300', '2026-10-09', 'PLG WINDOW', 'Mesin Plong', 'Kurniawan', 1034, 'Pcs', 'D REZEL · Order 28/09/26 · Hasil: 1,034'),
  row(43, 10, 'D REZEL', 'IVORY300', '2026-10-10', 'LAMINASI', 'Mesin Laminasi', 'Falik', 1034, 'Pcs', 'D REZEL · Operator: Toha & Falik · Order 28/09/26 · Hasil: 1,034'),
  row(44, 10, 'D REZEL', 'IVORY300', '2026-10-12', 'PLONG', 'Mesin Plong', 'Andri', 1027, 'Pcs', 'D REZEL · Order 28/09/26 · Bahan: 1,034 · Rusak: 7 · Baik: 1,027 (Selesai)'),

  // Order 11: BU PAH SOTO
  row(45, 11, 'BU PAH SOTO', 'IVORY300', '2026-10-02', 'PP CUTTING', 'Mesin Paper Cutting', 'Kurniawan', 116, 'Pcs', 'Varian: SOTO · Order 30/09/26 (100) · Est. selesai: 28/10/26'),
  row(46, 11, 'BU PAH SOTO', 'IVORY300', '2026-10-07', 'SABLON', 'Sablon', 'Amanu', 115, 'Pcs', 'Varian: SOTO · Order 30/09/26 · Bahan: 116 · Rusak: 1 · Hasil: 115'),
  row(47, 11, 'BU PAH SOTO', 'IVORY300', '2026-10-07', 'LAMINASI', 'Mesin Laminasi', 'Toha', 114, 'Pcs', 'Varian: SOTO · Operator: Toha & Andri · Order 30/09/26 · Bahan: 115 · Rusak: 1 · Hasil: 114'),
  row(48, 11, 'BU PAH SOTO', 'IVORY300', '2026-10-07', 'PLONG', 'Mesin Plong', 'Andri', 113, 'Pcs', 'Varian: SOTO · Order 30/09/26 · Bahan: 114 · Rusak: 1 · Hasil: 113'),
  row(49, 11, 'BU PAH SOTO', 'IVORY300', '2026-10-08', 'BTB', 'Mesin Board To B', 'Toha', 113, 'Pcs', 'Varian: SOTO · Operator: Toha & Falik · Order 30/09/26 · Baik: 113 (Selesai)'),

  // Order 12: BU PAH RAWON
  row(50, 12, 'BU PAH RAWON', 'IVORY300', '2026-10-02', 'PP CUTTING', 'Mesin Paper Cutting', 'Kurniawan', 110, 'Pcs', 'Varian: RAWON · Order 30/09/26 (100) · Est. selesai: 28/10/26'),
  row(51, 12, 'BU PAH RAWON', 'IVORY300', '2026-10-08', 'SABLON', 'Sablon', 'Amanu', 108, 'Pcs', 'Varian: RAWON · Order 30/09/26 · Bahan: 110 · Rusak: 2 · Hasil: 108'),
  row(52, 12, 'BU PAH RAWON', 'IVORY300', '2026-10-09', 'LAMINASI', 'Mesin Laminasi', 'Falik', 108, 'Pcs', 'Varian: RAWON · Operator: Toha & Falik · Order 30/09/26 · Hasil: 108'),
  row(53, 12, 'BU PAH RAWON', 'IVORY300', '2026-10-09', 'PLONG', 'Mesin Plong', 'Andri', 108, 'Pcs', 'Varian: RAWON · Order 30/09/26 · Hasil: 108'),
  row(54, 12, 'BU PAH RAWON', 'IVORY300', '2026-10-09', 'BTB', 'Mesin Board To B', 'Toha', 107, 'Pcs', 'Varian: RAWON · Order 30/09/26 · Bahan: 108 · Rusak: 1 · Baik: 107 (Selesai)'),

  // Order 13: CEMERLANG
  row(55, 13, 'CEMERLANG (Batch 1)', 'PP', '2026-10-01', 'SABLON', 'Sablon', 'Amanu', 471, 'Pcs', 'CEMERLANG · Batch 1 · Order 01/10/26 (471) · Est. selesai: 29/10/26 · Baik: 471 (Selesai)'),
  row(56, 13, 'CEMERLANG (Batch 2)', 'PP', '2026-10-02', 'SABLON', 'Sablon', 'Amanu', 417, 'Pcs', 'CEMERLANG · Batch 2 · Order 01/10/26 (417) · Baik: 417 (Selesai)'),

  // Order 14: DEKRANASDA PROBOLINGGO
  row(57, 14, 'DEKRANASDA PROBLINGGO', 'SHEET', '2026-10-05', 'SLITTER', 'Mesin Slitter', 'Suharmoko', 204, 'Sheet', 'DEKRANASDA PROBOLINGGO · Order 01/10/26 (200) · Est. selesai: 29/10/26'),
  row(58, 14, 'DEKRANASDA PROBLINGGO', 'SHEET', '2026-10-06', 'SABLON', 'Sablon', 'Amanu', 203, 'Sheet', 'DEKRANASDA PROBOLINGGO · Order 01/10/26 · Bahan: 204 · Rusak: 1 · Hasil: 203'),
  row(59, 14, 'DEKRANASDA PROBLINGGO', 'SHEET', '2026-10-06', 'SLOTTER', 'Mesin Slitter', 'Toha', 202, 'Sheet', 'DEKRANASDA PROBOLINGGO · Order 01/10/26 · Bahan: 203 · Rusak: 1 · Hasil: 202'),
  row(60, 14, 'DEKRANASDA PROBLINGGO', 'SHEET', '2026-10-07', 'BTB', 'Mesin Board To B', 'Toha', 201, 'Sheet', 'DEKRANASDA PROBOLINGGO · Operator: Toha & Falik · Order 01/10/26 · Bahan: 202 · Rusak: 1 · Baik: 201 (Selesai)'),

  // Order 15: SILNAD
  row(61, 15, 'SILNAD', 'SHEET', '2026-10-05', 'SLITTER', 'Mesin Slitter', 'Suharmoko', 102, 'Sheet', 'SILNAD · Varian: TALIKUR · Order 01/10/26 (100) · Est. selesai: 29/10/26'),
  row(62, 15, 'SILNAD', 'SHEET', '2026-10-09', 'SABLON', 'Sablon', 'Amanu', 102, 'Sheet', 'SILNAD · Varian: TALIKUR · Order 01/10/26 · Hasil: 102'),
  row(63, 15, 'SILNAD', 'SHEET', '2026-10-12', 'SLOTTER', 'Mesin Slitter', 'Toha', 101, 'Sheet', 'SILNAD · Varian: TALIKUR · Order 01/10/26 · Bahan: 102 · Rusak: 1 · Hasil: 101'),
  row(64, 15, 'SILNAD', 'SHEET', '2026-10-12', 'BTB', 'Mesin Board To B', 'Toha', 101, 'Sheet', 'SILNAD · Operator: Toha & Falik · Order 01/10/26 · Hasil: 101'),
  row(65, 15, 'SILNAD', 'SHEET', '2026-10-12', 'FINISHING TALI', 'Finishing', 'Falik', 101, 'Sheet', 'SILNAD · Pasang Tali (Finishing) · Operator: Toha & Falik · Order 01/10/26 · Baik: 101 (Selesai)'),

  // Order 16: PANGKEP
  row(66, 16, 'PANGKEP', 'WK', '2026-10-05', 'SLITTER', 'Mesin Slitter', 'Suharmoko', 506, 'Pcs', 'PANGKEP · Varian: WK + TALI · Order 01/10/26 (500) · Est. selesai: 29/10/26 · Menunggu Sablon, Slotter, BTB, Finishing Tali', 'pending'),

  // Order 17: GARASI CAK MAS
  row(67, 17, 'GARASI CAK MAS', 'DPLX310', '2026-10-06', 'PP CUTTING', 'Mesin Paper Cutting', 'Kurniawan', 415, 'Pcs', 'Varian: HIJAU KUNING · Order 02/10/26 (400) · Est. selesai: 30/10/26'),
  row(68, 17, 'GARASI CAK MAS', 'DPLX310', '2026-10-13', 'SABLON', 'Sablon', 'Amanu', 414, 'Pcs', 'Varian: HIJAU KUNING · Order 02/10/26 · Bahan: 415 · Rusak: 1 · Hasil: 414'),
  row(69, 17, 'GARASI CAK MAS', 'DPLX310', '2026-10-15', 'LAMINASI', 'Mesin Laminasi', 'Toha', 414, 'Pcs', 'Varian: HIJAU KUNING · Operator: Toha & Andri · Order 02/10/26 · Hasil: 414'),
  row(70, 17, 'GARASI CAK MAS', 'DPLX310', '2026-10-15', 'PLONG', 'Mesin Plong', 'Andri', 412, 'Pcs', 'Varian: HIJAU KUNING · Order 02/10/26 · Bahan: 414 · Rusak: 2 · Hasil: 412'),
  row(71, 17, 'GARASI CAK MAS', 'DPLX310', '2026-10-15', 'BTB', 'Mesin Board To B', 'Toha', 412, 'Pcs', 'Varian: HIJAU KUNING · Order 02/10/26 · Baik: 412 (Selesai)'),

  // Order 18: KUE SATU
  row(72, 18, 'KUE SATU', 'DPLX310', '2026-10-05', 'PP CUTTING', 'Mesin Paper Cutting', 'Kurniawan', 600, 'Lembar', 'KUE SATU · Order 05/10/26 (1,000) · Est. selesai: 02/11/26 · 1 LBR CETAK ISI 2'),
  row(73, 18, 'KUE SATU', 'DPLX310', '2026-10-05', 'OFFSET', 'Offset', 'Vendor Percetakan Offset', 1184, 'Pcs', 'KUE SATU · Order 05/10/26 · Bahan: 592 · Rusak: 16 · Hasil: 1,184'),
  row(74, 18, 'KUE SATU', 'DPLX310', '2026-10-13', 'LAMINASI', 'Mesin Laminasi', 'Falik', 1184, 'Pcs', 'KUE SATU · Operator: Toha & Falik · Order 05/10/26 · Hasil: 1,184'),
  row(75, 18, 'KUE SATU', 'DPLX310', '2026-10-13', 'PLONG', 'Mesin Plong', 'Andri', 1180, 'Pcs', 'KUE SATU · Order 05/10/26 · Bahan: 1,184 · Rusak: 4 · Baik: 1,180 · UNLEGH GESER'),

  // Order 19: POKAK KC 1
  row(76, 19, 'POKAK KC 1', 'SHEET', '2026-10-12', 'SLITTER', 'Mesin Slitter', 'Suharmoko', 2000, 'Sheet', 'POKAK KC 1 · Order 05/10/26 (2,000) · Est. selesai: 02/11/26'),
  row(77, 19, 'POKAK KC 1', 'SHEET', '2026-10-13', 'SABLON', 'Sablon', 'Mustono', 1991, 'Sheet', 'POKAK KC 1 · Order 05/10/26 · Bahan: 2,000 · Rusak: 9 · Hasil: 1,991'),
  row(78, 19, 'POKAK KC 1', 'SHEET', '2026-10-16', 'PLONG', 'Mesin Plong', 'Suharmoko', 1948, 'Sheet', 'POKAK KC 1 · Order 05/10/26 · Bahan: 1,991 · Rusak: 43 · RIT PUTUS'),
  row(79, 19, 'POKAK KC 1', 'SHEET', '2026-10-21', 'FINISHING', 'Finishing', 'Falik', 1947, 'Sheet', 'POKAK KC 1 · Operator: Falik & Andri · Order 05/10/26 · Bahan: 1,948 · Rusak: 1 · Hasil: 1,947'),
  row(80, 19, 'POKAK KC 1', 'SHEET', '2026-10-29', 'BTB', 'Mesin Board To B', 'Toha', 1945, 'Sheet', 'POKAK KC 1 · Operator: Toha & Falik · Order 05/10/26 · Bahan: 1,947 · Rusak: 2 · Baik: 1,945 (Selesai)'),

  // Order 20: POKAK KC 2
  row(81, 20, 'POKAK KC 2', 'SHEET', '2026-10-15', 'SLITTER', 'Mesin Slitter', 'Suharmoko', 211, 'Sheet', 'POKAK KC 2 · Order 05/10/26 (200) · Est. selesai: 02/11/26'),
  row(82, 20, 'POKAK KC 2', 'SHEET', '2026-10-28', 'SABLON', 'Sablon', 'Amanu', 211, 'Sheet', 'POKAK KC 2 · Order 05/10/26 · Hasil: 211'),
  row(83, 20, 'POKAK KC 2', 'SHEET', '2026-10-29', 'PLONG', 'Mesin Plong', 'Amanu', 210, 'Sheet', 'POKAK KC 2 · Order 05/10/26 · Bahan: 211 · Rusak: 1 · Baik: 210'),

  // Order 21: POKAK PLST 1 (In-progress in PDF)
  row(84, 21, 'POKAK PLST 1', 'SHEET', '2026-10-08', 'SLITTER', 'Mesin Slitter', 'Suharmoko', 2020, 'Sheet', 'POKAK PLST 1 · Order 05/10/26 (2,000) · Bahan: 2,020 · Lanjutan: Sablon (19/10), Plong (22/10), Finishing (26/10), BTB (28/10) belum tercatat angkanya', 'pending'),

  // Order 22: POKAK PLST 2
  row(85, 22, 'POKAK PLST 2', 'SHEET', '2026-10-27', 'SABLON', 'Sablon', 'Amanu', 214, 'Sheet', 'POKAK PLST 2 · Order 05/10/26 (200) · Slitter 16/10 oleh Suharmoko · Hasil: 214'),
  row(86, 22, 'POKAK PLST 2', 'SHEET', '2026-10-29', 'PLONG', 'Mesin Plong', 'Amanu', 214, 'Sheet', 'POKAK PLST 2 · Order 05/10/26 · Baik: 214'),

  // Order 23: JAHE PLST 1
  row(87, 23, 'JAHE PLST 1', 'SHEET', '2026-10-13', 'SLITTER', 'Mesin Slitter', 'Suharmoko', 108, 'Sheet', 'JAHE PLST 1 · Order 05/10/26 (100) · Est. selesai: 02/11/26'),
  row(88, 23, 'JAHE PLST 1', 'SHEET', '2026-10-15', 'SABLON', 'Sablon', 'Amanu', 107, 'Sheet', 'JAHE PLST 1 · Order 05/10/26 · Bahan: 108 · Rusak: 1 · Hasil: 107'),
  row(89, 23, 'JAHE PLST 1', 'SHEET', '2026-10-15', 'PLONG', 'Mesin Plong', 'Andri', 106, 'Sheet', 'JAHE PLST 1 · Order 05/10/26 · Bahan: 107 · Rusak: 1 · Hasil: 106'),
  row(90, 23, 'JAHE PLST 1', 'SHEET', '2026-10-23', 'FINISHING', 'Finishing', 'Falik', 105, 'Sheet', 'JAHE PLST 1 · Operator: Falik & Andri · Order 05/10/26 · Bahan: 106 · Rusak: 1 · Hasil: 105'),
  row(91, 23, 'JAHE PLST 1', 'SHEET', '2026-10-26', 'BTB', 'Mesin Board To B', 'Toha', 104, 'Sheet', 'JAHE PLST 1 · Operator: Toha & Falik · Order 05/10/26 · Bahan: 105 · Rusak: 1 · Baik: 104 (Selesai)'),

  // Order 24: B.AGNGPLST1
  row(92, 24, 'B.AGNGPLST1', 'SHEET', '2026-10-13', 'SLITTER', 'Mesin Slitter', 'Suharmoko', 108, 'Sheet', 'B.AGNGPLST1 · Order 05/10/26 (100) · Est. selesai: 02/11/26'),
  row(93, 24, 'B.AGNGPLST1', 'SHEET', '2026-10-14', 'SABLON', 'Sablon', 'Amanu', 107, 'Sheet', 'B.AGNGPLST1 · Order 05/10/26 · Bahan: 108 · Rusak: 1 · Hasil: 107'),
  row(94, 24, 'B.AGNGPLST1', 'SHEET', '2026-10-15', 'PLONG', 'Mesin Plong', 'Andri', 106, 'Sheet', 'B.AGNGPLST1 · Order 05/10/26 · Bahan: 107 · Rusak: 1 · Hasil: 106'),
  row(95, 24, 'B.AGNGPLST1', 'SHEET', '2026-10-23', 'FINISHING', 'Finishing', 'Falik', 105, 'Sheet', 'B.AGNGPLST1 · Operator: Falik & Andri · Order 05/10/26 · Bahan: 106 · Rusak: 1 · Hasil: 105'),
  row(96, 24, 'B.AGNGPLST1', 'SHEET', '2026-10-26', 'BTB', 'Mesin Board To B', 'Toha', 104, 'Sheet', 'B.AGNGPLST1 · Operator: Toha & Falik · Order 05/10/26 · Bahan: 105 · Rusak: 1 · Baik: 104 (Selesai)'),

  // Order 25: GRIYA SHAFIQA
  row(97, 25, 'GRIYA SHAFIQA', 'IVORY 300', '2026-10-05', 'PP CUTTING', 'Mesin Paper Cutting', 'Kurniawan', 108, 'Pcs', 'GRIYA SHAFIQA · Ukuran: 32X38 · Order 05/10/26 (100) · Est. selesai: 02/11/26'),
  row(98, 25, 'GRIYA SHAFIQA', 'IVORY 300', '2026-10-16', 'SABLON', 'Sablon', 'Amanu', 107, 'Pcs', 'GRIYA SHAFIQA · Ukuran: 32X38 · Order 05/10/26 · Bahan: 108 · Rusak: 1'),
  row(99, 25, 'GRIYA SHAFIQA', 'IVORY 300', '2026-10-16', 'LAMINASI', 'Mesin Laminasi', 'Falik', 107, 'Pcs', 'GRIYA SHAFIQA · Ukuran: 32X38 · Operator: Toha & Falik · Order 05/10/26 · Hasil: 107'),
  row(100, 25, 'GRIYA SHAFIQA', 'IVORY 300', '2026-10-16', 'PLONG', 'Mesin Plong', 'Kurniawan', 107, 'Pcs', 'GRIYA SHAFIQA · Ukuran: 32X38 · Order 05/10/26 · Baik: 107 (Selesai)'),

  // Order 26: CATUR KUTI
  row(101, 26, 'CATUR KUTI', 'SHEET', '2026-10-22', 'SLITTER', 'Mesin Slitter', 'Suharmoko', 101, 'Sheet', 'CATUR KUTI · Order 10/10/26 (100) · Est. selesai: 07/11/26'),
  row(102, 26, 'CATUR KUTI', 'SHEET', '2026-10-23', 'PLONG', 'Mesin Plong', 'Suharmoko', 101, 'Sheet', 'CATUR KUTI · Order 10/10/26 · Hasil: 101'),
  row(103, 26, 'CATUR KUTI', 'SHEET', '2026-10-23', 'SABLON', 'Sablon', 'Amanu', 101, 'Sheet', 'CATUR KUTI · Order 10/10/26 · Hasil: 101'),
  row(104, 26, 'CATUR KUTI', 'SHEET', '2026-10-28', 'BTB', 'Mesin Board To B', 'Toha', 101, 'Sheet', 'CATUR KUTI · Operator: Toha & Falik · Order 10/10/26 · Baik: 101 (Selesai)'),

  // Order 27: MBAK SARI
  row(105, 27, 'MBAK SARI', 'SHEET', '2026-10-19', 'SLITTER', 'Mesin Slitter', 'Suharmoko', 230, 'Sheet', 'MBAK SARI · Order 11/10/26 (200) · Est. selesai: 08/11/26'),
  row(106, 27, 'MBAK SARI', 'SHEET', '2026-10-20', 'SABLON', 'Sablon', 'Amanu', 230, 'Sheet', 'MBAK SARI · Order 11/10/26 · Hasil: 230'),
  row(107, 27, 'MBAK SARI', 'SHEET', '2026-10-23', 'PLONG', 'Mesin Plong', 'Andri', 230, 'Sheet', 'MBAK SARI · Order 11/10/26 · Hasil: 230'),
  row(108, 27, 'MBAK SARI', 'SHEET', '2026-10-28', 'BTB', 'Mesin Board To B', 'Toha', 230, 'Sheet', 'MBAK SARI · Operator: Toha & Falik · Order 11/10/26 · Baik: 230 (Selesai)'),

  // Order 28: CARRIS
  row(109, 28, 'CARRIS', 'PP FOIL', '2026-10-30', 'PLONG', 'Mesin Plong', 'Mustono', 1072, 'Pcs', 'CARRIS · Order 13/10/26 (1,000) · Est. selesai: 10/11/26 · Hasil: 1,072'),
  row(110, 28, 'CARRIS', 'PP FOIL', '2026-10-30', 'BAND SEALER', 'Mesin Band Sealer', 'Andri', 1072, 'Pcs', 'CARRIS · Order 13/10/26 · Baik: 1,072 (Selesai)'),

  // Order 29: PALM SUGAR
  row(111, 29, 'PALM SUGAR', 'POUCH', '2026-10-16', 'SABLON', 'Sablon', 'Amanu', 1007, 'Pcs', 'PALM SUGAR · Order 16/10/26 (1,007) · Est. selesai: 13/11/26 · Baik: 1,007 (Selesai)'),

  // Order 30: LUKUNUNG
  row(112, 30, 'LUKUNUNG', 'IVORY 300', '2026-10-22', 'PP CUTTING', 'Mesin Paper Cutting', 'Kurniawan', 213, 'Pcs', 'LUKUNUNG · Order 22/10/26 (200) · Est. selesai: 19/11/26'),
  row(113, 30, 'LUKUNUNG', 'IVORY 300', '2026-10-22', 'SABLON', 'Sablon', 'Amanu', 213, 'Pcs', 'LUKUNUNG · Order 22/10/26 · Hasil: 213'),
  row(114, 30, 'LUKUNUNG', 'IVORY 300', '2026-10-23', 'PLONG', 'Mesin Plong', 'Kurniawan', 213, 'Pcs', 'LUKUNUNG · Order 22/10/26 · Baik: 213 (Selesai)'),

  // Order 31: CAK MIMIN (5,040)
  row(115, 31, 'CAK MIMIN', 'OPP', '2026-10-22', 'VERTIKAL', 'Mesin Vertikal', 'Andri', 5040, 'Pcs', 'CAK MIMIN · Batch 5,040 · Order 22/10/26 · Est. selesai: 25/10/26 · Baik: 5,040 (Selesai)'),

  // Order 32: CAK MIMIN (1,000)
  row(116, 32, 'CAK MIMIN', 'OPP', '2026-10-23', 'VERTIKAL', 'Mesin Vertikal', 'Andri', 1000, 'Pcs', 'CAK MIMIN · Batch 1,000 · Order 23/10/26 · Est. selesai: 26/10/26 · Baik: 1,000 · PLASTIK HABIS'),

  // Order 33: CAK MIMIN (8,072)
  row(117, 33, 'CAK MIMIN', 'OPP', '2026-10-24', 'VERTIKAL', 'Mesin Vertikal', 'Andri', 8072, 'Pcs', 'CAK MIMIN · Batch 8,072 · Order 26/10/26 · Est. selesai: 29/10/26 · Baik: 8,072 (Selesai)'),

  // Order 34: JOYO ROSO
  row(118, 34, 'JOYO ROSO', 'PP', '2026-10-26', 'SABLON', 'Sablon', 'Amanu', 1650, 'Pcs', 'JOYO ROSO · Order 26/10/26 (1,650) · Est. selesai: 29/10/26 · Baik: 1,650 (Selesai)'),
];

export const INITIAL_OKTOBER_TARGET = {
  monthKey: '2026-10',
  sectionCode: SECTION_CODE,
  targetTotalOutput: 45000,
  workingDaysTarget: 23,
  dailyPerWorkerTarget: 250,
  notes: 'Laporan Order dan Distribusi Pekerjaan Bulan Oktober (Total 34 Order · Produk Baik: 28.313 · Rusak: 175)',
};
