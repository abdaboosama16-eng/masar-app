import React, { useEffect, useState, useRef, useMemo } from 'react';
import { Search, UserPlus, Phone, CreditCard, MessageCircle, Wallet, Printer, Camera, Check, Receipt as ReceiptIcon, FileText, Trash2, AlertTriangle, Pencil, Sparkles, Users, ShieldCheck, Keyboard, ArrowUpDown, Clock, CheckCircle2, Calendar, Coins, FileSpreadsheet, MoreHorizontal } from 'lucide-react';
import { Student, Installment } from '../types';
import { tafqeet } from '../lib/tafqeet';
import { getWhatsAppReminderUrl } from '../lib/utils';
import { DocumentScanner } from './DocumentScanner';
import DailyClosingModal from './DailyClosingModal';
import Receipt from './Receipt';
import PhoneExtractionModal from './PhoneExtractionModal';
import WhatsAppReminderModal from './WhatsAppReminderModal';
import { ImportStudentsModal } from './ImportStudentsModal';
import { syncService } from '../lib/syncService';
import { useSchoolSettings, DEFAULT_FEES, DEFAULT_ACADEMIC_YEARS } from '../lib/settings';
import { getActiveSessionUser, hasPermission } from '../lib/auth';

export default function StudentsPage() {
  const { settings } = useSchoolSettings();
  const currentUser = getActiveSessionUser();
  const canDelete = currentUser ? hasPermission(currentUser, 'delete') : true;
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  
  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [studentToEdit, setStudentToEdit] = useState<Student | null>(null);
  const [showInstallmentModal, setShowInstallmentModal] = useState<Student | null>(null);
  const [showBulkWhatsApp, setShowBulkWhatsApp] = useState(false);
  const [whatsAppModalStudent, setWhatsAppModalStudent] = useState<{ student: Student; remainingAmount?: number } | null>(null);
  const [showDailyClosingModal, setShowDailyClosingModal] = useState(false);
  const [showPhoneExtractionModal, setShowPhoneExtractionModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [sortBy, setSortBy] = useState<'latest' | 'name_asc' | 'name_desc'>('latest');
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [alertMessage, setAlertMessage] = useState<{title: string, message: string, type: 'error' | 'success'} | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);

  // Auto-close dropdown when clicking outside
  useEffect(() => {
    const handleGlobalClick = () => {
      setOpenDropdownId(null);
    };
    document.addEventListener('click', handleGlobalClick);
    return () => {
      document.removeEventListener('click', handleGlobalClick);
    };
  }, []);

  // Print state
  const [showReceiptPreviewModal, setShowReceiptPreviewModal] = useState(false);
  const [receiptData, setReceiptData] = useState<{
    student: Student;
    paidAmount: number;
    remainingAmount: number;
    notes?: string;
    receiptNo?: string | number;
    date?: string;
    previousPaid?: number;
    previousPaymentsCount?: number;
  } | null>(null);

  useEffect(() => {
    fetchStudents();
    
    // Auto-update when syncService updates IndexedDB or receives online events
    const handleDataChanged = () => {
      fetchStudents();
    };
    window.addEventListener('appDataChanged', handleDataChanged);
    return () => window.removeEventListener('appDataChanged', handleDataChanged);
  }, []);

  const safeStudents = Array.isArray(students) ? students : [];

  // Global event listener for Command Palette Actions
  useEffect(() => {
    const handleOpenAddStudent = () => {
      setStudentToEdit(null);
      setShowAddModal(true);
    };
    window.addEventListener('open-add-student', handleOpenAddStudent);
    return () => window.removeEventListener('open-add-student', handleOpenAddStudent);
  }, []);

  // Global Keyboard Shortcuts (F2: New Student, Ctrl+P: Print Receipt)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // F2: Open New Student Registration Modal
      if (e.key === 'F2') {
        e.preventDefault();
        setStudentToEdit(null);
        setShowAddModal(true);
      }
      // Ctrl+P / Cmd+P: Print Receipt for selected student if modal is not open
      if ((e.ctrlKey || e.metaKey) && (e.key === 'p' || e.key === 'P')) {
        if (!showReceiptPreviewModal && !showAddModal && selectedStudentId) {
          e.preventDefault();
          const s = safeStudents.find(st => st.id === selectedStudentId);
          if (s) {
            handlePrintReceipt(s, s.total_paid || 0, s.final_fees - (s.total_paid || 0));
          }
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [selectedStudentId, safeStudents, showReceiptPreviewModal, showAddModal]);

  const fetchStudents = async () => {
    try {
      const list = await syncService.getStudents();
      setStudents(list);
    } catch (err) {
      console.error('Failed to load students from IndexedDB:', err);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStudentSaved = (studentName: string, isEdit: boolean) => {
    fetchStudents();
    setAlertMessage({
      title: isEdit ? "تم تحديث البيانات" : "تم الحفظ بنجاح",
      message: isEdit 
        ? `تم حفظ تعديلات الطالب "${studentName}" محلياً في IndexedDB وتحديث طابور المزامنة بنجاح!` 
        : `تم إضافة الطالب "${studentName}" وحفظ بياناته محلياً في IndexedDB وجاري المزامنة!`,
      type: "success"
    });
  };

  const handleConfirmDelete = async () => {
    if (!studentToDelete) return;
    setIsDeleting(true);
    try {
      const deletedId = studentToDelete.id;
      const deletedName = studentToDelete.name;

      await syncService.deleteStudent(deletedId);

      if (selectedStudentId === deletedId) {
        setSelectedStudentId(null);
      }
      setStudentToDelete(null);
      await fetchStudents();

      setAlertMessage({
        title: "تم الحذف بنجاح",
        message: `تم حذف بيانات الطالب "${deletedName}" محلياً وإضافته لطابور مزامنة الحذف.`,
        type: "success"
      });
    } catch (err) {
      console.error('Delete error:', err);
      setAlertMessage({
        title: "خطأ",
        message: "حدث خطأ أثناء محاولة حذف الطالب، يرجى المحاولة مرة أخرى.",
        type: "error"
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const sortedAndFilteredStudents = useMemo(() => {
    let list = safeStudents.filter(s => 
      (s.name && s.name.includes(searchTerm)) || 
      (s.father_phone && s.father_phone.includes(searchTerm)) || 
      (s.national_id && s.national_id.includes(searchTerm))
    );

    if (sortBy === 'name_asc') {
      return [...list].sort((a, b) => (a.name || '').localeCompare(b.name || '', 'ar'));
    } else if (sortBy === 'name_desc') {
      return [...list].sort((a, b) => (b.name || '').localeCompare(a.name || '', 'ar'));
    } else {
      // Latest added: sort by id descending
      return [...list].sort((a, b) => (b.id || 0) - (a.id || 0));
    }
  }, [safeStudents, searchTerm, sortBy]);

  const openWhatsApp = (phone: string | undefined, student: Student, remainingFees: number) => {
    const rawPhone = (phone || student.father_phone || student.mother_phone || '').trim();
    if (!rawPhone || rawPhone.length < 6) {
      // If phone is missing, open the smart prompt modal to let the user enter phone number easily
      setWhatsAppModalStudent({ student, remainingAmount: remainingFees });
      return;
    }
    const url = getWhatsAppReminderUrl(rawPhone, student.name, remainingFees, {
      customSchoolName: settings.schoolName,
      grade: student.grade,
      currency: settings.currency,
      template: settings.whatsappTemplate
    });
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handlePrintReceipt = (
    student: Student, 
    paidAmount: number, 
    remainingAmount: number, 
    notes?: string,
    previousPaid?: number,
    previousPaymentsCount?: number
  ) => {
    setReceiptData({
      student,
      paidAmount,
      remainingAmount,
      notes: notes || `سداد قسط دراسي - ${settings.schoolName}`,
      receiptNo: Math.floor(100000 + Math.random() * 900000),
      date: new Date().toISOString().split('T')[0],
      previousPaid,
      previousPaymentsCount
    });
    setShowReceiptPreviewModal(true);
  };

  return (
    <div className="space-y-7">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <span>إدارة الطلاب والأقساط</span>
          </h1>
        </div>

        <div className="flex flex-wrap gap-2.5 w-full lg:w-auto">
          {/* Import Students Data Button */}
          <button 
            onClick={() => setShowImportModal(true)}
            className="flex-1 sm:flex-none justify-center bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200/80 px-4 py-3 rounded-lg flex items-center gap-2 transition-all font-bold text-xs shadow-sm active:scale-[0.98] cursor-pointer"
            title="استيراد بيانات الطلاب من ملف إكسل أو CSV"
          >
            <FileSpreadsheet size={16} className="text-teal-600" />
            <span>استيراد بيانات الطلاب (Excel/CSV)</span>
          </button>

          {/* Daily Closing Button */}
          <button 
            onClick={() => setShowDailyClosingModal(true)}
            className="flex-1 sm:flex-none justify-center bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-3 rounded-lg flex items-center gap-2 transition-all font-bold text-xs shadow-sm shadow-emerald-600/10 active:scale-[0.98]"
          >
            <ShieldCheck size={16} />
            <span>جرد اليوم (إقفال الخزينة)</span>
          </button>

          {/* Extract Phone Numbers Button */}
          <button 
            onClick={() => setShowPhoneExtractionModal(true)}
            className="flex-1 sm:flex-none justify-center bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-3 rounded-lg flex items-center gap-2 transition-all font-bold text-xs shadow-sm shadow-cyan-600/10 active:scale-[0.98]"
          >
            <Phone size={16} />
            <span>استخراج الهواتف</span>
          </button>

          <button 
            onClick={() => setShowBulkWhatsApp(true)}
            className="flex-1 sm:flex-none justify-center bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/80 px-4 py-3 rounded-lg flex items-center gap-2 transition-all font-bold text-xs shadow-sm active:scale-[0.98]"
          >
            <MessageCircle size={16} className="text-emerald-600" />
            <span>إشعارات واتساب</span>
          </button>

          <button 
            onClick={() => {
              if (!selectedStudentId) {
                setAlertMessage({ title: "تنبيه", message: "الرجاء تحديد طالب من الجدول لطباعة الواصل المالي", type: "error" });
                return;
              }
              const s = safeStudents.find(st => st.id === selectedStudentId);
              if (s) {
                handlePrintReceipt(s, s.total_paid || 0, s.final_fees - (s.total_paid || 0));
              }
            }}
            className="flex-1 sm:flex-none justify-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg flex items-center gap-2 transition-all font-bold text-xs shadow-sm shadow-blue-600/10 active:scale-[0.98]"
          >
            <ReceiptIcon size={16} />
            <span>طباعة واصل مالي</span>
          </button>

          <button 
            onClick={() => {
              setStudentToEdit(null);
              setShowAddModal(true);
            }}
            className="flex-1 sm:flex-none justify-center bg-indigo-950 hover:bg-indigo-900 text-white px-5 py-3 rounded-lg flex items-center gap-2 transition-all font-bold text-xs shadow-sm shadow-indigo-950/10 active:scale-[0.98]"
          >
            <UserPlus size={16} className="text-amber-400" />
            <span>طالب جديد</span>
          </button>
          
          {settings.subscriptionPlan === 'enterprise' && (
            <button 
              onClick={() => {
                setAlertMessage({ title: "ميزة إنتربرايز", message: "سيتم فتح واجهة الاستيراد الذكي عبر الكاميرا قريباً...", type: "success" });
              }}
              className="flex-1 sm:flex-none justify-center bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-50 px-5 py-3 rounded-lg flex items-center gap-2 transition-all font-bold text-xs shadow-sm active:scale-[0.98]"
            >
              <Camera size={16} className="text-indigo-500" />
              <span>استيراد ذكي (الكاميرا)</span>
            </button>
          )}
        </div>
      </div>

      {/* Search & Sort Actions */}
      <div className="flex flex-col sm:flex-row items-center gap-4">
        {/* Search Input */}
        <div className="flex-1 w-full bg-white px-5 py-3.5 rounded-2xl border border-slate-200 flex items-center gap-3 shadow-sm transition-all focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100">
          <Search size={18} className="text-slate-400 shrink-0" />
          <input 
            type="text" 
            placeholder="ابحث بالاسم أو الرقم الوطني أو الهاتف..."
            className="bg-transparent border-none outline-none w-full text-slate-900 placeholder:text-slate-400 font-bold text-xs sm:text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Sort Dropdown Selector */}
        <div className="w-full sm:w-auto bg-white px-5 py-3.5 rounded-2xl border border-slate-200 flex items-center gap-2 shadow-sm shrink-0 hover:border-slate-300 transition-colors">
          <ArrowUpDown size={16} className="text-slate-500 shrink-0" />
          <span className="text-xs text-slate-500 font-bold whitespace-nowrap hidden md:inline">ترتيب:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'latest' | 'name_asc' | 'name_desc')}
            className="bg-transparent border-none outline-none text-slate-900 font-bold text-xs sm:text-sm cursor-pointer"
          >
            <option value="name_asc">الترتيب الأبجدي (أ - ي)</option>
            <option value="name_desc">الترتيب الأبجدي (ي - أ)</option>
            <option value="latest">الأحدث إضافة</option>
          </select>
        </div>
      </div>

      {/* Students DataGrid Table */}
      <div className="bg-white border border-slate-200 rounded-[20px] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-start whitespace-nowrap border-collapse">
            <thead className="bg-slate-100 text-slate-700 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-5 py-4 font-bold text-start">اسم الطالب</th>
                <th className="px-5 py-4 font-bold text-start">الصف</th>
                <th className="px-5 py-4 font-bold text-start">الفترة</th>
                <th className="px-5 py-4 font-bold text-start">هاتف الأب</th>
                <th className="px-5 py-4 font-bold text-start">الإجمالي</th>
                <th className="px-5 py-4 font-bold text-start">المدفوع</th>
                <th className="px-5 py-4 font-bold text-start">المتبقي</th>
                <th className="px-5 py-4 font-bold text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm font-medium">
              {loading ? (
                <tr><td colSpan={8} className="p-10 text-center text-slate-500 font-semibold">جاري تحميل بيانات الطلاب...</td></tr>
              ) : sortedAndFilteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="bg-blue-50 rounded-full p-6 mb-3">
                        <Users className="h-14 w-14 text-blue-300" />
                      </div>
                      <p className="font-extrabold text-slate-800 text-sm mb-1">لا يوجد طلاب مطابقين للبحث أو الفلتر</p>
                      <p className="text-xs text-slate-400">يمكنك إضافة طالب جديد أو تعديل كلمة البحث.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                sortedAndFilteredStudents.map(student => {
                  const remaining = student.final_fees - (student.total_paid || 0);
                  const isSelected = selectedStudentId === student.id;
                  return (
                    <tr 
                      key={student.id} 
                      onClick={() => setSelectedStudentId(student.id)}
                      className={`cursor-pointer transition-colors duration-150 ${isSelected ? 'bg-blue-50 border-r-4 border-blue-600' : 'hover:bg-blue-50'}`}
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm shrink-0 border border-indigo-200/50">
                            {student.name.charAt(0)}
                          </div>
                          <span className="font-extrabold text-slate-900 text-sm">{student.name}</span>
                          {remaining > 0 && remaining === student.final_fees && (
                            <StudentBadge type="financial_delay" label="لم يسدد" />
                          )}
                          {remaining > 0 && remaining < student.final_fees && (
                            <StudentBadge type="financial_delay" label="عليه قسط" />
                          )}
                          {remaining === 0 && student.final_fees > 0 && (
                            <StudentBadge type="excellent" label="خالص" />
                          )}
                          {!student.father_phone && !student.mother_phone && (
                            <StudentBadge type="admin_note" label="بيانات ناقصة" />
                          )}
                          {remaining > 0 && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                openWhatsApp(student.father_phone, student, remaining);
                              }}
                              className="text-emerald-600 hover:text-emerald-700 p-1 hover:bg-emerald-50 rounded-lg transition-all inline-flex items-center cursor-pointer active:scale-95"
                              title={`إرسال تذكير واتساب (${remaining} ${settings.currency || 'د.ل'})`}
                            >
                              <MessageCircle size={15} />
                            </button>
                          )}
                          {student.sync_status === 'pending' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-amber-50 text-amber-700 font-bold border border-amber-200" title="محفوظ محلياً - بانتظار المزامنة">
                              <Clock size={10} />
                              <span>معلق</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-bold border border-emerald-100" title="متزامن">
                              <CheckCircle2 size={12} className="ms-0.5" />
                              <span>متزامن</span>
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-slate-600 font-semibold">{student.grade || '-'}</td>
                      <td className="px-5 py-4 text-slate-500 font-medium">{student.period || '-'}</td>
                      <td className="px-5 py-4 text-slate-700 font-mono">{student.father_phone}</td>
                      <td className="px-5 py-4 font-extrabold text-slate-800">{student.final_fees} <span className="text-[10px] font-bold text-slate-400">د.ل</span></td>
                      <td className="px-5 py-4 font-extrabold text-emerald-600">{student.total_paid || 0} <span className="text-[10px] font-bold text-emerald-400">د.ل</span></td>
                      <td className="px-5 py-4">
                        {remaining > 0 ? (
                          <div className="flex flex-col gap-1 items-start">
                            <div className="font-extrabold text-red-600">{remaining} <span className="text-[10px] font-bold text-red-400">د.ل</span></div>
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded-lg border border-red-200 whitespace-nowrap shadow-sm">
                              متأخر
                            </span>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-1 items-start">
                            <div className="font-extrabold text-slate-400">0 <span className="text-[10px] font-bold text-slate-300">د.ل</span></div>
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-lg border border-green-200 whitespace-nowrap shadow-sm">
                              <CheckCircle2 size={10} className="text-green-600 shrink-0" />
                              <span>خالص</span>
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-2 relative">
                          {remaining > 0 && (
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                openWhatsApp(student.father_phone, student, remaining);
                              }}
                              className="inline-flex items-center gap-1 bg-white hover:bg-slate-50 border border-slate-200 active:scale-[0.98] text-slate-700 px-2.5 py-1.5 rounded-lg font-bold text-xs shadow-sm transition-all cursor-pointer whitespace-nowrap"
                              title="إرسال تذكير بالدفع عبر واتساب"
                            >
                              <MessageCircle size={14} className="text-emerald-600 shrink-0" />
                              <span>تذكير</span>
                            </button>
                          )}

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenDropdownId(openDropdownId === student.id ? null : student.id);
                            }}
                            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                          >
                            <MoreHorizontal size={18} />
                          </button>

                          {openDropdownId === student.id && (
                            <div className="absolute left-0 top-full mt-1 w-48 bg-white border border-slate-200 rounded-xl shadow-lg shadow-slate-200/50 z-50 overflow-hidden text-right animate-in fade-in slide-in-from-top-2">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenDropdownId(null);
                                  setShowInstallmentModal(student);
                                }}
                                className="w-full text-start px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors cursor-pointer"
                              >
                                <Wallet size={15} className="text-slate-400" />
                                <span>الأقساط والدفعات</span>
                              </button>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenDropdownId(null);
                                  handlePrintReceipt(student, student.total_paid || 0, remaining);
                                }}
                                className="w-full text-start px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors cursor-pointer"
                              >
                                <ReceiptIcon size={15} className="text-blue-500" />
                                <span>طباعة واصل مالي</span>
                              </button>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenDropdownId(null);
                                  setStudentToEdit(student);
                                  setShowAddModal(true);
                                }}
                                className="w-full text-start px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors cursor-pointer"
                              >
                                <Pencil size={15} className="text-amber-500" />
                                <span>تعديل بيانات الطالب</span>
                              </button>
                              {remaining > 0 && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenDropdownId(null);
                                    setWhatsAppModalStudent({ student, remainingAmount: remaining });
                                  }}
                                  className="w-full text-start px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors cursor-pointer"
                                >
                                  <MessageCircle size={15} className="text-emerald-500" />
                                  <span>تخصيص رسالة واتساب</span>
                                </button>
                              )}
                              {canDelete && (
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenDropdownId(null);
                                    setStudentToDelete(student);
                                  }}
                                  className="w-full text-start px-4 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50 border-t border-slate-100 flex items-center gap-2 transition-colors cursor-pointer"
                                >
                                  <Trash2 size={15} />
                                  <span>حذف الطالب</span>
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {showAddModal && (
        <StudentFormModal 
          studentToEdit={studentToEdit}
          existingStudents={safeStudents}
          onClose={() => {
            setShowAddModal(false);
            setStudentToEdit(null);
          }} 
          onSaved={handleStudentSaved} 
        />
      )}
      {showInstallmentModal && (
        <InstallmentModal 
          student={showInstallmentModal} 
          onClose={() => { setShowInstallmentModal(null); fetchStudents(); }} 
          onPaidReceipt={(student, paidAmount, remainingAmount, notes, prevPaid, prevCount) => {
            setShowInstallmentModal(null);
            fetchStudents();
            handlePrintReceipt(student, paidAmount, remainingAmount, notes, prevPaid, prevCount);
          }}
          onOpenWhatsAppModal={(student, remaining) => {
            setWhatsAppModalStudent({ student, remainingAmount: remaining });
          }}
        />
      )}
      {showBulkWhatsApp && (
        <BulkWhatsAppModal 
          students={students} 
          onClose={() => setShowBulkWhatsApp(false)}
          onOpenIndividualModal={(student, remaining) => {
            setWhatsAppModalStudent({ student, remainingAmount: remaining });
          }}
        />
      )}
      {whatsAppModalStudent && (
        <WhatsAppReminderModal
          isOpen={Boolean(whatsAppModalStudent)}
          student={whatsAppModalStudent.student}
          remainingAmount={whatsAppModalStudent.remainingAmount}
          onClose={() => setWhatsAppModalStudent(null)}
          onSuccess={() => {
            setAlertMessage({
              title: "تم الإرسال",
              message: `تم فتح محادثة واتساب لتذكير ولي أمر الطالب "${whatsAppModalStudent.student.name}" بنجاح!`,
              type: "success"
            });
          }}
        />
      )}
      {showDailyClosingModal && (
        <DailyClosingModal 
          students={safeStudents} 
          onClose={() => setShowDailyClosingModal(false)} 
        />
      )}
      {showImportModal && (
        <ImportStudentsModal 
          isOpen={showImportModal}
          onClose={() => setShowImportModal(false)}
          onSuccess={(count) => {
            fetchStudents();
            setAlertMessage({
              title: "اكتمل الاستيراد بنجاح",
              message: `تم استيراد ${count} طالب وحفظ بياناتهم في المنظومة وقاعدة البيانات بنجاح!`,
              type: "success"
            });
          }}
        />
      )}
      {showPhoneExtractionModal && (
        <PhoneExtractionModal 
          students={safeStudents} 
          onClose={() => setShowPhoneExtractionModal(false)} 
        />
      )}
      {studentToDelete && (
        <DeleteStudentModal
          student={studentToDelete}
          isDeleting={isDeleting}
          onClose={() => setStudentToDelete(null)}
          onConfirm={handleConfirmDelete}
        />
      )}
      {showReceiptPreviewModal && receiptData && (
        <ReceiptPreviewModal 
          receiptData={receiptData} 
          onClose={() => setShowReceiptPreviewModal(false)} 
          onPrint={() => window.print()} 
        />
      )}

      {/* Alert Modal */}
      {alertMessage && (
        <div className="fixed inset-0 bg-slate-900/80 dark:bg-slate-950/80 flex items-center justify-center z-[100] p-4">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[15px] w-full max-w-sm overflow-hidden shadow-[0_0_30px_rgba(0,0,0,0.5)]">
            <div className={`px-6 py-4 border-b ${alertMessage.type === 'error' ? 'border-red-500/50 bg-red-500/10 text-red-400' : 'border-lime-500/50 bg-lime-500/10 text-lime-400'} flex justify-between items-center`}>
              <h2 className="font-bold text-lg">{alertMessage.title}</h2>
              <button onClick={() => setAlertMessage(null)} className="hover:text-white">&times;</button>
            </div>
            <div className="p-6">
              <p className="text-slate-600 dark:text-slate-300 text-center text-lg">{alertMessage.message}</p>
              <button 
                onClick={() => setAlertMessage(null)} 
                className={`w-full mt-6 py-2 rounded-lg font-bold transition-colors ${alertMessage.type === 'error' ? 'bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-900 dark:text-white' : 'bg-lime-600 hover:bg-lime-500 text-slate-900'}`}
              >
                حسناً
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Financial Receipt Print Document (3 Identical Receipts fitting in 1 A4 page) */}
      <div id="print-section" className="hidden print:block absolute top-0 left-0 w-[210mm] bg-white text-black font-sans m-0 p-0" style={{ direction: 'rtl', margin: 0, padding: 0 }}>
        {receiptData && (
          <div className="receipt-print-container flex flex-col items-center justify-between m-0 p-0" style={{ gap: 0, margin: 0, padding: 0 }}>
            <Receipt receiptData={receiptData} copyLabel="أصل (نسخة الإدارة)" showCutLine={true} />
            <Receipt receiptData={receiptData} copyLabel="صورة (نسخة الحسابات)" showCutLine={true} />
            <Receipt receiptData={receiptData} copyLabel="صورة (نسخة ولي الأمر)" showCutLine={false} />
          </div>
        )}
      </div>
    </div>
  );
}

