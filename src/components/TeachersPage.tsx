import { useEffect, useState } from 'react';
import { Calculator, Camera, Check, Clock, CheckCircle2, BookOpen, GraduationCap, Plus, DollarSign, X, Fingerprint } from 'lucide-react';
import { Teacher } from '../types';
import { syncService } from '../lib/syncService';
import { useSchoolSettings } from '../lib/settings';

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSalaryModal, setShowSalaryModal] = useState<Teacher | null>(null);
  const { settings } = useSchoolSettings();

  useEffect(() => {
    fetchTeachers();

    const handleDataChanged = () => {
      fetchTeachers();
    };
    window.addEventListener('appDataChanged', handleDataChanged);
    return () => window.removeEventListener('appDataChanged', handleDataChanged);
  }, []);

  const fetchTeachers = async () => {
    try {
      const list = await syncService.getTeachers();
      setTeachers(list);
    } catch (err) {
      console.error('Failed to fetch teachers from IndexedDB:', err);
      setTeachers([]);
    } finally {
      setLoading(false);
    }
  };

  const safeTeachers = Array.isArray(teachers) ? teachers : [];

  return (
    <div className="space-y-7">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            إدارة المعلمين والكادر التدريسي
          </h1>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
            صرف الرواتب الذكي مع نظام الخصم الآلي للغياب والترحيل للخزينة
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          {settings.subscriptionPlan === 'enterprise' && (
            <button 
              onClick={() => alert("سيتم تفعيل ميزة الحضور اللامرئي الذكي قريباً...")}
              className="bg-white hover:bg-indigo-50 border border-indigo-200 text-indigo-700 active:scale-[0.98] px-5 py-3 rounded-2xl flex items-center gap-2.5 transition-all font-bold text-xs shadow-sm"
            >
              <Fingerprint size={18} className="text-indigo-500" />
              <span>الحضور اللامرئي</span>
            </button>
          )}
          <button 
            onClick={() => setShowAddModal(true)}
            className="bg-indigo-950 hover:bg-indigo-900 active:scale-[0.98] text-white px-5 py-3 rounded-2xl flex items-center gap-2.5 transition-all font-bold text-xs shadow-md shadow-indigo-950/10"
          >
            <Plus size={18} className="text-amber-400" />
            <span>إضافة معلم جديد</span>
          </button>
        </div>
      </div>

      {/* Teachers Grid or Artistic Empty State */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white dark:bg-slate-900/80 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm animate-pulse flex flex-col justify-between h-48">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-gray-200 dark:bg-gray-800"></div>
                    <div className="space-y-1.5">
                      <div className="h-4 w-28 bg-gray-200 dark:bg-gray-800 rounded-lg"></div>
                      <div className="h-3 w-16 bg-gray-200 dark:bg-gray-800 rounded-lg"></div>
                    </div>
                  </div>
                  <div className="w-14 h-5 bg-gray-200 dark:bg-gray-800 rounded-full"></div>
                </div>
                <div className="bg-gray-100 dark:bg-slate-800/60 rounded-2xl p-4 mb-2 flex justify-between items-center">
                  <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                  <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                </div>
              </div>
              <div className="h-10 w-full bg-gray-200 dark:bg-gray-800 rounded-2xl"></div>
            </div>
          ))}
        </div>
      ) : safeTeachers.length === 0 ? (
        /* Artistic Empty State with strictly inanimate educational icon & cosmic glow */
        <div className="bg-white dark:bg-slate-900/80 dark:backdrop-blur-md border border-slate-100 dark:border-slate-800 rounded-3xl p-12 text-center flex flex-col items-center justify-center shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_0_25px_rgba(0,0,0,0.3)] my-6">
          <div className="relative mb-5 flex items-center justify-center">
            <div className="absolute w-32 h-32 rounded-full border border-dashed border-cyan-500/30 animate-[spin_20s_linear_infinite]"></div>
            <div className="w-20 h-20 rounded-3xl bg-blue-50 dark:bg-slate-800 border border-blue-100 dark:border-slate-700 flex items-center justify-center dark:shadow-[0_0_20px_rgba(34,211,238,0.2)]">
              <GraduationCap className="h-10 w-10 text-blue-600 dark:text-cyan-400" />
            </div>
          </div>
          <h3 className="font-extrabold text-xl text-slate-900 dark:text-slate-100 mb-2">لا يوجد معلمين مسجلين حالياً</h3>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 max-w-md mb-6 leading-relaxed">
            يمكنك تسجيل بيانات المعلمين والرواتب الشهرية بسهولة لصرف المستحقات مع الخصم الآلي لأيام الغياب وترحيل الحركات للخزينة.
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 hover:bg-blue-700 dark:bg-cyan-600 dark:hover:bg-cyan-500 text-white px-6 py-3 rounded-2xl font-bold text-xs flex items-center gap-2 shadow-md dark:shadow-[0_0_15px_rgba(34,211,238,0.3)] active:scale-[0.98] transition-all"
          >
            <Plus size={16} />
            <span>تسجيل أول معلم في المنظومة</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {safeTeachers.map(teacher => (
            <div 
              key={teacher.id} 
              className="bg-white dark:bg-slate-900/80 dark:backdrop-blur-md border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_12px_40px_rgb(0,0,0,0.07)] dark:shadow-[0_0_20px_rgba(0,0,0,0.3)] dark:hover:border-cyan-500/30 transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-cyan-950/60 text-indigo-950 dark:text-cyan-300 dark:border dark:border-cyan-500/30 flex items-center justify-center font-black text-sm dark:shadow-[0_0_10px_rgba(34,211,238,0.2)]">
                      {teacher.name ? teacher.name.charAt(0) : 'م'}
                    </div>
                    <div>
                      <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100">{teacher.name}</h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">كادر تعليمي</p>
                    </div>
                  </div>
                  {teacher.sync_status === 'pending' ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 font-bold border border-amber-200 dark:border-amber-700">
                      <Clock size={10} />
                      <span>معلق</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full font-bold border border-emerald-100 dark:border-emerald-800" title="متزامن">
                      <CheckCircle2 size={12} className="ms-0.5" />
                      <span>متزامن</span>
                    </span>
                  )}
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 mb-5 border border-slate-100 dark:border-slate-700/60 flex justify-between items-center text-xs">
                  <span className="text-slate-500 dark:text-slate-400 font-semibold">الراتب الأساسي الشهري:</span>
                  <span className="font-black text-slate-900 dark:text-slate-100 text-sm">{teacher.base_salary?.toLocaleString()} د.ل</span>
                </div>
              </div>

              <button 
                onClick={() => setShowSalaryModal(teacher)}
                className="w-full bg-slate-100 dark:bg-slate-800/80 hover:bg-indigo-950 dark:hover:bg-cyan-600 hover:text-white dark:hover:text-white text-slate-800 dark:text-slate-200 py-3 rounded-2xl flex items-center justify-center gap-2 transition-all duration-200 text-xs font-bold active:scale-[0.98] dark:border dark:border-slate-700/80 dark:hover:border-cyan-500"
              >
                <Calculator size={15} className="text-indigo-600 dark:text-cyan-400 hover:text-inherit" />
                <span>صرف الراتب (مع الخصم الآلي)</span>
              </button>
            </div>
          ))}
        </div>
      )}

      {showAddModal && <AddTeacherModal onClose={() => setShowAddModal(false)} onAdded={fetchTeachers} />}
      {showSalaryModal && <SalaryModal teacher={showSalaryModal} onClose={() => setShowSalaryModal(null)} onPaid={fetchTeachers} />}
    </div>
  );
}

