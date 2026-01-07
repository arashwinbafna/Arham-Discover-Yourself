
import React, { useState } from 'react';
import { storageService } from '../services/storageService';
import { MASTER_PASSWORD, COLORS } from '../constants';
import { User, Role } from '../types';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [masterPass, setMasterPass] = useState('');
  const [role, setRole] = useState<Role>('LEADER');
  const [error, setError] = useState('');

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const users = storageService.getUsers();

    if (isRegistering) {
      if (masterPass !== MASTER_PASSWORD) {
        setError('Incorrect Master Password for registration.');
        return;
      }
      if (users.find(u => u.username === username)) {
        setError('Username already exists.');
        return;
      }
      const newUser: User = {
        id: crypto.randomUUID(),
        username,
        role,
        leaderId: role === 'LEADER' ? 'L-' + crypto.randomUUID().slice(0, 4) : undefined
      };
      // For simulation, we aren't storing passwords, just username check
      storageService.saveUser(newUser);
      storageService.log('SYSTEM', 'User Created', `User ${username} registered as ${role}`);
      onLogin(newUser);
    } else {
      const user = users.find(u => u.username === username);
      if (user) {
        onLogin(user);
      } else {
        // First time initialization auto-admin if no users exist
        if (users.length === 0 && username === 'admin' && masterPass === MASTER_PASSWORD) {
           const admin: User = { id: 'admin-id', username: 'admin', role: 'ADMIN' };
           storageService.saveUser(admin);
           onLogin(admin);
        } else {
          setError('Invalid credentials or user not found.');
        }
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md border-t-8" style={{ borderColor: COLORS.PRIMARY }}>
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{ color: COLORS.DEEP_RED }}>ADY 2025</h1>
          <p className="text-gray-500">Attendance & Fine Management System</p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-1">Username</label>
            <input 
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary outline-none"
              type="text" 
              required 
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Enter your username"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1">Password</label>
            <input 
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary outline-none"
              type="password" 
              required 
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter password"
            />
          </div>

          {isRegistering && (
            <>
              <div>
                <label className="block text-sm font-semibold mb-1">Role</label>
                <select 
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary outline-none"
                  value={role}
                  onChange={e => setRole(e.target.value as Role)}
                >
                  <option value="LEADER">Leader</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Master Password</label>
                <input 
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary outline-none"
                  type="password" 
                  required 
                  value={masterPass}
                  onChange={e => setMasterPass(e.target.value)}
                  placeholder="Master Password Required"
                />
              </div>
            </>
          )}

          {(!isRegistering && storageService.getUsers().length === 0) && (
             <div className="text-xs text-blue-600 mb-2 italic">
               System is uninitialized. Log in as 'admin' with Master Password to start.
             </div>
          )}

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button 
            type="submit"
            className="w-full py-3 rounded-lg text-white font-bold transition-transform active:scale-95"
            style={{ backgroundColor: COLORS.PRIMARY }}
          >
            {isRegistering ? 'Create Profile' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button 
            onClick={() => setIsRegistering(!isRegistering)}
            className="text-sm text-primary hover:underline"
          >
            {isRegistering ? 'Already have an account? Sign In' : 'Need an admin/leader account? Register'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