// Student Form Modal (Add & Edit Student with Smart National ID Parsing, Sibling Auto-fill & Dynamic Settings Fees)
function StudentFormModal({ 
  studentToEdit, 
  existingStudents, 
  onClose, 
  onSaved 
}: { 
  studentToEdit?: Student | null;
  existingStudents: Student[];
  onClose: () => void; 
  onSaved: (studentName: string, isEdit: boolean) => void;
}) {
  const { settings } = useSchoolSettings();
  const currentFees = settings.defaultFees || DEFAULT_FEES;
  const isEditMode = Boolean(studentToEdit);
  const [showScanner, setShowScanner] = useState(false);

  const getDefaultFeeForGrade = (grade: string) => {
    if (grade === 'التعليم المبكر') return String(currentFees.earlyEducationFee || 1300);
    if (grade === 'الروضة') return String(currentFees.kindergartenFee || 1400);
    if (grade === 'التأهيلي') return String(currentFees.preparatoryFee || currentFees.kindergartenFee || 1400);
    return String(currentFees.kindergartenFee || 1400);
  };

  const initialGrade = studentToEdit?.grade || 'التعليم المبكر';
  const initialAcademicYear = studentToEdit?.academic_year || settings.activeAcademicYear || settings.academicYear || '2025/2026';
  const initialBaseFee = studentToEdit 
    ? String(studentToEdit.base_fees || studentToEdit.final_fees || getDefaultFeeForGrade(initialGrade))
    : getDefaultFeeForGrade(initialGrade);

  const [formData, setFormData] = useState({ 
    name: studentToEdit?.name || '', 
    father_phone: studentToEdit?.father_phone || '', 
    mother_phone: studentToEdit?.mother_phone || '',
    national_id: studentToEdit?.national_id || '',
    gender: (studentToEdit?.gender || 'ذكر') as 'ذكر' | 'أنثى',
    birth_date: studentToEdit?.birth_date || '',
    grade: initialGrade, 
    period: studentToEdit?.period || 'صباحي',
    academic_year: initialAcademicYear,
    base_fees: initialBaseFee,
    initial_paid: studentToEdit ? String(studentToEdit.total_paid || '0') : '',
    birth_certificate: studentToEdit?.birth_certificate || ''
  });

  const [loading, setLoading] = useState(false);
  const [nationalIdInfo, setNationalIdInfo] = useState<{
    gender: 'ذكر' | 'أنثى';
    year: number;
    age: number;
    grade: string;
    fee: string;
  } | null>(null);

  const formRef = useRef<HTMLFormElement>(null);
  const submitButtonRef = useRef<HTMLButtonElement>(null);
  const [autoFillToast, setAutoFillToast] = useState<string | null>(null);

  // Monitor grade changes to set default fees
  const handleGradeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const grade = e.target.value;
    setFormData(prev => ({ 
      ...prev, 
      grade, 
      base_fees: getDefaultFeeForGrade(grade) 
    }));
  };

  // Smart 12-digit Libyan National ID Parser
  const handleNationalIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleanId = e.target.value.replace(/[^0-9]/g, '');
    
    // Check if ID is being typed/pasted
    if (cleanId.length >= 5) {
      const firstChar = cleanId.charAt(0);
      const detectedGender: 'ذكر' | 'أنثى' = firstChar === '2' ? 'أنثى' : 'ذكر';

      // Parse birth year (standard Libyan format: digits 2 to 5 or 2 to 3)
      let parsedYear: number | null = null;
      const possible4DigitYear = parseInt(cleanId.substring(1, 5), 10);
      if (possible4DigitYear >= 1990 && possible4DigitYear <= 2035) {
        parsedYear = possible4DigitYear;
      } else {
        const possible2DigitYear = parseInt(cleanId.substring(1, 3), 10);
        if (!isNaN(possible2DigitYear)) {
          parsedYear = possible2DigitYear <= 35 ? 2000 + possible2DigitYear : 1900 + possible2DigitYear;
        }
      }

      if (parsedYear) {
        const currentYear = new Date().getFullYear();
        const calculatedAge = currentYear - parsedYear;

        // Auto Grade & Fee determination
        let autoGrade = 'التعليم المبكر';
        if (parsedYear === 2021 || calculatedAge >= 5) {
          autoGrade = 'التأهيلي';
        } else if (parsedYear === 2022 || calculatedAge === 4) {
          autoGrade = 'الروضة';
        } else if (parsedYear >= 2023 || calculatedAge <= 3) {
          autoGrade = 'التعليم المبكر';
        }

        const autoFee = getDefaultFeeForGrade(autoGrade);

        setNationalIdInfo({
          gender: detectedGender,
          year: parsedYear,
          age: calculatedAge,
          grade: autoGrade,
          fee: autoFee
        });

        setFormData(prev => ({
          ...prev,
          national_id: cleanId,
          gender: detectedGender,
          birth_date: prev.birth_date || `${parsedYear}-01-01`,
          grade: !isEditMode ? autoGrade : prev.grade,
          base_fees: !isEditMode ? autoFee : prev.base_fees
        }));
        return;
      }
    } else {
      setNationalIdInfo(null);
    }

    setFormData(prev => ({ ...prev, national_id: cleanId }));
  };

  // Keyboard navigation: Enter moves to the next field
  const handleFormKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    if (e.key === 'Enter') {
      const target = e.target as HTMLElement;
      if (target.tagName === 'TEXTAREA' || (target.tagName === 'BUTTON' && target.getAttribute('type') === 'submit')) {
        return;
      }
      e.preventDefault();

      if (!formRef.current) return;
      const focusable: HTMLElement[] = Array.from(
        formRef.current.querySelectorAll(
          'input:not([disabled]):not([type="hidden"]), select:not([disabled]), button[type="submit"]'
        )
      );

      const currentIndex = focusable.indexOf(target);
      if (currentIndex > -1 && currentIndex < focusable.length - 1) {
        focusable[currentIndex + 1].focus();
      } else if (currentIndex === focusable.length - 1) {
        submitButtonRef.current?.click();
      }
    }
  };

  // Keyboard Shortcut: Ctrl + S / Cmd + S to save immediately
  useEffect(() => {
    const handleCtrlS = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        submitButtonRef.current?.click();
      }
    };
    window.addEventListener('keydown', handleCtrlS);
    return () => window.removeEventListener('keydown', handleCtrlS);
  }, []);

  // Sibling auto-suggest logic based on phone or name
  const siblingSuggestions = useMemo(() => {
    if (isEditMode) return [];
    const fPhone = formData.father_phone.trim();
    const mPhone = formData.mother_phone.trim();
    const rawName = formData.name.trim();

    if (fPhone.length < 3 && mPhone.length < 3 && rawName.length < 2) return [];

    const candidates: Student[] = [];
    const seen = new Set<string>();

    for (const st of existingStudents) {
      if (studentToEdit && st.id === studentToEdit.id) continue;
      let isMatch = false;

      // Phone match
      if (fPhone.length >= 3 && st.father_phone && st.father_phone.includes(fPhone)) {
        isMatch = true;
      } else if (mPhone.length >= 3 && st.mother_phone && st.mother_phone.includes(mPhone)) {
        isMatch = true;
      } else if (rawName.length >= 2) {
        // Family name tokens match
        const nameParts = rawName.split(/\s+/).filter(Boolean);
        const stParts = st.name.split(/\s+/).filter(Boolean);
        
        if (nameParts.length >= 2) {
          const sharedParts = nameParts.filter(p => stParts.includes(p));
          if (sharedParts.length >= 2) isMatch = true;
        } else if (nameParts.length === 1 && nameParts[0].length >= 3) {
          const token = nameParts[0];
          if (stParts.slice(1).some(p => p === token || p.includes(token))) {
            isMatch = true;
          }
        }
      }

      if (isMatch) {
        const key = `${st.father_phone}-${st.name}`;
        if (!seen.has(key)) {
          seen.add(key);
          candidates.push(st);
        }
      }
    }

    return candidates.slice(0, 3);
  }, [formData.father_phone, formData.mother_phone, formData.name, existingStudents, isEditMode, studentToEdit]);

  const handleApplySiblingData = (sibling: Student) => {
    setFormData(prev => {
      let updatedName = prev.name.trim();
      const sibParts = sibling.name.trim().split(/\s+/).filter(Boolean);
      const currentParts = updatedName.split(/\s+/).filter(Boolean);

      // If user only typed student's first name, auto-complete with father/family name
      if (currentParts.length === 1 && sibParts.length > 1) {
        const familySuffix = sibParts.slice(1).join(' ');
        updatedName = `${currentParts[0]} ${familySuffix}`;
      }

      return {
        ...prev,
        name: updatedName,
        father_phone: sibling.father_phone || prev.father_phone,
        mother_phone: sibling.mother_phone || prev.mother_phone,
      };
    });

    setAutoFillToast(`تمت التعبئة التلقائية لبيانات ولي الأمر من سجل الأخ (${sibling.name})`);
    setTimeout(() => setAutoFillToast(null), 4000);
  };

  const handleNumberInput = (e: any, field: string) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddExtraFee = (extraAmount: number) => {
    const current = Number(formData.base_fees) || 0;
    setFormData(prev => ({ ...prev, base_fees: String(current + extraAmount) }));
  };

  const handleSetBaseFeeOnly = (grade: string) => {
    setFormData(prev => ({ ...prev, base_fees: getDefaultFeeForGrade(grade) }));
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('الرجاء إدخال اسم الطالب');
      return;
    }
    setLoading(true);

    try {
      const fatherPhone = formData.father_phone.trim();
      const finalFees = Number(formData.base_fees) || 0;
      const initialPaid = Number(formData.initial_paid) || 0;

      if (isEditMode && studentToEdit) {
        // === UPDATE EXISTING STUDENT ===
        await syncService.saveStudent({
          ...studentToEdit,
          name: formData.name.trim(),
          father_phone: fatherPhone,
          mother_phone: formData.mother_phone.trim(),
          national_id: formData.national_id.trim(),
          gender: formData.gender,
          birth_date: formData.birth_date,
          grade: formData.grade,
          period: formData.period,
          academic_year: formData.academic_year,
          base_fees: finalFees,
          final_fees: finalFees,
          birth_certificate: formData.birth_certificate || studentToEdit.birth_certificate
        }, true, studentToEdit.id);

        onSaved(formData.name.trim(), true);
      } else {
        // === CREATE NEW STUDENT ===
        const newStudentData: Partial<Student> = {
          name: formData.name.trim(),
          father_phone: fatherPhone,
          mother_phone: formData.mother_phone.trim(),
          national_id: formData.national_id.trim(),
          gender: formData.gender,
          birth_date: formData.birth_date,
          grade: formData.grade,
          period: formData.period,
          academic_year: formData.academic_year,
          base_fees: finalFees,
          discount: 0,
          final_fees: finalFees,
          total_paid: initialPaid,
          birth_certificate: formData.birth_certificate
        };

        const saved = await syncService.saveStudent(newStudentData, false);
        onSaved(saved.name, false);
      }

      onClose();
    } catch (err) {
      console.error('Error saving student to IndexedDB:', err);
      alert('حدث خطأ أثناء حفظ بيانات الطالب');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 dark:bg-slate-950/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      {showScanner && (
        <DocumentScanner 
          onScanComplete={(data) => {
            setShowScanner(false);
            if (data.name) setFormData(prev => ({ ...prev, name: data.name! }));
            // Add other fields if applicable
          }}
          onClose={() => setShowScanner(false)}
        />
      )}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[20px] w-full max-w-2xl overflow-hidden shadow-[0_0_35px_rgba(0,0,0,0.5)] flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-100 dark:bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            {isEditMode ? (
              <div className="p-2 bg-amber-500/20 text-amber-500 rounded-xl">
                <Pencil size={20} />
              </div>
            ) : (
              <div className="p-2 bg-lime-500/20 text-lime-600 dark:text-lime-400 rounded-xl">
                <UserPlus size={20} />
              </div>
            )}
            <div>
              <h2 className="font-extrabold text-lg text-slate-900 dark:text-slate-100">
                {isEditMode ? 'تعديل بيانات الطالب المسجل' : 'تسجيل طالب جديد'}
              </h2>
              {!isEditMode && (
                <button
                  type="button"
                  onClick={() => setShowScanner(true)}
                  className="mt-1 flex items-center gap-1 text-[11px] font-bold text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 bg-cyan-50 dark:bg-cyan-900/30 px-2 py-0.5 rounded-full transition-colors border border-cyan-100 dark:border-cyan-800"
                >
                  <Camera size={12} />
                  مسح مستند (استيراد ذكي)
                </button>
              )}
              <p className="text-xs text-slate-500 dark:text-slate-400">
                دعم الإدخال الذكي من الرقم الوطني والتنقل بمفتاح Enter
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-mono bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-1 rounded-md border border-slate-300 dark:border-slate-700">
              <Keyboard size={12} />
              <span>Ctrl+S للحفظ</span>
            </span>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors text-2xl font-bold p-1 leading-none">
              &times;
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-4">
          {/* Sibling Toast */}
          {autoFillToast && (
            <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
              <Sparkles size={16} className="text-emerald-500 shrink-0" />
              <span>{autoFillToast}</span>
            </div>
          )}

          {/* Sibling Auto-fill Suggestions Bar */}
          {!isEditMode && siblingSuggestions.length > 0 && (
            <div className="p-3.5 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-blue-700 dark:text-blue-300">
                <Users size={16} />
                <span>اقتراح إخوة مسجلين مسبقاً (اضغط للتعبئة التلقائية لبيانات ولي الأمر):</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {siblingSuggestions.map(sib => (
                  <button
                    key={sib.id}
                    type="button"
                    onClick={() => handleApplySiblingData(sib)}
                    className="bg-white dark:bg-slate-800 border border-blue-300 dark:border-blue-700 hover:border-blue-500 text-slate-800 dark:text-slate-200 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all"
                  >
                    <Sparkles size={13} className="text-amber-500" />
                    <span>الأخ: {sib.name}</span>
                    <span className="text-slate-500 font-mono text-[11px]">({sib.father_phone})</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Smart Libyan National ID Parsing Badge */}
          {nationalIdInfo && (
            <div className="p-3 bg-gradient-to-r from-lime-500/15 to-emerald-500/15 border border-lime-500/30 rounded-xl text-xs space-y-1.5 text-slate-800 dark:text-slate-200 animate-in fade-in">
              <div className="flex items-center gap-2 font-bold text-lime-700 dark:text-lime-400">
                <Sparkles size={16} />
                <span>تم التعرف التلقائي على الرقم الوطني وتحديد بيانات الطالب:</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-medium text-[11px]">
                <div className="bg-white/80 dark:bg-slate-900/80 p-1.5 rounded border border-lime-500/20 text-center">
                  <span className="text-slate-500 block text-[10px]">الجنس</span>
                  <strong className="text-slate-900 dark:text-slate-100">{nationalIdInfo.gender}</strong>
                </div>
                <div className="bg-white/80 dark:bg-slate-900/80 p-1.5 rounded border border-lime-500/20 text-center">
                  <span className="text-slate-500 block text-[10px]">المواليد والعمر</span>
                  <strong className="text-slate-900 dark:text-slate-100">{nationalIdInfo.year} ({nationalIdInfo.age} سنوات)</strong>
                </div>
                <div className="bg-white/80 dark:bg-slate-900/80 p-1.5 rounded border border-lime-500/20 text-center">
                  <span className="text-slate-500 block text-[10px]">الصف المقترح</span>
                  <strong className="text-lime-700 dark:text-lime-300">{nationalIdInfo.grade}</strong>
                </div>
                <div className="bg-white/80 dark:bg-slate-900/80 p-1.5 rounded border border-lime-500/20 text-center">
                  <span className="text-slate-500 block text-[10px]">الرسوم التلقائية</span>
                  <strong className="text-lime-700 dark:text-lime-300">{nationalIdInfo.fee} د.ل</strong>
                </div>
              </div>
            </div>
          )}

          <form ref={formRef} onKeyDown={handleFormKeyDown} onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              
              <div className="md:col-span-2">
                <label className="block text-sm text-slate-700 dark:text-slate-300 mb-1 font-semibold">
                  اسم الطالب رباعي <span className="text-red-500">*</span>
                </label>
                <input 
                  required 
                  autoFocus
                  type="text" 
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 text-slate-900 dark:text-slate-100 outline-none focus:border-lime-500 transition-colors" 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                  placeholder="مثال: عمر طارق محمد الفيتوري"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-700 dark:text-slate-300 mb-1 font-semibold flex items-center justify-between">
                  <span>الرقم الوطني (12 رقم)</span>
                  <span className="text-[11px] font-normal text-slate-500">استخراج ذكي</span>
                </label>
                <input 
                  type="text" 
                  maxLength={12} 
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 text-slate-900 dark:text-slate-100 outline-none focus:border-lime-500 transition-colors font-mono tracking-wider" 
                  value={formData.national_id} 
                  onChange={handleNationalIdChange} 
                  placeholder="120210000000" 
                />
              </div>

              <div>
                <label className="block text-sm text-slate-700 dark:text-slate-300 mb-1 font-semibold">
                  الجنس (ذكر / أنثى)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, gender: 'ذكر' }))}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${formData.gender === 'ذكر' ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : 'bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'}`}
                  >
                    ذكر (1)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, gender: 'أنثى' }))}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${formData.gender === 'أنثى' ? 'bg-pink-600 text-white border-pink-600 shadow-sm' : 'bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'}`}
                  >
                    أنثى (2)
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm text-slate-700 dark:text-slate-300 mb-1 font-semibold">تاريخ الميلاد</label>
                <input 
                  type="date" 
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 text-slate-900 dark:text-slate-100 outline-none focus:border-lime-500 transition-colors [color-scheme:dark]" 
                  value={formData.birth_date} 
                  onChange={e => setFormData({...formData, birth_date: e.target.value})} 
                />
              </div>

              <div>
                <label className="block text-sm text-slate-700 dark:text-slate-300 mb-1 font-semibold">
                  رقم هاتف الأب (واتساب) <span className="text-red-500">*</span>
                </label>
                <input 
                  required 
                  type="text" 
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 text-slate-900 dark:text-slate-100 outline-none focus:border-lime-500 transition-colors font-mono" 
                  value={formData.father_phone} 
                  onChange={e => handleNumberInput(e, 'father_phone')} 
                  placeholder="مثال: 0912345678" 
                />
              </div>

              <div>
                <label className="block text-sm text-slate-700 dark:text-slate-300 mb-1 font-semibold">رقم هاتف الأم / الاحتياطي</label>
                <input 
                  type="text" 
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 text-slate-900 dark:text-slate-100 outline-none focus:border-lime-500 transition-colors font-mono" 
                  value={formData.mother_phone} 
                  onChange={e => handleNumberInput(e, 'mother_phone')} 
                  placeholder="مثال: 0923456789" 
                />
              </div>

              <div>
                <label className="block text-sm text-slate-700 dark:text-slate-300 mb-1 font-semibold">الصف الدراسي</label>
                <select 
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 text-slate-900 dark:text-slate-100 outline-none focus:border-lime-500 transition-colors font-semibold" 
                  value={formData.grade} 
                  onChange={handleGradeChange}
                >
                  <option value="التعليم المبكر">التعليم المبكر ({currentFees.earlyEducationFee || 1300} د.ل)</option>
                  <option value="الروضة">الروضة ({currentFees.kindergartenFee || 1400} د.ل)</option>
                  <option value="التأهيلي">التأهيلي ({currentFees.preparatoryFee || currentFees.kindergartenFee || 1400} د.ل)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-slate-700 dark:text-slate-300 mb-1 font-semibold">السنة الدراسية</label>
                <select 
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 text-slate-900 dark:text-slate-100 outline-none focus:border-lime-500 transition-colors font-semibold" 
                  value={formData.academic_year} 
                  onChange={e => setFormData({ ...formData, academic_year: e.target.value })}
                >
                  {(settings.academicYears || DEFAULT_ACADEMIC_YEARS).map(year => (
                    <option key={year} value={year}>
                      {year} {year === (settings.activeAcademicYear || settings.academicYear) ? '★ (السنة النشطة)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm text-slate-700 dark:text-slate-300 mb-1 font-semibold">الفترة الدراسية</label>
                <select 
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 text-slate-900 dark:text-slate-100 outline-none focus:border-lime-500 transition-colors" 
                  value={formData.period} 
                  onChange={e => setFormData({...formData, period: e.target.value})}
                >
                  <option value="صباحي">صباحي</option>
                  <option value="مسائي">مسائي</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    إجمالي الرسوم الدراسية (د.ل)
                  </label>
                  <span className="text-xs text-lime-600 dark:text-lime-400 font-medium">
                    مسترد من الإعدادات الافتراضية
                  </span>
                </div>
                <input 
                  required 
                  type="text" 
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-2.5 text-slate-900 dark:text-slate-100 font-bold text-lg outline-none focus:border-lime-500 transition-colors" 
                  value={formData.base_fees} 
                  onChange={e => handleNumberInput(e, 'base_fees')}
                  placeholder="أدخل إجمالي الرسوم..."
                />
                
                {/* Quick fee shortcut chips */}
                <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium ml-1">تعبئة سريعة:</span>
                  <button
                    type="button"
                    onClick={() => handleSetBaseFeeOnly(formData.grade)}
                    className="text-xs px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-lime-50 dark:hover:bg-lime-950/40 text-slate-700 dark:text-slate-300 hover:text-lime-600 dark:hover:text-lime-400 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors font-medium"
                  >
                    قسط المرحلة ({getDefaultFeeForGrade(formData.grade)} د.ل)
                  </button>
                  {Boolean(currentFees.registrationFee) && (
                    <button
                      type="button"
                      onClick={() => handleAddExtraFee(currentFees.registrationFee)}
                      className="text-xs px-2 py-1 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 text-amber-800 dark:text-amber-300 rounded-lg border border-amber-200 dark:border-amber-800/50 transition-colors font-medium"
                    >
                      + تسجيل ({currentFees.registrationFee} د.ل)
                    </button>
                  )}
                  {Boolean(currentFees.uniformFee) && (
                    <button
                      type="button"
                      onClick={() => handleAddExtraFee(currentFees.uniformFee)}
                      className="text-xs px-2 py-1 bg-cyan-50 dark:bg-cyan-950/40 hover:bg-cyan-100 text-cyan-800 dark:text-cyan-300 rounded-lg border border-cyan-200 dark:border-cyan-800/50 transition-colors font-medium"
                    >
                      + زي ({currentFees.uniformFee} د.ل)
                    </button>
                  )}
                  {Boolean(currentFees.booksFee) && (
                    <button
                      type="button"
                      onClick={() => handleAddExtraFee(currentFees.booksFee)}
                      className="text-xs px-2 py-1 bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 text-purple-800 dark:text-purple-300 rounded-lg border border-purple-200 dark:border-purple-800/50 transition-colors font-medium"
                    >
                      + كتب ({currentFees.booksFee} د.ل)
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      const total = Number(getDefaultFeeForGrade(formData.grade)) + (currentFees.registrationFee || 0) + (currentFees.uniformFee || 0) + (currentFees.booksFee || 0);
                      setFormData(prev => ({ ...prev, base_fees: String(total) }));
                    }}
                    className="text-xs px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-800 dark:text-emerald-300 rounded-lg border border-emerald-200 dark:border-emerald-800/50 transition-colors font-medium"
                  >
                    شامل الرسوم واللوازم ({Number(getDefaultFeeForGrade(formData.grade)) + (currentFees.registrationFee || 0) + (currentFees.uniformFee || 0) + (currentFees.booksFee || 0)} د.ل)
                  </button>
                </div>

                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
                  * الرسوم التلقائية المعتمدة: التعليم المبكر ({currentFees.earlyEducationFee || 1300} د.ل) / الروضة ({currentFees.kindergartenFee || 1400} د.ل) / التأهيلي ({currentFees.preparatoryFee || currentFees.kindergartenFee || 1400} د.ل).
                </p>
              </div>

              {!isEditMode && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    المبلغ المدفوع عند التسجيل (د.ل) - اختياري
                  </label>
                  <input 
                    type="text" 
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-2.5 text-slate-900 dark:text-slate-100 font-bold text-lg outline-none focus:border-lime-500 transition-colors" 
                    value={formData.initial_paid} 
                    onChange={e => handleNumberInput(e, 'initial_paid')} 
                    placeholder="0.00"
                  />
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    * في حال سداد أي دفعة الآن، سيتم تسجيلها تلقائياً كوارد في الخزينة اليومية.
                  </p>
                </div>
              )}

              {/* Birth Certificate / Documents Section */}
              <div className="md:col-span-2 pt-2">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  إرفاق شهادة الميلاد / المستندات
                </label>
                
                <div className="flex flex-wrap items-center gap-3">
                  <input 
                    type="file" 
                    accept="image/*" 
                    capture="environment" 
                    className="hidden" 
                    id="cameraInput" 
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          const base64 = reader.result as string;
                          setFormData(prev => ({ ...prev, birth_certificate: base64 }));
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                  <label 
                    htmlFor="cameraInput" 
                    className="cursor-pointer inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white px-4 py-2.5 rounded-lg text-xs font-semibold shadow-sm transition-all"
                  >
                    <Camera size={16} />
                    <span>إرفاق مستند / فتح الكاميرا</span>
                  </label>

                  {formData.birth_certificate && (
                    <div className="inline-flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 px-3 py-1.5 rounded-lg text-xs font-medium text-emerald-700 dark:text-emerald-300">
                      <Check size={14} className="text-emerald-600 dark:text-emerald-400" />
                      <span>تم إرفاق المستند بنجاح</span>
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, birth_certificate: '' }))}
                        className="text-rose-600 hover:text-rose-700 font-bold mr-1.5 px-1 transition-colors"
                        title="حذف المستند"
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>
              </div>

            </div>

            <div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-slate-700/50 mt-4">
              <button type="button" onClick={onClose} className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 py-2.5 rounded-lg transition-colors font-medium text-sm">
                إلغاء
              </button>
              <button 
                ref={submitButtonRef}
                type="submit" 
                disabled={loading} 
                className={`flex-[2] py-2.5 rounded-lg transition-all duration-200 font-medium text-sm text-white shadow-sm hover:shadow-md active:scale-[0.98] ${isEditMode ? 'bg-amber-600 hover:bg-amber-700' : 'bg-blue-600 hover:bg-blue-700'}`}
              >
                {loading ? 'جاري الحفظ...' : (isEditMode ? 'حفظ التعديلات (Ctrl+S)' : 'حفظ بيانات الطالب (Ctrl+S)')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// Installment Modal
function InstallmentModal({ 
  student, 
  onClose,
  onPaidReceipt,
  onOpenWhatsAppModal
}: { 
  student: Student; 
  onClose: () => void;
  onPaidReceipt?: (student: Student, paidAmount: number, remainingAmount: number, notes?: string, previousPaid?: number, previousPaymentsCount?: number) => void;
  onOpenWhatsAppModal?: (student: Student, remaining: number) => void;
}) {
  const { settings } = useSchoolSettings();
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [payAmount, setPayAmount] = useState('');
  const [notes, setNotes] = useState('سداد قسط دراسي');
  const [errorMsg, setErrorMsg] = useState('');
  
  useEffect(() => {
    try {
      const storedInst = localStorage.getItem('installments_data');
      const allInst: Installment[] = storedInst ? JSON.parse(storedInst) : [];
      let studentInsts = allInst.filter(i => i.student_id === student.id);

      if (studentInsts.length === 0) {
        const defaultInst: Installment = {
          id: Date.now(),
          student_id: student.id,
          amount: student.final_fees,
          paid: student.total_paid || 0,
          due_date: new Date().toISOString().split('T')[0]
        };
        studentInsts = [defaultInst];
        localStorage.setItem('installments_data', JSON.stringify([...allInst, defaultInst]));
      }
      setInstallments(studentInsts);
    } catch (err) {
      console.error('Failed to load installments:', err);
      setInstallments([{
        id: Date.now(),
        student_id: student.id,
        amount: student.final_fees,
        paid: student.total_paid || 0
      }]);
    }
  }, [student.id, student.final_fees, student.total_paid]);

  const safeInstallments = Array.isArray(installments) ? installments : [];
  const inst = safeInstallments[0];
  const remaining = inst ? inst.amount - inst.paid : 0;

  const handlePay = async (instId: number) => {
    setErrorMsg('');
    const amount = Number(payAmount);
    if (!payAmount || isNaN(amount) || amount <= 0) {
      setErrorMsg('الرجاء إدخال مبلغ صحيح أكبر من الصفر');
      return;
    }
    
    if (amount > remaining) {
      setErrorMsg('المبلغ المدفوع أكبر من المبلغ المتبقي على الطالب');
      return;
    }

    try {
      await syncService.payInstallment(student.id, amount, notes);

      setPayAmount('');
      onClose();
      if (onPaidReceipt) {
        const prevPaid = student.total_paid || 0;
        const prevCount = prevPaid > 0 ? 1 : 0;
        onPaidReceipt(student, amount, remaining - amount, notes, prevPaid, prevCount);
      }
    } catch (err) {
      console.error('Payment error:', err);
      setErrorMsg('حدث خطأ أثناء السداد');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 dark:bg-slate-950/80 flex items-center justify-center z-[110] p-4">
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[15px] w-full max-w-md overflow-hidden shadow-[0_0_30px_rgba(0,0,0,0.5)]">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-100 dark:bg-slate-900/50">
          <h2 className="font-bold text-lg text-slate-900 dark:text-slate-100">تسجيل دفعة مالية</h2>
          <button onClick={onClose} className="text-slate-500 dark:text-slate-400 hover:text-white">&times;</button>
        </div>
        <div className="p-6">
          {inst ? (
            <div className="space-y-4">
              <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 mb-2">
                <div className="flex justify-between mb-2">
                  <span className="text-slate-500 dark:text-slate-400 text-sm">اسم الطالب:</span> 
                  <span className="font-bold text-slate-900 dark:text-slate-200">{student.name}</span>
                </div>
                <div className="flex justify-between mt-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                  <span className="text-slate-600 dark:text-slate-300">المتبقي عليه:</span> 
                  <span className="font-bold text-orange-400 text-lg">{remaining} د.ل</span>
                </div>
                {remaining > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                    <button
                      type="button"
                      onClick={() => {
                        const phone = (student.father_phone || student.mother_phone || '').trim();
                        if (phone) {
                          const url = getWhatsAppReminderUrl(phone, student.name, remaining, {
                            customSchoolName: settings.schoolName,
                            grade: student.grade,
                            currency: settings.currency,
                            template: settings.whatsappTemplate
                          });
                          window.open(url, '_blank', 'noopener,noreferrer');
                        } else if (onOpenWhatsAppModal) {
                          onOpenWhatsAppModal(student, remaining);
                        }
                      }}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white p-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-sm active:scale-[0.98] cursor-pointer"
                    >
                      <MessageCircle size={15} className="shrink-0" />
                      <span>
                        {student.father_phone || student.mother_phone 
                          ? `إرسال تذكير بالدفع عبر واتساب (${student.father_phone || student.mother_phone})`
                          : 'إرسال تذكير بالدفع عبر واتساب (إدخال الرقم)'}
                      </span>
                    </button>
                  </div>
                )}
              </div>
              
              {errorMsg && (
                <div className="bg-red-500/10 text-red-400 border border-red-500/50 p-3 rounded-lg text-sm text-center">
                  {errorMsg}
                </div>
              )}

              <div>
                <label className="block text-sm text-slate-500 dark:text-slate-400 mb-1">المبلغ المدفوع الآن (د.ل)</label>
                <input 
                  type="text" 
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-slate-200 outline-none focus:border-lime-500 transition-colors font-bold text-lg" 
                  value={payAmount} 
                  onChange={e => {
                    const val = e.target.value.replace(/[^0-9.]/g, '');
                    setPayAmount(val);
                  }} 
                  placeholder="0.00" 
                />
              </div>

              <div>
                <label className="block text-sm text-slate-500 dark:text-slate-400 mb-1">ملاحظات / البيان</label>
                <input 
                  type="text" 
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-slate-200 outline-none focus:border-lime-500 transition-colors" 
                  value={notes} 
                  onChange={e => setNotes(e.target.value)} 
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={onClose} className="flex-1 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-900 dark:text-white py-3 rounded-xl transition-colors font-bold">
                  إلغاء
                </button>
                <button onClick={() => handlePay(inst.id)} className="flex-[2] bg-lime-600 hover:bg-lime-500 text-slate-900 py-3 rounded-xl transition-colors font-bold shadow-[0_0_15px_rgba(132,204,22,0.2)]">
                  تأكيد الدفع
                </button>
              </div>
            </div>
          ) : (
            <div className="text-slate-500 dark:text-slate-400 text-center py-4">لا توجد أقساط مسجلة لهذا الطالب</div>
          )}
        </div>
      </div>
    </div>
  );
}

// Bulk WhatsApp Modal
function BulkWhatsAppModal({ 
  students = [], 
  onClose,
  onOpenIndividualModal
}: { 
  students: Student[]; 
  onClose: () => void;
  onOpenIndividualModal?: (student: Student, remaining: number) => void;
}) {
  const { settings } = useSchoolSettings();
  const safeStudents = Array.isArray(students) ? students : [];
  const targetStudents = safeStudents.filter(s => {
    const remaining = s.final_fees - (s.total_paid || 0);
    return remaining > 0;
  });

  return (
    <div className="fixed inset-0 bg-slate-900/80 dark:bg-slate-950/80 flex items-center justify-center z-[110] p-4 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[15px] w-full max-w-2xl overflow-hidden shadow-[0_0_30px_rgba(0,0,0,0.5)] flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-100 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-500/20 p-2 rounded-lg text-emerald-400">
              <MessageCircle size={24} />
            </div>
            <div>
              <h2 className="font-bold text-lg text-slate-900 dark:text-slate-100">المراسلة الجماعية والتذكير (واتساب)</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">{targetStudents.length} طلاب لديهم أقساط متبقية</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-500 dark:text-slate-400 hover:text-white transition-colors text-2xl font-bold">&times;</button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
          {targetStudents.length === 0 ? (
            <div className="text-center py-10 text-slate-500 dark:text-slate-400">
              لا يوجد طلاب لديهم أقساط متبقية حالياً.
            </div>
          ) : (
            <div className="space-y-3">
              {targetStudents.map(student => {
                const remaining = student.final_fees - (student.total_paid || 0);
                const phone = (student.father_phone || student.mother_phone || '').trim();
                const waLink = phone ? getWhatsAppReminderUrl(phone, student.name, remaining, {
                  customSchoolName: settings.schoolName,
                  grade: student.grade,
                  currency: settings.currency,
                  template: settings.whatsappTemplate
                }) : '#';

                return (
                  <div key={student.id} className="bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/50 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-center gap-4 hover:border-emerald-500/50 transition-colors">
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-slate-200 text-sm flex items-center gap-2">
                        <span>{student.name}</span>
                        <span className="text-xs text-slate-500 dark:text-slate-400 font-normal">({student.grade || 'غير محدد'})</span>
                      </h3>
                      <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1">
                        <span>المتبقي: <strong className="text-rose-600 dark:text-rose-400 font-black">{remaining} {settings.currency || 'د.ل'}</strong></span>
                        <span>•</span>
                        <span>الهاتف: <strong className="font-mono text-slate-700 dark:text-slate-300">{phone || 'غير مسجل'}</strong></span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      {phone ? (
                        <a 
                          href={waLink} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-all text-xs font-bold w-full sm:w-auto justify-center shadow-sm"
                        >
                          <MessageCircle size={15} />
                          <span>إرسال تذكير</span>
                        </a>
                      ) : null}

                      <button
                        type="button"
                        onClick={() => {
                          if (onOpenIndividualModal) {
                            onOpenIndividualModal(student, remaining);
                          }
                        }}
                        className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors ${!phone ? 'bg-amber-600 hover:bg-amber-700 text-white w-full sm:w-auto justify-center' : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-700'}`}
                        title={!phone ? "إدخال رقم الهاتف والإرسال" : "تخصيص الرسالة قبل الإرسال"}
                      >
                        {!phone ? (
                          <>
                            <Phone size={13} />
                            <span>إدخال رقم الهاتف وإرسال</span>
                          </>
                        ) : (
                          <>
                            <Pencil size={13} />
                            <span>تخصيص</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Receipt Preview Modal (1/3 A4 Portrait View)
function ReceiptPreviewModal({ 
  receiptData, 
  onClose, 
  onPrint 
}: { 
  receiptData: { 
    student: Student; 
    paidAmount: number; 
    remainingAmount: number; 
    notes?: string; 
    receiptNo?: string | number; 
    date?: string;
    previousPaid?: number;
    previousPaymentsCount?: number;
  };
  onClose: () => void;
  onPrint: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-slate-950/85 flex items-center justify-center z-[120] p-4 backdrop-blur-md">
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[15px] w-full max-w-5xl overflow-hidden shadow-[0_0_30px_rgba(0,0,0,0.5)] flex flex-col max-h-[95vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-100 dark:bg-slate-900/60">
          <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100 font-bold">
            <ReceiptIcon size={20} className="text-blue-500" />
            <span>معاينة إيصال السداد المالي (20cm × 9.8cm)</span>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors text-xl font-bold">&times;</button>
        </div>

        {/* Modal Body - Table Preview */}
        <div className="p-6 overflow-y-auto overflow-x-auto flex-1 bg-slate-200/80 dark:bg-slate-950/90 flex flex-col items-center justify-center gap-4 custom-scrollbar">
          <div className="text-xs text-slate-600 dark:text-slate-400 font-medium text-center">
            تم ضبط مقاس الإيصال بالضبط على 20 سم عرض × 9.8 سم ارتفاع بجداول HTML مسطحة
          </div>
          
          <div className="bg-white text-black p-0 border border-black shadow-2xl w-[20cm] max-w-[20cm] box-border" style={{ direction: 'rtl' }}>
            <Receipt receiptData={receiptData} />
          </div>
        </div>

        {/* Modal Actions */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-900 dark:text-white py-2.5 rounded-xl transition-colors font-bold text-sm"
          >
            إغلاق
          </button>
          <button
            onClick={onPrint}
            className="flex-[2] bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-xl transition-all duration-300 font-bold text-sm flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(59,130,246,0.3)] hover:scale-[1.01]"
          >
            <Printer size={18} />
            <span>طباعة الإيصال (Print)</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// Delete Student Confirmation Modal
function DeleteStudentModal({
  student,
  isDeleting,
  onClose,
  onConfirm
}: {
  student: Student;
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-slate-950/80 flex items-center justify-center z-[110] p-4 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[15px] w-full max-w-md overflow-hidden shadow-[0_0_30px_rgba(239,68,68,0.25)] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-red-500/30 bg-red-500/10 flex justify-between items-center text-red-600 dark:text-red-400">
          <div className="flex items-center gap-2.5 font-bold text-lg">
            <div className="p-2 bg-red-500/20 rounded-xl">
              <AlertTriangle size={20} className="text-red-500" />
            </div>
            <span>تأكيد حذف الطالب</span>
          </div>
          <button 
            onClick={onClose} 
            disabled={isDeleting}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors text-2xl font-bold leading-none"
          >
            &times;
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-start">
          <p className="text-slate-800 dark:text-slate-200 text-base leading-relaxed">
            هل أنت متأكد من حذف بيانات الطالب <strong className="text-red-600 dark:text-red-400 font-black">[{student.name}]</strong> نهائياً؟ هذا الإجراء لا يمكن التراجع عنه.
          </p>

          {/* Student Info Card */}
          <div className="bg-slate-50 dark:bg-slate-900/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/70 text-xs space-y-2 text-slate-600 dark:text-slate-300">
            <div className="flex justify-between items-center">
              <span className="text-slate-500 dark:text-slate-400">الصف الدراسي:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{student.grade || 'غير محدد'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 dark:text-slate-400">هاتف ولي الأمر:</span>
              <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{student.father_phone}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 dark:text-slate-400">إجمالي الرسوم:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{student.final_fees} د.ل</span>
            </div>
            {student.total_paid !== undefined && (
              <div className="flex justify-between items-center pt-1 border-t border-slate-200 dark:border-slate-700/50">
                <span className="text-slate-500 dark:text-slate-400">المبلغ المسدد:</span>
                <span className="font-bold text-lime-500">{student.total_paid} د.ل</span>
              </div>
            )}
          </div>

          <div className="text-xs text-amber-600 dark:text-amber-400/90 bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-lg flex items-center gap-2">
            <AlertTriangle size={15} className="shrink-0 text-amber-500" />
            <span>سيتم حذف سجل الطالب وكافة أقساطه المرتبطة من المنظومة والتخزين المحلي.</span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="flex-1 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 py-2.5 rounded-xl transition-colors font-bold text-sm disabled:opacity-50"
          >
            إلغاء
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-[1.5] bg-red-600 hover:bg-red-500 text-white py-2.5 rounded-xl transition-all duration-200 font-bold text-sm flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(239,68,68,0.4)] hover:scale-[1.02] disabled:opacity-50"
          >
            <Trash2 size={16} />
            <span>{isDeleting ? 'جاري الحذف...' : 'نعم، احذف الطالب نهائياً'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

