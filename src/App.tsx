import { useState, useEffect } from 'react';
import { Search, LayoutDashboard, Users, UserSquare2, Wallet, Database, X, Menu, Wifi, WifiOff, RefreshCw, Settings, Building2, ShieldCheck, LogOut, UserCheck, Crown } from 'lucide-react';
import Dashboard from './components/Dashboard';
import StudentsPage from './components/StudentsPage';
import FinancialsPage from './components/FinancialsPage';
import TeachersPage from './components/TeachersPage';
import SettingsModal from './components/SettingsModal';
import UpgradeModal from './components/UpgradeModal';
import { TechSupportButton } from './components/TechSupportButton';
import ActivationScreen from './components/ActivationScreen';
import LoginScreen from './components/LoginScreen';
import { AdminUnlockModal } from './components/AdminUnlockModal';
import { getStoredLicense, LicenseInfo } from './lib/license';
import { CommandPalette } from './components/CommandPalette';
import { Maximize, Minimize } from 'lucide-react';
import { getActiveSessionUser, clearActiveSession, setActiveSessionUser } from './lib/auth';
import { LocalUser } from './lib/settings';
import { useLanguage } from './i18n';
import { syncService } from './lib/syncService';
import { useSchoolSettings } from './lib/settings';
import { SyncState } from './types';

