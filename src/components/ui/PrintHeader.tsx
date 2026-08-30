import React from 'react';
import { useSchoolSettings } from '../../lib/settings';

export interface PrintHeaderProps {
  title: string;
  subtitle?: string;
  reportRef?: string;
  additionalInfo?: Array<{ label: string; value: string | number }>;
  className?: string;
}

/**
 * Official institutional print header for MASAR platform.
 * Automatically hidden on screen (hidden) and displayed exclusively during print (print:flex).
 */
export const PrintHeader: React.FC<PrintHeaderProps> = ({
  title,
  subtitle,
  reportRef,
  additionalInfo = [],
  className = ''
}) => {
  const { settings } = useSchoolSettings();

  const currentDate = new Date().toLocaleDateString('ar-LY', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const currentTime = new Date().toLocaleTimeString('ar-LY', {
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div
      className={`hidden print:flex flex-col w-full bg-white text-black mb-4 pb-3 border-b-2 border-black ${className}`}
      style={{ direction: 'rtl', fontFamily: "'Tajawal', 'Cairo', Tahoma, Arial, sans-serif" }}
    >
      {/* Top Row: School Branding + Logo + Report Type */}
      <div className="flex items-center justify-between w-full pb-2">
        {/* Right: Institutional Name & Subtitle */}
        <div className="flex items-center gap-3">
          {settings.logo && (
            <img
              src={settings.logo}
              alt={settings.schoolName}
              className="w-14 h-14 object-contain"
              referrerPolicy="no-referrer"
            />
          )}
          <div className="text-right">
            <h1 className="text-base font-black text-black leading-tight">
              {settings.schoolName || 'منظومة مسار التعليمية'}
            </h1>
            <p className="text-[10px] text-gray-700 font-bold mt-0.5">
              {settings.schoolNameEn || 'MASAR EDUCATIONAL PLATFORM'}
            </p>
            {settings.phone && (
              <p className="text-[9px] text-gray-600 font-mono mt-0.5" dir="ltr">
                هاتف: {settings.phone} {settings.address ? `| ${settings.address}` : ''}
              </p>
            )}
          </div>
        </div>

        {/* Center: Official Document Title Pill */}
        <div className="text-center px-4">
          <div className="border-2 border-black bg-gray-100 rounded-lg px-4 py-1.5 inline-block shadow-none">
            <h2 className="text-sm font-black text-black tracking-wide whitespace-nowrap">
              {title}
            </h2>
          </div>
          {subtitle && (
            <p className="text-[10px] text-gray-700 font-bold mt-1">
              {subtitle}
            </p>
          )}
        </div>

        {/* Left: Metadata & Date/Time & Reference */}
        <div className="text-left text-[9.5px] text-gray-800 space-y-0.5 min-w-[140px]" dir="ltr">
          <div className="flex justify-between gap-2">
            <span className="font-bold text-black">Date:</span>
            <span>{currentDate}</span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="font-bold text-black">Time:</span>
            <span>{currentTime}</span>
          </div>
          {reportRef && (
            <div className="flex justify-between gap-2">
              <span className="font-bold text-black">Ref:</span>
              <span className="font-mono font-bold text-black">#{reportRef}</span>
            </div>
          )}
          <div className="flex justify-between gap-2">
            <span className="font-bold text-black">System:</span>
            <span>MASAR v2.5</span>
          </div>
        </div>
      </div>

      {/* Optional Metadata Strip (e.g. Grade, Total Count, Period, Filter summary) */}
      {additionalInfo.length > 0 && (
        <div className="flex items-center justify-around bg-gray-50 border border-black rounded-md py-1 px-3 mt-1.5 text-[10px] font-bold text-black">
          {additionalInfo.map((info, idx) => (
            <div key={idx} className="flex items-center gap-1.5">
              <span className="text-gray-600">{info.label}:</span>
              <span className="text-black">{info.value}</span>
              {idx < additionalInfo.length - 1 && <span className="text-gray-300 mr-3">|</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PrintHeader;
