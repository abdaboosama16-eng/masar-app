import React from 'react';
import { Invoice, InvoiceData, InvoiceProps, A4ThreeReceiptVoucher } from './Invoice';

export interface ReceiptProps extends InvoiceProps {
  receiptData?: InvoiceData | null;
}

/**
 * Standard Receipt component for MASAR, utilizing the precision-engineered Invoice engine.
 */
export const Receipt: React.FC<ReceiptProps> = ({
  receiptData,
  invoiceData,
  settings,
  copyLabel,
  showCutLine = false,
  className
}) => {
  const data = invoiceData || receiptData;
  if (!data) return null;

  return (
    <Invoice
      invoiceData={data}
      settings={settings}
      copyLabel={copyLabel}
      showCutLine={showCutLine}
      className={className}
    />
  );
};

export { A4ThreeReceiptVoucher };
export default Receipt;
