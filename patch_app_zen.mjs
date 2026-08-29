import fs from 'fs';
let code = fs.readFileSync('./src/App.tsx', 'utf8');

// Add imports
code = code.replace(
  "import { getActiveSessionUser",
  "import { CommandPalette } from './components/CommandPalette';\nimport { Maximize, Minimize } from 'lucide-react';\nimport { getActiveSessionUser"
);

// Add state variables
code = code.replace(
  "const [activeTab, setActiveTab] = useState('dashboard');",
  "const [activeTab, setActiveTab] = useState('dashboard');\n  const [showCommandPalette, setShowCommandPalette] = useState(false);\n  const [zenMode, setZenMode] = useState(false);"
);

// Add keyboard listener for ctrl+k
const effectCode = `
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowCommandPalette(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
`;
code = code.replace(
  "  // Listen to license updates across the app",
  effectCode + "\n  // Listen to license updates across the app"
);

// Handle CommandPalette navigation and actions
const commandActionCode = `
  const handleCommandAction = (action: string) => {
    if (action === 'settings') {
      setShowSettingsModal(true);
    } else if (action === 'add-student') {
      // Need a way to trigger add student from outside. For now, we just navigate to students tab.
      setActiveTab('students');
      window.dispatchEvent(new CustomEvent('open-add-student'));
    } else if (action === 'add-payment') {
      setActiveTab('financials');
      window.dispatchEvent(new CustomEvent('open-add-payment'));
    }
  };
`;
code = code.replace(
  "  const handleOpenSettings = () => {",
  commandActionCode + "\n  const handleOpenSettings = () => {"
);

// Add Command Palette to render
code = code.replace(
  "      <div className=\"flex flex-1 overflow-hidden relative\">",
  "      <CommandPalette \n        isOpen={showCommandPalette} \n        onClose={() => setShowCommandPalette(false)}\n        onNavigate={setActiveTab}\n        onAction={handleCommandAction}\n      />\n\n      <div className=\"flex flex-1 overflow-hidden relative\">"
);

// Update sidebar visibility for Zen Mode
code = code.replace(
  "className={`absolute start-0 md:static z-50 w-64 bg-[#0d1522] text-white flex flex-col justify-between py-6 shrink-0 h-full shadow-[4px_0_24px_rgba(0,0,0,0.04)] transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full rtl:translate-x-full md:translate-x-0 md:rtl:translate-x-0'}`}",
  "className={`absolute start-0 md:static z-50 w-64 bg-[#0d1522] text-white flex flex-col justify-between py-6 shrink-0 h-full shadow-[4px_0_24px_rgba(0,0,0,0.04)] transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full rtl:translate-x-full'} ${zenMode ? 'md:hidden' : 'md:translate-x-0 md:rtl:translate-x-0'}`}"
);

// Add Zen Mode toggle to Top Header Bar and a visual hint for Command Palette
const topBarIconsCode = `          <button 
            className="hidden md:flex items-center justify-between gap-4 bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 px-3 py-1.5 rounded-lg transition-colors border border-slate-200"
            onClick={() => setShowCommandPalette(true)}
            aria-label="شريط الأوامر"
          >
            <span className="text-xs font-bold flex items-center gap-2"><Search size={14} /> بحث، أوامر...</span>
            <kbd className="hidden sm:inline-block font-mono text-[10px] font-bold bg-white border border-slate-300 rounded px-1.5 py-0.5 text-slate-400">⌘K</kbd>
          </button>
        </div>

        <div className="flex items-center gap-3 md:gap-4">
          <button
            onClick={() => setZenMode(!zenMode)}
            className={\`hidden md:flex p-2 rounded-xl transition-colors \${zenMode ? 'bg-indigo-100 text-indigo-700' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}\`}
            title={zenMode ? "إيقاف وضع التركيز" : "تفعيل وضع التركيز (Zen Mode)"}
          >
            {zenMode ? <Minimize size={18} /> : <Maximize size={18} />}
          </button>`;

code = code.replace(
  "        </div>\n\n        <div className=\"flex items-center gap-3 md:gap-4\">",
  topBarIconsCode
);

fs.writeFileSync('./src/App.tsx', code);
