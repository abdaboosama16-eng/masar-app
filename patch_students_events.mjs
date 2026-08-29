import fs from 'fs';
let code = fs.readFileSync('./src/components/StudentsPage.tsx', 'utf8');

const searchStr = `  // Global Keyboard Shortcuts (F2: New Student, Ctrl+P: Print Receipt)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {`;

const replaceStr = `  // Global event listener for Command Palette Actions
  useEffect(() => {
    const handleOpenAddStudent = () => {
      setStudentToEdit(null);
      setShowAddModal(true);
    };
    window.addEventListener('open-add-student', handleOpenAddStudent);
    return () => window.removeEventListener('open-add-student', handleOpenAddStudent);
  }, []);

  // Global Keyboard Shortcuts (F2: New Student, Ctrl+P: Print Receipt)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {`;

code = code.replace(searchStr, replaceStr);
fs.writeFileSync('./src/components/StudentsPage.tsx', code);
