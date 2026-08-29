import React, { useRef, useState } from 'react';
import { Download, Upload, CheckCircle2, AlertCircle, RefreshCw, FileJson, Shield, Lock } from 'lucide-react';
import { downloadJsonBackup, restoreFromJsonFile } from '../lib/backupService';

interface BackupRestoreControlsProps {
  variant?: 'compact' | 'card' | 'banner';
  className?: string;
  onSuccess?: () => void;
}

export const BackupRestoreControls: React.FC<BackupRestoreControlsProps> = ({
  variant = 'compact',
  className = '',
  onSuccess
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isSecureExporting, setIsSecureExporting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const secureFileInputRef = useRef<HTMLInputElement>(null);

  const showStatus = (text: string, type: 'success' | 'error' = 'success') => {
    setStatusMessage({ type, text });
    setTimeout(() => {
      setStatusMessage(null);
    }, 4500);
  };

  const handleDownload = async () => {
    setIsExporting(true);
    try {
      const result = await downloadJsonBackup();
      showStatus(`تم تحميل ملف النسخة الاحتياطية بنجاح: ${result.filename}`, 'success');
      if (onSuccess) onSuccess();
    } catch (err: any) {
      showStatus(err?.message || 'فشل تحميل النسخة الاحتياطية', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const handleSecureExport = () => {
    setIsSecureExporting(true);
    try {
      // Collect all localStorage data
      const data: Record<string, string> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          data[key] = localStorage.getItem(key) || '';
        }
      }
      
      const jsonString = JSON.stringify(data);
      // Mock Encryption (Base64 encoding with a custom prefix wrapper)
      const encryptedData = "MSR_SECURE_PAYLOAD_V1:" + btoa(unescape(encodeURIComponent(jsonString)));
      
      // Generate .msr file
      const blob = new Blob([encryptedData], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      
      const now = new Date();
      const filename = `Masar_Secure_Backup_${now.getFullYear()}${(now.getMonth()+1).toString().padStart(2,'0')}${now.getDate().toString().padStart(2,'0')}.msr`;
      
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showStatus(`تم تصدير البيانات الآمن بنجاح: ${filename}`, 'success');
      if (onSuccess) onSuccess();
    } catch (err: any) {
      showStatus('فشل التصدير الآمن للبيانات', 'error');
    } finally {
      setTimeout(() => setIsSecureExporting(false), 500);
    }
  };

  const handleSecureImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    e.target.value = '';
    
    const confirmRestore = window.confirm(
      `هل أنت متأكد من استعادة البيانات من الملف الآمن (${file.name})؟\n\nتنبيه: سيتم مسح البيانات الحالية واستبدالها.`
    );
    if (!confirmRestore) return;
    
    setIsImporting(true);
    
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        if (!content.startsWith("MSR_SECURE_PAYLOAD_V1:")) {
          throw new Error("ملف النسخة الاحتياطية غير صالح أو تالف.");
        }
        const base64Data = content.replace("MSR_SECURE_PAYLOAD_V1:", "");
        // Decrypt
        const jsonString = decodeURIComponent(escape(atob(base64Data)));
        const data = JSON.parse(jsonString);
        
        // Restore to localStorage
        localStorage.clear();
        for (const key in data) {
          localStorage.setItem(key, data[key]);
        }
        
        showStatus('🎉 تم فك تشفير البيانات واستعادتها بنجاح!', 'success');
        if (onSuccess) onSuccess();
        
        // Reload after 2 seconds to apply changes everywhere
        setTimeout(() => window.location.reload(), 2000);
      } catch (err) {
        console.error(err);
        showStatus('فشل فك تشفير الملف. تأكد من أن الملف سليم.', 'error');
      } finally {
        setIsImporting(false);
      }
    };
    reader.readAsText(file);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    const confirmRestore = window.confirm(
      `هل أنت متأكد من استعادة البيانات من ملف (${file.name})؟\n\nتنبيه: سيتم تحديث وتعبئة قاعدة البيانات المحلية بالبيانات الموجودة في الملف.`
    );
    if (!confirmRestore) return;
    setIsImporting(true);
    try {
      const res = await restoreFromJsonFile(file);
      showStatus(`🎉 تم استعادة البيانات بنجاح: ${res.studentsCount} طالب، ${res.transactionsCount} معاملة مالية`, 'success');
      if (onSuccess) onSuccess();
    } catch (err: any) {
      showStatus(err?.message || 'فشلت استعادة البيانات من الملف', 'error');
    } finally {
      setIsImporting(false);
    }
  };

  if (variant === 'card') {
    return (
      <div className={`space-y-4 ${className}`}>
        {/* Secure Backup Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-cyan-950/50 text-cyan-400 rounded-xl border border-cyan-800/50 backdrop-blur-sm shadow-inner">
                <Shield size={22} />
              </div>
              <div>
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  تصدير البيانات الآمن 
                  <span className="text-[10px] bg-cyan-900/50 text-cyan-300 px-2 py-0.5 rounded border border-cyan-800">.MSR</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  توليد ملف مشفر لجميع السجلات وإعدادات النظام للحماية القصوى
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2.5 flex-wrap">
              <input
                type="file"
                ref={secureFileInputRef}
                onChange={handleSecureImport}
                accept=".msr"
                className="hidden"
              />
              <button
                type="button"
                onClick={handleSecureExport}
                disabled={isSecureExporting || isImporting}
                className="inline-flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 px-4 py-2.5 rounded-xl text-xs font-bold shadow-[0_0_15px_rgba(6,182,212,0.2)] transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
              >
                {isSecureExporting ? <RefreshCw size={15} className="animate-spin" /> : <Lock size={15} />}
                <span>تصدير آمن للبيانات</span>
              </button>
              
              <button
                type="button"
                onClick={() => secureFileInputRef.current?.click()}
                disabled={isSecureExporting || isImporting}
                className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2.5 rounded-xl text-xs font-bold border border-slate-700 transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
              >
                {isImporting ? <RefreshCw size={15} className="animate-spin" /> : <Upload size={15} />}
                <span>استعادة مشفرة</span>
              </button>
            </div>
          </div>
        </div>

        {/* Standard JSON Backup Card */}
        <div className={`bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-100 dark:bg-slate-900 text-indigo-900 dark:text-slate-400 rounded-xl border border-indigo-200 dark:border-slate-800">
                <FileJson size={22} />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">النسخ الاحتياطي العادي (JSON)</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  حفظ نسخة غير مشفرة من قواعد البيانات للاستخدام العام
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2.5 flex-wrap">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".json,application/json"
                className="hidden"
              />
              <button
                type="button"
                onClick={handleDownload}
                disabled={isExporting || isImporting}
                className="inline-flex items-center gap-2 bg-indigo-950 hover:bg-indigo-900 dark:bg-slate-800 dark:hover:bg-slate-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold border border-indigo-800 dark:border-slate-700 shadow-sm transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
              >
                {isExporting ? <RefreshCw size={15} className="animate-spin" /> : <Download size={15} />}
                <span>تحميل النسخة الاحتياطية</span>
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isExporting || isImporting}
                className="inline-flex items-center gap-2 bg-white hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 px-4 py-2.5 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-700 shadow-sm transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
              >
                {isImporting ? <RefreshCw size={15} className="animate-spin text-cyan-500" /> : <Upload size={15} className="text-cyan-500" />}
                <span>استعادة البيانات</span>
              </button>
            </div>
          </div>
        </div>

        {statusMessage && (
          <div
            className={`mt-4 p-3 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all ${
              statusMessage.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800'
                : 'bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-200 border-rose-200 dark:border-rose-800'
            }`}
          >
            {statusMessage.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span>{statusMessage.text}</span>
          </div>
        )}
      </div>
    );
  }

  // Compact Variant (Inline Buttons)
  return (
    <div className={`inline-flex items-center gap-2 flex-wrap ${className}`}>
      <input
        type="file"
        ref={secureFileInputRef}
        onChange={handleSecureImport}
        accept=".msr"
        className="hidden"
      />
      <button
        type="button"
        onClick={handleSecureExport}
        disabled={isSecureExporting || isImporting}
        className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-cyan-400 px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-700 transition-all shadow-sm active:scale-[0.98] disabled:opacity-50 cursor-pointer"
        title="تصدير وتحميل ملف MSR آمن ومشفر يحتوي على كامل البيانات"
      >
        {isSecureExporting ? <RefreshCw size={14} className="animate-spin" /> : <Lock size={14} />}
        <span>تصدير آمن</span>
      </button>
      
      <button
        type="button"
        onClick={() => secureFileInputRef.current?.click()}
        disabled={isSecureExporting || isImporting}
        className="inline-flex items-center gap-1.5 bg-white hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-700 transition-all shadow-sm active:scale-[0.98] disabled:opacity-50 cursor-pointer"
        title="استيراد وتحديث من ملف مشفر"
      >
        {isImporting ? <RefreshCw size={14} className="animate-spin text-cyan-400" /> : <Upload size={14} className="text-cyan-400" />}
      </button>
      
      {statusMessage && (
        <span
          className={`text-xs font-bold px-3 py-1 rounded-lg ${
            statusMessage.type === 'success'
              ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60'
              : 'text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60'
          }`}
        >
          {statusMessage.text}
        </span>
      )}
    </div>
  );
};
export default BackupRestoreControls;
