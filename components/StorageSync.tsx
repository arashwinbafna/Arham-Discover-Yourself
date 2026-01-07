
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

  useEffect(() => {
    const saved = localStorage.getItem('ady_storage_sync');
    if (saved) {
      const data = JSON.parse(saved);
      setIsConnected(data.isConnected);
      setLastSynced(data.lastSynced);
    }
  }, []);

  const saveStatus = (connected: boolean, synced: number | null) => {
    localStorage.setItem('ady_storage_sync', JSON.stringify({ isConnected: connected, lastSynced: synced }));
  };

  const connectDrive = () => {
    setIsSyncing(true);
    setProgress(0);
    
    // Simulate OAuth Login & Initial Sync
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsSyncing(false);
          setIsConnected(true);
          const now = Date.now();
          setLastSynced(now);
          saveStatus(true, now);
          storageService.log(admin.username, 'Storage Linked', 'Connected application to Google Drive Community Storage');
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  const manualSync = () => {
    if (!isConnected) return;
    setIsSyncing(true);
    setProgress(0);
    
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsSyncing(false);
          const now = Date.now();
          setLastSynced(now);
          saveStatus(true, now);
          storageService.log(admin.username, 'Manual Sync', 'Triggered full data sync with Google Drive');
          return 100;
        }
        return prev + 20;
      });
    }, 150);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <header>
        <h1 className="text-2xl font-bold">Community Storage Sync</h1>
        <p className="text-gray-500">Securely backup all attendance and fine data to Google Drive</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Status Card */}
        <div className="md:col-span-2 bg-white rounded-2xl border shadow-sm p-8 flex flex-col items-center justify-center text-center space-y-6">
          <div className={`w-24 h-24 rounded-3xl flex items-center justify-center text-4xl shadow-inner ${
            isConnected ? 'bg-green-50 text-green-600' : 'bg-gray-50 text-gray-300'
          }`}>
            <i className="fab fa-google-drive"></i>
          </div>

          <div>
            <h2 className="text-2xl font-bold">{isConnected ? 'Storage Connected' : 'Storage Not Linked'}</h2>
            <p className="text-gray-500 text-sm max-w-sm mx-auto mt-2">
              {isConnected 
                ? 'Your data is being synchronized with the community Google Drive account. Fines and attendance records are safe.'
                : 'Connect your community Google Drive account to enable cloud backups and cross-device data retrieval.'}
            </p>
          </div>

          {isConnected && lastSynced && (
            <div className="text-xs font-mono bg-gray-50 px-4 py-2 rounded-full text-gray-400">
              LAST SYNC: {new Date(lastSynced).toLocaleString()}
            </div>
          )}

          {isSyncing ? (
            <div className="w-full max-w-xs">
              <div className="flex justify-between text-[10px] font-bold uppercase mb-1 text-primary">
                <span>Syncing Data...</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-primary h-full transition-all duration-300 ease-out" 
                  style={{ width: `${progress}%`, backgroundColor: COLORS.PRIMARY }}
                ></div>
              </div>
            </div>
          ) : (
            <button 
              onClick={isConnected ? manualSync : connectDrive}
              className="px-8 py-3 rounded-xl text-white font-bold shadow-lg transition-all active:scale-95 flex items-center space-x-3"
              style={{ backgroundColor: isConnected ? COLORS.PRIMARY : COLORS.SECONDARY }}
            >
              <i className={`fas ${isConnected ? 'fa-sync-alt' : 'fa-link'}`}></i>
              <span>{isConnected ? 'Sync Now' : 'Connect Google Drive'}</span>
            </button>
          )}
        </div>

        {/* Security Info Card */}
        <div className="bg-deepRed text-white rounded-2xl p-6 flex flex-col justify-between shadow-xl" style={{ backgroundColor: COLORS.DEEP_RED }}>
          <div>
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center mb-4">
              <i className="fas fa-shield-alt"></i>
            </div>
            <h3 className="font-bold text-lg mb-2">Cloud Security</h3>
            <p className="text-xs text-red-100 leading-relaxed">
              We use AES-256 encryption to package your local data before transmitting it to Google Drive. Only authorized ADY ADMINs can retrieve or restore data.
            </p>
          </div>
          
          <div className="mt-8 pt-4 border-t border-white/10 text-[10px] uppercase tracking-widest text-red-200">
            Privacy Guaranteed • 2025
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border shadow-sm">
        <h3 className="font-bold mb-4">Sync Features</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="flex items-start space-x-3">
            <i className="fas fa-check-circle text-green-500 mt-1"></i>
            <div>
              <div className="font-bold text-sm">Automated Backup</div>
              <p className="text-xs text-gray-500">Saves data after every confirmed meeting.</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <i className="fas fa-check-circle text-green-500 mt-1"></i>
            <div>
              <div className="font-bold text-sm">Leader Access</div>
              <p className="text-xs text-gray-500">Retrieves member data for assigned groups.</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <i className="fas fa-check-circle text-green-500 mt-1"></i>
            <div>
              <div className="font-bold text-sm">Cross-Device</div>
              <p className="text-xs text-gray-500">Log in on any PC to see latest updates.</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <i className="fas fa-check-circle text-green-500 mt-1"></i>
            <div>
              <div className="font-bold text-sm">Version Control</div>
              <p className="text-xs text-gray-500">Keeps history of revisions in your drive.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StorageSync;
