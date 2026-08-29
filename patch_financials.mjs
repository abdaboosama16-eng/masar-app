import fs from 'fs';
let code = fs.readFileSync('./src/components/FinancialsPage.tsx', 'utf8');

// Add imports
const importStr = `import { AutoAuditor } from './AutoAuditor';
import { ExpenseFlowchart } from './ExpenseFlowchart';`;

code = code.replace("import DailyClosingModal from './DailyClosingModal';", importStr + "\nimport DailyClosingModal from './DailyClosingModal';");

// Update colors in the chart to use pastel / functional ones or just tweak them to match the prompt
// Wait, prompt: "استخدم ألواناً وظيفية هادئة (Pastel): bg-green-50 للإيرادات، و bg-red-50 للمصروفات"
// We already use emerald-50 and rose-50, but let's change exactly to green-50 and red-50 for strict compliance.

// Change emerald-50 to green-50, emerald-100 to green-100, emerald-600 to green-600
code = code.replace(/emerald/g, "green");
// Change rose-50 to red-50, rose-100 to red-100, rose-600 to red-600
code = code.replace(/rose/g, "red");

// Insert the new components into the layout
const searchLayout = `      {/* Financial Summary Cards */}
      <div className="bg-white border border-slate-200 rounded-[20px] p-7 flex flex-col lg:flex-row justify-between items-center gap-6 shadow-sm">`;

const replaceLayout = `      {/* Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (2/3 width): Summary & Chart */}
        <div className="lg:col-span-2 space-y-6">
          {/* Financial Summary Cards */}
          <div className="bg-white border border-slate-200 rounded-[20px] p-7 flex flex-col sm:flex-row justify-between items-center gap-6 shadow-sm">`;

code = code.replace(searchLayout, replaceLayout);

// Wrap the end of Recharts section
const searchEndOfRecharts = `      {/* Movement Type Filter Bar */}`;
const replaceEndOfRecharts = `        </div> {/* End of Left Column */}
        
        {/* Right Column (1/3 width): Auto Auditor & Expense Flowchart */ }
        <div className="lg:col-span-1 space-y-6 flex flex-col">
          <AutoAuditor transactions={displayedTransactions} />
          <div className="flex-1 min-h-[400px]">
            <ExpenseFlowchart />
          </div>
        </div>
      </div>
      
      {/* Movement Type Filter Bar */}`;
code = code.replace(searchEndOfRecharts, replaceEndOfRecharts);

fs.writeFileSync('./src/components/FinancialsPage.tsx', code);
