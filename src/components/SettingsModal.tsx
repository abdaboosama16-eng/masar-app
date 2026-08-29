import React, { useState, useRef, useEffect } from 'react';
import { 
  X, Building2, Upload, Trash2, CheckCircle2, RotateCcw, Image as ImageIcon, 
  Calendar, Coins, Plus, Check, MessageSquare, DollarSign, Users, ShieldCheck, 
  UserCheck, KeyRound, Lock, Eye, EyeOff, Sparkles, Send, Phone, MapPin, 
  HelpCircle, AlertCircle, Copy, Link as LinkIcon, Database, ArrowRightLeft,
  ChevronLeft, School, Globe, FileText, CheckCircle
} from 'lucide-react';
import { 
  useSchoolSettings, SchoolSettings, LocalUser, UserRole, 
  DEFAULT_SETTINGS, DEFAULT_FEES, DEFAULT_ACADEMIC_YEARS, 
  DEFAULT_USERS, DEFAULT_WHATSAPP_TEMPLATE, formatAmountCurrency 
} from '../lib/settings';
import { renderWhatsAppTemplate } from '../lib/utils';
import { BackupRestoreControls } from './BackupRestoreControls';
import { TechSupportButton, WhatsAppIcon } from './TechSupportButton';
import { getStoredLicense, deactivatePlatform, LicenseInfo, getWhatsAppActivationRequestUrl } from '../lib/license';
import { getActiveSessionUser, setActiveSessionUser } from '../lib/auth';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'identity' | 'academic' | 'whatsapp' | 'users' | 'backup';

interface SidebarNavItem {
  id: TabType;
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  badge?: string | number;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { settings, updateSettings, resetSettings } = useSchoolSettings();
  const [formData, setFormData] = useState<SchoolSettings>(settings);
  const [activeTab, setActiveTab] = useState<TabType>('identity');
  const [newYearInput, setNewYearInput] = useState('');
  const [logoUrlInput, setLogoUrlInput] = useState('');
  const [showLogoUrlInput, setShowLogoUrlInput] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const whatsappTextareaRef = useRef<HTMLTextAreaElement>(null);

