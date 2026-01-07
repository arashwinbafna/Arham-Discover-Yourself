
import React, { useState } from 'react';
import { storageService } from '../services/storageService';
import { MASTER_PASSWORD, COLORS } from '../constants';
import { User, Role } from '../types';

interface LoginProps {
  onLogin: (user: User) => void;
  onBack: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin, onBack }) => {
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
    const normalizedUsername = username.toLowerCase().trim();
    const normalizedPassword = password.toLowerCase().trim();
    const normalizedMasterPass = masterPass.toLowerCase().trim();
    const normalizedGlobalMasterPass = MASTER_PASSWORD.toLowerCase().trim();

    if (isRegistering) {
      if (normalizedMasterPass !== normalizedGlobalMasterPass) {
        setError('Incorrect Master Password for registration.');
        return;
      }
      if (users.find(u => u.username.toLowerCase() === normalizedUsername)) {
        setError('Username already exists.');
        return;
      }
      const newUser: User = {
        id: crypto.randomUUID(),
        username: username.trim(), // Keep original casing for display, but check insensitive
        role,
        leaderId: role === 'LEADER' ? username.trim() : undefined
      };
      storageService.saveUser(newUser);
      storageService.log('SYSTEM', 'User Created', `User ${username} registered as ${role}`);
      onLogin(newUser);
    } else {
      // Admin bypass - case insensitive
      if (normalizedUsername === 'admin' && normalizedPassword === normalizedGlobalMasterPass) {
        let admin = users.find(u => u.username.toLowerCase() === 'admin' && u.role === 'ADMIN');
        if (!admin) {
          admin = { id: 'admin-id', username: 'admin', role: 'ADMIN' };
          storageService.saveUser(admin);
        }
        onLogin(admin);
        return;
      }

      const user = users.find(u => u.username.toLowerCase() === normalizedUsername);
      if (user) {
        // Enforce default password 'a' (case-insensitive) for leaders
        if (user.role === 'LEADER' && normalizedPassword !== 'a') {
          setError('Invalid password for leader account.');
          return;
        }
        onLogin(user);
      } else {
        setError('Invalid credentials or user not found.');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md border-t-8 relative" style={{ borderColor: COLORS.PRIMARY }}>
        <button 
          onClick={onBack}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <i className="fas fa-times text-xl"></i>
        </button>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{ color: COLORS.DEEP_RED }}>ADY Sadhana tracker</h1>
          <p className="text-gray-500">Sign in to your account</p>
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
              placeholder="Enter name (e.g. Arjun Singh)"
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
              placeholder="Password (default is 'a')"
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
          <p className="text-xs text-gray-400 mb-4 italic">Login is case-insensitive</p>
          <button 
            onClick={() => setIsRegistering(!isRegistering)}
            className="text-sm text-primary font-bold hover:underline"
          >
            {isRegistering ? 'Already have an account? Sign In' : 'New Leader Registration'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
