import React, { useState } from 'react';
import { ShieldCheck, Lock, Check, AlertCircle } from 'lucide-react';
import { authenticateUser } from '../lib/auth';
import { LocalUser } from '../lib/settings';
import { Modal } from './ui/Modal';
import { Input } from './ui/Input';

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
  description = 'هذا القسم مخصص للإدارة. يرجى إدخال كلمة مرور المدير للمتابعة.'
}) => {
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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
        setPassword('');
        onSuccess(result.user);
        onClose();
      } else {
        setIsLoading(false);
        setErrorMsg('كلمة المرور غير صحيحة! يرجى التأكد من الرمز.');
      }
    }, 200);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="md"
      title={
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-50 dark:bg-cyan-950/60 rounded-xl border border-indigo-100 dark:border-cyan-800/40 text-indigo-700 dark:text-cyan-400">
            <ShieldCheck size={20} />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">{title}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{description}</p>
          </div>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200 text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <AlertCircle size={15} className="text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="space-y-1.5">
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">
              كلمة مرور المدير <span className="text-rose-500">*</span>
            </label>
            <button
              type="button"
              onClick={() => setPassword('admin123')}
              className="text-[11px] text-indigo-600 dark:text-cyan-400 hover:underline font-bold"
            >
              تعبئة الرمز الافتراضي (admin123)
            </button>
          </div>

          <Input
            type="password"
            autoFocus
            required
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (errorMsg) setErrorMsg(null);
            }}
            placeholder="أدخل كلمة المرور..."
            dir="ltr"
            className="text-left font-mono tracking-wider"
          />
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-white/5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            إلغاء
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-cyan-600 dark:hover:bg-cyan-500 shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-all active:scale-[0.98]"
          >
            <Check size={15} />
            <span>{isLoading ? 'جاري التحقق...' : 'تأكيد وإلغاء القفل'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
