import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import {
  DEPRECATED_SEED_WORKER_IDS,
  INITIAL_OKTOBER_LOGS,
  INITIAL_OKTOBER_TARGET,
  INITIAL_WORKERS,
  type SeedProductionLog,
} from '../data/initialOktoberData';
import {
  auth,
  db,
  googleProvider,
  handleFirestoreError,
  OperationType,
} from '../firebase';
import {
  BLUEPRINT_LIMITS,
  BOOTSTRAPPED_ADMIN_EMAIL,
  PRODUCTION_CATEGORIES,
  SECTION_CODE,
  type AdminRecord,
  type LogStatus,
  type MonthlyTarget,
  type PortalMode,
  type ProductionLog,
  type ProductionLogDraft,
  type WorkerProfile,
} from '../types';
import { getCurrentMonthKey, getTodayLocalDate } from '../utils/dateUtils';

interface FirebaseContextValue {
  user: User | null;
  authReady: boolean;
  portalMode: PortalMode;
  setPortalMode: (mode: PortalMode) => void;
  isAdmin: boolean;
  adminAccessDenied: boolean;
  clearAdminDenied: () => void;
  profile: WorkerProfile | null;
  workers: WorkerProfile[];
  admins: AdminRecord[];
  logs: ProductionLog[];
  targets: Record<string, MonthlyTarget>;
  selectedMonth: string;
  setSelectedMonth: (monthKey: string) => void;
  loadingData: boolean;
  hasLoggedToday: boolean;
  browserNotificationPermission: NotificationPermission | 'unsupported';
  requestBrowserNotifications: () => Promise<void>;
  triggerTestReminder: () => void;
  loginWithGoogle: (intendedPortal: PortalMode) => Promise<void>;
  logout: () => Promise<void>;
  updateMyProfile: (updates: {
    displayName: string;
    unitKerja: string;
    jabatan: string;
    dailyReminderEnabled: boolean;
    reminderHour: number;
  }) => Promise<void>;
  createProductionLog: (draft: ProductionLogDraft) => Promise<void>;
  updateProductionLog: (logId: string, draft: ProductionLogDraft) => Promise<void>;
  adminCreateProductionLog: (
    draft: ProductionLogDraft & {
      workerId: string;
      status: LogStatus;
      validationNotes: string;
    },
  ) => Promise<void>;
  adminUpdateProductionLog: (
    logId: string,
    draft: ProductionLogDraft & {
      workerId: string;
      status: LogStatus;
      validationNotes: string;
    },
  ) => Promise<void>;
  deleteProductionLog: (logId: string) => Promise<void>;
  validateProductionLog: (
    logId: string,
    status: Exclude<LogStatus, 'pending'>,
    validationNotes: string,
  ) => Promise<void>;
  saveMonthlyTarget: (payload: {
    monthKey: string;
    targetTotalOutput: number;
    workingDaysTarget: number;
    dailyPerWorkerTarget: number;
    notes: string;
  }) => Promise<void>;
  deleteMonthlyTarget: (monthKey: string) => Promise<void>;
  adminUpdateWorkerProfile: (
    targetUid: string,
    updates: {
      displayName: string;
      unitKerja: string;
      jabatan: string;
      dailyReminderEnabled: boolean;
      reminderHour: number;
    },
  ) => Promise<void>;
  adminDeleteWorkerProfile: (targetUid: string) => Promise<void>;
  grantAdminAccess: (targetWorker: WorkerProfile) => Promise<void>;
  revokeAdminAccess: (targetUid: string) => Promise<void>;
  seedingData: boolean;
  seedInitialOktoberData: () => Promise<void>;
  toastMessage: { text: string; type: 'success' | 'info' | 'error' } | null;
  dismissToast: () => void;
  showToast: (text: string, type?: 'success' | 'info' | 'error') => void;
}

const FirebaseContext = createContext<FirebaseContextValue | null>(null);

const PORTAL_STORAGE_KEY = 'lintasteknis_portal_mode';

