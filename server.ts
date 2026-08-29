import express from 'express';
import path from 'path';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';
import fs from 'fs';
import { DatabaseSync } from 'node:sqlite';

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json({ limit: '15mb' }));

// Initialize SQLite Database with Auto-Recovery & Schema Verification
const dbPath = path.resolve(process.cwd(), 'noor_albayan.db');
let db: DatabaseSync | null = null;

function setupTables(database: DatabaseSync) {
  try {
    // 1. Academic Years
    database.exec(`CREATE TABLE IF NOT EXISTS academic_years (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      is_active INTEGER DEFAULT 0
    )`);

    // 2. Students
    database.exec(`CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL DEFAULT '',
      father_phone TEXT DEFAULT '',
      mother_phone TEXT DEFAULT '',
      national_id TEXT DEFAULT '',
      gender TEXT DEFAULT '',
      birth_date TEXT DEFAULT '',
      period TEXT DEFAULT '',
      grade TEXT DEFAULT '',
      base_fees REAL NOT NULL DEFAULT 0,
      discount REAL NOT NULL DEFAULT 0,
      final_fees REAL NOT NULL DEFAULT 0,
      total_paid REAL DEFAULT 0,
      birth_certificate TEXT DEFAULT '',
      created_at TEXT DEFAULT '',
      academic_year_id INTEGER DEFAULT 1
    )`);

    // Migrations for existing students table
    const studentCols = [
      { name: 'father_phone', type: 'TEXT DEFAULT \'\'' },
      { name: 'mother_phone', type: 'TEXT DEFAULT \'\'' },
      { name: 'national_id', type: 'TEXT DEFAULT \'\'' },
      { name: 'gender', type: 'TEXT DEFAULT \'\'' },
      { name: 'birth_date', type: 'TEXT DEFAULT \'\'' },
      { name: 'period', type: 'TEXT DEFAULT \'\'' },
      { name: 'grade', type: 'TEXT DEFAULT \'\'' },
      { name: 'total_paid', type: 'REAL DEFAULT 0' },
      { name: 'birth_certificate', type: 'TEXT DEFAULT \'\'' },
      { name: 'created_at', type: 'TEXT DEFAULT \'\'' },
      { name: 'academic_year_id', type: 'INTEGER DEFAULT 1' }
    ];

    for (const col of studentCols) {
      try {
        database.exec(`ALTER TABLE students ADD COLUMN ${col.name} ${col.type}`);
      } catch {
        // Column already exists
      }
    }

    // 3. Teachers
    database.exec(`CREATE TABLE IF NOT EXISTS teachers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL DEFAULT '',
      base_salary REAL NOT NULL DEFAULT 0,
      birth_certificate TEXT DEFAULT '',
      created_at TEXT DEFAULT ''
    )`);

    try {
      database.exec(`ALTER TABLE teachers ADD COLUMN birth_certificate TEXT DEFAULT ''`);
    } catch {}
    try {
      database.exec(`ALTER TABLE teachers ADD COLUMN created_at TEXT DEFAULT ''`);
    } catch {}

    // 4. Transactions (Financials)
    database.exec(`CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL DEFAULT 'IN',
      amount REAL NOT NULL DEFAULT 0,
      description TEXT DEFAULT '',
      date TEXT NOT NULL DEFAULT '',
      category_type TEXT DEFAULT 'daily',
      related_student_id INTEGER,
      related_teacher_id INTEGER,
      academic_year_id INTEGER DEFAULT 1,
      academic_year TEXT DEFAULT '2026/2027',
      created_at TEXT DEFAULT ''
    )`);

    // Migrations for transactions
    const txCols = [
      { name: 'category_type', type: 'TEXT DEFAULT \'daily\'' },
      { name: 'academic_year', type: 'TEXT DEFAULT \'2026/2027\'' },
      { name: 'related_student_id', type: 'INTEGER' },
      { name: 'related_teacher_id', type: 'INTEGER' },
      { name: 'academic_year_id', type: 'INTEGER DEFAULT 1' },
      { name: 'created_at', type: 'TEXT DEFAULT \'\'' }
    ];

    for (const col of txCols) {
      try {
        database.exec(`ALTER TABLE transactions ADD COLUMN ${col.name} ${col.type}`);
      } catch {}
    }

    // 5. Installments
    database.exec(`CREATE TABLE IF NOT EXISTS installments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      amount REAL NOT NULL DEFAULT 0,
      paid REAL NOT NULL DEFAULT 0,
      due_date TEXT DEFAULT ''
    )`);

    // Insert default year if not exists
    const countRow = database.prepare('SELECT count(*) as count FROM academic_years').get() as { count: number } | undefined;
    if (!countRow || countRow.count === 0) {
      database.prepare("INSERT INTO academic_years (name, is_active) VALUES ('2026/2027', 1)").run();
    }
  } catch (err) {
    console.error('[DB SETUP ERROR]:', err);
    throw err;
  }
}

