import { useState, useEffect } from 'react';
import defaultLogo from '../logo.png.jpg';

export interface DefaultFees {
  registrationFee: number;   // رسوم التسجيل
  kindergartenFee: number;   // قسط الروضة
  uniformFee: number;        // رسوم الزي المدرسي
  booksFee: number;          // رسوم الكتب والمقررات
  earlyEducationFee: number; // قسط التعليم المبكر
  preparatoryFee: number;    // قسط التأهيلي
}

export type UserRole = 'admin' | 'cashier';

export interface LocalUser {
  id: string;
  name: string;
  username: string;
  pin: string;
  role: UserRole; // 'admin' (مدير نظام كامل الصلاحيات) | 'cashier' (موظف إدخال وتحصيل بدون صلاحية الحذف)
  createdAt: string;
  active: boolean;
}

export interface SystemSettings {
  requireLogin?: boolean;
  academicYears: string[];
  activeAcademicYear: string;
  defaultFees: DefaultFees;
  schoolName: string;
  schoolNameEn: string;
  schoolType: string;
  phone: string;
  address: string;
  logo: string;
  currency: string;
  currencyPosition: 'after' | 'before';
  whatsappTemplate: string;
  receiptFooterNotice: string;
  users: LocalUser[];
  activeUserId?: string;
  subscriptionPlan: 'pro' | 'enterprise';
}

export interface SchoolSettings extends SystemSettings {
  academicYear: string;      // Synced with activeAcademicYear
}

export const DEFAULT_FEES: DefaultFees = {
  registrationFee: 200,
  kindergartenFee: 1400,
  uniformFee: 150,
  booksFee: 150,
  earlyEducationFee: 1300,
  preparatoryFee: 1400
};

export const DEFAULT_ACADEMIC_YEARS: string[] = ['2024/2025', '2025/2026', '2026/2027'];
export const DEFAULT_ACTIVE_YEAR = '2025/2026';

export const DEFAULT_USERS: LocalUser[] = [
  {
    id: 'user-admin-1',
    name: 'مدير النظام الرئيسي',
    username: 'admin',
    pin: '1234',
    role: 'admin',
    createdAt: '2025-01-01',
    active: true
  },
  {
    id: 'user-cashier-1',
    name: 'أمين الخزينة والتحصيل',
    username: 'cashier',
    pin: '0000',
    role: 'cashier',
    createdAt: '2025-01-01',
    active: true
  }
];

export const DEFAULT_WHATSAPP_TEMPLATE = `السلام عليكم ورحمة الله وبركاته،
ولي أمر الطالب المحترم: {studentName}
نود تذكيركم بلطف بسقوط قسط دراسي مستحق بقيمة {amount} {currency} لدى {schoolName}.
نأمل منكم التكرم بمراجعة الإدارة المالية للسداد في أقرب وقت.
نسعد دائماً بثقتكم وتواصلكم الطيب.`;

export const DEFAULT_SETTINGS: SchoolSettings = {
  requireLogin: false,
  schoolName: 'منظومة مسار',
  schoolNameEn: 'MASAR SYSTEM',
  schoolType: 'للتعليم الخاص ورياض الأطفال',
  phone: '',
  address: '',
  logo: defaultLogo,
  academicYear: DEFAULT_ACTIVE_YEAR,
  activeAcademicYear: DEFAULT_ACTIVE_YEAR,
  academicYears: DEFAULT_ACADEMIC_YEARS,
  defaultFees: DEFAULT_FEES,
  currency: 'د.ل',
  currencyPosition: 'after',
  whatsappTemplate: DEFAULT_WHATSAPP_TEMPLATE,
  receiptFooterNotice: 'نسعد بثقتكم.. منظومة مسار تتمنى لكم عاماً دراسياً موفقاً',
  users: DEFAULT_USERS,
  activeUserId: 'user-admin-1',
  subscriptionPlan: 'pro'
};

const SYSTEM_STORAGE_KEY = 'systemSettings';
const LEGACY_STORAGE_KEY = 'masar_school_settings';
const SETTINGS_EVENT = 'masar_settings_changed';

/**
 * Retrieves the currently saved system & school settings, merging with defaults
 */
