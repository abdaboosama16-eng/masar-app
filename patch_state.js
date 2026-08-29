const fs = require('fs');
let code = fs.readFileSync('./src/components/SettingsModal.tsx', 'utf8');
code = code.replace(
  "const [newUserRole, setNewUserRole] = useState<UserRole>('cashier');",
  "const [newUserRole, setNewUserRole] = useState<UserRole>('cashier');\n  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);\n\n  useEffect(() => {\n    if (activeTab === 'users') {\n      setAuditLogs(getAuditLogs());\n    }\n  }, [activeTab]);"
);
fs.writeFileSync('./src/components/SettingsModal.tsx', code);
