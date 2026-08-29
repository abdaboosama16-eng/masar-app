import React, { useState, useMemo } from 'react';
import { Phone, Printer, Copy, Check, Search, Filter, Users, X, FileText, ArrowUpDown } from 'lucide-react';
import { Student } from '../types';
import { useSchoolSettings } from '../lib/settings';

interface PhoneExtractionModalProps {
  students: Student[];
  onClose: () => void;
}

export type PhoneType = 'father' | 'mother';

export default function PhoneExtractionModal({ students, onClose }: PhoneExtractionModalProps) {
  const { settings } = useSchoolSettings();
  const [phoneType, setPhoneType] = useState<PhoneType>('father');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [copied, setCopied] = useState(false);
  const [onlyValidPhones, setOnlyValidPhones] = useState(true);

  // Extract unique grades
  const availableGrades = useMemo(() => {
    const grades = new Set<string>();
    students.forEach(s => {
      if (s.grade && s.grade.trim()) grades.add(s.grade.trim());
    });
    return Array.from(grades);
  }, [students]);

  // Filter and process phone list
  const filteredList = useMemo(() => {
    return students
      .filter(student => {
        // Grade filter
        if (selectedGrade !== 'all' && student.grade !== selectedGrade) {
          return false;
        }

        // Phone check
        const phone = phoneType === 'father' ? student.father_phone : (student.mother_phone || '');
        if (onlyValidPhones && (!phone || !phone.trim())) {
          return false;
        }

        // Search term
        if (searchTerm.trim()) {
          const term = searchTerm.trim().toLowerCase();
          const nameMatch = (student.name || '').toLowerCase().includes(term);
          const phoneMatch = phone.includes(term);
          const gradeMatch = (student.grade || '').toLowerCase().includes(term);
          return nameMatch || phoneMatch || gradeMatch;
        }

        return true;
      })
      .sort((a, b) => (a.name || '').localeCompare(b.name || '', 'ar'));
  }, [students, phoneType, selectedGrade, searchTerm, onlyValidPhones]);

  // Copy all extracted numbers to clipboard
  const handleCopyNumbers = () => {
    const numbers = filteredList
      .map(s => (phoneType === 'father' ? s.father_phone : s.mother_phone))
      .filter(p => p && p.trim())
      .map(p => p?.trim());

    if (numbers.length === 0) return;

    const textToCopy = numbers.join('\n');
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  // Trigger print
  const handlePrint = () => {
    window.print();
  };

  const currentDate = new Date().toLocaleDateString('ar-LY', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <>
      {/* Modal View for Screen */}
      <div className="fixed inset-0 bg-slate-950/85 flex items-center justify-center z-[110] p-3 sm:p-6 backdrop-blur-md overflow-y-auto">
        <div className="bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Phone size={22} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  استخراج وطباعة أرقام الهواتف
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  كشوفات جهات الاتصال لأولياء الأمور جاهزة للطباعة أو النسخ لرسائل SMS و WhatsApp
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-2 rounded-lg transition-colors text-2xl font-bold leading-none"
            >
              &times;
            </button>
          </div>

          {/* Type Selector (Tabs: Fathers vs Mothers) */}
          <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-700/80 bg-slate-100/50 dark:bg-slate-900/30 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPhoneType('father')}
                className={`py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2.5 transition-all duration-200 border ${
                  phoneType === 'father'
                    ? 'bg-blue-600 text-white border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.35)] scale-[1.01]'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                }`}
              >
                <Phone size={18} />
                <span>أرقام الآباء (الهاتف الأساسي)</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  phoneType === 'father' ? 'bg-blue-700 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}>
                  {students.filter(s => s.father_phone && s.father_phone.trim()).length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setPhoneType('mother')}
                className={`py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2.5 transition-all duration-200 border ${
                  phoneType === 'mother'
                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.35)] scale-[1.01]'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                }`}
              >
                <Phone size={18} />
                <span>أرقام الأمهات (الهاتف الاحتياطي)</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  phoneType === 'mother' ? 'bg-emerald-700 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}>
                  {students.filter(s => s.mother_phone && s.mother_phone.trim()).length}
                </span>
              </button>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <Search size={17} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="بحث باسم الطالب أو رقم الهاتف..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pr-9 pl-4 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              {availableGrades.length > 0 && (
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Filter size={16} className="text-slate-400 shrink-0" />
                  <select
                    value={selectedGrade}
                    onChange={(e) => setSelectedGrade(e.target.value)}
                    className="w-full sm:w-auto bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500 transition-colors"
                  >
                    <option value="all">جميع الصفوف ({students.length})</option>
                    {availableGrades.map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
              )}

              <label className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-400 cursor-pointer select-none whitespace-nowrap">
                <input
                  type="checkbox"
                  checked={onlyValidPhones}
                  onChange={(e) => setOnlyValidPhones(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                />
                <span>استبعاد الأرقام الفارغة</span>
              </label>
            </div>
          </div>

          {/* Table Preview */}
          <div className="p-4 sm:p-6 overflow-y-auto flex-1 custom-scrollbar">
            <div className="flex items-center justify-between mb-3 text-xs text-slate-500 dark:text-slate-400">
              <span>
                إجمالي النتائج: <strong className="text-slate-900 dark:text-slate-200 font-bold">{filteredList.length}</strong> طالب
              </span>
              <span>مرتب أبجدياً تلقائياً</span>
            </div>

            <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-start text-sm">
                <thead className="bg-slate-100 dark:bg-slate-900/90 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700 text-xs">
                  <tr>
                    <th className="py-3 px-3 text-center w-12">#</th>
                    <th className="py-3 px-4 text-start">اسم الطالب</th>
                    <th className="py-3 px-4 text-start">الصف / المرحلة</th>
                    <th className="py-3 px-4 text-start">صفة ولي الأمر</th>
                    <th className="py-3 px-4 text-start">
                      {phoneType === 'father' ? 'رقم هاتف الأب (الأساسي)' : 'رقم هاتف الأم (الاحتياطي)'}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700/60">
                  {filteredList.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">
                        لا توجد أرقام هواتف مطابقة للتصفية الحالية
                      </td>
                    </tr>
                  ) : (
                    filteredList.map((student, idx) => {
                      const phone = phoneType === 'father' ? student.father_phone : student.mother_phone;
                      const hasPhone = phone && phone.trim().length > 0;
                      return (
                        <tr
                          key={student.id}
                          className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                        >
                          <td className="py-2.5 px-3 text-center text-xs text-slate-400 font-mono">
                            {idx + 1}
                          </td>
                          <td className="py-2.5 px-4 font-bold text-slate-900 dark:text-slate-100">
                            {student.name}
                          </td>
                          <td className="py-2.5 px-4 text-slate-600 dark:text-slate-300 text-xs">
                            {student.grade || '-'}
                          </td>
                          <td className="py-2.5 px-4 text-slate-500 dark:text-slate-400 text-xs">
                            {phoneType === 'father' ? 'الأب (ولي الأمر)' : 'الأم (جهة اتصال 2)'}
                          </td>
                          <td className="py-2.5 px-4 font-mono font-bold text-sm">
                            {hasPhone ? (
                              <span className="text-blue-600 dark:text-blue-400" dir="ltr">
                                {phone}
                              </span>
                            ) : (
                              <span className="text-slate-400 text-xs font-normal">
                                غير مسجل
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/80 flex flex-wrap items-center justify-between gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-bold text-sm transition-colors"
            >
              إغلاق
            </button>

            <div className="flex items-center gap-3">
              <button
                onClick={handleCopyNumbers}
                disabled={filteredList.length === 0}
                className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-200 font-bold text-sm flex items-center gap-2 transition-all disabled:opacity-50"
              >
                {copied ? <Check size={17} className="text-emerald-500" /> : <Copy size={17} />}
                <span>{copied ? 'تم النسخ للحافظة!' : 'نسخ قائمة الأرقام'}</span>
              </button>

              <button
                onClick={handlePrint}
                disabled={filteredList.length === 0}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm flex items-center gap-2 shadow-[0_0_15px_rgba(59,130,246,0.3)] hover:scale-[1.02] transition-all disabled:opacity-50"
              >
                <Printer size={18} />
                <span>طباعة الكشف الورقي (Print)</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Printable Sheet View (@media print) */}
      <div
        id="phones-print-section"
        className="hidden print:block absolute top-0 left-0 w-[210mm] bg-white text-black font-sans p-6"
        style={{ direction: 'rtl' }}
      >
        {/* Printable Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '2px solid #0088cc', paddingBottom: '10px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img src={settings.logo} alt={settings.schoolName} style={{ width: '55px', height: '55px', objectFit: 'contain' }} />
            <div>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#0088cc' }}>{settings.schoolName}</div>
              <div style={{ fontSize: '11px', color: '#475569' }}>منظومة الإدارة المدرسية وشؤون الطلاب</div>
            </div>
          </div>
          <div style={{ textAlign: 'left', direction: 'ltr' }}>
            <div style={{ fontSize: '12px', fontWeight: 'bold' }}>{settings.schoolNameEn}</div>
            <div style={{ fontSize: '10px', color: '#64748b' }}>Date: {new Date().toISOString().split('T')[0]}</div>
          </div>
        </div>

        {/* Printable Title */}
        <div style={{ textAlign: 'center', marginBottom: '14px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 'bold', margin: '0 0 4px 0', textDecoration: 'underline' }}>
            {phoneType === 'father'
              ? 'كشف أرقام هواتف أولياء الأمور (الآباء - الهاتف الأساسي)'
              : 'كشف أرقام هواتف أولياء الأمور (الأمهات - الهاتف الاحتياطي)'}
          </h2>
          <div style={{ fontSize: '11px', color: '#475569' }}>
            {selectedGrade !== 'all' ? `الصف: ${selectedGrade} | ` : 'جميع الصفوف | '}
            العدد الإجمالي: {filteredList.length} طالب | تاريخ الاستخراج: {currentDate}
          </div>
        </div>

        {/* Printable Clean Table */}
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            border: '1.5px solid #000000',
            fontSize: '11.5px',
            textAlign: 'center'
          }}
        >
          <thead>
            <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '1.5px solid #000000', height: '28px' }}>
              <th style={{ border: '1px solid #000000', width: '35px', padding: '4px' }}>م</th>
              <th style={{ border: '1px solid #000000', textAlign: 'right', padding: '4px 8px', width: '38%' }}>اسم الطالب</th>
              <th style={{ border: '1px solid #000000', width: '18%', padding: '4px' }}>الصف</th>
              <th style={{ border: '1px solid #000000', width: '24%', padding: '4px' }}>
                {phoneType === 'father' ? 'هاتف الأب' : 'هاتف الأم'}
              </th>
              <th style={{ border: '1px solid #000000', width: '16%', padding: '4px' }}>ملاحظات</th>
            </tr>
          </thead>
          <tbody>
            {filteredList.map((student, index) => {
              const phone = phoneType === 'father' ? student.father_phone : (student.mother_phone || '');
              return (
                <tr
                  key={student.id}
                  style={{
                    height: '24px',
                    borderBottom: '1px solid #cbd5e1',
                    backgroundColor: index % 2 === 1 ? '#f8fafc' : '#ffffff'
                  }}
                >
                  <td style={{ border: '1px solid #000000', padding: '3px' }}>{index + 1}</td>
                  <td style={{ border: '1px solid #000000', textAlign: 'right', padding: '3px 8px', fontWeight: 'bold' }}>
                    {student.name}
                  </td>
                  <td style={{ border: '1px solid #000000', padding: '3px' }}>{student.grade || '-'}</td>
                  <td style={{ border: '1px solid #000000', padding: '3px', fontFamily: 'monospace', fontWeight: 'bold', direction: 'ltr' }}>
                    {phone || '-'}
                  </td>
                  <td style={{ border: '1px solid #000000', padding: '3px' }}></td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Printable Footer / Signatures */}
        <div style={{ marginTop: '25px', display: 'flex', justifyContent: 'space-between', padding: '0 20px', fontSize: '12px' }}>
          <div>
            <div>توقيع مسؤول شؤون الطلاب:</div>
            <div style={{ marginTop: '20px', borderBottom: '1px dotted #000', width: '140px' }}></div>
          </div>
          <div>
            <div>اعتماد الإدارة:</div>
            <div style={{ marginTop: '20px', borderBottom: '1px dotted #000', width: '140px' }}></div>
          </div>
        </div>
      </div>
    </>
  );
}
