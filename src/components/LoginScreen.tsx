import React, { useState } from 'react';
import { 
  ShieldCheck, Lock, UserCheck, KeyRound, AlertCircle, 
  ArrowRight, School, User, Check, Eye, EyeOff, Sparkles, Building2, HelpCircle 
} from 'lucide-react';
import { authenticateUser } from '../lib/auth';
import { LocalUser, useSchoolSettings } from '../lib/settings';
import { TechSupportButton, WhatsAppIcon } from './TechSupportButton';

interface LoginScreenProps {
  onLoginSuccess: (user: LocalUser) => void;
  title?: string;
  subtitle?: string;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ 
  onLoginSuccess,
  title = 'تسجيل الدخول للمنظومة',
  subtitle = 'يرجى اختيار نوع الحساب وإدخال كلمة المرور للمتابعة'
}) => {
  const { settings } = useSchoolSettings();
  const [selectedRole, setSelectedRole] = useState<'admin' | 'cashier'>('admin');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!password.trim()) {
      setErrorMsg('يرجى إدخال كلمة المرور أو رمز PIN');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      const result = authenticateUser(selectedRole, password);

      if (result.success && result.user) {
        onLoginSuccess(result.user);
      } else {
        setIsLoading(false);
        setErrorMsg(result.error || 'كلمة المرور غير صحيحة! يرجى التأكد من الرمز المدخل.');
      }
    }, 250);
  };

  const handleQuickFill = (code: string) => {
    setPassword(code);
    setErrorMsg(null);
  };

  return (
    <div 
      className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 text-slate-100 flex items-center justify-center p-3 sm:p-6 select-none relative overflow-hidden font-sans"
      dir="rtl"
    >
      {/* Background Decorative Lighting */}
      <div className="absolute -top-32 -right-32 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-lg bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Top Header */}
        <div className="bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 text-white p-6 text-center relative border-b border-indigo-800/40">
          <div className="w-14 h-14 bg-white/10 dark:bg-cyan-950/60 rounded-2xl mx-auto flex items-center justify-center border border-white/20 dark:border-cyan-500/40 shadow-inner mb-3">
            <Building2 className="w-7 h-7 text-cyan-400" />
          </div>

          <h1 className="text-xl font-black text-white tracking-tight">
            {settings?.schoolName || 'منظومة مسار التعليمية'}
          </h1>
          <p className="text-xs text-indigo-200/80 mt-1">
            {subtitle}
          </p>
        </div>

        {/* Login Body */}
        <div className="p-6 sm:p-8 text-slate-800 dark:text-slate-200 space-y-5">
          
          {/* User Role Selection Tabs */}
          <div>
            <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-2">
              اختر نوع الحساب / الصلاحية:
            </label>
            <div className="grid grid-cols-2 gap-2.5 p-1 bg-slate-100 dark:bg-slate-950 rounded-2xl border border-slate-200/70 dark:border-slate-800">
              
              {/* Admin Tab */}
              <button
                type="button"
                onClick={() => {
                  setSelectedRole('admin');
                  setPassword('');
                  setErrorMsg(null);
                }}
                className={`flex flex-col items-center justify-center p-3 rounded-xl transition-all cursor-pointer text-center ${
                  selectedRole === 'admin'
                    ? 'bg-white dark:bg-slate-900 text-indigo-950 dark:text-cyan-300 shadow-md border border-slate-200/80 dark:border-cyan-500/40 font-black'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-bold'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <ShieldCheck size={16} className={selectedRole === 'admin' ? 'text-indigo-600 dark:text-cyan-400' : 'text-slate-400'} />
                  <span className="text-xs">مدير النظام</span>
                </div>
                <span className="text-[10px] text-slate-400 dark:text-slate-500">
                  صلاحيات كاملة + إعدادات
                </span>
              </button>

              {/* Staff / Cashier Tab */}
              <button
                type="button"
                onClick={() => {
                  setSelectedRole('cashier');
                  setPassword('');
                  setErrorMsg(null);
                }}
                className={`flex flex-col items-center justify-center p-3 rounded-xl transition-all cursor-pointer text-center ${
                  selectedRole === 'cashier'
                    ? 'bg-white dark:bg-slate-900 text-indigo-950 dark:text-cyan-300 shadow-md border border-slate-200/80 dark:border-cyan-500/40 font-black'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-bold'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <UserCheck size={16} className={selectedRole === 'cashier' ? 'text-indigo-600 dark:text-cyan-400' : 'text-slate-400'} />
                  <span className="text-xs">موظف تحصيل</span>
                </div>
                <span className="text-[10px] text-slate-400 dark:text-slate-500">
                  تسجيل وإيصالات فقط
                </span>
              </button>

            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            
            {/* Error Alert Message */}
            {errorMsg && (
              <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/80 text-rose-900 dark:text-rose-200 text-xs font-bold flex items-start gap-2.5 animate-in shake">
                <AlertCircle size={17} className="text-rose-600 shrink-0 mt-0.5" />
                <p className="leading-relaxed flex-1">{errorMsg}</p>
              </div>
            )}

            {/* Password Input Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-black text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Lock size={14} className="text-indigo-600 dark:text-cyan-400" />
                  <span>
                    {selectedRole === 'admin' ? 'كلمة مرور المدير *' : 'رمز مرور موظف التحصيل (PIN) *'}
                  </span>
                </label>

                {/* Quick Hint / Fill Button */}
                <button
                  type="button"
                  onClick={() => handleQuickFill(selectedRole === 'admin' ? 'admin123' : '0000')}
                  className="text-[11px] text-indigo-600 dark:text-cyan-400 hover:underline font-bold"
                >
                  الرمز الافتراضي ({selectedRole === 'admin' ? 'admin123' : '0000'})
                </button>
              </div>

              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoFocus
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorMsg) setErrorMsg(null);
                  }}
                  placeholder={selectedRole === 'admin' ? 'أدخل كلمة مرور المدير (مثلاً: admin123)' : 'أدخل رمز المرور (مثلاً: 0000)'}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm font-black text-slate-900 dark:text-white outline-none focus:border-indigo-600 dark:focus:border-cyan-400 transition-all text-left shadow-inner pl-10"
                  dir="ltr"
                />
                
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Role Permissions Summary Box */}
            <div className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200/60 dark:border-slate-800/80 text-[11px] space-y-1">
              <div className="font-black text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Sparkles size={12} className="text-amber-500" />
                <span>الصلاحيات المتاحة لهذا الحساب:</span>
              </div>
              {selectedRole === 'admin' ? (
                <ul className="list-disc list-inside text-slate-500 dark:text-slate-400 space-y-0.5 pr-1">
                  <li>الوصول الكامل لكافة الإعدادات وتعديل هوية المدرسة.</li>
                  <li>تعديل الرسوم الدراسية وأقساط الطلاب.</li>
                  <li>حذف السجلات، إدارة المستخدمين والنسخ الاحتياطي.</li>
                </ul>
              ) : (
                <ul className="list-disc list-inside text-slate-500 dark:text-slate-400 space-y-0.5 pr-1">
                  <li>تسجيل بيانات الطلاب الجدد وتحصيل الأقساط.</li>
                  <li>طباعة وتصدير إيصالات القبض والتقارير المالية اليومية.</li>
                  <li className="text-amber-600 dark:text-amber-400 font-bold">يتم إخفاء زر الإعدادات ومنع إجراءات الحذف لحماية البيانات.</li>
                </ul>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-indigo-900 to-indigo-950 hover:from-indigo-800 hover:to-indigo-900 dark:from-cyan-600 dark:to-cyan-700 dark:hover:from-cyan-500 dark:hover:to-cyan-600 text-white py-3.5 px-4 rounded-xl text-xs sm:text-sm font-black transition-all shadow-md active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <span>جاري التحقق...</span>
              ) : (
                <>
                  <Check size={18} />
                  <span>دخول إلى المنظومة</span>
                </>
              )}
            </button>
          </form>

          {/* Footer Assistance */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span>نسيت كلمة المرور؟</span>
            <a
              href="https://wa.me/218927211505?text=%D8%A7%D9%84%D8%B3%D9%84%D8%A7%D9%85%20%D8%B9%D9%84%D9%8A%D9%83%D9%85%20%D9%85%D9%87%D9%86%D8%AF%D8%B3%D8%8C%20%D9%86%D8%B3%D9%8A%D8%AA%20%D9%83%D9%84%D9%85%D8%A9%20%D9%85%D8%B1%D9%88%D8%B1%20%D8%A7%D9%84%D8%AF%D8%AE%D9%88%D9%84%20%D9%84%D9%85%D9%86%D8%B8%D9%88%D9%85%D8%A9%20%D9%85%D8%B3%D8%A7%D8%B1"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 hover:underline font-bold"
            >
              <WhatsAppIcon size={13} />
              <span>مساعدة الدعم الفني (0927211505)</span>
            </a>
          </div>

        </div>

      </div>
    </div>
  );
};

export default LoginScreen;
