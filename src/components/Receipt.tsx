import React from 'react';
import { Student } from '../types';
import { tafqeet } from '../lib/tafqeet';
import { getSchoolSettings, SchoolSettings } from '../lib/settings';

export interface ReceiptProps {
  receiptData?: {
    student?: Student;
    paidAmount?: number;
    remainingAmount?: number;
    notes?: string;
    receiptNo?: string | number;
    date?: string;
    previousPaid?: number;
    previousPaymentsCount?: number;
  } | null;
  settings?: SchoolSettings;
  copyLabel?: string;
  showCutLine?: boolean;
}

export const Receipt: React.FC<ReceiptProps> = ({ 
  receiptData, 
  settings: customSettings,
  copyLabel,
  showCutLine = false
}) => {
  if (!receiptData) {
    return null;
  }

  const schoolSettings = customSettings || getSchoolSettings();
  const schoolName = schoolSettings.schoolName || 'مدرسة نور البيان';
  const schoolNameEn = schoolSettings.schoolNameEn || 'NOUR ALBIAN SCHOOL';
  const schoolPhone = schoolSettings.phone;
  const schoolAddress = schoolSettings.address;
  const currencySymbol = schoolSettings.currency || 'د.ل';
  const footerNotice = schoolSettings.receiptFooterNotice 
    ? schoolSettings.receiptFooterNotice.replace('{schoolName}', schoolName)
    : `نسعد بثقتكم.. ${schoolName} تتمنى لكم عاماً دراسياً موفقاً`;
  const logoImage = schoolSettings.logo;

  const studentName = receiptData.student?.name || 'عائشة مفتاح الخراز';
  const receiptNo = receiptData.receiptNo ?? '46';
  const paidAmount = Number(receiptData.paidAmount ?? 500);
  const remainingAmount = Number(receiptData.remainingAmount ?? 400);
  const date = receiptData.date || '2025/09/29';

  // Strict colors & clean crisp borders
  const cyanBg = '#38bdf8';
  const royalNavy = '#1e3a8a'; // Deep luxury royal navy
  const borderThick = '1.5px solid #111827';
  const borderThin = '1px solid #111827';

  // Natural comfortable cells with clean padding and clear typography
  const cellStyle: React.CSSProperties = {
    border: borderThin,
    textAlign: 'center',
    verticalAlign: 'middle',
    fontSize: '11px',
    lineHeight: '1.25',
    whiteSpace: 'nowrap',
    color: '#000000',
    backgroundColor: 'transparent',
    padding: '2.5px 5px',
    boxSizing: 'border-box'
  };

  const cyanHeaderStyle: React.CSSProperties = {
    ...cellStyle,
    backgroundColor: cyanBg,
    fontWeight: '900',
    color: '#000000',
    fontSize: '11px',
    padding: '2.5px 4px'
  };

  // Transparent Background with Deep Royal Navy Text for Category Headers
  const categoryHeaderNavyStyle: React.CSSProperties = {
    ...cellStyle,
    backgroundColor: '#f8fafc',
    fontWeight: '900',
    color: royalNavy,
    fontSize: '11.5px',
    padding: '2.5px 4px'
  };

  // Financial Number Cells with Luxury Royal Navy Text & Transparent Background
  const financialNumberStyle: React.CSSProperties = {
    ...cellStyle,
    backgroundColor: 'transparent',
    color: royalNavy,
    fontWeight: 'bold',
    fontSize: '12px',
    padding: '2.5px 5px'
  };

  // Dynamic calculation for "وذلك قيمة" based on student financial data
  const getPaymentPurpose = (): string => {
    const totalFees = Number(
      receiptData.student?.final_fees || 
      receiptData.student?.base_fees || 
      (paidAmount + remainingAmount) || 
      0
    );

    // Calculate previous paid amount
    const prevPaid = receiptData.previousPaid !== undefined
      ? Number(receiptData.previousPaid)
      : (receiptData.student?.total_paid !== undefined
          ? (receiptData.student.total_paid > paidAmount 
              ? receiptData.student.total_paid - paidAmount 
              : (receiptData.student.total_paid === paidAmount && remainingAmount > 0 
                  ? 0 
                  : (receiptData.student.total_paid === paidAmount && remainingAmount === 0 
                      ? 0 
                      : Number(receiptData.student.total_paid))))
          : 0);

    const prevCount = receiptData.previousPaymentsCount !== undefined
      ? receiptData.previousPaymentsCount
      : (prevPaid > 0 ? 1 : 0);

    // 1. الدفع الكامل: إذا كان (المبلغ المدفوع الحالي + إجمالي ما دفعه سابقاً = الإجمالي العام للرسوم) أو إذا كان يدفع المبلغ كاملاً دفعة واحدة
    const isFullPayment = 
      (totalFees > 0 && (paidAmount + prevPaid) >= totalFees) ||
      (totalFees > 0 && paidAmount >= totalFees) ||
      (remainingAmount === 0 && paidAmount > 0);

    if (isFullPayment) {
      return 'القسط الدراسي كاملاً';
    }

    // 2. الدفعة الأولى: إذا كان المبلغ المدفوع جزءاً من الإجمالي، ولا توجد أي دفعات سابقة مسجلة للطالب
    if (paidAmount < totalFees && (prevCount === 0 || prevPaid === 0)) {
      return 'القسط الدراسي الأول';
    }

    // 3. الدفعة الثانية: إذا كان المبلغ المدفوع جزءاً من الإجمالي، وتوجد دفعة واحدة سابقة مسجلة للطالب
    if (paidAmount < totalFees && prevCount === 1) {
      return 'القسط الدراسي الثاني';
    }

    // 4. الدفعات الأخرى (Fallback)
    return 'دفعة من القسط الدراسي';
  };

  return (
    <div
      className="receipt-wrapper relative overflow-hidden flex flex-col justify-between"
      style={{
        position: 'relative',
        width: '202mm',
        maxWidth: '202mm',
        height: '97.5mm',
        maxHeight: '97.5mm',
        margin: '0 auto',
        padding: '1.5mm 3mm 1mm 3mm',
        boxSizing: 'border-box',
        overflow: 'hidden',
        backgroundColor: '#ffffff',
        direction: 'rtl',
        fontFamily: "'Tajawal', 'Cairo', Tahoma, Arial, sans-serif",
        pageBreakInside: 'avoid',
        breakInside: 'avoid',
        WebkitPrintColorAdjust: 'exact',
        printColorAdjust: 'exact'
      }}
    >
      {/* 1. Header with Double Border Underneath */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          paddingBottom: '2px',
          marginBottom: '2px',
          borderBottom: '2px double #1f2937'
        }}
      >
        {/* Right: School Name in Arabic & English */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', minWidth: '140px' }}>
          <div style={{ fontWeight: '900', fontSize: '13px', color: '#000000', lineHeight: '1.2' }}>
            {schoolName}
          </div>
          <div style={{ fontSize: '8px', color: '#334155', fontWeight: 'bold', letterSpacing: '0.3px', lineHeight: '1.2' }}>
            {schoolNameEn}
          </div>
        </div>

        {/* Center: Title Pill + Optional Copy Label */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1px' }}>
          <div
            style={{
              backgroundColor: cyanBg,
              border: '1.5px solid #111827',
              borderRadius: '12px',
              padding: '2px 20px',
              textAlign: 'center'
            }}
          >
            <span style={{ fontSize: '12.5px', fontWeight: '900', color: '#000000', whiteSpace: 'nowrap', lineHeight: '1.2' }}>
              إيصال استلام رسوم اشتراك
            </span>
          </div>
          {copyLabel && (
            <span style={{ fontSize: '9px', fontWeight: 'bold', color: royalNavy, letterSpacing: '0.2px' }}>
              {copyLabel}
            </span>
          )}
        </div>

        {/* Left: Prominent School Logo */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', minWidth: '140px' }}>
          <img
            src={logoImage}
            alt={`شعار ${schoolName}`}
            style={{ width: '36px', height: '36px', objectFit: 'contain' }}
            referrerPolicy="no-referrer"
          />
        </div>
      </div>

      {/* Main Tables Container with Centered Subtle Security Watermark */}
      <div
        className="relative overflow-hidden"
        style={{
          position: 'relative',
          overflow: 'hidden',
          zIndex: 1,
          border: borderThick,
          borderCollapse: 'collapse',
          width: '100%',
          margin: '0px',
          boxSizing: 'border-box',
          backgroundColor: 'transparent',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Subtle Watermark */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '110px',
            height: '110px',
            pointerEvents: 'none',
            zIndex: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: 0.07
          }}
        >
          <img
            src={logoImage}
            alt="Watermark"
            style={{ width: '110px', height: '110px', objectFit: 'contain' }}
            referrerPolicy="no-referrer"
          />
        </div>

        {/* 2. Top Student & Payment Metadata Table */}
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            tableLayout: 'fixed',
            margin: '0',
            backgroundColor: 'transparent'
          }}
        >
          <thead>
            <tr style={{ height: '21px' }}>
              <th style={{ ...cyanHeaderStyle, width: '13%', borderTop: 'none', borderRight: 'none' }}>رقم الإيصال</th>
              <th style={{ ...cyanHeaderStyle, width: '33%', borderTop: 'none' }}>استلمنا من الطالب</th>
              <th style={{ ...cyanHeaderStyle, width: '28%', borderTop: 'none' }}>مقابل</th>
              <th style={{ ...cyanHeaderStyle, width: '13%', borderTop: 'none' }}>تاريخ السداد</th>
              <th style={{ ...cyanHeaderStyle, width: '13%', borderTop: 'none', borderLeft: 'none' }}>وذلك قيمة</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ height: '24px' }}>
              {/* رقم الإيصال */}
              <td style={{ ...cellStyle, borderRight: 'none', width: '13%', color: '#dc2626', fontWeight: '900', fontSize: '13px', textAlign: 'center' }}>
                {receiptNo}
              </td>
              {/* استلمنا من الطالب */}
              <td style={{ ...cellStyle, width: '33%', fontWeight: 'bold', fontSize: '12px', textAlign: 'center' }}>
                {studentName}
              </td>
              {/* مقابل */}
              <td style={{ ...cellStyle, width: '28%', fontWeight: 'bold', fontSize: '11px', textAlign: 'center' }}>
                اشتراك العام الدراسي 2025/2026
              </td>
              {/* تاريخ السداد */}
              <td style={{ ...cellStyle, width: '13%', fontWeight: 'bold', fontSize: '11px', textAlign: 'center' }}>
                {date}
              </td>
              {/* وذلك قيمة */}
              <td style={{ ...cellStyle, borderLeft: 'none', width: '13%', fontWeight: 'bold', fontSize: '10px', textAlign: 'center', whiteSpace: 'normal', lineHeight: '1.2' }}>
                {getPaymentPurpose()}
              </td>
            </tr>
          </tbody>
        </table>

        {/* 3. 4-Category Financial Grid */}
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            tableLayout: 'fixed',
            margin: '0',
            backgroundColor: 'transparent'
          }}
        >
          <thead>
            {/* Category Names Row */}
            <tr style={{ height: '21px' }}>
              <th colSpan={2} style={{ ...categoryHeaderNavyStyle, borderRight: 'none' }}>
                مصاريف تعليمية
              </th>
              <th colSpan={2} style={{ ...categoryHeaderNavyStyle }}>
                المواصلات
              </th>
              <th colSpan={2} style={{ ...categoryHeaderNavyStyle }}>
                مصاريف كتب
              </th>
              <th colSpan={2} style={{ ...categoryHeaderNavyStyle, borderLeft: 'none' }}>
                مصاريف الزي
              </th>
            </tr>
            {/* Sub-headers: المبلغ المدفوع | المبلغ المتبقي */}
            <tr style={{ height: '19px' }}>
              <th style={{ ...cyanHeaderStyle, borderRight: 'none', fontSize: '9.5px', width: '12.5%' }}>المبلغ المدفوع</th>
              <th style={{ ...cyanHeaderStyle, fontSize: '9.5px', width: '12.5%' }}>المبلغ المتبقي</th>

              <th style={{ ...cyanHeaderStyle, fontSize: '9.5px', width: '12.5%' }}>المبلغ المدفوع</th>
              <th style={{ ...cyanHeaderStyle, fontSize: '9.5px', width: '12.5%' }}>المبلغ المتبقي</th>

              <th style={{ ...cyanHeaderStyle, fontSize: '9.5px', width: '12.5%' }}>المبلغ المدفوع</th>
              <th style={{ ...cyanHeaderStyle, fontSize: '9.5px', width: '12.5%' }}>المبلغ المتبقي</th>

              <th style={{ ...cyanHeaderStyle, fontSize: '9.5px', width: '12.5%' }}>المبلغ المدفوع</th>
              <th style={{ ...cyanHeaderStyle, borderLeft: 'none', fontSize: '9.5px', width: '12.5%' }}>المبلغ المتبقي</th>
            </tr>
          </thead>
          <tbody>
            {/* Numerical Values Row */}
            <tr style={{ height: '24px' }}>
              <td style={{ ...financialNumberStyle, borderRight: 'none' }}>{paidAmount}</td>
              <td style={{ ...financialNumberStyle }}>{remainingAmount}</td>

              <td style={{ ...financialNumberStyle, fontSize: '11px', fontWeight: 'normal', color: '#64748b' }}>0</td>
              <td style={{ ...financialNumberStyle, fontSize: '11px', fontWeight: 'normal', color: '#64748b' }}>0</td>

              <td style={{ ...financialNumberStyle, fontSize: '11px', fontWeight: 'normal', color: '#64748b' }}>0</td>
              <td style={{ ...financialNumberStyle, fontSize: '11px', fontWeight: 'normal', color: '#64748b' }}>0</td>

              <td style={{ ...financialNumberStyle, fontSize: '11px', fontWeight: 'normal', color: '#64748b' }}>0</td>
              <td style={{ ...financialNumberStyle, borderLeft: 'none', fontSize: '11px', fontWeight: 'normal', color: '#64748b' }}>0</td>
            </tr>
            {/* Currency Rows */}
            <tr style={{ height: '14px' }}>
              <td style={{ ...cellStyle, borderRight: 'none', fontSize: '8.5px', color: '#475569', padding: '0', lineHeight: '1.1' }}>{currencySymbol}</td>
              <td style={{ ...cellStyle, fontSize: '8.5px', color: '#475569', padding: '0', lineHeight: '1.1' }}>{currencySymbol}</td>

              <td style={{ ...cellStyle, fontSize: '8.5px', color: '#475569', padding: '0', lineHeight: '1.1' }}>{currencySymbol}</td>
              <td style={{ ...cellStyle, fontSize: '8.5px', color: '#475569', padding: '0', lineHeight: '1.1' }}>{currencySymbol}</td>

              <td style={{ ...cellStyle, fontSize: '8.5px', color: '#475569', padding: '0', lineHeight: '1.1' }}>{currencySymbol}</td>
              <td style={{ ...cellStyle, fontSize: '8.5px', color: '#475569', padding: '0', lineHeight: '1.1' }}>{currencySymbol}</td>

              <td style={{ ...cellStyle, fontSize: '8.5px', color: '#475569', padding: '0', lineHeight: '1.1' }}>{currencySymbol}</td>
              <td style={{ ...cellStyle, borderLeft: 'none', fontSize: '8.5px', color: '#475569', padding: '0', lineHeight: '1.1' }}>{currencySymbol}</td>
            </tr>
          </tbody>
        </table>

        {/* 4. Bottom Table (المدفوع بالأرقام + خصم نقدي + المبلغ بالحروف) */}
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            tableLayout: 'fixed',
            margin: '0',
            backgroundColor: 'transparent'
          }}
        >
          <tbody>
            <tr style={{ height: '24px' }}>
              <td style={{ ...cyanHeaderStyle, borderRight: 'none', borderBottom: 'none', width: '15%' }}>
                المدفوع ({currencySymbol})
              </td>
              <td
                style={{
                  ...cellStyle,
                  borderBottom: 'none',
                  width: '10%',
                  fontWeight: '900',
                  fontSize: '13px',
                  color: royalNavy,
                  backgroundColor: 'rgba(243, 244, 246, 0.65)'
                }}
              >
                {paidAmount}
              </td>
              <td style={{ ...cyanHeaderStyle, borderBottom: 'none', width: '12%' }}>
                خصم نقدي
              </td>
              <td style={{ ...cellStyle, borderBottom: 'none', width: '8%', fontWeight: 'bold', fontSize: '11px', color: royalNavy }}>
                0
              </td>
              <td style={{ ...cyanHeaderStyle, borderBottom: 'none', width: '16%' }}>
                المبلغ بالحروف
              </td>
              <td
                style={{
                  ...cellStyle,
                  borderLeft: 'none',
                  borderBottom: 'none',
                  width: '39%',
                  textAlign: 'right',
                  fontWeight: 'bold',
                  fontSize: '10.5px',
                  paddingRight: '6px'
                }}
              >
                فقط: {tafqeet(paidAmount)} {currencySymbol === 'د.ل' ? 'دينار ليبي' : currencySymbol} لا غير
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 5. Verification & Stamp Footer */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: '100%',
          marginTop: '2px',
          padding: '1px 2px 0 2px',
          boxSizing: 'border-box'
        }}
      >
        {/* Right: Institutional Notice & Contact info */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'right' }}>
          <div style={{ fontSize: '9.5px', color: royalNavy, fontWeight: 'bold', fontStyle: 'italic', lineHeight: '1.2' }}>
            {footerNotice}
          </div>
          <div style={{ fontSize: '7.5px', color: '#64748b', marginTop: '1px', fontWeight: '500', lineHeight: '1.1' }}>
            * إيصال إلكتروني معتمد من منظومة {schoolName} {schoolPhone ? `| هاتف: ${schoolPhone}` : ''} {schoolAddress ? `| ${schoolAddress}` : ''}
          </div>
        </div>

        {/* Left: Stamp & Accreditation Box */}
        <div
          style={{
            width: '110px',
            height: '32px',
            border: `1.5px dashed ${royalNavy}`,
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'transparent',
            color: royalNavy,
            fontSize: '10px',
            fontWeight: 'bold',
            boxSizing: 'border-box',
            whiteSpace: 'nowrap'
          }}
        >
          مكان الختم والاعتماد
        </div>
      </div>

      {/* 6. Perforated Cut Line Divider */}
      {showCutLine && (
        <div 
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            marginTop: '2px',
            paddingTop: '2px',
            borderTop: '1px dashed #64748b',
            color: '#64748b',
            fontSize: '8px',
            fontWeight: 'bold',
            lineHeight: '1'
          }}
        >
          <span>✂</span>
          <span>---------------------------------------------------------------------------------------------------------------------------------</span>
          <span>خط قص</span>
        </div>
      )}
    </div>
  );
};

export default Receipt;
