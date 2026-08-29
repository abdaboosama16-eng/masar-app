import fs from 'fs';
let code = fs.readFileSync('./src/App.tsx', 'utf8');

// Restore original
code = code.replace(
`  // 2. Authentication Guard: If no active session, show Login Screen
  if (settings.requireLogin && !currentUser) {
    return (
      <LoginScreen
        onLoginSuccess={(user) => {
          setCurrentUser(user);
        }}
      />
    );
  }

  // If requireLogin is false and no user is set, default to admin
  const activeUser = currentUser || (settings.users ? settings.users.find(u => u.role === 'admin') : null) || { id: 'admin', name: 'المدير', role: 'admin', username: 'admin', pin: '0000', active: true, createdAt: new Date().toISOString() };
`,
`  // 2. Authentication Guard: If no active session, show Login Screen
  if (!currentUser) {
    return (
      <LoginScreen
        onLoginSuccess={(user) => {
          setCurrentUser(user);
        }}
      />
    );
  }`
);

// Apply new changes
const search = `  // 2. Authentication Guard: If no active session, show Login Screen
  if (!currentUser) {
    return (
      <LoginScreen
        onLoginSuccess={(user) => {
          setCurrentUser(user);
        }}
      />
    );
  }`;

const replace = `  // 2. Authentication Guard: If no active session, show Login Screen
  if (settings.requireLogin && !currentUser) {
    return (
      <LoginScreen
        onLoginSuccess={(user) => {
          setCurrentUser(user);
        }}
      />
    );
  }

  const effectiveUser = currentUser || (settings.users ? settings.users.find(u => u.role === 'admin') : null) || { id: 'admin', name: 'المدير الأساسي', role: 'admin', username: 'admin', pin: '0000', active: true, createdAt: new Date().toISOString() };
`;

code = code.replace(search, replace);
code = code.replace(/currentUser\.role/g, 'effectiveUser.role');
code = code.replace(/currentUser\.name/g, 'effectiveUser.name');

fs.writeFileSync('./src/App.tsx', code);
