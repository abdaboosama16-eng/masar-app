import fs from 'fs';

let code = fs.readFileSync('./src/App.tsx', 'utf8');
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
  const effectiveUser = currentUser || (settings.users ? settings.users.find(u => u.role === 'admin') : null) || { id: 'admin', name: 'المدير', role: 'admin', username: 'admin', pin: '0000', active: true, createdAt: new Date().toISOString() };
`
);

// Now replace currentUser with effectiveUser in the render method where it matters.
// But wait, the previous script might not have actually modified it because I didn't write the replacement back.
