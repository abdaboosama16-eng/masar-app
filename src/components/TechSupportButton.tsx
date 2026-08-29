import React, { useState } from 'react';
import { MessageSquare, ExternalLink, Headset, X, Sparkles, Phone, ArrowUpRight } from 'lucide-react';

interface TechSupportButtonProps {
  variant?: 'floating' | 'sidebar' | 'header';
  className?: string;
}

const SUPPORT_PHONE = '218927211505';
const DEFAULT_MESSAGE = 'السلام عليكم مهندس، أحتاج مساعدة بخصوص منظومة مسار التعليمية...';

export const getWhatsAppSupportUrl = (customText?: string) => {
  const message = customText || DEFAULT_MESSAGE;
  return `https://wa.me/${SUPPORT_PHONE}?text=${encodeURIComponent(message)}`;
};

export const openWhatsAppSupport = (customText?: string) => {
  const url = getWhatsAppSupportUrl(customText);
  window.open(url, '_blank', 'noopener,noreferrer');
};

/**
 * WhatsApp Icon (Official Vector)
 */
export const WhatsAppIcon: React.FC<{ size?: number; className?: string }> = ({ size = 18, className = '' }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className={className}
    aria-hidden="true"
  >
    <path d="M12.031 2C6.496 2 2 6.495 2 12.03c0 1.907.534 3.69 1.464 5.216L2 22l4.908-1.428A9.99 9.99 0 0 0 12.031 22C17.566 22 22 17.505 22 12.03 22 6.495 17.566 2 12.031 2Zm0 18.232c-1.636 0-3.175-.444-4.508-1.218l-.323-.19-2.913.848.864-2.836-.208-.333A8.204 8.204 0 0 1 3.799 12.03c0-4.538 3.693-8.232 8.232-8.232 4.539 0 8.233 3.694 8.233 8.232 0 4.538-3.694 8.232-8.233 8.232Zm4.516-6.175c-.247-.124-1.465-.723-1.692-.806-.228-.083-.393-.124-.559.124-.165.248-.642.806-.787.971-.144.165-.29.186-.538.062-.248-.124-1.047-.386-1.994-1.23-.737-.658-1.234-1.472-1.379-1.72-.144-.248-.015-.382.109-.505.112-.111.248-.29.372-.435.124-.145.166-.248.249-.414.083-.166.041-.311-.021-.435-.062-.124-.559-1.347-.766-1.844-.202-.483-.408-.418-.559-.425l-.477-.008c-.165 0-.435.062-.663.311-.228.248-.87 0.85-.87 2.073s.891 2.404 1.015 2.57c.124.165 1.753 2.677 4.247 3.754.593.256 1.057.41 1.418.525.596.19 1.139.163 1.568.099.479-.072 1.465-.6 1.672-1.18.207-.58.207-1.077.145-1.18-.062-.104-.228-.166-.476-.29Z" />
  </svg>
);

export const TechSupportButton: React.FC<TechSupportButtonProps> = ({ variant = 'floating', className = '' }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  // 1. Sidebar Variant: Clean, elegant, quiet card inside the navigation
  if (variant === 'sidebar') {
    return (
      <a
        href={getWhatsAppSupportUrl()}
        target="_blank"
        rel="noopener noreferrer"
        className={`w-full group flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-all duration-150 cursor-pointer ${className}`}
        title="تواصل مباشر مع الدعم الفني والمطور عبر واتساب"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 group-hover:bg-emerald-500/30 transition-colors">
            <WhatsAppIcon size={15} />
          </div>
          <div className="text-right truncate">
            <div className="text-xs font-bold text-slate-200 group-hover:text-white flex items-center gap-1.5">
              <span>الدعم الفني</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium truncate">
              مساعدة فورية عبر واتساب
            </p>
          </div>
        </div>
        <ArrowUpRight size={14} className="text-slate-500 group-hover:text-slate-300 transition-colors shrink-0" />
      </a>
    );
  }

  // 2. Header Variant: Compact pill for top navigation or dashboard header
  if (variant === 'header') {
    return (
      <a
        href={getWhatsAppSupportUrl()}
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95 ${className}`}
        title="تواصل مع المطور عبر واتساب"
      >
        <WhatsAppIcon size={14} className="text-emerald-600 dark:text-emerald-400" />
        <span className="hidden sm:inline">الدعم الفني</span>
        <span className="sm:hidden">الدعم</span>
      </a>
    );
  }

  // 3. Floating Button Variant: Fixed at bottom-left corner (RTL layout) with nice pulse effect
  return (
    <div 
      className={`fixed bottom-5 left-5 z-40 flex items-center gap-2 select-none print:hidden ${className}`}
      dir="ltr"
    >
      {/* Expanded Tooltip / Info Badge */}
      {showTooltip && (
        <div className="bg-slate-900/95 dark:bg-slate-900/95 backdrop-blur-md text-white text-xs py-2 px-3.5 rounded-2xl shadow-xl border border-slate-700/80 dark:border-emerald-500/40 animate-in fade-in slide-in-from-left-2 flex items-center gap-2.5" dir="rtl">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
          <div>
            <p className="font-black text-slate-100 text-[11px]">مساعدة ودعم فني مباشر</p>
            <p className="text-[10px] text-slate-400 font-mono" dir="ltr">+218 92 721 1505</p>
          </div>
        </div>
      )}

      {/* Main Floating WhatsApp Action Button */}
      <a
        href={getWhatsAppSupportUrl()}
        target="_blank"
        rel="noopener noreferrer"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className="group relative flex items-center gap-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-full shadow-[0_4px_20px_rgba(16,185,129,0.35)] hover:shadow-[0_6px_25px_rgba(16,185,129,0.5)] border border-emerald-400/40 transition-all duration-300 cursor-pointer active:scale-95"
        title="تواصل مع المطور والدعم الفني عبر واتساب (+218 92 721 1505)"
        aria-label="تواصل مع الدعم الفني عبر واتساب"
      >
        {/* Radar ping ring */}
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-400 border-2 border-white dark:border-slate-900"></span>
        </span>

        <WhatsAppIcon size={20} className="text-white group-hover:scale-110 transition-transform shrink-0" />
        
        <span className="text-xs font-black tracking-wide hidden sm:inline" dir="rtl">
          الدعم الفني / المطور
        </span>
      </a>
    </div>
  );
};
