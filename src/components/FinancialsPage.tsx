import { useEffect, useState, useMemo } from 'react';
import { ArrowDownRight, ArrowUpRight, Plus, TrendingUp, BarChart3, LineChart as LineChartIcon, ShieldCheck, Landmark, Calendar, Filter, Sparkles, Clock, CheckCircle2 } from 'lucide-react';
import { BarChart, Bar, AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Transaction } from '../types';
import { AutoAuditor } from './AutoAuditor';
import { ExpenseFlowchart } from './ExpenseFlowchart';
import DailyClosingModal from './DailyClosingModal';
import { syncService } from '../lib/syncService';
import { Modal } from './ui/Modal';
import { Input } from './ui/Input';

interface FinancialsPageProps {
  currentAcademicYear?: string;
}

export default function FinancialsPage({ currentAcademicYear: propAcademicYear }: FinancialsPageProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDailyClosingModal, setShowDailyClosingModal] = useState(false);
  const [chartType, setChartType] = useState<'bar' | 'area'>('bar');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'BASIC' | 'DAILY'>('ALL');

  const [activeYear, setActiveYear] = useState<string>(() => {
    return propAcademicYear || localStorage.getItem('academic_year') || '2026/2027';
  });

  useEffect(() => {
    if (propAcademicYear) {
      setActiveYear(propAcademicYear);
    }
  }, [propAcademicYear]);

  useEffect(() => {
    const handleYearChange = (e: any) => {
      if (e.detail) {
        setActiveYear(e.detail);
      }
    };
    window.addEventListener('academicYearChanged', handleYearChange);
    return () => window.removeEventListener('academicYearChanged', handleYearChange);
  }, []);

  useEffect(() => {
    const handleOpenAddPayment = () => {
      setShowAddModal(true);
    };
    window.addEventListener('open-add-payment', handleOpenAddPayment);
    return () => window.removeEventListener('open-add-payment', handleOpenAddPayment);
  }, []);

  useEffect(() => {
    fetchTransactions();

    const handleDataChanged = () => {
      fetchTransactions();
    };
    window.addEventListener('appDataChanged', handleDataChanged);
    return () => window.removeEventListener('appDataChanged', handleDataChanged);
  }, []);

  const fetchTransactions = async () => {
    try {
      const list = await syncService.getTransactions();
      setTransactions(list);
    } catch (err) {
      console.error('Failed to load transactions from IndexedDB:', err);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const safeTransactions = Array.isArray(transactions) ? transactions : [];

  // Core filtering rule:
  // 1. "الحركة الأساسية" (category_type === 'basic' or 'حركة أساسية'): Always visible regardless of academic year.
  // 2. "الحركة اليومية" (category_type === 'daily' or 'حركة يومية' or default): Filtered by current academic year.
  const yearFilteredTransactions = useMemo(() => {
    return safeTransactions.filter(t => {
      const isBasic = t.category_type === 'basic' || t.category_type === 'حركة أساسية';
      if (isBasic) {
        // Core/capital movements ignore the academic year filter
        return true;
      }
      // Daily movements: Must match active academic year
      if (t.academic_year) {
        return t.academic_year === activeYear;
      }
      // If not explicitly set, determine by date year or default to active
      if (t.date) {
        const yearPart = t.date.split('-')[0];
        if (activeYear.startsWith(yearPart)) return true;
      }
      return true;
    });
  }, [safeTransactions, activeYear]);

  // Apply user movement type sub-filter tab
  const displayedTransactions = useMemo(() => {
    if (typeFilter === 'BASIC') {
      return yearFilteredTransactions.filter(t => t.category_type === 'basic' || t.category_type === 'حركة أساسية');
    }
    if (typeFilter === 'DAILY') {
      return yearFilteredTransactions.filter(t => t.category_type !== 'basic' && t.category_type !== 'حركة أساسية');
    }
    return yearFilteredTransactions;
  }, [yearFilteredTransactions, typeFilter]);

  const totalIn = displayedTransactions.filter(t => t.type === 'IN').reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const totalOut = displayedTransactions.filter(t => t.type === 'OUT').reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const balance = totalIn - totalOut;

  // Monthly breakdown data for current academic year (Sept - Aug)
  const academicMonths = [
    { key: '09', name: 'سبتمبر' },
    { key: '10', name: 'أكتوبر' },
    { key: '11', name: 'نوفمبر' },
    { key: '12', name: 'ديسمبر' },
    { key: '01', name: 'يناير' },
    { key: '02', name: 'فبراير' },
    { key: '03', name: 'مارس' },
    { key: '04', name: 'أبريل' },
    { key: '05', name: 'مايو' },
    { key: '06', name: 'يونيو' },
    { key: '07', name: 'يوليو' },
    { key: '08', name: 'أغسطس' },
  ];

  const chartData = academicMonths.map(m => {
    const monthTxs = displayedTransactions.filter(t => {
      if (!t.date) return false;
      const parts = t.date.split('-');
      return parts.length >= 2 && parts[1] === m.key;
    });

    const monthIn = monthTxs
      .filter(t => t.type === 'IN')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    const monthOut = monthTxs
      .filter(t => t.type === 'OUT')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    return {
      name: m.name,
      'إجمالي الواردات': monthIn,
      'المصروفات': monthOut,
    };
  });

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900/95 border border-slate-700 p-3 rounded-xl shadow-xl text-xs text-slate-100 backdrop-blur-md">
          <p className="font-bold mb-2 text-slate-300 border-b border-slate-800 pb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={`item-${index}`} className="flex items-center gap-2 my-1">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }}></div>
              <span className="text-slate-400">{entry.name}:</span>
              <span className="font-bold text-white" dir="ltr">{Number(entry.value).toLocaleString()} د.ل</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-7">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
            الصادرات والواردات (الخزينة)
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            سجل العمليات المالية والمقبوضات والمصروفات المعتمدة
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button 
            onClick={() => setShowAddModal(true)}
            className="w-full sm:w-auto justify-center bg-indigo-950 hover:bg-indigo-900 text-white px-6 py-3 rounded-2xl flex items-center gap-2 transition-all font-bold active:scale-[0.98] text-xs shadow-md shadow-indigo-950/10 cursor-pointer"
          >
            <Plus size={16} className="text-amber-400" />
            <span>حركة مالية جديدة</span>
          </button>
        </div>
      </div>

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (2/3 width): Summary & Chart */}
        <div className="lg:col-span-2 space-y-6">
          {/* Financial Summary Cards */}
          <div className="bg-white border border-slate-200 rounded-[20px] p-7 flex flex-col sm:flex-row justify-between items-center gap-6 shadow-sm">
        <div className="text-center lg:text-start">
          <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">صافي رصيد الخزينة المعروض</p>
          <p className={`text-4xl sm:text-5xl font-extrabold flex items-center justify-center lg:justify-start ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            <span dir="ltr">{balance.toLocaleString()} <span className="text-xl font-bold">د.ل</span></span>
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-5 w-full lg:w-auto text-center sm:text-start items-center justify-center">
          <div className="bg-green-50 p-5 rounded-[20px] w-full sm:w-auto flex flex-col items-center sm:items-start border border-green-100 min-w-[170px] shadow-sm transition-transform hover:scale-[1.02]">
            <p className="text-green-800 mb-2 flex items-center gap-1.5 font-bold text-xs uppercase tracking-wider">
              <ArrowUpRight size={16} className="text-green-600" /> إجمالي الوارد
            </p>
            <p className="text-2xl font-extrabold text-green-900 tracking-tight">
              <span dir="ltr">+{totalIn.toLocaleString()} <span className="text-sm font-bold text-green-600/70">د.ل</span></span>
            </p>
          </div>
          <div className="bg-red-50 p-5 rounded-[20px] w-full sm:w-auto flex flex-col items-center sm:items-start border border-red-100 min-w-[170px] shadow-sm transition-transform hover:scale-[1.02]">
            <p className="text-red-800 mb-2 flex items-center gap-1.5 font-bold text-xs uppercase tracking-wider">
              <ArrowDownRight size={16} className="text-red-600" /> إجمالي الصادر
            </p>
            <p className="text-2xl font-extrabold text-red-900 tracking-tight">
              <span dir="ltr">-{totalOut.toLocaleString()} <span className="text-sm font-bold text-red-600/70">د.ل</span></span>
            </p>
          </div>
        </div>
      </div>

      {/* Recharts Graphical Analysis */}
      <div className="bg-white border border-slate-200 rounded-[20px] p-6 md:p-7 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <TrendingUp className="text-blue-600" size={20} />
              <span>إجمالي الواردات والمصروفات الشهرية</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              مخطط بياني لتوزيع حركة التحصيل المالي والمصروفات الشهرية
            </p>
          </div>

          <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-2xl border border-slate-200 self-start sm:self-auto">
            <button
              onClick={() => setChartType('bar')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${chartType === 'bar' ? 'bg-white text-blue-600 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-800'}`}
            >
              <BarChart3 size={14} />
              <span>أعمدة</span>
            </button>
            <button
              onClick={() => setChartType('area')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${chartType === 'area' ? 'bg-white text-blue-600 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-800'}`}
            >
              <LineChartIcon size={14} />
              <span>مساحي</span>
            </button>
          </div>
        </div>

        <div className="h-[280px] w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'bar' ? (
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontSize: 11, fontWeight: 'bold' }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontSize: 11, fontWeight: 'bold' }} tickFormatter={val => `${val}`} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="إجمالي الواردات" fill="#10b981" radius={[8, 8, 0, 0]} maxBarSize={36} />
                <Bar dataKey="المصروفات" fill="#f43f5e" radius={[8, 8, 0, 0]} maxBarSize={36} />
              </BarChart>
            ) : (
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorInSoft" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.35}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                  </linearGradient>
                  <linearGradient id="colorOutSoft" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.35}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontSize: 11, fontWeight: 'bold' }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontSize: 11, fontWeight: 'bold' }} tickFormatter={val => `${val}`} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="إجمالي الواردات" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorInSoft)" />
                <Area type="monotone" dataKey="المصروفات" stroke="#f43f5e" strokeWidth={2.5} fillOpacity={1} fill="url(#colorOutSoft)" />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

        </div> {/* End of Left Column */}
        
        {/* Right Column (1/3 width): Auto Auditor & Expense Flowchart */ }
        <div className="lg:col-span-1 space-y-6 flex flex-col">
          <AutoAuditor transactions={displayedTransactions} />
          <div className="flex-1 min-h-[400px]">
            <ExpenseFlowchart />
          </div>
        </div>
      </div>
      
      {/* Movement Type Filter Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-[20px] border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 px-2">
          <Filter size={16} className="text-slate-400" />
          <span className="text-sm font-bold text-slate-700">تصنيف العرض:</span>
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setTypeFilter('ALL')}
            className={`flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${typeFilter === 'ALL' ? 'bg-slate-800 text-white shadow-md' : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'}`}
          >
            جميع الحركات ({yearFilteredTransactions.length})
          </button>
          <button
            onClick={() => setTypeFilter('BASIC')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${typeFilter === 'BASIC' ? 'bg-indigo-600 text-white shadow-md' : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200'}`}
          >
            <Landmark size={14} />
            <span>حركة أساسية (رأس مال / أرصدة ثابتة)</span>
          </button>
          <button
            onClick={() => setTypeFilter('DAILY')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${typeFilter === 'DAILY' ? 'bg-green-600 text-white shadow-md' : 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'}`}
          >
            <Calendar size={14} />
            <span>حركة يومية ({activeYear})</span>
          </button>
        </div>
      </div>

      {/* Transactions Data Table */}
      <div className="bg-white border border-slate-200 rounded-[20px] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-start border-collapse">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <th className="py-3 px-4 text-start font-bold">نوع الحركة</th>
                <th className="py-3 px-4 text-start font-bold">الاتجاه</th>
                <th className="py-3 px-4 text-start font-bold">البيان / التفاصيل</th>
                <th className="py-3 px-4 text-start font-bold">المبلغ</th>
                <th className="py-3 px-4 text-start font-bold">التاريخ</th>
                <th className="py-3 px-4 text-start font-bold">السنة الدراسية</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm font-medium text-slate-800 dark:text-slate-200">
              {loading ? (
                <>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="py-3 px-4">
                        <div className="h-5 w-20 bg-gray-200 dark:bg-gray-800 rounded-lg"></div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="h-5 w-16 bg-gray-200 dark:bg-gray-800 rounded-lg"></div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="h-4 w-44 bg-gray-200 dark:bg-gray-800 rounded-lg"></div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="h-4 w-20 bg-gray-200 dark:bg-gray-800 rounded-lg"></div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="h-4 w-20 bg-gray-200 dark:bg-gray-800 rounded-lg"></div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="h-4 w-16 bg-gray-200 dark:bg-gray-800 rounded-lg"></div>
                      </td>
                    </tr>
                  ))}
                </>
              ) : displayedTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="bg-blue-50 rounded-full p-6 mb-3">
                        <Landmark className="h-16 w-16 text-blue-300" />
                      </div>
                      <p className="font-extrabold text-slate-800 text-sm mb-1">لا توجد حركات مسجلة مطابقة للفلتر المحدد</p>
                      <p className="text-xs text-slate-400">يمكنك إضافة حركة جديدة أو تغيير فلتر التصنيف بالأعلى.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                displayedTransactions.map(tx => {
                  const isBasic = tx.category_type === 'basic' || tx.category_type === 'حركة أساسية';
                  return (
                    <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors duration-150">
                      {/* Movement Type Badge */}
                      <td className="py-3 px-4 text-start whitespace-nowrap">
                        {isBasic ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[11px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60">
                            <Landmark size={12} />
                            حركة أساسية
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                            <Calendar size={12} />
                            حركة يومية
                          </span>
                        )}
                      </td>

                      {/* Direction: IN/OUT */}
                      <td className="py-3 px-4 text-start whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-bold ${tx.type === 'IN' ? 'bg-green-50 dark:bg-green-950/50 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800/60' : 'bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800/60'}`}>
                          {tx.type === 'IN' ? <ArrowUpRight size={13}/> : <ArrowDownRight size={13}/>}
                          {tx.type === 'IN' ? 'وارد (+)' : 'صادر (-)'}
                        </span>
                      </td>

                      {/* Description */}
                      <td className="py-3 px-4 text-start font-bold text-slate-900 dark:text-white min-w-[200px]">
                        <div className="flex items-center gap-2">
                          <span>{tx.description}</span>
                          {tx.sync_status === 'pending' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-bold border border-amber-200 dark:border-amber-800/60" title="محفوظ محلياً - بانتظار المزامنة">
                              <Clock size={10} />
                              <span>معلق</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center text-[10px] text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/60 px-2 py-0.5 rounded-full font-bold border border-green-100 dark:border-green-800/60" title="متزامن">
                              <CheckCircle2 size={12} className="ms-0.5" />
                              <span>متزامن</span>
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Amount */}
                      <td className={`py-3 px-4 text-start font-extrabold whitespace-nowrap text-sm ${tx.type === 'IN' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        <span dir="ltr">{tx.type === 'IN' ? '+' : '-'} {Number(tx.amount || 0).toLocaleString()} د.ل</span>
                      </td>

                      {/* Date */}
                      <td className="py-3 px-4 text-start text-slate-500 dark:text-slate-400 text-xs whitespace-nowrap font-medium">
                        {tx.date}
                      </td>

                      {/* Academic Year */}
                      <td className="py-3 px-4 text-start text-slate-500 dark:text-slate-400 text-xs whitespace-nowrap font-medium">
                        {isBasic ? (
                          <span className="text-indigo-600 dark:text-indigo-400 font-bold">ثابت (دائم)</span>
                        ) : (
                          <span>{tx.academic_year || activeYear}</span>
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

      {showAddModal && (
        <AddTransactionModal 
          activeYear={activeYear}
          onClose={() => setShowAddModal(false)} 
          onAdded={fetchTransactions} 
        />
      )}

      {showDailyClosingModal && (
        <DailyClosingModal 
          onClose={() => {
            setShowDailyClosingModal(false);
            fetchTransactions();
          }} 
        />
      )}
    </div>
  );
}

function AddTransactionModal({ activeYear, onClose, onAdded }: { activeYear: string, onClose: () => void, onAdded: () => void }) {
  const [formData, setFormData] = useState({ 
    type: 'OUT', 
    amount: '', 
    description: '',
    category_type: 'daily' as 'daily' | 'basic',
    attachment: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    const amountVal = Number(formData.amount);
    if (!amountVal || amountVal <= 0) return;
    setLoading(true);

    try {
      await syncService.saveTransaction({
        type: formData.type as 'IN' | 'OUT',
        amount: amountVal,
        description: formData.description,
        category_type: formData.category_type,
        academic_year: formData.category_type === 'basic' ? undefined : activeYear
      });
      onAdded();
      onClose();
    } catch (err) {
      console.error('Error saving transaction to IndexedDB:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      maxWidth="md"
      title={
        <div>
          <h2 className="font-extrabold text-base text-slate-900 dark:text-slate-100">إضافة حركة مالية للخزينة</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">تسجيل إيرادات أو مصروفات مع تحديد نوع الحركة</p>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4" dir="rtl">
        {/* 1. Category Type */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
            نوع الحركة في الخزينة <span className="text-rose-500">*</span>
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            <button 
              type="button" 
              onClick={() => setFormData({...formData, category_type: 'daily'})}
              className={`py-2.5 px-3 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1 transition-all ${formData.category_type === 'daily' ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-800 dark:text-emerald-300 shadow-xs' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50'}`}
            >
              <div className="flex items-center gap-1.5 font-bold">
                <Calendar size={14} />
                <span>حركة يومية</span>
              </div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">أقساط ومصروفات السنة</span>
            </button>

            <button 
              type="button" 
              onClick={() => setFormData({...formData, category_type: 'basic'})}
              className={`py-2.5 px-3 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1 transition-all ${formData.category_type === 'basic' ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500 text-indigo-800 dark:text-indigo-300 shadow-xs' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50'}`}
            >
              <div className="flex items-center gap-1.5 font-bold">
                <Landmark size={14} />
                <span>حركة أساسية</span>
              </div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">رأس مال وأرصدة ثابتة</span>
            </button>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 font-medium">
            {formData.category_type === 'basic' 
              ? 'الحركة الأساسية تظل مرئية دائماً في الخزينة مهما تغيرت السنة الدراسية.'
              : `الحركة اليومية تتبع السنة الدراسية المحددة (${activeYear}).`}
          </p>
        </div>

        {/* 2. Direction: IN/OUT */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">طبيعة العملية</label>
          <div className="flex gap-2">
            <button 
              type="button" 
              onClick={() => setFormData({...formData, type: 'IN'})} 
              className={`flex-1 py-2.5 rounded-2xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${formData.type === 'IN' ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-800 dark:text-emerald-300 shadow-xs' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400'}`}
            >
              <ArrowUpRight size={15} />
              <span>وارد إلى الخزينة (+)</span>
            </button>
            <button 
              type="button" 
              onClick={() => setFormData({...formData, type: 'OUT'})} 
              className={`flex-1 py-2.5 rounded-2xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${formData.type === 'OUT' ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-500 text-rose-800 dark:text-rose-300 shadow-xs' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400'}`}
            >
              <ArrowDownRight size={15} />
              <span>صادر من الخزينة (-)</span>
            </button>
          </div>
        </div>

        {/* 3. Amount */}
        <Input
          required
          type="number"
          label="المبلغ (د.ل)"
          placeholder="مثال: 1500"
          value={formData.amount}
          onChange={e => setFormData({...formData, amount: e.target.value})}
          className="font-bold text-sm"
        />

        {/* 4. Description */}
        <Input
          required
          type="text"
          label="البيان / التفاصيل"
          placeholder="مثال: إيداع رأس مال افتتاحي / شراء مستلزمات..."
          value={formData.description}
          onChange={e => setFormData({...formData, description: e.target.value})}
        />

        {/* 5. Native Camera capture for Invoices / Receipts */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">إرفاق إيصال / فاتورة (اختياري)</label>
            <div className="flex items-center gap-2">
              <input 
                type="file" 
                accept="image/*" 
                capture="environment" 
                className="hidden" 
                id="txCameraInput" 
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      setFormData(prev => ({ ...prev, attachment: reader.result as string }));
                    };
                    reader.readAsDataURL(file);
                  }
                }}
              />
              <label 
                htmlFor="txCameraInput" 
                className="cursor-pointer inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold shadow-xs transition-all active:scale-[0.98]"
                title="فتح كاميرا الهاتف لالتقاط صورة الفاتورة"
              >
                <span>فتح الكاميرا</span>
              </label>
            </div>
          </div>
          {formData.attachment && (
            <div className="relative mt-2 p-2.5 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <img src={formData.attachment} alt="المستند المرفق" className="w-10 h-10 object-cover rounded-xl border border-slate-200 dark:border-slate-700" />
                <span className="text-xs text-emerald-700 dark:text-emerald-300 font-bold">تم إرفاق صورة الفاتورة</span>
              </div>
              <button 
                type="button" 
                onClick={() => setFormData(prev => ({ ...prev, attachment: '' }))}
                className="text-xs text-rose-600 hover:text-rose-700 font-bold px-2 py-1"
              >
                إزالة
              </button>
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-white/5">
          <button 
            type="button" 
            onClick={onClose} 
            className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 py-3 rounded-2xl font-bold text-xs transition-colors"
          >
            إلغاء
          </button>
          <button 
            type="submit" 
            disabled={loading} 
            className="flex-[2] bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white py-3 rounded-2xl font-bold text-xs transition-all shadow-md active:scale-[0.98]"
          >
            {loading ? 'جاري الحفظ...' : 'تأكيد الحفظ'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
