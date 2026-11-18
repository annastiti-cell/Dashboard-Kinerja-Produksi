import type { Timestamp } from 'firebase/firestore';

export const SECTION_CODE = 'pelayanan_teknis' as const;

export const BOOTSTRAPPED_ADMIN_EMAIL = 'annastiti@gmail.com';

export const PRODUCTION_CATEGORIES = [
  'Mesin Paper Cutting',
  'Mesin Slitter',
  'Sablon',
  'Offset',
  'Mesin Plong',
  'Mesin Laminasi',
  'Finishing',
  'Mesin Board To B',
  'Mesin Band Sealer',
  'Mesin Vertikal',
] as const;

export type ProductionCategory = (typeof PRODUCTION_CATEGORIES)[number];

export const UNIT_MEASURES = [
  'Pcs',
  'Lembar',
  'Sheet',
  'Unit',
  'Pack',
  'Set',
] as const;

export type LogStatus = 'pending' | 'approved' | 'rejected';

export type PortalMode = 'worker' | 'admin';

// Synchronized verbatim with firebase-blueprint.json constraints
export const BLUEPRINT_LIMITS = {
  workerProfile: {
    displayNameMin: 2,
    displayNameMax: 100,
    unitKerjaMin: 2,
    unitKerjaMax: 80,
    jabatanMin: 2,
    jabatanMax: 80,
  },
  productionLog: {
    activityTitleMin: 3,
    activityTitleMax: 140,
    unitMeasureMin: 1,
    unitMeasureMax: 30,
    notesMax: 600,
    validationNotesMax: 500,
    quantityMin: 0.01,
    quantityMax: 100000,
    datePattern: /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/,
    monthPattern: /^[0-9]{4}-[0-9]{2}$/,
  },
  monthlyTarget: {
    targetTotalOutputMin: 1,
    targetTotalOutputMax: 1000000,
    workingDaysMin: 1,
    workingDaysMax: 31,
    dailyPerWorkerMin: 0.1,
    dailyPerWorkerMax: 10000,
    notesMax: 500,
  },
} as const;

export interface WorkerProfile {
  uid: string;
  displayName: string;
  unitKerja: string;
  jabatan: string;
  sectionCode: typeof SECTION_CODE;
  dailyReminderEnabled: boolean;
  reminderHour: number;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
}

export interface AdminRecord {
  uid: string;
  grantedBy: string;
  displayName: string;
  createdAt: Timestamp | null;
}

export interface MonthlyTarget {
  monthKey: string;
  sectionCode: typeof SECTION_CODE;
  targetTotalOutput: number;
  workingDaysTarget: number;
  dailyPerWorkerTarget: number;
  notes: string;
  updatedBy: string;
  updatedAt: Timestamp | null;
}

export interface ProductionLog {
  id: string;
  workerId: string;
  workerName: string;
  unitKerja: string;
  sectionCode: typeof SECTION_CODE;
  productionDate: string;
  monthKey: string;
  activityTitle: string;
  category: ProductionCategory;
  quantity: number;
  unitMeasure: string;
  notes: string;
  status: LogStatus;
  validatedBy: string | null;
  validatedByName: string | null;
  validationNotes: string;
  validatedAt: Timestamp | null;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
}

export interface ProductionLogDraft {
  productionDate: string;
  activityTitle: string;
  category: ProductionCategory;
  quantity: number;
  unitMeasure: string;
  notes: string;
}
