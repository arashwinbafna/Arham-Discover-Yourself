
import React, { useState, useEffect, useRef } from 'react';
import { storageService } from '../services/storageService';
import { Leader, User } from '../types';
import { COLORS } from '../constants';

interface LeaderManagerProps {
  admin: User;
}

const LeaderManager: React.FC<LeaderManagerProps> = ({ admin }) => {
  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [isBulkAdding, setIsBulkAdding] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    groupName: ''
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLeaders(storageService.getLeaders());
  }, []);

  const createLeaderAccount = (leader: Leader) => {
    const existingUsers = storageService.getUsers();
    if (!existingUsers.find(u => u.username === leader.name)) {
      const newUser: User = {
        id: crypto.randomUUID(),
        username: leader.name, // Leader name is the username
        role: 'LEADER',
        leaderId: leader.id // Same as name in this system
      };
      storageService.saveUser(newUser);
      // In this demo, password is not explicitly stored in the User type, 
      // but handled logic-wise in Login.tsx for password "a".
    }
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.groupName) return;

    const newL: Leader = {
      id: formData.name.trim(),
      name: formData.name.trim(),
      phone: formData.phone,
      email: formData.email,
      groupName: formData.groupName.trim(),
      createdAt: Date.now()
    };

    if (leaders.some(l => l.id === newL.id)) {
      alert("A leader with this name already exists.");
      return;
    }

    storageService.addLeader(newL);
    createLeaderAccount(newL);
    setLeaders([...leaders, newL]);
    setIsAdding(false);
    setFormData({ name: '', phone: '', email: '', groupName: '' });
    storageService.log(admin.username, 'Leader Added', `Added leader ${newL.name} and auto-created user account.`);
  };

  const handleBulkUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const csv = event.target?.result as string;
      const lines = csv.split('\n');
      const newLeaders: Leader[] = [];
      const existingLeaders = storageService.getLeaders();
      
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const [name, phone, email, groupName] = line.split(',');
        if (name && groupName) {
          const leaderName = name.trim();
          if (!existingLeaders.some(l => l.id === leaderName) && !newLeaders.some(l => l.id === leaderName)) {
            const l: Leader = {
              id: leaderName,
              name: leaderName,
              phone: phone?.trim() || '',
              email: email?.trim() || '',
              groupName: groupName.trim(),
              createdAt: Date.now()
            };
            newLeaders.push(l);
          }
        }
      }

      newLeaders.forEach(l => {
        storageService.addLeader(l);
        createLeaderAccount(l);
      });
      
      setLeaders([...storageService.getLeaders()]);
      setIsBulkAdding(false);
      storageService.log(admin.username, 'Bulk Leader Upload', `Uploaded ${newLeaders.length} leaders and created accounts.`);
      alert(`Successfully uploaded ${newLeaders.length} leaders. Default password is "a".`);
    };
    reader.readAsText(file);
  };

  const downloadTemplate = () => {
    const csvContent = "name,phone,email,groupName\nArjun Singh,9876543210,arjun@example.com,South Zone\nMeera Devi,9123456789,meera@example.com,North Zone";
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'leader_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Manage Leaders</h1>
        <div className="flex space-x-2">
          <button 
            onClick={() => setIsBulkAdding(!isBulkAdding)}
            className="bg-gray-100 text-gray-700 px-4 py-2 rounded font-bold hover:bg-gray-200"
          >
            <i className="fas fa-file-import mr-2"></i> Bulk Upload
          </button>
          <button 
            onClick={() => { setIsAdding(!isAdding); setIsBulkAdding(false); }}
            className="bg-primary text-white px-4 py-2 rounded font-bold shadow"
            style={{ backgroundColor: COLORS.PRIMARY }}
          >
            {isAdding ? 'Cancel' : '+ New Leader'}
          </button>
        </div>
      </div>

      {isBulkAdding && (
        <div className="bg-white p-6 rounded-xl border border-dashed border-primary shadow-sm text-center">
          <h3 className="font-bold mb-2">Bulk Leader Upload</h3>
          <p className="text-sm text-gray-500 mb-4">Leader names will be used as their login username. Password will be "a".</p>
          <div className="flex justify-center space-x-4">
            <button 
              onClick={downloadTemplate}
              className="text-primary hover:underline text-sm font-bold"
            >
              <i className="fas fa-download mr-1"></i> Download CSV Template
            </button>
            <div className="relative">
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="bg-primary text-white px-6 py-2 rounded-lg font-bold"
                style={{ backgroundColor: COLORS.PRIMARY }}
              >
                Select CSV File
              </button>
              <input 
                ref={fileInputRef}
                type="file" 
                accept=".csv" 
                hidden 
                onChange={handleBulkUpload}
              />
            </div>
          </div>
        </div>
      )}

      {isAdding && (
        <form onSubmit={handleAdd} className="bg-white p-6 rounded-xl border shadow-sm grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1">Leader Name * (Used for login)</label>
            <input 
              required className="w-full p-2 border rounded" 
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Group Name *</label>
            <input 
              required className="w-full p-2 border rounded" 
              placeholder="e.g. South Zone"
              value={formData.groupName}
              onChange={e => setFormData({...formData, groupName: e.target.value})}
            />
          </div>
          <div className="md:col-span-2 pt-4">
            <button type="submit" className="bg-secondary text-white px-8 py-2 rounded font-bold">
              Save Leader & Create Account
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {leaders.map(l => (
          <div key={l.id} className="bg-white p-6 rounded-xl border shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-primary">
                <i className="fas fa-user-tie text-2xl"></i>
              </div>
              <div>
                <h3 className="font-bold text-lg">{l.name}</h3>
                <p className="text-sm text-gray-500 font-medium">{l.groupName}</p>
              </div>
            </div>
            <div className="text-xs text-gray-400 bg-gray-50 p-2 rounded">
              Login: <strong>{l.name}</strong> / PW: <strong>a</strong>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LeaderManager;