/**
 * Ensures a valid and healthy SQLite database instance is ready for operations.
 */
function ensureDatabase(): DatabaseSync {
  if (db) {
    try {
      db.exec('PRAGMA quick_check;');
      return db;
    } catch (checkErr) {
      console.warn('[DB WARNING] Database check failed, re-opening connection:', checkErr);
      db = null;
    }
  }

  try {
    const dbDir = path.dirname(dbPath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    db = new DatabaseSync(dbPath);
    db.exec('PRAGMA integrity_check;');
    setupTables(db);
    console.log('[DB SUCCESS] Connected and initialized SQLite database.');
    return db;
  } catch (err: any) {
    console.error('[DB FATAL] Database corrupted or failed to open, auto-recovering fresh DB:', err);
    try {
      if (fs.existsSync(dbPath)) {
        const corruptBackup = path.resolve(process.cwd(), `corrupted_db_${Date.now()}.bak`);
        fs.renameSync(dbPath, corruptBackup);
        console.log(`[DB RECOVERY] Corrupted DB moved to ${corruptBackup}`);
      }
    } catch (backupErr) {
      console.error('[DB RECOVERY ERROR] Failed to move corrupted DB:', backupErr);
    }
    db = new DatabaseSync(dbPath);
    setupTables(db);
    return db;
  }
}

// Initial DB boot
try {
  ensureDatabase();
} catch (e) {
  console.error('[INITIAL DB ERROR]:', e);
}

// Safe DB query helpers
const runQuery = async (sql: string, params: any[] = []): Promise<any> => {
  const currentDb = ensureDatabase();
  const stmt = currentDb.prepare(sql);
  const info = stmt.run(...params);
  return { lastID: info.lastInsertRowid, changes: info.changes };
};

const getQuery = async (sql: string, params: any[] = []): Promise<any> => {
  const currentDb = ensureDatabase();
  const stmt = currentDb.prepare(sql);
  return stmt.get(...params) || null;
};

const allQuery = async (sql: string, params: any[] = []): Promise<any[]> => {
  const currentDb = ensureDatabase();
  const stmt = currentDb.prepare(sql);
  return stmt.all(...params) as any[];
};

// ================= API ROUTES =================

// 1. Dashboard / Advisor
app.get('/api/dashboard', async (req, res) => {
  try {
    const totalInResult = await getQuery("SELECT SUM(amount) as total FROM transactions WHERE type = 'IN'");
    const totalOutResult = await getQuery("SELECT SUM(amount) as total FROM transactions WHERE type = 'OUT'");
    const studentsCountResult = await getQuery("SELECT count(*) as count FROM students");
    const teachersCountResult = await getQuery("SELECT count(*) as count FROM teachers");
    
    const totalIn = totalInResult?.total || 0;
    const totalOut = totalOutResult?.total || 0;
    const balance = totalIn - totalOut;

    const recentTransactions = await allQuery("SELECT * FROM transactions ORDER BY id DESC LIMIT 5");

    let advisorMessage = "الوضع المالي مستقر. استمر في متابعة الأقساط.";
    if (balance < 0) {
      advisorMessage = "تنبيه: المصروفات تجاوزت الإيرادات! يرجى مراجعة بند الرواتب أو تحصيل الأقساط المتأخرة.";
    } else if (balance > 10000) {
      advisorMessage = "أداء ممتاز! السيولة النقدية جيدة، يمكن التفكير في تطوير مرافق المدرسة.";
    } else if (totalIn === 0 && totalOut === 0) {
      advisorMessage = "مرحباً بك في منظومة نور البيان! ابدأ بإضافة الطلاب لتسجيل الإيرادات.";
    }

    res.json({
      stats: { 
        totalIn, 
        totalOut, 
        balance, 
        studentsCount: studentsCountResult?.count || 0, 
        teachersCount: teachersCountResult?.count || 0 
      },
      recentTransactions,
      advisorMessage
    });
  } catch (error: any) {
    console.error('[API ERROR] GET /api/dashboard:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch dashboard data' });
  }
});

