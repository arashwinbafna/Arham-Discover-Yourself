
import React, { useState, useEffect } from 'react';
import { storageService } from '../services/storageService';
import { Participant, Leader, User } from '../types';
import { COLORS, DELETION_LOCK_DAYS, MASTER_PASSWORD } from '../constants';

interface ParticipantManagerProps {
  admin: User;
}

const ParticipantManager: React.FC<ParticipantManagerProps> = ({ admin }) => {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    altName1: '',
    altName2: '',
    phone: '',
    currentLeaderId: ''
  });

  useEffect(() => {
    setParticipants(storageService.getParticipants());
    setLeaders(storageService.getLeaders());
  }, []);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.currentLeaderId) return;

    const newP: Participant = {
      id: crypto.randomUUID(),
      ...formData,
      createdAt: Date.now()
    };

    storageService.addParticipant(newP);
    setParticipants([...participants, newP]);
    setIsAdding(false);
    setFormData({ fullName: '', altName1: '', altName2: '', phone: '', currentLeaderId: '' });
    storageService.log(admin.username, 'Participant Added', `Added ${newP.fullName}`);
  };

  const handleDelete = (id: string, name: string, createdAt: number) => {
    const daysSince = (Date.now() - createdAt) / (1000 * 60 * 60 * 24);
    
    if (daysSince < DELETION_LOCK_DAYS) {
      alert(`Deletion blocked. Participants cannot be deleted within first ${DELETION_LOCK_DAYS} days.`);
      return;
    }

    const mp = prompt(`Hard deletion of "${name}" requires Master Password:`);
    if (mp === MASTER_PASSWORD) {
      storageService.deleteParticipant(id);
      setParticipants(participants.filter(p => p.id !== id));
      storageService.log(admin.username, 'Participant Deleted', `Hard deleted ${name}`);
    } else {
      alert("Unauthorized.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Manage Participants</h1>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="bg-primary text-white px-4 py-2 rounded font-bold shadow"
        >
          {isAdding ? 'Cancel' : '+ New Participant'}
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleAdd} className="bg-white p-6 rounded-xl border shadow-sm grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1">Full Name *</label>
            <input 
              required className="w-full p-2 border rounded" 
              value={formData.fullName}
              onChange={e => setFormData({...formData, fullName: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Phone Number *</label>
            <input 
              required className="w-full p-2 border rounded" 
              placeholder="+91..."
              value={formData.phone}
              onChange={e => setFormData({...formData, phone: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Alt Name 1</label>
            <input 
              className="w-full p-2 border rounded" 
              value={formData.altName1}
              onChange={e => setFormData({...formData, altName1: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Alt Name 2</label>
            <input 
              className="w-full p-2 border rounded" 
              value={formData.altName2}
              onChange={e => setFormData({...formData, altName2: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Assigned Leader *</label>
            <select 
              required className="w-full p-2 border rounded"
              value={formData.currentLeaderId}
              onChange={e => setFormData({...formData, currentLeaderId: e.target.value})}
            >
              <option value="">Select a Leader</option>
              {leaders.map(l => (
                <option key={l.id} value={l.id}>{l.name} ({l.groupName})</option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2 pt-4">
            <button type="submit" className="bg-secondary text-white px-8 py-2 rounded font-bold">
              Save Participant
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="p-4">Name</th>
              <th className="p-4">Phone</th>
              <th className="p-4">Leader</th>
              <th className="p-4">Created</th>
              <th className="p-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y text-sm">
            {participants.map(p => (
              <tr key={p.id}>
                <td className="p-4">
                  <div className="font-bold">{p.fullName}</div>
                  <div className="text-xs text-gray-500">{[p.altName1, p.altName2].filter(Boolean).join(', ')}</div>
                </td>
                <td className="p-4">{p.phone}</td>
                <td className="p-4">
                  {leaders.find(l => l.id === p.currentLeaderId)?.name || 'Unknown'}
                </td>
                <td className="p-4 text-gray-500">
                  {new Date(p.createdAt).toLocaleDateString()}
                </td>
                <td className="p-4">
                  <button 
                    onClick={() => handleDelete(p.id, p.fullName, p.createdAt)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <i className="fas fa-trash"></i>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ParticipantManager;
