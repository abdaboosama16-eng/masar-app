import { db } from './db';
import { Student, Teacher, Transaction, Installment, SyncQueueItem, SyncState } from '../types';

type SyncListener = (state: SyncState) => void;

class SyncService {
  private listeners: Set<SyncListener> = new Set();
  private isSyncing = false;
  private isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
  private lastSyncTime: string | null = null;
  private initialized = false;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.isOnline = true;
        this.notifyState();
        this.syncAllPending();
      });

      window.addEventListener('offline', () => {
        this.isOnline = false;
        this.notifyState();
      });

      // Auto-sync heartbeat every 45 seconds when online
      setInterval(() => {
        if (this.isOnline && !this.isSyncing) {
          this.syncAllPending();
        }
      }, 45000);
    }
  }

  /**
   * Initializes local IndexedDB, migrates legacy localStorage data if present,
   * and loads initial data.
   */
  async init(): Promise<void> {
    if (this.initialized) return;

    try {
      // 1. Check & migrate legacy localStorage data
      await this.migrateLegacyLocalStorage();

      // 2. If online and local DB has 0 students, pull from server
      const localStudentsCount = await db.students.count();
      if (localStudentsCount === 0 && this.isOnline) {
        await this.pullFromServer();
      }

      this.initialized = true;
      await this.notifyState();
    } catch (err) {
      console.error('Failed to initialize syncService:', err);
    }
  }

  private async migrateLegacyLocalStorage() {
    try {
      const storedStudents = localStorage.getItem('students_data');
      if (storedStudents) {
        const students: Student[] = JSON.parse(storedStudents);
        const existingCount = await db.students.count();
        if (existingCount === 0 && Array.isArray(students) && students.length > 0) {
          await db.students.bulkPut(
            students.map(s => ({
              ...s,
              sync_status: s.sync_status || 'synced'
            }))
          );
        }
      }

      const storedTx = localStorage.getItem('transactions_data');
      if (storedTx) {
        const txs: Transaction[] = JSON.parse(storedTx);
        const existingCount = await db.transactions.count();
        if (existingCount === 0 && Array.isArray(txs) && txs.length > 0) {
          await db.transactions.bulkPut(
            txs.map(t => ({
              ...t,
              sync_status: t.sync_status || 'synced'
            }))
          );
        }
      }

      const storedInst = localStorage.getItem('installments_data');
      if (storedInst) {
        const insts: Installment[] = JSON.parse(storedInst);
        const existingCount = await db.installments.count();
        if (existingCount === 0 && Array.isArray(insts) && insts.length > 0) {
          await db.installments.bulkPut(
            insts.map(i => ({
              ...i,
              sync_status: i.sync_status || 'synced'
            }))
          );
        }
      }
    } catch (e) {
      console.error('Error during localStorage migration:', e);
    }
  }

  /**
   * Pulls fresh data from server and caches in IndexedDB (without overwriting unsynced local pending items)
   */
  async pullFromServer(): Promise<void> {
    if (!this.isOnline) return;

    try {
      // 1. Students
      const studentsRes = await fetch('/api/students');
      if (studentsRes.ok) {
        const serverStudents: Student[] = await studentsRes.json();
        if (Array.isArray(serverStudents)) {
          const pendingStudents = await db.students.where('sync_status').equals('pending').toArray();
          const pendingIds = new Set(pendingStudents.map(s => s.id));

          for (const s of serverStudents) {
            if (!pendingIds.has(s.id)) {
              await db.students.put({ ...s, sync_status: 'synced' });
            }
          }
        }
      }

      // 2. Transactions
      const txRes = await fetch('/api/transactions');
      if (txRes.ok) {
        const serverTx: Transaction[] = await txRes.json();
        if (Array.isArray(serverTx)) {
          const pendingTx = await db.transactions.where('sync_status').equals('pending').toArray();
          const pendingIds = new Set(pendingTx.map(t => t.id));

          for (const t of serverTx) {
            if (!pendingIds.has(t.id)) {
              await db.transactions.put({ ...t, sync_status: 'synced' });
            }
          }
        }
      }

      // 3. Teachers
      const teachersRes = await fetch('/api/teachers');
      if (teachersRes.ok) {
        const serverTeachers: Teacher[] = await teachersRes.json();
        if (Array.isArray(serverTeachers)) {
          const pendingTeachers = await db.teachers.where('sync_status').equals('pending').toArray();
          const pendingIds = new Set(pendingTeachers.map(t => t.id));

          for (const t of serverTeachers) {
            if (!pendingIds.has(t.id)) {
              await db.teachers.put({ ...t, sync_status: 'synced' });
            }
          }
        }
      }
    } catch (err) {
      console.warn('Could not complete pullFromServer:', err);
    }
  }

  /**
   * Returns current pending count across IndexedDB syncQueue & items
   */
  async getPendingCount(): Promise<number> {
    try {
      const queueCount = await db.syncQueue.where('status').equals('pending').count();
      const pendingStudents = await db.students.where('sync_status').equals('pending').count();
      const pendingTx = await db.transactions.where('sync_status').equals('pending').count();
      return Math.max(queueCount, pendingStudents + pendingTx);
    } catch {
      return 0;
    }
  }

  // ================= STUDENTS =================

  async getStudents(): Promise<Student[]> {
    await this.init();
    const students = await db.students.toArray();
    // Sort latest first
    return students.sort((a, b) => (Number(b.id) || 0) - (Number(a.id) || 0));
  }

  async saveStudent(studentData: Partial<Student>, isEdit: boolean, editId?: number): Promise<Student> {
    await this.init();
    const todayDate = new Date().toISOString().split('T')[0];
    const initialStatus = this.isOnline ? 'pending' : 'pending';

    let student: Student;

    if (isEdit && editId) {
      const existing = await db.students.get(editId);
      student = {
        ...existing,
        ...studentData,
        id: editId,
        sync_status: initialStatus
      } as Student;
      await db.students.put(student);

      // Enqueue sync item
      await db.syncQueue.add({
        entity: 'student',
        entityId: editId,
        action: 'update',
        payload: student,
        createdAt: new Date().toISOString(),
        status: 'pending'
      });
    } else {
      const newId = Date.now();
      const finalFees = Number(studentData.final_fees ?? studentData.base_fees ?? 1400);
      const initialPaid = Number(studentData.total_paid || 0);

      const hasTransport = Boolean(studentData.hasTransport ?? (studentData as any)?.has_transport ?? false);
      const transportLandmark = hasTransport ? (studentData.transportLandmark || (studentData as any)?.transport_landmark || '') : '';

      student = {
        id: newId,
        name: studentData.name || '',
        father_phone: studentData.father_phone || '',
        mother_phone: studentData.mother_phone || '',
        national_id: studentData.national_id || '',
        gender: studentData.gender,
        birth_date: studentData.birth_date || '',
        grade: studentData.grade || 'الروضة',
        period: studentData.period || '',
        base_fees: finalFees,
        discount: 0,
        final_fees: finalFees,
        total_paid: initialPaid,
        birth_certificate: studentData.birth_certificate,
        hasTransport,
        transportLandmark,
        created_at: todayDate,
        sync_status: initialStatus
      };

      await db.students.add(student);

      // Add corresponding installment in IndexedDB
      await db.installments.add({
        id: Date.now() + 1,
        student_id: newId,
        amount: finalFees,
        paid: initialPaid,
        due_date: todayDate,
        sync_status: initialStatus
      });

      // Add financial IN transaction if initial payment provided
      if (initialPaid > 0) {
        await this.saveTransaction({
          type: 'IN',
          amount: initialPaid,
          description: `دفعة قسط دراسي - الطالب: ${student.name}`,
          date: todayDate,
          category_type: 'daily',
          related_student_id: newId
        });
      }

      // Enqueue sync item
      await db.syncQueue.add({
        entity: 'student',
        entityId: newId,
        action: 'create',
        payload: student,
        createdAt: new Date().toISOString(),
        status: 'pending'
      });
    }

    this.dispatchDataChanged('students');
    await this.notifyState();

    // Trigger sync if online
    if (this.isOnline) {
      this.syncAllPending();
    }

    return student;
  }

  /**
   * Bulk import students from Excel / CSV import.
   * Efficiently adds students, installments, transactions and sync queue in bulk.
   */
  async bulkImportStudents(studentsList: Partial<Student>[]): Promise<{ count: number; importedStudents: Student[] }> {
    await this.init();
    const todayDate = new Date().toISOString().split('T')[0];
    const importedStudents: Student[] = [];
    const installmentsToAdd: Installment[] = [];
    const transactionsToAdd: Transaction[] = [];
    const queueItems: SyncQueueItem[] = [];

    const baseTimestamp = Date.now();

    for (let i = 0; i < studentsList.length; i++) {
      const raw = studentsList[i];
      if (!raw.name || !raw.name.trim()) continue;

      const studentId = baseTimestamp + (i * 10);
      const finalFees = Number(raw.final_fees ?? raw.base_fees ?? 1400);
      const initialPaid = Number(raw.total_paid || 0);

      const hasTransport = Boolean(raw.hasTransport ?? (raw as any)?.has_transport ?? false);
      const transportLandmark = hasTransport ? (raw.transportLandmark || (raw as any)?.transport_landmark || '') : '';

      const student: Student = {
        id: studentId,
        name: raw.name.trim(),
        father_phone: raw.father_phone ? String(raw.father_phone).trim() : '',
        mother_phone: raw.mother_phone ? String(raw.mother_phone).trim() : '',
        national_id: raw.national_id ? String(raw.national_id).trim() : '',
        gender: raw.gender === 'أنثى' ? 'أنثى' : 'ذكر',
        birth_date: raw.birth_date ? String(raw.birth_date).trim() : '',
        grade: raw.grade || 'الروضة',
        period: raw.period || 'صباحي',
        base_fees: finalFees,
        discount: Number(raw.discount || 0),
        final_fees: finalFees,
        total_paid: initialPaid,
        birth_certificate: raw.birth_certificate,
        hasTransport,
        transportLandmark,
        created_at: todayDate,
        sync_status: 'pending'
      };

      importedStudents.push(student);

      installmentsToAdd.push({
        id: studentId + 1,
        student_id: studentId,
        amount: finalFees,
        paid: initialPaid,
        due_date: todayDate,
        sync_status: 'pending'
      });

      if (initialPaid > 0) {
        transactionsToAdd.push({
          id: studentId + 5,
          type: 'IN',
          amount: initialPaid,
          description: `دفعة قسط دراسي (استيراد) - الطالب: ${student.name}`,
          date: todayDate,
          category_type: 'daily',
          related_student_id: studentId,
          sync_status: 'pending'
        });
      }

      queueItems.push({
        entity: 'student',
        entityId: studentId,
        action: 'create',
        payload: student,
        createdAt: new Date().toISOString(),
        status: 'pending'
      });
    }

    if (importedStudents.length > 0) {
      await db.students.bulkAdd(importedStudents);
      if (installmentsToAdd.length > 0) {
        await db.installments.bulkAdd(installmentsToAdd);
      }
      if (transactionsToAdd.length > 0) {
        await db.transactions.bulkAdd(transactionsToAdd);
      }
      if (queueItems.length > 0) {
        await db.syncQueue.bulkAdd(queueItems);
      }

      this.dispatchDataChanged('students');
      await this.notifyState();

      if (this.isOnline) {
        this.syncAllPending();
      }
    }

    return { count: importedStudents.length, importedStudents };
  }

  async deleteStudent(id: number): Promise<void> {
    await this.init();
    await db.students.delete(id);
    await db.installments.where('student_id').equals(id).delete();

    await db.syncQueue.add({
      entity: 'student',
      entityId: id,
      action: 'delete',
      payload: { id },
      createdAt: new Date().toISOString(),
      status: 'pending'
    });

    this.dispatchDataChanged('students');
    await this.notifyState();

    if (this.isOnline) {
      this.syncAllPending();
    }
  }

  async payInstallment(studentId: number, amount: number, notes?: string): Promise<{ success: boolean }> {
    await this.init();
    const student = await db.students.get(studentId);
    if (!student) return { success: false };

    const todayDate = new Date().toISOString().split('T')[0];
    const newTotalPaid = (student.total_paid || 0) + amount;

    // Update student in IndexedDB
    await db.students.update(studentId, {
      total_paid: newTotalPaid,
      sync_status: 'pending'
    });

    // Update installment in IndexedDB
    const installments = await db.installments.where('student_id').equals(studentId).toArray();
    let installmentId = installments[0]?.id || 0;
    if (installments.length > 0) {
      await db.installments.update(installments[0].id, {
        paid: (installments[0].paid || 0) + amount,
        sync_status: 'pending'
      });
    }

    // Add IN Transaction in IndexedDB
    const txDesc = notes || `دفعة قسط دراسي - الطالب: ${student.name}`;
    await this.saveTransaction({
      type: 'IN',
      amount,
      description: txDesc,
      date: todayDate,
      category_type: 'daily',
      related_student_id: studentId
    });

    // Enqueue sync action
    await db.syncQueue.add({
      entity: 'installment',
      entityId: studentId,
      action: 'pay_installment',
      payload: {
        student_id: studentId,
        installment_id: installmentId,
        amount,
        description: txDesc
      },
      createdAt: new Date().toISOString(),
      status: 'pending'
    });

    this.dispatchDataChanged('installments');
    await this.notifyState();

    if (this.isOnline) {
      this.syncAllPending();
    }

    return { success: true };
  }

  // ================= TRANSACTIONS =================

  async getTransactions(): Promise<Transaction[]> {
    await this.init();
    const txs = await db.transactions.toArray();
    return txs.sort((a, b) => (Number(b.id) || 0) - (Number(a.id) || 0));
  }

  async saveTransaction(txData: Partial<Transaction>): Promise<Transaction> {
    await this.init();
    const newId = Date.now() + Math.floor(Math.random() * 1000);
    const todayDate = txData.date || new Date().toISOString().split('T')[0];

    const transaction: Transaction = {
      id: newId,
      type: txData.type || 'IN',
      amount: Number(txData.amount) || 0,
      description: txData.description || '',
      date: todayDate,
      category_type: txData.category_type || 'daily',
      related_student_id: txData.related_student_id,
      related_teacher_id: txData.related_teacher_id,
      academic_year: txData.academic_year || '2026/2027',
      academic_year_id: txData.academic_year_id || 1,
      sync_status: 'pending'
    };

    await db.transactions.add(transaction);

    await db.syncQueue.add({
      entity: 'transaction',
      entityId: newId,
      action: 'create',
      payload: transaction,
      createdAt: new Date().toISOString(),
      status: 'pending'
    });

    this.dispatchDataChanged('transactions');
    await this.notifyState();

    if (this.isOnline) {
      this.syncAllPending();
    }

    return transaction;
  }

  // ================= TEACHERS =================

  async getTeachers(): Promise<Teacher[]> {
    await this.init();
    const teachers = await db.teachers.toArray();
    return teachers.sort((a, b) => (Number(b.id) || 0) - (Number(a.id) || 0));
  }

  async saveTeacher(teacherData: Partial<Teacher>): Promise<Teacher> {
    await this.init();
    const newId = Date.now();
    const teacher: Teacher = {
      id: newId,
      name: teacherData.name || '',
      base_salary: Number(teacherData.base_salary) || 0,
      birth_certificate: teacherData.birth_certificate,
      sync_status: 'pending'
    };

    await db.teachers.add(teacher);

    await db.syncQueue.add({
      entity: 'teacher',
      entityId: newId,
      action: 'create',
      payload: teacher,
      createdAt: new Date().toISOString(),
      status: 'pending'
    });

    this.dispatchDataChanged('teachers');
    await this.notifyState();

    if (this.isOnline) {
      this.syncAllPending();
    }

    return teacher;
  }

  async payTeacherSalary(teacherId: number, absenceDays: number, dayRate: number, baseSalary: number): Promise<{ finalSalary: number }> {
    await this.init();
    const deduction = absenceDays * dayRate;
    const finalSalary = baseSalary - deduction;
    const teacher = await db.teachers.get(teacherId);
    const teacherName = teacher ? teacher.name : '';

    const todayDate = new Date().toISOString().split('T')[0];
    const desc = `راتب المعلم (${teacherName}) - غياب ${absenceDays} أيام، خصم ${deduction} د.ل`;

    // Add OUT transaction to IndexedDB
    await this.saveTransaction({
      type: 'OUT',
      amount: finalSalary,
      description: desc,
      date: todayDate,
      category_type: 'daily',
      related_teacher_id: teacherId
    });

    // Enqueue
    await db.syncQueue.add({
      entity: 'teacher',
      entityId: teacherId,
      action: 'pay_salary',
      payload: {
        teacher_id: teacherId,
        absence_days: absenceDays,
        day_rate: dayRate,
        base_salary: baseSalary
      },
      createdAt: new Date().toISOString(),
      status: 'pending'
    });

    this.dispatchDataChanged('transactions');
    await this.notifyState();

    if (this.isOnline) {
      this.syncAllPending();
    }

    return { finalSalary };
  }

  // ================= SYNC ENGINE =================

  /**
   * Main synchronization worker: processes all pending items in syncQueue
   * and marks local IndexedDB records as 'synced'.
   */
  async syncAllPending(): Promise<{ syncedCount: number; errors: number }> {
    if (!this.isOnline || this.isSyncing) {
      return { syncedCount: 0, errors: 0 };
    }

    this.isSyncing = true;
    await this.notifyState();

    let syncedCount = 0;
    let errors = 0;

    try {
      const queueItems = await db.syncQueue.where('status').equals('pending').toArray();

      for (const item of queueItems) {
        try {
          if (item.entity === 'student') {
            if (item.action === 'create') {
              const res = await fetch('/api/students', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(item.payload)
              });
              if (res.ok) {
                // Update local record to synced
                await db.students.update(Number(item.entityId), { sync_status: 'synced' });
                await db.syncQueue.update(item.id!, { status: 'synced' });
                syncedCount++;
              } else {
                errors++;
              }
            } else if (item.action === 'update') {
              const res = await fetch(`/api/students/${item.entityId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(item.payload)
              });
              if (res.ok) {
                await db.students.update(Number(item.entityId), { sync_status: 'synced' });
                await db.syncQueue.update(item.id!, { status: 'synced' });
                syncedCount++;
              } else {
                errors++;
              }
            } else if (item.action === 'delete') {
              const res = await fetch(`/api/students/${item.entityId}`, {
                method: 'DELETE'
              });
              if (res.ok || res.status === 404) {
                await db.syncQueue.update(item.id!, { status: 'synced' });
                syncedCount++;
              } else {
                errors++;
              }
            }
          } else if (item.entity === 'installment' && item.action === 'pay_installment') {
            const res = await fetch('/api/installments/pay', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(item.payload)
            });
            if (res.ok) {
              await db.students.update(Number(item.entityId), { sync_status: 'synced' });
              await db.syncQueue.update(item.id!, { status: 'synced' });
              syncedCount++;
            } else {
              errors++;
            }
          } else if (item.entity === 'transaction' && item.action === 'create') {
            const res = await fetch('/api/transactions', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(item.payload)
            });
            if (res.ok) {
              await db.transactions.update(Number(item.entityId), { sync_status: 'synced' });
              await db.syncQueue.update(item.id!, { status: 'synced' });
              syncedCount++;
            } else {
              errors++;
            }
          } else if (item.entity === 'teacher') {
            if (item.action === 'create') {
              const res = await fetch('/api/teachers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(item.payload)
              });
              if (res.ok) {
                await db.teachers.update(Number(item.entityId), { sync_status: 'synced' });
                await db.syncQueue.update(item.id!, { status: 'synced' });
                syncedCount++;
              } else {
                errors++;
              }
            } else if (item.action === 'pay_salary') {
              const res = await fetch('/api/teachers/pay-salary', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(item.payload)
              });
              if (res.ok) {
                await db.syncQueue.update(item.id!, { status: 'synced' });
                syncedCount++;
              } else {
                errors++;
              }
            }
          }
        } catch (e: any) {
          console.warn(`Sync failed for item ${item.id}:`, e);
          errors++;
        }
      }

      // Cleanup synced queue items older than 24 hours to keep IndexedDB lean
      const cutoff = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
      await db.syncQueue.where('status').equals('synced').and(i => i.createdAt < cutoff).delete();

      // Pull any external updates from the cloud
      await this.pullFromServer();

      this.lastSyncTime = new Date().toLocaleTimeString('ar-LY', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch (err) {
      console.error('Fatal sync loop error:', err);
    } finally {
      this.isSyncing = false;
      this.dispatchDataChanged('all');
      await this.notifyState();
    }

    return { syncedCount, errors };
  }

  // ================= LISTENERS & STATE =================

  subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener);
    this.notifyState();
    return () => {
      this.listeners.delete(listener);
    };
  }

  private async notifyState(): Promise<void> {
    const pendingCount = await this.getPendingCount();
    const state: SyncState = {
      isOnline: this.isOnline,
      pendingCount,
      isSyncing: this.isSyncing,
      lastSyncTime: this.lastSyncTime
    };

    this.listeners.forEach(fn => {
      try {
        fn(state);
      } catch (e) {
        console.error(e);
      }
    });
  }

  private dispatchDataChanged(entity: string) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('appDataChanged', { detail: { entity } }));
    }
  }
}

export const syncService = new SyncService();