export default function App() {
  const { t } = useLanguage();
  const { settings } = useSchoolSettings();
  const [license, setLicense] = useState<LicenseInfo | null>(() => getStoredLicense());
  const [currentUser, setCurrentUser] = useState<LocalUser | null>(() => getActiveSessionUser());
  const [showAdminUnlockModal, setShowAdminUnlockModal] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [zenMode, setZenMode] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [syncState, setSyncState] = useState<SyncState>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    pendingCount: 0,
    isSyncing: false,
    lastSyncTime: null
  });
  const [syncToast, setSyncToast] = useState<string | null>(null);

  const effectiveUser = currentUser || (settings.users ? settings.users.find(u => u.role === 'admin') : null) || { id: 'admin', name: 'المدير الأساسي', role: 'admin', username: 'admin', pin: '0000', active: true, createdAt: new Date().toISOString() };


  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowCommandPalette(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Listen to license updates across the app
  useEffect(() => {
    const handleLicenseUpdate = () => {
      setLicense(getStoredLicense());
    };
    window.addEventListener('masar-license-updated', handleLicenseUpdate);
    return () => window.removeEventListener('masar-license-updated', handleLicenseUpdate);
  }, []);

  // Listen to session authentication updates
  useEffect(() => {
    const handleAuthUpdate = () => {
      setCurrentUser(getActiveSessionUser());
    };
    window.addEventListener('masar_auth_changed', handleAuthUpdate);
    return () => window.removeEventListener('masar_auth_changed', handleAuthUpdate);
  }, []);

  const [academicYear, setAcademicYear] = useState(() => {
    return localStorage.getItem('academic_year') || settings.activeAcademicYear || settings.academicYear || '2025/2026';
  });

  useEffect(() => {
    if (settings.activeAcademicYear) {
      setAcademicYear(settings.activeAcademicYear);
      localStorage.setItem('academic_year', settings.activeAcademicYear);
    }
  }, [settings.activeAcademicYear]);

  // Lock to Professional Light Theme
  useEffect(() => {
    document.documentElement.classList.remove('dark');
    localStorage.removeItem('theme');
  }, []);

  // Subscribe to syncService state updates
  useEffect(() => {
    const unsubscribe = syncService.subscribe((state) => {
      setSyncState(state);
    });
    syncService.init();
    return () => unsubscribe();
  }, []);

  const handleManualSync = async () => {
    if (!syncState.isOnline) {
      setSyncToast('الجهاز غير متصل بالإنترنت حالياً. سيتم حفظ التغييرات محلياً ومزامنتها تلقائياً عند عودة الاتصال.');
      setTimeout(() => setSyncToast(null), 4000);
      return;
    }
    const result = await syncService.syncAllPending();
    if (result.syncedCount > 0) {
      setSyncToast(`تم مزامنة ${result.syncedCount} عملية بنجاح مع السحابة.`);
    } else {
      setSyncToast('جميع البيانات محدثة ومتزامنة بالكامل.');
    }
    setTimeout(() => setSyncToast(null), 3500);
  };
  
  const handleBackup = () => {
    if (effectiveUser?.role !== 'admin') {
      setShowAdminUnlockModal(true);
      return;
    }
    window.open('/api/backup', '_blank');
  };


  const handleCommandAction = (action: string) => {
    if (action === 'settings') {
      setShowSettingsModal(true);
    } else if (action === 'add-student') {
      // Need a way to trigger add student from outside. For now, we just navigate to students tab.
      setActiveTab('students');
      window.dispatchEvent(new CustomEvent('open-add-student'));
    } else if (action === 'add-payment') {
      setActiveTab('financials');
      window.dispatchEvent(new CustomEvent('open-add-payment'));
    }
  };

  const handleOpenSettings = () => {
    if (effectiveUser?.role !== 'admin') {
      setShowAdminUnlockModal(true);
      return;
    }
    setShowSettingsModal(true);
  };

  const handleLogout = () => {
    clearActiveSession();
    setCurrentUser(null);
  };

  const handleYearChange = (year: string) => {
    setAcademicYear(year);
    localStorage.setItem('academic_year', year);
    window.dispatchEvent(new CustomEvent('academicYearChanged', { detail: year }));
  };

  // Close mobile menu when tab changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [activeTab]);

  // 1. Activation Guard: If license is missing or invalid, require activation first
  if (!license || !license.isActivated) {
    return (
      <ActivationScreen 
        onActivated={(activatedLicense) => {
          setLicense(activatedLicense);
        }} 
      />
    );
  }

  // 2. Authentication Guard: If no active session, show Login Screen
  if (settings.requireLogin && !currentUser) {
    return (
      <LoginScreen
        onLoginSuccess={(user) => {
          setCurrentUser(user);
        }}
      />
    );
  }



  const isAdmin = effectiveUser.role === 'admin';

  return (
    <div className="h-screen w-full flex flex-col bg-slate-50 overflow-hidden font-sans text-slate-900">
      {/* Top Header Bar: Clean, Minimalist & Focused */}
      <header className="h-16 bg-white border-b border-slate-200/80 flex items-center justify-between px-5 md:px-8 select-none z-30 shrink-0">
        <div className="flex items-center gap-3.5">
          <button 
            className="md:hidden text-slate-700 hover:text-indigo-950 p-2 rounded-xl hover:bg-slate-100 transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="القائمة الجانبية"
          >
            <Menu size={20} />
          </button>
          
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-950 rounded-xl flex items-center justify-center text-amber-400 font-black text-sm shadow-xs">
              {settings.schoolName ? settings.schoolName.charAt(0) : 'م'}
            </div>
            <div>
              <span className="font-extrabold text-sm tracking-tight text-slate-900">
                {settings.schoolName || t('app_title')}
              </span>
              <span className="hidden sm:inline-block text-[11px] text-slate-400 ms-2 font-medium">
                {settings.schoolType || t('special_edu')}
              </span>
            </div>
          </div>
        </div>

        {/* Header Actions: User Profile & Admin Settings */}
        <div className="flex items-center gap-3 md:gap-4 text-slate-600">
          {/* Zen Mode Toggle */}
          <button
            onClick={() => setZenMode(!zenMode)}
            className={`hidden md:flex p-2 rounded-xl transition-colors ${zenMode ? 'bg-indigo-100 text-indigo-700' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
            title={zenMode ? "إيقاف وضع التركيز" : "تفعيل وضع التركيز (Zen Mode)"}
          >
            {zenMode ? <Minimize size={18} /> : <Maximize size={18} />}
          </button>

          {/* Command Palette Trigger */}
          <button 
            className="hidden lg:flex items-center justify-between gap-4 bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 px-3 py-1.5 rounded-xl transition-colors border border-slate-200"
            onClick={() => setShowCommandPalette(true)}
            title="البحث السريع أو الإجراءات"
          >
            <span className="text-xs font-bold flex items-center gap-2"><Search size={14} /> بحث، أوامر...</span>
            <kbd className="hidden sm:inline-block font-mono text-[10px] font-bold bg-white border border-slate-300 rounded px-1.5 py-0.5 text-slate-400">⌘K</kbd>
          </button>

          {/* Active User & Logout */}
          <div className="flex items-center gap-2 bg-slate-100/80 border border-slate-200/80 rounded-xl px-3 py-1.5">
            {isAdmin ? (
              <ShieldCheck size={15} className="text-indigo-600 shrink-0" />
            ) : (
              <UserCheck size={15} className="text-amber-600 shrink-0" />
            )}
            <span className="text-xs font-bold text-slate-800 max-w-[130px] truncate hidden sm:inline">
              {effectiveUser.name}
            </span>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
              isAdmin 
                ? 'bg-indigo-100 text-indigo-900' 
                : 'bg-amber-100 text-amber-900'
            }`}>
              {isAdmin ? 'مدير' : 'موظف'}
            </span>
            <button
              onClick={handleLogout}
              className="text-slate-400 hover:text-rose-600 p-1 ms-1 rounded-lg hover:bg-slate-200/60 transition-colors"
              title="تسجيل الخروج"
            >
              <LogOut size={14} />
            </button>
          </div>

          {/* Main Settings Button (Admin) */}
          {isAdmin && (
            <button
              onClick={handleOpenSettings}
              className="hover:text-indigo-950 hover:bg-slate-100 transition-colors px-3 py-1.5 rounded-xl flex items-center gap-1.5 font-bold text-xs text-slate-700 border border-slate-200/80 hover:border-slate-300 cursor-pointer"
              title="إعدادات وهوية المنظومة"
            >
              <Settings size={15} className="text-slate-500" />
              <span className="hidden sm:inline">الإعدادات</span>
            </button>
          )}
        </div>
      </header>

      {/* Floating Sync Toast Notification */}
      {syncToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[200] bg-indigo-950 text-white text-xs px-4 py-2 rounded-full shadow-lg border border-indigo-800 flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <span>{syncToast}</span>
        </div>
      )}

      {/* Global School Identity Settings Modal */}
      <SettingsModal isOpen={showSettingsModal} onClose={() => setShowSettingsModal(false)} />

      {/* Upgrade Plan Modal */}
      {showUpgradeModal && <UpgradeModal onClose={() => setShowUpgradeModal(false)} />}

      {/* Admin Unlock Modal */}
      <AdminUnlockModal
        isOpen={showAdminUnlockModal}
        onClose={() => setShowAdminUnlockModal(false)}
        onSuccess={(adminUser) => {
          setCurrentUser(adminUser);
          setShowSettingsModal(true);
        }}
      />

      <CommandPalette 
        isOpen={showCommandPalette} 
        onClose={() => setShowCommandPalette(false)}
        onNavigate={setActiveTab}
        onAction={handleCommandAction}
      />

      <div className="flex flex-1 overflow-hidden relative">
        {/* Mobile menu backdrop */}
        {isMobileMenuOpen && (
          <div 
            className="md:hidden fixed inset-0 bg-slate-900/50 z-40 backdrop-blur-xs"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* Sidebar: Clean, Quiet Midnight Navy with RTL Layout */}
        <aside className={`absolute start-0 md:static z-50 w-64 bg-[#0d1522] text-white flex flex-col justify-between py-6 shrink-0 h-full shadow-[4px_0_24px_rgba(0,0,0,0.04)] transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full rtl:translate-x-full'} ${zenMode ? 'md:hidden' : 'md:translate-x-0 md:rtl:translate-x-0'}`}>
          <div className="px-4 space-y-4">
            {/* Mobile Close Button */}
            <div className="md:hidden flex justify-end mb-1">
              <button onClick={() => setIsMobileMenuOpen(false)} className="text-white/60 hover:text-white p-1.5 rounded-lg hover:bg-white/10">
                <X size={18} />
              </button>
            </div>

            {/* School Logo & Title */}
            <div className="flex flex-col items-center justify-center mb-4 pt-1 text-center">
              <div 
                onClick={() => isAdmin ? setShowSettingsModal(true) : setShowAdminUnlockModal(true)}
                title={isAdmin ? "تعديل الشعار والهوية" : "مطلوب صلاحية المدير للتعديل"}
                className="w-18 h-18 rounded-2xl border border-white/15 p-1 mb-2.5 overflow-hidden bg-white/5 flex items-center justify-center group cursor-pointer hover:border-amber-400/80 transition-all"
              >
                {settings.logo ? (
                  <img 
                    src={settings.logo} 
                    alt={settings.schoolName} 
                    className="w-full h-full object-contain rounded-xl"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <Building2 size={30} className="text-amber-400/90 group-hover:scale-105 transition-transform" />
                )}
              </div>
              <h2 className="text-white font-black text-sm tracking-wide px-2 line-clamp-1" title={settings.schoolName}>
                {settings.schoolName}
              </h2>
              <p className="text-slate-400 text-[11px] mt-0.5 font-medium">
                {settings.schoolType || t('special_edu')}
              </p>
            </div>

            {/* Academic Year Selector */}
            <div className="mb-3 px-1">
              <label className="text-[11px] font-bold text-slate-400 mb-1.5 block">{t('academic_year')}</label>
              <select 
                value={academicYear}
                onChange={(e) => handleYearChange(e.target.value)}
                className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-3 py-2 text-xs outline-none focus:border-amber-400/80 transition-all cursor-pointer font-bold appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%2394a3b8%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.4-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:8px_8px] bg-no-repeat bg-[left_12px_center] rtl:bg-[left_12px_center]"
              >
                {(settings.academicYears || ['2024/2025', '2025/2026', '2026/2027']).map(year => (
                  <option key={year} value={year} className="bg-slate-900 text-white">
                    {year} {year === (settings.activeAcademicYear || settings.academicYear) ? '★ (النشطة)' : ''}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Sidebar Navigation Items */}
            <nav className="space-y-1 pt-1">
              <SidebarItem icon={<LayoutDashboard size={18} />} label={t('dashboard')} active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
              <SidebarItem icon={<Users size={18} />} label={t('students')} active={activeTab === 'students'} onClick={() => setActiveTab('students')} />
              <SidebarItem icon={<Wallet size={18} />} label={t('financials')} active={activeTab === 'financials'} onClick={() => setActiveTab('financials')} />
              <SidebarItem icon={<UserSquare2 size={18} />} label={t('teachers')} active={activeTab === 'teachers'} onClick={() => setActiveTab('teachers')} />
            </nav>

            {/* Upgrade Plan Button */}
            <div className="mt-4 pt-4 border-t border-white/10 px-1">
              <button 
                onClick={() => setShowUpgradeModal(true)}
                className="w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 text-xs font-bold bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-600/30 hover:text-white group"
              >
                <div className="flex items-center gap-2">
                  <Crown size={16} className={settings.subscriptionPlan === 'enterprise' ? 'text-amber-400' : 'text-indigo-400 group-hover:text-indigo-300'} />
                  <span>{settings.subscriptionPlan === 'enterprise' ? 'مسار إنتربرايز' : 'ترقية الباقة'}</span>
                </div>
                {settings.subscriptionPlan !== 'enterprise' && (
                  <span className="bg-indigo-600 text-white text-[10px] px-2 py-0.5 rounded-full">جديد</span>
                )}
              </button>
            </div>
          </div>

          <div className="px-4 space-y-2">
            {/* Tech Support Button (Only placed here in sidebar, quiet & clear) */}
            <TechSupportButton variant="sidebar" />

            {/* Backup Button (Admin) */}
            {isAdmin && (
              <button 
                onClick={handleBackup}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-all border border-transparent hover:border-white/10 text-xs font-semibold cursor-pointer"
              >
                <Database size={16} className="text-amber-400/90" />
                <span>{t('backup')}</span>
              </button>
            )}
          </div>
        </aside>

        {/* Main Content Area: Generous Whitespace */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 lg:p-10 bg-slate-50 w-full">
          <div className="max-w-7xl mx-auto h-full pb-12">
            {activeTab === 'dashboard' && <Dashboard />}
            {activeTab === 'students' && <StudentsPage />}
            {activeTab === 'financials' && <FinancialsPage currentAcademicYear={academicYear} />}
            {activeTab === 'teachers' && <TeachersPage />}
          </div>
        </main>
      </div>
    </div>
  );
}

function SidebarItem({ icon, label, active, onClick }: { icon: any, label: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-150 text-xs font-bold ${
        active 
          ? 'bg-white/10 text-amber-400 shadow-xs border border-amber-400/20' 
          : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
      }`}
    >
      <span className={active ? 'text-amber-400' : 'text-slate-400'}>{icon}</span>
      <span>{label}</span>
      {active && <span className="ms-auto w-1.5 h-1.5 rounded-full bg-amber-400"></span>}
    </button>
  );
}


