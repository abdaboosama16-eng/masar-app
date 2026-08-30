import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

interface ToastContextType {
  toasts: ToastItem[];
  addToast: (toast: Omit<ToastItem, 'id'> | string, type?: ToastType) => void;
  removeToast: (id: string) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((toast: Omit<ToastItem, 'id'> | string, defaultType: ToastType = 'info') => {
    const id = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    let newToast: ToastItem;

    if (typeof toast === 'string') {
      newToast = { id, message: toast, type: defaultType, duration: 3000 };
    } else {
      newToast = { ...toast, id, duration: toast.duration ?? 3000 };
    }

    setToasts((prev) => [...prev, newToast]);

    const timer = setTimeout(() => {
      removeToast(id);
    }, newToast.duration);

    return () => clearTimeout(timer);
  }, [removeToast]);

  const success = useCallback((message: string, title?: string) => {
    addToast({ message, title, type: 'success' });
  }, [addToast]);

  const error = useCallback((message: string, title?: string) => {
    addToast({ message, title, type: 'error', duration: 4000 });
  }, [addToast]);

  const info = useCallback((message: string, title?: string) => {
    addToast({ message, title, type: 'info' });
  }, [addToast]);

  const warning = useCallback((message: string, title?: string) => {
    addToast({ message, title, type: 'warning', duration: 3500 });
  }, [addToast]);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, success, error, info, warning }}>
      {children}
      {/* Toast Notification Container - Modern, Minimalist Floating in Top-Left / Top-Right according to RTL */}
      <div 
        className="fixed top-5 start-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none" 
        dir="rtl"
        aria-live="polite"
      >
        {toasts.map((t) => {
          const isSuccess = t.type === 'success';
          const isError = t.type === 'error';
          const isWarning = t.type === 'warning';

          return (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border shadow-md backdrop-blur-md transition-all duration-300 animate-in fade-in slide-in-from-top-3 ${
                isSuccess
                  ? 'bg-emerald-50/95 dark:bg-emerald-950/80 border-emerald-200 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-100'
                  : isError
                  ? 'bg-rose-50/95 dark:bg-rose-950/80 border-rose-200 dark:border-rose-800/60 text-rose-900 dark:text-rose-100'
                  : isWarning
                  ? 'bg-amber-50/95 dark:bg-amber-950/80 border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-100'
                  : 'bg-white/95 dark:bg-slate-900/90 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100'
              }`}
            >
              <div className="shrink-0 mt-0.5">
                {isSuccess && <CheckCircle2 size={18} className="text-emerald-600 dark:text-emerald-400" />}
                {isError && <AlertCircle size={18} className="text-rose-600 dark:text-rose-400" />}
                {isWarning && <AlertTriangle size={18} className="text-amber-600 dark:text-amber-400" />}
                {!isSuccess && !isError && !isWarning && <Info size={18} className="text-blue-600 dark:text-blue-400" />}
              </div>
              <div className="flex-1 text-xs">
                {t.title && <div className="font-bold mb-0.5">{t.title}</div>}
                <div className="font-medium leading-relaxed">{t.message}</div>
              </div>
              <button
                onClick={() => removeToast(t.id)}
                className="shrink-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded transition-colors"
                aria-label="إغلاق الإشعار"
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