// 2. Students & Brothers System
app.get('/api/students', async (req, res) => {
  try {
    const students = await allQuery(`
      SELECT s.*, IFNULL(SUM(i.paid), IFNULL(s.total_paid, 0)) as total_paid
      FROM students s
      LEFT JOIN installments i ON s.id = i.student_id
      GROUP BY s.id
      ORDER BY s.id DESC
    `);
    res.json(students);
  } catch (error: any) {
    console.error('[API ERROR] GET /api/students:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch students' });
  }
});

app.post('/api/students', async (req, res) => {
  try {
    const { 
      id, 
      name, 
      father_phone, 
      mother_phone, 
      national_id, 
      gender, 
      birth_date, 
      period, 
      grade, 
      base_fees, 
      discount, 
      final_fees, 
      total_paid, 
      birth_certificate, 
      created_at, 
      academic_year_id 
    } = req.body;

    if (!name && name !== '') {
      return res.status(400).json({ error: 'Student name is required' });
    }

    const feeAmount = Number(final_fees ?? base_fees ?? 1400);
    const discountAmount = Number(discount ?? 0);
    const paidAmount = Number(total_paid ?? 0);
    const todayDate = created_at || new Date().toISOString().split('T')[0];

    let studentId: number;

    if (id) {
      // Sync or upsert with explicit ID
      await runQuery(
        `INSERT OR REPLACE INTO students (
          id, name, father_phone, mother_phone, national_id, gender, birth_date, 
          period, grade, base_fees, discount, final_fees, total_paid, birth_certificate, 
          created_at, academic_year_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          name || '',
          father_phone || '',
          mother_phone || '',
          national_id || '',
          gender || '',
          birth_date || '',
          period || '',
          grade || '',
          feeAmount,
          discountAmount,
          feeAmount,
          paidAmount,
          birth_certificate || '',
          todayDate,
          academic_year_id || 1
        ]
      );
      studentId = id;
    } else {
      // Standard insert with auto-increment
      const result = await runQuery(
        `INSERT INTO students (
          name, father_phone, mother_phone, national_id, gender, birth_date, 
          period, grade, base_fees, discount, final_fees, total_paid, birth_certificate, 
          created_at, academic_year_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          name || '',
          father_phone || '',
          mother_phone || '',
          national_id || '',
          gender || '',
          birth_date || '',
          period || '',
          grade || '',
          feeAmount,
          discountAmount,
          feeAmount,
          paidAmount,
          birth_certificate || '',
          todayDate,
          academic_year_id || 1
        ]
      );
      studentId = (result as any).lastID;
    }
    
    // Create or update initial installment
    const existingInst = await getQuery("SELECT id FROM installments WHERE student_id = ?", [studentId]);
    if (!existingInst) {
      await runQuery(
        "INSERT INTO installments (student_id, amount, paid, due_date) VALUES (?, ?, ?, ?)",
        [studentId, feeAmount, paidAmount, todayDate]
      );
    }

    res.json({ id: studentId, success: true, discountApplied: discountAmount > 0 });
  } catch (error: any) {
    console.error('[API ERROR] POST /api/students:', error);
    res.status(500).json({ error: error.message || 'Failed to add student' });
  }
});

