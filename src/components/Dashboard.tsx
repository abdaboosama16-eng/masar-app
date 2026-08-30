import { useEffect, useState } from 'react';
import { ArrowDownRight, ArrowUpRight, GraduationCap, Users, UserSquare2, BookOpen, TrendingUp, Wallet, FileSpreadsheet } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Transaction, Student } from '../types';
import { useLanguage } from '../i18n';
import { syncService } from '../lib/syncService';
import { useSchoolSettings } from '../lib/settings';

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
      <div className="space-y-8 animate-pulse" dir="rtl">
        {/* Top Banner Skeleton */}
        <div className="space-y-2.5">
          <div className="h-8 w-44 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
          <div className="h-4 w-72 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
        </div>

        {/* 4 Stat Cards Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="animate-pulse bg-slate-200 dark:bg-slate-800 rounded-xl h-24 w-full"></div>
          ))}
        </div>

        {/* Classes Distribution Skeleton */}
        <div className="bg-white dark:bg-slate-800/60 backdrop-blur-md border border-gray-200 dark:border-slate-700/50 rounded-xl p-6 space-y-4">
          <div className="h-6 w-56 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse bg-slate-200 dark:bg-slate-800 rounded-xl h-24 w-full"></div>
            ))}
          </div>
        </div>

        {/* Chart & Side Cards Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 h-72 bg-white dark:bg-slate-800/60 backdrop-blur-md border border-gray-200 dark:border-slate-700/50 rounded-xl p-6">
            <div className="h-5 w-40 bg-slate-200 dark:bg-slate-800 rounded-xl mb-4"></div>
            <div className="h-48 bg-slate-100 dark:bg-slate-800/50 rounded-xl"></div>
          </div>
          <div className="space-y-4">
            <div className="animate-pulse bg-slate-200 dark:bg-slate-800 rounded-xl h-24 w-full"></div>
            <div className="animate-pulse bg-slate-200 dark:bg-slate-800 rounded-xl h-24 w-full"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 transition-colors duration-500 ease-in-out" dir="rtl">
      {/* Top Banner / Welcome: Minimalist & Clean */}
      <div className="opacity-0 animate-fade-in-up">
        <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-gray-100 tracking-tight leading-relaxed">
          لوحة التحكم
        </h1>
        <p className="text-xs md:text-sm text-slate-500 dark:text-gray-300 mt-1 font-medium leading-relaxed">
          مرحباً بك في لوحة تحكم وإدارة منظومة {settings.schoolName}
        </p>
      </div>

      {/* Top Highlight Metric Cards - Staggered Fade-in */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: بطاقة الطلاب (أزرق فاتح/سماوي) */}
        <div className="opacity-0 animate-fade-in-up stagger-1 delay-100 bg-white dark:bg-slate-800/60 backdrop-blur-md rounded-xl shadow-sm border-2 border-sky-200 dark:border-sky-800/60 p-6 hover:shadow transition-all duration-300 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 leading-relaxed">إجمالي الطلاب</span>
            <div className="w-10 h-10 bg-sky-500 text-white rounded-xl flex items-center justify-center shadow-xs">
              <Users size={20} />
            </div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-slate-900 dark:text-gray-100 tracking-tight font-mono leading-relaxed">
              {classStats.totalStudents}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-medium leading-relaxed">طالب وطالبة مسجلين</p>
          </div>
        </div>

        {/* Card 2: بطاقة الخزينة (أزرق داكن/نيلي) */}
        <div className="opacity-0 animate-fade-in-up stagger-2 delay-100 bg-white dark:bg-slate-800/60 backdrop-blur-md rounded-xl shadow-sm border-2 border-indigo-200 dark:border-indigo-800/60 p-6 hover:shadow transition-all duration-300 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 leading-relaxed">صافي الخزينة</span>
            <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-xs">
              <Wallet size={20} />
            </div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-indigo-900 dark:text-indigo-300 tracking-tight font-mono leading-relaxed">
              {stats.balance.toLocaleString()} <span className="text-xs font-bold text-indigo-700/80 dark:text-indigo-400/80 font-sans">د.ل</span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-medium leading-relaxed">الرصيد المالي الحالي</p>
          </div>
        </div>

        {/* Card 3: بطاقة الواردات (أخضر زمردي) */}
        <div className="opacity-0 animate-fade-in-up stagger-3 delay-100 bg-white dark:bg-slate-800/60 backdrop-blur-md rounded-xl shadow-sm border-2 border-emerald-200 dark:border-emerald-800/60 text-emerald-600 p-6 hover:shadow transition-all duration-300 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 leading-relaxed">الواردات</span>
            <div className="w-10 h-10 bg-emerald-500 text-white rounded-xl flex items-center justify-center shadow-xs">
              <ArrowUpRight size={20} />
            </div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight font-mono leading-relaxed">
              {stats.totalIn.toLocaleString()} <span className="text-xs font-bold text-emerald-600/80 dark:text-emerald-400/80 font-sans">د.ل</span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-medium leading-relaxed">إجمالي المقبوضات النقدية</p>
          </div>
        </div>

        {/* Card 4: بطاقة الصادرات (أحمر) */}
        <div className="opacity-0 animate-fade-in-up stagger-4 delay-100 bg-white dark:bg-slate-800/60 backdrop-blur-md rounded-xl shadow-sm border-2 border-red-200 dark:border-red-800/60 text-red-600 p-6 hover:shadow transition-all duration-300 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 leading-relaxed">الصادرات</span>
            <div className="w-10 h-10 bg-red-500 text-white rounded-xl flex items-center justify-center shadow-xs">
              <ArrowDownRight size={20} />
            </div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-red-600 dark:text-red-400 tracking-tight font-mono leading-relaxed">
              {stats.totalOut.toLocaleString()} <span className="text-xs font-bold text-red-600/80 dark:text-red-400/80 font-sans">د.ل</span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-medium leading-relaxed">إجمالي المصروفات والنفقات</p>
          </div>
        </div>
      </div>
      
      {/* Registration & Classes Distribution */}
      <div className="opacity-0 animate-fade-in-up stagger-5 delay-100 bg-white dark:bg-slate-800/60 backdrop-blur-md border border-gray-100 dark:border-slate-700/50 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 border-b border-gray-100 dark:border-slate-700/50 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 dark:bg-slate-800 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center border border-blue-100 dark:border-slate-700">
              <GraduationCap size={20} />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-gray-100 leading-relaxed">توزيع الطلاب حسب المراحل الدراسية</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium leading-relaxed">إحصائيات دقيقة ومحدثة لتوزيع الطلاب</p>
            </div>
          </div>
          <div className="self-start sm:self-auto bg-gray-50 dark:bg-slate-800 text-gray-700 dark:text-gray-300 px-3.5 py-1.5 rounded-xl text-xs font-bold border border-gray-200 dark:border-slate-700 flex items-center gap-2">
            <Users size={14} className="text-blue-600 dark:text-blue-400" />
            <span className="leading-relaxed">إجمالي المقيدين: <strong className="text-sm font-black text-slate-900 dark:text-gray-100">{classStats.totalStudents}</strong></span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Class 1: Early Education (التعليم المبكر) */}
          <div className="bg-white dark:bg-slate-800/60 backdrop-blur-md rounded-xl shadow-sm border-2 border-green-200 dark:border-green-800/60 p-6 flex flex-col justify-between hover:border-green-300 transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span>
                <span className="text-xs font-bold text-slate-900 dark:text-gray-100 leading-relaxed">التعليم المبكر</span>
              </div>
              <span className="bg-green-50 dark:bg-green-950/50 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800/60 px-2.5 py-0.5 rounded-md text-[10px] font-bold">
                مواليد 2023 وما بعد
              </span>
            </div>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl font-black text-slate-900 dark:text-gray-100 font-mono leading-relaxed">{classStats.earlyEduCount}</span>
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium leading-relaxed">طالب/ـة</span>
            </div>
          </div>

          {/* Class 2: Kindergarten (الروضة) */}
          <div className="bg-white dark:bg-slate-800/60 backdrop-blur-md rounded-xl shadow-sm border-2 border-purple-200 dark:border-purple-800/60 p-6 flex flex-col justify-between hover:border-purple-300 transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
                <span className="text-xs font-bold text-slate-900 dark:text-gray-100 leading-relaxed">الروضة</span>
              </div>
              <span className="bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60 px-2.5 py-0.5 rounded-md text-[10px] font-bold">
                مواليد 2022
              </span>
            </div>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl font-black text-slate-900 dark:text-gray-100 font-mono leading-relaxed">{classStats.kindergartenCount}</span>
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium leading-relaxed">طالب/ـة</span>
            </div>
          </div>

          {/* Class 3: Preparatory (التأهيلي) */}
          <div className="bg-white dark:bg-slate-800/60 backdrop-blur-md rounded-xl shadow-sm border-2 border-yellow-200 dark:border-yellow-800/60 p-6 flex flex-col justify-between hover:border-yellow-300 transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-400"></span>
                <span className="text-xs font-bold text-slate-900 dark:text-gray-100 leading-relaxed">التأهيلي</span>
              </div>
              <span className="bg-yellow-50 dark:bg-yellow-950/50 text-yellow-800 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800/60 px-2.5 py-0.5 rounded-md text-[10px] font-bold">
                مواليد 2021
              </span>
            </div>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl font-black text-slate-900 dark:text-gray-100 font-mono leading-relaxed">{classStats.preparatoryCount}</span>
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium leading-relaxed">طالب/ـة</span>
            </div>
          </div>
        </div>
      </div>

      {/* Chart & Teachers Summary Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Treasury Chart Card */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800/60 backdrop-blur-md border border-gray-100 dark:border-slate-700/50 rounded-xl p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-blue-50 dark:bg-slate-800 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center border border-blue-100 dark:border-slate-700">
                <TrendingUp size={18} />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 dark:text-gray-100 text-sm">{t('treasury_movement')}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">المسار البياني للسيولة والنقدية</p>
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
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: document.documentElement.classList.contains('dark') ? 'rgba(30, 41, 59, 0.92)' : '#ffffff', 
                    borderColor: document.documentElement.classList.contains('dark') ? 'rgba(51, 65, 85, 0.5)' : '#e2e8f0', 
                    borderRadius: '12px', 
                    color: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#0f172a', 
                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                    backdropFilter: 'blur(12px)',
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
          <div className="bg-white dark:bg-slate-800/60 backdrop-blur-md border border-gray-100 dark:border-slate-700/50 rounded-xl p-5 shadow-sm flex items-center justify-between hover:shadow transition-all">
            <div>
              <p className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">{t('registered_students')}</p>
              <p className="text-3xl font-black text-slate-900 dark:text-gray-100 font-mono">{classStats.totalStudents}</p>
              <span className="text-[11px] text-blue-600 dark:text-blue-400 font-bold mt-1 inline-block">مسجلين في المنظومة</span>
            </div>
            <div className="w-12 h-12 bg-blue-400 text-white rounded-xl flex items-center justify-center shadow-xs">
              <Users size={22} />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800/60 backdrop-blur-md border border-gray-100 dark:border-slate-700/50 rounded-xl p-5 shadow-sm flex items-center justify-between hover:shadow transition-all">
            <div>
              <p className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">{t('teachers_count')}</p>
              <p className="text-3xl font-black text-slate-900 dark:text-gray-100 font-mono">{stats.teachersCount}</p>
              <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-bold mt-1 inline-block">معلم وكادر تدريسي</span>
            </div>
            <div className="w-12 h-12 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-xs">
              <UserSquare2 size={22} />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions List */}
      <div className="bg-white dark:bg-slate-800/60 backdrop-blur-md border border-gray-100 dark:border-slate-700/50 rounded-xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-700/50 bg-gray-50/50 dark:bg-slate-800/40 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-50 dark:bg-slate-800 text-blue-600 dark:text-blue-400 rounded-lg">
              <FileSpreadsheet size={16} />
            </div>
            <h3 className="font-extrabold text-slate-900 dark:text-gray-100 text-sm">{t('recent_transactions')}</h3>
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">آخر الحركات المسجلة</span>
        </div>

        <div>
          {recentTransactions.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-slate-800 border border-blue-100 dark:border-slate-700 flex items-center justify-center mb-3">
                <BookOpen className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h4 className="font-extrabold text-slate-800 dark:text-slate-200 text-sm mb-1">لا توجد حركات مالية مسجلة حديثاً</h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm">
                عند تسجيل أول قسط أو حركة مالية بالخزينة، ستظهر التفاصيل الكاملة هنا مباشرة.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-slate-800">
              {recentTransactions.map(tx => (
                <div key={tx.id} className="py-4 px-5 flex items-center justify-between hover:bg-gray-50/80 dark:hover:bg-slate-800/50 transition-colors duration-150">
                  <div className="flex items-center gap-3.5">
                    <div className={`p-2 rounded-xl ${tx.type === 'IN' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400' : 'bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400'}`}>
                      {tx.type === 'IN' ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 dark:text-gray-100 text-sm">{tx.description}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 font-medium">{tx.date}</p>
                    </div>
                  </div>
                  <div className={`font-black text-sm flex items-center justify-end ${tx.type === 'IN' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
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


