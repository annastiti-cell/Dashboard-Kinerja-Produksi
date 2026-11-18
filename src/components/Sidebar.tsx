import React from 'react';
import {
  Bell,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Settings,
  ShieldCheck,
  Target,
  X,
} from 'lucide-react';
import { useFirebase } from '../context/FirebaseContext';

export type ActiveTab =
  | 'dashboard'
  | 'logs'
  | 'reminders'
  | 'admin_validation'
  | 'admin_targets';

interface SidebarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  pendingCount: number;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  onOpenProfileModal: () => void;
}

export function Sidebar({
  activeTab,
  onSelectTab,
  pendingCount,
  mobileOpen,
  onCloseMobile,
  onOpenProfileModal,
}: SidebarProps) {
  const {
    user,
    profile,
    isAdmin,
    portalMode,
    setPortalMode,
    hasLoggedToday,
    logout,
  } = useFirebase();

  const handleNav = (tab: ActiveTab) => {
    onSelectTab(tab);
    onCloseMobile();
  };

  const navItems: {
    id: ActiveTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    meta?: string;
    adminOnly?: boolean;
  }[] = [
    {
      id: 'dashboard',
      label: 'Dasbor Bulanan',
      icon: LayoutDashboard,
    },
    {
      id: 'logs',
      label: 'Catatan Kinerja',
      icon: ClipboardList,
    },
    {
      id: 'reminders',
      label: 'Pengingat Harian',
      icon: Bell,
      meta: hasLoggedToday ? 'Tercatat' : 'Belum',
    },
    {
      id: 'admin_validation',
      label: 'Validasi Data Masuk',
      icon: ShieldCheck,
      meta: pendingCount > 0 ? String(pendingCount) : undefined,
      adminOnly: true,
    },
    {
      id: 'admin_targets',
      label: 'Target & Validator',
      icon: Target,
      adminOnly: true,
    },
  ];

  const visibleItems = navItems.filter((item) => !item.adminOnly || isAdmin);

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white border-r border-slate-200 w-64">
      <div className="h-16 px-5 border-b border-slate-200 flex items-center justify-between">
        <span className="font-display text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap">
          LintasTeknis
        </span>
        <button
          type="button"
          onClick={onCloseMobile}
          aria-label="Tutup menu"
          className="lg:hidden p-1.5 text-slate-500 hover:text-slate-900 rounded-md"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="px-4 py-4 border-b border-slate-200">
        <p className="text-xs font-medium text-slate-500 mb-2">
          {isAdmin ? 'Mode Portal Aktif' : 'Portal Akses'}
        </p>
        {isAdmin ? (
          <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-lg">
            <button
              type="button"
              onClick={() => {
                setPortalMode('worker');
                if (activeTab.startsWith('admin_')) handleNav('dashboard');
              }}
              className={`px-2.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                portalMode === 'worker'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Pekerja
            </button>
            <button
              type="button"
              onClick={() => {
                setPortalMode('admin');
                handleNav('admin_validation');
              }}
              className={`px-2.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                portalMode === 'admin'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Admin
            </button>
          </div>
        ) : (
          <p className="text-xs font-semibold text-slate-800">
            Pekerja · Seksi Pelayanan Teknis
          </p>
        )}
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto" aria-label="Navigasi Utama">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const active = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleNav(item.id)}
              className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
                active
                  ? 'bg-blue-50 text-blue-800'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <span className="flex items-center gap-2.5 min-w-0">
                <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-blue-700' : 'text-slate-400'}`} />
                <span className="truncate">{item.label}</span>
              </span>
              {item.meta && (
                <span
                  className={`font-mono text-xs tabular-nums shrink-0 ${
                    item.id === 'admin_validation'
                      ? 'text-amber-700 font-semibold'
                      : hasLoggedToday
                        ? 'text-emerald-700'
                        : 'text-amber-700'
                  }`}
                >
                  {item.meta}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-200 space-y-3">
        <div className="space-y-0.5">
          <p className="text-sm font-semibold text-slate-900 truncate">
            {profile?.displayName || user?.displayName || 'Pengguna'}
          </p>
          <p className="text-xs text-slate-500 truncate">
            {profile?.jabatan || 'Petugas Teknis'} · {profile?.unitKerja || 'Pelayanan Teknis'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenProfileModal}
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap"
          >
            <Settings className="w-3.5 h-3.5" />
            Profil
          </button>
          <button
            type="button"
            onClick={() => void logout()}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors whitespace-nowrap"
          >
            <LogOut className="w-3.5 h-3.5" />
            Keluar
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:block shrink-0">{sidebarContent}</aside>
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/40"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <div className="relative z-10 h-full">{sidebarContent}</div>
        </div>
      )}
    </>
  );
}
