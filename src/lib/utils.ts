import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { getSchoolSettings, DEFAULT_WHATSAPP_TEMPLATE } from './settings';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a Libyan phone number into international standard 218XXXXXXXXX (without leading + or 0)
 */
export function formatLibyanPhoneNumber(phone: string): string {
  if (!phone) return '';
  // Remove spaces, hyphens, plus signs, parentheses and any non-numeric characters
  let cleaned = phone.replace(/\D/g, '');
  
  // If starts with 00218, remove leading 00
  if (cleaned.startsWith('00218')) {
    cleaned = cleaned.substring(2);
  }
  // If starts with 0 (e.g. 0912345678), remove 0 and prepend 218
  else if (cleaned.startsWith('0')) {
    cleaned = '218' + cleaned.substring(1);
  }
  // If already starts with 218, keep it
  else if (cleaned.startsWith('218')) {
    // already in 218 format
  }
  // If starts with 9 (e.g. 912345678, 92..., etc.), prepend 218
  else if (cleaned.length >= 8) {
    cleaned = '218' + cleaned;
  }
  
  return cleaned;
}

/**
 * Renders a customizable WhatsApp reminder template with dynamic placeholders
 * Supported placeholders:
 * {studentName}, {amount}, {schoolName}, {currency}, {grade}, {dueDate}
 */
export function renderWhatsAppTemplate(
  template: string,
  variables: {
    studentName?: string;
    amount?: number | string;
    remainingAmount?: number | string;
    schoolName?: string;
    currency?: string;
    grade?: string;
    dueDate?: string;
  }
): string {
  const settings = getSchoolSettings();
  let text = template || settings.whatsappTemplate || DEFAULT_WHATSAPP_TEMPLATE;
  const rawAmount = variables.amount !== undefined ? variables.amount : (variables.remainingAmount !== undefined ? variables.remainingAmount : '0');

  const replacements: Record<string, string> = {
    '{studentName}': variables.studentName || 'الطالب',
    '{student_name}': variables.studentName || 'الطالب',
    '{amount}': String(rawAmount),
    '{remainingAmount}': String(rawAmount),
    '{remaining}': String(rawAmount),
    '{schoolName}': variables.schoolName || settings.schoolName || 'مدرسة نور البيان',
    '{school_name}': variables.schoolName || settings.schoolName || 'مدرسة نور البيان',
    '{currency}': variables.currency || settings.currency || 'د.ل',
    '{grade}': variables.grade || '',
    '{dueDate}': variables.dueDate || new Date().toISOString().split('T')[0],
    '{due_date}': variables.dueDate || new Date().toISOString().split('T')[0]
  };

  for (const [key, value] of Object.entries(replacements)) {
    text = text.split(key).join(value);
  }

  return text;
}

/**
 * Generates direct WhatsApp click-to-chat URL with an official polite reminder message
 */
export function getWhatsAppReminderUrl(
  phone: string,
  studentName: string,
  remainingAmount: number,
  options?: {
    customSchoolName?: string;
    grade?: string;
    template?: string;
    currency?: string;
  } | string
): string {
  const settings = getSchoolSettings();
  const opts = typeof options === 'string' ? { customSchoolName: options } : (options || {});
  
  const schoolName = opts.customSchoolName || settings.schoolName || 'المؤسسة التعليمية';
  const currency = opts.currency || settings.currency || 'د.ل';
  const template = opts.template || settings.whatsappTemplate || DEFAULT_WHATSAPP_TEMPLATE;
  const formattedPhone = formatLibyanPhoneNumber(phone);
  
  const message = renderWhatsAppTemplate(template, {
    studentName,
    amount: remainingAmount,
    schoolName,
    currency,
    grade: opts.grade
  });

  return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
}

