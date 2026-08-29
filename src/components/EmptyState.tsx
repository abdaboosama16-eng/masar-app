import React from 'react';
import { LucideIcon, BookOpen, Sparkles } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = BookOpen,
  title,
  description,
  actionText,
  onAction,
  className = ''
}) => {
  return (
    <div className={`flex flex-col items-center justify-center p-10 sm:p-14 text-center ${className}`}>
      {/* Magical Geometric Orbit & Inanimate Symbol */}
      <div className="relative mb-6 flex items-center justify-center">
        {/* Outer Cosmic Glowing Ring (Geometry & Light only) */}
        <div className="absolute w-32 h-32 rounded-full border border-dashed border-indigo-200 dark:border-cyan-500/30 animate-[spin_20s_linear_infinite] pointer-events-none"></div>
        <div className="absolute w-28 h-28 rounded-full border border-blue-100 dark:border-indigo-500/20 pointer-events-none"></div>
        
        {/* Glowing Geometric Planetary Dots (Inanimate Orbits) */}
        <div className="absolute -top-1 w-2 h-2 rounded-full bg-cyan-400 dark:shadow-[0_0_10px_rgba(34,211,238,0.9)]"></div>
        <div className="absolute -bottom-1 w-2 h-2 rounded-full bg-amber-400 dark:shadow-[0_0_10px_rgba(251,191,36,0.9)]"></div>
        <div className="absolute -left-1 w-1.5 h-1.5 rounded-full bg-indigo-400 dark:shadow-[0_0_8px_rgba(99,102,241,0.9)]"></div>

        {/* Central Glassmorphic Symbol Container */}
        <div className="relative w-20 h-20 rounded-3xl bg-gradient-to-tr from-blue-50 to-indigo-50 dark:from-slate-900/90 dark:to-indigo-950/80 border border-blue-100/80 dark:border-slate-700/80 flex items-center justify-center shadow-xs dark:shadow-[0_0_25px_rgba(34,211,238,0.18)] dark:backdrop-blur-md">
          <Icon className="w-10 h-10 text-blue-600 dark:text-cyan-400 transition-transform duration-300 hover:scale-110" strokeWidth={1.5} />
        </div>

        {/* Sparkle Badge */}
        <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-amber-50 dark:bg-amber-950/80 border border-amber-200/80 dark:border-amber-500/40 flex items-center justify-center shadow-xs dark:shadow-[0_0_12px_rgba(251,191,36,0.5)]">
          <Sparkles className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
        </div>
      </div>

      {/* Title */}
      <h3 className="text-base sm:text-lg font-black text-slate-800 dark:text-slate-100 tracking-tight mb-1.5">
        {title}
      </h3>

      {/* Description */}
      {description && (
        <p className="text-xs sm:text-sm text-slate-400 dark:text-slate-400 font-medium max-w-sm leading-relaxed mb-6">
          {description}
        </p>
      )}

      {/* Optional Action Button with Neon Hover Glow */}
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-indigo-950 hover:bg-indigo-900 dark:bg-cyan-600 dark:hover:bg-cyan-500 text-white text-xs font-bold transition-all shadow-sm dark:shadow-[0_0_15px_rgba(34,211,238,0.25)] dark:hover:shadow-[0_0_20px_rgba(34,211,238,0.5)] active:scale-[0.98]"
        >
          <span>{actionText}</span>
        </button>
      )}
    </div>
  );
};

