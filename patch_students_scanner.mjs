import fs from 'fs';
let code = fs.readFileSync('./src/components/StudentsPage.tsx', 'utf8');

// Add import
code = code.replace("import DailyClosingModal from './DailyClosingModal';", "import { DocumentScanner } from './DocumentScanner';\nimport DailyClosingModal from './DailyClosingModal';");

// Add state to StudentFormModal
const searchState = `  const currentFees = settings.defaultFees || DEFAULT_FEES;
  const isEditMode = Boolean(studentToEdit);`;
const replaceState = `  const currentFees = settings.defaultFees || DEFAULT_FEES;
  const isEditMode = Boolean(studentToEdit);
  const [showScanner, setShowScanner] = useState(false);`;
code = code.replace(searchState, replaceState);

// Add button to header
const searchHeader = `            <div>
              <h2 className="font-extrabold text-lg text-slate-900 dark:text-slate-100">
                {isEditMode ? 'تعديل بيانات الطالب المسجل' : 'تسجيل طالب جديد'}
              </h2>`;

const replaceHeader = `            <div>
              <h2 className="font-extrabold text-lg text-slate-900 dark:text-slate-100">
                {isEditMode ? 'تعديل بيانات الطالب المسجل' : 'تسجيل طالب جديد'}
              </h2>
              {!isEditMode && (
                <button
                  type="button"
                  onClick={() => setShowScanner(true)}
                  className="mt-1 flex items-center gap-1 text-[11px] font-bold text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 bg-cyan-50 dark:bg-cyan-900/30 px-2 py-0.5 rounded-full transition-colors border border-cyan-100 dark:border-cyan-800"
                >
                  <Camera size={12} />
                  مسح مستند (استيراد ذكي)
                </button>
              )}`;
code = code.replace(searchHeader, replaceHeader);

// Handle Scan Complete and add DocumentScanner to DOM
const searchRender = `      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[20px] w-full max-w-2xl overflow-hidden shadow-[0_0_35px_rgba(0,0,0,0.5)] flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">`;

const replaceRender = `      {showScanner && (
        <DocumentScanner 
          onScanComplete={(data) => {
            setShowScanner(false);
            if (data.name) setFormData(prev => ({ ...prev, name: data.name! }));
            // Add other fields if applicable
          }}
          onClose={() => setShowScanner(false)}
        />
      )}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[20px] w-full max-w-2xl overflow-hidden shadow-[0_0_35px_rgba(0,0,0,0.5)] flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">`;

code = code.replace(searchRender, replaceRender);

fs.writeFileSync('./src/components/StudentsPage.tsx', code);
