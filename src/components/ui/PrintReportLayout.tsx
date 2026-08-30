import React from 'react';
import { PrintHeader, PrintHeaderProps } from './PrintHeader';
import { PrintFooter, PrintFooterProps } from './PrintFooter';

export interface PrintReportLayoutProps {
  id?: string;
  headerProps: PrintHeaderProps;
  footerProps?: PrintFooterProps;
  children: React.ReactNode;
  className?: string;
}

/**
 * Standard container for full-page printable reports in MASAR (Student Rosters, Daily Closing, Transport Lists, etc.)
 * Strictly isolates print styles from screen UI, ensures high-contrast pure black/white,
 * and maintains proper pagination.
 */
export const PrintReportLayout: React.FC<PrintReportLayoutProps> = ({
  id,
  headerProps,
  footerProps,
  children,
  className = ''
}) => {
  return (
    <div
      id={id}
      className={`hidden print:block absolute top-0 left-0 w-[210mm] bg-white text-black font-sans m-0 p-6 box-border ${className}`}
      style={{
        direction: 'rtl',
        fontFamily: "'Tajawal', 'Cairo', Tahoma, Arial, sans-serif",
        WebkitPrintColorAdjust: 'exact',
        printColorAdjust: 'exact'
      }}
    >
      <PrintHeader {...headerProps} />

      <div className="w-full my-2 text-black">
        {children}
      </div>

      <PrintFooter {...footerProps} />
    </div>
  );
};

export default PrintReportLayout;