function AddTeacherModal({ onClose, onAdded }: { onClose: () => void, onAdded: () => void }) {
  const [formData, setFormData] = useState({ name: '', base_salary: '', birth_certificate: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    try {
      await syncService.saveTeacher({
        name: formData.name.trim(),
        base_salary: Number(formData.base_salary),
        birth_certificate: formData.birth_certificate
      });
      onAdded();
      onClose();
    } catch (err) {
      console.error('Error saving teacher to IndexedDB:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/60 dark:bg-slate-950/80 flex items-center justify-center z-50 p-4 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 dark:backdrop-blur-xl border border-slate-100 dark:border-slate-800 rounded-3xl w-full max-w-md overflow-hidden max-h-[90vh] flex flex-col shadow-[0_20px_50px_rgba(0,0,0,0.15)] dark:shadow-[0_0_30px_rgba(0,0,0,0.6)] animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/70 dark:bg-slate-800/50">
          <div>
            <h2 className="font-extrabold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span>إضافة معلم جديد</span>
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">تسجيل الكادر التدريسي وتحديد الراتب الأساسي</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800">
            <X size={18} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">اسم المعلم / المعلمة</label>
              <input 
                required 
                type="text" 
                placeholder="أدخل الاسم الثلاثي أو الرباعي..."
                className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-600 dark:focus:border-cyan-400 focus:bg-white dark:focus:bg-slate-800 transition-all font-medium" 
                value={formData.name} 
                onChange={e => setFormData({...formData, name: e.target.value})} 
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">الراتب الأساسي الشهري (د.ل)</label>
              <input 
                required 
                type="number" 
                placeholder="مثال: 1500"
                className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-600 dark:focus:border-cyan-400 focus:bg-white dark:focus:bg-slate-800 transition-all font-medium" 
                value={formData.base_salary} 
                onChange={e => setFormData({...formData, base_salary: e.target.value})} 
              />
            </div>

            {/* Document Upload Button with Native Camera */}
            <div className="pt-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">إرفاق المستند / الهوية (اختياري)</label>
              <div className="flex flex-wrap items-center gap-3">
                <input 
                  type="file" 
                  accept="image/*" 
                  capture="environment" 
                  className="hidden" 
                  id="teacherDocInput" 
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        const base64 = reader.result as string;
                        setFormData(prev => ({ ...prev, birth_certificate: base64 }));
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
                <label 
                  htmlFor="teacherDocInput" 
                  className="cursor-pointer inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 dark:bg-cyan-600 dark:hover:bg-cyan-500 active:scale-[0.98] text-white px-4 py-2.5 rounded-xl text-xs font-semibold shadow-sm transition-all"
                >
                  <Camera size={15} />
                  <span>إرفاق مستند / فتح الكاميرا</span>
                </label>

                {formData.birth_certificate && (
                  <div className="inline-flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-700 px-3 py-1.5 rounded-xl text-xs font-medium text-emerald-700 dark:text-emerald-300">
                    <Check size={14} className="text-emerald-600 dark:text-emerald-400" />
                    <span>تم الإرفاق</span>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, birth_certificate: '' }))}
                      className="text-rose-600 hover:text-rose-700 font-bold mr-1"
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-5 mt-4 border-t border-slate-100 dark:border-slate-800">
              <button 
                type="button" 
                onClick={onClose} 
                className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 py-3 rounded-2xl font-bold text-xs transition-colors"
              >
                إلغاء
              </button>
              <button 
                type="submit" 
                disabled={loading} 
                className="flex-[2] bg-indigo-950 hover:bg-indigo-900 dark:bg-cyan-600 dark:hover:bg-cyan-500 text-white py-3 rounded-2xl font-bold text-xs shadow-md transition-all active:scale-[0.98]"
              >
                حفظ بيانات المعلم
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function SalaryModal({ teacher, onClose, onPaid }: { teacher: Teacher, onClose: () => void, onPaid?: () => void }) {
  const [absenceDays, setAbsenceDays] = useState(0);
  const dayRate = Math.round(teacher.base_salary / 30);
  const deduction = absenceDays * dayRate;
  const finalSalary = teacher.base_salary - deduction;
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePay = async () => {
    setIsProcessing(true);
    try {
      await syncService.payTeacherSalary(teacher.id, absenceDays, dayRate, teacher.base_salary);
      alert(`تم صرف ${finalSalary} د.ل للمُعلم "${teacher.name}" وترحيلها للصادرات بنجاح محلياً!`);
      if (onPaid) onPaid();
      onClose();
    } catch (err) {
      console.error('Error paying salary:', err);
      alert('حدث خطأ أثناء صرف الراتب');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/60 dark:bg-slate-950/80 flex items-center justify-center z-50 p-4 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 dark:backdrop-blur-xl border border-slate-100 dark:border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.15)] dark:shadow-[0_0_30px_rgba(0,0,0,0.6)] animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/70 dark:bg-slate-800/50">
          <div>
            <h2 className="font-extrabold text-base text-slate-900 dark:text-slate-100">صرف راتب: {teacher.name}</h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">حساب الخصم الآلي والترحيل للخزينة</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800">
            <X size={18} />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/60 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400 font-semibold">الراتب الأساسي:</span> 
              <span className="font-black text-slate-900 dark:text-slate-100">{teacher.base_salary?.toLocaleString()} د.ل</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400 font-semibold">قيمة اليوم الواحد (الراتب ÷ 30):</span> 
              <span className="font-bold text-slate-700 dark:text-slate-300">~{dayRate} د.ل</span>
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">أيام الغياب المسجلة</label>
            <input 
              type="number" 
              min="0" 
              max="30" 
              className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-600 dark:focus:border-cyan-400 focus:bg-white dark:focus:bg-slate-800 transition-all font-medium" 
              value={absenceDays} 
              onChange={e => setAbsenceDays(Number(e.target.value))} 
            />
            {deduction > 0 && (
              <p className="text-xs text-rose-600 dark:text-rose-400 mt-2 font-bold flex items-center gap-1">
                <span>إجمالي الخصم الآلي المحسوب: {deduction.toLocaleString()} د.ل</span>
              </p>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
            <div className="flex justify-between items-center mb-5 bg-indigo-50/60 dark:bg-slate-800/80 p-3.5 rounded-2xl border border-indigo-100 dark:border-slate-700">
              <span className="text-slate-700 dark:text-slate-300 font-bold text-xs">الصافي المنصرف:</span>
              <span className="text-2xl font-black text-indigo-950 dark:text-cyan-400">{finalSalary.toLocaleString()} د.ل</span>
            </div>
            <button 
              onClick={handlePay} 
              disabled={isProcessing} 
              className="w-full bg-indigo-950 hover:bg-indigo-900 dark:bg-cyan-600 dark:hover:bg-cyan-500 active:scale-[0.98] text-white py-3.5 rounded-2xl font-bold text-xs transition-all shadow-md dark:shadow-[0_0_15px_rgba(34,211,238,0.3)] disabled:opacity-50"
            >
              {isProcessing ? 'جاري الصرف والترحيل...' : 'تأكيد الصرف وترحيل للخزينة'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
