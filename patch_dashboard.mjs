import fs from 'fs';
let code = fs.readFileSync('./src/components/Dashboard.tsx', 'utf8');

// Title change
code = code.replace("{t('dashboard_title')}", "لوحة التحكم");

// Income card number color
code = code.replace(
  `text-4xl font-extrabold text-emerald-900 tracking-tight mb-2`,
  `text-4xl font-extrabold text-emerald-700 tracking-tight mb-2`
);

// Expense card number color
code = code.replace(
  `text-4xl font-extrabold text-rose-900 tracking-tight mb-2`,
  `text-4xl font-extrabold text-rose-700 tracking-tight mb-2`
);

// Early Education Card
code = code.replace(
  `bg-gradient-to-b from-emerald-50/50 to-white border border-emerald-200/80 rounded-xl p-5`,
  `bg-emerald-50 border border-emerald-200 rounded-xl p-5`
);

// Kindergarten Card (replace purple with fuchsia)
// Find the exact block for Kindergarten
code = code.replace(
  `bg-gradient-to-b from-purple-50/50 to-white border border-purple-200/80 rounded-xl p-5 flex flex-col justify-between hover:border-purple-400 hover:shadow-xs transition-all`,
  `bg-fuchsia-50 border border-fuchsia-200 rounded-xl p-5 flex flex-col justify-between hover:border-fuchsia-400 hover:shadow-xs transition-all`
);
code = code.replace(`bg-purple-500`, `bg-fuchsia-500`);
code = code.replace(`bg-purple-100 text-purple-800 border border-purple-200/80`, `bg-fuchsia-100 text-fuchsia-800 border border-fuchsia-200`);
code = code.replace(`text-purple-600`, `text-fuchsia-600`);

// Preparatory Card
code = code.replace(
  `bg-gradient-to-b from-amber-50/50 to-white border border-amber-200/80 rounded-xl p-5`,
  `bg-amber-50 border border-amber-200 rounded-xl p-5`
);
code = code.replace(
  `bg-amber-100 text-amber-800 border border-amber-200/80`,
  `bg-amber-100 text-amber-800 border border-amber-200`
);

fs.writeFileSync('./src/components/Dashboard.tsx', code);
