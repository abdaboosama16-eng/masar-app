import Dexie, { Table } from 'dexie';
import { Student, Teacher, Transaction, Installment, SyncQueueItem } from '../types';

export interface AppSetting {
  key: string;
  value: any;
}

export class NoorAlbayanDB extends Dexie {
  students!: Table<Student, number>;
  transactions!: Table<Transaction, number>;
  installments!: Table<Installment, number>;
  teachers!: Table<Teacher, number>;
  syncQueue!: Table<SyncQueueItem, number>;
  settings!: Table<AppSetting, string>;

  constructor() {
    super('NoorAlbayan_OfflineDB');

    // Schema definition for IndexedDB
    this.version(1).stores({
      students: '++id, name, father_phone, national_id, grade, academic_year_id, sync_status, created_at',
      transactions: '++id, type, amount, date, category_type, academic_year, related_student_id, related_teacher_id, sync_status',
      installments: '++id, student_id, amount, paid, sync_status',
      teachers: '++id, name, base_salary, sync_status',
      syncQueue: '++id, entity, entityId, action, status, createdAt',
      settings: 'key'
    });
  }
}

export const db = new NoorAlbayanDB();
