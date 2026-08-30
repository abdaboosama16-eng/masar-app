import React, { useState, useRef, useEffect } from 'react';
import { 
  X, Building2, Upload, Trash2, CheckCircle2, RotateCcw, Image as ImageIcon, 
  Plus, Check, Users, ShieldCheck, UserCheck, KeyRound, Lock, Eye, EyeOff, 
  Send, Phone, MapPin, AlertCircle, Link as LinkIcon, Database, ArrowRightLeft,
  School, Globe, FileText, Wifi, HardDrive, RefreshCw, AlertOctagon, Download,
  Printer, DollarSign, Calendar
} from 'lucide-react';
import { 
  useSchoolSettings, SchoolSettings, LocalUser, UserRole, 
  DEFAULT_SETTINGS, DEFAULT_USERS, DEFAULT_FEES
} from '../lib/settings';
import { BackupRestoreControls } from './BackupRestoreControls';
import { TechSupportButton } from './TechSupportButton';
import { getActiveSessionUser, setActiveSessionUser, addAuditLog } from '../lib/auth';
import { syncService } from '../lib/syncService';
import { SyncState, Transaction, Student } from '../types';
import { downloadJsonBackup } from '../lib/backupService';
import defaultLogo from '../logo.png.jpg';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'basic' | 'data' | 'system';

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { settings, updateSettings, resetSettings } = useSchoolSettings();
  const [formData, setFormData] = useState<SchoolSettings>(settings);
  const [activeTab, setActiveTab] = useState<TabType>('basic');
  const [logoUrlInput, setLogoUrlInput] = useState('');
  const [showLogoUrlInput, setShowLogoUrlInput] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state for Data Management Tab
  const [syncState, setSyncState] = useState<SyncState>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    pendingCount: 0,
    isSyncing: false,
    lastSyncTime: null
  });

  // Annual Inventory Modal state
  const [showAnnualInventoryModal, setShowAnnualInventoryModal] = useState(false);
  const [annualStats, setAnnualStats] = useState<{
    totalIn: number;
    totalOut: number;
    balance: number;
    studentsCount: number;
    transactionsCount: number;
  }>({ totalIn: 0, totalOut: 0, balance: 0, studentsCount: 0, transactionsCount: 0 });

  // New User Form State
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserUsername, setNewUserUsername] = useState('');
  const [newUserPin, setNewUserPin] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('cashier');
  const [showPins, setShowPins] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const unsubscribe = syncService.subscribe((state) => {
      setSyncState(state);
    });
    return () => unsubscribe();
  }, []);

  // Sync formData when settings change or modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData(settings);
    }
  }, [isOpen, settings]);

  if (!isOpen) return null;

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // --- LOGO HANDLERS ---
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      showToast('حجم الصورة كبير جداً، يرجى اختيار صورة أقل من 2 ميغابايت', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64String = event.target?.result as string;
      setFormData((prev) => ({ ...prev, logo: base64String }));
      showToast('تم تحميل الشعار بنجاح', 'success');
    };
    reader.readAsDataURL(file);
  };

  const handleApplyLogoUrl = () => {
    const url = logoUrlInput.trim();
    if (!url) {
      showToast('يرجى إدخال رابط صالح للصورة', 'error');
      return;
    }
    setFormData((prev) => ({ ...prev, logo: url }));
    setLogoUrlInput('');
    setShowLogoUrlInput(false);
    showToast('تم تحديث رابط الشعار بنجاح', 'success');
  };

  const handleRemoveLogo = () => {
    setFormData((prev) => ({ ...prev, logo: defaultLogo }));
    showToast('تمت استعادة الشعار الافتراضي لمنظومة مسار', 'info');
  };

  // --- MANUAL SYNC ---
  const handleTriggerSync = async () => {
    if (!syncState.isOnline) {
      showToast('النظام يعمل في وضع عدم الاتصال (Offline-First). البيانات محفوظة محلياً بأمان.', 'info');
      return;
    }
    const res = await syncService.syncAllPending();
    if (res.syncedCount > 0) {
      showToast(`تمت مزامنة ${res.syncedCount} سجل بنجاح`, 'success');
    } else {
      showToast('جميع البيانات متزامنة ومحفوظة بالكامل', 'success');
    }
  };

  // --- USER MANAGEMENT HANDLERS ---
  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserUsername.trim() || !newUserPin.trim()) {
      showToast('يرجى ملء جميع حقول المستخدم الجديد', 'error');
      return;
    }

    const existing = formData.users?.find(u => u.username.toLowerCase() === newUserUsername.trim().toLowerCase());
    if (existing) {
      showToast('اسم المستخدم هذا مستخدم مسبقاً، يرجى اختيار اسم آخر', 'error');
      return;
    }

    const newUser: LocalUser = {
      id: `user-${Date.now()}`,
      name: newUserName.trim(),
      username: newUserUsername.trim().toLowerCase(),
      pin: newUserPin.trim(),
      role: newUserRole,
      createdAt: new Date().toISOString().split('T')[0],
      active: true
    };

    setFormData(prev => ({
      ...prev,
      users: [...(prev.users || DEFAULT_USERS), newUser]
    }));

    setNewUserName('');
    setNewUserUsername('');
    setNewUserPin('');
    setNewUserRole('cashier');
    setShowAddUserModal(false);
    showToast(`تم إضافة المستخدم "${newUser.name}" بنجاح`, 'success');
  };

  const handleDeleteUser = (userId: string) => {
    const currentUsers = formData.users || DEFAULT_USERS;
    if (currentUsers.length <= 1) {
      showToast('لا يمكن حذف المستخدم الوحيد في المنظومة', 'error');
      return;
    }

    const userToDelete = currentUsers.find(u => u.id === userId);
    if (!userToDelete) return;

    if (window.confirm(`هل أنت متأكد من حذف المستخدم "${userToDelete.name}"؟`)) {
      const updated = currentUsers.filter(u => u.id !== userId);
      const nextActiveId = formData.activeUserId === userId ? updated[0]?.id : formData.activeUserId;
      setFormData(prev => ({
        ...prev,
        users: updated,
        activeUserId: nextActiveId
      }));
      showToast(`تم حذف المستخدم ${userToDelete.name}`, 'info');
    }
  };

  const handleToggleUserStatus = (userId: string) => {
    setFormData(prev => ({
      ...prev,
      users: (prev.users || DEFAULT_USERS).map(u => {
        if (u.id === userId) {
          return { ...u, active: !u.active };
        }
        return u;
      })
    }));
  };

  const handleSetActiveUser = (userId: string) => {
    setFormData(prev => ({
      ...prev,
      activeUserId: userId
    }));
    const user = (formData.users || DEFAULT_USERS).find(u => u.id === userId);
    if (user) {
      setActiveSessionUser(user);
    }
    showToast(`تم التبديل إلى المستخدم: ${user?.name || ''}`, 'success');
  };

  const handleUpdateUserPin = (userId: string) => {
    const user = (formData.users || DEFAULT_USERS).find(u => u.id === userId);
    if (!user) return;
    const newPin = window.prompt(`أدخل كلمة المرور / رمز الدخول الجديد للمستخدم "${user.name}":`, user.pin);
    if (newPin === null) return;
    const trimmed = newPin.trim();
    if (!trimmed) {
      showToast('لا يمكن أن تكون كلمة المرور فارغة', 'error');
      return;
    }
    setFormData(prev => ({
      ...prev,
      users: (prev.users || DEFAULT_USERS).map(u => u.id === userId ? { ...u, pin: trimmed } : u)
    }));
    showToast(`تم تحديث كلمة المرور للمستخدم "${user.name}" بنجاح`, 'success');
  };

  // --- ANNUAL INVENTORY HANDLER ---
  const handleOpenAnnualInventory = async () => {
    try {
      const [txs, students] = await Promise.all([
        syncService.getTransactions(),
        syncService.getStudents()
      ]);
      const totalIn = txs.filter(t => t.type === 'IN').reduce((acc, t) => acc + Number(t.amount || 0), 0);
      const totalOut = txs.filter(t => t.type === 'OUT').reduce((acc, t) => acc + Number(t.amount || 0), 0);
      setAnnualStats({
        totalIn,
        totalOut,
        balance: totalIn - totalOut,
        studentsCount: students.length,
        transactionsCount: txs.length
      });
      setShowAnnualInventoryModal(true);
    } catch (err) {
      showToast('فشل قراءة بيانات الجرد السنوي', 'error');
    }
  };

  // --- SAVE & RESET ---
  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!formData.schoolName.trim()) {
      showToast('يرجى كتابة اسم المؤسسة / المدرسة', 'error');
      return;
    }

    updateSettings(formData);
    addAuditLog('تحديث الإعدادات', 'تم تعديل إعدادات المنظومة وهوية المؤسسة');
    
    // Sync current active session if affected
    const activeSession = getActiveSessionUser();
    if (activeSession) {
      const updatedUser = (formData.users || DEFAULT_USERS).find(u => u.id === activeSession.id);
      if (updatedUser) {
        setActiveSessionUser(updatedUser);
      }
    }

    showToast('تم حفظ وتطبيق البيانات بنجاح', 'success');
    setTimeout(() => {
      onClose();
    }, 500);
  };

  const currentUsers = formData.users || DEFAULT_USERS;
  const activeUser = currentUsers.find(u => u.id === (formData.activeUserId || 'user-admin-1')) || currentUsers[0];

  return (
    <div className="fixed inset-0 bg-slate-900/80 dark:bg-slate-950/85 flex items-center justify-center z-[150] p-2 sm:p-4 md:p-6 backdrop-blur-md animate-in fade-in select-none">
      <div 
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col h-[88vh] max-h-[820px]"
        dir="rtl"
      >
        
        {/* ========================================================================= */}
        {/* TOP MODAL HEADER                                                          */}
        {/* ========================================================================= */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-slate-900 text-amber-400 dark:bg-slate-800 rounded-2xl border border-slate-700 shadow-xs">
              <Building2 size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100">
                  مركز الإعدادات
                </h2>
                <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-bold px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700">
                  MASAR Settings
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                تخصيص هوية المنظومة، إدارة البيانات والنسخ الاحتياطي، وحسابات النظام
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="إغلاق النافذة"
          >
            <X size={20} />
          </button>
        </div>

        {/* ========================================================================= */}
        {/* TOP TABS NAVIGATION BAR (Clean 3 Tabs)                                    */}
        {/* ========================================================================= */}
        <div className="flex items-center gap-2 px-6 pt-3 pb-0 bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800 shrink-0 overflow-x-auto">
          {/* Tab 1: البيانات الأساسية */}
          <button
            type="button"
            onClick={() => setActiveTab('basic')}
            className={`flex items-center gap-2 px-5 py-3 rounded-t-2xl font-bold text-xs transition-all border-t border-x cursor-pointer ${
              activeTab === 'basic'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-slate-200 dark:border-slate-800 shadow-xs -mb-[1px] z-10'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 border-transparent hover:bg-white/50'
            }`}
          >
            <Building2 size={16} className={activeTab === 'basic' ? 'text-indigo-600 dark:text-amber-400' : ''} />
            <span>البيانات الأساسية</span>
          </button>

          {/* Tab 2: إدارة البيانات */}
          <button
            type="button"
            onClick={() => setActiveTab('data')}
            className={`flex items-center gap-2 px-5 py-3 rounded-t-2xl font-bold text-xs transition-all border-t border-x cursor-pointer ${
              activeTab === 'data'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-slate-200 dark:border-slate-800 shadow-xs -mb-[1px] z-10'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 border-transparent hover:bg-white/50'
            }`}
          >
            <Database size={16} className={activeTab === 'data' ? 'text-indigo-600 dark:text-amber-400' : ''} />
            <span>إدارة البيانات</span>
            <span className={`w-2 h-2 rounded-full ${syncState.isOnline ? 'bg-emerald-500' : 'bg-amber-500'}`} />
          </button>

          {/* Tab 3: النظام */}
          <button
            type="button"
            onClick={() => setActiveTab('system')}
            className={`flex items-center gap-2 px-5 py-3 rounded-t-2xl font-bold text-xs transition-all border-t border-x cursor-pointer ${
              activeTab === 'system'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-slate-200 dark:border-slate-800 shadow-xs -mb-[1px] z-10'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 border-transparent hover:bg-white/50'
            }`}
          >
            <ShieldCheck size={16} className={activeTab === 'system' ? 'text-indigo-600 dark:text-amber-400' : ''} />
            <span>النظام</span>
            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              {currentUsers.length}
            </span>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* MAIN BODY / TAB CONTENT                                                   */}
        {/* ========================================================================= */}
        <div className="flex-1 bg-white dark:bg-slate-900 overflow-y-auto p-5 sm:p-7 space-y-6 custom-scrollbar">
          
          {toastMessage && (
            <div className={`p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2.5 transition-all border ${
              toastMessage.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                : toastMessage.type === 'error'
                  ? 'bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200'
                  : 'bg-indigo-50 dark:bg-indigo-950/50 border-indigo-200 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200'
            }`}>
              <CheckCircle2 size={16} className="shrink-0" />
              <span>{toastMessage.text}</span>
            </div>
          )}

          {/* ===================================================================== */}
          {/* TAB 1: البيانات الأساسية (Institution Details & Logo)                  */}
          {/* ===================================================================== */}
          {activeTab === 'basic' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              
              {/* Header Title */}
              <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
                  البيانات الأساسية وهوية المؤسسة
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  اسم المنظومة أو المؤسسة والشعار الرسمي المعتمد في الواجهة وإيصالات الدفع والطباعة
                </p>
              </div>

              {/* Logo Settings */}
              <div className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200/70 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-indigo-100 dark:bg-slate-800 text-indigo-900 dark:text-amber-400 rounded-xl border border-indigo-200 dark:border-slate-700">
                      <ImageIcon size={18} />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-900 dark:text-slate-100">شعار المنظومة / المؤسسة</h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">يظهر في الشريط الجانبي والترويسة وأعلى واصلات القبض المطبوعة</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-5">
                  {/* Logo Preview Container */}
                  <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                    {formData.logo ? (
                      <img
                        src={formData.logo}
                        alt="Logo"
                        className="w-full h-full object-contain"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-slate-400">
                        <ImageIcon size={28} />
                        <span className="text-[10px] mt-1">لا يوجد شعار</span>
                      </div>
                    )}
                  </div>

                  {/* Upload and URL Controls */}
                  <div className="flex-1 space-y-3 w-full">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageUpload}
                      accept="image/png, image/jpeg, image/webp, image/svg+xml"
                      className="hidden"
                    />

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-[0.98]"
                      >
                        <Upload size={15} />
                        <span>رفع شعار جديد</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowLogoUrlInput(!showLogoUrlInput)}
                        className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-3.5 py-2.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
                      >
                        <LinkIcon size={14} />
                        <span>رابط صورة (URL)</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleRemoveLogo}
                        className="inline-flex items-center gap-1.5 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 px-3 py-2.5 rounded-xl text-xs font-bold border border-rose-200 dark:border-rose-800 transition-all cursor-pointer"
                      >
                        <Trash2 size={14} />
                        <span>استعادة شعار مسار الافتراضي</span>
                      </button>
                    </div>

                    {showLogoUrlInput && (
                      <div className="flex items-center gap-2 pt-1 animate-in fade-in">
                        <input
                          type="url"
                          value={logoUrlInput}
                          onChange={(e) => setLogoUrlInput(e.target.value)}
                          placeholder="https://example.com/logo.png"
                          className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-900 dark:text-white outline-none focus:border-indigo-600 text-left"
                          dir="ltr"
                        />
                        <button
                          type="button"
                          onClick={handleApplyLogoUrl}
                          className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0"
                        >
                          تطبيق
                        </button>
                      </div>
                    )}

                    <p className="text-[11px] text-slate-400 dark:text-slate-500">
                      الصيغ المدعومة: PNG, JPG, WEBP بحجم أقصى 2 ميغابايت
                    </p>
                  </div>
                </div>
              </div>

              {/* Institution Details Fields */}
              <div className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 space-y-4">
                <h4 className="text-xs font-black text-slate-900 dark:text-slate-100 border-b border-slate-200/70 dark:border-slate-800 pb-2.5">
                  بيانات المؤسسة والطباعة
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1.5">
                      اسم المؤسسة / المركز التعليمي (عربي) *
                    </label>
                    <input
                      type="text"
                      value={formData.schoolName}
                      onChange={(e) => setFormData({ ...formData, schoolName: e.target.value })}
                      placeholder="منظومة مسار"
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-indigo-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1.5">
                      الاسم باللغة الإنجليزية (English Name)
                    </label>
                    <input
                      type="text"
                      value={formData.schoolNameEn}
                      onChange={(e) => setFormData({ ...formData, schoolNameEn: e.target.value })}
                      placeholder="MASAR SYSTEM"
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-indigo-600 text-left"
                      dir="ltr"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1.5">
                      نوع النشاط / التصنيف
                    </label>
                    <input
                      type="text"
                      value={formData.schoolType}
                      onChange={(e) => setFormData({ ...formData, schoolType: e.target.value })}
                      placeholder="للتعليم الخاص ورياض الأطفال"
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-indigo-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1.5">
                      رقم الهاتف والتواصل
                    </label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="0910000000"
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-indigo-600 text-left"
                      dir="ltr"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1.5">
                      العنوان الجغرافي
                    </label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="طرابلس - ليبيا"
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-indigo-600"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1.5">
                      نص تذييل الإيصال والطباعة المعتمد
                    </label>
                    <input
                      type="text"
                      value={formData.receiptFooterNotice}
                      onChange={(e) => setFormData({ ...formData, receiptFooterNotice: e.target.value })}
                      placeholder="نسعد بثقتكم.. منظومة مسار تتمنى لكم عاماً دراسياً موفقاً"
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-indigo-600"
                    />
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* ===================================================================== */}
          {/* TAB 2: إدارة البيانات (Data Management & Sync)                        */}
          {/* ===================================================================== */}
          {activeTab === 'data' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              
              {/* Header Title */}
              <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
                  إدارة البيانات والمزامنة والنسخ الاحتياطي
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  حفظ البيانات واسترجاعها محلياً والتصدير الآمن المشفر ومتابعة حالة الاتصال
                </p>
              </div>

              {/* Status Indicator Banner */}
              <div className={`border rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                syncState.isOnline
                  ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/60'
                  : 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/60'
              }`}>
                <div className="flex items-center gap-3.5">
                  <div className={`p-3 rounded-2xl ${
                    syncState.isOnline
                      ? 'bg-emerald-500 text-white shadow-xs'
                      : 'bg-amber-500 text-white shadow-xs'
                  }`}>
                    {syncState.isOnline ? <Wifi size={22} /> : <HardDrive size={22} />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-black text-slate-900 dark:text-white">
                        {syncState.isOnline ? 'حالة النظام: متصل (Online)' : 'حالة النظام: حفظ محلي (Offline-First)'}
                      </h4>
                      <span className={`w-2.5 h-2.5 rounded-full ${syncState.isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-0.5">
                      {syncState.isOnline
                        ? 'المزامنة السحابية والحفظ المحلي يعملان بتزامن تام وبأمان.'
                        : 'جميع العمليات تُحفظ فوراً في الذاكرة المحلية (IndexedDB) وتتزامن تلقائياً عند عودة الاتصال.'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleTriggerSync}
                  className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer"
                >
                  <RefreshCw size={14} className={syncState.isSyncing ? 'animate-spin' : ''} />
                  <span>{syncState.isSyncing ? 'جاري الفحص...' : 'فحص ومزامنة فورية'}</span>
                </button>
              </div>

              {/* Secure Export & Restore Controls */}
              <div className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 space-y-4">
                <h4 className="text-xs font-black text-slate-900 dark:text-slate-100 border-b border-slate-200/70 dark:border-slate-800 pb-2.5">
                  النسخ الاحتياطي والاستعادة
                </h4>
                
                <BackupRestoreControls variant="card" />
              </div>

              {/* Direct JSON and Database Utilities */}
              <div className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 flex items-center justify-between">
                <div>
                  <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200">تحميل نسخة JSON قياسية</h5>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">حفظ ملف نصي مفتوح يحتوي على كافة الجداول والسجلات المالية</p>
                </div>
                <button
                  type="button"
                  onClick={() => downloadJsonBackup()}
                  className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  <Download size={14} />
                  <span>تحميل JSON</span>
                </button>
              </div>

            </div>
          )}

          {/* ===================================================================== */}
          {/* TAB 3: النظام (System Management & Annual Inventory)                   */}
          {/* ===================================================================== */}
          {activeTab === 'system' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              
              {/* Header Title */}
              <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
                  إدارة النظام والمستخدمين والعمليات السنوية
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  التحكم في حسابات الموظفين ومدير النظام، وإجراء الجرد السنوي وإقفال العام
                </p>
              </div>

              {/* Annual Inventory Section (Prominent Red Action) */}
              <div className="bg-red-50/70 dark:bg-red-950/30 border-2 border-red-200 dark:border-red-900/60 rounded-2xl p-5 space-y-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-red-600 text-white rounded-2xl shadow-xs shrink-0">
                      <AlertOctagon size={22} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-black text-red-900 dark:text-red-300">
                          الجرد السنوي (إقفال وترحيل نهاية العام الدراسي)
                        </h4>
                        <span className="bg-red-200 dark:bg-red-900/80 text-red-900 dark:text-red-200 text-[10px] font-black px-2 py-0.5 rounded-md">
                          إجراء سنوي
                        </span>
                      </div>
                      <p className="text-xs text-red-700/80 dark:text-red-400 font-medium mt-0.5">
                        يُستخدم عند انتهاء العام الدراسي لإصدار التقرير الختامي الشامل، ترحيل الحسابات، وتجهيز الخزينة للعام الجديد.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleOpenAnnualInventory}
                    className="w-full sm:w-auto bg-red-600 hover:bg-red-700 active:scale-[0.98] text-white px-5 py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-red-600/20 shrink-0"
                  >
                    <Calendar size={16} />
                    <span>الجرد السنوي</span>
                  </button>
                </div>
              </div>

              {/* Main Admin & Staff User Management */}
              <div className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200/70 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-indigo-100 dark:bg-slate-800 text-indigo-900 dark:text-amber-400 rounded-xl">
                      <Users size={18} />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-900 dark:text-slate-100">مدير النظام الرئيسي والمستخدمون</h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">إدارة حسابات الدخول والرموز السرية وصلاحيات الموظفين</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowAddUserModal(true)}
                    className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    <Plus size={14} />
                    <span>إضافة مستخدم</span>
                  </button>
                </div>

                {/* Users List */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {currentUsers.map((user) => {
                    const isCurrentUserActive = user.id === formData.activeUserId;
                    const isShown = showPins[user.id];

                    return (
                      <div 
                        key={user.id} 
                        className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                          isCurrentUserActive
                            ? 'bg-white dark:bg-slate-900 border-indigo-500/80 shadow-xs'
                            : 'bg-white/80 dark:bg-slate-900/70 border-slate-200 dark:border-slate-800'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                              user.role === 'admin'
                                ? 'bg-indigo-100 text-indigo-900 dark:bg-indigo-950 dark:text-indigo-300'
                                : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                            }`}>
                              {user.role === 'admin' ? <ShieldCheck size={18} /> : <UserCheck size={18} />}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-xs text-slate-900 dark:text-white">{user.name}</span>
                                {isCurrentUserActive && (
                                  <span className="bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold px-1.5 py-0.2 rounded">
                                    نشط
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px] text-slate-400 font-mono">@{user.username}</span>
                            </div>
                          </div>

                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            user.role === 'admin'
                              ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-900 dark:text-indigo-300'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                          }`}>
                            {user.role === 'admin' ? 'مدير نظام' : 'موظف تحصيل'}
                          </span>
                        </div>

                        {/* PIN & Actions */}
                        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                          <div className="flex items-center gap-1.5 font-mono text-slate-600 dark:text-slate-300">
                            <KeyRound size={13} className="text-slate-400" />
                            <span>{isShown ? user.pin : '••••'}</span>
                            <button
                              type="button"
                              onClick={() => setShowPins(p => ({ ...p, [user.id]: !p[user.id] }))}
                              className="text-slate-400 hover:text-slate-600 p-0.5"
                            >
                              {isShown ? <EyeOff size={12} /> : <Eye size={12} />}
                            </button>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleUpdateUserPin(user.id)}
                              className="text-slate-500 hover:text-slate-800 dark:hover:text-white px-2 py-1 rounded text-[11px] font-bold hover:bg-slate-100 dark:hover:bg-slate-800"
                            >
                              تغيير الرمز
                            </button>

                            {!isCurrentUserActive && (
                              <button
                                type="button"
                                onClick={() => handleSetActiveUser(user.id)}
                                className="text-indigo-600 dark:text-indigo-400 hover:underline px-2 py-1 rounded text-[11px] font-bold"
                              >
                                تفعيل
                              </button>
                            )}

                            {currentUsers.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleDeleteUser(user.id)}
                                className="text-rose-500 hover:text-rose-700 p-1 rounded hover:bg-rose-50 dark:hover:bg-rose-950/40"
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          )}

        </div>

        {/* ========================================================================= */}
        {/* FOOTER ACTIONS                                                            */}
        {/* ========================================================================= */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 flex items-center justify-between shrink-0">
          <TechSupportButton variant="inline" />

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="bg-slate-900 hover:bg-slate-800 dark:bg-amber-400 dark:hover:bg-amber-300 dark:text-slate-900 text-white px-6 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer shadow-md shadow-slate-900/10 active:scale-[0.98]"
            >
              حفظ الإعدادات
            </button>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* ADD USER MODAL                                                            */}
      {/* ========================================================================= */}
      {showAddUserModal && (
        <div className="fixed inset-0 bg-slate-950/80 flex items-center justify-center z-[200] p-4 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-5 space-y-4 shadow-xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h4 className="font-black text-sm text-slate-900 dark:text-white">إضافة مستخدم جديد للمنظومة</h4>
              <button onClick={() => setShowAddUserModal(false)} className="text-slate-400 hover:text-slate-700">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAddUser} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">اسم الموظف / المستخدم *</label>
                <input
                  type="text"
                  required
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="مثال: أحمد محمود"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">اسم المستخدم (Username) *</label>
                <input
                  type="text"
                  required
                  value={newUserUsername}
                  onChange={(e) => setNewUserUsername(e.target.value)}
                  placeholder="ahmed"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 dark:text-white outline-none focus:border-indigo-600 text-left"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">رمز المرور / الرمز السري (PIN) *</label>
                <input
                  type="text"
                  required
                  value={newUserPin}
                  onChange={(e) => setNewUserPin(e.target.value)}
                  placeholder="مثال: 1234"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 dark:text-white outline-none focus:border-indigo-600 text-left"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">نوع الصلاحية *</label>
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value as UserRole)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-indigo-600"
                >
                  <option value="cashier">موظف تحصيل وإدخال (بدون صلاحية الحذف أو التعديل الحرج)</option>
                  <option value="admin">مدير نظام (صلاحيات كاملة لكافة أقسام المنظومة)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-3.5 py-2 rounded-xl text-xs font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-bold"
                >
                  إضافة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ANNUAL INVENTORY DETAILS & CONFIRMATION MODAL                             */}
      {/* ========================================================================= */}
      {showAnnualInventoryModal && (
        <div className="fixed inset-0 bg-slate-950/85 flex items-center justify-center z-[220] p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl p-6 space-y-5" dir="rtl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-red-600 text-white rounded-xl">
                  <AlertOctagon size={20} />
                </div>
                <div>
                  <h4 className="font-black text-sm text-slate-900 dark:text-white">التقرير الختامي للجرد السنوي</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">نهاية العام الدراسي والحسابات الختامية</p>
                </div>
              </div>
              <button 
                onClick={() => setShowAnnualInventoryModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            {/* Stats Breakdown */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 dark:bg-slate-800 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-bold block mb-1">إجمالي الواردات السنوية</span>
                <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 font-mono">
                  {annualStats.totalIn.toLocaleString()} د.ل
                </span>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-bold block mb-1">إجمالي المصروفات السنوية</span>
                <span className="text-lg font-black text-red-600 dark:text-red-400 font-mono">
                  {annualStats.totalOut.toLocaleString()} د.ل
                </span>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-bold block mb-1">صافي الرصيد الختامي</span>
                <span className="text-lg font-black text-indigo-900 dark:text-indigo-300 font-mono">
                  {annualStats.balance.toLocaleString()} د.ل
                </span>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-bold block mb-1">الطلاب المسجلين</span>
                <span className="text-lg font-black text-slate-900 dark:text-white font-mono">
                  {annualStats.studentsCount} طالب/ـة
                </span>
              </div>
            </div>

            <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 p-3.5 rounded-2xl text-xs text-amber-900 dark:text-amber-200 space-y-1">
              <div className="font-black flex items-center gap-1.5">
                <AlertCircle size={14} className="text-amber-600 shrink-0" />
                <span>إجراءات نهاية العام الدراسي:</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                يمكنك تحميل نسخة التقرير المالي الختامي وحفظ نسخة احتياطية آمنة لكافة بيانات العام، قبل ترحيل الأرصدة للعام الجديد.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  downloadJsonBackup();
                  showToast('تم تحميل نسخة التقرير السنوي والبيانات الختامية بنجاح', 'success');
                }}
                className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download size={15} />
                <span>تنزيل التقرير والنسخة الختامية</span>
              </button>
              
              <button
                type="button"
                onClick={() => setShowAnnualInventoryModal(false)}
                className="w-full sm:w-auto bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-4 py-2.5 rounded-xl text-xs font-bold cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default SettingsModal;
