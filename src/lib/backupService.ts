import { db } from './db';
import { getSchoolSettings, saveSchoolSettings } from './settings';

export interface BackupData {
  app: string;
  version: string;
  exportDate: string;
  exportTimestamp: string;
  schoolSettings?: any;
  data: {
    students: any[];
    transactions: any[];
    installments: any[];
    teachers: any[];
    settings?: any[];
  };
  localStorageSnapshot?: Record<string, string>;
}

/**
 * Downloads a complete JSON backup of the local database and settings
 */
export async function downloadJsonBackup(): Promise<{ success: boolean; filename: string }> {
  try {
    const today = new Date().toISOString().split('T')[0];
    const schoolSettings = getSchoolSettings();

    // 1. Fetch all data from IndexedDB
    const [students, transactions, installments, teachers, dbSettings] = await Promise.all([
      db.students.toArray().catch(() => []),
      db.transactions.toArray().catch(() => []),
      db.installments.toArray().catch(() => []),
      db.teachers.toArray().catch(() => []),
      db.settings.toArray().catch(() => [])
    ]);

    // 2. Fetch relevant localStorage keys
    const localStorageSnapshot: Record<string, string> = {};
    if (typeof window !== 'undefined') {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('masar_') || key.startsWith('noor_albayan_'))) {
          const val = localStorage.getItem(key);
          if (val !== null) {
            localStorageSnapshot[key] = val;
          }
        }
      }
    }

    // 3. Assemble backup payload
    const backup: BackupData = {
      app: 'MASAR',
      version: '2.0',
      exportDate: today,
      exportTimestamp: new Date().toISOString(),
      schoolSettings,
      data: {
        students,
        transactions,
        installments,
        teachers,
        settings: dbSettings
      },
      localStorageSnapshot
    };

    // 4. Create Blob and trigger download
    const jsonString = JSON.stringify(backup, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    // Clean school name for filename
    const cleanSchoolName = (schoolSettings.schoolName || 'masar')
      .replace(/[\/\?<>\\:\*\|"]/g, '')
      .replace(/\s+/g, '_');
    const filename = `${cleanSchoolName}_backup_${today}.json`;

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return { success: true, filename };
  } catch (err) {
    console.error('Failed to download backup:', err);
    throw new Error('حدث خطأ أثناء تصدير ملف النسخة الاحتياطية');
  }
}

/**
 * Restores the local database and settings from a JSON backup file
 */
export async function restoreFromJsonFile(file: File): Promise<{
  success: boolean;
  studentsCount: number;
  transactionsCount: number;
  teachersCount: number;
}> {
  return new Promise((resolve, reject) => {
    if (!file) {
      return reject(new Error('لم يتم تحديد أي ملف'));
    }

    if (!file.name.endsWith('.json') && file.type !== 'application/json') {
      return reject(new Error('يرجى اختيار ملف بصيغة JSON صالحة'));
    }

    const reader = new FileReader();

    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        if (!text) {
          throw new Error('الملف المرفوع فارغ');
        }

        const json = JSON.parse(text);

        // Support both direct structure or wrapped under data
        const students = json.data?.students || json.students || [];
        const transactions = json.data?.transactions || json.transactions || [];
        const installments = json.data?.installments || json.installments || [];
        const teachers = json.data?.teachers || json.teachers || [];
        const dbSettings = json.data?.settings || json.settings || [];

        if (!Array.isArray(students) && !Array.isArray(transactions)) {
          throw new Error('صيغة ملف النسخة الاحتياطية غير متوافقة');
        }

        // 1. Restore IndexedDB in a transaction
        await db.transaction('rw', [db.students, db.transactions, db.installments, db.teachers, db.settings], async () => {
          await db.students.clear();
          await db.transactions.clear();
          await db.installments.clear();
          await db.teachers.clear();
          await db.settings.clear();

          if (students.length > 0) await db.students.bulkAdd(students);
          if (transactions.length > 0) await db.transactions.bulkAdd(transactions);
          if (installments.length > 0) await db.installments.bulkAdd(installments);
          if (teachers.length > 0) await db.teachers.bulkAdd(teachers);
          if (dbSettings.length > 0) await db.settings.bulkAdd(dbSettings);
        });

        // 2. Restore school settings & localStorage snapshot if available
        if (json.schoolSettings) {
          saveSchoolSettings(json.schoolSettings);
        } else if (json.localStorageSnapshot?.masar_school_settings) {
          try {
            const parsed = JSON.parse(json.localStorageSnapshot.masar_school_settings);
            saveSchoolSettings(parsed);
          } catch (e) {
            // ignore
          }
        }

        if (json.localStorageSnapshot && typeof window !== 'undefined') {
          Object.entries(json.localStorageSnapshot).forEach(([k, v]) => {
            if (typeof v === 'string') {
              localStorage.setItem(k, v);
            }
          });
        }

        // 3. Notify app components to re-render
        window.dispatchEvent(new CustomEvent('masar_data_restored'));
        window.dispatchEvent(new Event('storage'));

        resolve({
          success: true,
          studentsCount: students.length,
          transactionsCount: transactions.length,
          teachersCount: teachers.length
        });
      } catch (err: any) {
        console.error('Error during JSON restore:', err);
        reject(new Error(err.message || 'فشلت استعادة البيانات من الملف'));
      }
    };

    reader.onerror = () => {
      reject(new Error('تعذر قراءة الملف المرفوع'));
    };

    reader.readAsText(file);
  });
}