export function getSchoolSettings(): SchoolSettings {
  if (typeof window === 'undefined') {
    return DEFAULT_SETTINGS;
  }
  try {
    let systemData: Partial<SystemSettings> = {};
    let schoolData: Partial<SchoolSettings> = {};

    // 1. Try reading systemSettings (primary key requested)
    const rawSystem = localStorage.getItem(SYSTEM_STORAGE_KEY);
    if (rawSystem) {
      try {
        systemData = JSON.parse(rawSystem);
      } catch (e) {
        console.error('Error parsing systemSettings:', e);
      }
    }

    // 2. Try reading legacy/school settings
    const rawLegacy = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (rawLegacy) {
      try {
        schoolData = JSON.parse(rawLegacy);
      } catch (e) {
        console.error('Error parsing masar_school_settings:', e);
      }
    }

    const mergedFees: DefaultFees = {
      ...DEFAULT_FEES,
      ...(schoolData.defaultFees || {}),
      ...(systemData.defaultFees || {})
    };

    const academicYears = (systemData.academicYears && systemData.academicYears.length > 0)
      ? systemData.academicYears
      : (schoolData.academicYears && schoolData.academicYears.length > 0)
        ? schoolData.academicYears
        : DEFAULT_ACADEMIC_YEARS;

    const activeAcademicYear = systemData.activeAcademicYear 
      || schoolData.activeAcademicYear 
      || schoolData.academicYear 
      || DEFAULT_ACTIVE_YEAR;

    const users = (systemData.users && systemData.users.length > 0)
      ? systemData.users
      : (schoolData.users && schoolData.users.length > 0)
        ? schoolData.users
        : DEFAULT_USERS;

    const activeUserId = systemData.activeUserId || schoolData.activeUserId || users[0]?.id || 'user-admin-1';

    const merged: SchoolSettings = {
      ...DEFAULT_SETTINGS,
      ...schoolData,
      ...systemData,
      academicYears,
      activeAcademicYear,
      academicYear: activeAcademicYear,
      defaultFees: mergedFees,
      users,
      activeUserId,
      subscriptionPlan: systemData.subscriptionPlan || schoolData.subscriptionPlan || DEFAULT_SETTINGS.subscriptionPlan,
      currency: systemData.currency || schoolData.currency || DEFAULT_SETTINGS.currency,
      currencyPosition: systemData.currencyPosition || schoolData.currencyPosition || DEFAULT_SETTINGS.currencyPosition,
      whatsappTemplate: systemData.whatsappTemplate || schoolData.whatsappTemplate || DEFAULT_WHATSAPP_TEMPLATE,
      receiptFooterNotice: systemData.receiptFooterNotice || schoolData.receiptFooterNotice || DEFAULT_SETTINGS.receiptFooterNotice,
      logo: (systemData.logo && systemData.logo.trim() !== '')
        ? systemData.logo
        : (schoolData.logo && schoolData.logo.trim() !== '')
          ? schoolData.logo
          : defaultLogo
    };

    return merged;
  } catch (err) {
    console.error('Error loading school settings:', err);
    return DEFAULT_SETTINGS;
  }
}

/**
 * Saves updated school & system settings to localStorage and dispatches change events
 */
export function saveSchoolSettings(updates: Partial<SchoolSettings>): SchoolSettings {
  try {
    const current = getSchoolSettings();
    const activeYear = updates.activeAcademicYear || updates.academicYear || current.activeAcademicYear;

    const merged: SchoolSettings = {
      ...current,
      ...updates,
      academicYear: activeYear,
      activeAcademicYear: activeYear,
      defaultFees: {
        ...current.defaultFees,
        ...(updates.defaultFees || {})
      },
      academicYears: updates.academicYears && updates.academicYears.length > 0
        ? updates.academicYears
        : current.academicYears,
      users: updates.users && updates.users.length > 0
        ? updates.users
        : current.users
    };

    // 1. Save unified systemSettings object to localStorage
    const systemPayload: SystemSettings = {
      requireLogin: merged.requireLogin,
      academicYears: merged.academicYears,
      activeAcademicYear: merged.activeAcademicYear,
      defaultFees: merged.defaultFees,
      schoolName: merged.schoolName,
      schoolNameEn: merged.schoolNameEn,
      schoolType: merged.schoolType,
      phone: merged.phone,
      address: merged.address,
      logo: merged.logo,
      currency: merged.currency,
      currencyPosition: merged.currencyPosition,
      whatsappTemplate: merged.whatsappTemplate,
      receiptFooterNotice: merged.receiptFooterNotice,
      users: merged.users,
      activeUserId: merged.activeUserId,
      subscriptionPlan: merged.subscriptionPlan
    };
    localStorage.setItem(SYSTEM_STORAGE_KEY, JSON.stringify(systemPayload));

    // 2. Save full settings to masar_school_settings for backward compatibility
    localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(merged));

    // 3. Dispatch events for reactive updates across the entire application
    window.dispatchEvent(new CustomEvent(SETTINGS_EVENT, { detail: merged }));
    window.dispatchEvent(new CustomEvent('systemSettingsChanged', { detail: systemPayload }));
    window.dispatchEvent(new CustomEvent('academicYearChanged', { detail: merged.activeAcademicYear }));
    window.dispatchEvent(new CustomEvent('userRoleChanged', { detail: merged.activeUserId }));

    return merged;
  } catch (err) {
    console.error('Error saving school settings:', err);
    return getSchoolSettings();
  }
}

