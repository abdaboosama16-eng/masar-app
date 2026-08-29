import fs from 'fs';
let code = fs.readFileSync('./src/App.tsx', 'utf8');

const effUserDecl = `  const effectiveUser = currentUser || (settings.users ? settings.users.find(u => u.role === 'admin') : null) || { id: 'admin', name: 'المدير الأساسي', role: 'admin', username: 'admin', pin: '0000', active: true, createdAt: new Date().toISOString() };\n`;

// Remove effectiveUser from line 152
code = code.replace(effUserDecl, '');

// Insert effectiveUser right after useState declarations
const insertionPoint = `  const [syncToast, setSyncToast] = useState<string | null>(null);\n`;
code = code.replace(insertionPoint, insertionPoint + "\n" + effUserDecl);

// Change currentUser?.role to effectiveUser?.role
code = code.replace(/currentUser\?\.role/g, 'effectiveUser?.role');

fs.writeFileSync('./src/App.tsx', code);
