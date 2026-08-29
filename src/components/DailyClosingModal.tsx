import React, { useState, useEffect } from 'react';
import { ShieldCheck, Calendar, Users, ArrowUpRight, ArrowDownRight, Wallet, Printer, CheckCircle2, FileSpreadsheet, X, Clock } from 'lucide-react';
import { Student, Transaction } from '../types';
import { tafqeet } from '../lib/tafqeet';
import { syncService } from '../lib/syncService';
import { useSchoolSettings } from '../lib/settings';

interface DailyClosingModalProps {
  onClose: () => void;
  students?: Student[];
  transactions?: Transaction[];
}

export default function DailyClosingModal({ onClose, students = [], transactions = [] }: DailyClosingModalProps) {
  const { settings } = useSchoolSettings();
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [isClosedConfirmed, setIsClosedConfirmed] = useState(false);
  const [localStudents, setLocalStudents] = useState<Student[]>(students);
  const [localTransactions, setLocalTransactions] = useState<Transaction[]>(transactions);

  useEffect(() => {
    const loadData = async () => {
      if (students.length === 0) {
        const s = await syncService.getStudents();
        setLocalStudents(s);
      }
      if (transactions.length === 0) {
        const t = await syncService.getTransactions();
        setLocalTransactions(t);
      }
    };
    loadData();
  }, [students, transactions]);

  const safeStudents: Student[] = localStudents.length > 0 ? localStudents : students;
  const safeTransactions: Transaction[] = localTransactions.length > 0 ? localTransactions : transactions;

  // Filter transactions for the selected date
  const todayTransactions = safeTransactions.filter(t => t.date === selectedDate);
  
  // Total cash in today (الوارادت النقدية اليومية)
  const todayCashIn = todayTransactions
    .filter(t => t.type === 'IN')
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  // Total cash out today (المصروفات اليومية)
  const todayCashOut = todayTransactions
    .filter(t => t.type === 'OUT')
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  // Net cash in drawer today (صافي النقدية بالدرج)
  const netTodayBalance = todayCashIn - todayCashOut;

  // Filter students registered today
  const todayStudents = safeStudents.filter(s => {
    if (s.created_at) {
      return s.created_at.startsWith(selectedDate);
    }
    // Check if there is an IN transaction for this student on the selected date
    return todayTransactions.some(t => t.related_student_id === s.id);
  });

  const handlePrint = () => {
    window.print();
  };

  const handleConfirmClose = () => {
    setIsClosedConfirmed(true);
    // Record closeout timestamp in local storage
    try {
      const closeoutLog = {
        date: selectedDate,
        totalIn: todayCashIn,
        totalOut: todayCashOut,
        netBalance: netTodayBalance,
        studentsCount: todayStudents.length,
        closedAt: new Date().toLocaleTimeString('ar-LY'),
      };
      const existingLogs = JSON.parse(localStorage.getItem('daily_closeouts') || '[]');
      localStorage.setItem('daily_closeouts', JSON.stringify([closeoutLog, ...existingLogs]));
    } catch (e) {}
  };

  return (
    <div className="fixed inset-0 bg-slate-950/85 flex items-center justify-center z-[130] p-4 backdrop-blur-md">
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[20px] w-full max-w-4xl overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.6)] flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700/80 bg-slate-100 dark:bg-slate-900/70 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl border border-emerald-500/30">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h2 className="font-extrabold text-xl text-slate-900 dark:text-slate-100 flex items-center gap-2">
                جرد اليوم وإقفال الخزينة النقدية
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                تقرير يومي شامل للمقبوضات والطلاب المسجلين والحركات المالية
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Date Selector */}
            <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-xl text-xs font-semibold">
              <Calendar size={14} className="text-lime-600 dark:text-lime-400" />
              <input 
                type="date" 
                value={selectedDate} 
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent text-slate-900 dark:text-slate-200 outline-none cursor-pointer"
              />
            </div>
            <button 
              onClick={onClose} 
              className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors text-2xl font-bold p-1 leading-none"
            >
              &times;
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">
          
          {/* Confirmation Banner */}
          {isClosedConfirmed && (
            <div className="p-4 bg-emerald-500/20 border border-emerald-500/50 rounded-2xl flex items-center gap-3 text-emerald-700 dark:text-emerald-300 font-bold animate-in fade-in">
              <CheckCircle2 size={22} className="text-emerald-500 shrink-0" />
              <div>
                <p className="text-sm">تم تأكيد وتوثيق إقفال الخزينة لهذا اليوم بنجاح!</p>
                <p className="text-xs font-normal opacity-80 mt-0.5">وقت الإقفال: {new Date().toLocaleTimeString('ar-LY')}</p>
              </div>
            </div>
          )}

          {/* Key Metrics Cards (2x2 Grid) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Registered Students Today */}
            <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/60 flex flex-col justify-between shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">الطلاب المسجلون اليوم</span>
                <div className="p-2 bg-blue-500/10 text-blue-500 rounded-xl">
                  <Users size={18} />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900 dark:text-slate-100">{todayStudents.length}</span>
                <span className="text-xs font-medium text-slate-500">طالب/ة</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-2">تسجيلات تاريخ {selectedDate}</p>
            </div>

            {/* Total Cash In (المقبوضات) */}
            <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/60 flex flex-col justify-between shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">إجمالي المقبوضات (الوارد)</span>
                <div className="p-2 bg-lime-500/10 text-lime-600 dark:text-lime-400 rounded-xl">
                  <ArrowUpRight size={18} />
                </div>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-lime-600 dark:text-lime-400" dir="ltr">
                  +{todayCashIn.toLocaleString()}
                </span>
                <span className="text-xs font-bold text-lime-700 dark:text-lime-300">د.ل</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-2">{todayTransactions.filter(t => t.type === 'IN').length} عملية قبض</p>
            </div>

            {/* Total Cash Out (المصروفات) */}
            <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/60 flex flex-col justify-between shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">إجمالي المصروفات (الصادر)</span>
                <div className="p-2 bg-red-500/10 text-red-500 rounded-xl">
                  <ArrowDownRight size={18} />
                </div>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-red-500" dir="ltr">
                  -{todayCashOut.toLocaleString()}
                </span>
                <span className="text-xs font-bold text-red-400">د.ل</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-2">{todayTransactions.filter(t => t.type === 'OUT').length} عملية صرف</p>
            </div>

            {/* Net Balance (الصافي الفعلي بالدرج) */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-4 rounded-2xl border border-slate-700 flex flex-col justify-between shadow-md">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-300">الصافي الفعلي في الدرج</span>
                <div className="p-2 bg-lime-400/20 text-lime-400 rounded-xl">
                  <Wallet size={18} />
                </div>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-lime-400" dir="ltr">
                  {netTodayBalance.toLocaleString()}
                </span>
                <span className="text-xs font-bold text-lime-300">د.ل</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-2">المبلغ الواجب توفره بالخزينة</p>
            </div>

          </div>

          {/* Today's Registered Students Section */}
          <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-700/60 p-4">
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-2">
              <Users size={16} className="text-blue-500" />
              <span>الطلاب المسجلون بتاريخ اليوم ({todayStudents.length})</span>
            </h3>
            {todayStudents.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400 py-3 text-center">
                لم يتم تسجيل طلاب جدد في تاريخ {selectedDate}.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {todayStudents.map(student => (
                  <div key={student.id} className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs flex justify-between items-center shadow-sm">
                    <div>
                      <p className="font-bold text-slate-900 dark:text-slate-100">{student.name}</p>
                      <p className="text-slate-500 mt-0.5">{student.grade} • {student.period || 'صباحي'}</p>
                    </div>
                    <div className="text-end">
                      <span className="font-bold text-lime-600 dark:text-lime-400">{student.total_paid || 0} د.ل</span>
                      <p className="text-[10px] text-slate-400">مدفوع</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Today's Transactions Breakdown Table */}
          <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-700/60 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <FileSpreadsheet size={16} className="text-lime-600 dark:text-lime-400" />
                <span>تفاصيل الحركات المالية المنفذة اليوم ({todayTransactions.length})</span>
              </h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-start">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="p-3 font-bold text-start">النوع</th>
                    <th className="p-3 font-bold text-start">البيان والتفاصيل</th>
                    <th className="p-3 font-bold text-start">المبلغ</th>
                    <th className="p-3 font-bold text-start">الوقت والتاريخ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700/50">
                  {todayTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-6 text-center text-slate-500">
                        لا توجد حركات مالية مسجلة في هذا اليوم
                      </td>
                    </tr>
                  ) : (
                    todayTransactions.map(tx => (
                      <tr key={tx.id} className="hover:bg-white dark:hover:bg-slate-800/60 transition-colors">
                        <td className="p-3 text-start">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-bold text-[11px] ${tx.type === 'IN' ? 'bg-lime-500/10 text-lime-600 dark:text-lime-400' : 'bg-red-500/10 text-red-500'}`}>
                            {tx.type === 'IN' ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                            {tx.type === 'IN' ? 'وارد (+)' : 'صادر (-)'}
                          </span>
                        </td>
                        <td className="p-3 font-medium text-slate-800 dark:text-slate-200 text-start">
                          {tx.description}
                        </td>
                        <td className={`p-3 font-bold text-start ${tx.type === 'IN' ? 'text-lime-600 dark:text-lime-400' : 'text-red-500'}`}>
                          {tx.type === 'IN' ? '+' : '-'} {Number(tx.amount || 0).toLocaleString()} د.ل
                        </td>
                        <td className="p-3 text-slate-500 text-start font-mono">
                          {tx.date}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/70 flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Clock size={14} />
            <span>تقرير إقفال الخزينة الرسمي معتمد لتسليم العهدة المالية</span>
          </div>

          <div className="flex gap-2.5 w-full sm:w-auto">
            <button
              onClick={handlePrint}
              className="flex-1 sm:flex-none px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all hover:scale-[1.02]"
            >
              <Printer size={15} />
              <span>طباعة تقرير الإقفال</span>
            </button>

            {!isClosedConfirmed ? (
              <button
                onClick={handleConfirmClose}
                className="flex-1 sm:flex-none px-5 py-2.5 bg-lime-600 hover:bg-lime-500 text-slate-900 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(132,204,22,0.3)] transition-all hover:scale-[1.02]"
              >
                <ShieldCheck size={15} />
                <span>إقفال وتأكيد الخزينة</span>
              </button>
            ) : (
              <button
                onClick={onClose}
                className="flex-1 sm:flex-none px-5 py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2"
              >
                <CheckCircle2 size={15} />
                <span>تم الإقفال - إغلاق</span>
              </button>
            )}
          </div>
        </div>

      </div>

      {/* Printable Closing Report (A4 Document, hidden visually, visible in print) */}
      <div id="closing-print-section" className="hidden print:block fixed inset-0 bg-white text-black p-8 font-sans z-[9999]" style={{ direction: 'rtl' }}>
        <div className="w-[190mm] mx-auto border-2 border-slate-900 p-6 flex flex-col justify-between min-h-[260mm]">
          <div>
            {/* Header */}
            <div className="flex justify-between items-center border-b-2 border-slate-900 pb-4 mb-6">
              <div className="text-start">
                <h1 className="text-xl font-extrabold text-slate-900">{settings.schoolName}</h1>
                <h2 className="text-sm font-bold text-slate-700">قسم المحاسبة والشؤون المالية</h2>
                <p className="text-xs text-slate-500 mt-1">تقرير إقفال الخزينة والجرد اليومي</p>
              </div>
              <img src={settings.logo} alt="Logo" className="w-16 h-16 object-contain" />
              <div className="text-end text-xs space-y-1">
                <p><strong>تاريخ الجرد:</strong> {selectedDate}</p>
                <p><strong>توقيت الطباعة:</strong> {new Date().toLocaleTimeString('ar-LY')}</p>
                <p><strong>حالة الإقفال:</strong> {isClosedConfirmed ? 'مقفل ومعتمد' : 'مسودة جرد'}</p>
              </div>
            </div>

            {/* Financial Summary Box */}
            <div className="grid grid-cols-4 gap-3 mb-6 text-center">
              <div className="border border-slate-400 p-2.5 rounded">
                <span className="text-[11px] text-slate-600 block">الطلاب المسجلون</span>
                <strong className="text-base text-slate-900">{todayStudents.length} طالب</strong>
              </div>
              <div className="border border-slate-400 p-2.5 rounded bg-slate-50">
                <span className="text-[11px] text-slate-600 block">إجمالي الوارد (المقبوضات)</span>
                <strong className="text-base text-slate-900">+{todayCashIn.toLocaleString()} د.ل</strong>
              </div>
              <div className="border border-slate-400 p-2.5 rounded bg-slate-50">
                <span className="text-[11px] text-slate-600 block">إجمالي الصادر (المصروفات)</span>
                <strong className="text-base text-slate-900">-{todayCashOut.toLocaleString()} د.ل</strong>
              </div>
              <div className="border-2 border-slate-900 p-2.5 rounded bg-slate-100 font-bold">
                <span className="text-[11px] text-slate-700 block">صافي النقدية بالدرج</span>
                <strong className="text-base text-slate-950">{netTodayBalance.toLocaleString()} د.ل</strong>
              </div>
            </div>

            {/* Tafqeet in Arabic */}
            <div className="p-2.5 bg-slate-50 border border-slate-300 rounded mb-6 text-xs font-semibold">
              <span>المبلغ الإجمالي الصافي بالحروف: </span>
              <span className="text-slate-900 underline">{tafqeet(netTodayBalance)} دينار ليبي فقط لا غير.</span>
            </div>

            {/* Registered Students Table */}
            {todayStudents.length > 0 && (
              <div className="mb-6">
                <h3 className="font-bold text-xs border-b border-slate-400 pb-1 mb-2">قائمة الطلاب المسجلين اليوم ({todayStudents.length}):</h3>
                <table className="w-full text-xs border border-slate-400 border-collapse">
                  <thead>
                    <tr className="bg-slate-200">
                      <th className="border border-slate-400 p-1.5 text-start">#</th>
                      <th className="border border-slate-400 p-1.5 text-start">اسم الطالب</th>
                      <th className="border border-slate-400 p-1.5 text-start">الصف الدراسي</th>
                      <th className="border border-slate-400 p-1.5 text-start">هاتف ولي الأمر</th>
                      <th className="border border-slate-400 p-1.5 text-start">المدفوع نقداً</th>
                    </tr>
                  </thead>
                  <tbody>
                    {todayStudents.map((st, idx) => (
                      <tr key={st.id}>
                        <td className="border border-slate-400 p-1.5">{idx + 1}</td>
                        <td className="border border-slate-400 p-1.5 font-bold">{st.name}</td>
                        <td className="border border-slate-400 p-1.5">{st.grade}</td>
                        <td className="border border-slate-400 p-1.5 font-mono">{st.father_phone}</td>
                        <td className="border border-slate-400 p-1.5 font-bold">{st.total_paid || 0} د.ل</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Transactions Table */}
            <div>
              <h3 className="font-bold text-xs border-b border-slate-400 pb-1 mb-2">الحركات المالية المسجلة ({todayTransactions.length}):</h3>
              <table className="w-full text-xs border border-slate-400 border-collapse">
                <thead>
                  <tr className="bg-slate-200">
                    <th className="border border-slate-400 p-1.5 text-start">النوع</th>
                    <th className="border border-slate-400 p-1.5 text-start">البيان والتفاصيل</th>
                    <th className="border border-slate-400 p-1.5 text-start">المبلغ</th>
                  </tr>
                </thead>
                <tbody>
                  {todayTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="border border-slate-400 p-2 text-center text-slate-500">لا توجد حركات مسجلة</td>
                    </tr>
                  ) : (
                    todayTransactions.map(tx => (
                      <tr key={tx.id}>
                        <td className="border border-slate-400 p-1.5 font-bold">
                          {tx.type === 'IN' ? 'وارد (+)' : 'صادر (-)'}
                        </td>
                        <td className="border border-slate-400 p-1.5">{tx.description}</td>
                        <td className="border border-slate-400 p-1.5 font-bold">
                          {tx.type === 'IN' ? '+' : '-'} {Number(tx.amount).toLocaleString()} د.ل
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Signatures */}
          <div className="pt-8 border-t-2 border-slate-900 flex justify-between px-6 text-xs">
            <div className="text-center">
              <p className="font-bold mb-6">المحاسب المسؤول / أمين الخزينة</p>
              <p>.......................................</p>
            </div>
            <div className="text-center">
              <p className="font-bold mb-6">اعتماد الإدارة العامة</p>
              <p>.......................................</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
