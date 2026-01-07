
import React, { useState, useEffect } from 'react';
import { User, Role } from './types';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import LandingPage from './components/LandingPage';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [view, setView] = useState<'LANDING' | 'LOGIN' | 'DASHBOARD'>('LANDING');
  const [initialLoginRole, setInitialLoginRole] = useState<Role | undefined>();

  useEffect(() => {
    const saved = localStorage.getItem('ady_session');
    if (saved) {
      setCurrentUser(JSON.parse(saved));
      setView('DASHBOARD');
    }
  }, []);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('ady_session', JSON.stringify(user));
    setView('DASHBOARD');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('ady_session');
    setView('LANDING');
  };

  const handleLandingLoginClick = (role?: Role) => {
    setInitialLoginRole(role);
    setView('LOGIN');
  };

  return (
    <>
      {view === 'LANDING' && (
        <LandingPage 
          onLoginClick={handleLandingLoginClick} 
          onUploadClick={() => handleLandingLoginClick('ADMIN')}
        />
      )}
      {view === 'LOGIN' && (
        <Login 
          initialRole={initialLoginRole}
          onLogin={handleLogin} 
          onBack={() => setView('LANDING')}
        />
      )}
      {view === 'DASHBOARD' && currentUser && (
        <Dashboard 
          user={currentUser} 
          onLogout={handleLogout} 
          readOnly={false} // Read-only restriction removed to support public IP hosting
        />
      )}
    </>
  );
};

export default App;