app.put('/api/students/:id', async (req, res) => {
  try {
    const studentId = req.params.id;
    const { 
      name, 
      father_phone, 
      mother_phone, 
      national_id, 
      gender, 
      birth_date, 
      period, 
      grade, 
      base_fees, 
      discount, 
      final_fees, 
      total_paid, 
      birth_certificate 
    } = req.body;

    const feeAmount = Number(final_fees ?? base_fees ?? 1400);
    const discountAmount = Number(discount ?? 0);
    const paidAmount = total_paid !== undefined ? Number(total_paid) : null;

    if (paidAmount !== null) {
      await runQuery(
        `UPDATE students 
         SET name = ?, father_phone = ?, mother_phone = ?, national_id = ?, gender = ?, 
             birth_date = ?, period = ?, grade = ?, base_fees = ?, discount = ?, final_fees = ?, 
             total_paid = ?, birth_certificate = COALESCE(?, birth_certificate)
         WHERE id = ?`,
        [
          name || '', 
          father_phone || '', 
          mother_phone || '', 
          national_id || '', 
          gender || '', 
          birth_date || '', 
          period || '', 
          grade || '', 
          feeAmount, 
          discountAmount, 
          feeAmount, 
          paidAmount, 
          birth_certificate, 
          studentId
        ]
      );
    } else {
      await runQuery(
        `UPDATE students 
         SET name = ?, father_phone = ?, mother_phone = ?, national_id = ?, gender = ?, 
             birth_date = ?, period = ?, grade = ?, base_fees = ?, discount = ?, final_fees = ?, 
             birth_certificate = COALESCE(?, birth_certificate)
         WHERE id = ?`,
        [
          name || '', 
          father_phone || '', 
          mother_phone || '', 
          national_id || '', 
          gender || '', 
          birth_date || '', 
          period || '', 
          grade || '', 
          feeAmount, 
          discountAmount, 
          feeAmount, 
          birth_certificate, 
          studentId
        ]
      );
    }

    // Update corresponding installment amount if exists
    await runQuery(
      `UPDATE installments 
       SET amount = ? 
       WHERE student_id = ?`,
      [feeAmount, studentId]
    );

    res.json({ success: true, message: 'Student updated successfully' });
  } catch (error: any) {
    console.error(`[API ERROR] PUT /api/students/${req.params.id}:`, error);
    res.status(500).json({ error: error.message || 'Failed to update student' });
  }
});

app.delete('/api/students/:id', async (req, res) => {
  try {
    const studentId = req.params.id;
    await runQuery("DELETE FROM installments WHERE student_id = ?", [studentId]);
    await runQuery("DELETE FROM students WHERE id = ?", [studentId]);
    res.json({ success: true, message: 'Student deleted successfully' });
  } catch (error: any) {
    console.error(`[API ERROR] DELETE /api/students/${req.params.id}:`, error);
    res.status(500).json({ error: error.message || 'Failed to delete student' });
  }
});

app.get('/api/students/:id/installments', async (req, res) => {
  try {
    const installments = await allQuery("SELECT * FROM installments WHERE student_id = ?", [req.params.id]);
    res.json(installments);
  } catch (error: any) {
    console.error(`[API ERROR] GET /api/students/${req.params.id}/installments:`, error);
    res.status(500).json({ error: error.message || 'Failed to fetch installments' });
  }
});

app.post('/api/installments/pay', async (req, res) => {
  try {
    const { student_id, installment_id, amount, description } = req.body;
    const payAmount = Number(amount || 0);

    const studentInfo = await getQuery("SELECT name, total_paid FROM students WHERE id = ?", [student_id]);
    const studentName = studentInfo ? (studentInfo as any).name : '';
    const finalDescription = description || `دفعة قسط دراسي - الطالب: ${studentName}`;
    
    if (installment_id) {
      await runQuery("UPDATE installments SET paid = paid + ? WHERE id = ?", [payAmount, installment_id]);
    } else {
      await runQuery("UPDATE installments SET paid = paid + ? WHERE student_id = ?", [payAmount, student_id]);
    }

    await runQuery("UPDATE students SET total_paid = total_paid + ? WHERE id = ?", [payAmount, student_id]);

    const result = await runQuery(
      "INSERT INTO transactions (type, amount, description, date, category_type, related_student_id) VALUES ('IN', ?, ?, date('now'), 'daily', ?)",
      [payAmount, finalDescription, student_id]
    );

    res.json({ success: true, transactionId: result.lastID });
  } catch (error: any) {
    console.error('[API ERROR] POST /api/installments/pay:', error);
    res.status(500).json({ error: error.message || 'Failed to pay installment' });
  }
});

// 3. Teachers & Smart Salary
app.get('/api/teachers', async (req, res) => {
  try {
    const teachers = await allQuery("SELECT * FROM teachers ORDER BY id DESC");
    res.json(teachers);
  } catch (error: any) {
    console.error('[API ERROR] GET /api/teachers:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch teachers' });
  }
});

