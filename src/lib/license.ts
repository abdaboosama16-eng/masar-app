/**
 * MASAR Educational Platform - License & Local Activation Service
 * نظام الحماية وإدارة تراخيص منظومة مسار
 */

export interface LicenseInfo {
  isActivated: boolean;
  key: string;
  schoolName: string;
  phone: string;
  activatedAt: string;
  licenseType: 'full' | 'annual' | 'trial';
  expiresAt?: string | null;
}

const LICENSE_STORAGE_KEY = 'masar_license_info';
const BACKUP_FLAG_KEY = 'masar_is_activated';
const SUPPORT_PHONE = '218927211505';

/**
 * Validates whether an activation key is genuine and conforms to MASAR licensing rules.
 * Rule: Must start with "MASAR-2026-" followed by a valid alphanumeric code (minimum 3 chars),
 * or match authorized master/enterprise license tokens.
 */
export function validateLicenseKey(rawKey: string): { valid: boolean; reason?: string } {
  if (!rawKey || typeof rawKey !== 'string') {
    return { valid: false, reason: 'يرجى إدخال رمز التفعيل' };
  }

  const normalized = rawKey.trim().toUpperCase();

  // Pattern requirement: starts with MASAR-2026- and has at least 3 valid chars
  // e.g. MASAR-2026-PRO, MASAR-2026-VIP, MASAR-2026-NOUR, MASAR-2026-8899, MASAR-2026-ADMIN
  const licenseRegex = /^MASAR-2026-[A-Z0-9_-]{3,}$/i;

  if (licenseRegex.test(normalized)) {
    return { valid: true };
  }

  // Also accept master activation keys for developers & offline field deployments
  const authorizedMasterKeys = [
    'MASAR-2026-PRO',
    'MASAR-2026-ADMIN',
    'MASAR-2026-DEV',
    'MASAR-2026-VIP',
    'MASAR-2026-NOUR',
    'MASAR-2026-ALBAYAN',
    'MASAR-2026-ENTERPRISE',
    'MASAR-2026-FULL'
  ];

  if (authorizedMasterKeys.includes(normalized)) {
    return { valid: true };
  }

  return { 
    valid: false, 
    reason: 'رمز التفعيل غير صحيح أو غير متطابق مع النسخة الحالية للمنظومة' 
  };
}

/**
 * Read the current stored license status from LocalStorage.
 */
export function getStoredLicense(): LicenseInfo | null {
  try {
    const raw = localStorage.getItem(LICENSE_STORAGE_KEY);
    if (!raw) {
      // Check legacy / backup flag
      const backupActive = localStorage.getItem(BACKUP_FLAG_KEY);
      if (backupActive === 'true') {
        return {
          isActivated: true,
          key: 'MASAR-2026-RESTORED',
          schoolName: 'المؤسسة التعليمية المعتمدة',
          phone: '+218',
          activatedAt: new Date().toISOString(),
          licenseType: 'full',
          expiresAt: null
        };
      }
      return null;
    }

    const parsed = JSON.parse(raw) as LicenseInfo;
    if (parsed && parsed.isActivated && parsed.key) {
      return parsed;
    }
    return null;
  } catch (error) {
    console.error('Error reading license from storage:', error);
    return null;
  }
}

/**
 * Activate the platform with given details.
 */
export function activatePlatform(key: string, schoolName: string, phone: string): { success: boolean; error?: string; license?: LicenseInfo } {
  const check = validateLicenseKey(key);
  if (!check.valid) {
    return { success: false, error: check.reason || 'رمز التفعيل غير صحيح' };
  }

  if (!phone || phone.trim().length < 6) {
    return { success: false, error: 'يرجى إدخال رقم هاتف التواصل المعتمد للمؤسسة' };
  }

  const cleanKey = key.trim().toUpperCase();
  const cleanSchoolName = schoolName.trim() || 'المؤسسة التعليمية';
  const cleanPhone = phone.trim();

  const licenseData: LicenseInfo = {
    isActivated: true,
    key: cleanKey,
    schoolName: cleanSchoolName,
    phone: cleanPhone,
    activatedAt: new Date().toISOString(),
    licenseType: 'full',
    expiresAt: null
  };

  try {
    localStorage.setItem(LICENSE_STORAGE_KEY, JSON.stringify(licenseData));
    localStorage.setItem(BACKUP_FLAG_KEY, 'true');
    // Dispatch custom event so all active tabs/components can react instantly
    window.dispatchEvent(new Event('masar-license-updated'));
    return { success: true, license: licenseData };
  } catch (error) {
    console.error('Failed to save license:', error);
    return { success: false, error: 'حدث خطأ أثناء حفظ بيانات التفعيل في المتصفح' };
  }
}

/**
 * Revoke or remove license (e.g. for re-licensing or transferring device)
 */
export function deactivatePlatform(): void {
  try {
    localStorage.removeItem(LICENSE_STORAGE_KEY);
    localStorage.removeItem(BACKUP_FLAG_KEY);
    window.dispatchEvent(new Event('masar-license-updated'));
  } catch (error) {
    console.error('Failed to deactivate license:', error);
  }
}

/**
 * Generates WhatsApp quick link to request a license key
 */
export function getWhatsAppActivationRequestUrl(schoolName?: string, phone?: string): string {
  let msg = 'السلام عليكم مهندس، أود طلب رمز تفعيل رسمي لمنظومة مسار التعليمية.';
  if (schoolName?.trim()) {
    msg += `\nالمؤسسة: ${schoolName.trim()}`;
  }
  if (phone?.trim()) {
    msg += `\nهاتف التواصل: ${phone.trim()}`;
  }
  msg += `\nإصدار المنظومة: MASAR 2026 - v2.4`;

  return `https://wa.me/${SUPPORT_PHONE}?text=${encodeURIComponent(msg)}`;
}
