import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Bell,
  ChevronLeft,
  ChevronRight,
  Menu,
  Plus,
  X,
} from 'lucide-react';
import { AdminTargetAndRolesView } from './components/AdminTargetAndRolesView';
import { AdminValidationView } from './components/AdminValidationView';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LoginPortal } from './components/LoginPortal';
import { MonthlyDashboard } from './components/MonthlyDashboard';
import { ProductionInputModal } from './components/ProductionInputModal';
import { ProductionLogTable } from './components/ProductionLogTable';
import { ProfileSettingsModal } from './components/ProfileSettingsModal';
import { ReminderCenterView } from './components/ReminderCenterView';
import { Sidebar, type ActiveTab } from './components/Sidebar';
import { FirebaseProvider, useFirebase } from './context/FirebaseContext';
import type { ProductionLog } from './types';
import {
  formatIndonesianDate,
  formatMonthLabel,
  getTodayLocalDate,
  shiftMonthKey,
} from './utils/dateUtils';

const TAB_TITLES: Record<ActiveTab, string> = {
  dashboard: 'Dasbor Capaian Bulanan',
  logs: 'Catatan Kinerja Produksi',
  reminders: 'Pengingat Input Harian',
  admin_validation: 'Validasi Data Masuk (Admin)',
  admin_targets: 'Target Bulanan & Hak Akses Validator',
};