app.post('/api/teachers', async (req, res) => {
  try {
    const { id, name, base_salary, birth_certificate, created_at } = req.body;
    const salary = Number(base_salary || 0);
    const todayDate = created_at || new Date().toISOString().split('T')[0];

    let resultId: number;

    if (id) {
      await runQuery(
        "INSERT OR REPLACE INTO teachers (id, name, base_salary, birth_certificate, created_at) VALUES (?, ?, ?, ?, ?)",
        [id, name || '', salary, birth_certificate || '', todayDate]
      );
      resultId = id;
    } else {
      const result = await runQuery(
        "INSERT INTO teachers (name, base_salary, birth_certificate, created_at) VALUES (?, ?, ?, ?)",
        [name || '', salary, birth_certificate || '', todayDate]
      );
      resultId = result.lastID;
    }

    res.json({ id: resultId, success: true });
  } catch (error: any) {
    console.error('[API ERROR] POST /api/teachers:', error);
    res.status(500).json({ error: error.message || 'Failed to add teacher' });
  }
});

app.post('/api/teachers/pay-salary', async (req, res) => {
  try {
    const { teacher_id, absence_days, day_rate, base_salary } = req.body;
    const deduction = Number(absence_days || 0) * Number(day_rate || 0);
    const final_salary = Number(base_salary || 0) - deduction;
    
    const teacher = await getQuery("SELECT name FROM teachers WHERE id = ?", [teacher_id]);
    const teacherName = teacher?.name || '';
    const desc = `راتب المعلم (${teacherName}) - غياب ${absence_days} أيام، خصم ${deduction} د.ل`;

    const result = await runQuery(
      "INSERT INTO transactions (type, amount, description, date, category_type, related_teacher_id) VALUES ('OUT', ?, ?, date('now'), 'daily', ?)",
      [final_salary, desc, teacher_id]
    );

    res.json({ success: true, transactionId: result.lastID, final_salary });
  } catch (error: any) {
    console.error('[API ERROR] POST /api/teachers/pay-salary:', error);
    res.status(500).json({ error: error.message || 'Failed to pay salary' });
  }
});

// 4. Financials
app.get('/api/transactions', async (req, res) => {
  try {
    const transactions = await allQuery("SELECT * FROM transactions ORDER BY id DESC");
    res.json(transactions);
  } catch (error: any) {
    console.error('[API ERROR] GET /api/transactions:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch transactions' });
  }
});

app.post('/api/transactions', async (req, res) => {
  try {
    const { 
      id, 
      type, 
      amount, 
      description, 
      date, 
      category_type, 
      related_student_id, 
      related_teacher_id, 
      academic_year, 
      academic_year_id 
    } = req.body;

    const finalType = type || 'IN';
    const finalAmount = Number(amount || 0);
    const finalDate = date || new Date().toISOString().split('T')[0];
    const finalCategoryType = category_type || 'daily';
    const finalYear = academic_year || '2026/2027';

    let resultId: number;

    if (id) {
      await runQuery(
        `INSERT OR REPLACE INTO transactions (
          id, type, amount, description, date, category_type, 
          related_student_id, related_teacher_id, academic_year, academic_year_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          finalType,
          finalAmount,
          description || '',
          finalDate,
          finalCategoryType,
          related_student_id || null,
          related_teacher_id || null,
          finalYear,
          academic_year_id || 1
        ]
      );
      resultId = id;
    } else {
      const result = await runQuery(
        `INSERT INTO transactions (
          type, amount, description, date, category_type, 
          related_student_id, related_teacher_id, academic_year, academic_year_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          finalType,
          finalAmount,
          description || '',
          finalDate,
          finalCategoryType,
          related_student_id || null,
          related_teacher_id || null,
          finalYear,
          academic_year_id || 1
        ]
      );
      resultId = result.lastID;
    }

    res.json({ id: resultId, success: true });
  } catch (error: any) {
    console.error('[API ERROR] POST /api/transactions:', error);
    res.status(500).json({ error: error.message || 'Failed to add transaction' });
  }
});

// 5. Database Backup
app.get('/api/backup', (req, res) => {
  try {
    ensureDatabase();
    const backupPath = path.resolve(process.cwd(), `noor_albayan_backup_${Date.now()}.db`);
    fs.copyFileSync(dbPath, backupPath);
    res.download(backupPath, 'noor_albayan_backup.db', (err) => {
      if (err) {
        console.error("[API ERROR] Error downloading backup:", err);
      }
      try {
        if (fs.existsSync(backupPath)) {
          fs.unlinkSync(backupPath);
        }
      } catch (cleanErr) {
        console.error("[API ERROR] Error cleaning up backup file:", cleanErr);
      }
    });
  } catch (error: any) {
    console.error('[API ERROR] GET /api/backup:', error);
    res.status(500).json({ error: error.message || 'Failed to backup database' });
  }
});

// ================= VITE MIDDLEWARE =================
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

