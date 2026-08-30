import React, { useState } from 'react';
import { Check, Zap, Sparkles, Building2, Crown, Cpu, Camera, Lock, Fingerprint, Printer, Network } from 'lucide-react';
import { useSchoolSettings } from '../lib/settings';
import { Modal } from './ui/Modal';

interface UpgradeModalProps {
  onClose: () => void;
}

const UpgradeModal: React.FC<UpgradeModalProps> = ({ onClose }) => {
  const { settings, updateSettings } = useSchoolSettings();
  const [isUpgrading, setIsUpgrading] = useState(false);
  
  // State for Feature Flags
  const [currentPlan, setCurrentPlan] = useState<'pro' | 'enterprise'>(settings.subscriptionPlan || 'pro');

  const handleUpgrade = () => {
    setIsUpgrading(true);
    setTimeout(() => {
      updateSettings({ subscriptionPlan: 'enterprise' });
      setCurrentPlan('enterprise');
      setIsUpgrading(false);
    }, 1200);
  };

  // Feature Flags Demo
  const FeatureFlagDemo = () => (
    <div className="p-5 md:p-6 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/80 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-4 border-b border-slate-200 dark:border-slate-700/50">
        <div>
          <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Cpu size={16} className="text-indigo-600 dark:text-indigo-400" />
            <span>بوابات الصلاحيات والميزات (Feature Flags)</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
            توضح هذه اللوحة حجب أو إتاحة الميزات في المنظومة فورياً بناءً على الخطة النشطة
          </p>
        </div>
        
        {/* Toggle Buttons */}
        <div className="flex bg-slate-200 dark:bg-slate-900/80 p-1 rounded-xl self-start sm:self-auto shrink-0 border border-slate-300 dark:border-slate-700">
          <button 
            type="button"
            onClick={() => setCurrentPlan('pro')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${currentPlan === 'pro' ? 'bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
          >
            مسار برو
          </button>
          <button 
            type="button"
            onClick={() => setCurrentPlan('enterprise')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${currentPlan === 'enterprise' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
          >
            إنتربرايز
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        {/* Basic feature */}
        <div className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 font-bold text-xs shadow-sm">
          <Printer size={16} className="text-indigo-500" />
          <span>طباعة إيصال مالي</span>
        </div>

        {/* OCR Feature */}
        {currentPlan === 'enterprise' ? (
          <div className="flex items-center gap-2 px-4 py-2.5 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded-xl text-indigo-700 dark:text-indigo-300 font-bold text-xs shadow-sm">
            <Camera size={16} className="text-indigo-600 dark:text-indigo-400" />
            <span>الماسح الضوئي (OCR)</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 rounded-xl text-slate-400 font-bold text-xs">
            <Lock size={14} className="text-slate-400" />
            <span>الماسح الضوئي (OCR)</span>
          </div>
        )}

        {/* RFID Feature */}
        {currentPlan === 'enterprise' ? (
          <div className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-700 dark:text-emerald-300 font-bold text-xs shadow-sm">
            <Fingerprint size={16} className="text-emerald-600 dark:text-emerald-400" />
            <span>الحضور الآلي (RFID)</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 rounded-xl text-slate-400 font-bold text-xs">
            <Lock size={14} className="text-slate-400" />
            <span>الحضور الآلي (RFID)</span>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      maxWidth="5xl"
      title="باقات واشتراكات منظومة مسار"
    >
      <div className="space-y-6">
        {/* Feature Flags Demo Component */}
        <FeatureFlagDemo />

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Pro Plan Card */}
          <div className={`relative flex flex-col bg-white dark:bg-slate-800 rounded-2xl p-6 border ${currentPlan === 'pro' ? 'border-indigo-400 ring-2 ring-indigo-100 dark:ring-indigo-900/30' : 'border-slate-200 dark:border-slate-700'} shadow-sm`}>
            {currentPlan === 'pro' && (
              <div className="absolute -top-3 right-6 bg-indigo-600 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                الباقة النشطة
              </div>
            )}
            <div className="mb-6 border-b border-slate-100 dark:border-slate-700/60 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl border border-indigo-100 dark:border-indigo-900">
                  <Building2 size={22} strokeWidth={2} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">مسار برو</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-xs font-medium mt-0.5">مثالية للمدارس والمراكز الناشئة</p>
                </div>
              </div>
            </div>

            <div className="flex-1 space-y-4 mb-6">
              <div className="flex items-start gap-3">
                <div className="p-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 rounded-lg mt-0.5 shrink-0">
                  <Check size={14} strokeWidth={3} />
                </div>
                <span className="text-slate-700 dark:text-slate-300 text-xs font-bold">
                  <span className="block text-slate-900 dark:text-slate-100 font-bold mb-0.5">العمل دون اتصال بالإنترنت</span>
                  <span className="text-slate-500 dark:text-slate-400 font-medium text-[11px] leading-relaxed">حفظ البيانات محلياً (Offline-First) بأمان لضمان استمرار العمل</span>
                </span>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 rounded-lg mt-0.5 shrink-0">
                  <Check size={14} strokeWidth={3} />
                </div>
                <span className="text-slate-700 dark:text-slate-300 text-xs font-bold">
                  <span className="block text-slate-900 dark:text-slate-100 font-bold mb-0.5">الطباعة وسندات القبض</span>
                  <span className="text-slate-500 dark:text-slate-400 font-medium text-[11px] leading-relaxed">طباعة الإيصالات المالية وسندات القبض الحراري وA4</span>
                </span>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 rounded-lg mt-0.5 shrink-0">
                  <Check size={14} strokeWidth={3} />
                </div>
                <span className="text-slate-700 dark:text-slate-300 text-xs font-bold">
                  <span className="block text-slate-900 dark:text-slate-100 font-bold mb-0.5">تنبيهات أولياء الأمور</span>
                  <span className="text-slate-500 dark:text-slate-400 font-medium text-[11px] leading-relaxed">إرسال إشعارات ومطالبات واتساب الأساسية عبر الروابط المباشرة</span>
                </span>
              </div>
            </div>

            <button 
              type="button"
              disabled={currentPlan === 'pro'}
              className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                currentPlan === 'pro' 
                  ? 'bg-slate-100 dark:bg-slate-700/50 text-slate-400 cursor-not-allowed border border-slate-200 dark:border-slate-700'
                  : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              {currentPlan === 'pro' ? 'الباقة مفعلة حالياً' : 'العودة لباقة برو'}
            </button>
          </div>

          {/* Enterprise Plan Card */}
          <div className={`relative flex flex-col bg-slate-50 dark:bg-slate-800/80 rounded-2xl p-6 border ${currentPlan === 'enterprise' ? 'border-indigo-500 ring-2 ring-indigo-200 dark:ring-indigo-900/40' : 'border-indigo-200 dark:border-indigo-800'} shadow-sm`}>
            {currentPlan === 'enterprise' && (
              <div className="absolute -top-3 right-6 bg-indigo-600 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                الباقة النشطة
              </div>
            )}
            
            <div className="mb-6 border-b border-indigo-100 dark:border-slate-700/60 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-indigo-600 text-white rounded-xl shadow-sm">
                  <Sparkles size={22} strokeWidth={2} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">مسار إنتربرايز</h3>
                  <p className="text-indigo-600 dark:text-indigo-400 text-xs font-medium mt-0.5">الميزات المتقدمة للمؤسسات التعليمية الكبرى</p>
                </div>
              </div>
            </div>

            <div className="flex-1 space-y-4 mb-6">
              <div className="flex items-start gap-3">
                <div className="p-1 bg-indigo-600 text-white rounded-lg mt-0.5 shrink-0">
                  <Check size={14} strokeWidth={3} />
                </div>
                <span className="text-slate-700 dark:text-slate-300 text-xs font-bold">
                  <span className="block text-slate-900 dark:text-slate-100 font-bold mb-0.5">كل ميزات باقة برو</span>
                  <span className="text-slate-500 dark:text-slate-400 font-medium text-[11px] leading-relaxed">بالإضافة إلى التحديثات والدعم الفني ذو الأولوية القصوى</span>
                </span>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-1 bg-indigo-600 text-white rounded-lg mt-0.5 shrink-0">
                  <Fingerprint size={14} strokeWidth={2.5} />
                </div>
                <span className="text-slate-700 dark:text-slate-300 text-xs font-bold">
                  <span className="block text-slate-900 dark:text-slate-100 font-bold mb-0.5">الحضور الآلي (RFID)</span>
                  <span className="text-slate-500 dark:text-slate-400 font-medium text-[11px] leading-relaxed">تسجيل الحضور والانصراف الآلي وربط البوابات الذكية</span>
                </span>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-1 bg-indigo-600 text-white rounded-lg mt-0.5 shrink-0">
                  <Camera size={14} strokeWidth={2.5} />
                </div>
                <span className="text-slate-700 dark:text-slate-300 text-xs font-bold">
                  <span className="block text-slate-900 dark:text-slate-100 font-bold mb-0.5">الإدخال بالكاميرا (OCR)</span>
                  <span className="text-slate-500 dark:text-slate-400 font-medium text-[11px] leading-relaxed">استيراد بيانات الطلاب من بطاقات الهوية الرسمية</span>
                </span>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-1 bg-indigo-600 text-white rounded-lg mt-0.5 shrink-0">
                  <Network size={14} strokeWidth={2.5} />
                </div>
                <span className="text-slate-700 dark:text-slate-300 text-xs font-bold">
                  <span className="block text-slate-900 dark:text-slate-100 font-bold mb-0.5">المزامنة الشبكية (P2P)</span>
                  <span className="text-slate-500 dark:text-slate-400 font-medium text-[11px] leading-relaxed">ربط عدة أجهزة على الشبكة المحلية ونقل البيانات فورياً</span>
                </span>
              </div>
            </div>

            <button 
              type="button"
              onClick={handleUpgrade}
              disabled={currentPlan === 'enterprise' || isUpgrading}
              className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                currentPlan === 'enterprise'
                  ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-400 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm active:scale-[0.98]'
              }`}
            >
              {isUpgrading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : currentPlan === 'enterprise' ? (
                'الباقة مفعلة لديك'
              ) : (
                <>
                  <Zap size={15} className="text-amber-300" />
                  <span>ترقية إلى إنتربرايز</span>
                </>
              )}
            </button>
          </div>
          
        </div>
      </div>
    </Modal>
  );
};

export default UpgradeModal;
