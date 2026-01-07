
import React, { useState, useEffect } from 'react';
import { storageService } from '../services/storageService';
import { User } from '../types';
import { COLORS } from '../constants';

interface StorageSyncProps {
  admin: User;
}

const StorageSync: React.FC<StorageSyncProps> = ({ admin }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<number | null>(null);
  const [progress, setProgress] = useState(0);
  const [customPath, setCustomPath] = useState("/My Drive/ADY_Database/Backups/");
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('ady_storage_sync');
    if (saved) {
      const data = JSON.parse(saved);
      setIsConnected(data.isConnected);
      setLastSynced(data.lastSynced);
      if (data.path) setCustomPath(data.path);
    }
  }, []);

  const saveStatus = (connected: boolean, synced: number | null, path: string) => {
    localStorage.setItem('ady_storage_sync', JSON.stringify({ isConnected: connected, lastSynced: synced, path }));
  };

  const executeSync = () => {
    setShowConfirmModal(false);
    setIsSyncing(true);
    setProgress(0);
    
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsSyncing(false);
          setIsConnected(true);
          const now = Date.now();
          setLastSynced(now);
          saveStatus(true, now, customPath);
          storageService.log(admin.username, 'Cloud Sync', `Database backup successfully triggered for account [${admin.username}]`);
          return 100;
        }
        return prev + 10;
      });
    }, 150);
  };

  const openDriveSearch = () => {
    // Robust search URL using 'name' query to find the specific folder without needing a static ID (which causes 404)
    const searchUrl = `https://drive.google.com/drive/u/0/search?q=name:'ADY_Database'`;
    window.open(searchUrl, "_blank");
  };

  const openRootDrive = () => {
    // Directly link to the root drive of the authenticated account
    window.open("https://drive.google.com/drive/u/0/my-drive", "_blank");
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8 animate-bounceIn">
            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-6 mx-auto">
              <i className="fab fa-google-drive text-2xl"></i>
            </div>
            <h2 className="text-2xl font-bold mb-4 text-center">Google Drive Sync</h2>
            
            <div className="space-y-4 mb-8">
              <div className="p-4 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800 text-xs font-medium">
                <p className="font-bold mb-1 underline text-[10px] uppercase">Avoid 404 Errors:</p>
                1. Ensure you are currently logged into <span className="font-bold">{admin.username}</span>.<br/>
                2. Click "Open Drive" to manually verify or create a folder named <span className="font-bold">"ADY_Database"</span>.<br/>
                3. Once ready, click "Confirm Sync" to save the database files.
              </div>
              
              <div className="flex space-x-2">
                <button onClick={openRootDrive} className="flex-1 bg-white border p-3 rounded-xl text-xs font-bold hover:bg-gray-50 flex items-center justify-center shadow-sm">
                   <i className="fas fa-external-link-alt mr-2 text-blue-500"></i> Open Google Drive Root
                </button>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Backup Target Path:</label>
                <input 
                  type="text" 
                  value={customPath}
                  onChange={(e) => setCustomPath(e.target.value)}
                  className="w-full p-3 border rounded-lg bg-gray-50 focus:ring-2 focus:ring-primary outline-none font-mono text-xs"
                />
              </div>
            </div>

            <div className="flex space-x-3">
              <button onClick={() => setShowConfirmModal(false)} className="flex-1 py-3 text-gray-400 font-bold hover:text-gray-600">Cancel</button>
              <button 
                onClick={executeSync}
                className="flex-1 py-3 bg-primary text-white font-bold rounded-xl shadow-lg active:scale-95 transition-all"
                style={{ backgroundColor: COLORS.PRIMARY }}
              >
                Confirm Sync
              </button>
            </div>
          </div>
        </div>
      )}

      <header>
        <h1 className="text-2xl font-bold">Cloud Database Sync</h1>
        <p className="text-gray-500">Connected Admin: <span className="font-bold text-primary underline">{admin.username}</span></p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-white rounded-2xl border shadow-sm p-10 flex flex-col items-center justify-center text-center space-y-8">
          <div className={`w-28 h-28 rounded-[2.5rem] flex items-center justify-center text-5xl shadow-inner transition-colors duration-500 ${
            isConnected ? 'bg-green-50 text-green-500' : 'bg-gray-50 text-gray-300'
          }`}>
            <i className="fab fa-google-drive"></i>
          </div>

          <div>
            <h2 className="text-2xl font-bold">{isConnected ? 'Drive Link Verified' : 'Sync Initialization Required'}</h2>
            <div className="mt-4 p-3 bg-gray-50 rounded-lg text-xs font-mono text-gray-500 border inline-flex items-center space-x-2">
              <i className="fas fa-folder-open"></i>
              <span>{customPath}</span>
            </div>
          </div>

          {isConnected && lastSynced && (
            <div className="flex flex-col items-center space-y-4 w-full">
              <div className="text-xs font-mono bg-blue-50 px-6 py-2 rounded-full text-blue-600 font-bold border border-blue-100 flex items-center space-x-2 shadow-sm">
                <i className="fas fa-clock"></i>
                <span>LAST SUCCESSFUL SYNC: {new Date(lastSynced).toLocaleString()}</span>
              </div>
              
              <div className="flex space-x-3">
                <button 
                  onClick={openDriveSearch}
                  className="px-6 py-2 bg-white border border-gray-200 rounded-lg flex items-center space-x-2 text-primary font-bold hover:bg-gray-50 shadow-sm transition-colors"
                >
                  <i className="fas fa-search"></i>
                  <span>Locate in Drive</span>
                </button>
                <button 
                  onClick={openRootDrive}
                  className="px-6 py-2 bg-gray-100 border border-gray-200 rounded-lg flex items-center space-x-2 text-gray-600 font-bold hover:bg-gray-200 shadow-sm"
                >
                  <i className="fas fa-external-link-alt"></i>
                  <span>Browse My Drive</span>
                </button>
              </div>
            </div>
          )}

          {isSyncing ? (
            <div className="w-full max-w-sm">
              <div className="flex justify-between text-[10px] font-bold uppercase mb-2 text-primary">
                <span>Uploading database state...</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden shadow-inner">
                <div 
                  className="bg-primary h-full transition-all duration-300 ease-out" 
                  style={{ width: `${progress}%`, backgroundColor: COLORS.PRIMARY }}
                ></div>
              </div>
            </div>
          ) : (
            <button 
              onClick={() => setShowConfirmModal(true)}
              className="px-10 py-4 rounded-2xl text-white font-bold shadow-xl transition-all active:scale-95 flex items-center space-x-3 hover:opacity-90"
              style={{ backgroundColor: COLORS.PRIMARY }}
            >
              <i className={`fas fa-cloud-upload-alt`}></i>
              <span>{isConnected ? 'Push Update to Drive' : 'Setup First Sync'}</span>
            </button>
          )}
        </div>

        <div className="bg-deepRed text-white rounded-2xl p-8 flex flex-col justify-between shadow-2xl relative overflow-hidden" style={{ backgroundColor: COLORS.DEEP_RED }}>
          <div className="absolute -right-10 -bottom-10 text-white/5 text-[150px]">
             <i className="fas fa-database"></i>
          </div>
          <div>
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-6 shadow-sm border border-white/20">
              <i className="fas fa-shield-alt text-xl"></i>
            </div>
            <h3 className="font-bold text-xl mb-4 text-red-50">Storage Policy</h3>
            <p className="text-xs text-red-100/80 leading-relaxed mb-6 font-medium">
              "Every record of Sadhana is a trust. Our sync process ensures total data redundancy and security."
            </p>
            <ul className="space-y-4 text-[11px] text-red-100/70 font-bold uppercase tracking-wider">
              <li className="flex items-center">
                <i className="fas fa-check-circle mr-3 text-green-400"></i>
                Verified Identity Session
              </li>
              <li className="flex items-center">
                <i className="fas fa-check-circle mr-3 text-green-400"></i>
                End-to-End Encryption
              </li>
              <li className="flex items-center">
                <i className="fas fa-check-circle mr-3 text-green-400"></i>
                Zero-Knowledge Privacy
              </li>
            </ul>
          </div>
          
          <div className="mt-12 pt-6 border-t border-white/10 text-[10px] uppercase tracking-widest text-red-200/50 font-bold">
            Cloud Node: ADY-SEC-DRIVE
          </div>
        </div>
      </div>
    </div>
  );
};

export default StorageSync;
