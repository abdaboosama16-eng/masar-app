/**
 * MASAR Platform - Local Authentication & Permission Management
 * إدارة جلسات الدخول وصلاحيات المستخدمين المحلية (Session & RBAC)
 */

import { LocalUser, UserRole, getSchoolSettings } from './settings';

const SESSION_STORAGE_KEY = 'masar_active_session';
const AUTH_EVENT_NAME = 'masar_auth_changed';

export interface ActiveSession {
  user: LocalUser;
  loggedInAt: string;
}

/**
 * Get current authenticated user from sessionStorage
 */
export function getActiveSessionUser(): LocalUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    const session: ActiveSession = JSON.parse(raw);
    if (session && session.user && session.user.id) {
      return session.user;
    }
    return null;
  } catch (err) {
    console.error('Error reading session:', err);
    return null;
  }
}

/**
 * Set active user in sessionStorage
 */
export function setActiveSessionUser(user: LocalUser): void {
  if (typeof window === 'undefined') return;
  try {
    const session: ActiveSession = {
      user,
      loggedInAt: new Date().toISOString()
    };
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    window.dispatchEvent(new Event(AUTH_EVENT_NAME));
  } catch (err) {
    console.error('Error saving session:', err);
  }
}

/**
 * Clear active session (Logout)
 */
export function clearActiveSession(): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
    window.dispatchEvent(new Event(AUTH_EVENT_NAME));
  } catch (err) {
    console.error('Error clearing session:', err);
  }
}

/**
 * Authenticate credentials against configured users in settings or built-in defaults.
 * Accepts:
 * - Admin: 'admin123', '1234', or configured PIN in Settings
 * - Staff / Cashier: 'staff123', '0000', 'cashier123', or configured PIN in Settings
 */
export function authenticateUser(
  usernameOrRole: string,
  passwordOrPin: string
): { success: boolean; user?: LocalUser; error?: string } {
  const cleanInput = (passwordOrPin || '').trim();
  const cleanIdentifier = (usernameOrRole || '').trim().toLowerCase();

  if (!cleanInput) {
    return { success: false, error: 'يرجى إدخال كلمة المرور أو رمز PIN' };
  }

  const settings = getSchoolSettings();
  const users = settings.users && settings.users.length > 0 ? settings.users : [];

  // Find user by username, role, or ID
  let targetUser = users.find(
    (u) =>
      u.active &&
      (u.username?.toLowerCase() === cleanIdentifier ||
        u.role?.toLowerCase() === cleanIdentifier ||
        u.name?.toLowerCase().includes(cleanIdentifier))
  );

  // If identifier is not specific or role is directly requested
  if (!targetUser) {
    if (cleanIdentifier === 'admin' || cleanIdentifier === 'مدير') {
      targetUser = users.find((u) => u.role === 'admin' && u.active);
    } else if (cleanIdentifier === 'cashier' || cleanIdentifier === 'staff' || cleanIdentifier === 'موظف') {
      targetUser = users.find((u) => u.role === 'cashier' && u.active);
    }
  }

  // Fallback default admin / cashier if not configured
  if (!targetUser) {
    if (cleanIdentifier === 'admin' || cleanIdentifier.includes('مدير')) {
      targetUser = {
        id: 'user-admin-1',
        name: 'مدير النظام الرئيسي',
        username: 'admin',
        pin: 'admin123',
        role: 'admin',
        createdAt: '2025-01-01',
        active: true
      };
    } else {
      targetUser = {
        id: 'user-cashier-1',
        name: 'أمين الخزينة والتحصيل',
        username: 'cashier',
        pin: '0000',
        role: 'cashier',
        createdAt: '2025-01-01',
        active: true
      };
    }
  }

  // Password / PIN validation with fallback defaults
  const userPin = targetUser.pin?.trim() || '';
  const isMatch =
    cleanInput === userPin ||
    (targetUser.role === 'admin' && (cleanInput === 'admin123' || cleanInput === '1234')) ||
    (targetUser.role === 'cashier' && (cleanInput === '0000' || cleanInput === 'staff123' || cleanInput === 'cashier123'));

  if (isMatch) {
    setActiveSessionUser(targetUser);
    return { success: true, user: targetUser };
  }

  return {
    success: false,
    error: 'كلمة المرور غير صحيحة! يرجى التأكد من الرمز المدخل والمحاولة مجدداً.'
  };
}

/**
 * Check if the active user has admin privileges
 */
export function isAdminUser(user: LocalUser | null): boolean {
  return user?.role === 'admin';
}

/**
 * Check if a user is allowed to perform a specific action
 */
export function hasPermission(
  user: LocalUser | null,
  action: 'settings' | 'delete' | 'edit_fees' | 'backup_restore' | 'user_management' | 'export_reports'
): boolean {
  if (!user) return false;
  if (user.role === 'admin') return true;

  // Cashier / Staff is restricted from high-risk admin actions
  switch (action) {
    case 'settings':
    case 'delete':
    case 'edit_fees':
    case 'backup_restore':
    case 'user_management':
      return false;
    case 'export_reports':
      return true;
    default:
      return false;
  }
}