export function FirebaseProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [portalMode, setPortalModeState] = useState<PortalMode>(() => {
    const saved = localStorage.getItem(PORTAL_STORAGE_KEY);
    return saved === 'admin' ? 'admin' : 'worker';
  });
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminAccessDenied, setAdminAccessDenied] = useState(false);
  const [profile, setProfile] = useState<WorkerProfile | null>(null);
  const [workers, setWorkers] = useState<WorkerProfile[]>([]);
  const [admins, setAdmins] = useState<AdminRecord[]>([]);
  const [logs, setLogs] = useState<ProductionLog[]>([]);
  const [targets, setTargets] = useState<Record<string, MonthlyTarget>>({});
  const [selectedMonth, setSelectedMonthState] = useState<string>(() => getCurrentMonthKey());
  const [loadingData, setLoadingData] = useState(false);
  const [seedingData, setSeedingData] = useState(false);
  const [logsInitialized, setLogsInitialized] = useState(false);
  const userChangedMonthRef = useRef(false);
  const autoSeedAttemptedRef = useRef(false);
  const setSelectedMonth = useCallback((monthKey: string) => {
    userChangedMonthRef.current = true;
    setSelectedMonthState(monthKey);
  }, []);
  const [toastMessage, setToastMessage] = useState<{
    text: string;
    type: 'success' | 'info' | 'error';
  } | null>(null);
  const [browserNotificationPermission, setBrowserNotificationPermission] = useState<
    NotificationPermission | 'unsupported'
  >(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
    return Notification.permission;
  });

  const reminderFiredTodayRef = useRef<string | null>(null);

  const showToast = useCallback(
    (text: string, type: 'success' | 'info' | 'error' = 'info') => {
      setToastMessage({ text, type });
    },
    [],
  );

  const dismissToast = useCallback(() => setToastMessage(null), []);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = window.setTimeout(() => setToastMessage(null), 5000);
    return () => window.clearTimeout(timer);
  }, [toastMessage]);

  const setPortalMode = useCallback((mode: PortalMode) => {
    setPortalModeState(mode);
    localStorage.setItem(PORTAL_STORAGE_KEY, mode);
  }, []);

  const clearAdminDenied = useCallback(() => setAdminAccessDenied(false), []);

  // Ensure worker_profiles and users_private exist for authenticated verified user
  const provisionUserDocuments = useCallback(async (firebaseUser: User) => {
    const uid = firebaseUser.uid;
    const profileRef = doc(db, 'worker_profiles', uid);
    const privateRef = doc(db, 'users_private', uid);

    try {
      const existingProfile = await getDoc(profileRef);
      if (!existingProfile.exists()) {
        const rawName = (firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Teknisi Lapangan').trim();
        const safeName = rawName.slice(0, BLUEPRINT_LIMITS.workerProfile.displayNameMax);
        const displayName =
          safeName.length >= BLUEPRINT_LIMITS.workerProfile.displayNameMin
            ? safeName
            : 'Teknisi Layanan';

        await setDoc(profileRef, {
          uid,
          displayName,
          unitKerja: 'Seksi Pelayanan Teknis',
          jabatan: 'Petugas Teknis Operasional',
          sectionCode: SECTION_CODE,
          dailyReminderEnabled: true,
          reminderHour: 16,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `worker_profiles/${uid}`);
    }

    if (firebaseUser.email) {
      try {
        const existingPrivate = await getDoc(privateRef);
        if (!existingPrivate.exists()) {
          await setDoc(privateRef, {
            uid,
            email: firebaseUser.email.slice(0, 150),
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `users_private/${uid}`);
      }
    }
  }, []);

  // Auth listener + Admin check
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (!firebaseUser) {
        setIsAdmin(false);
        setProfile(null);
        setWorkers([]);
        setAdmins([]);
        setLogs([]);
        setTargets({});
        setAuthReady(true);
        return;
      }

      setLoadingData(true);
      try {
        await provisionUserDocuments(firebaseUser);

        const emailLower = (firebaseUser.email || '').toLowerCase();
        const isBootstrapped =
          firebaseUser.emailVerified && emailLower === BOOTSTRAPPED_ADMIN_EMAIL;

        let adminDocExists = false;
        try {
          const adminSnap = await getDoc(doc(db, 'admins', firebaseUser.uid));
          adminDocExists = adminSnap.exists();
        } catch {
          adminDocExists = false;
        }

        const userIsAdmin = Boolean(isBootstrapped || adminDocExists);
        setIsAdmin(userIsAdmin);

        const savedPortal = localStorage.getItem(PORTAL_STORAGE_KEY);
        if (savedPortal === 'admin' && !userIsAdmin) {
          setAdminAccessDenied(true);
          setPortalMode('worker');
        } else {
          setAdminAccessDenied(false);
        }
      } finally {
        setAuthReady(true);
        setLoadingData(false);
      }
    });

    return () => unsub();
  }, [provisionUserDocuments, setPortalMode]);

  // Real-time Firestore subscriptions (only when authenticated & authReady)
  useEffect(() => {
    if (!authReady || !user) return;

    const myProfileRef = doc(db, 'worker_profiles', user.uid);
    const unsubMyProfile = onSnapshot(
      myProfileRef,
      (snap) => {
        if (snap.exists()) {
          setProfile(snap.data() as WorkerProfile);
        }
      },
      (error) => handleFirestoreError(error, OperationType.GET, `worker_profiles/${user.uid}`),
    );

    const workersQuery = query(
      collection(db, 'worker_profiles'),
      where('sectionCode', '==', SECTION_CODE),
    );
    const unsubWorkers = onSnapshot(
      workersQuery,
      (snap) => {
        const list = snap.docs.map((d) => d.data() as WorkerProfile);
        list.sort((a, b) => a.displayName.localeCompare(b.displayName, 'id'));
        setWorkers(list);
      },
      (error) => handleFirestoreError(error, OperationType.LIST, 'worker_profiles'),
    );

    const logsQuery = query(
      collection(db, 'production_logs'),
      where('sectionCode', '==', SECTION_CODE),
    );
    const unsubLogs = onSnapshot(
      logsQuery,
      (snap) => {
        const list = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<ProductionLog, 'id'>),
        }));
        list.sort((a, b) => {
          const dateCmp = b.productionDate.localeCompare(a.productionDate);
          if (dateCmp !== 0) return dateCmp;
          const aSec = a.createdAt?.seconds ?? 0;
          const bSec = b.createdAt?.seconds ?? 0;
          return bSec - aSec;
        });
        setLogs(list);
        setLogsInitialized(true);
      },
      (error) => handleFirestoreError(error, OperationType.LIST, 'production_logs'),
    );

    const targetsQuery = query(
      collection(db, 'monthly_targets'),
      where('sectionCode', '==', SECTION_CODE),
    );
    const unsubTargets = onSnapshot(
      targetsQuery,
      (snap) => {
        const map: Record<string, MonthlyTarget> = {};
        for (const d of snap.docs) {
          const data = d.data() as MonthlyTarget;
          map[data.monthKey] = data;
        }
        setTargets(map);
      },
      (error) => handleFirestoreError(error, OperationType.LIST, 'monthly_targets'),
    );

    let unsubAdmins: (() => void) | undefined;
    if (isAdmin) {
      unsubAdmins = onSnapshot(
        collection(db, 'admins'),
        (snap) => {
          const list = snap.docs.map((d) => d.data() as AdminRecord);
          setAdmins(list);
        },
        (error) => handleFirestoreError(error, OperationType.LIST, 'admins'),
      );
    } else {
      setAdmins([]);
    }

    return () => {
      unsubMyProfile();
      unsubWorkers();
      unsubLogs();
      unsubTargets();
      if (unsubAdmins) unsubAdmins();
    };
  }, [authReady, user, isAdmin]);

  const hasLoggedToday = useMemo(() => {
    if (!user) return false;
    const today = getTodayLocalDate();
    return logs.some((l) => l.workerId === user.uid && l.productionDate === today);
  }, [logs, user]);

  // Automatic daily reminder scheduler (checks every 60s when enabled)
  useEffect(() => {
    if (!user || !profile || !profile.dailyReminderEnabled || hasLoggedToday) return;

    const checkReminder = () => {
      const today = getTodayLocalDate();
      const nowHour = new Date().getHours();
      if (nowHour >= profile.reminderHour && reminderFiredTodayRef.current !== today) {
        reminderFiredTodayRef.current = today;
        showToast(
          `Pengingat Harian: Anda belum mencatat kinerja produksi hari ini (${today}). Segera lakukan input agar progres bulanan akurat.`,
          'info',
        );
        if (
          typeof window !== 'undefined' &&
          'Notification' in window &&
          Notification.permission === 'granted'
        ) {
          new Notification('Pengingat Input Kinerja Produksi', {
            body: `Belum ada catatan produksi untuk hari ini (${today}). Klik untuk mengisi log harian Seksi Pelayanan Teknis.`,
          });
        }
      }
    };

    checkReminder();
    const interval = window.setInterval(checkReminder, 60000);
    return () => window.clearInterval(interval);
  }, [user, profile, hasLoggedToday, showToast]);

  const requestBrowserNotifications = useCallback(async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setBrowserNotificationPermission('unsupported');
      showToast('Browser Anda tidak mendukung notifikasi desktop.', 'error');
      return;
    }
    const perm = await Notification.requestPermission();
    setBrowserNotificationPermission(perm);
    if (perm === 'granted') {
      showToast('Notifikasi browser diaktifkan untuk pengingat harian.', 'success');
    } else {
      showToast('Izin notifikasi browser ditolak. Pengingat tetap tampil di dalam aplikasi.', 'info');
    }
  }, [showToast]);

  const triggerTestReminder = useCallback(() => {
    const today = getTodayLocalDate();
    showToast(
      `Simulasi Pengingat Harian (${today}): Jangan lupa mencatat capaian produksi Seksi Pelayanan Teknis sebelum jam pulang.`,
      'info',
    );
    if (
      typeof window !== 'undefined' &&
      'Notification' in window &&
      Notification.permission === 'granted'
    ) {
      new Notification('Pengingat Input Kinerja Produksi', {
        body: `Pengingat harian aktif untuk ${profile?.displayName ?? 'Pekerja'} (${today}).`,
      });
    }
  }, [profile?.displayName, showToast]);

  const loginWithGoogle = useCallback(
    async (intendedPortal: PortalMode) => {
      setPortalMode(intendedPortal);
      setAdminAccessDenied(false);
      try {
        await signInWithPopup(auth, googleProvider);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Gagal masuk dengan Google.';
        if (!message.includes('popup-closed-by-user')) {
          showToast(`Gagal masuk: ${message}`, 'error');
        }
      }
    },
    [setPortalMode, showToast],
  );

  const logout = useCallback(async () => {
    await signOut(auth);
    setAdminAccessDenied(false);
  }, []);

  const updateMyProfile = useCallback(
    async (updates: {
      displayName: string;
      unitKerja: string;
      jabatan: string;
      dailyReminderEnabled: boolean;
      reminderHour: number;
    }) => {
      if (!user) throw new Error('Pengguna belum masuk.');
      const displayName = updates.displayName.trim().slice(0, BLUEPRINT_LIMITS.workerProfile.displayNameMax);
      const unitKerja = updates.unitKerja.trim().slice(0, BLUEPRINT_LIMITS.workerProfile.unitKerjaMax);
      const jabatan = updates.jabatan.trim().slice(0, BLUEPRINT_LIMITS.workerProfile.jabatanMax);

      if (displayName.length < BLUEPRINT_LIMITS.workerProfile.displayNameMin) {
        throw new Error('Nama lengkap minimal 2 karakter.');
      }
      if (unitKerja.length < BLUEPRINT_LIMITS.workerProfile.unitKerjaMin) {
        throw new Error('Unit kerja minimal 2 karakter.');
      }
      if (jabatan.length < BLUEPRINT_LIMITS.workerProfile.jabatanMin) {
        throw new Error('Jabatan minimal 2 karakter.');
      }

      const reminderHour = Math.max(0, Math.min(23, Math.floor(updates.reminderHour)));

      try {
        await updateDoc(doc(db, 'worker_profiles', user.uid), {
          displayName,
          unitKerja,
          jabatan,
          dailyReminderEnabled: Boolean(updates.dailyReminderEnabled),
          reminderHour,
          updatedAt: serverTimestamp(),
        });
        showToast('Profil & preferensi pengingat berhasil disimpan.', 'success');
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `worker_profiles/${user.uid}`);
      }
    },
    [user, showToast],
  );

  const createProductionLog = useCallback(
    async (draft: ProductionLogDraft) => {
      if (!user || !profile) throw new Error('Profil pekerja belum siap.');

      const productionDate = draft.productionDate.trim();
      if (!BLUEPRINT_LIMITS.productionLog.datePattern.test(productionDate)) {
        throw new Error('Format tanggal produksi harus YYYY-MM-DD.');
      }
      const monthKey = productionDate.slice(0, 7);
      const activityTitle = draft.activityTitle.trim().slice(0, BLUEPRINT_LIMITS.productionLog.activityTitleMax);
      if (activityTitle.length < BLUEPRINT_LIMITS.productionLog.activityTitleMin) {
        throw new Error('Judul aktivitas minimal 3 karakter.');
      }
      const quantity = Number(draft.quantity);
      if (!Number.isFinite(quantity) || quantity <= 0 || quantity > BLUEPRINT_LIMITS.productionLog.quantityMax) {
        throw new Error('Jumlah output harus lebih dari 0.');
      }
      const unitMeasure = draft.unitMeasure.trim().slice(0, BLUEPRINT_LIMITS.productionLog.unitMeasureMax);
      if (unitMeasure.length < BLUEPRINT_LIMITS.productionLog.unitMeasureMin) {
        throw new Error('Satuan output wajib diisi.');
      }
      const notes = draft.notes.trim().slice(0, BLUEPRINT_LIMITS.productionLog.notesMax);

      try {
        await addDoc(collection(db, 'production_logs'), {
          workerId: user.uid,
          workerName: profile.displayName,
          unitKerja: profile.unitKerja,
          sectionCode: SECTION_CODE,
          productionDate,
          monthKey,
          activityTitle,
          category: draft.category,
          quantity,
          unitMeasure,
          notes,
          status: 'pending',
          validatedBy: null,
          validatedByName: null,
          validationNotes: '',
          validatedAt: null,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        showToast('Kinerja produksi berhasil dicatat dan dikirim untuk validasi.', 'success');
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, 'production_logs');
      }
    },
    [user, profile, showToast],
  );

  const adminCreateProductionLog = useCallback(
    async (
      draft: ProductionLogDraft & {
        workerId: string;
        status: LogStatus;
        validationNotes: string;
      },
    ) => {
      if (!user || !isAdmin) throw new Error('Hanya Admin yang memiliki akses penuh.');
      const targetWorker = workers.find((w) => w.uid === draft.workerId);
      if (!targetWorker) throw new Error('Pekerja yang dipilih tidak ditemukan.');

      const productionDate = draft.productionDate.trim();
      if (!BLUEPRINT_LIMITS.productionLog.datePattern.test(productionDate)) {
        throw new Error('Format tanggal produksi harus YYYY-MM-DD.');
      }
      const monthKey = productionDate.slice(0, 7);
      const activityTitle = draft.activityTitle
        .trim()
        .slice(0, BLUEPRINT_LIMITS.productionLog.activityTitleMax);
      if (activityTitle.length < BLUEPRINT_LIMITS.productionLog.activityTitleMin) {
        throw new Error('Judul aktivitas minimal 3 karakter.');
      }
      const quantity = Number(draft.quantity);
      if (
        !Number.isFinite(quantity) ||
        quantity <= 0 ||
        quantity > BLUEPRINT_LIMITS.productionLog.quantityMax
      ) {
        throw new Error('Jumlah output harus lebih dari 0.');
      }
      const unitMeasure = draft.unitMeasure
        .trim()
        .slice(0, BLUEPRINT_LIMITS.productionLog.unitMeasureMax);
      const notes = draft.notes.trim().slice(0, BLUEPRINT_LIMITS.productionLog.notesMax);
      const validationNotes = draft.validationNotes
        .trim()
        .slice(0, BLUEPRINT_LIMITS.productionLog.validationNotesMax);
      const validatorName = (
        profile?.displayName ||
        user.displayName ||
        user.email ||
        'Admin'
      ).slice(0, 100);

      try {
        await addDoc(collection(db, 'production_logs'), {
          workerId: targetWorker.uid,
          workerName: targetWorker.displayName,
          unitKerja: targetWorker.unitKerja,
          sectionCode: SECTION_CODE,
          productionDate,
          monthKey,
          activityTitle,
          category: draft.category,
          quantity,
          unitMeasure,
          notes,
          status: draft.status,
          validatedBy: draft.status === 'pending' ? null : user.uid,
          validatedByName: draft.status === 'pending' ? null : validatorName,
          validationNotes: draft.status === 'pending' ? '' : validationNotes,
          validatedAt: draft.status === 'pending' ? null : serverTimestamp(),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        showToast('Data kinerja berhasil ditambahkan oleh Admin.', 'success');
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, 'production_logs');
      }
    },
    [user, isAdmin, workers, profile, showToast],
  );

  const adminUpdateProductionLog = useCallback(
    async (
      logId: string,
      draft: ProductionLogDraft & {
        workerId: string;
        status: LogStatus;
        validationNotes: string;
      },
    ) => {
      if (!user || !isAdmin) throw new Error('Hanya Admin yang memiliki akses penuh.');
      const targetWorker = workers.find((w) => w.uid === draft.workerId);
      const productionDate = draft.productionDate.trim();
      if (!BLUEPRINT_LIMITS.productionLog.datePattern.test(productionDate)) {
        throw new Error('Format tanggal produksi harus YYYY-MM-DD.');
      }
      const monthKey = productionDate.slice(0, 7);
      const activityTitle = draft.activityTitle
        .trim()
        .slice(0, BLUEPRINT_LIMITS.productionLog.activityTitleMax);
      if (activityTitle.length < BLUEPRINT_LIMITS.productionLog.activityTitleMin) {
        throw new Error('Judul aktivitas minimal 3 karakter.');
      }
      const quantity = Number(draft.quantity);
      if (
        !Number.isFinite(quantity) ||
        quantity <= 0 ||
        quantity > BLUEPRINT_LIMITS.productionLog.quantityMax
      ) {
        throw new Error('Jumlah output harus lebih dari 0.');
      }
      const unitMeasure = draft.unitMeasure
        .trim()
        .slice(0, BLUEPRINT_LIMITS.productionLog.unitMeasureMax);
      const notes = draft.notes.trim().slice(0, BLUEPRINT_LIMITS.productionLog.notesMax);
      const validationNotes = draft.validationNotes
        .trim()
        .slice(0, BLUEPRINT_LIMITS.productionLog.validationNotesMax);
      const validatorName = (
        profile?.displayName ||
        user.displayName ||
        user.email ||
        'Admin'
      ).slice(0, 100);

      const updatePayload: Record<string, unknown> = {
        productionDate,
        monthKey,
        activityTitle,
        category: draft.category,
        quantity,
        unitMeasure,
        notes,
        status: draft.status,
        validatedBy: draft.status === 'pending' ? null : user.uid,
        validatedByName: draft.status === 'pending' ? null : validatorName,
        validationNotes: draft.status === 'pending' ? '' : validationNotes,
        validatedAt: draft.status === 'pending' ? null : serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      if (targetWorker) {
        updatePayload.workerId = targetWorker.uid;
        updatePayload.workerName = targetWorker.displayName;
        updatePayload.unitKerja = targetWorker.unitKerja;
      }

      try {
        await updateDoc(doc(db, 'production_logs', logId), updatePayload);
        showToast('Seluruh perubahan data kinerja berhasil disimpan.', 'success');
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `production_logs/${logId}`);
      }
    },
    [user, isAdmin, workers, profile, showToast],
  );

  const updateProductionLog = useCallback(
    async (logId: string, draft: ProductionLogDraft) => {
      if (!user || !profile) throw new Error('Profil pekerja belum siap.');
      const productionDate = draft.productionDate.trim();
      if (!BLUEPRINT_LIMITS.productionLog.datePattern.test(productionDate)) {
        throw new Error('Format tanggal produksi harus YYYY-MM-DD.');
      }
      const monthKey = productionDate.slice(0, 7);
      const activityTitle = draft.activityTitle.trim().slice(0, BLUEPRINT_LIMITS.productionLog.activityTitleMax);
      if (activityTitle.length < BLUEPRINT_LIMITS.productionLog.activityTitleMin) {
        throw new Error('Judul aktivitas minimal 3 karakter.');
      }
      const quantity = Number(draft.quantity);
      if (!Number.isFinite(quantity) || quantity <= 0 || quantity > BLUEPRINT_LIMITS.productionLog.quantityMax) {
        throw new Error('Jumlah output harus lebih dari 0.');
      }
      const unitMeasure = draft.unitMeasure.trim().slice(0, BLUEPRINT_LIMITS.productionLog.unitMeasureMax);
      const notes = draft.notes.trim().slice(0, BLUEPRINT_LIMITS.productionLog.notesMax);

      try {
        await updateDoc(doc(db, 'production_logs', logId), {
          workerName: profile.displayName,
          unitKerja: profile.unitKerja,
          productionDate,
          monthKey,
          activityTitle,
          category: draft.category,
          quantity,
          unitMeasure,
          notes,
          status: 'pending',
          validatedBy: null,
          validatedByName: null,
          validationNotes: '',
          validatedAt: null,
          updatedAt: serverTimestamp(),
        });
        showToast('Catatan kinerja diperbarui dan diajukan ulang untuk validasi.', 'success');
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `production_logs/${logId}`);
      }
    },
    [user, profile, showToast],
  );

  const deleteProductionLog = useCallback(
    async (logId: string) => {
      try {
        await deleteDoc(doc(db, 'production_logs', logId));
        showToast('Catatan kinerja dihapus.', 'info');
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `production_logs/${logId}`);
      }
    },
    [showToast],
  );

  const validateProductionLog = useCallback(
    async (
      logId: string,
      status: Exclude<LogStatus, 'pending'>,
      validationNotes: string,
    ) => {
      if (!user || !isAdmin) throw new Error('Hanya Admin Validator yang dapat memvalidasi.');
      const cleanNotes = validationNotes
        .trim()
        .slice(0, BLUEPRINT_LIMITS.productionLog.validationNotesMax);
      const validatorName = (
        profile?.displayName ||
        user.displayName ||
        user.email ||
        'Admin Validator'
      ).slice(0, 100);

      try {
        await updateDoc(doc(db, 'production_logs', logId), {
          status,
          validatedBy: user.uid,
          validatedByName: validatorName,
          validationNotes: cleanNotes,
          validatedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        showToast(
          status === 'approved'
            ? 'Data kinerja disetujui & dikunci.'
            : 'Data dikembalikan untuk revisi pekerja.',
          status === 'approved' ? 'success' : 'info',
        );
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `production_logs/${logId}`);
      }
    },
    [user, isAdmin, profile, showToast],
  );

  const saveMonthlyTarget = useCallback(
    async (payload: {
      monthKey: string;
      targetTotalOutput: number;
      workingDaysTarget: number;
      dailyPerWorkerTarget: number;
      notes: string;
    }) => {
      if (!user || !isAdmin) throw new Error('Hanya Admin yang dapat mengatur target.');
      const targetTotalOutput = Number(payload.targetTotalOutput);
      const workingDaysTarget = Math.floor(Number(payload.workingDaysTarget));
      const dailyPerWorkerTarget = Number(payload.dailyPerWorkerTarget);
      const notes = payload.notes.trim().slice(0, BLUEPRINT_LIMITS.monthlyTarget.notesMax);

      if (!BLUEPRINT_LIMITS.productionLog.monthPattern.test(payload.monthKey)) {
        throw new Error('Format bulan tidak valid.');
      }
      if (targetTotalOutput <= 0 || targetTotalOutput > BLUEPRINT_LIMITS.monthlyTarget.targetTotalOutputMax) {
        throw new Error('Target total output tidak valid.');
      }

      try {
        await setDoc(doc(db, 'monthly_targets', payload.monthKey), {
          monthKey: payload.monthKey,
          sectionCode: SECTION_CODE,
          targetTotalOutput,
          workingDaysTarget: Math.max(1, Math.min(31, workingDaysTarget)),
          dailyPerWorkerTarget: Math.max(0.1, dailyPerWorkerTarget),
          notes,
          updatedBy: user.uid,
          updatedAt: serverTimestamp(),
        });
        showToast(`Target bulan ${payload.monthKey} berhasil disimpan.`, 'success');
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `monthly_targets/${payload.monthKey}`);
      }
    },
    [user, isAdmin, showToast],
  );

  const deleteMonthlyTarget = useCallback(
    async (monthKey: string) => {
      if (!user || !isAdmin) throw new Error('Hanya Admin yang dapat menghapus target.');
      try {
        await deleteDoc(doc(db, 'monthly_targets', monthKey));
        showToast(`Target bulan ${monthKey} dihapus.`, 'info');
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `monthly_targets/${monthKey}`);
      }
    },
    [user, isAdmin, showToast],
  );

  const adminUpdateWorkerProfile = useCallback(
    async (
      targetUid: string,
      updates: {
        displayName: string;
        unitKerja: string;
        jabatan: string;
        dailyReminderEnabled: boolean;
        reminderHour: number;
      },
    ) => {
      if (!user || !isAdmin) throw new Error('Hanya Admin yang dapat mengubah profil pekerja.');
      const displayName = updates.displayName
        .trim()
        .slice(0, BLUEPRINT_LIMITS.workerProfile.displayNameMax);
      const unitKerja = updates.unitKerja
        .trim()
        .slice(0, BLUEPRINT_LIMITS.workerProfile.unitKerjaMax);
      const jabatan = updates.jabatan.trim().slice(0, BLUEPRINT_LIMITS.workerProfile.jabatanMax);

      if (displayName.length < BLUEPRINT_LIMITS.workerProfile.displayNameMin) {
        throw new Error('Nama lengkap minimal 2 karakter.');
      }
      if (unitKerja.length < BLUEPRINT_LIMITS.workerProfile.unitKerjaMin) {
        throw new Error('Unit kerja minimal 2 karakter.');
      }
      if (jabatan.length < BLUEPRINT_LIMITS.workerProfile.jabatanMin) {
        throw new Error('Jabatan minimal 2 karakter.');
      }
      const reminderHour = Math.max(0, Math.min(23, Math.floor(updates.reminderHour)));

      try {
        await updateDoc(doc(db, 'worker_profiles', targetUid), {
          displayName,
          unitKerja,
          jabatan,
          dailyReminderEnabled: Boolean(updates.dailyReminderEnabled),
          reminderHour,
          updatedAt: serverTimestamp(),
        });
        showToast(`Profil ${displayName} berhasil diperbarui.`, 'success');
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `worker_profiles/${targetUid}`);
      }
    },
    [user, isAdmin, showToast],
  );

  const adminDeleteWorkerProfile = useCallback(
    async (targetUid: string) => {
      if (!user || !isAdmin) throw new Error('Hanya Admin yang dapat menghapus profil pekerja.');
      if (targetUid === user.uid) throw new Error('Tidak dapat menghapus profil Anda sendiri.');
      try {
        await deleteDoc(doc(db, 'worker_profiles', targetUid));
        showToast('Profil pekerja dihapus dari daftar seksi.', 'info');
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `worker_profiles/${targetUid}`);
      }
    },
    [user, isAdmin, showToast],
  );

  const grantAdminAccess = useCallback(
    async (targetWorker: WorkerProfile) => {
      if (!user || !isAdmin) throw new Error('Hanya Admin yang dapat memberi akses validator.');
      try {
        await setDoc(doc(db, 'admins', targetWorker.uid), {
          uid: targetWorker.uid,
          grantedBy: user.uid,
          displayName: targetWorker.displayName.slice(0, 100),
          createdAt: serverTimestamp(),
        });
        showToast(`${targetWorker.displayName} ditambahkan sebagai Admin Validator.`, 'success');
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `admins/${targetWorker.uid}`);
      }
    },
    [user, isAdmin, showToast],
  );

  const revokeAdminAccess = useCallback(
    async (targetUid: string) => {
      if (!user || !isAdmin) throw new Error('Hanya Admin yang dapat mencabut akses.');
      if (targetUid === user.uid) throw new Error('Tidak dapat mencabut akses Anda sendiri.');
      try {
        await deleteDoc(doc(db, 'admins', targetUid));
        showToast('Akses Admin Validator dicabut.', 'info');
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `admins/${targetUid}`);
      }
    },
    [user, isAdmin, showToast],
  );

  const seedInitialOktoberData = useCallback(async () => {
    if (!user || !isAdmin) {
      throw new Error('Hanya Admin yang dapat mengimpor data awal.');
    }
    setSeedingData(true);
    try {
      // 1. Seed or update canonical 8 operator profiles & Vendor Percetakan Offset
      const existingWorkersSnap = await getDocs(
        query(collection(db, 'worker_profiles'), where('sectionCode', '==', SECTION_CODE)),
      );
      const existingWorkersMap = new Map(
        existingWorkersSnap.docs.map((d) => [d.id, d.data() as WorkerProfile]),
      );

      const workerBatch = writeBatch(db);
      let workerWrites = 0;

      for (const w of INITIAL_WORKERS) {
        const existingW = existingWorkersMap.get(w.uid);
        if (!existingW) {
          workerBatch.set(doc(db, 'worker_profiles', w.uid), {
            uid: w.uid,
            displayName: w.displayName,
            unitKerja: w.unitKerja,
            jabatan: w.jabatan,
            sectionCode: SECTION_CODE,
            dailyReminderEnabled: true,
            reminderHour: 16,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
          workerWrites += 1;
        } else if (
          existingW.displayName !== w.displayName ||
          existingW.unitKerja !== w.unitKerja ||
          existingW.jabatan !== w.jabatan
        ) {
          workerBatch.update(doc(db, 'worker_profiles', w.uid), {
            displayName: w.displayName,
            unitKerja: w.unitKerja,
            jabatan: w.jabatan,
            updatedAt: serverTimestamp(),
          });
          workerWrites += 1;
        }
      }

      if (workerWrites > 0) {
        await workerBatch.commit();
      }

      // 2. Seed October monthly target if missing
      const targetRef = doc(db, 'monthly_targets', INITIAL_OKTOBER_TARGET.monthKey);
      const existingTargetSnap = await getDoc(targetRef);
      if (!existingTargetSnap.exists()) {
        await setDoc(targetRef, {
          ...INITIAL_OKTOBER_TARGET,
          updatedBy: user.uid,
          updatedAt: serverTimestamp(),
        });
      }

      // 3. Seed missing logs & migrate existing October rows to updated 10 categories & operator names
      const existingLogsSnap = await getDocs(
        query(collection(db, 'production_logs'), where('sectionCode', '==', SECTION_CODE)),
      );
      const existingLogsMap = new Map(
        existingLogsSnap.docs.map((d) => [d.id, d.data() as Omit<ProductionLog, 'id'>]),
      );

      const validCategorySet = new Set<string>(PRODUCTION_CATEGORIES);
      const deprecatedWorkerSet = new Set<string>(DEPRECATED_SEED_WORKER_IDS);

      const validatorName = (
        profile?.displayName ||
        user.displayName ||
        user.email ||
        'Admin Validator'
      ).slice(0, 100);

      type LogSyncOp =
        | { kind: 'set'; item: SeedProductionLog }
        | { kind: 'update'; item: SeedProductionLog; currentStatus: LogStatus };

      const logOps: LogSyncOp[] = [];
      let addedCount = 0;
      let migratedCount = 0;

      for (const item of INITIAL_OKTOBER_LOGS) {
        const existingLog = existingLogsMap.get(item.id);
        if (!existingLog) {
          logOps.push({ kind: 'set', item });
          addedCount += 1;
        } else if (
          deprecatedWorkerSet.has(existingLog.workerId) ||
          !validCategorySet.has(existingLog.category) ||
          existingLog.workerId !== item.workerId ||
          existingLog.workerName !== item.workerName ||
          existingLog.unitKerja !== item.unitKerja ||
          existingLog.category !== item.category
        ) {
          logOps.push({
            kind: 'update',
            item,
            currentStatus: existingLog.status,
          });
          migratedCount += 1;
        }
      }

      if (logOps.length > 0) {
        const chunkSize = 300;
        for (let i = 0; i < logOps.length; i += chunkSize) {
          const chunk = logOps.slice(i, i + chunkSize);
          const lBatch = writeBatch(db);
          for (const op of chunk) {
            const logRef = doc(db, 'production_logs', op.item.id);
            if (op.kind === 'set') {
              const isPending = op.item.status === 'pending';
              lBatch.set(logRef, {
                workerId: op.item.workerId,
                workerName: op.item.workerName,
                unitKerja: op.item.unitKerja,
                sectionCode: SECTION_CODE,
                productionDate: op.item.productionDate,
                monthKey: op.item.productionDate.slice(0, 7),
                activityTitle: op.item.activityTitle,
                category: op.item.category,
                quantity: op.item.quantity,
                unitMeasure: op.item.unitMeasure,
                notes: op.item.notes,
                status: op.item.status,
                validatedBy: isPending ? null : user.uid,
                validatedByName: isPending ? null : validatorName,
                validationNotes: isPending ? '' : 'Data awal Laporan Order & Distribusi Oktober',
                validatedAt: isPending ? null : serverTimestamp(),
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
              });
            } else {
              const isPending = op.currentStatus === 'pending';
              lBatch.update(logRef, {
                workerId: op.item.workerId,
                workerName: op.item.workerName,
                unitKerja: op.item.unitKerja,
                activityTitle: op.item.activityTitle,
                category: op.item.category,
                notes: op.item.notes,
                validatedBy: isPending ? null : user.uid,
                validatedByName: isPending ? null : validatorName,
                validatedAt: isPending ? null : serverTimestamp(),
                updatedAt: serverTimestamp(),
              });
            }
          }
          await lBatch.commit();
        }
      }

      // 4. Clean up deprecated seed worker profiles (e.g., op-tanjung & combined operator IDs)
      const deprecatedToDelete = DEPRECATED_SEED_WORKER_IDS.filter((id) =>
        existingWorkersMap.has(id),
      );
      if (deprecatedToDelete.length > 0) {
        const delBatch = writeBatch(db);
        for (const id of deprecatedToDelete) {
          delBatch.delete(doc(db, 'worker_profiles', id));
        }
        await delBatch.commit();
      }

      localStorage.setItem('lintasteknis_seeded_okt26', 'true');
      localStorage.setItem('lintasteknis_migrated_v2', 'true');
      setSelectedMonthState('2026-10');

      if (addedCount > 0 || migratedCount > 0 || deprecatedToDelete.length > 0) {
        showToast(
          `Sinkronisasi selesai: ${addedCount} catatan baru, ${migratedCount} catatan diperbarui ke kategori mesin & profil operator terbaru.`,
          'success',
        );
      } else {
        showToast('Seluruh data awal Laporan Oktober & profil operator sudah mutakhir.', 'success');
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'production_logs');
    } finally {
      setSeedingData(false);
    }
  }, [user, isAdmin, profile, showToast]);

  // Auto-seed or migrate October PDF data once when Admin signs in
  useEffect(() => {
    if (!authReady || !user || !isAdmin || !logsInitialized || seedingData) return;
    const needsInitialSeed = logs.length === 0;
    const validCategories = new Set<string>(PRODUCTION_CATEGORIES);
    const hasDeprecatedWorkers = workers.some((w) => DEPRECATED_SEED_WORKER_IDS.includes(w.uid));
    const hasLegacyLogs = logs.some(
      (l) =>
        !validCategories.has(l.category) ||
        DEPRECATED_SEED_WORKER_IDS.includes(l.workerId) ||
        (l.id.startsWith('okt26-row-') && l.workerName === l.workerName.toUpperCase()),
    );
    const needsMigration =
      !localStorage.getItem('lintasteknis_migrated_v2') && (hasDeprecatedWorkers || hasLegacyLogs);

    if ((needsInitialSeed || needsMigration) && !autoSeedAttemptedRef.current) {
      autoSeedAttemptedRef.current = true;
      void seedInitialOktoberData();
    }
  }, [
    authReady,
    user,
    isAdmin,
    logsInitialized,
    logs,
    workers,
    seedingData,
    seedInitialOktoberData,
  ]);

  // Auto-focus 2026-10 when current month has no logs yet and October PDF data exists
  useEffect(() => {
    if (!logsInitialized || logs.length === 0 || userChangedMonthRef.current) return;
    const hasCurrentMonth = logs.some((l) => l.monthKey === selectedMonth);
    const hasOktober = logs.some((l) => l.monthKey === '2026-10');
    if (!hasCurrentMonth && hasOktober) {
      setSelectedMonthState('2026-10');
    }
  }, [logsInitialized, logs, selectedMonth]);

  const value = useMemo<FirebaseContextValue>(
    () => ({
      user,
      authReady,
      portalMode,
      setPortalMode,
      isAdmin,
      adminAccessDenied,
      clearAdminDenied,
      profile,
      workers,
      admins,
      logs,
      targets,
      selectedMonth,
      setSelectedMonth,
      loadingData,
      hasLoggedToday,
      browserNotificationPermission,
      requestBrowserNotifications,
      triggerTestReminder,
      loginWithGoogle,
      logout,
      updateMyProfile,
      createProductionLog,
      updateProductionLog,
      adminCreateProductionLog,
      adminUpdateProductionLog,
      deleteProductionLog,
      validateProductionLog,
      saveMonthlyTarget,
      deleteMonthlyTarget,
      adminUpdateWorkerProfile,
      adminDeleteWorkerProfile,
      grantAdminAccess,
      revokeAdminAccess,
      seedingData,
      seedInitialOktoberData,
      toastMessage,
      dismissToast,
      showToast,
    }),
    [
      user,
      authReady,
      portalMode,
      setPortalMode,
      isAdmin,
      adminAccessDenied,
      clearAdminDenied,
      profile,
      workers,
      admins,
      logs,
      targets,
      selectedMonth,
      setSelectedMonth,
      loadingData,
      hasLoggedToday,
      browserNotificationPermission,
      requestBrowserNotifications,
      triggerTestReminder,
      loginWithGoogle,
      logout,
      updateMyProfile,
      createProductionLog,
      updateProductionLog,
      adminCreateProductionLog,
      adminUpdateProductionLog,
      deleteProductionLog,
      validateProductionLog,
      saveMonthlyTarget,
      deleteMonthlyTarget,
      adminUpdateWorkerProfile,
      adminDeleteWorkerProfile,
      grantAdminAccess,
      revokeAdminAccess,
      seedingData,
      seedInitialOktoberData,
      toastMessage,
      dismissToast,
      showToast,
    ],
  );

  return <FirebaseContext.Provider value={value}>{children}</FirebaseContext.Provider>;
}

export function useFirebase(): FirebaseContextValue {
  const ctx = useContext(FirebaseContext);
  if (!ctx) throw new Error('useFirebase must be used inside FirebaseProvider');
  return ctx;
}
