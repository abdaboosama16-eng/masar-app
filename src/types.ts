export type GradeOption = 'التعليم المبكر' | 'الروضة' | 'التأهيلي';

export type SyncStatus = 'synced' | 'pending';

export interface Student {
  id: number;
  name: string;
  father_phone: string;
  mother_phone?: string;
  national_id?: string;
  gender?: 'ذكر' | 'أنثى';
  birth_date?: string;
  grade: GradeOption | string;
  period?: string;
  base_fees: number;
  discount: number;
  final_fees: number;
  academic_year_id?: number;
  academic_year?: string;
  total_paid?: number;
  birth_certificate?: string;
  created_at?: string;
  sync_status?: SyncStatus;
}

export interface Teacher {
  id: number;
  name: string;
  base_salary: number;
  birth_certificate?: string;
  sync_status?: SyncStatus;
}

export interface Transaction {
  id: number;
  type: 'IN' | 'OUT';
  amount: number;
  description: string;
  date: string;
  category_type?: 'basic' | 'daily' | 'حركة أساسية' | 'حركة يومية';
  related_student_id?: number;
  related_teacher_id?: number;
  academic_year_id?: number;
  academic_year?: string;
  sync_status?: SyncStatus;
}

export interface Installment {
  id: number;
  student_id: number;
  amount: number;
  paid: number;
  due_date?: string;
  sync_status?: SyncStatus;
}

export interface SyncQueueItem {
  id?: number;
  entity: 'student' | 'transaction' | 'installment' | 'teacher';
  entityId: number | string;
  action: 'create' | 'update' | 'delete' | 'pay_installment' | 'pay_salary';
  payload: any;
  createdAt: string;
  status: 'pending' | 'synced' | 'failed';
  retryCount?: number;
  lastError?: string;
}

export interface SyncState {
  isOnline: boolean;
  pendingCount: number;
  isSyncing: boolean;
  lastSyncTime: string | null;
}
