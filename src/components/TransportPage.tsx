import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  BusFront, 
  Search, 
  Printer, 
  Download, 
  Phone, 
  MessageCircle, 
  MapPin, 
  Pencil, 
  Check, 
  X, 
  Users, 
  UserCheck, 
  GraduationCap, 
  Clock, 
  Filter, 
  FileSpreadsheet, 
  AlertCircle,
  Sparkles,
  ChevronDown
} from 'lucide-react';
import { Student } from '../types';
import { syncService } from '../lib/syncService';
import { useSchoolSettings } from '../lib/settings';
import { PrintHeader } from './ui/PrintHeader';
import { PrintFooter } from './ui/PrintFooter';

export default function TransportPage() {
  const { settings } = useSchoolSettings();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('all');
  const [selectedPeriod, setSelectedPeriod] = useState('all');
  
  // Inline editing for landmark
  const [editingLandmarkId, setEditingLandmarkId] = useState<number | null>(null);
  const [editingLandmarkText, setEditingLandmarkText] = useState('');
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  // Load students
  const loadData = async () => {
    try {
      setLoading(true);
      const data = await syncService.getStudents();
      setStudents(data);
    } catch (err) {
      console.error('Error fetching students for transport:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const handleDataChange = () => loadData();
    window.addEventListener('sync:dataChanged', handleDataChange);
    return () => window.removeEventListener('sync:dataChanged', handleDataChange);
  }, []);

  // Filter transport students
  const transportStudents = useMemo(() => {
    return students.filter(s => Boolean(s.hasTransport || (s as any).has_transport));
  }, [students]);

  // Filtered list based on search & filters
  const filteredStudents = useMemo(() => {
    return transportStudents.filter(student => {
      const landmark = student.transportLandmark || (student as any).transport_landmark || '';
      const matchesSearch = 
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.father_phone.includes(searchTerm) ||
        (student.mother_phone && student.mother_phone.includes(searchTerm)) ||
        landmark.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesGrade = selectedGrade === 'all' || student.grade === selectedGrade;
      const matchesPeriod = selectedPeriod === 'all' || (student.period || 'صباحي') === selectedPeriod;

      return matchesSearch && matchesGrade && matchesPeriod;
    });
  }, [transportStudents, searchTerm, selectedGrade, selectedPeriod]);

  // Statistics
  const stats = useMemo(() => {
    const total = transportStudents.length;
    const earlyEdu = transportStudents.filter(s => s.grade === 'التعليم المبكر').length;
    const kg = transportStudents.filter(s => s.grade === 'الروضة').length;
    const prep = transportStudents.filter(s => s.grade === 'التأهيلي').length;
    const withLandmark = transportStudents.filter(s => {
      const lm = s.transportLandmark || (s as any).transport_landmark;
      return lm && lm.trim().length > 0;
    }).length;

    return { total, earlyEdu, kg, prep, withLandmark };
  }, [transportStudents]);

  // Handle inline landmark save
  const handleSaveLandmark = async (student: Student) => {
    try {
      setUpdatingId(student.id);
      await syncService.saveStudent({
        ...student,
        transportLandmark: editingLandmarkText.trim(),
        hasTransport: true
      }, true, student.id);

      setEditingLandmarkId(null);
      setEditingLandmarkText('');
    } catch (err) {
      console.error('Error updating transport landmark:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  // Toggle transport membership
  const handleToggleTransport = async (student: Student) => {
    const isEnrolled = Boolean(student.hasTransport || (student as any).has_transport);
    const confirmed = window.confirm(
      isEnrolled 
        ? `هل أنت متأكد من إلغاء اشتراك الطالب "${student.name}" من خدمة المواصلات؟`
        : `هل ترغب في تسجيل الطالب "${student.name}" في خدمة المواصلات؟`
    );

    if (!confirmed) return;

    try {
      setUpdatingId(student.id);
      await syncService.saveStudent({
        ...student,
        hasTransport: !isEnrolled,
        transportLandmark: !isEnrolled ? (student.transportLandmark || '') : ''
      }, true, student.id);
    } catch (err) {
      console.error('Error toggling transport status:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (filteredStudents.length === 0) return;

    const headers = ['م', 'اسم الطالب', 'المرحلة', 'الفترة', 'هاتف الأب', 'هاتف الأم', 'أقرب نقطة دالة'];
    const rows = filteredStudents.map((s, idx) => [
      idx + 1,
      `"${s.name}"`,
      `"${s.grade || ''}"`,
      `"${s.period || 'صباحي'}"`,
      `"${s.father_phone || ''}"`,
      `"${s.mother_phone || ''}"`,
      `"${(s.transportLandmark || (s as any).transport_landmark || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `كشف_المواصلات_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Print list
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans">
      
      {/* 1. Header & Quick Actions (Screen only) */}
      <div className="print:hidden flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-800/60 backdrop-blur-md p-6 rounded-2xl border border-slate-200/80 dark:border-slate-700/50 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-200/60 shadow-sm">
            <BusFront size={26} />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-2.5">
              <span>إدارة خدمة المواصلات</span>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300">
                {stats.total} مشترك
              </span>
            </h1>
            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1">
              متابعة طلاب النقل المدرسي، خطوط السير، وأقرب نقاط دالة لكشوفات السائق والطباعة
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={handleExportCSV}
            disabled={filteredStudents.length === 0}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-700/70 text-slate-700 dark:text-gray-100 text-xs font-bold transition-all shadow-sm active:scale-95 disabled:opacity-50"
            title="تصدير كشف إكسل"
          >
            <FileSpreadsheet size={15} className="text-emerald-600 dark:text-emerald-400" />
            <span>تصدير CSV</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            disabled={filteredStudents.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-white text-xs font-bold transition-all shadow-sm shadow-amber-500/20 disabled:opacity-50"
            title="طباعة كشف حافلة المواصلات A4"
          >
            <Printer size={16} />
            <span>طباعة الكشف المعتمد (A4)</span>
          </button>
        </div>
      </div>

      {/* 2. Statistical Highlights (Screen only - Pastel Theme) */}
      <div className="print:hidden grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200/80 dark:border-blue-900/40 rounded-2xl p-4 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-blue-900 dark:text-blue-200">إجمالي المشتركين</span>
            <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
              <BusFront size={15} />
            </div>
          </div>
          <div className="text-2xl font-black text-blue-700 dark:text-blue-400 font-mono">{stats.total}</div>
          <span className="text-[11px] text-blue-600/80 dark:text-blue-400">طالب وطالبة</span>
        </div>

        <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-900/40 rounded-2xl p-4 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200">التعليم المبكر</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
              <GraduationCap size={15} />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-700 dark:text-emerald-400 font-mono">{stats.earlyEdu}</div>
          <span className="text-[11px] text-emerald-600/80 dark:text-emerald-400">طالب مسجل</span>
        </div>

        <div className="bg-fuchsia-50 dark:bg-fuchsia-950/20 border border-fuchsia-200/80 dark:border-fuchsia-900/40 rounded-2xl p-4 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-fuchsia-900 dark:text-fuchsia-200">الروضة</span>
            <div className="w-7 h-7 rounded-lg bg-fuchsia-100 text-fuchsia-600 flex items-center justify-center font-bold">
              <GraduationCap size={15} />
            </div>
          </div>
          <div className="text-2xl font-black text-fuchsia-700 dark:text-fuchsia-400 font-mono">{stats.kg}</div>
          <span className="text-[11px] text-fuchsia-600/80 dark:text-fuchsia-400">طالب مسجل</span>
        </div>

        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40 rounded-2xl p-4 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-amber-900 dark:text-amber-200">التأهيلي</span>
            <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center font-bold">
              <GraduationCap size={15} />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-700 dark:text-amber-400 font-mono">{stats.prep}</div>
          <span className="text-[11px] text-amber-600/80 dark:text-amber-400">طالب مسجل</span>
        </div>

        <div className="bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-200/80 dark:border-indigo-900/40 rounded-2xl p-4 transition-all col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-indigo-900 dark:text-indigo-200">نقاط دالة مسجلة</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
              <MapPin size={15} />
            </div>
          </div>
          <div className="text-2xl font-black text-indigo-700 dark:text-indigo-400 font-mono">
            {stats.withLandmark} <span className="text-xs text-indigo-500 font-sans">/ {stats.total}</span>
          </div>
          <span className="text-[11px] text-indigo-600/80 dark:text-indigo-400">
            {stats.total > 0 ? `${Math.round((stats.withLandmark / stats.total) * 100)}% مكتمل` : 'لا يوجد'}
          </span>
        </div>
      </div>

      {/* 3. Search, Filter & View Controls (Screen only) */}
      <div className="print:hidden flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white dark:bg-slate-800/60 backdrop-blur-md p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/50 shadow-sm">
        <div className="relative flex-1">
          <Search size={17} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="بحث باسم الطالب، هاتف ولي الأمر، أو أقرب نقطة دالة..."
            className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-100 text-xs md:text-sm outline-none focus:border-amber-500 transition-colors"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900/60 p-1 rounded-xl border border-slate-200/70 dark:border-slate-700/70 text-xs">
            <button
              type="button"
              onClick={() => setSelectedGrade('all')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                selectedGrade === 'all'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              جميع المراحل
            </button>
            <button
              type="button"
              onClick={() => setSelectedGrade('التعليم المبكر')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                selectedGrade === 'التعليم المبكر'
                  ? 'bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              مبكر
            </button>
            <button
              type="button"
              onClick={() => setSelectedGrade('الروضة')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                selectedGrade === 'الروضة'
                  ? 'bg-white dark:bg-slate-800 text-fuchsia-700 dark:text-fuchsia-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              روضة
            </button>
            <button
              type="button"
              onClick={() => setSelectedGrade('التأهيلي')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                selectedGrade === 'التأهيلي'
                  ? 'bg-white dark:bg-slate-800 text-amber-700 dark:text-amber-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              تأهيلي
            </button>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900/60 p-1 rounded-xl border border-slate-200/70 dark:border-slate-700/70 text-xs">
            <button
              type="button"
              onClick={() => setSelectedPeriod('all')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                selectedPeriod === 'all'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              كل الفترات
            </button>
            <button
              type="button"
              onClick={() => setSelectedPeriod('صباحي')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                selectedPeriod === 'صباحي'
                  ? 'bg-white dark:bg-slate-800 text-amber-700 dark:text-amber-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              صباحي
            </button>
            <button
              type="button"
              onClick={() => setSelectedPeriod('مسائي')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                selectedPeriod === 'مسائي'
                  ? 'bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              مسائي
            </button>
          </div>
        </div>
      </div>

      {/* 4. Transport Students Table (Screen View) */}
      <div className="print:hidden bg-white dark:bg-slate-800/60 backdrop-blur-md rounded-2xl border border-slate-200/80 dark:border-slate-700/50 shadow-sm overflow-hidden">
        {filteredStudents.length === 0 ? (
          <div className="py-16 text-center px-4">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-500 mx-auto flex items-center justify-center mb-4 border border-amber-200/60">
              <BusFront size={32} />
            </div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 mb-1">
              {transportStudents.length === 0 
                ? 'لا يوجد طلاب مسجلين في خدمة المواصلات حالياً'
                : 'لا توجد نتائج مطابقة للبحث'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              {transportStudents.length === 0 
                ? 'لتسجيل طالب في خدمة المواصلات، انتقل إلى صفحة الطلاب وقم بتفعيل خيار "الاشتراك في خدمة المواصلات" وتحديد أقرب نقطة دالة.'
                : 'جرّب تعديل كلمات البحث أو تصفية المراحل الدراسية والفترات.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse text-xs md:text-sm">
              <thead>
                <tr className="bg-slate-50/80 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700/80 text-slate-600 dark:text-slate-300 font-bold">
                  <th className="py-3.5 px-4 w-12 text-center">#</th>
                  <th className="py-3.5 px-4">اسم الطالب</th>
                  <th className="py-3.5 px-4">المرحلة / الفترة</th>
                  <th className="py-3.5 px-4">رقم ولي الأمر</th>
                  <th className="py-3.5 px-4">أقرب نقطة دالة / السكن</th>
                  <th className="py-3.5 px-4 text-left">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredStudents.map((student, index) => {
                  const landmark = student.transportLandmark || (student as any).transport_landmark || '';
                  const isEditingLandmark = editingLandmarkId === student.id;

                  return (
                    <tr 
                      key={student.id} 
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-700/30 transition-colors"
                    >
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-400">
                        {index + 1}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center font-bold text-xs shrink-0 border border-amber-200/60">
                            {student.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-extrabold text-slate-900 dark:text-slate-100">
                              {student.name}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              رقم القيد: {student.id}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-bold ${
                            student.grade === 'التعليم المبكر'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                              : student.grade === 'الروضة'
                              ? 'bg-fuchsia-50 text-fuchsia-700 border border-fuchsia-200/60'
                              : 'bg-amber-50 text-amber-700 border border-amber-200/60'
                          }`}>
                            {student.grade || 'غير محدد'}
                          </span>
                          <span className="inline-block px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                            {student.period || 'صباحي'}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">
                            {student.father_phone || student.mother_phone || 'لا يوجد'}
                          </span>
                          {student.father_phone && (
                            <a
                              href={`https://wa.me/${student.father_phone.replace(/[^0-9]/g, '')}`}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
                              title="مراسلة واتساب"
                            >
                              <MessageCircle size={15} />
                            </a>
                          )}
                          {student.father_phone && (
                            <a
                              href={`tel:${student.father_phone}`}
                              className="p-1 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
                              title="اتصال هاتفي"
                            >
                              <Phone size={15} />
                            </a>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 min-w-[240px]">
                        {isEditingLandmark ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="text"
                              autoFocus
                              value={editingLandmarkText}
                              onChange={(e) => setEditingLandmarkText(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveLandmark(student);
                                if (e.key === 'Escape') setEditingLandmarkId(null);
                              }}
                              placeholder="أدخل أقرب نقطة دالة..."
                              className="w-full bg-white dark:bg-slate-900 border border-amber-400 rounded-lg px-2.5 py-1 text-xs outline-none shadow-xs"
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveLandmark(student)}
                              disabled={updatingId === student.id}
                              className="p-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 shrink-0"
                              title="حفظ"
                            >
                              <Check size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingLandmarkId(null)}
                              className="p-1.5 rounded-lg bg-slate-200 text-slate-600 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-300 shrink-0"
                              title="إلغاء"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between group">
                            <div className="flex items-center gap-1.5">
                              <MapPin size={14} className={landmark ? "text-amber-500 shrink-0" : "text-slate-300 shrink-0"} />
                              <span className={`text-xs ${landmark ? "font-semibold text-slate-800 dark:text-slate-200" : "text-slate-400 italic"}`}>
                                {landmark || 'لم تسجل نقطة دالة'}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingLandmarkId(student.id);
                                setEditingLandmarkText(landmark);
                              }}
                              className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-amber-600 rounded transition-all"
                              title="تعديل النقطة الدالة"
                            >
                              <Pencil size={13} />
                            </button>
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-left">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleToggleTransport(student)}
                            disabled={updatingId === student.id}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200/60 transition-colors"
                            title="إلغاء اشتراك المواصلات"
                          >
                            <X size={12} />
                            <span>إلغاء الاشتراك</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 5. DEDICATED PRINT TEMPLATE FOR TRANSPORT (A4 Print Layout Only) */}
      {/* ========================================================================= */}
      <div id="transport-print-section" className="hidden print:block font-sans text-black bg-white p-8 max-w-full" dir="rtl">
        {/* Print Header */}
        <PrintHeader
          title="كشف حافلة المواصلات المدرسية وخطوط السير"
          subtitle="قسم النقل والمواصلات وشؤون الطلاب"
          reportRef={`BUS-${Date.now().toString().slice(-6)}`}
          additionalInfo={[
            { label: 'العام الدراسي', value: settings.activeAcademicYear || '2025/2026' },
            { label: 'الفترة', value: selectedPeriod === 'all' ? 'جميع الفترات' : selectedPeriod },
            { label: 'إجمالي الطلاب', value: `${filteredStudents.length} طالب` }
          ]}
        />

        {/* Print Table */}
        <table className="w-full text-right border-collapse border border-slate-900 text-xs mt-3">
          <thead>
            <tr className="bg-slate-100 border-b border-slate-900 text-black">
              <th className="border border-slate-900 p-2 text-center w-8">#</th>
              <th className="border border-slate-900 p-2 w-44">اسم الطالب</th>
              <th className="border border-slate-900 p-2 text-center w-24">المرحلة</th>
              <th className="border border-slate-900 p-2 text-center w-16">الفترة</th>
              <th className="border border-slate-900 p-2 text-center w-28">هاتف ولي الأمر</th>
              <th className="border border-slate-900 p-2">أقرب نقطة دالة / العنوان</th>
              <th className="border border-slate-900 p-2 text-center w-24">ملاحظات السائق</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.map((student, idx) => {
              const landmark = student.transportLandmark || (student as any).transport_landmark || '';
              return (
                <tr key={student.id} className="border-b border-slate-400">
                  <td className="border border-slate-400 p-2 text-center font-bold">{idx + 1}</td>
                  <td className="border border-slate-400 p-2 font-bold">{student.name}</td>
                  <td className="border border-slate-400 p-2 text-center">{student.grade}</td>
                  <td className="border border-slate-400 p-2 text-center">{student.period || 'صباحي'}</td>
                  <td className="border border-slate-400 p-2 text-center font-mono font-bold" dir="ltr">{student.father_phone || student.mother_phone || '-'}</td>
                  <td className="border border-slate-400 p-2 font-medium">{landmark || '-'}</td>
                  <td className="border border-slate-400 p-2 text-center"></td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Institutional Print Footer */}
        <PrintFooter
          preparedByLabel="سائق الحافلة ومسؤول الخط"
          approvedByLabel="مشرف النقل وإدارة المؤسسة"
          notes="يُرجى الالتزام بمواعيد ونقاط الركوب المحددة والتواصل الفوري مع أولياء الأمور وإدارة المدرسة في حال وجود أي طارئ."
        />
      </div>

    </div>
  );
}
