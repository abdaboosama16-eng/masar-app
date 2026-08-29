import React, { useState } from 'react';
import { X, Check, Shield, Zap, Sparkles, Building2, Crown, Cpu, Camera, Lock, Fingerprint, Printer, MessageCircle, Database, Network } from 'lucide-react';
import { useSchoolSettings } from '../lib/settings';

interface UpgradeModalProps {
  onClose: () => void;
}

const UpgradeModal: React.FC<UpgradeModalProps> = ({ onClose }) => {
  const { settings, updateSettings } = useSchoolSettings();
  const [isUpgrading, setIsUpgrading] = useState(false);
  
  // State for Feature Flags (Tied to the global settings for actual functionality, but allows local toggle for demo)
  const [currentPlan, setCurrentPlan] = useState<'pro' | 'enterprise'>(settings.subscriptionPlan || 'pro');

  const handleUpgrade = () => {
    setIsUpgrading(true);
    // محاكاة الاتصال بالسيرفر لإتمام عملية الترقية
    setTimeout(() => {
      updateSettings({ subscriptionPlan: 'enterprise' });
      setCurrentPlan('enterprise');
      setIsUpgrading(false);
    }, 1500);
  };

  // ----------------------------------------------------------------------
  // دالة ومكون (Feature Flags Demo) لتوضيح آلية إخفاء/إظهار الميزات
  // ----------------------------------------------------------------------
  const FeatureFlagDemo = () => (
    <div className="mt-2 mb-10 p-6 md:p-8 bg-white/60 backdrop-blur-md rounded-[24px] border border-slate-200/60 shadow-sm relative overflow-hidden">
      <div className="absolute -right-10 -top-10 w-40 h-40 bg-blue-100/40 rounded-full blur-3xl -z-10"></div>
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-200/50">
        <div>
          <h3 className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
            <Cpu size={20} className="text-indigo-500" />
            تجربة تفاعلية: بوابات الصلاحيات (Feature Flags)
          </h3>
          <p className="text-sm text-slate-500 mt-1.5 font-medium leading-relaxed">
            توضح هذه اللوحة كيف يتم حجب أو إتاحة الميزات للمستخدم فورياً بناءً على متغير <code className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-xs mx-1 font-mono">currentPlan</code>
          </p>
        </div>
        
        {/* Toggle Buttons (For Demo Purposes) */}
        <div className="flex bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200/60 self-start sm:self-auto shrink-0">
          <button 
            onClick={() => setCurrentPlan('pro')}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${currentPlan === 'pro' ? 'bg-white text-blue-700 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-700'}`}
          >
            مسار برو
          </button>
          <button 
            onClick={() => setCurrentPlan('enterprise')}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${currentPlan === 'enterprise' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
          >
            إنتربرايز
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-4">
        {/* ميزة قياسية - تظهر دائماً */}
        <button className="flex items-center gap-2.5 px-6 py-3.5 bg-white border border-slate-200 rounded-2xl text-slate-700 font-bold text-sm hover:bg-slate-50 transition-all shadow-sm">
          <Printer size={18} className="text-blue-500" />
          <span>طباعة إيصال مالي</span>
        </button>

        {/* ميزة متقدمة - مقفلة في برو، مفتوحة في إنتربرايز */}
        {currentPlan === 'enterprise' ? (
          <button className="flex items-center gap-2.5 px-6 py-3.5 bg-indigo-50 border border-indigo-200 rounded-2xl text-indigo-700 font-bold text-sm hover:bg-indigo-100 transition-all shadow-sm animate-in zoom-in duration-300">
            <Camera size={18} className="text-indigo-600" />
            <span>الماسح الضوئي (OCR)</span>
          </button>
        ) : (
          <button disabled className="flex items-center gap-2.5 px-6 py-3.5 bg-slate-50/50 border border-slate-200 rounded-2xl text-slate-400 font-bold text-sm cursor-not-allowed border-dashed transition-all">
            <Lock size={16} className="text-slate-300" />
            <span>الماسح الضوئي (OCR)</span>
          </button>
        )}

        {/* ميزة متقدمة - مقفلة في برو، مفتوحة في إنتربرايز */}
        {currentPlan === 'enterprise' ? (
          <button className="flex items-center gap-2.5 px-6 py-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-700 font-bold text-sm hover:bg-emerald-100 transition-all shadow-sm animate-in zoom-in duration-300">
            <Fingerprint size={18} className="text-emerald-600" />
            <span>الحضور اللامرئي (RFID)</span>
          </button>
        ) : (
          <button disabled className="flex items-center gap-2.5 px-6 py-3.5 bg-slate-50/50 border border-slate-200 rounded-2xl text-slate-400 font-bold text-sm cursor-not-allowed border-dashed transition-all">
            <Lock size={16} className="text-slate-300" />
            <span>الحضور اللامرئي (RFID)</span>
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6" dir="rtl">
      {/* Blurred Backdrop - Glassmorphism */}
      <div 
        className="absolute inset-0 bg-slate-900/30 backdrop-blur-md transition-opacity"
        onClick={onClose}
      ></div>

      {/* Modal Content */}
      <div className="relative w-full max-w-6xl bg-slate-50/95 backdrop-blur-2xl rounded-[32px] border border-white/60 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] overflow-hidden flex flex-col max-h-[95vh] animate-in fade-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="relative px-8 py-10 text-center overflow-hidden border-b border-white/50 bg-white/40">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-lg h-40 bg-indigo-100/40 rounded-full blur-3xl -z-10"></div>
          
          <button 
            onClick={onClose}
            className="absolute top-6 left-6 p-2.5 bg-white/80 text-slate-500 rounded-full hover:bg-white hover:text-slate-800 transition-colors shadow-sm border border-slate-100"
          >
            <X size={20} />
          </button>
          
          <div className="inline-flex items-center justify-center p-4 bg-gradient-to-br from-indigo-50 to-blue-50 text-indigo-600 rounded-3xl mb-5 border border-indigo-100/50 shadow-sm">
            <Crown size={32} strokeWidth={1.5} />
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight mb-4">
            باقات منظومة مسار
          </h2>
          <p className="text-sm md:text-base text-slate-500 max-w-xl mx-auto font-medium leading-relaxed">
            اكتشف الميزات المتقدمة وقم بترقية باقتك للوصول إلى أدوات الأتمتة الكاملة وإدارة مؤسستك التعليمية بذكاء وكفاءة.
          </p>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 md:p-10">
          
          {/* Feature Flags Demo Component */}
          <FeatureFlagDemo />

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
            
            {/* Pro Plan Card */}
            <div className={`relative flex flex-col bg-white rounded-[32px] p-8 md:p-10 border ${currentPlan === 'pro' ? 'border-blue-300 ring-4 ring-blue-50' : 'border-slate-200'} transition-all shadow-sm`}>
              {currentPlan === 'pro' && (
                <div className="absolute -top-3 right-8 bg-blue-600 text-white text-[11px] font-bold px-4 py-1.5 rounded-full uppercase tracking-wider shadow-sm">
                  الباقة النشطة
                </div>
              )}
              <div className="mb-8 border-b border-slate-100 pb-8">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3.5 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100">
                    <Building2 size={26} strokeWidth={2} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-900">مسار برو</h3>
                    <p className="text-slate-500 text-sm font-medium mt-1">مثالية للمدارس والمراكز الناشئة</p>
                  </div>
                </div>
              </div>

              <div className="flex-1 space-y-6 mb-10">
                <div className="flex items-start gap-4">
                  <div className="p-1.5 bg-blue-50 text-blue-500 rounded-xl mt-0.5 shrink-0">
                    <Check size={16} strokeWidth={3} />
                  </div>
                  <span className="text-slate-700 text-sm font-bold">
                    <span className="block text-slate-900 text-base mb-1">العمل بدون إنترنت</span>
                    <span className="text-slate-500 font-medium text-xs leading-relaxed">حفظ البيانات محلياً (LocalStorage) بأمان لضمان استمرار العمل دون انقطاع</span>
                  </span>
                </div>
                <div className="flex items-start gap-4">
                  <div className="p-1.5 bg-blue-50 text-blue-500 rounded-xl mt-0.5 shrink-0">
                    <Check size={16} strokeWidth={3} />
                  </div>
                  <span className="text-slate-700 text-sm font-bold">
                    <span className="block text-slate-900 text-base mb-1">الطباعة الأساسية</span>
                    <span className="text-slate-500 font-medium text-xs leading-relaxed">دعم طباعة حتى 3 قوالب مختلفة للإيصالات المالية والسندات</span>
                  </span>
                </div>
                <div className="flex items-start gap-4">
                  <div className="p-1.5 bg-blue-50 text-blue-500 rounded-xl mt-0.5 shrink-0">
                    <Check size={16} strokeWidth={3} />
                  </div>
                  <span className="text-slate-700 text-sm font-bold">
                    <span className="block text-slate-900 text-base mb-1">تنبيهات أولياء الأمور</span>
                    <span className="text-slate-500 font-medium text-xs leading-relaxed">إرسال إشعارات وتنبيهات واتساب الأساسية عبر الروابط المباشرة</span>
                  </span>
                </div>
              </div>

              <button 
                disabled={currentPlan === 'pro'}
                className={`w-full py-4.5 rounded-2xl text-sm font-bold transition-all ${
                  currentPlan === 'pro' 
                    ? 'bg-slate-50 text-slate-400 cursor-not-allowed border border-slate-100'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-blue-600 shadow-sm'
                }`}
              >
                {currentPlan === 'pro' ? 'الباقة مفعلة لديك' : 'العودة لباقة برو'}
              </button>
            </div>

            {/* Enterprise Plan Card - Highlighted */}
            <div className={`relative flex flex-col bg-indigo-50/80 backdrop-blur-sm rounded-[32px] p-8 md:p-10 border ${currentPlan === 'enterprise' ? 'border-indigo-400 ring-4 ring-indigo-100' : 'border-indigo-200'} transition-all shadow-xl shadow-indigo-100/50`}>
              {currentPlan === 'enterprise' && (
                <div className="absolute -top-3 right-8 bg-indigo-600 text-white text-[11px] font-bold px-4 py-1.5 rounded-full uppercase tracking-wider shadow-md">
                  الباقة النشطة
                </div>
              )}
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-200/30 rounded-full blur-3xl -mr-20 -mt-20 -z-10"></div>
              
              <div className="mb-8 border-b border-indigo-200/60 pb-8">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3.5 bg-white text-indigo-600 rounded-2xl border border-indigo-100 shadow-sm">
                    <Sparkles size={26} strokeWidth={2} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-indigo-950">مسار إنتربرايز</h3>
                    <p className="text-indigo-600/80 text-sm font-medium mt-1">الميزات المتقدمة للمؤسسات التعليمية الكبرى</p>
                  </div>
                </div>
              </div>

              <div className="flex-1 space-y-6 mb-10">
                <div className="flex items-start gap-4">
                  <div className="p-1.5 bg-indigo-600 text-white rounded-xl mt-0.5 shrink-0 shadow-sm shadow-indigo-200">
                    <Check size={16} strokeWidth={3} />
                  </div>
                  <span className="text-slate-700 text-sm font-bold">
                    <span className="block text-indigo-950 text-base mb-1">كل ميزات باقة برو</span>
                    <span className="text-indigo-700/70 font-medium text-xs leading-relaxed">بالإضافة إلى جميع التحديثات والدعم الفني ذو الأولوية القصوى</span>
                  </span>
                </div>
                <div className="flex items-start gap-4">
                  <div className="p-1.5 bg-indigo-600 text-white rounded-xl mt-0.5 shrink-0 shadow-sm shadow-indigo-200">
                    <Fingerprint size={16} strokeWidth={2.5} />
                  </div>
                  <span className="text-slate-700 text-sm font-bold">
                    <span className="block text-indigo-950 text-base mb-1">الحضور اللامرئي (RFID)</span>
                    <span className="text-indigo-700/70 font-medium text-xs leading-relaxed">تسجيل الحضور والانصراف الآلي وربط البوابات الذكية دون تدخل بشري</span>
                  </span>
                </div>
                <div className="flex items-start gap-4">
                  <div className="p-1.5 bg-indigo-600 text-white rounded-xl mt-0.5 shrink-0 shadow-sm shadow-indigo-200">
                    <Camera size={16} strokeWidth={2.5} />
                  </div>
                  <span className="text-slate-700 text-sm font-bold">
                    <span className="block text-indigo-950 text-base mb-1">الإدخال بالكاميرا (OCR)</span>
                    <span className="text-indigo-700/70 font-medium text-xs leading-relaxed">قراءة المستندات الرسمية واستيراد بيانات الطلاب فورياً عبر الكاميرا</span>
                  </span>
                </div>
                <div className="flex items-start gap-4">
                  <div className="p-1.5 bg-indigo-600 text-white rounded-xl mt-0.5 shrink-0 shadow-sm shadow-indigo-200">
                    <Network size={16} strokeWidth={2.5} />
                  </div>
                  <span className="text-slate-700 text-sm font-bold">
                    <span className="block text-indigo-950 text-base mb-1">المزامنة الشبكية (P2P)</span>
                    <span className="text-indigo-700/70 font-medium text-xs leading-relaxed">ربط عدة أجهزة على الشبكة المحلية ونقل البيانات فورياً بين الأقسام</span>
                  </span>
                </div>
              </div>

              <button 
                onClick={handleUpgrade}
                disabled={currentPlan === 'enterprise' || isUpgrading}
                className={`w-full py-4.5 rounded-2xl text-sm font-bold transition-all flex items-center justify-center gap-2.5 ${
                  currentPlan === 'enterprise'
                    ? 'bg-indigo-100 text-indigo-400 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 hover:shadow-xl active:scale-[0.98]'
                }`}
              >
                {isUpgrading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : currentPlan === 'enterprise' ? (
                  'الباقة مفعلة لديك'
                ) : (
                  <>
                    <Zap size={18} className="text-amber-300" />
                    <span className="text-base">طلب الترقية لإنتربرايز</span>
                  </>
                )}
              </button>
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpgradeModal;