function WorkspaceApp() {
  const {
    user,
    authReady,
    isAdmin,
    portalMode,
    adminAccessDenied,
    clearAdminDenied,
    logs,
    selectedMonth,
    setSelectedMonth,
    hasLoggedToday,
    toastMessage,
    dismissToast,
  } = useFirebase();

  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [inputModalOpen, setInputModalOpen] = useState(false);
  const [inputInitialDate, setInputInitialDate] = useState<string | undefined>(undefined);
  const [editingLog, setEditingLog] = useState<ProductionLog | null>(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [reminderDismissed, setReminderDismissed] = useState(false);

  // When entering as Admin via Admin Portal, open validation queue automatically
  useEffect(() => {
    if (authReady && user && isAdmin && portalMode === 'admin') {
      setActiveTab('admin_validation');
    } else if (authReady && user && !isAdmin && activeTab.startsWith('admin_')) {
      setActiveTab('dashboard');
    }
  }, [authReady, user, isAdmin, portalMode]);

  const monthLogs = useMemo(
    () => logs.filter((l) => l.monthKey === selectedMonth),
    [logs, selectedMonth],
  );

  const pendingCount = useMemo(
    () => monthLogs.filter((l) => l.status === 'pending').length,
    [monthLogs],
  );

  const myRejectedCount = useMemo(
    () => logs.filter((l) => l.workerId === user?.uid && l.status === 'rejected').length,
    [logs, user?.uid],
  );

  const openCreateModal = (dateStr?: string) => {
    setEditingLog(null);
    setInputInitialDate(dateStr ?? getTodayLocalDate());
    setInputModalOpen(true);
  };

  const openEditModal = (log: ProductionLog) => {
    setEditingLog(log);
    setInputInitialDate(log.productionDate);
    setInputModalOpen(true);
  };

  if (!authReady) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-2">
          <p className="font-display text-lg font-bold text-slate-900">LintasTeknis</p>
          <p className="text-xs text-slate-500">Memuat sesi dan sinkronisasi data...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPortal />;
  }

  const today = getTodayLocalDate();

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        pendingCount={pendingCount}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
        onOpenProfileModal={() => setProfileModalOpen(true)}
      />

      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between gap-4 sticky top-0 z-30">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Buka menu navigasi"
              className="lg:hidden p-2 -ml-2 text-slate-600 hover:text-slate-900 rounded-lg"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-sm min-w-0">
              <span className="hidden sm:inline text-slate-500 whitespace-nowrap">
                Seksi Pelayanan Teknis
              </span>
              <span className="hidden sm:inline text-slate-300" aria-hidden="true">
                /
              </span>
              <h1 className="font-display font-semibold text-slate-900 truncate">
                {TAB_TITLES[activeTab]}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center border border-slate-200 rounded-lg bg-slate-50 p-0.5">
              <button
                type="button"
                onClick={() => setSelectedMonth(shiftMonthKey(selectedMonth, -1))}
                aria-label="Bulan sebelumnya"
                className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded-md transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-2.5 text-xs font-semibold text-slate-800 whitespace-nowrap tabular-nums">
                {formatMonthLabel(selectedMonth)}
              </span>
              <button
                type="button"
                onClick={() => setSelectedMonth(shiftMonthKey(selectedMonth, 1))}
                aria-label="Bulan berikutnya"
                className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded-md transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => openCreateModal(today)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Catat Kinerja</span>
            </button>
          </div>
        </header>

        {/* Main Viewport */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          {/* Admin access denied notice when non-admin tried Admin portal */}
          {adminAccessDenied && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-700 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-red-900">
                    Akun Anda Belum Terdaftar sebagai Admin Validator
                  </p>
                  <p className="text-xs text-red-700 leading-relaxed">
                    Anda dialihkan ke Portal Pekerja. Hubungi Pengelola Layanan Operasional jika akun Anda memerlukan hak akses validasi Admin.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={clearAdminDenied}
                aria-label="Tutup pemberitahuan"
                className="p-1 text-red-600 hover:text-red-900 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Automatic Daily Reminder Banner */}
          {!hasLoggedToday && !reminderDismissed && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <Bell className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="text-sm font-semibold text-slate-900">
                    Pengingat Harian: Belum Ada Input Kinerja untuk {formatIndonesianDate(today)}
                  </p>
                  <p className="text-xs text-slate-700">
                    Catat pekerjaan produksi Anda hari ini secara langsung agar tanggal pelaksanaan tercatat akurat dan tidak menumpuk di akhir bulan.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => openCreateModal(today)}
                  className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors whitespace-nowrap"
                >
                  Input Hari Ini
                </button>
                <button
                  type="button"
                  onClick={() => setReminderDismissed(true)}
                  aria-label="Sembunyikan pengingat sementara"
                  className="p-2 text-slate-500 hover:text-slate-900 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Revision Alert if worker has rejected logs */}
          {myRejectedCount > 0 && activeTab !== 'logs' && (
            <div className="bg-white border border-red-200 rounded-xl px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <p className="text-xs text-slate-700">
                <span className="font-semibold text-red-700">
                  {myRejectedCount} catatan Anda memerlukan revisi
                </span>{' '}
                berdasarkan tinjauan Admin Validator.
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('logs')}
                className="text-xs font-semibold text-red-700 hover:underline whitespace-nowrap shrink-0 text-left"
              >
                Periksa & Ajukan Ulang
              </button>
            </div>
          )}

          {activeTab === 'dashboard' && (
            <MonthlyDashboard
              monthLogs={monthLogs}
              onQuickLogForDate={(dateStr) => openCreateModal(dateStr)}
              onOpenValidation={() => setActiveTab('admin_validation')}
            />
          )}

          {activeTab === 'logs' && (
            <ProductionLogTable
              monthLogs={monthLogs}
              onAddLog={() => openCreateModal(today)}
              onEditLog={openEditModal}
            />
          )}

          {activeTab === 'reminders' && (
            <ReminderCenterView
              allLogs={logs}
              onQuickLogToday={() => openCreateModal(today)}
            />
          )}

          {activeTab === 'admin_validation' && (
            <AdminValidationView
              monthLogs={monthLogs}
              onEditLog={openEditModal}
            />
          )}

          {activeTab === 'admin_targets' && <AdminTargetAndRolesView />}
        </main>
      </div>

      {/* Modals */}
      <ProductionInputModal
        open={inputModalOpen}
        onClose={() => {
          setInputModalOpen(false);
          setEditingLog(null);
        }}
        initialDate={inputInitialDate}
        editingLog={editingLog}
      />

      <ProfileSettingsModal
        open={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 max-w-md bg-slate-900 text-white px-4 py-3 rounded-xl shadow-lg flex items-start gap-3 border border-slate-800">
          <p className="text-xs leading-relaxed flex-1">{toastMessage.text}</p>
          <button
            type="button"
            onClick={dismissToast}
            aria-label="Tutup notifikasi"
            className="p-0.5 text-slate-400 hover:text-white shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <FirebaseProvider>
        <WorkspaceApp />
      </FirebaseProvider>
    </ErrorBoundary>
  );
}
