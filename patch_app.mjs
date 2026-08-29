import fs from 'fs';

let code = fs.readFileSync('./src/App.tsx', 'utf8');
code = code.replace(
`  // 2. Authentication Guard: If no active session, show Login Screen
  if (!currentUser) {
    return (
      <LoginScreen
        onLoginSuccess={(user) => {
          setCurrentUser(user);
        }}
      />
    );
  }`,
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
`
);

// We also need to replace currentUser with activeUser in the rest of the render if we defined it locally, but it's better to just update the state.
// Wait, replacing it in state via useEffect is better.
