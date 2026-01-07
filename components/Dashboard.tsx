
import React, { useState } from 'react';
import { User } from '../types';
import { COLORS } from '../constants';
import OCRUpload from './OCRUpload';
import ParticipantManager from './ParticipantManager';
import LeaderManager from './LeaderManager';
import MeetingHistory from './MeetingHistory';
import AuditLogView from './AuditLogView';
import LeaderDashboard from './LeaderDashboard';
import StorageSync from './StorageSync';

interface DashboardProps {
  user: User;
  onLogout: () => void;
  readOnly: boolean;
}

const Dashboard: React.FC<DashboardProps> = ({ user, onLogout, readOnly }) => {
  const [activeTab, setActiveTab] = useState(user.role === 'ADMIN' ? 'ocr' : 'leader-view');

  const navItems = user.role === 'ADMIN' ? [
    { id: 'ocr', label: 'OCR Upload', icon: 'fa-camera' },
    { id: 'meetings', label: 'Meetings', icon: 'fa-history' },
    { id: 'participants', label: 'Participants', icon: 'fa-users' },
    { id: 'leaders', label: 'Leaders', icon: 'fa-user-tie' },
    { id: 'storage', label: 'Storage Sync', icon: 'fa-cloud' },
    { id: 'audit', label: 'Audit Logs', icon: 'fa-list-check' },
  ] : [
    { id: 'leader-view', label: 'My Group', icon: 'fa-users-gear' },
    { id: 'audit', label: 'Activity Logs', icon: 'fa-list-check' },
  ];

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r flex flex-col shadow-sm">
        <div className="p-6 border-b flex flex-col items-center">
          <div 
            className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold mb-3"
            style={{ backgroundColor: COLORS.PRIMARY }}
          >
            {user.username.charAt(0).toUpperCase()}
          </div>
          <h2 className="font-bold text-lg truncate w-full text-center">{user.username}</h2>
          <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600 uppercase tracking-widest">
            {user.role}
          </span>
          {readOnly && (
            <span className="mt-1 text-[10px] text-red-500 font-bold uppercase">Cloud Read-Only</span>
          )}
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                activeTab === item.id ? 'bg-primary text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'
              }`}
              style={activeTab === item.id ? { backgroundColor: COLORS.PRIMARY } : {}}
            >
              <i className={`fas ${item.icon} w-5`}></i>
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t">
          <button 
            onClick={onLogout}
            className="w-full flex items-center justify-center space-x-2 p-3 text-deepRed font-bold hover:bg-red-50 rounded-lg"
          >
            <i className="fas fa-sign-out-alt"></i>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-8 relative">
        <div className="max-w-6xl mx-auto">
          {activeTab === 'ocr' && <OCRUpload admin={user} />}
          {activeTab === 'participants' && <ParticipantManager admin={user} />}
          {activeTab === 'leaders' && <LeaderManager admin={user} />}
          {activeTab === 'meetings' && <MeetingHistory admin={user} />}
          {activeTab === 'storage' && <StorageSync admin={user} />}
          {activeTab === 'audit' && <AuditLogView user={user} />}
          {activeTab === 'leader-view' && <LeaderDashboard leaderUser={user} readOnly={readOnly} />}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
