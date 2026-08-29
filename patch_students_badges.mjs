import fs from 'fs';
let code = fs.readFileSync('./src/components/StudentsPage.tsx', 'utf8');

const importBadge = `import { StudentBadge } from './StudentBadge';\n`;
code = code.replace("import { Trash2", importBadge + "import { Trash2");

// Find the cell with the student name
const searchStr = `<span className="font-extrabold text-slate-900 text-sm">{student.name}</span>`;
const replaceStr = `<span className="font-extrabold text-slate-900 text-sm">{student.name}</span>
                          {remaining > 0 && remaining === student.final_fees && (
                            <StudentBadge type="financial_delay" label="لم يسدد" />
                          )}
                          {remaining > 0 && remaining < student.final_fees && (
                            <StudentBadge type="financial_delay" label="عليه قسط" />
                          )}
                          {remaining === 0 && student.final_fees > 0 && (
                            <StudentBadge type="excellent" label="خالص" />
                          )}
                          {!student.father_phone && !student.mother_phone && (
                            <StudentBadge type="admin_note" label="بيانات ناقصة" />
                          )}`;

code = code.replace(searchStr, replaceStr);

fs.writeFileSync('./src/components/StudentsPage.tsx', code);
