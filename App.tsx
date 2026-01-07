
import React, { useState, useEffect, useCallback } from 'react';
import { storageService } from './services/storageService';
import { User, Role } from './types';
import Login from './components/Login';
import Dashboard from './components/Dashboard';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isCloudReadOnly, setIsCloudReadOnly] = useState(false);

  useEffect(() => {
    // Check if we are in "Cloud Fallback" simulation
    // In a real app, this would be determined by connectivity or domain
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (!isLocal) {
      setIsCloudReadOnly(true);
    }

    // Load session
    const saved = localStorage.getItem('ady_session');
    if (saved) {
      setCurrentUser(JSON.parse(saved));
    }
  }, []);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('ady_session', JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('ady_session');
  };

  if (!currentUser) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <Dashboard 
      user={currentUser} 
      onLogout={handleLogout} 
      readOnly={isCloudReadOnly && currentUser.role === 'LEADER'} 
    />
  );
};

export default App;
