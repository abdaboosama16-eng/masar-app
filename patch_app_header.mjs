import fs from 'fs';
let code = fs.readFileSync('./src/App.tsx', 'utf8');

const searchStr = `        {/* Header Actions: User Profile & Admin Settings */}
        <div className="flex items-center gap-3 text-slate-600">`;

const replaceStr = `        {/* Header Actions: User Profile & Admin Settings */}
        <div className="flex items-center gap-3 md:gap-4 text-slate-600">
          {/* Zen Mode Toggle */}
          <button
            onClick={() => setZenMode(!zenMode)}
            className={\`hidden md:flex p-2 rounded-xl transition-colors \${zenMode ? 'bg-indigo-100 text-indigo-700' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}\`}
            title={zenMode ? "إيقاف وضع التركيز" : "تفعيل وضع التركيز (Zen Mode)"}
          >
            {zenMode ? <Minimize size={18} /> : <Maximize size={18} />}
          </button>

          {/* Command Palette Trigger */}
          <button 
            className="hidden lg:flex items-center justify-between gap-4 bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 px-3 py-1.5 rounded-xl transition-colors border border-slate-200"
            onClick={() => setShowCommandPalette(true)}
            title="البحث السريع أو الإجراءات"
          >
            <span className="text-xs font-bold flex items-center gap-2"><Search size={14} /> بحث، أوامر...</span>
            <kbd className="hidden sm:inline-block font-mono text-[10px] font-bold bg-white border border-slate-300 rounded px-1.5 py-0.5 text-slate-400">⌘K</kbd>
          </button>
`;

code = code.replace(searchStr, replaceStr);
fs.writeFileSync('./src/App.tsx', code);
