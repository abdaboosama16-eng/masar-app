import React, { useState, useEffect } from 'react';
import { ShieldCheck, Calendar, Users, ArrowUpRight, ArrowDownRight, Wallet, Printer, CheckCircle2, FileSpreadsheet, Clock } from 'lucide-react';
import { Student, Transaction } from '../types';
import { tafqeet } from '../lib/tafqeet';
import { syncService } from '../lib/syncService';
import { useSchoolSettings } from '../lib/settings';
import { Modal } from './ui/Modal';
import { PrintHeader } from './ui/PrintHeader';
import { PrintFooter } from './ui/PrintFooter';

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
    <Modal
      isOpen={true}
      onClose={onClose}
      maxWidth="4xl"
      title={
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} className="text-emerald-600 dark:text-emerald-400" />
            <span>جرد اليوم وإقفال الخزينة النقدية</span>
          </div>
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1 rounded-xl text-xs font-semibold">
            <Calendar size={13} className="text-indigo-600 dark:text-indigo-400" />
            <input 
              type="date" 
              value={selectedDate} 
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-slate-800 dark:text-slate-200 outline-none cursor-pointer text-xs"
            />
          </div>
        </div>
      }
    >
      <div className="space-y-5">
        {/* Confirmation Banner */}
        {isClosedConfirmed && (
          <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-3 text-emerald-700 dark:text-emerald-300 font-bold animate-in fade-in">
            <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
            <div>
              <p className="text-xs">تم تأكيد وتوثيق إقفال الخزينة لهذا اليوم بنجاح!</p>
              <p className="text-[11px] font-normal opacity-80 mt-0.5">وقت الإقفال: {new Date().toLocaleTimeString('ar-LY')}</p>
            </div>
          </div>
        )}

        {/* Key Metrics Cards (2x2 Grid) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          
          {/* Registered Students Today */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/60 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">الطلاب المسجلون اليوم</span>
              <div className="p-1.5 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-lg">
                <Users size={15} />
              </div>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-slate-900 dark:text-slate-100">{todayStudents.length}</span>
              <span className="text-xs font-medium text-slate-500">طالب/ة</span>
            </div>
          </div>

          {/* Total Cash In (المقبوضات) */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/60 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">إجمالي المقبوضات (الوارد)</span>
              <div className="p-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-lg">
                <ArrowUpRight size={15} />
              </div>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-black text-emerald-600 dark:text-emerald-400" dir="ltr">
                +{todayCashIn.toLocaleString()}
              </span>
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">د.ل</span>
            </div>
          </div>

          {/* Total Cash Out (المصروفات) */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/60 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">إجمالي المصروفات (الصادر)</span>
              <div className="p-1.5 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-lg">
                <ArrowDownRight size={15} />
              </div>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-black text-rose-600 dark:text-rose-400" dir="ltr">
                -{todayCashOut.toLocaleString()}
              </span>
              <span className="text-xs font-bold text-rose-500">د.ل</span>
            </div>
          </div>

          {/* Net Balance (الصافي الفعلي بالدرج) */}
          <div className="bg-indigo-50 dark:bg-indigo-950/40 p-3.5 rounded-xl border border-indigo-200 dark:border-indigo-800 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300">الصافي الفعلي في الدرج</span>
              <div className="p-1.5 bg-indigo-600 text-white rounded-lg">
                <Wallet size={15} />
              </div>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-black text-indigo-700 dark:text-indigo-300" dir="ltr">
                {netTodayBalance.toLocaleString()}
              </span>
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">د.ل</span>
            </div>
          </div>

        </div>

        {/* Today's Registered Students Section */}
        <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700/60 p-4">
          <h3 className="font-bold text-xs text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-2">
            <Users size={14} className="text-indigo-600 dark:text-indigo-400" />
            <span>الطلاب المسجلون بتاريخ اليوم ({todayStudents.length})</span>
          </h3>
          {todayStudents.length === 0 ? (
            <p className="text-xs text-slate-500 dark:text-slate-400 py-2 text-center">
              لم يتم تسجيل طلاب جدد في تاريخ {selectedDate}.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {todayStudents.map(student => (
                <div key={student.id} className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-700 text-xs flex justify-between items-center shadow-xs">
                  <div>
                    <p className="font-bold text-slate-900 dark:text-slate-100">{student.name}</p>
                    <p className="text-slate-500 text-[11px] mt-0.5">{student.grade} • {student.period || 'صباحي'}</p>
                  </div>
                  <div className="text-end">
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">{student.total_paid || 0} د.ل</span>
                    <p className="text-[10px] text-slate-400">مدفوع</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Today's Transactions Breakdown Table */}
        <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700/60 overflow-hidden">
          <div className="px-4 py-2.5 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
            <h3 className="font-bold text-xs text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <FileSpreadsheet size={14} className="text-emerald-600 dark:text-emerald-400" />
              <span>تفاصيل الحركات المالية المنفذة اليوم ({todayTransactions.length})</span>
            </h3>
          </div>
          
          <div className="overflow-x-auto max-h-56">
            <table className="w-full text-xs text-start">
              <thead className="bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700 sticky top-0">
                <tr>
                  <th className="p-2.5 font-bold text-start">النوع</th>
                  <th className="p-2.5 font-bold text-start">البيان والتفاصيل</th>
                  <th className="p-2.5 font-bold text-start">المبلغ</th>
                  <th className="p-2.5 font-bold text-start">الوقت</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700/50">
                {todayTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-4 text-center text-slate-500">
                      لا توجد حركات مالية مسجلة في هذا اليوم
                    </td>
                  </tr>
                ) : (
                  todayTransactions.map(tx => (
                    <tr key={tx.id} className="hover:bg-white dark:hover:bg-slate-800/60 transition-colors">
                      <td className="p-2.5 text-start">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-bold text-[11px] ${tx.type === 'IN' ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300' : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300'}`}>
                          {tx.type === 'IN' ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                          {tx.type === 'IN' ? 'وارد (+)' : 'صادر (-)'}
                        </span>
                      </td>
                      <td className="p-2.5 font-medium text-slate-800 dark:text-slate-200 text-start">
                        {tx.description}
                      </td>
                      <td className={`p-2.5 font-bold text-start ${tx.type === 'IN' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                        {tx.type === 'IN' ? '+' : '-'} {Number(tx.amount || 0).toLocaleString()} د.ل
                      </td>
                      <td className="p-2.5 text-slate-500 text-start font-mono text-[11px]">
                        {tx.date}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="pt-3 border-t border-slate-100 dark:border-white/5 flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Clock size={13} />
            <span>تقرير إقفال الخزينة الرسمي معتمد لتسليم العهدة المالية</span>
          </div>

          <div className="flex gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={handlePrint}
              className="flex-1 sm:flex-none px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer active:scale-95"
            >
              <Printer size={14} />
              <span>طباعة التقرير</span>
            </button>

            {!isClosedConfirmed ? (
              <button
                type="button"
                onClick={handleConfirmClose}
                className="flex-1 sm:flex-none px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer active:scale-95"
              >
                <ShieldCheck size={14} />
                <span>إقفال وتأكيد الخزينة</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="flex-1 sm:flex-none px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 size={14} className="text-emerald-500" />
                <span>تم الإقفال - إغلاق</span>
              </button>
            )}
          </div>
        </div>

      </div>

      {/* Printable Closing Report (A4 Document, hidden visually, visible in print) */}
      <div id="closing-print-section" className="hidden print:block fixed inset-0 bg-white text-black p-8 font-sans z-[9999]" style={{ direction: 'rtl' }}>
        <div className="w-[190mm] mx-auto border-2 border-black p-6 flex flex-col justify-between min-h-[260mm]">
          <div>
            {/* Official Print Header */}
            <PrintHeader
              title="تقرير إقفال الخزينة والجرد اليومي"
              subtitle="قسم المحاسبة والشؤون المالية والمصروفات"
              reportRef={`CLS-${selectedDate.replace(/-/g, '')}`}
              additionalInfo={[
                { label: 'تاريخ الجرد', value: selectedDate },
                { label: 'حالة الإقفال', value: isClosedConfirmed ? 'مقفل ومعتمد' : 'مسودة جرد' },
                { label: 'صافي الخزينة', value: `${netTodayBalance.toLocaleString()} د.ل` }
              ]}
            />

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

          {/* Institutional Print Footer */}
          <PrintFooter
            preparedByLabel="المحاسب المسؤول / أمين الخزينة"
            approvedByLabel="اعتماد الإدارة العامة"
            notes="تم جرد ومطابقة النقدية الفعلية مع السجلات النظامية وتوثيق الإقفال اليومي بحضور المسؤولين."
          />

        </div>
      </div>
    </Modal>
  );
}
