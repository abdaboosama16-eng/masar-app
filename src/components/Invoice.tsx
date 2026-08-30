import React from 'react';
import { Student } from '../types';
import { tafqeet } from '../lib/tafqeet';
import { getSchoolSettings, SchoolSettings } from '../lib/settings';

export interface InvoiceData {
  student?: Student;
  paidAmount?: number;
  remainingAmount?: number;
  discount?: number;
  notes?: string;
  receiptNo?: string | number;
  date?: string;
  previousPaid?: number;
  previousPaymentsCount?: number;
  academicYear?: string;
  feesBreakdown?: {
    tuitionPaid?: number;
    tuitionRemaining?: number;
    transportPaid?: number;
    transportRemaining?: number;
    booksPaid?: number;
    booksRemaining?: number;
    uniformPaid?: number;
    uniformRemaining?: number;
  };
}

export interface InvoiceProps {
  invoiceData?: InvoiceData | null;
  settings?: SchoolSettings;
  copyLabel?: string;
  showCutLine?: boolean;
  className?: string;
}

/**
 * Precision Engineered 1/3 A4 Financial Receipt / Voucher Component (سند قبض مالي).
 * Exactly 202mm width × 97mm height to fit 3 identical vouchers perfectly on a single A4 sheet without overflow.
 */
