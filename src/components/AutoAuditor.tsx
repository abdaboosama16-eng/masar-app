import React, { useState } from 'react';
import { Search, CheckCircle, AlertTriangle, ShieldCheck, FileSearch } from 'lucide-react';
import { Transaction } from '../types';

export const AutoAuditor: React.FC<{ transactions: Transaction[] }> = ({ transactions }) => {
  const [status, setStatus] = useState<'idle' | 'running' | 'success' | 'warning'>('idle');
  const [details, setDetails] = useState<string>('');

  const runAudit = () => {
    setStatus('running');
    setDetails('');
    
    // Mock the auditing process
    setTimeout(() => {
      // Logic for demonstration: Let's assume we check transaction receipt numbers
      // A warning will occasionally show up for "missing sequence 104"
      const isPerfect = Math.random() > 0.3; // 70% chance of success
      
      if (isPerfect) {
        setStatus('success');
        setDetails('مطابقة بنسبة 100% بين الأرصدة الرقمية والسجلات.');
      } else {
        setStatus('warning');
        setDetails('تم اكتشاف تسلسل مفقود في الإيصال رقم 104.');
      }
    }, 2500);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-[20px] p-6 shadow-sm flex flex-col justify-between relative overflow-hidden group">
      {/* Glassmorphism gradient effect */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none group-hover:bg-indigo-500/10 transition-colors"></div>
      
      <div className="relative z-10 flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
            <FileSearch size={22} />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900">المدقق المالي الآلي</h3>
            <p className="text-xs text-slate-500 mt-1">فحص المطابقة بين الإيصالات المطبوعة والسجلات</p>
          </div>
        </div>
      </div>

      <div className="relative z-10 flex-1 flex flex-col justify-center">
        {status === 'idle' && (
          <p className="text-xs text-slate-400 text-center py-4">اضغط لتشغيل الفحص الآلي</p>
        )}
        {status === 'running' && (
          <div className="flex flex-col items-center justify-center py-4 space-y-3">
            <Search className="animate-pulse text-indigo-400" size={24} />
            <p className="text-xs font-bold text-indigo-600">جاري مطابقة الأرقام المتسلسلة...</p>
          </div>
        )}
        {status === 'success' && (
          <div className="flex flex-col items-center justify-center py-4 space-y-2 bg-green-50 rounded-xl border border-green-100">
            <CheckCircle className="text-green-600" size={24} />
            <p className="text-xs font-bold text-green-700">{details}</p>
          </div>
        )}
        {status === 'warning' && (
          <div className="flex flex-col items-center justify-center py-4 space-y-2 bg-red-50 rounded-xl border border-red-100">
            <AlertTriangle className="text-red-600" size={24} />
            <p className="text-xs font-bold text-red-700">{details}</p>
          </div>
        )}
      </div>

      <button 
        onClick={runAudit}
        disabled={status === 'running'}
        className="mt-4 w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-3 rounded-xl transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-2 relative z-10"
      >
        <ShieldCheck size={16} />
        {status === 'running' ? 'جاري الفحص...' : 'تشغيل الفحص الآلي'}
      </button>
    </div>
  );
};
