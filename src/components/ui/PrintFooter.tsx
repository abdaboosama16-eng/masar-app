import React from 'react';
import { useSchoolSettings } from '../../lib/settings';

export interface PrintFooterProps {
  preparedByLabel?: string;
  approvedByLabel?: string;
  showStampBox?: boolean;
  notes?: string;
  className?: string;
}

/**
 * Official institutional print footer with signatures, official stamp, and verification disclaimers.
 * Automatically hidden on screen (hidden) and displayed exclusively during print (print:block).
 */
export const PrintFooter: React.FC<PrintFooterProps> = ({
  preparedByLabel = 'إعداد وتوقيع المسؤول المالي / المختص',
  approvedByLabel = 'اعتماد إدارة المؤسسة التعليمية',
  showStampBox = true,
  notes,
  className = ''
}) => {
  const { settings } = useSchoolSettings();

  return (
    <div
      className={`hidden print:block w-full mt-6 pt-4 border-t-2 border-black text-black ${className}`}
      style={{ direction: 'rtl', fontFamily: "'Tajawal', 'Cairo', Tahoma, Arial, sans-serif", pageBreakInside: 'avoid' }}
    >
      {/* Notes / Disclaimer if provided */}
      {notes && (
        <div className="text-[10px] text-gray-700 font-medium mb-4 p-2 bg-gray-50 border border-gray-300 rounded">
          * {notes}
        </div>
      )}

      {/* Signatures and Official Stamp Zone */}
      <div className="flex items-start justify-between px-6 py-2">
        {/* Prepared By Signature */}
        <div className="text-center min-w-[170px]">
          <p className="text-[11px] font-bold text-black mb-7">{preparedByLabel}</p>
          <div className="border-b-2 border-dotted border-black w-36 mx-auto"></div>
          <p className="text-[9px] text-gray-500 mt-1">التوقيع والتاريخ</p>
        </div>

        {/* Official Stamp Box */}
        {showStampBox && (
          <div className="w-28 h-20 border-2 border-dashed border-black rounded-lg flex flex-col items-center justify-center p-1 text-center bg-gray-50">
            <span className="text-[10px] font-black text-gray-800 leading-tight">الختم الرسمي</span>
            <span className="text-[8px] text-gray-500 mt-0.5">{settings.schoolName || 'منظومة مسار'}</span>
          </div>
        )}

        {/* Approved By Signature */}
        <div className="text-center min-w-[170px]">
          <p className="text-[11px] font-bold text-black mb-7">{approvedByLabel}</p>
          <div className="border-b-2 border-dotted border-black w-36 mx-auto"></div>
          <p className="text-[9px] text-gray-500 mt-1">الختم والاعتماد</p>
        </div>
      </div>

      {/* System Watermark Disclaimer */}
      <div className="mt-4 pt-2 border-t border-gray-300 flex justify-between items-center text-[8px] text-gray-600 px-2" dir="rtl">
        <span>* مستند رسمي مستخرج آلياً من منظومة مسار لإدارة المراكز التعليمية ورياض الأطفال</span>
        <span dir="ltr">Printed via MASAR v2.5 — All Rights Reserved</span>
      </div>
    </div>
  );
};

export default PrintFooter;
