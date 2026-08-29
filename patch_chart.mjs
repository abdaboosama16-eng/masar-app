import fs from 'fs';
let code = fs.readFileSync('./src/components/ExpenseFlowchart.tsx', 'utf8');

code = code.replace("transform: `scale(${scale})`", "transform: `scale(${scale})`");
code = code.replace("transform: \\`scale(\\${scale})\\`", "transform: `scale(${scale})`");

fs.writeFileSync('./src/components/ExpenseFlowchart.tsx', code);