export const Invoice: React.FC<InvoiceProps> = ({
  invoiceData,
  settings: customSettings,
  copyLabel,
  showCutLine = false,
  className = ''
}) => {
  if (!invoiceData) {
    return null;
  }

  const schoolSettings = customSettings || getSchoolSettings();
  const schoolName = schoolSettings.schoolName || 'منظومة مسار التعليمية';
  const schoolNameEn = schoolSettings.schoolNameEn || 'MASAR EDUCATIONAL PLATFORM';
  const schoolPhone = schoolSettings.phone;
  const schoolAddress = schoolSettings.address;
  const currencySymbol = schoolSettings.currency || 'د.ل';
  const logoImage = schoolSettings.logo;

  const studentName = invoiceData.student?.name || 'اسم الطالب';
  const studentGrade = invoiceData.student?.grade || 'الروضة';
  const studentPeriod = invoiceData.student?.period || 'صباحي';
  const receiptNo = invoiceData.receiptNo ?? '001';
  const paidAmount = Number(invoiceData.paidAmount ?? 0);
  const remainingAmount = Number(invoiceData.remainingAmount ?? 0);
  const discount = Number(invoiceData.discount ?? invoiceData.student?.discount ?? 0);
  const date = invoiceData.date || new Date().toISOString().split('T')[0].replace(/-/g, '/');
  const academicYear = invoiceData.academicYear || '2025/2026';

  // Dynamic calculation for payment purpose
  const getPaymentPurpose = (): string => {
    if (invoiceData.notes && invoiceData.notes.trim()) {
      return invoiceData.notes;
    }

    const totalFees = Number(
      invoiceData.student?.final_fees ||
      invoiceData.student?.base_fees ||
      (paidAmount + remainingAmount) ||
      0
    );

    const prevPaid = invoiceData.previousPaid !== undefined
      ? Number(invoiceData.previousPaid)
      : (invoiceData.student?.total_paid !== undefined
          ? (invoiceData.student.total_paid > paidAmount
              ? invoiceData.student.total_paid - paidAmount
              : (invoiceData.student.total_paid === paidAmount && remainingAmount === 0
                  ? 0
                  : Number(invoiceData.student.total_paid)))
          : 0);

    const prevCount = invoiceData.previousPaymentsCount !== undefined
      ? invoiceData.previousPaymentsCount
      : (prevPaid > 0 ? 1 : 0);

    const isFullPayment =
      (totalFees > 0 && (paidAmount + prevPaid) >= totalFees) ||
      (totalFees > 0 && paidAmount >= totalFees) ||
      (remainingAmount === 0 && paidAmount > 0);

    if (isFullPayment) {
      return 'القسط الدراسي كاملاً (خلو طرف)';
    }

    if (paidAmount < totalFees && (prevCount === 0 || prevPaid === 0)) {
      return 'القسط الدراسي الأول';
    }

    if (paidAmount < totalFees && prevCount === 1) {
      return 'القسط الدراسي الثاني';
    }

    return 'دفعة من الرسوم الدراسية';
  };

  const fees = invoiceData.feesBreakdown || {
    tuitionPaid: paidAmount,
    tuitionRemaining: remainingAmount,
    transportPaid: 0,
    transportRemaining: 0,
    booksPaid: 0,
    booksRemaining: 0,
    uniformPaid: 0,
    uniformRemaining: 0
  };

  return (
    <div
      className={`invoice-voucher-root receipt-wrapper relative overflow-hidden flex flex-col justify-between ${className}`}
      style={{
        position: 'relative',
        width: '202mm',
        maxWidth: '202mm',
        height: '97mm',
        maxHeight: '97mm',
        margin: '0 auto',
        padding: '2mm 3.5mm 1.5mm 3.5mm',
        boxSizing: 'border-box',
        overflow: 'hidden',
        backgroundColor: '#ffffff',
        color: '#000000',
        direction: 'rtl',
        fontFamily: "'Tajawal', 'Cairo', Tahoma, Arial, sans-serif",
        pageBreakInside: 'avoid',
        breakInside: 'avoid',
        WebkitPrintColorAdjust: 'exact',
        printColorAdjust: 'exact'
      }}
    >
      {/* 1. Official Header */}
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
          borderBottom: '2px solid #000000'
        }}
      >
        {/* Right: Institutional Name in Arabic & English */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', minWidth: '150px' }}>
          <div style={{ fontWeight: '900', fontSize: '13px', color: '#000000', lineHeight: '1.15' }}>
            {schoolName}
          </div>
          <div style={{ fontSize: '8px', color: '#1e293b', fontWeight: 'bold', letterSpacing: '0.3px', lineHeight: '1.2' }}>
            {schoolNameEn}
          </div>
          {schoolPhone && (
            <div style={{ fontSize: '7.5px', color: '#475569', fontWeight: '600' }} dir="ltr">
              Tel: {schoolPhone}
            </div>
          )}
        </div>

        {/* Center: Title Pill + Optional Copy Label */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1px' }}>
          <div
            style={{
              backgroundColor: '#f1f5f9',
              border: '1.5px solid #000000',
              borderRadius: '6px',
              padding: '2px 16px',
              textAlign: 'center'
            }}
          >
            <span style={{ fontSize: '12px', fontWeight: '900', color: '#000000', whiteSpace: 'nowrap', lineHeight: '1.2' }}>
              سند قبض مالي (إيصال استلام)
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '1px' }}>
            {copyLabel && (
              <span style={{ fontSize: '9px', fontWeight: '900', color: '#1e3a8a', backgroundColor: '#e0e7ff', padding: '0 6px', borderRadius: '4px', border: '0.5px solid #1e3a8a' }}>
                {copyLabel}
              </span>
            )}
            <span style={{ fontSize: '8.5px', color: '#475569', fontWeight: 'bold' }}>
              العام الدراسي: {academicYear}
            </span>
          </div>
        </div>

        {/* Left: Logo & Receipt Number Tag */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '150px', justifyContent: 'flex-end' }}>
          <div style={{ textAlign: 'left', direction: 'ltr' }}>
            <div style={{ fontSize: '7.5px', color: '#64748b', fontWeight: 'bold' }}>RECEIPT NO.</div>
            <div style={{ fontSize: '13px', fontWeight: '900', color: '#b91c1c', fontFamily: 'monospace', lineHeight: '1' }}>
              #{String(receiptNo).padStart(4, '0')}
            </div>
          </div>
          {logoImage && (
            <img
              src={logoImage}
              alt={schoolName}
              style={{ width: '36px', height: '36px', objectFit: 'contain' }}
              referrerPolicy="no-referrer"
            />
          )}
        </div>
      </div>

      {/* Main Tables Bordered Block with Watermark */}
      <div
        style={{
          position: 'relative',
          overflow: 'hidden',
          zIndex: 1,
          border: '1.5px solid #000000',
          width: '100%',
          margin: '0px',
          boxSizing: 'border-box',
          backgroundColor: 'transparent',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Subtle Security Watermark */}
        {logoImage && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '100px',
              height: '100px',
              pointerEvents: 'none',
              zIndex: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: 0.06
            }}
          >
            <img
              src={logoImage}
              alt="Watermark"
              style={{ width: '100px', height: '100px', objectFit: 'contain' }}
              referrerPolicy="no-referrer"
            />
          </div>
        )}

        {/* 2. Top Student & Payment Details Table */}
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            tableLayout: 'fixed',
            margin: '0',
            backgroundColor: 'transparent',
            fontSize: '11px'
          }}
        >
          <thead>
            <tr style={{ height: '20px', backgroundColor: '#f8fafc', borderBottom: '1px solid #000000' }}>
              <th style={{ width: '34%', borderLeft: '1px solid #000000', padding: '2px 4px', textAlign: 'center', fontWeight: '900' }}>
                استلمنا من الطالب / ولي الأمر
              </th>
              <th style={{ width: '18%', borderLeft: '1px solid #000000', padding: '2px 4px', textAlign: 'center', fontWeight: '900' }}>
                الصف / المرحلة
              </th>
              <th style={{ width: '15%', borderLeft: '1px solid #000000', padding: '2px 4px', textAlign: 'center', fontWeight: '900' }}>
                تاريخ السداد
              </th>
              <th style={{ width: '33%', padding: '2px 4px', textAlign: 'center', fontWeight: '900' }}>
                البيان / وذلك عن قيمة
              </th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ height: '22px' }}>
              <td style={{ borderLeft: '1px solid #000000', padding: '2px 6px', textAlign: 'right', fontWeight: 'bold', fontSize: '11.5px' }}>
                {studentName}
              </td>
              <td style={{ borderLeft: '1px solid #000000', padding: '2px 4px', textAlign: 'center', fontWeight: 'bold', fontSize: '10.5px' }}>
                {studentGrade} ({studentPeriod})
              </td>
              <td style={{ borderLeft: '1px solid #000000', padding: '2px 4px', textAlign: 'center', fontWeight: 'bold', fontSize: '10.5px', fontFamily: 'monospace' }}>
                {date}
              </td>
              <td style={{ padding: '2px 6px', textAlign: 'center', fontWeight: 'bold', fontSize: '10.5px', color: '#1e3a8a' }}>
                {getPaymentPurpose()}
              </td>
            </tr>
          </tbody>
        </table>

        {/* 3. Detailed Financial Items Grid */}
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            tableLayout: 'fixed',
            margin: '0',
            borderTop: '1px solid #000000',
            backgroundColor: 'transparent',
            fontSize: '10.5px'
          }}
        >
          <thead>
            {/* Category Names */}
            <tr style={{ height: '18px', backgroundColor: '#f1f5f9', borderBottom: '1px solid #000000' }}>
              <th colSpan={2} style={{ borderLeft: '1px solid #000000', padding: '1px 2px', textAlign: 'center', fontWeight: '900', color: '#0f172a' }}>
                الرسوم الدراسية
              </th>
              <th colSpan={2} style={{ borderLeft: '1px solid #000000', padding: '1px 2px', textAlign: 'center', fontWeight: '900', color: '#0f172a' }}>
                رسوم المواصلات
              </th>
              <th colSpan={2} style={{ borderLeft: '1px solid #000000', padding: '1px 2px', textAlign: 'center', fontWeight: '900', color: '#0f172a' }}>
                رسوم الكتب
              </th>
              <th colSpan={2} style={{ padding: '1px 2px', textAlign: 'center', fontWeight: '900', color: '#0f172a' }}>
                رسوم الزي المدرسي
              </th>
            </tr>
            {/* Sub headers */}
            <tr style={{ height: '17px', backgroundColor: '#ffffff', borderBottom: '1px solid #000000', fontSize: '9px' }}>
              <th style={{ borderLeft: '1px solid #000000', width: '12.5%', padding: '1px' }}>المدفوع</th>
              <th style={{ borderLeft: '1px solid #000000', width: '12.5%', padding: '1px' }}>المتبقي</th>
              <th style={{ borderLeft: '1px solid #000000', width: '12.5%', padding: '1px' }}>المدفوع</th>
              <th style={{ borderLeft: '1px solid #000000', width: '12.5%', padding: '1px' }}>المتبقي</th>
              <th style={{ borderLeft: '1px solid #000000', width: '12.5%', padding: '1px' }}>المدفوع</th>
              <th style={{ borderLeft: '1px solid #000000', width: '12.5%', padding: '1px' }}>المتبقي</th>
              <th style={{ borderLeft: '1px solid #000000', width: '12.5%', padding: '1px' }}>المدفوع</th>
              <th style={{ width: '12.5%', padding: '1px' }}>المتبقي</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ height: '21px', textAlign: 'center', fontWeight: 'bold' }}>
              <td style={{ borderLeft: '1px solid #000000', color: '#047857', fontSize: '11px' }}>
                {fees.tuitionPaid || paidAmount} <span style={{ fontSize: '8px' }}>{currencySymbol}</span>
              </td>
              <td style={{ borderLeft: '1px solid #000000', color: '#b91c1c', fontSize: '11px' }}>
                {fees.tuitionRemaining || remainingAmount} <span style={{ fontSize: '8px' }}>{currencySymbol}</span>
              </td>
              <td style={{ borderLeft: '1px solid #000000', color: '#64748b', fontSize: '10px' }}>
                {fees.transportPaid || 0}
              </td>
              <td style={{ borderLeft: '1px solid #000000', color: '#64748b', fontSize: '10px' }}>
                {fees.transportRemaining || 0}
              </td>
              <td style={{ borderLeft: '1px solid #000000', color: '#64748b', fontSize: '10px' }}>
                {fees.booksPaid || 0}
              </td>
              <td style={{ borderLeft: '1px solid #000000', color: '#64748b', fontSize: '10px' }}>
                {fees.booksRemaining || 0}
              </td>
              <td style={{ borderLeft: '1px solid #000000', color: '#64748b', fontSize: '10px' }}>
                {fees.uniformPaid || 0}
              </td>
              <td style={{ color: '#64748b', fontSize: '10px' }}>
                {fees.uniformRemaining || 0}
              </td>
            </tr>
          </tbody>
        </table>

        {/* 4. Bottom Summary: Paid in Cash + Discount + Tafqeet in Arabic */}
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            tableLayout: 'fixed',
            margin: '0',
            borderTop: '1.5px solid #000000',
            backgroundColor: 'transparent'
          }}
        >
          <tbody>
            <tr style={{ height: '22px' }}>
              <td style={{ width: '16%', backgroundColor: '#f1f5f9', borderLeft: '1px solid #000000', fontWeight: '900', fontSize: '10px', textAlign: 'center', padding: '1px 3px' }}>
                المسدد نقداً ({currencySymbol})
              </td>
              <td style={{ width: '11%', borderLeft: '1px solid #000000', fontWeight: '900', fontSize: '12px', textAlign: 'center', color: '#047857', backgroundColor: '#f0fdf4' }}>
                {paidAmount}
              </td>
              <td style={{ width: '11%', backgroundColor: '#f1f5f9', borderLeft: '1px solid #000000', fontWeight: 'bold', fontSize: '10px', textAlign: 'center', padding: '1px 2px' }}>
                الخصم الممنوح
              </td>
              <td style={{ width: '8%', borderLeft: '1px solid #000000', fontWeight: 'bold', fontSize: '11px', textAlign: 'center', color: '#000000' }}>
                {discount}
              </td>
              <td style={{ width: '14%', backgroundColor: '#f1f5f9', borderLeft: '1px solid #000000', fontWeight: '900', fontSize: '10px', textAlign: 'center', padding: '1px 2px' }}>
                المبلغ بالحروف
              </td>
              <td style={{ width: '40%', padding: '1px 6px', textAlign: 'right', fontWeight: 'bold', fontSize: '10px', color: '#0f172a' }}>
                فقط: {tafqeet(paidAmount)} {currencySymbol === 'د.ل' ? 'دينار ليبي' : currencySymbol} لا غير
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 5. Footer / Signatures / Stamp and Barcode Strip */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: '100%',
          marginTop: '1.5px',
          padding: '0 2px',
          boxSizing: 'border-box'
        }}
      >
        {/* Right: Signature Lines */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '18px', fontSize: '9.5px', fontWeight: 'bold' }}>
          <div>
            <span>المستلم (المحاسب): </span>
            <span style={{ borderBottom: '1px dotted #000', display: 'inline-block', width: '85px' }}></span>
          </div>
          <div>
            <span>توقيع ولي الأمر: </span>
            <span style={{ borderBottom: '1px dotted #000', display: 'inline-block', width: '85px' }}></span>
          </div>
        </div>

        {/* Center: Notice & Address */}
        <div style={{ textAlign: 'center', fontSize: '7.5px', color: '#475569', fontWeight: 'bold' }}>
          <span>* إيصال إلكتروني معتمد من منظومة {schoolName}</span>
          {schoolAddress && <span> | {schoolAddress}</span>}
        </div>

        {/* Left: Official Stamp Box */}
        <div
          style={{
            width: '95px',
            height: '24px',
            border: '1px dashed #000000',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#fafafa',
            color: '#000000',
            fontSize: '8.5px',
            fontWeight: 'bold',
            boxSizing: 'border-box',
            whiteSpace: 'nowrap'
          }}
        >
          ختم المؤسسة الرسمي
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
            marginTop: '1.5px',
            paddingTop: '1px',
            borderTop: '1px dashed #64748b',
            color: '#64748b',
            fontSize: '7.5px',
            fontWeight: 'bold',
            lineHeight: '1'
          }}
        >
          <span>✂</span>
          <span>-----------------------------------------------------------------------------------------------------------------------------</span>
          <span>خط فصل الإيصال</span>
        </div>
      )}
    </div>
  );
};