  // New User Form State
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserUsername, setNewUserUsername] = useState('');
  const [newUserPin, setNewUserPin] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('cashier');
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);

  useEffect(() => {
    if (activeTab === 'users') {
      setAuditLogs(getAuditLogs());
    }
  }, [activeTab]);
  const [showPins, setShowPins] = useState<Record<string, boolean>>({});

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
    setFormData((prev) => ({ ...prev, logo: DEFAULT_SETTINGS.logo }));
    showToast('تمت استعادة الشعار الافتراضي للمنظومة', 'info');
  };

  // --- ACADEMIC YEARS HANDLERS ---
  const handleAddAcademicYear = () => {
    const trimmed = newYearInput.trim();
    if (!trimmed) return;

    const currentYears = formData.academicYears || DEFAULT_ACADEMIC_YEARS;
    if (currentYears.includes(trimmed)) {
      showToast('هذه السنة الدراسية موجودة مسبقاً في القائمة', 'error');
      return;
    }

    const updated = [...currentYears, trimmed];
    setFormData(prev => ({
      ...prev,
      academicYears: updated
    }));
    setNewYearInput('');
    showToast(`تمت إضافة السنة الدراسية "${trimmed}" بنجاح`, 'success');
  };

  const handleRemoveAcademicYear = (yearToRemove: string) => {
    const currentYears = formData.academicYears || DEFAULT_ACADEMIC_YEARS;
    if (currentYears.length <= 1) {
      showToast('يجب الإبقاء على سنة دراسية واحدة على الأقل', 'error');
      return;
    }

    if (formData.activeAcademicYear === yearToRemove) {
      showToast('لا يمكن حذف السنة الدراسية النشطة حالياً. يرجى تفعيل سنة أخرى أولاً.', 'error');
      return;
    }

    const updated = currentYears.filter(y => y !== yearToRemove);
    setFormData(prev => ({
      ...prev,
      academicYears: updated
    }));
    showToast(`تم حذف السنة الدراسية ${yearToRemove}`, 'info');
  };

  const handleSetActiveYear = (year: string) => {
    setFormData(prev => ({
      ...prev,
      activeAcademicYear: year,
      academicYear: year
    }));
    showToast(`تم تعيين "${year}" كسنة دراسية نشطة`, 'success');
  };

  // --- FEES HANDLER ---
  const handleFeeChange = (field: keyof typeof DEFAULT_FEES, value: string) => {
    const num = Number(value.replace(/[^0-9]/g, '')) || 0;
    setFormData(prev => ({
      ...prev,
      defaultFees: {
        ...(prev.defaultFees || DEFAULT_FEES),
        [field]: num
      }
    }));
  };

  // --- WHATSAPP TEMPLATE INSERT TAG ---
  const handleInsertTag = (tag: string) => {
    const textarea = whatsappTextareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentText = formData.whatsappTemplate || DEFAULT_WHATSAPP_TEMPLATE;
    const newText = currentText.substring(0, start) + tag + currentText.substring(end);

    setFormData(prev => ({ ...prev, whatsappTemplate: newText }));

    // Re-focus and position cursor
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + tag.length, start + tag.length);
    }, 50);
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
    showToast(`👤 تم التبديل إلى المستخدم: ${user?.name || ''} (${user?.role === 'admin' ? 'مدير نظام' : 'موظف تحصيل'})`, 'success');
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

  const toggleShowPin = (userId: string) => {
    setShowPins(prev => ({ ...prev, [userId]: !prev[userId] }));
  };

  // --- SAVE & RESET ---
  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!formData.schoolName.trim()) {
      showToast('يرجى كتابة اسم المدرسة / الروضة', 'error');
      return;
    }

    updateSettings(formData);
    addAuditLog('تحديث الإعدادات', 'تم تعديل إعدادات المنظومة وإدارة المستخدمين');
    
    // Sync current active session if affected
    const activeSession = getActiveSessionUser();
    if (activeSession) {
      const updatedUser = (formData.users || DEFAULT_USERS).find(u => u.id === activeSession.id);
      if (updatedUser) {
        setActiveSessionUser(updatedUser);
      }
    }

    showToast('تم حفظ وتطبيق جميع إعدادات المنظومة وهوية المدرسة بنجاح', 'success');
    setTimeout(() => {
      onClose();
    }, 600);
  };

  const handleReset = () => {
    if (window.confirm('هل أنت متأكد من استعادة كافة الإعدادات والقوالب والهوية الافتراضية للمنظومة؟')) {
      resetSettings();
      setFormData(DEFAULT_SETTINGS);
      showToast('تمت استعادة الإعدادات الافتراضية للمنظومة بنجاح', 'info');
    }
  };

  const currentFees = formData.defaultFees || DEFAULT_FEES;
  const currentUsers = formData.users || DEFAULT_USERS;
  const activeUser = currentUsers.find(u => u.id === (formData.activeUserId || 'user-admin-1')) || currentUsers[0];

  // WhatsApp dynamic preview calculation
  const sampleWhatsAppPreview = renderWhatsAppTemplate(formData.whatsappTemplate || DEFAULT_WHATSAPP_TEMPLATE, {
    studentName: 'محمد أحمد الفيتوري',
    amount: 450,
    schoolName: formData.schoolName || 'مدرسة نور البيان',
    currency: formData.currency || 'د.ل',
    grade: 'الروضة',
    dueDate: '2026/09/01'
  });

  const sidebarNavItems: SidebarNavItem[] = [
    {
      id: 'identity',
      title: 'الهوية والترويسة والذيل',
      subtitle: 'الاسم الرسمي، الشعار، التواصل وتذييل الإيصال',
      icon: Building2
    },
    {
      id: 'academic',
      title: 'السنوات والرسوم الدراسية',
      subtitle: 'السنة النشطة، المصروفات والرسوم الافتراضية',
      icon: Calendar
    },
    {
      id: 'whatsapp',
      title: 'قالب الواتساب والعملة',
      subtitle: 'تخصيص رسالة التذكير، المتغيرات، ورمز العملة',
      icon: MessageSquare
    },
    {
      id: 'users',
      title: 'المستخدمون والصلاحيات',
      subtitle: 'إدارة الحسابات، رموز المرور، وصلاحيات الحذف',
      icon: Users,
      badge: currentUsers.length
    },
    {
      id: 'backup',
      title: 'النسخ الاحتياطي والأمان',
      subtitle: 'حفظ واسترجاع قاعدة البيانات محلياً وسحابياً',
      icon: Database
    }
  ];

  return (
    <div className="fixed inset-0 bg-slate-900/80 dark:bg-slate-950/85 flex items-center justify-center z-[150] p-2 sm:p-4 md:p-6 backdrop-blur-md animate-in fade-in select-none">
      <div 
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-5xl overflow-hidden shadow-2xl flex flex-col h-[90vh] max-h-[860px]"
        dir="rtl"
      >
        
        {/* ========================================================================= */}
        {/* TOP MODAL HEADER                                                          */}
        {/* ========================================================================= */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 dark:bg-cyan-950/60 text-indigo-900 dark:text-cyan-300 rounded-2xl border border-indigo-100 dark:border-cyan-800/40 shadow-xs">
              <School size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100">
                  لوحة إعدادات وتخصيص المنظومة
                </h2>
                <span className="bg-indigo-100 dark:bg-cyan-950 text-indigo-900 dark:text-cyan-300 text-[11px] font-bold px-2 py-0.5 rounded-md border border-indigo-200 dark:border-cyan-800">
                  MASAR Control
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                تخصيص الهوية المؤسسية، الرسوم المالية، قالب التواصل عبر الواتساب، وإدارة المستخدمين
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
        {/* MAIN BODY: 2-COLUMN SIDEBAR LAYOUT                                        */}
        {/* ========================================================================= */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          
          {/* ======================================================================= */}
          {/* RIGHT SIDEBAR (Vertical Menu in RTL)                                    */}
          {/* ======================================================================= */}
          <div className="w-full md:w-72 lg:w-80 bg-slate-50/70 dark:bg-slate-950/70 border-b md:border-b-0 md:border-l border-slate-200/80 dark:border-slate-800 p-3 sm:p-4 flex flex-col justify-between shrink-0 overflow-y-auto custom-scrollbar">
            
            <div className="space-y-1.5">
              <div className="px-3 py-1.5 text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                أقسام الإعدادات
              </div>

              {sidebarNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full text-right p-3 rounded-2xl transition-all flex items-start gap-3 cursor-pointer relative group ${
                      isActive
                        ? 'bg-white dark:bg-slate-900 text-indigo-950 dark:text-cyan-300 shadow-sm border border-slate-200 dark:border-slate-700/80'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-900/40 border border-transparent'
                    }`}
                  >
                    {/* Active Accent Bar */}
                    {isActive && (
                      <div className="absolute right-0 top-3 bottom-3 w-1 bg-indigo-600 dark:bg-cyan-400 rounded-l-full" />
                    )}

                    <div className={`p-2 rounded-xl shrink-0 transition-colors ${
                      isActive 
                        ? 'bg-indigo-100 dark:bg-cyan-950 text-indigo-900 dark:text-cyan-300 border border-indigo-200/60 dark:border-cyan-800' 
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200'
                    }`}>
                      <Icon size={18} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1.5">
                        <span className={`text-xs font-black truncate ${isActive ? 'text-indigo-950 dark:text-cyan-300' : 'text-slate-800 dark:text-slate-200'}`}>
                          {item.title}
                        </span>
                        {item.badge !== undefined && (
                          <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md ${
                            isActive
                              ? 'bg-indigo-100 dark:bg-cyan-950 text-indigo-900 dark:text-cyan-300'
                              : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                          }`}>
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[10.5px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                        {item.subtitle}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Tech Support Quick Help in Settings Sidebar */}
            <div className="mt-4 pt-3 border-t border-slate-200/70 dark:border-slate-800/80 space-y-2">
              <TechSupportButton variant="sidebar" />
              
              {/* Active User Quick Status Banner */}
              <div className="bg-white/70 dark:bg-slate-900/60 p-3 rounded-2xl border border-slate-200/60 dark:border-slate-800 text-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-slate-400 font-bold">المستخدم النشط حالياً:</span>
                  <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
                    activeUser?.role === 'admin'
                      ? 'bg-indigo-100 text-indigo-900 dark:bg-cyan-950 dark:text-cyan-300'
                      : 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300'
                  }`}>
                    {activeUser?.role === 'admin' ? 'مدير نظام' : 'موظف تحصيل'}
                  </span>
                </div>
                <div className="font-black text-slate-800 dark:text-slate-200 text-xs flex items-center gap-1.5">
                  <UserCheck size={13} className="text-emerald-500 shrink-0" />
                  <span className="truncate">{activeUser?.name || 'مستخدم المنظومة'}</span>
                </div>
              </div>
            </div>

          </div>

          {/* ======================================================================= */}
          {/* LEFT CONTENT AREA (Main Form Content)                                  */}
          {/* ======================================================================= */}
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
            {/* TAB 1: IDENTITY, HEADER, FOOTER & LOGO                                */}
            {/* ===================================================================== */}
            {activeTab === 'identity' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                
                {/* Header Title Section */}
                <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                  <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
                    هوية المؤسسة وترويسة التقارير والإيصالات
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    البيانات الرسمية وشعار المدرسة التي تُعرض في الواجهة الرئيسية وتُطبع في الإيصالات المالية والشهادات
                  </p>
                </div>

                {/* Logo Section */}
                <div className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200/70 dark:border-slate-800 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-indigo-100 dark:bg-cyan-950 text-indigo-900 dark:text-cyan-400 rounded-xl border border-indigo-200 dark:border-cyan-800">
                        <ImageIcon size={18} />
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-slate-900 dark:text-slate-100">شعار المؤسسة التعليمية (School Logo)</h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">يظهر في القائمة الجانبية وأعلى الإيصالات المالية والتقارير</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-5">
                    {/* Logo Preview Container */}
                    <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 flex items-center justify-center overflow-hidden shrink-0 shadow-sm relative group">
                      {formData.logo ? (
                        <img
                          src={formData.logo}
                          alt="School Logo"
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
                          className="inline-flex items-center gap-2 bg-indigo-950 dark:bg-cyan-950/80 hover:bg-indigo-900 dark:hover:bg-cyan-900 text-white px-4 py-2.5 rounded-xl text-xs font-bold border border-indigo-800 dark:border-cyan-700 transition-all cursor-pointer shadow-sm active:scale-[0.98]"
                        >
                          <Upload size={15} />
                          <span>رفع شعار من الجهاز</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setShowLogoUrlInput(!showLogoUrlInput)}
                          className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-3.5 py-2.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
                        >
                          <LinkIcon size={14} />
                          <span>إدخال رابط صورة (URL)</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleRemoveLogo}
                          className="inline-flex items-center gap-1.5 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 px-3 py-2.5 rounded-xl text-xs font-bold border border-rose-200 dark:border-rose-800 transition-all cursor-pointer"
                        >
                          <Trash2 size={14} />
                          <span>استعادة الشعار الافتراضي</span>
                        </button>
                      </div>

                      {showLogoUrlInput && (
                        <div className="flex items-center gap-2 pt-1 animate-in fade-in">
                          <input
                            type="url"
                            value={logoUrlInput}
                            onChange={(e) => setLogoUrlInput(e.target.value)}
                            placeholder="https://example.com/logo.png"
                            className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-900 dark:text-white outline-none focus:border-indigo-600 dark:focus:border-cyan-400 text-left"
                            dir="ltr"
                          />
                          <button
                            type="button"
                            onClick={handleApplyLogoUrl}
                            className="bg-indigo-950 hover:bg-indigo-900 dark:bg-cyan-600 dark:hover:bg-cyan-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0"
                          >
                            تطبيق الرابط
                          </button>
                        </div>
                      )}

                      <p className="text-[11px] text-slate-400 dark:text-slate-500">
                        الصيغ المدعومة: PNG, JPG, WEBP, SVG بحجم أقصى 2 ميغابايت
                      </p>
                    </div>
                  </div>
                </div>

                {/* School Official Information & Header Fields */}
                <div className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 space-y-4">
                  <h4 className="text-xs font-black text-slate-900 dark:text-slate-100 border-b border-slate-200/70 dark:border-slate-800 pb-2.5">
                    البيانات الرسمية ومعلومات الاتصال
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1.5">
                        اسم المدرسة / الروضة الرسمي (عربي) *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.schoolName}
                        onChange={(e) => setFormData({ ...formData, schoolName: e.target.value })}
                        placeholder="مثلاً: مدرسة نور البيان"
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-indigo-600 dark:focus:border-cyan-400 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1.5">
                        اسم المدرسة بالإنجليزية (English Name)
                      </label>
                      <input
                        type="text"
                        value={formData.schoolNameEn}
                        onChange={(e) => setFormData({ ...formData, schoolNameEn: e.target.value })}
                        placeholder="e.g. NOUR ALBIAN SCHOOL"
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-indigo-600 dark:focus:border-cyan-400 transition-all text-left"
                        dir="ltr"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1.5">
                        نوع المؤسسة / التخصص التعليمي
                      </label>
                      <input
                        type="text"
                        value={formData.schoolType}
                        onChange={(e) => setFormData({ ...formData, schoolType: e.target.value })}
                        placeholder="مثلاً: للتعليم الخاص / رياض أطفال"
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-indigo-600 dark:focus:border-cyan-400 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1.5">
                        رقم هاتف الإدارة / التواصل الرسمي
                      </label>
                      <input
                        type="text"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="مثلاً: 0912345678"
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-indigo-600 dark:focus:border-cyan-400 transition-all text-left"
                        dir="ltr"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1.5">
                        عنوان ومقر المدرسة الرسمي
                      </label>
                      <input
                        type="text"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        placeholder="مثلاً: طرابلس - بالقرب من الطريق الدائري الثاني"
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-indigo-600 dark:focus:border-cyan-400 transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Receipt Footer & Terms Customization */}
                <div className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200/70 dark:border-slate-800 pb-2.5">
                    <div>
                      <h4 className="text-xs font-black text-slate-900 dark:text-slate-100">
                        تذييل الإيصال المالي والشروط (Receipt Footer & Notes)
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        النص المؤسسي والعبارات الإرشادية التي تُطبع أسفل الواصل المالي لكل طالب
                      </p>
                    </div>
                  </div>

                  <div>
                    <textarea
                      rows={2}
                      value={formData.receiptFooterNotice}
                      onChange={(e) => setFormData({ ...formData, receiptFooterNotice: e.target.value })}
                      placeholder="مثلاً: نسعد بثقتكم.. مدرسة نور البيان تتمنى لكم عاماً دراسياً موفقاً"
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-indigo-600 dark:focus:border-cyan-400 transition-all leading-relaxed"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      ملاحظة: يمكنك استخدام المتغير <code className="bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded text-indigo-700 dark:text-cyan-300">{`{schoolName}`}</code> لإدراج اسم المدرسة تلقائياً.
                    </p>
                  </div>
                </div>

              </div>
            )}

            {/* ===================================================================== */}
            {/* TAB 2: ACADEMIC YEARS & DEFAULT FEES                                  */}
            {/* ===================================================================== */}
            {activeTab === 'academic' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                
                {/* Header Title Section */}
                <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
                      السنوات الدراسية والأقساط الافتراضية
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      تحديد السنة النشطة وإعداد الرسوم المالية الافتراضية لملء النماذج بسرعة ودقة
                    </p>
                  </div>
                  <div className="text-xs bg-indigo-950 dark:bg-cyan-950/80 text-white px-3 py-1 rounded-xl font-bold border border-indigo-800 dark:border-cyan-700">
                    السنة النشطة: {formData.activeAcademicYear}
                  </div>
                </div>

                {/* Academic Years Management */}
                <div className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between gap-3 border-b border-slate-200/70 dark:border-slate-800 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-indigo-100 dark:bg-cyan-950 text-indigo-900 dark:text-cyan-400 rounded-xl border border-indigo-200 dark:border-cyan-800">
                        <Calendar size={18} />
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-slate-900 dark:text-slate-100">قائمة السنوات الدراسية</h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">انقر على السنة لتفعيلها كسنة دراسية نشطة للمنظومة</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {(formData.academicYears || DEFAULT_ACADEMIC_YEARS).map((year) => {
                      const isActive = (formData.activeAcademicYear || formData.academicYear) === year;
                      return (
                        <div
                          key={year}
                          onClick={() => handleSetActiveYear(year)}
                          className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer select-none ${
                            isActive
                              ? 'bg-indigo-950 text-white border-indigo-800 dark:bg-cyan-950 dark:border-cyan-500 shadow-sm'
                              : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-800 hover:border-slate-400'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-4 h-4 rounded-full flex items-center justify-center border ${
                                isActive
                                  ? 'bg-emerald-500 border-emerald-400 text-white'
                                  : 'border-slate-300 dark:border-slate-700'
                              }`}
                            >
                              {isActive && <Check size={10} strokeWidth={3} />}
                            </div>
                            <span className="text-xs font-black">{year}</span>
                          </div>

                          {!isActive && (formData.academicYears || []).length > 1 && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveAcademicYear(year);
                              }}
                              className="text-slate-400 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                              title="حذف هذه السنة الدراسية"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="text"
                      value={newYearInput}
                      onChange={(e) => setNewYearInput(e.target.value)}
                      placeholder="مثلاً: 2027/2028"
                      className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-indigo-600 dark:focus:border-cyan-400"
                    />
                    <button
                      type="button"
                      onClick={handleAddAcademicYear}
                      className="inline-flex items-center gap-1.5 bg-indigo-950 hover:bg-indigo-900 dark:bg-cyan-950 dark:hover:bg-cyan-900 text-white px-4 py-2 rounded-xl text-xs font-bold border border-indigo-800 dark:border-cyan-700 transition-all cursor-pointer shrink-0"
                    >
                      <Plus size={14} />
                      <span>إضافة سنة</span>
                    </button>
                  </div>
                </div>

                {/* Default Fees Management */}
                <div className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between gap-3 border-b border-slate-200/70 dark:border-slate-800 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-emerald-100 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-400 rounded-xl border border-emerald-200 dark:border-emerald-800">
                        <Coins size={18} />
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-slate-900 dark:text-slate-100">القيم المالية والرسوم الافتراضية</h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          تعبئة تلقائية للرسوم في نموذج تسجيل الطلاب الجدد والإيصالات المالية
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                    <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-1.5">
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                        رسوم التسجيل / القبول ({formData.currency || 'د.ل'})
                      </label>
                      <input
                        type="text"
                        value={currentFees.registrationFee}
                        onChange={(e) => handleFeeChange('registrationFee', e.target.value)}
                        placeholder="200"
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs font-black text-slate-900 dark:text-white outline-none focus:border-indigo-600 dark:focus:border-cyan-400 text-left"
                        dir="ltr"
                      />
                      <span className="text-[10px] text-slate-400">تستحق عند تسجيل الطالب لأول مرة</span>
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-1.5">
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                        قسط الروضة الأساسي ({formData.currency || 'د.ل'})
                      </label>
                      <input
                        type="text"
                        value={currentFees.kindergartenFee}
                        onChange={(e) => handleFeeChange('kindergartenFee', e.target.value)}
                        placeholder="1400"
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs font-black text-slate-900 dark:text-white outline-none focus:border-indigo-600 dark:focus:border-cyan-400 text-left"
                        dir="ltr"
                      />
                      <span className="text-[10px] text-slate-400">إجمالي المصروفات الدراسية للروضة</span>
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-1.5">
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                        قسط التعليم المبكر ({formData.currency || 'د.ل'})
                      </label>
                      <input
                        type="text"
                        value={currentFees.earlyEducationFee}
                        onChange={(e) => handleFeeChange('earlyEducationFee', e.target.value)}
                        placeholder="1300"
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs font-black text-slate-900 dark:text-white outline-none focus:border-indigo-600 dark:focus:border-cyan-400 text-left"
                        dir="ltr"
                      />
                      <span className="text-[10px] text-slate-400">للفئات العمرية الصغرى</span>
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-1.5">
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                        قسط المرحلة التأهيلية ({formData.currency || 'د.ل'})
                      </label>
                      <input
                        type="text"
                        value={currentFees.preparatoryFee}
                        onChange={(e) => handleFeeChange('preparatoryFee', e.target.value)}
                        placeholder="1400"
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs font-black text-slate-900 dark:text-white outline-none focus:border-indigo-600 dark:focus:border-cyan-400 text-left"
                        dir="ltr"
                      />
                      <span className="text-[10px] text-slate-400">فصل التمهيدي والتأهيلي</span>
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-1.5">
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                        رسوم الزي المدرسي ({formData.currency || 'د.ل'})
                      </label>
                      <input
                        type="text"
                        value={currentFees.uniformFee}
                        onChange={(e) => handleFeeChange('uniformFee', e.target.value)}
                        placeholder="150"
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs font-black text-slate-900 dark:text-white outline-none focus:border-indigo-600 dark:focus:border-cyan-400 text-left"
                        dir="ltr"
                      />
                      <span className="text-[10px] text-slate-400">قيمة الزي الرسمي للطالب</span>
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-1.5">
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                        رسوم الكتب والمقررات ({formData.currency || 'د.ل'})
                      </label>
                      <input
                        type="text"
                        value={currentFees.booksFee}
                        onChange={(e) => handleFeeChange('booksFee', e.target.value)}
                        placeholder="150"
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs font-black text-slate-900 dark:text-white outline-none focus:border-indigo-600 dark:focus:border-cyan-400 text-left"
                        dir="ltr"
                      />
                      <span className="text-[10px] text-slate-400">المناهج والأنشطة الورقية</span>
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* ===================================================================== */}
            {/* TAB 3: WHATSAPP TEMPLATE & CURRENCY SETTINGS                          */}
            {/* ===================================================================== */}
            {activeTab === 'whatsapp' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                
                {/* Header Title Section */}
                <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                  <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
                    تخصيص قالب رسائل الواتساب والعملة
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    إعداد رسالة التذكير بالأقساط عبر WhatsApp مع دعم الحقول المتغيرة تلقائياً وضبط العملة
                  </p>
                </div>

                {/* Currency Settings Section */}
                <div className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center gap-2.5 border-b border-slate-200/70 dark:border-slate-800 pb-3">
                    <div className="p-2 bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-400 rounded-xl border border-amber-200 dark:border-amber-800">
                      <DollarSign size={18} />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-900 dark:text-slate-100">إعدادات العملة وتنسيق المبالغ</h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        تنعكس العملة تلقائياً في جداول الإيصالات، التقارير، وإشعارات الواتساب
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                    <div>
                      <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1.5">
                        رمز / نص العملة (Currency Symbol)
                      </label>
                      <input
                        type="text"
                        value={formData.currency}
                        onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                        placeholder="د.ل"
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-black text-slate-900 dark:text-white outline-none focus:border-indigo-600 dark:focus:border-cyan-400 text-center"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1.5">
                        موضع رمز العملة بالنسبة للمبلغ
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, currencyPosition: 'after' })}
                          className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                            formData.currencyPosition === 'after'
                              ? 'bg-indigo-950 text-white border-indigo-800 dark:bg-cyan-950 dark:border-cyan-500 shadow-sm'
                              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-100'
                          }`}
                        >
                          بعد المبلغ (500 {formData.currency || 'د.ل'})
                        </button>

                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, currencyPosition: 'before' })}
                          className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                            formData.currencyPosition === 'before'
                              ? 'bg-indigo-950 text-white border-indigo-800 dark:bg-cyan-950 dark:border-cyan-500 shadow-sm'
                              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-100'
                          }`}
                        >
                          قبل المبلغ ({formData.currency || 'د.ل'} 500)
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-slate-500 dark:text-slate-400 font-medium">معاينة عرض المبالغ المالية:</span>
                    <span className="font-black text-indigo-950 dark:text-cyan-300 text-sm">
                      {formatAmountCurrency(1500, { currency: formData.currency, currencyPosition: formData.currencyPosition })}
                    </span>
                  </div>
                </div>

                {/* WhatsApp Reminder Template Section */}
                <div className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200/70 dark:border-slate-800 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-emerald-100 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-400 rounded-xl border border-emerald-200 dark:border-emerald-800">
                        <MessageSquare size={18} />
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-slate-900 dark:text-slate-100">محرر قالب رسالة الواتساب</h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          انقر على المتغيرات لإدراجها تلقائياً داخل نص الرسالة
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Variables Buttons Strip */}
                  <div className="space-y-2">
                    <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                      المتغيرات الديناميكية المتاحة:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { tag: '{studentName}', label: 'اسم الطالب' },
                        { tag: '{amount}', label: 'المبلغ المستحق' },
                        { tag: '{currency}', label: 'رمز العملة' },
                        { tag: '{schoolName}', label: 'اسم المدرسة' },
                        { tag: '{grade}', label: 'المرحلة / الفصل' },
                        { tag: '{dueDate}', label: 'تاريخ الاستحقاق' }
                      ].map((item) => (
                        <button
                          key={item.tag}
                          type="button"
                          onClick={() => handleInsertTag(item.tag)}
                          className="inline-flex items-center gap-1 bg-white dark:bg-slate-900 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 text-slate-700 hover:text-emerald-900 dark:text-slate-300 dark:hover:text-emerald-300 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-[11px] font-bold transition-all cursor-pointer shadow-xs active:scale-95"
                        >
                          <Plus size={12} className="text-emerald-600 dark:text-emerald-400" />
                          <span>{item.label}</span>
                          <code className="text-[10px] text-slate-400 dir-ltr">{item.tag}</code>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Textarea */}
                  <div>
                    <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1.5">
                      نص القالب المعتمد:
                    </label>
                    <textarea
                      ref={whatsappTextareaRef}
                      rows={5}
                      value={formData.whatsappTemplate || DEFAULT_WHATSAPP_TEMPLATE}
                      onChange={(e) => setFormData({ ...formData, whatsappTemplate: e.target.value })}
                      placeholder="اكتب نص رسالة التذكير هنا..."
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-emerald-600 dark:focus:border-emerald-400 transition-all leading-relaxed"
                    />
                  </div>

                  {/* Live WhatsApp Preview Box */}
                  <div className="space-y-2 pt-1">
                    <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                      <Sparkles size={14} className="text-emerald-500" />
                      <span>معاينة حية لشكل الرسالة في واتساب ولي الأمر:</span>
                    </span>

                    <div className="bg-[#EFEAE2] dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-inner">
                      <div className="max-w-md bg-white dark:bg-slate-900 p-3.5 rounded-2xl rounded-tr-none shadow-sm text-xs text-slate-800 dark:text-slate-200 border border-emerald-100 dark:border-slate-800 space-y-2">
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5 text-[10px] text-emerald-800 dark:text-emerald-400 font-black">
                          <span>{formData.schoolName || 'مدرسة نور البيان'} - الإدارة المالية</span>
                          <span>الآن</span>
                        </div>
                        <p className="whitespace-pre-line text-xs font-medium leading-relaxed">
                          {sampleWhatsAppPreview}
                        </p>
                        <div className="flex justify-end pt-1">
                          <span className="text-[9px] text-slate-400">تم الإرسال عبر منظومة MASAR</span>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>

              </div>
            )}

            {/* ===================================================================== */}
            {/* TAB 4: USERS & LOCAL ROLES                                            */}
            {/* ===================================================================== */}
            {activeTab === 'users' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                
                <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
                      إدارة الوصول والأمان
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      تكوين شاشة الدخول، إدارة المستخدمين، ومراجعة سجل النشاطات
                    </p>
                  </div>
                </div>

                {/* Require Login Toggle */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-xl ${formData.requireLogin ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400' : 'bg-slate-50 text-slate-400 dark:bg-slate-800 dark:text-slate-500'}`}>
                        <Lock size={20} />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">تفعيل شاشة تسجيل الدخول بكلمة مرور</h4>
                        <p className="text-xs text-slate-500 mt-1">عند التفعيل، سيُطلب من أي مستخدم إدخال رمز المرور قبل الدخول للمنظومة</p>
                      </div>
                    </div>
                    <label className="flex items-center cursor-pointer relative w-12 h-6 rounded-full transition-colors duration-300 bg-slate-200 dark:bg-slate-700">
                      <input 
                        type="checkbox" 
                        className="sr-only" 
                        checked={formData.requireLogin || false}
                        onChange={(e) => setFormData(prev => ({ ...prev, requireLogin: e.target.checked }))}
                      />
                      <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full shadow-sm transition-transform duration-300 ${formData.requireLogin ? 'transform translate-x-6 bg-indigo-500' : 'bg-white'}`}></div>
                      <div className={`absolute inset-0 rounded-full transition-colors duration-300 ${formData.requireLogin ? 'bg-indigo-500' : 'bg-slate-200 dark:bg-slate-700'}`}></div>
                      <div className={`absolute left-1 top-1 w-4 h-4 rounded-full shadow-sm transition-transform duration-300 bg-white ${formData.requireLogin ? 'transform translate-x-6' : ''}`}></div>
                    </label>
                  </div>
                </div>

                {/* Users List */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                  <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
                    <div className="flex items-center gap-2">
                      <Users size={16} className="text-slate-500" />
                      <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">حسابات الموظفين</h4>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowAddUserModal(true)}
                      className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm active:scale-95 border border-indigo-200"
                    >
                      <Plus size={14} />
                      إضافة مستخدم
                    </button>
                  </div>
                  
                  {showAddUserModal && (
                    <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-indigo-50/30 dark:bg-slate-800/30 animate-in slide-in-from-top-2">
                      <form onSubmit={handleAddUser} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5">الاسم الكامل *</label>
                            <input type="text" required value={newUserName} onChange={e => setNewUserName(e.target.value)} className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="مثال: أحمد محمد" />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5">اسم المستخدم (للدخول) *</label>
                            <input type="text" required value={newUserUsername} onChange={e => setNewUserUsername(e.target.value)} className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="مثال: ahmed" />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5">رمز المرور (PIN) *</label>
                            <input type="password" required value={newUserPin} onChange={e => setNewUserPin(e.target.value)} className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="****" />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5">الصلاحية *</label>
                            <select value={newUserRole} onChange={e => setNewUserRole(e.target.value)} className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                              <option value="admin">مدير النظام (كامل الصلاحيات)</option>
                              <option value="cashier">موظف (تحصيل فقط)</option>
                            </select>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 pt-2">
                          <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-indigo-700 shadow-sm transition-all active:scale-95">حفظ المستخدم</button>
                          <button type="button" onClick={() => setShowAddUserModal(false)} className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-lg text-xs font-bold hover:bg-slate-50 transition-all">إلغاء</button>
                        </div>
                      </form>
                    </div>
                  )}

                  <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {formData.users.map(user => (
                      <div key={user.id} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 font-bold shrink-0">
                            {user.name.charAt(0)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{user.name}</span>
                              {user.id === 'user-admin-1' && (
                                <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded-full font-bold">الأساسي</span>
                              )}
                            </div>
                            <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                              <span className="font-mono">{user.username}</span>
                              <span>•</span>
                              <span className={user.role === 'admin' ? 'text-indigo-600' : 'text-emerald-600'}>
                                {user.role === 'admin' ? 'مدير نظام' : 'موظف'}
                              </span>
                            </div>
                          </div>
                        </div>
                        {user.id !== 'user-admin-1' && (
                          <button
                            type="button"
                            onClick={() => handleDeleteUser(user.id)}
                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="حذف المستخدم"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Audit Log Table */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                  <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                    <div className="flex items-center gap-2">
                      <FileText size={16} className="text-slate-500" />
                      <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">سجل النشاطات (Audit Log)</h4>
                    </div>
                  </div>
                  <div className="overflow-x-auto max-h-[300px] overflow-y-auto custom-scrollbar">
                    <table className="w-full text-start whitespace-nowrap text-sm border-collapse">
                      <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 text-[11px] font-bold uppercase tracking-wider sticky top-0 border-b border-slate-100 dark:border-slate-800">
                        <tr>
                          <th className="px-4 py-3 text-start">التاريخ والوقت</th>
                          <th className="px-4 py-3 text-start">المستخدم</th>
                          <th className="px-4 py-3 text-start">الإجراء</th>
                          <th className="px-4 py-3 text-start">التفاصيل</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                        {auditLogs.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="px-4 py-8 text-center text-slate-500 text-xs">
                              لا توجد نشاطات مسجلة حتى الآن.
                            </td>
                          </tr>
                        ) : (
                          auditLogs.map((log) => (
                            <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                              <td className="px-4 py-3 text-xs font-mono text-slate-500">
                                {new Date(log.timestamp).toLocaleString('ar-LY')}
                              </td>
                              <td className="px-4 py-3 font-bold text-xs">{log.userName}</td>
                              <td className="px-4 py-3 text-xs"><span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md font-bold">{log.action}</span></td>
                              <td className="px-4 py-3 text-xs text-slate-500 whitespace-normal min-w-[200px]">{log.details}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            )}
            {/* ===================================================================== */}
            {activeTab === 'backup' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                
                {/* Header Title Section */}
                <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                  <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
                    النسخ الاحتياطي وإدارة البيانات
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    تصدير قاعدة بيانات المنظومة محلياً بصيغة JSON واسترجاعها في أي وقت بأمان تام
                  </p>
                </div>

                {/* Backup Controls Wrapper */}
                <div className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6">
                  <BackupRestoreControls />
                </div>

                {/* License & Device Activation Card */}
                {(() => {
                  const currentLicense = getStoredLicense();
                  return (
                    <div className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-200/70 dark:border-slate-800 pb-3">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 bg-emerald-100 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-400 rounded-xl border border-emerald-200 dark:border-emerald-800">
                            <ShieldCheck size={18} />
                          </div>
                          <div>
                            <h4 className="text-xs font-black text-slate-900 dark:text-slate-100">
                              ترخيص وحماية المنظومة (Platform License)
                            </h4>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                              بيانات تفعيل النسخة المعتمدة على هذا الجهاز
                            </p>
                          </div>
                        </div>

                        <span className="inline-flex items-center gap-1.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-xs font-black px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                          <CheckCircle2 size={13} />
                          <span>المنظومة مفعلة ومعتمدة</span>
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200/70 dark:border-slate-800">
                          <span className="block text-[10px] text-slate-400 font-bold mb-1">المؤسسة المرخصة</span>
                          <span className="text-xs font-black text-slate-900 dark:text-white truncate block">
                            {currentLicense?.schoolName || formData.schoolName}
                          </span>
                        </div>

                        <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200/70 dark:border-slate-800">
                          <span className="block text-[10px] text-slate-400 font-bold mb-1">رقم الهاتف المعتمد</span>
                          <span className="text-xs font-mono font-black text-slate-900 dark:text-white truncate block text-left" dir="ltr">
                            {currentLicense?.phone || formData.phone || '0927211505'}
                          </span>
                        </div>

                        <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200/70 dark:border-slate-800">
                          <span className="block text-[10px] text-slate-400 font-bold mb-1">رمز التفعيل المستخدم</span>
                          <span className="text-xs font-mono font-black text-indigo-700 dark:text-cyan-400 truncate block text-left" dir="ltr">
                            {currentLicense?.key || 'MASAR-2026-ACTIVE'}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                        <p className="text-[11px] text-slate-400 dark:text-slate-500">
                          تاريخ التفعيل: {currentLicense?.activatedAt ? new Date(currentLicense.activatedAt).toLocaleDateString('ar-LY') : '2026'}
                        </p>

                        <div className="flex items-center gap-2">
                          <a
                            href={getWhatsAppActivationRequestUrl(currentLicense?.schoolName, currentLicense?.phone)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80 px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
                          >
                            <WhatsAppIcon size={14} className="text-emerald-600 dark:text-emerald-400" />
                            <span>تواصل مع المطور</span>
                          </a>

                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm('هل أنت متأكد من إلغاء تفعيل هذا الجهاز؟ سيتطلب الدخول إعادة إدخال رمز تفعيل صالح.')) {
                                deactivatePlatform();
                                onClose();
                              }
                            }}
                            className="inline-flex items-center gap-1 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-800 transition-colors cursor-pointer"
                          >
                            <Lock size={13} />
                            <span>إلغاء التفعيل / إعادة القفل</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })()}

              </div>
            )}

          </div>

        </div>

        {/* ========================================================================= */}
        {/* STICKY BOTTOM FOOTER BAR WITH SAVE & CANCEL CONTROLS                      */}
        {/* ========================================================================= */}
        <div className="px-6 py-4 bg-slate-50/90 dark:bg-slate-950/90 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between shrink-0 z-10">
          
          {/* Reset to Default */}
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 px-3 py-2 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
          >
            <RotateCcw size={14} />
            <span>استعادة الإعدادات الافتراضية</span>
          </button>

          {/* Action Buttons: Cancel and Save */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              إلغاء
            </button>

            <button
              type="button"
              onClick={() => handleSave()}
              className="inline-flex items-center gap-2 bg-indigo-950 hover:bg-indigo-900 dark:bg-cyan-600 dark:hover:bg-cyan-500 text-white px-6 py-2.5 rounded-xl text-xs font-black shadow-lg shadow-indigo-950/20 dark:shadow-cyan-900/30 transition-all cursor-pointer active:scale-95"
            >
              <Check size={16} strokeWidth={2.5} />
              <span>حفظ وتطبيق التغييرات</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};

export default SettingsModal;
