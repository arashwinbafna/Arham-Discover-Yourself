
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
import UserManagement from './UserManagement';

interface DashboardProps {
  user: User;
  onLogout: () => void;
  readOnly: boolean;
}

const Dashboard: React.FC<DashboardProps> = ({ user, onLogout, readOnly }) => {
  // Leaders start at OCR view now as they have full tracking capability
  const [activeTab, setActiveTab] = useState(user.role === 'ADMIN' ? 'ocr' : 'ocr');

  const navItems = user.role === 'ADMIN' ? [
    { id: 'ocr', label: 'OCR Upload', icon: 'fa-camera' },
    { id: 'meetings', label: 'Meetings', icon: 'fa-history' },
    { id: 'participants', label: 'Participants', icon: 'fa-users' },
    { id: 'leaders', label: 'Leaders Info', icon: 'fa-user-tie' },
    { id: 'users', label: 'User Management', icon: 'fa-user-gear' },
    { id: 'storage', label: 'Storage Sync', icon: 'fa-cloud' },
    { id: 'audit', label: 'Audit Logs', icon: 'fa-list-check' },
  ] : [
    { id: 'ocr', label: 'OCR Upload', icon: 'fa-camera' },
    { id: 'leader-view', label: 'My Group', icon: 'fa-users-gear' },
    { id: 'meetings', label: 'Meeting History', icon: 'fa-history' },
    { id: 'audit', label: 'Activity Logs', icon: 'fa-list-check' },
  ];

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r flex flex-col shadow-sm">
        <div className="p-6 border-b flex flex-col items-center">
          <div 
            className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold mb-3 shadow-lg"
            style={{ backgroundColor: user.role === 'ADMIN' ? COLORS.DEEP_RED : COLORS.PRIMARY }}
          >
            {user.username.charAt(0).toUpperCase()}
          </div>
          <h2 className="font-bold text-lg truncate w-full text-center">{user.username}</h2>
          <span className="text-[10px] bg-gray-100 px-3 py-1 rounded-full text-gray-600 uppercase font-black tracking-widest mt-1">
            {user.role}
          </span>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center space-x-3 p-3 rounded-xl transition-all ${
                activeTab === item.id ? 'text-white shadow-lg scale-[1.02]' : 'text-gray-500 hover:bg-gray-100'
              }`}
              style={activeTab === item.id ? { backgroundColor: user.role === 'ADMIN' ? COLORS.DEEP_RED : COLORS.PRIMARY } : {}}
            >
              <i className={`fas ${item.icon} w-5`}></i>
              <span className="font-bold text-sm">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t">
          <button 
            onClick={onLogout}
            className="w-full flex items-center justify-center space-x-2 p-3 text-red-600 font-bold hover:bg-red-50 rounded-xl transition-colors"
          >
            <i className="fas fa-sign-out-alt"></i>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-8 relative">
        <div className="max-w-6xl mx-auto">
          {activeTab === 'ocr' && <OCRUpload user={user} />}
          {activeTab === 'participants' && <ParticipantManager admin={user} />}
          {activeTab === 'leaders' && <LeaderManager admin={user} />}
          {activeTab === 'users' && <UserManagement admin={user} />}
          {activeTab === 'meetings' && <MeetingHistory user={user} />}
          {activeTab === 'storage' && <StorageSync admin={user} />}
          {activeTab === 'audit' && <AuditLogView user={user} />}
          {activeTab === 'leader-view' && <LeaderDashboard leaderUser={user} readOnly={readOnly} />}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
