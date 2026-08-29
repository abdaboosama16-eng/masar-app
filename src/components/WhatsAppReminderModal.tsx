import { useState, useEffect } from 'react';
import { MessageCircle, X, Send, Copy, Check, Phone, User, AlertCircle, RefreshCw, Landmark, Sparkles } from 'lucide-react';
import { Student } from '../types';
import { useSchoolSettings, DEFAULT_WHATSAPP_TEMPLATE } from '../lib/settings';
import { renderWhatsAppTemplate, formatLibyanPhoneNumber } from '../lib/utils';

interface WhatsAppReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
  remainingAmount?: number;
  onSuccess?: () => void;
}

export default function WhatsAppReminderModal({
  isOpen,
  onClose,
  student,
  remainingAmount,
  onSuccess
}: WhatsAppReminderModalProps) {
  const { settings } = useSchoolSettings();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [messageText, setMessageText] = useState('');
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const finalRemaining = student
    ? (remainingAmount !== undefined ? remainingAmount : (student.final_fees - (student.total_paid || 0)))
    : 0;

  // Generate dynamic message from Settings Template whenever student or settings change
  const generateTemplateMessage = (st: Student, amount: number) => {
    const rawTemplate = settings.whatsappTemplate || DEFAULT_WHATSAPP_TEMPLATE;
    return renderWhatsAppTemplate(rawTemplate, {
      studentName: st.name,
      amount: amount,
      schoolName: settings.schoolName || 'المؤسسة التعليمية',
      currency: settings.currency || 'د.ل',
      grade: st.grade || '',
      dueDate: new Date().toLocaleDateString('ar-LY', { year: 'numeric', month: 'numeric', day: 'numeric' })
    });
  };

  useEffect(() => {
    if (student && isOpen) {
      const initialPhone = student.father_phone || student.mother_phone || '';
      setPhoneNumber(initialPhone);
      setMessageText(generateTemplateMessage(student, finalRemaining));
      setCopied(false);
      setErrorMsg(null);
    }
  }, [student, isOpen, settings.whatsappTemplate, settings.schoolName, settings.currency]);

  if (!isOpen || !student) return null;

  const handleResetToTemplate = () => {
    setMessageText(generateTemplateMessage(student, finalRemaining));
    setErrorMsg(null);
  };

  const handleSendWhatsApp = () => {
    setErrorMsg(null);
    const cleanPhone = phoneNumber.trim();

    if (!cleanPhone) {
      setErrorMsg('الرجاء إدخال رقم هاتف ولي الأمر (مثال: 0912345678 أو 218912345678)');
      return;
    }

    const formattedPhone = formatLibyanPhoneNumber(cleanPhone);
    if (!formattedPhone || formattedPhone.length < 8) {
      setErrorMsg('رقم الهاتف المدخل غير صالح، يرجى التأكد من كتابة الرقم بشكل صحيح');
      return;
    }

    const encodedText = encodeURIComponent(messageText);
    const waUrl = `https://wa.me/${formattedPhone}?text=${encodedText}`;

    // Open WhatsApp in a new tab/app window
    window.open(waUrl, '_blank', 'noopener,noreferrer');
    
    if (onSuccess) {
      onSuccess();
    }
    onClose();
  };

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(messageText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Failed to copy message:', err);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 dark:bg-slate-950/85 flex items-center justify-center z-[120] p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-emerald-50/60 dark:bg-emerald-950/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20 shrink-0">
              <MessageCircle size={22} />
            </div>
            <div>
              <h2 className="font-extrabold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>تذكير بمستحقات الأقساط (واتساب)</span>
              </h2>
              <p className="text-xs text-emerald-800 dark:text-emerald-300 font-medium">
                توليد رسالة مخصصة تلقائياً بقالب المؤسسة
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4.5 custom-scrollbar text-start">
          
          {/* Student Overview Card */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-cyan-950 text-blue-700 dark:text-cyan-400 flex items-center justify-center font-bold text-xs">
                <User size={18} />
              </div>
              <div>
                <h4 className="font-black text-sm text-slate-900 dark:text-slate-100">{student.name}</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  المرحلة: <strong className="text-slate-700 dark:text-slate-300">{student.grade || 'غير محدد'}</strong>
                </p>
              </div>
            </div>

            <div className="text-end">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold block">المبلغ المتبقي:</span>
              <span className="text-base font-black text-rose-600 dark:text-rose-400">
                {finalRemaining.toLocaleString()} {settings.currency || 'د.ل'}
              </span>
            </div>
          </div>

          {/* Phone Number Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Phone size={14} className="text-emerald-600" />
              <span>رقم هاتف ولي الأمر (واتساب)</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={phoneNumber}
                onChange={(e) => {
                  setPhoneNumber(e.target.value);
                  setErrorMsg(null);
                }}
                placeholder="أدخل رقم الهاتف مثلاً: 0912345678"
                dir="ltr"
                className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-2xl px-4 py-2.5 text-slate-900 dark:text-slate-100 font-mono font-bold text-sm outline-none focus:border-emerald-500 dark:focus:border-emerald-400 transition-colors shadow-inner"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold">
                ليبيا (218+)
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              * يتم تحويل الرقم تلقائياً للصيغة الدولية المناسبة لواتساب عند الإرسال.
            </p>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Message Content with Live Preview */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Sparkles size={14} className="text-amber-500" />
                <span>نص الرسالة المجهز للإرسال</span>
              </label>
              <button
                type="button"
                onClick={handleResetToTemplate}
                className="text-[11px] font-bold text-indigo-600 dark:text-cyan-400 hover:underline flex items-center gap-1"
                title="استعادة نص القالب الافتراضي المحدد في الإعدادات"
              >
                <RefreshCw size={11} />
                <span>إعادة تعيين للقالب</span>
              </button>
            </div>

            <textarea
              rows={6}
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-2xl p-3.5 text-slate-900 dark:text-slate-100 text-xs leading-relaxed outline-none focus:border-emerald-500 dark:focus:border-emerald-400 transition-colors resize-none shadow-inner"
              placeholder="نص رسالة التذكير..."
            />
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
              * تم استبدال الكلمات المفتاحية ({'{studentName}'}, {'{amount}'}, {'{schoolName}'}) تلقائياً. يمكنك تخصيص النص قبل الإرسال.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900 flex flex-col sm:flex-row items-center gap-2.5">
          <button
            type="button"
            onClick={handleCopyText}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
          >
            {copied ? (
              <>
                <Check size={15} className="text-emerald-600" />
                <span>تم النسخ!</span>
              </>
            ) : (
              <>
                <Copy size={15} />
                <span>نسخ النص</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 text-xs font-bold transition-colors"
          >
            إلغاء
          </button>

          <button
            type="button"
            onClick={handleSendWhatsApp}
            className="w-full sm:flex-1 py-2.5 px-5 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white rounded-xl text-xs font-black transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2"
          >
            <Send size={15} className="shrink-0" />
            <span>إرسال عبر واتساب الآن</span>
          </button>
        </div>
      </div>
    </div>
  );
}
