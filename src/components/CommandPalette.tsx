import React, { useState, useEffect, useRef } from 'react';
import { Search, LayoutDashboard, Users, UserSquare2, Wallet, Settings, Building2, UserPlus, Receipt, X, BusFront } from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: string) => void;
  onAction: (action: string) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose, onNavigate, onAction }) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setQuery('');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const commands = [
    { id: 'nav-dashboard', type: 'navigation', title: 'لوحة التحكم', icon: LayoutDashboard, action: () => onNavigate('dashboard') },
    { id: 'nav-students', type: 'navigation', title: 'الطلاب والأقساط', icon: Users, action: () => onNavigate('students') },
    { id: 'nav-transport', type: 'navigation', title: 'خدمة المواصلات والنقل', icon: BusFront, action: () => onNavigate('transport') },
    { id: 'nav-financials', type: 'navigation', title: 'الخزينة والمصروفات', icon: Wallet, action: () => onNavigate('financials') },
    { id: 'nav-teachers', type: 'navigation', title: 'المعلمين والموظفين', icon: UserSquare2, action: () => onNavigate('teachers') },
    { id: 'nav-settings', type: 'navigation', title: 'الإعدادات العامة', icon: Settings, action: () => onAction('settings') },
    { id: 'action-add-student', type: 'action', title: 'إضافة طالب جديد', icon: UserPlus, action: () => { onNavigate('students'); setTimeout(() => onAction('add-student'), 100); } },
    { id: 'action-add-payment', type: 'action', title: 'تسجيل دفعة مالية', icon: Receipt, action: () => { onNavigate('financials'); setTimeout(() => onAction('add-payment'), 100); } },
  ];

  const filteredCommands = commands.filter(cmd => 
    cmd.title.toLowerCase().includes(query.toLowerCase()) || 
    cmd.id.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] sm:pt-[20vh] px-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Search Input */}
        <div className="flex items-center px-4 py-4 border-b border-slate-100 dark:border-slate-800">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            className="w-full bg-transparent border-none outline-none focus:ring-0 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 px-4 text-base font-medium"
            placeholder="ابحث عن صفحة، أو إجراء سريع..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button 
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto p-2">
          {filteredCommands.length > 0 ? (
            <div className="space-y-1">
              {filteredCommands.map((cmd) => {
                const Icon = cmd.icon;
                return (
                  <button
                    key={cmd.id}
                    onClick={() => {
                      cmd.action();
                      onClose();
                    }}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-900/30 group transition-all text-start"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg \${cmd.type === 'action' ? 'bg-emerald-100/50 text-emerald-600 dark:bg-emerald-900/30' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'} group-hover:bg-white dark:group-hover:bg-slate-800 transition-colors shadow-sm`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-200 group-hover:text-indigo-700 dark:group-hover:text-indigo-300 transition-colors">
                        {cmd.title}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                      {cmd.type === 'action' ? 'إجراء' : 'صفحة'}
                    </span>
                  </button>
                )
              })}
            </div>
          ) : (
            <div className="py-12 px-6 text-center">
              <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3">
                <Search className="w-5 h-5 text-slate-400" />
              </div>
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">لا توجد نتائج مطابقة</p>
              <p className="text-xs text-slate-500 mt-1">حاول استخدام كلمات مفتاحية مختلفة</p>
            </div>
          )}
        </div>
        
        {/* Modal Content */}
      </div>
    </div>
  );
};
