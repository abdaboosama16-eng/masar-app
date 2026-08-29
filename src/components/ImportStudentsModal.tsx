import React, { useState, useRef } from 'react';
import { 
  X, 
  Upload, 
  FileSpreadsheet, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  Trash2, 
  Users, 
  Phone, 
  Calendar, 
  Sparkles,
  ArrowRight,
  RefreshCw,
  FileCheck
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Student, GradeOption } from '../types';
import { syncService } from '../lib/syncService';
import { useSchoolSettings, DEFAULT_FEES } from '../lib/settings';

interface ImportStudentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (count: number) => void;
}

interface ParsedStudentRow {
  id: string;
  name: string;
  father_phone: string;
  mother_phone?: string;
  national_id?: string;
  gender: 'ذكر' | 'أنثى';
  birth_date?: string;
  grade: string;
  period: string;
  base_fees: number;
  total_paid: number;
  isValid: boolean;
  validationError?: string;
}

export const ImportStudentsModal: React.FC<ImportStudentsModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { settings } = useSchoolSettings();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedStudentRow[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [importSummary, setImportSummary] = useState<{ total: number; valid: number; invalid: number } | null>(null);

  if (!isOpen) return null;

  // Auto infer stage from birth date
  const inferGradeFromBirthDate = (birthDateStr?: string): GradeOption => {
    if (!birthDateStr) return 'الروضة';
    try {
      const yearMatch = birthDateStr.match(/\d{4}/);
      if (yearMatch) {
        const year = parseInt(yearMatch[0], 10);
        if (year >= 2023) return 'التعليم المبكر';
        if (year === 2022) return 'الروضة';
        return 'التأهيلي';
      }
    } catch {
      // ignore
    }
    return 'الروضة';
  };

  // Normalize column names
  const normalizeKey = (key: string): string => {
    return key
      .toLowerCase()
      .trim()
      .replace(/[_\-\s\(\)\/]/g, '');
  };

  // Helper to parse date string or Excel date serial number
  const formatExcelDate = (val: any): string => {
    if (!val) return '';
    if (typeof val === 'number') {
      // Excel serial date to JS Date
      const date = new Date(Math.round((val - 25569) * 86400 * 1000));
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
    }
    const str = String(val).trim();
    // Match standard YYYY-MM-DD or DD/MM/YYYY or DD-MM-YYYY
    const dmyMatch = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (dmyMatch) {
      const day = dmyMatch[1].padStart(2, '0');
      const month = dmyMatch[2].padStart(2, '0');
      const year = dmyMatch[3];
      return `${year}-${month}-${day}`;
    }
    return str;
  };

  // Process raw Excel/CSV workbook
  const processWorkbook = (workbook: XLSX.WorkBook, uploadedName: string) => {
    setErrorMsg(null);
    setIsProcessing(true);
    try {
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

      if (!jsonData || jsonData.length === 0) {
        setErrorMsg('الملف المرفوع فارغ أو لا يحتوي على صفوف بيانات.');
        setIsProcessing(false);
        return;
      }

      const rows: ParsedStudentRow[] = jsonData.map((row, index) => {
        let name = '';
        let father_phone = '';
        let mother_phone = '';
        let national_id = '';
        let gender: 'ذكر' | 'أنثى' = 'ذكر';
        let birth_date = '';
        let grade = '';
        let period = 'صباحي';
        let base_fees = settings.defaultFees?.kindergartenFee || DEFAULT_FEES.kindergartenFee || 1400;
        let total_paid = 0;

        // Iterate over keys to map columns flexibly
        Object.entries(row).forEach(([rawKey, val]) => {
          const key = normalizeKey(rawKey);
          const strVal = String(val).trim();

          // Name
          if (
            key.includes('اسمالطالب') || 
            key.includes('اسمطالب') || 
            key === 'الاسم' || 
            key === 'اسم' || 
            key.includes('studentname') || 
            key === 'name' || 
            key === 'student'
          ) {
            name = strVal;
          }
          // Father Phone
          else if (
            key.includes('هاتفالاب') || 
            key.includes('ركمالاب') || 
            key.includes('هاتفولىالامر') || 
            key.includes('رقموليالامر') || 
            key.includes('fatherphone') || 
            key.includes('phone') || 
            key.includes('mobile') || 
            key.includes('هاتف') || 
            key.includes('رقم')
          ) {
            father_phone = strVal;
          }
          // Mother Phone
          else if (
            key.includes('هاتفالام') || 
            key.includes('رقمالام') || 
            key.includes('motherphone')
          ) {
            mother_phone = strVal;
          }
          // National ID
          else if (
            key.includes('رقملوطني') || 
            key.includes('الرقمالوطني') || 
            key.includes('رقم_وطني') || 
            key.includes('nationalid') || 
            key.includes('idnumber')
          ) {
            national_id = strVal;
          }
          // Gender
          else if (
            key.includes('جنس') || 
            key.includes('نوع') || 
            key.includes('gender') || 
            key.includes('sex')
          ) {
            if (strVal.includes('أنثى') || strVal.includes('انثى') || strVal.toLowerCase().includes('female') || strVal.toLowerCase() === 'f') {
              gender = 'أنثى';
            } else {
              gender = 'ذكر';
            }
          }
          // Birth Date
          else if (
            key.includes('ميلاد') || 
            key.includes('تاريخالميلاد') || 
            key.includes('تاريخ') || 
            key.includes('birth') || 
            key.includes('dob')
          ) {
            birth_date = formatExcelDate(val);
          }
          // Grade / Stage
          else if (
            key.includes('صف') || 
            key.includes('مرحله') || 
            key.includes('مرحلة') || 
            key.includes('grade') || 
            key.includes('class') || 
            key.includes('stage')
          ) {
            grade = strVal;
          }
          // Period / Shift
          else if (
            key.includes('فتره') || 
            key.includes('فترة') || 
            key.includes('دوام') || 
            key.includes('period') || 
            key.includes('shift')
          ) {
            period = strVal.includes('مساء') || strVal.toLowerCase().includes('evening') ? 'مسائي' : 'صباحي';
          }
          // Fees
          else if (
            key.includes('رسوم') || 
            key.includes('قسط') || 
            key.includes('اجمالي') || 
            key.includes('fees') || 
            key.includes('amount')
          ) {
            const num = parseFloat(strVal);
            if (!isNaN(num) && num >= 0) base_fees = num;
          }
          // Total Paid
          else if (
            key.includes('مدفوع') || 
            key.includes('مسدد') || 
            key.includes('paid')
          ) {
            const num = parseFloat(strVal);
            if (!isNaN(num) && num >= 0) total_paid = num;
          }
        });

        // Auto determine grade if not supplied
        if (!grade) {
          grade = inferGradeFromBirthDate(birth_date);
        }

        const isValid = Boolean(name && name.length >= 2);
        const validationError = !isValid ? 'اسم الطالب مفقود أو غير صحيح' : undefined;

        return {
          id: `row-${index + 1}-${Date.now()}`,
          name,
          father_phone,
          mother_phone,
          national_id,
          gender,
          birth_date,
          grade,
          period,
          base_fees,
          total_paid,
          isValid,
          validationError
        };
      });

      const validCount = rows.filter(r => r.isValid).length;
      const invalidCount = rows.length - validCount;

      setFileName(uploadedName);
      setParsedRows(rows);
      setImportSummary({
        total: rows.length,
        valid: validCount,
        invalid: invalidCount
      });
    } catch (err: any) {
      console.error('Error parsing file:', err);
      setErrorMsg('حدث خطأ أثناء معالجة الملف. يرجى التأكد من صحة التنسيق.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    readFile(file);
  };

  const readFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        processWorkbook(workbook, file.name);
      } catch (err) {
        console.error('Failed to read file:', err);
        setErrorMsg('تعذر قراءة محتوى الملف.');
      }
    };
    reader.onerror = () => {
      setErrorMsg('فشل فتح وقراءة الملف من جهازك.');
    };
    reader.readAsBinaryString(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      readFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const removeRow = (rowId: string) => {
    const updated = parsedRows.filter(r => r.id !== rowId);
    setParsedRows(updated);
    setImportSummary({
      total: updated.length,
      valid: updated.filter(r => r.isValid).length,
      invalid: updated.filter(r => !r.isValid).length
    });
  };

  const resetImport = () => {
    setFileName(null);
    setParsedRows([]);
    setImportSummary(null);
    setErrorMsg(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Download Sample Excel Template (.xlsx)
  const downloadSampleTemplate = () => {
    const sampleData = [
      {
        "اسم الطالب": "محمد علي أحمد الفيتوري",
        "تاريخ الميلاد": "2022-04-12",
        "الصف": "الروضة",
        "هاتف الأب": "0912345678",
        "هاتف الأم": "0923456789",
        "الرقم الوطني": "120220045612",
        "الجنس": "ذكر",
        "الفترة": "صباحي",
        "الرسوم الدراسية": 1400,
        "المبلغ المدفوع": 500
      },
      {
        "اسم الطالب": "سارة طارق مفتاح المقريف",
        "تاريخ الميلاد": "2023-01-20",
        "الصف": "التعليم المبكر",
        "هاتف الأب": "0919876543",
        "هاتف الأم": "0928765432",
        "الرقم الوطني": "220230018944",
        "الجنس": "أنثى",
        "الفترة": "صباحي",
        "الرسوم الدراسية": 1400,
        "المبلغ المدفوع": 1400
      },
      {
        "اسم الطالب": "عبدالرحمن سالم عمر العبيدي",
        "تاريخ الميلاد": "2021-08-15",
        "الصف": "التأهيلي",
        "هاتف الأب": "0915554433",
        "هاتف الأم": "",
        "الرقم الوطني": "120210087652",
        "الجنس": "ذكر",
        "الفترة": "صباحي",
        "الرسوم الدراسية": 1400,
        "المبلغ المدفوع": 0
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    
    // Set column widths for better visual readability in Excel
    worksheet['!cols'] = [
      { wch: 28 }, // اسم الطالب
      { wch: 14 }, // تاريخ الميلاد
      { wch: 15 }, // الصف
      { wch: 14 }, // هاتف الأب
      { wch: 14 }, // هاتف الأم
      { wch: 16 }, // الرقم الوطني
      { wch: 10 }, // الجنس
      { wch: 10 }, // الفترة
      { wch: 14 }, // الرسوم الدراسية
      { wch: 14 }  // المبلغ المدفوع
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "قالب بيانات الطلاب");
    XLSX.writeFile(workbook, "قالب_استيراد_بيانات_الطلاب_مسار.xlsx");
  };

  // Perform Final Database Save
  const handleExecuteImport = async () => {
    const validRows = parsedRows.filter(r => r.isValid);
    if (validRows.length === 0) {
      setErrorMsg('لا يوجد طلاب صالحين للإدخال. يرجى مراجعة الأسماء.');
      return;
    }

    setIsSaving(true);
    setErrorMsg(null);

    try {
      const studentsToInsert: Partial<Student>[] = validRows.map(r => ({
        name: r.name,
        father_phone: r.father_phone,
        mother_phone: r.mother_phone,
        national_id: r.national_id,
        gender: r.gender,
        birth_date: r.birth_date,
        grade: r.grade,
        period: r.period,
        base_fees: r.base_fees,
        discount: 0,
        final_fees: r.base_fees,
        total_paid: r.total_paid
      }));

      const result = await syncService.bulkImportStudents(studentsToInsert);
      
      setIsSaving(false);
      onSuccess(result.count);
      onClose();
    } catch (err: any) {
      console.error('Import failed:', err);
      setIsSaving(false);
      setErrorMsg('حدث خطأ أثناء حفظ الطلاب في قاعدة البيانات.');
    }
  };

  return (
    <div className="fixed inset-0 z-[120] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl border border-slate-100 overflow-hidden my-6 flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200/80 flex items-center justify-center shadow-xs">
              <FileSpreadsheet size={20} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900">
                استيراد بيانات الطلاب (Excel / CSV)
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                إضافة قوائم الطلاب دفعة واحدة مع المعالجة الذكية والتحقق المسبق
              </p>
            </div>
          </div>
          
          <button 
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-6">

          {/* Error Banner */}
          {errorMsg && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-800 text-xs font-bold animate-in fade-in">
              <AlertCircle size={18} className="text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Upload & Instructions Stage (if no parsed rows yet) */}
          {!parsedRows.length && (
            <div className="space-y-5">
              
              {/* Template Download Box */}
              <div className="bg-gradient-to-r from-emerald-50/80 via-teal-50/50 to-white p-5 rounded-2xl border border-emerald-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-xs shadow-emerald-500/20">
                    <Download size={18} />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-black text-slate-900">
                      قالب الإكسل الجاهز للاستيراد
                    </h3>
                    <p className="text-[11px] text-slate-600 font-medium">
                      حمّل القالب المنسق مسبقاً، واملأ بيانات الطلاب ثم ارفعه هنا.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={downloadSampleTemplate}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-xs transition-all cursor-pointer whitespace-nowrap active:scale-[0.98]"
                >
                  <Download size={14} />
                  <span>تحميل قالب Excel (.xlsx)</span>
                </button>
              </div>

              {/* Drag & Drop Upload Area */}
              <div 
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                  isDragging 
                    ? 'border-emerald-500 bg-emerald-50/50 scale-[0.99]' 
                    : 'border-slate-300 hover:border-emerald-400 bg-slate-50/50 hover:bg-emerald-50/20'
                }`}
              >
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".xlsx, .xls, .csv"
                  className="hidden"
                />

                <div className="w-16 h-16 rounded-3xl bg-white border border-slate-200/80 text-emerald-600 flex items-center justify-center mb-4 shadow-sm group-hover:scale-105 transition-transform">
                  <Upload size={28} />
                </div>

                <h4 className="text-sm font-black text-slate-800 mb-1">
                  اسحب وأفلت ملف الإكسل أو CSV هنا
                </h4>
                <p className="text-xs text-slate-500 font-medium mb-3">
                  أو انقر لاختيار ملف من جهازك (يدعم صيغ .xlsx, .xls, .csv)
                </p>

                <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-slate-200 rounded-full text-[11px] font-bold text-slate-600 shadow-2xs">
                  <FileCheck size={13} className="text-emerald-600" />
                  <span>معالجة فورية محلية وآمنة 100%</span>
                </div>
              </div>

              {/* Tips & Supported Columns */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 sm:p-5">
                <h5 className="text-xs font-black text-slate-800 mb-2 flex items-center gap-2">
                  <Sparkles size={14} className="text-amber-500" />
                  <span>الأعمدة المدعومة للتعرف التلقائي:</span>
                </h5>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-slate-600 font-medium">
                  <div className="bg-white p-2 rounded-lg border border-slate-100 font-bold text-emerald-800">
                    • اسم الطالب (مطلوب)
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-slate-100">
                    • تاريخ الميلاد (YYYY-MM-DD)
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-slate-100">
                    • الصف (التعليم المبكر/الروضة/التأهيلي)
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-slate-100">
                    • هاتف الأب / ولي الأمر
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-slate-100">
                    • هاتف الأم
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-slate-100">
                    • الرقم الوطني
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-slate-100">
                    • الرسوم الدراسية
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-slate-100">
                    • المبلغ المدفوع
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* Preview & Confirmation Stage */}
          {parsedRows.length > 0 && (
            <div className="space-y-4">
              
              {/* File Info & Stats Toolbar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0">
                    <FileSpreadsheet size={18} />
                  </div>
                  <div>
                    <div className="text-xs font-black text-slate-900 truncate max-w-xs sm:max-w-sm">
                      {fileName}
                    </div>
                    <div className="text-[11px] text-slate-500 font-medium">
                      إجمالي {importSummary?.total} صف | <span className="text-emerald-600 font-bold">{importSummary?.valid} صالح للإدخال</span> {importSummary && importSummary.invalid > 0 && <span className="text-rose-600 font-bold">({importSummary.invalid} غير صالح)</span>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={resetImport}
                    className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw size={12} />
                    <span>تغيير الملف</span>
                  </button>
                  <button
                    type="button"
                    onClick={downloadSampleTemplate}
                    className="px-3 py-1.5 bg-white hover:bg-slate-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download size={12} />
                    <span>تحميل القالب</span>
                  </button>
                </div>
              </div>

              {/* Data Preview Table */}
              <div className="border border-slate-200/80 rounded-2xl overflow-hidden shadow-2xs max-h-80 overflow-y-auto">
                <table className="w-full text-start text-xs border-collapse whitespace-nowrap">
                  <thead className="bg-slate-100/80 text-slate-700 font-bold sticky top-0 border-b border-slate-200 z-10">
                    <tr>
                      <th className="p-3 text-start">#</th>
                      <th className="p-3 text-start">اسم الطالب</th>
                      <th className="p-3 text-start">الصف</th>
                      <th className="p-3 text-start">تاريخ الميلاد</th>
                      <th className="p-3 text-start">هاتف الأب</th>
                      <th className="p-3 text-start">الرسوم</th>
                      <th className="p-3 text-start">المدفوع</th>
                      <th className="p-3 text-center">الحالة</th>
                      <th className="p-3 text-center">حذف</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                    {parsedRows.map((row, idx) => (
                      <tr key={row.id} className={!row.isValid ? 'bg-rose-50/50' : 'hover:bg-slate-50/50'}>
                        <td className="p-3 text-slate-400 font-bold">{idx + 1}</td>
                        <td className="p-3 font-bold text-slate-900">
                          {row.name || <span className="text-rose-500 italic">مفقود</span>}
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-[11px] font-bold text-slate-700">
                            {row.grade}
                          </span>
                        </td>
                        <td className="p-3 text-slate-600">{row.birth_date || '—'}</td>
                        <td className="p-3 text-slate-600 font-mono">{row.father_phone || '—'}</td>
                        <td className="p-3 text-slate-900 font-bold">{row.base_fees} د.ل</td>
                        <td className="p-3 font-bold text-emerald-600">{row.total_paid} د.ل</td>
                        <td className="p-3 text-center">
                          {row.isValid ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                              <CheckCircle2 size={11} />
                              جاهز
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                              <AlertCircle size={11} />
                              غير صالح
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          <button
                            type="button"
                            onClick={() => removeRow(row.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 transition-colors"
                            title="حذف هذا الصف"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition-all cursor-pointer"
          >
            إلغاء
          </button>

          {parsedRows.length > 0 && (
            <button
              type="button"
              onClick={handleExecuteImport}
              disabled={isSaving || (importSummary?.valid || 0) === 0}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md shadow-emerald-600/20 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50 active:scale-[0.98]"
            >
              {isSaving ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  <span>جاري الاستيراد والحفظ...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={15} />
                  <span>تأكيد استيراد ({importSummary?.valid || 0}) طالب</span>
                </>
              )}
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