/**
 * Gets the current active user from system settings
 */
export function getCurrentActiveUser(): LocalUser {
  const settings = getSchoolSettings();
  const found = settings.users?.find(u => u.id === settings.activeUserId);
  return found || settings.users?.[0] || DEFAULT_USERS[0];
}

/**
 * Checks if current active user has specific permission
 */
export function hasUserPermission(action: 'delete' | 'settings' | 'manage_users' | 'export'): boolean {
  const user = getCurrentActiveUser();
  if (user.role === 'admin') return true;
  if (action === 'delete') return false; // Cashier cannot delete
  if (action === 'manage_users') return false;
  return true;
}

/**
 * Helper to format amount with custom or default currency
 */
export function formatAmountCurrency(
  amount: number | string, 
  customSettings?: { currency?: string; currencyPosition?: 'after' | 'before' }
): string {
  const settings = customSettings || getSchoolSettings();
  const num = Number(amount || 0);
  const formattedNum = num.toLocaleString('en-US');
  const cur = settings.currency || 'د.ل';
  const pos = settings.currencyPosition || 'after';

  if (pos === 'before') {
    return `${cur} ${formattedNum}`;
  }
  return `${formattedNum} ${cur}`;
}

/**
 * Custom React hook that subscribes to system & school settings changes across the entire app
 */
export function useSchoolSettings(): {
  settings: SchoolSettings;
  updateSettings: (updates: Partial<SchoolSettings>) => void;
  resetSettings: () => void;
} {
  const [settings, setSettings] = useState<SchoolSettings>(getSchoolSettings);

  useEffect(() => {
    const handleSettingsChange = (e: Event) => {
      const customEvent = e as CustomEvent<SchoolSettings>;
      if (customEvent.detail) {
        setSettings(customEvent.detail);
      } else {
        setSettings(getSchoolSettings());
      }
    };

    window.addEventListener(SETTINGS_EVENT, handleSettingsChange);
    window.addEventListener('systemSettingsChanged', () => {
      setSettings(getSchoolSettings());
    });
    window.addEventListener('storage', (e) => {
      if (e.key === SYSTEM_STORAGE_KEY || e.key === LEGACY_STORAGE_KEY) {
        setSettings(getSchoolSettings());
      }
    });

    return () => {
      window.removeEventListener(SETTINGS_EVENT, handleSettingsChange);
    };
  }, []);

  const updateSettings = (updates: Partial<SchoolSettings>) => {
    const saved = saveSchoolSettings(updates);
    setSettings(saved);
  };

  const resetSettings = () => {
    localStorage.removeItem(SYSTEM_STORAGE_KEY);
    localStorage.removeItem(LEGACY_STORAGE_KEY);
    window.dispatchEvent(new CustomEvent(SETTINGS_EVENT, { detail: DEFAULT_SETTINGS }));
    setSettings(DEFAULT_SETTINGS);
  };

  return {
    settings,
    updateSettings,
    resetSettings
  };
}

export interface AuditLogEntry {
  id: string;
  userId: string;
  userName: string;
  action: string;
  details: string;
  timestamp: string;
}

const AUDIT_LOG_STORAGE_KEY = 'masar_audit_logs';

export function getAuditLogs(): AuditLogEntry[] {
  try {
    const data = localStorage.getItem(AUDIT_LOG_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (err) {
    return [];
  }
}

export function addAuditLog(action: string, details: string) {
  try {
    const logs = getAuditLogs();
    const user = getCurrentActiveUser();
    const entry: AuditLogEntry = {
      id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
      userId: user.id,
      userName: user.name,
      action,
      details,
      timestamp: new Date().toISOString()
    };
    logs.unshift(entry);
    // Keep only last 100 logs
    if (logs.length > 100) logs.length = 100;
    localStorage.setItem(AUDIT_LOG_STORAGE_KEY, JSON.stringify(logs));
  } catch (err) {
    console.error('Failed to save audit log', err);
  }
}
