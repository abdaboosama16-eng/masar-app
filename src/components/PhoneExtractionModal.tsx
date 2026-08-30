import React, { useState, useMemo } from 'react';
import { Phone, Printer, Copy, Check, Search, Filter } from 'lucide-react';
import { Student } from '../types';
import { useSchoolSettings } from '../lib/settings';
import { Modal } from './ui/Modal';
import { PrintHeader } from './ui/PrintHeader';
import { PrintFooter } from './ui/PrintFooter';

interface PhoneExtractionModalProps {
  students: Student[];
  onClose: () => void;
  initialFilter?: 'all' | 'transport';
}

export type PhoneType = 'father' | 'mother';

export default function PhoneExtractionModal({ students, onClose, initialFilter = 'all' }: PhoneExtractionModalProps) {
  const { settings } = useSchoolSettings();
  const [phoneType, setPhoneType] = useState<PhoneType>('father');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [filterTransportOnly, setFilterTransportOnly] = useState<boolean>(initialFilter === 'transport');
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
        // Transport filter
        if (filterTransportOnly && !(student.hasTransport || (student as any).has_transport)) {
          return false;
        }

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
          const landmarkMatch = ((student.transportLandmark || (student as any).transport_landmark || '')).toLowerCase().includes(term);
          return nameMatch || phoneMatch || gradeMatch || landmarkMatch;
        }

        return true;
      })
      .sort((a, b) => (a.name || '').localeCompare(b.name || '', 'ar'));
  }, [students, phoneType, selectedGrade, searchTerm, onlyValidPhones, filterTransportOnly]);

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
    <Modal
      isOpen={true}
      onClose={onClose}
      maxWidth="4xl"
      title="استخراج وطباعة أرقام الهواتف"
    >
      <div className="space-y-4">
        {/* Type Selector (Tabs: Fathers vs Mothers) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => setPhoneType('father')}
            className={`py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer border ${
              phoneType === 'father'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <Phone size={15} />
            <span>أرقام الآباء (الهاتف الأساسي)</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full ${
              phoneType === 'father' ? 'bg-indigo-700 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}>
              {students.filter(s => s.father_phone && s.father_phone.trim()).length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setPhoneType('mother')}
            className={`py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer border ${
              phoneType === 'mother'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <Phone size={15} />
            <span>أرقام الأمهات (الهاتف الاحتياطي)</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full ${
              phoneType === 'mother' ? 'bg-emerald-700 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}>
              {students.filter(s => s.mother_phone && s.mother_phone.trim()).length}
            </span>
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5">
          <div className="relative flex-1 w-full">
            <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="بحث باسم الطالب أو رقم الهاتف..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pr-9 pl-3.5 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
            />
          </div>

          {availableGrades.length > 0 && (
            <div className="flex items-center gap-1.5 w-full sm:w-auto">
              <Filter size={14} className="text-slate-400 shrink-0" />
              <select
                value={selectedGrade}
                onChange={(e) => setSelectedGrade(e.target.value)}
                className="w-full sm:w-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
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
              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
            />
            <span>استبعاد الأرقام الفارغة</span>
          </label>
        </div>

        {/* Table Preview */}
        <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden max-h-72 overflow-y-auto">
          <table className="w-full text-start text-xs border-collapse">
            <thead className="bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700 sticky top-0">
              <tr>
                <th className="py-2.5 px-3 text-center w-12">#</th>
                <th className="py-2.5 px-3 text-start">اسم الطالب</th>
                <th className="py-2.5 px-3 text-start">الصف</th>
                <th className="py-2.5 px-3 text-start">صفة ولي الأمر</th>
                <th className="py-2.5 px-3 text-start">
                  {phoneType === 'father' ? 'رقم هاتف الأب' : 'رقم هاتف الأم'}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700/60">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-400">
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
                      <td className="py-2 px-3 text-center text-xs text-slate-400 font-mono">
                        {idx + 1}
                      </td>
                      <td className="py-2 px-3 font-bold text-slate-900 dark:text-slate-100">
                        {student.name}
                      </td>
                      <td className="py-2 px-3 text-slate-600 dark:text-slate-300 text-xs">
                        {student.grade || '-'}
                      </td>
                      <td className="py-2 px-3 text-slate-500 dark:text-slate-400 text-[11px]">
                        {phoneType === 'father' ? 'الأب' : 'الأم'}
                      </td>
                      <td className="py-2 px-3 font-mono font-bold text-xs">
                        {hasPhone ? (
                          <span className="text-indigo-600 dark:text-indigo-400" dir="ltr">
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

        {/* Footer Actions */}
        <div className="pt-3 border-t border-slate-100 dark:border-white/5 flex flex-wrap items-center justify-between gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors cursor-pointer"
          >
            إغلاق
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyNumbers}
              disabled={filteredList.length === 0}
              className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
            >
              {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
              <span>{copied ? 'تم النسخ!' : 'نسخ الأرقام'}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              disabled={filteredList.length === 0}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-50 cursor-pointer active:scale-95"
            >
              <Printer size={15} />
              <span>طباعة الكشف</span>
            </button>
          </div>
        </div>

        {/* Printable Sheet View (@media print) */}
        <div
          id="phones-print-section"
          className="hidden print:block absolute top-0 left-0 w-[210mm] bg-white text-black font-sans p-8"
          style={{ direction: 'rtl' }}
        >
          {/* Institutional Print Header */}
          <PrintHeader
            title={phoneType === 'father' ? 'كشف أرقام هواتف الآباء (الهاتف الأساسي)' : 'كشف أرقام هواتف الأمهات (الهاتف الاحتياطي)'}
            subtitle="شؤون الطلاب والتواصل مع أولياء الأمور"
            reportRef={`PHN-${Date.now().toString().slice(-6)}`}
            additionalInfo={[
              { label: 'الصف', value: selectedGrade === 'all' ? 'جميع الصفوف' : selectedGrade },
              { label: 'عدد الطلاب', value: `${filteredList.length} طالب` },
              { label: 'نوع الهاتف', value: phoneType === 'father' ? 'الأب' : 'الأم' }
            ]}
          />

          {/* Printable Clean Table */}
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              border: '1.5px solid #000000',
              fontSize: '11.5px',
              textAlign: 'center',
              marginTop: '10px'
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

          {/* Institutional Print Footer */}
          <PrintFooter
            preparedByLabel="مسؤول شؤون الطلاب"
            approvedByLabel="اعتماد إدارة المؤسسة"
            notes="يُستخدم هذا الكشف للأغراض الإدارية والتواصل الرسمي مع أولياء الأمور فقط ويحظر نشره أو تداوله خارج إدارة المؤسسة."
          />
        </div>
      </div>
    </Modal>
  );
}
