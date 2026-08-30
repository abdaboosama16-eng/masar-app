import { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Users, UserSquare2, Wallet, X, Menu, 
  Building2, Moon, Sun, PanelLeftClose, PanelLeft, Crown, Settings
} from 'lucide-react';
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
import { getActiveSessionUser, clearActiveSession } from './lib/auth';
import { LocalUser } from './lib/settings';
import { useLanguage } from './i18n';
import { useSchoolSettings } from './lib/settings';

export default function App() {
  const { t } = useLanguage();
  const { settings } = useSchoolSettings();
  const [license, setLicense] = useState<LicenseInfo | null>(() => getStoredLicense());
  const [currentUser, setCurrentUser] = useState<LocalUser | null>(() => getActiveSessionUser());
  const [showAdminUnlockModal, setShowAdminUnlockModal] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  const effectiveUser = currentUser || (settings.users ? settings.users.find(u => u.role === 'admin') : null) || { id: 'admin', name: 'المدير الأساسي', role: 'admin', username: 'admin', pin: '0000', active: true, createdAt: new Date().toISOString() };

  // Theme synchronization with document class
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const toggleTheme = () => {
    setDarkMode(prev => !prev);
  };

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
    <div className="h-screen w-full flex flex-col bg-gray-50 dark:bg-transparent overflow-hidden font-sans text-slate-900 dark:text-gray-100 transition-colors duration-300">
      
      {/* Top Header Bar: Clean, Minimal Solid "لوحة التحكم" */}
      <header className="h-16 bg-white dark:bg-slate-800/60 backdrop-blur-md border-b border-gray-200 dark:border-slate-700/50 flex items-center justify-between px-5 md:px-8 select-none z-30 shrink-0">
        <div className="flex items-center gap-3.5">
          {/* Mobile Menu Trigger */}
          <button 
            className="md:hidden text-gray-700 dark:text-gray-200 hover:text-slate-900 p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="القائمة الجانبية"
          >
            <Menu size={20} />
          </button>
          
          {/* Desktop Sidebar Expand Trigger (Shown when sidebar is collapsed) */}
          {isSidebarCollapsed && (
            <button
              onClick={() => setIsSidebarCollapsed(false)}
              className="hidden md:flex text-gray-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors border border-gray-200 dark:border-slate-700"
              title="إظهار القائمة الجانبية"
            >
              <PanelLeft size={18} />
            </button>
          )}

          {/* Institutional Identity & Fixed "لوحة التحكم" */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-slate-900 dark:bg-slate-800 rounded-xl flex items-center justify-center text-amber-400 font-black text-sm border border-slate-700 shadow-xs">
              {settings.schoolName ? settings.schoolName.charAt(0) : 'م'}
            </div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white">
                لوحة التحكم
              </h1>
              <span className="text-gray-300 dark:text-slate-600 font-light">|</span>
              <span className="text-xs font-semibold text-gray-600 dark:text-gray-300 truncate max-w-[160px] sm:max-w-xs">
                {settings.schoolName || t('app_title')}
              </span>
            </div>
          </div>
        </div>

        {/* Minimal Header Actions: ONLY Dark Mode Toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-xl text-gray-600 hover:text-slate-900 dark:text-gray-300 dark:hover:text-white bg-gray-50 hover:bg-gray-100 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors border border-gray-200 dark:border-slate-700 cursor-pointer"
            title={darkMode ? 'التبديل إلى الوضع النهاري' : 'التبديل إلى الوضع الليلي'}
            aria-label="تبديل المظهر"
          >
            {darkMode ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} />}
          </button>
        </div>
      </header>

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

      <div className="flex flex-1 overflow-hidden relative">
        {/* Mobile menu backdrop */}
        {isMobileMenuOpen && (
          <div 
            className="md:hidden fixed inset-0 bg-slate-900/80 z-40"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* Sidebar: Solid Dark bg-slate-900 with Collapse button at top next to logo */}
        <aside className={`absolute start-0 md:static z-50 ${isSidebarCollapsed ? 'md:hidden' : 'w-64'} bg-slate-900 border-e border-slate-800 text-gray-300 flex flex-col h-full py-5 shrink-0 shadow-md transition-all duration-300 ease-in-out ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full rtl:translate-x-full md:translate-x-0 md:rtl:translate-x-0'}`}>
          <div className="px-4 space-y-4">
            {/* Top Bar inside Sidebar: Logo & Collapse Button */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3.5">
              <div className="flex items-center gap-2.5">
                <div 
                  onClick={() => isAdmin ? setShowSettingsModal(true) : setShowAdminUnlockModal(true)}
                  title={isAdmin ? "تعديل الشعار والهوية" : "مطلوب صلاحية المدير للتعديل"}
                  className="w-10 h-10 rounded-xl border border-slate-700 p-1 overflow-hidden bg-slate-800 flex items-center justify-center group cursor-pointer hover:border-amber-400/80 transition-all shrink-0"
                >
                  {settings.logo ? (
                    <img 
                      src={settings.logo} 
                      alt={settings.schoolName} 
                      className="w-full h-full object-contain rounded-lg"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <Building2 size={20} className="text-amber-400 group-hover:scale-105 transition-transform" />
                  )}
                </div>
                <div className="text-start overflow-hidden">
                  <h2 className="text-white font-bold text-xs truncate max-w-[130px]" title={settings.schoolName}>
                    {settings.schoolName}
                  </h2>
                  <p className="text-gray-400 text-[10px] truncate">
                    {settings.schoolType || t('special_edu')}
                  </p>
                </div>
              </div>

              {/* Collapse/Close Button inside Sidebar Top */}
              <div className="flex items-center gap-1">
                {/* Desktop Collapse Button */}
                <button
                  onClick={() => setIsSidebarCollapsed(true)}
                  className="hidden md:flex text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                  title="طي القائمة الجانبية"
                  aria-label="طي القائمة"
                >
                  <PanelLeftClose size={18} />
                </button>
                {/* Mobile Close Button */}
                <button 
                  onClick={() => setIsMobileMenuOpen(false)} 
                  className="md:hidden text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
                  aria-label="إغلاق القائمة"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Academic Year Selector */}
            <div className="px-1">
              <label className="text-[11px] font-bold text-gray-400 mb-1.5 block">{t('academic_year')}</label>
              <select 
                value={academicYear}
                onChange={(e) => handleYearChange(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-gray-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-amber-400 transition-all cursor-pointer font-bold appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%2394a3b8%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.4-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:8px_8px] bg-no-repeat bg-[left_12px_center] rtl:bg-[left_12px_center]"
              >
                {(settings.academicYears || ['2024/2025', '2025/2026', '2026/2027']).map(year => (
                  <option key={year} value={year} className="bg-slate-900 text-white">
                    {year} {year === (settings.activeAcademicYear || settings.academicYear) ? 'النشطة' : ''}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Sidebar Navigation Items */}
            <nav className="space-y-1 pt-1">
              <SidebarItem icon={<LayoutDashboard size={18} />} label={t('dashboard')} active={activeTab === 'dashboard'} onClick={() => { setActiveTab('dashboard'); setIsMobileMenuOpen(false); }} />
              <SidebarItem icon={<Users size={18} />} label={t('students')} active={activeTab === 'students'} onClick={() => { setActiveTab('students'); setIsMobileMenuOpen(false); }} />
              <SidebarItem icon={<Wallet size={18} />} label={t('financials')} active={activeTab === 'financials'} onClick={() => { setActiveTab('financials'); setIsMobileMenuOpen(false); }} />
              <SidebarItem icon={<UserSquare2 size={18} />} label={t('teachers')} active={activeTab === 'teachers'} onClick={() => { setActiveTab('teachers'); setIsMobileMenuOpen(false); }} />
            </nav>

            {/* Upgrade Plan Button */}
            <div className="pt-2">
              <button 
                onClick={() => setShowUpgradeModal(true)}
                className="w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 text-xs font-bold bg-slate-800/80 text-gray-300 border border-slate-700 hover:bg-slate-800 hover:text-white group cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Crown size={16} className={settings.subscriptionPlan === 'enterprise' ? 'text-amber-400' : 'text-amber-400 group-hover:text-amber-300'} />
                  <span>{settings.subscriptionPlan === 'enterprise' ? 'مسار إنتربرايز' : 'ترقية الباقة'}</span>
                </div>
                {settings.subscriptionPlan !== 'enterprise' && (
                  <span className="bg-amber-500/20 text-amber-300 text-[10px] px-2 py-0.5 rounded-full font-bold border border-amber-500/30">جديد</span>
                )}
              </button>
            </div>
          </div>

          {/* Bottom Administration / System Management Section */}
          <div className="mt-auto px-4 pt-4 space-y-2 border-t border-slate-800/80">
            {/* Settings Button */}
            <button
              onClick={() => {
                if (isAdmin) {
                  setShowSettingsModal(true);
                } else {
                  setShowAdminUnlockModal(true);
                }
                setIsMobileMenuOpen(false);
              }}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-bold text-gray-300 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
            >
              <Settings size={18} className="text-gray-300" />
              <span>الإعدادات</span>
            </button>

            {/* Tech Support Button */}
            <TechSupportButton variant="sidebar" />
          </div>
        </aside>

        {/* Main Content Workspace: Clean Solid Background */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 lg:p-10 bg-gray-50 dark:bg-transparent w-full transition-colors duration-300">
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
          ? 'bg-white/10 text-white shadow-xs border border-white/10' 
          : 'text-gray-300 hover:bg-white/5 hover:text-white'
      }`}
    >
      <span className={active ? 'text-amber-400' : 'text-gray-400'}>{icon}</span>
      <span>{label}</span>
      {active && <span className="ms-auto w-1.5 h-1.5 rounded-full bg-amber-400"></span>}
    </button>
  );
}



