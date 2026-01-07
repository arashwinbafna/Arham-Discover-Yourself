
import React, { useState, useEffect, useRef } from 'react';
import { storageService } from '../services/storageService';
import { MASTER_PASSWORD, COLORS } from '../constants';
import { User, Role } from '../types';

interface LoginProps {
  initialRole?: Role;
  onLogin: (user: User) => void;
  onBack: () => void;
}

const REQUIRED_ADMIN_EMAIL = 'arhamdiscoveryourself@gmail.com';
const GOOGLE_CLIENT_ID = "307313351534-3tl4bh4sups3oiuglugv90i945nv1r08.apps.googleusercontent.com"; 

const Login: React.FC<LoginProps> = ({ initialRole, onLogin, onBack }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [masterPass, setMasterPass] = useState('');
  const [role, setRole] = useState<Role>(initialRole || 'LEADER');
  const [error, setError] = useState('');
  const [showConfigHint, setShowConfigHint] = useState(false);
  const googleBtnRef = useRef<HTMLDivElement>(null);

  const parseJwt = (token: string) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(jsonPayload);
    } catch (e) {
      return null;
    }
  };

  const handleGoogleResponse = (response: any) => {
    const payload = parseJwt(response.credential);
    
    if (!payload || !payload.email) {
      setError("Failed to verify Google Identity. Please ensure you are logged in.");
      return;
    }

    const authenticatedEmail = payload.email.toLowerCase().trim();

    if (authenticatedEmail !== REQUIRED_ADMIN_EMAIL.toLowerCase()) {
      setError(`UNAUTHORIZED: Access restricted. You logged in as ${authenticatedEmail}. Only ${REQUIRED_ADMIN_EMAIL} is allowed.`);
      if ((window as any).google) (window as any).google.accounts.id.disableAutoSelect();
      return;
    }

    const adminUser: User = {
      id: 'admin-primary',
      username: REQUIRED_ADMIN_EMAIL,
      role: 'ADMIN'
    };
    
    storageService.saveUser(adminUser);
    storageService.log('SYSTEM', 'Admin Secure Login', `Verified Admin ${REQUIRED_ADMIN_EMAIL} authenticated via Google.`);
    onLogin(adminUser);
  };

  useEffect(() => {
    if (initialRole) setRole(initialRole);

    const initGoogle = () => {
      const google = (window as any).google;
      if (role === 'ADMIN' && google && google.accounts) {
        google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleResponse,
          auto_select: false,
          cancel_on_tap_outside: true,
          itp_support: true
        });

        if (googleBtnRef.current) {
          google.accounts.id.renderButton(googleBtnRef.current, {
            type: "standard",
            theme: "filled_blue",
            size: "large",
            text: "signin_with",
            shape: "pill",
            logo_alignment: "left",
            width: 320
          });
        }
      } else if (role === 'ADMIN' && !google) {
        setTimeout(initGoogle, 500);
      }
    };

    initGoogle();
  }, [role, initialRole]);

  const handleLeaderAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const users = storageService.getUsers();
    const normalizedUsername = username.toLowerCase().trim();
    const normalizedPassword = password.toLowerCase().trim();

    if (isRegistering) {
      if (masterPass.toLowerCase().trim() !== MASTER_PASSWORD.toLowerCase().trim()) {
        setError('Incorrect Master Password.');
        return;
      }
      if (users.find(u => u.username.toLowerCase() === normalizedUsername)) {
        setError('Username already registered.');
        return;
      }
      const newUser: User = {
        id: crypto.randomUUID(),
        username: username.trim(),
        role: 'LEADER',
        leaderId: username.trim()
      };
      storageService.saveUser(newUser);
      onLogin(newUser);
    } else {
      const user = users.find(u => u.username.toLowerCase() === normalizedUsername && u.role === 'LEADER');
      if (user && normalizedPassword === 'a') {
        onLogin(user);
      } else {
        setError('Invalid credentials for leader.');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-md border-t-8 relative" style={{ borderColor: role === 'ADMIN' ? COLORS.DEEP_RED : COLORS.PRIMARY }}>
        <button onClick={onBack} className="absolute top-6 right-6 text-gray-400 hover:text-gray-600">
          <i className="fas fa-times text-xl"></i>
        </button>

        <div className="text-center mb-10">
          <div className="w-20 h-20 mx-auto mb-4 bg-gray-50 rounded-3xl flex items-center justify-center text-3xl text-deepRed shadow-sm border border-gray-100">
            <i className={role === 'ADMIN' ? 'fas fa-fingerprint' : 'fas fa-user-tie'}></i>
          </div>
          <h1 className="text-2xl font-black tracking-tight" style={{ color: COLORS.DEEP_RED }}>ADY Sadhana Tracker</h1>
          <p className="text-gray-400 font-bold uppercase tracking-widest text-[9px] mt-1">
            {role} Portal Access
          </p>
        </div>

        {role === 'ADMIN' ? (
          <div className="space-y-6">
            <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex items-center space-x-4">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-blue-600 shadow-sm shrink-0">
                <i className="fas fa-envelope-shield"></i>
              </div>
              <div className="text-left">
                <p className="text-[10px] text-blue-800 font-bold uppercase tracking-tighter">Authorized Admin Email</p>
                <p className="text-sm font-bold text-blue-900 truncate">{REQUIRED_ADMIN_EMAIL}</p>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center py-6 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
               <div ref={googleBtnRef} className="min-h-[44px]"></div>
               
               <button 
                 onClick={() => setShowConfigHint(!showConfigHint)}
                 className="text-[9px] text-primary mt-4 hover:underline font-bold uppercase tracking-widest flex items-center"
               >
                 <i className="fas fa-info-circle mr-1"></i> Fixing "invalid_client" (401 Error)
               </button>
            </div>

            {showConfigHint && (
              <div className="p-5 bg-yellow-50 border border-yellow-100 rounded-2xl text-left space-y-3 animate-fadeIn shadow-inner">
                <p className="text-[10px] font-bold text-yellow-800 uppercase tracking-widest flex items-center">
                   <i className="fas fa-tools mr-2"></i> Fix Instructions:
                </p>
                <div className="space-y-2">
                  <p className="text-[10px] text-yellow-700 leading-normal">
                    1. Go to <strong>Google Cloud Console</strong> &gt; Credentials.
                  </p>
                  <p className="text-[10px] text-yellow-700 leading-normal">
                    2. Add this exact origin to <strong>"Authorized JavaScript origins"</strong>:
                  </p>
                  <div className="p-2 bg-white/50 rounded border border-yellow-200 text-[10px] font-mono select-all truncate text-yellow-900 font-bold">
                    {window.location.origin}
                  </div>
                  <p className="text-[10px] text-yellow-700 leading-normal italic">
                    Note: It may take 5 minutes for Google to update after you save.
                  </p>
                </div>
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-start space-x-2 animate-shake">
                <i className="fas fa-lock text-red-500 mt-0.5"></i>
                <p className="text-xs text-red-600 font-bold leading-tight">{error}</p>
              </div>
            )}

            <div className="text-center pt-2">
               <div className="flex justify-center items-center space-x-2 opacity-50">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                  <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">TLS Secure Identity Layer</span>
               </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleLeaderAuth} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold uppercase mb-1 text-gray-400 ml-1">Username</label>
              <input 
                className="w-full p-4 bg-gray-50 border-0 rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all font-medium"
                type="text" required value={username} onChange={e => setUsername(e.target.value)}
                placeholder="Leader Name"
              />
            </div>

            {!isRegistering && (
              <div>
                <label className="block text-[10px] font-bold uppercase mb-1 text-gray-400 ml-1">Password</label>
                <input 
                  className="w-full p-4 bg-gray-50 border-0 rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all font-medium"
                  type="password" required value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="Password (default 'a')"
                />
              </div>
            )}

            {isRegistering && (
              <div>
                <label className="block text-[10px] font-bold uppercase mb-1 text-gray-400 ml-1">Master Password</label>
                <input 
                  className="w-full p-4 bg-gray-50 border-0 rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all font-medium"
                  type="password" required value={masterPass} onChange={e => setMasterPass(e.target.value)}
                  placeholder="ADY Master Password"
                />
              </div>
            )}

            {error && <p className="text-red-500 text-[10px] font-bold uppercase text-center">{error}</p>}

            <button 
              type="submit"
              className="w-full py-4 rounded-2xl text-white font-black uppercase tracking-widest text-sm transition-all active:scale-95 shadow-xl hover:opacity-90"
              style={{ backgroundColor: COLORS.PRIMARY }}
            >
              {isRegistering ? 'Register Leader' : 'Sign In'}
            </button>

            <div className="text-center pt-2">
              <button 
                type="button"
                onClick={() => setIsRegistering(!isRegistering)}
                className="text-[10px] text-primary font-bold uppercase tracking-widest hover:underline"
              >
                {isRegistering ? 'Back to Login' : 'Register New Account'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Login;
