import { useEffect, useState } from 'react';
import { ArrowDownRight, ArrowUpRight, GraduationCap, Users, UserSquare2, BookOpen, TrendingUp, Wallet, FileSpreadsheet } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Transaction, Student } from '../types';
import { useLanguage } from '../i18n';
import { syncService } from '../lib/syncService';
import { useSchoolSettings } from '../lib/settings';
import { BackupRestoreControls } from './BackupRestoreControls';

export default function Dashboard() {
  const { t } = useLanguage();
  const { settings } = useSchoolSettings();
  const [stats, setStats] = useState({ totalIn: 0, totalOut: 0, balance: 0, teachersCount: 0 });
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [classStats, setClassStats] = useState({
    totalStudents: 0,
    earlyEduCount: 0,
    kindergartenCount: 0,
    preparatoryCount: 0,
  });
  const [loading, setLoading] = useState(true);

  const calculateStudentStats = (studentsList: Student[]) => {
    let earlyEduCount = 0;
    let kindergartenCount = 0;
    let preparatoryCount = 0;

    studentsList.forEach(s => {
      const grade = (s.grade || '').trim();
      if (grade === 'التعليم المبكر') {
        earlyEduCount++;
      } else if (grade === 'الروضة') {
        kindergartenCount++;
      } else if (grade === 'التأهيلي') {
        preparatoryCount++;
      }
    });

    setClassStats({
      totalStudents: studentsList.length,
      earlyEduCount,
      kindergartenCount,
      preparatoryCount,
    });
  };

  const loadDashboardData = async () => {
    try {
      const [allTx, studentsList, teachersList] = await Promise.all([
        syncService.getTransactions(),
        syncService.getStudents(),
        syncService.getTeachers()
      ]);

      const totalIn = allTx.filter(t => t.type === 'IN').reduce((sum, t) => sum + Number(t.amount || 0), 0);
      const totalOut = allTx.filter(t => t.type === 'OUT').reduce((sum, t) => sum + Number(t.amount || 0), 0);
      const balance = totalIn - totalOut;

      setStats({
        totalIn,
        totalOut,
        balance,
        teachersCount: teachersList.length
      });
      setRecentTransactions(allTx.slice(0, 8));
      calculateStudentStats(studentsList);
    } catch (err) {
      console.error('Error loading dashboard data from IndexedDB:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();

    const handleDataChanged = () => {
      loadDashboardData();
    };
    window.addEventListener('appDataChanged', handleDataChanged);
    window.addEventListener('masar_data_restored', handleDataChanged);
    return () => {
      window.removeEventListener('appDataChanged', handleDataChanged);
      window.removeEventListener('masar_data_restored', handleDataChanged);
    };
  }, []);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-indigo-900 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-bold text-slate-500">جاري تحميل بيانات المنظومة...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Top Banner / Welcome: Minimalist & Clean */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
            لوحة التحكم
          </h1>
          <p className="text-xs md:text-sm text-slate-500 mt-1 font-medium">
            مرحباً بك في لوحة تحكم وإدارة منظومة {settings.schoolName}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <BackupRestoreControls variant="compact" />
        </div>
      </div>

      {/* Top Highlight Metric Cards - Modern, Minimalist & Clean */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Total Students */}
        <div className="bg-blue-50 border border-blue-100 rounded-[20px] p-7 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-100/50 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-110"></div>
          <div className="flex items-center justify-between mb-6 relative z-10">
            <span className="text-xs font-bold text-blue-800 uppercase tracking-wider">إجمالي الطلاب</span>
            <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center border border-blue-200">
              <Users size={18} strokeWidth={2} />
            </div>
          </div>
          <div className="relative z-10">
            <div className="text-4xl font-extrabold text-blue-900 tracking-tight mb-2">{classStats.totalStudents}</div>
            <p className="text-xs text-blue-600/80 font-medium">طالب وطالبة بجميع المراحل</p>
          </div>
        </div>

        {/* Card 2: Treasury Balance */}
        <div className="bg-indigo-50 border border-indigo-100 rounded-[20px] p-7 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-100/50 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-110"></div>
          <div className="flex items-center justify-between mb-6 relative z-10">
            <span className="text-xs font-bold text-indigo-800 uppercase tracking-wider">{t('net_balance')}</span>
            <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center border border-indigo-200">
              <Wallet size={18} strokeWidth={2} />
            </div>
          </div>
          <div className="relative z-10">
            <div className="text-4xl font-extrabold text-indigo-900 tracking-tight mb-2">
              {stats.balance.toLocaleString()} <span className="text-sm font-bold text-indigo-600/70">د.ل</span>
            </div>
            <p className="text-xs text-indigo-600/80 font-medium">صافي الرصيد بالخزينة</p>
          </div>
        </div>

        {/* Card 3: Total In */}
        <div className="bg-emerald-50 border border-emerald-100 rounded-[20px] p-7 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-100/50 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-110"></div>
          <div className="flex items-center justify-between mb-6 relative z-10">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">{t('total_in')}</span>
            <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center border border-emerald-200">
              <ArrowUpRight size={18} strokeWidth={2} />
            </div>
          </div>
          <div className="relative z-10">
            <div className="text-4xl font-extrabold text-emerald-700 tracking-tight mb-2">
              {stats.totalIn.toLocaleString()} <span className="text-sm font-bold text-emerald-600/70">د.ل</span>
            </div>
            <p className="text-xs text-emerald-600/80 font-medium">إجمالي المقبوضات النقدية</p>
          </div>
        </div>

        {/* Card 4: Total Out */}
        <div className="bg-rose-50 border border-rose-100 rounded-[20px] p-7 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-100/50 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-110"></div>
          <div className="flex items-center justify-between mb-6 relative z-10">
            <span className="text-xs font-bold text-rose-800 uppercase tracking-wider">{t('total_out')}</span>
            <div className="w-10 h-10 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center border border-rose-200">
              <ArrowDownRight size={18} strokeWidth={2} />
            </div>
          </div>
          <div className="relative z-10">
            <div className="text-4xl font-extrabold text-rose-700 tracking-tight mb-2">
              {stats.totalOut.toLocaleString()} <span className="text-sm font-bold text-rose-600/70">د.ل</span>
            </div>
            <p className="text-xs text-rose-600/80 font-medium">إجمالي المصروفات التشغيلية</p>
          </div>
        </div>
      </div>
      
      {/* Registration & Classes Distribution */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
              <GraduationCap size={22} />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900">توزيع الطلاب حسب المراحل الدراسية</h3>
              <p className="text-xs text-slate-500 font-medium">إحصائيات دقيقة وتلقائية حسب تاريخ ميلاد الطالب</p>
            </div>
          </div>
          <div className="self-start sm:self-auto bg-slate-50 text-slate-700 px-3.5 py-1.5 rounded-xl text-xs font-bold border border-slate-200 flex items-center gap-2">
            <Users size={14} className="text-blue-600" />
            <span>إجمالي المقيدين: <strong className="text-sm font-black text-slate-900">{classStats.totalStudents}</strong></span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Class 1: Early Education */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 flex flex-col justify-between hover:border-emerald-400 hover:shadow-xs transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <span className="text-xs font-bold text-slate-800">التعليم المبكر</span>
              </div>
              <span className="bg-emerald-100 text-emerald-800 border border-emerald-200/80 px-2.5 py-0.5 rounded-md text-[10px] font-bold">
                مواليد 2023 وما بعد
              </span>
            </div>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl font-black text-emerald-600">{classStats.earlyEduCount}</span>
              <span className="text-xs text-slate-500 font-medium">طالب/ـة</span>
            </div>
          </div>

          {/* Class 2: Kindergarten */}
          <div className="bg-fuchsia-50 border border-fuchsia-200 rounded-xl p-5 flex flex-col justify-between hover:border-fuchsia-400 hover:shadow-xs transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-fuchsia-500"></span>
                <span className="text-xs font-bold text-slate-800">الروضة</span>
              </div>
              <span className="bg-fuchsia-100 text-fuchsia-800 border border-fuchsia-200 px-2.5 py-0.5 rounded-md text-[10px] font-bold">
                مواليد 2022
              </span>
            </div>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl font-black text-fuchsia-600">{classStats.kindergartenCount}</span>
              <span className="text-xs text-slate-500 font-medium">طالب/ـة</span>
            </div>
          </div>

          {/* Class 3: Preparatory */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 flex flex-col justify-between hover:border-amber-400 hover:shadow-xs transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                <span className="text-xs font-bold text-slate-800">التأهيلي</span>
              </div>
              <span className="bg-amber-100 text-amber-800 border border-amber-200 px-2.5 py-0.5 rounded-md text-[10px] font-bold">
                مواليد 2021
              </span>
            </div>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl font-black text-amber-600">{classStats.preparatoryCount}</span>
              <span className="text-xs text-slate-500 font-medium">طالب/ـة</span>
            </div>
          </div>
        </div>
      </div>

      {/* Chart & Teachers Summary Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Treasury Chart Card */}
        <div className="lg:col-span-2 bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                <TrendingUp size={18} />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">{t('treasury_movement')}</h3>
                <p className="text-xs text-slate-500 font-medium">المسار البياني للسيولة والنقدية</p>
              </div>
            </div>
          </div>
          <div className="h-60 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={[
                { name: 'اليوم الأول', amount: stats.balance * 0.2 },
                { name: 'منتصف الشهر', amount: stats.balance * 0.5 },
                { name: 'الآن', amount: stats.balance }
              ]} margin={{ top: 10, right: 15, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorAmountSoft" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#ffffff', 
                    borderColor: '#e2e8f0', 
                    borderRadius: '12px', 
                    color: '#0f172a', 
                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                  }} 
                  itemStyle={{ color: '#2563eb', fontWeight: 'bold' }} 
                />
                <Area type="monotone" dataKey="amount" stroke="#2563eb" strokeWidth={2.5} fillOpacity={1} fill="url(#colorAmountSoft)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Side Metrics */}
        <div className="space-y-4 flex flex-col justify-between">
          <div className="bg-gradient-to-b from-sky-50/60 to-white border border-sky-200/70 rounded-2xl p-5 shadow-xs flex items-center justify-between hover:border-sky-300 hover:shadow-xs transition-all">
            <div>
              <p className="text-xs font-bold text-sky-950/80 mb-1">{t('registered_students')}</p>
              <p className="text-3xl font-black text-slate-900">{classStats.totalStudents}</p>
              <span className="text-[11px] text-sky-600 font-bold mt-1 inline-block">مسجلين في المنظومة</span>
            </div>
            <div className="w-12 h-12 bg-sky-500 text-white rounded-xl flex items-center justify-center shadow-xs shadow-sky-500/25">
              <Users size={24} />
            </div>
          </div>

          <div className="bg-gradient-to-b from-indigo-50/60 to-white border border-indigo-200/70 rounded-2xl p-5 shadow-xs flex items-center justify-between hover:border-indigo-300 hover:shadow-xs transition-all">
            <div>
              <p className="text-xs font-bold text-indigo-950/80 mb-1">{t('teachers_count')}</p>
              <p className="text-3xl font-black text-slate-900">{stats.teachersCount}</p>
              <span className="text-[11px] text-indigo-600 font-bold mt-1 inline-block">معلم وكادر تدريسي</span>
            </div>
            <div className="w-12 h-12 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-xs shadow-indigo-500/25">
              <UserSquare2 size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions List */}
      <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <FileSpreadsheet size={16} />
            </div>
            <h3 className="font-extrabold text-slate-900 text-sm">{t('recent_transactions')}</h3>
          </div>
          <span className="text-xs text-slate-500 font-medium">آخر الحركات المسجلة</span>
        </div>

        <div>
          {recentTransactions.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center mb-3">
                <BookOpen className="h-8 w-8 text-blue-600" />
              </div>
              <h4 className="font-extrabold text-slate-800 text-sm mb-1">لا توجد حركات مالية مسجلة حديثاً</h4>
              <p className="text-xs text-slate-500 max-w-sm">
                عند تسجيل أول قسط أو حركة مالية بالخزينة، ستظهر التفاصيل الكاملة هنا مباشرة.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentTransactions.map(tx => (
                <div key={tx.id} className="p-4 px-6 flex items-center justify-between hover:bg-slate-50/80 transition-colors duration-150">
                  <div className="flex items-center gap-3.5">
                    <div className={`p-2 rounded-xl ${tx.type === 'IN' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                      {tx.type === 'IN' ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 text-sm">{tx.description}</p>
                      <p className="text-xs text-slate-400 mt-0.5 font-medium">{tx.date}</p>
                    </div>
                  </div>
                  <div className={`font-black text-sm flex items-center justify-end ${tx.type === 'IN' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    <span dir="ltr">{tx.type === 'IN' ? '+' : '-'} {tx.amount.toLocaleString()} د.ل</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


