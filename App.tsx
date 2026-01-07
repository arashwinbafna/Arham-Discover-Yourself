
import React, { useState, useEffect } from 'react';
import { storageService } from './services/storageService';
import { User } from './types';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import LandingPage from './components/LandingPage';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isCloudReadOnly, setIsCloudReadOnly] = useState(false);
  const [view, setView] = useState<'LANDING' | 'LOGIN' | 'DASHBOARD'>('LANDING');

  useEffect(() => {
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (!isLocal) {
      setIsCloudReadOnly(true);
    }

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

  const startOCRFlow = () => {
    if (currentUser?.role === 'ADMIN') {
      setView('DASHBOARD');
    } else {
      setView('LOGIN');
    }
  };

  return (
    <>
      {view === 'LANDING' && (
        <LandingPage 
          onLoginClick={() => setView('LOGIN')} 
          onUploadClick={startOCRFlow}
        />
      )}
      {view === 'LOGIN' && (
        <Login 
          onLogin={handleLogin} 
          onBack={() => setView('LANDING')}
        />
      )}
      {view === 'DASHBOARD' && currentUser && (
        <Dashboard 
          user={currentUser} 
          onLogout={handleLogout} 
          readOnly={isCloudReadOnly && currentUser.role === 'LEADER'} 
        />
      )}
    </>
  );
};

export default App;
