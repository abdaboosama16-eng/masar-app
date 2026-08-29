import React, { useState } from 'react';
import { 
  KeyRound, ShieldCheck, Phone, School, CheckCircle2, 
  AlertCircle, Sparkles, Lock, ArrowRight, Check, ExternalLink, HelpCircle
} from 'lucide-react';
import { 
  activatePlatform, getWhatsAppActivationRequestUrl, 
  validateLicenseKey, LicenseInfo 
} from '../lib/license';
import { WhatsAppIcon } from './TechSupportButton';
import { useSchoolSettings } from '../lib/settings';

interface ActivationScreenProps {
  onActivated: (license: LicenseInfo) => void;
}

export const ActivationScreen: React.FC<ActivationScreenProps> = ({ onActivated }) => {
  const { settings } = useSchoolSettings();
  
  const [activationKey, setActivationKey] = useState('');
  const [schoolName, setSchoolName] = useState(settings?.schoolName || 'مدرسة نور البيان');
  const [phone, setPhone] = useState(settings?.phone || '0927211505');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isActivating, setIsActivating] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanKey = activationKey.trim();
    if (!cleanKey) {
      setErrorMsg('يرجى إدخال رمز التفعيل الخاص بالمنظومة');
      return;
    }

    if (!schoolName.trim()) {
      setErrorMsg('يرجى كتابة اسم المدرسة أو الروضة');
      return;
    }

    if (!phone.trim()) {
      setErrorMsg('يرجى إدخال رقم الهاتف المعتمد للمؤسسة');
      return;
    }

    setIsActivating(true);

    setTimeout(() => {
      const result = activatePlatform(cleanKey, schoolName, phone);

      if (result.success && result.license) {
        setIsSuccess(true);
        setErrorMsg(null);
        setTimeout(() => {
          onActivated(result.license!);
        }, 1200);
      } else {
        setIsActivating(false);
        setErrorMsg('رمز التفعيل غير صحيح أو منتهي الصلاحية! يرجى مراجعة الرمز أو التواصل مع المطور والدعم الفني على الرقم 0927211505.');
      }
    }, 400);
  };

  const handleApplyDemoKey = () => {
    setActivationKey('MASAR-2026-VIP');
    setErrorMsg(null);
  };

  const whatsAppUrl = getWhatsAppActivationRequestUrl(schoolName, phone);

  return (
    <div 
      className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 text-slate-100 flex items-center justify-center p-3 sm:p-6 md:p-8 select-none relative overflow-hidden font-sans"
      dir="rtl"
    >
      {/* Background Decorative Circles */}
      <div className="absolute -top-32 -right-32 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        
        {/* Top Header Card */}
        <div className="bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 text-center relative border-b border-indigo-800/40">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/10 dark:bg-cyan-950/60 rounded-3xl mx-auto flex items-center justify-center border border-white/20 dark:border-cyan-500/40 shadow-inner mb-4">
            <KeyRound className="w-8 h-8 sm:w-10 sm:h-10 text-cyan-400" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-bold mb-2">
            <ShieldCheck size={14} />
            <span>نظام حماية وتفعيل منظومة مسار</span>
          </div>

          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
            تفعيل ترخيص المنظومة التعليمية
          </h1>
          <p className="text-xs sm:text-sm text-indigo-200/80 mt-1 max-w-md mx-auto leading-relaxed">
            يرجى إدخال رمز التفعيل المعتمد لفتح لوحة التحكم وإدارة كافة السجلات والحسابات المالية
          </p>
        </div>

        {/* Main Activation Form */}
        <div className="p-6 sm:p-8 text-slate-800 dark:text-slate-200">
          {isSuccess ? (
            <div className="text-center py-8 space-y-4 animate-in fade-in">
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-300 dark:border-emerald-800">
                <CheckCircle2 size={36} />
              </div>
              <h2 className="text-lg font-black text-emerald-700 dark:text-emerald-400">
                تم التفعيل بنجاح!
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                تم التحقق من الترخيص وحفظ التفعيل محلياً. جاري توجيهك إلى لوحة التحكم الرئيسية...
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Error Alert Message */}
              {errorMsg && (
                <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/80 text-rose-900 dark:text-rose-200 text-xs font-bold flex items-start gap-3 animate-in shake">
                  <AlertCircle size={18} className="text-rose-600 shrink-0 mt-0.5" />
                  <div className="space-y-1.5 flex-1">
                    <p className="leading-relaxed">{errorMsg}</p>
                    <a
                      href={whatsAppUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-[11px] text-emerald-700 dark:text-emerald-400 hover:underline font-black mt-1"
                    >
                      <WhatsAppIcon size={13} />
                      <span>تواصل مع المطور عبر واتساب (0927211505) لحل المشكلة</span>
                    </a>
                  </div>
                </div>
              )}

              {/* School Name */}
              <div>
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <School size={14} className="text-indigo-600 dark:text-cyan-400" />
                  <span>اسم المدرسة / المؤسسة التعليمية *</span>
                </label>
                <input
                  type="text"
                  required
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  placeholder="مثلاً: مدرسة نور البيان"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-indigo-600 dark:focus:border-cyan-400 transition-all shadow-inner"
                />
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Phone size={14} className="text-indigo-600 dark:text-cyan-400" />
                  <span>رقم هاتف التواصل المعتمد *</span>
                </label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="مثلاً: 0927211505"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-indigo-600 dark:focus:border-cyan-400 transition-all text-left shadow-inner"
                  dir="ltr"
                />
              </div>

              {/* Activation Key */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-black text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <KeyRound size={14} className="text-indigo-600 dark:text-cyan-400" />
                    <span>رمز التفعيل (Activation Key) *</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleApplyDemoKey}
                    className="text-[11px] text-indigo-600 dark:text-cyan-400 hover:underline font-bold"
                  >
                    تجربة رمز افتراضي (MASAR-2026-VIP)
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={activationKey}
                    onChange={(e) => {
                      setActivationKey(e.target.value.toUpperCase());
                      if (errorMsg) setErrorMsg(null);
                    }}
                    placeholder="MASAR-2026-XXXX"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm font-black font-mono tracking-wider text-slate-900 dark:text-white outline-none focus:border-indigo-600 dark:focus:border-cyan-400 transition-all text-left uppercase shadow-inner"
                    dir="ltr"
                  />
                  <div className="absolute right-3 top-3 text-slate-400 pointer-events-none">
                    <Lock size={16} />
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                  صيغة الرمز تبدأ بـ <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-indigo-700 dark:text-cyan-400 font-mono">MASAR-2026-</code> متبوعة برمز المؤسسة.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 space-y-2.5">
                <button
                  type="submit"
                  disabled={isActivating}
                  className="w-full bg-gradient-to-r from-indigo-900 to-indigo-950 hover:from-indigo-800 hover:to-indigo-900 dark:from-cyan-600 dark:to-cyan-700 dark:hover:from-cyan-500 dark:hover:to-cyan-600 text-white py-3.5 px-4 rounded-xl text-xs sm:text-sm font-black transition-all shadow-md active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isActivating ? (
                    <span>جاري التحقق من الترخيص...</span>
                  ) : (
                    <>
                      <Check size={18} />
                      <span>تفعيل المنظومة الآن</span>
                    </>
                  )}
                </button>

                <a
                  href={whatsAppUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80 py-2.5 px-4 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  <WhatsAppIcon size={16} className="text-emerald-600 dark:text-emerald-400" />
                  <span>طلب رمز التفعيل من المطور عبر واتساب (0927211505)</span>
                  <ExternalLink size={13} className="shrink-0 opacity-70" />
                </a>
              </div>

              {/* Offline Security Footer Notice */}
              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/80 text-center">
                <div className="inline-flex items-center gap-2 text-[11px] text-slate-400 dark:text-slate-500">
                  <ShieldCheck size={14} className="text-emerald-500" />
                  <span>المنظومة تعمل بشكل محلي آمن (Offline-First) والترخيص يُحفظ على هذا الجهاز</span>
                </div>
              </div>

            </form>
          )}
        </div>

      </div>
    </div>
  );
};

export default ActivationScreen;
