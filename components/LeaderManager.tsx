
import React, { useState, useEffect } from 'react';
import { storageService } from '../services/storageService';
import { Leader, User } from '../types';

interface LeaderManagerProps {
  admin: User;
}

const LeaderManager: React.FC<LeaderManagerProps> = ({ admin }) => {
  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    groupName: ''
  });

  useEffect(() => {
    setLeaders(storageService.getLeaders());
  }, []);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.groupName) return;

    const newL: Leader = {
      id: crypto.randomUUID(),
      ...formData,
      createdAt: Date.now()
    };

    storageService.addLeader(newL);
    setLeaders([...leaders, newL]);
    setIsAdding(false);
    setFormData({ name: '', phone: '', email: '', groupName: '' });
    storageService.log(admin.username, 'Leader Added', `Added leader ${newL.name} for group ${newL.groupName}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Manage Leaders</h1>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="bg-primary text-white px-4 py-2 rounded font-bold shadow"
        >
          {isAdding ? 'Cancel' : '+ New Leader'}
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleAdd} className="bg-white p-6 rounded-xl border shadow-sm grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1">Leader Name *</label>
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
          <div>
            <label className="block text-sm mb-1">Phone Number</label>
            <input 
              className="w-full p-2 border rounded" 
              value={formData.phone}
              onChange={e => setFormData({...formData, phone: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Email</label>
            <input 
              className="w-full p-2 border rounded" 
              type="email"
              value={formData.email}
              onChange={e => setFormData({...formData, email: e.target.value})}
            />
          </div>
          <div className="md:col-span-2 pt-4">
            <button type="submit" className="bg-secondary text-white px-8 py-2 rounded font-bold">
              Save Leader
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
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <i className="fas fa-phone w-5"></i>
                <span>{l.phone || 'No phone'}</span>
              </div>
              <div className="flex items-center space-x-2">
                <i className="fas fa-envelope w-5"></i>
                <span>{l.email || 'No email'}</span>
              </div>
            </div>
          </div>
        ))}
        {leaders.length === 0 && (
          <div className="md:col-span-3 text-center py-12 text-gray-400">
            No leaders added yet.
          </div>
        )}
      </div>
    </div>
  );
};

export default LeaderManager;
