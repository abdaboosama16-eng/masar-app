import React from 'react';
import { AlertCircle, AlertTriangle, CheckCircle, Info } from 'lucide-react';

export type BadgeType = 'financial_delay' | 'admin_note' | 'excellent' | 'info';

interface StudentBadgeProps {
  type: BadgeType;
  label?: string;
  className?: string;
}

export const StudentBadge: React.FC<StudentBadgeProps> = ({ type, label, className = '' }) => {
  const config = {
    financial_delay: {
      color: 'text-rose-600 dark:text-rose-400',
      bg: 'bg-rose-50 dark:bg-rose-900/30',
      border: 'border-rose-100 dark:border-rose-800',
      icon: <AlertCircle size={12} className="shrink-0" />,
      defaultLabel: 'تأخير مالي'
    },
    admin_note: {
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-50 dark:bg-amber-900/30',
      border: 'border-amber-100 dark:border-amber-800',
      icon: <AlertTriangle size={12} className="shrink-0" />,
      defaultLabel: 'ملاحظة إدارية'
    },
    excellent: {
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-900/30',
      border: 'border-emerald-100 dark:border-emerald-800',
      icon: <CheckCircle size={12} className="shrink-0" />,
      defaultLabel: 'ممتاز'
    },
    info: {
      color: 'text-sky-600 dark:text-sky-400',
      bg: 'bg-sky-50 dark:bg-sky-900/30',
      border: 'border-sky-100 dark:border-sky-800',
      icon: <Info size={12} className="shrink-0" />,
      defaultLabel: 'معلومة'
    }
  };

  const style = config[type];

  return (
    <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border backdrop-blur-sm shadow-sm transition-colors \${style.bg} \${style.color} \${style.border} \${className}`} title={label || style.defaultLabel}>
      {style.icon}
      <span className="max-w-[80px] truncate">{label || style.defaultLabel}</span>
    </div>
  );
};