/**
 * 3-in-1 A4 Sheet Voucher (أصل نسختين + صورة)
 * Renders 3 stacked vouchers strictly formatted to fill 1 single A4 portrait page (297mm height).
 */
export const A4ThreeReceiptVoucher: React.FC<{
  invoiceData: InvoiceData;
  settings?: SchoolSettings;
}> = ({ invoiceData, settings }) => {
  return (
    <div
      className="receipt-print-container flex flex-col items-center justify-between m-0 p-0"
      style={{
        width: '210mm',
        maxWidth: '210mm',
        height: '295mm',
        maxHeight: '295mm',
        margin: '0 auto',
        padding: '0.5mm 0',
        boxSizing: 'border-box',
        overflow: 'hidden',
        pageBreakAfter: 'avoid',
        breakAfter: 'avoid',
        direction: 'rtl'
      }}
    >
      <Invoice
        invoiceData={invoiceData}
        settings={settings}
        copyLabel="أصل (نسخة الإدارة)"
        showCutLine={true}
      />
      <Invoice
        invoiceData={invoiceData}
        settings={settings}
        copyLabel="صورة (نسخة الحسابات)"
        showCutLine={true}
      />
      <Invoice
        invoiceData={invoiceData}
        settings={settings}
        copyLabel="صورة (نسخة ولي الأمر)"
        showCutLine={false}
      />
    </div>
  );
};

export default Invoice;
