import React, { useState } from 'react';
import { ShieldCheck, Lock, X, Check, AlertCircle, Sparkles } from 'lucide-react';
import { authenticateUser } from '../lib/auth';
import { LocalUser } from '../lib/settings';

interface AdminUnlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (adminUser: LocalUser) => void;
  title?: string;
  description?: string;
}

export const AdminUnlockModal: React.FC<AdminUnlockModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  title = 'مطلوب صلاحية مدير النظام',
  description = 'هذا القسم مخصص للإدارة. يرجى إدخال كلمة مرور المدير (admin123) للمتابعة.'
}) => {
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!password.trim()) {
      setErrorMsg('يرجى إدخال كلمة مرور المدير');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      const result = authenticateUser('admin', password);

      if (result.success && result.user && result.user.role === 'admin') {
        setIsLoading(false);
        onSuccess(result.user);
        onClose();
      } else {
        setIsLoading(false);
        setErrorMsg('كلمة المرور غير صحيحة! يرجى التأكد من الرمز.');
      }
    }, 200);
  };

  return (
    <div className="fixed inset-0 z-[120] bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 select-none animate-in fade-in duration-200" dir="rtl">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-900 to-slate-900 text-white p-5 flex items-center justify-between border-b border-indigo-800/40">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 dark:bg-cyan-950/60 rounded-xl border border-white/20 dark:border-cyan-500/40">
              <ShieldCheck size={20} className="text-cyan-400" />
            </div>
            <div>
              <h3 className="text-sm font-black">{title}</h3>
              <p className="text-[10px] text-indigo-200/70">{description}</p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200 text-xs font-bold flex items-center gap-2">
              <AlertCircle size={15} className="text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-black text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Lock size={13} className="text-indigo-600 dark:text-cyan-400" />
                <span>كلمة مرور المدير *</span>
              </label>
              <button
                type="button"
                onClick={() => setPassword('admin123')}
                className="text-[11px] text-indigo-600 dark:text-cyan-400 hover:underline font-bold"
              >
                تعبئة الرمز الافتراضي (admin123)
              </button>
            </div>

            <input
              type="password"
              autoFocus
              required
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errorMsg) setErrorMsg(null);
              }}
              placeholder="أدخل كلمة المرور..."
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs font-black text-slate-900 dark:text-white outline-none focus:border-indigo-600 dark:focus:border-cyan-400 transition-all text-left shadow-inner"
              dir="ltr"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2 rounded-xl text-xs font-black text-white bg-indigo-950 hover:bg-indigo-900 dark:bg-cyan-600 dark:hover:bg-cyan-500 shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Check size={15} />
              <span>{isLoading ? 'جاري التحقق...' : 'تأكيد وإلغاء القفل'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
