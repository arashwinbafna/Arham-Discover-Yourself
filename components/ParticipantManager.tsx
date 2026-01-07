
import React, { useState, useEffect, useRef } from 'react';
import { storageService } from '../services/storageService';
import { Participant, Leader, User } from '../types';
import { COLORS, MASTER_PASSWORD } from '../constants';

interface ParticipantManagerProps {
  admin: User;
}

const ParticipantManager: React.FC<ParticipantManagerProps> = ({ admin }) => {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [isBulkAdding, setIsBulkAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    fullName: '',
    altName1: '',
    altName2: '',
    phone: '',
    currentLeaderId: ''
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setParticipants(storageService.getParticipants());
    setLeaders(storageService.getLeaders());
  }, []);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.currentLeaderId) return;

    if (editingId) {
      const updatedP: Participant = {
        ...participants.find(p => p.id === editingId)!,
        ...formData
      };
      storageService.updateParticipant(updatedP);
      setParticipants(participants.map(p => p.id === editingId ? updatedP : p));
      storageService.log(admin.username, 'Participant Updated', `Updated ${updatedP.fullName}`);
      setEditingId(null);
    } else {
      const newP: Participant = {
        id: crypto.randomUUID(),
        ...formData,
        createdAt: Date.now()
      };
      storageService.addParticipant(newP);
      setParticipants([...participants, newP]);
      storageService.log(admin.username, 'Participant Added', `Added ${newP.fullName}`);
    }

    setIsAdding(false);
    setFormData({ fullName: '', altName1: '', altName2: '', phone: '', currentLeaderId: '' });
  };

  const startEdit = (p: Participant) => {
    setEditingId(p.id);
    setFormData({
      fullName: p.fullName,
      altName1: p.altName1 || '',
      altName2: p.altName2 || '',
      phone: p.phone,
      currentLeaderId: p.currentLeaderId
    });
    setIsAdding(true);
    setIsBulkAdding(false);
  };

  const handleBulkUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const csv = event.target?.result as string;
      const lines = csv.split('\n');
      const newParticipants: Participant[] = [];
      
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const [fullName, altName1, altName2, phone, leaderName] = line.split(',');
        if (fullName && leaderName) {
          newParticipants.push({
            id: crypto.randomUUID(),
            fullName: fullName.trim(),
            altName1: altName1?.trim() || '',
            altName2: altName2?.trim() || '',
            phone: phone?.trim() || '',
            currentLeaderId: leaderName.trim(), 
            createdAt: Date.now()
          });
        }
      }

      newParticipants.forEach(p => storageService.addParticipant(p));
      setParticipants([...storageService.getParticipants()]);
      setIsBulkAdding(false);
      storageService.log(admin.username, 'Bulk Participant Upload', `Uploaded ${newParticipants.length} participants`);
      alert(`Successfully uploaded ${newParticipants.length} participants.`);
    };
    reader.readAsText(file);
  };

  const downloadTemplate = () => {
    const csvContent = "fullName,altName1,altName2,phone,leaderName\nJohn Doe,Johnny,J,9876543210,Arjun Singh";
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'participant_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleDelete = (id: string, name: string) => {
    const mp = prompt(`Hard deletion of "${name}" requires Master Password (case-insensitive):`);
    if (mp?.toLowerCase() === MASTER_PASSWORD.toLowerCase()) {
      storageService.deleteParticipant(id);
      setParticipants(participants.filter(p => p.id !== id));
      storageService.log(admin.username, 'Participant Deleted', `Hard deleted ${name}`);
    } else if (mp !== null) {
      alert("Unauthorized.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Manage Participants</h1>
        <div className="flex space-x-2">
          <button 
            onClick={() => setIsBulkAdding(!isBulkAdding)}
            className="bg-gray-100 text-gray-700 px-4 py-2 rounded font-bold hover:bg-gray-200"
          >
            <i className="fas fa-file-import mr-2"></i> Bulk Upload
          </button>
          <button 
            onClick={() => { 
              setIsAdding(!isAdding); 
              setIsBulkAdding(false); 
              setEditingId(null);
              setFormData({ fullName: '', altName1: '', altName2: '', phone: '', currentLeaderId: '' });
            }}
            className="bg-primary text-white px-4 py-2 rounded font-bold shadow"
            style={{ backgroundColor: COLORS.PRIMARY }}
          >
            {isAdding ? 'Cancel' : '+ New Participant'}
          </button>
        </div>
      </div>

      {isBulkAdding && (
        <div className="bg-white p-6 rounded-xl border border-dashed border-primary shadow-sm text-center">
          <h3 className="font-bold mb-2">Bulk Participant Upload</h3>
          <p className="text-sm text-gray-500 mb-4">Upload a CSV file. Leader names must match exactly.</p>
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
        <form onSubmit={handleAdd} className="bg-white p-6 rounded-xl border shadow-sm grid grid-cols-1 md:grid-cols-2 gap-4 animate-fadeIn">
          <div className="md:col-span-2 flex justify-between">
            <h3 className="font-bold">{editingId ? 'Edit Participant' : 'New Participant'}</h3>
          </div>
          <div>
            <label className="block text-sm mb-1 font-semibold">Full Name *</label>
            <input 
              required className="w-full p-2 border rounded outline-none focus:ring-1 focus:ring-primary" 
              value={formData.fullName}
              onChange={e => setFormData({...formData, fullName: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm mb-1 font-semibold">Phone Number *</label>
            <input 
              required className="w-full p-2 border rounded outline-none focus:ring-1 focus:ring-primary" 
              placeholder="+91..."
              value={formData.phone}
              onChange={e => setFormData({...formData, phone: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm mb-1 font-semibold">Alt Name 1</label>
            <input 
              className="w-full p-2 border rounded outline-none focus:ring-1 focus:ring-primary" 
              value={formData.altName1}
              onChange={e => setFormData({...formData, altName1: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm mb-1 font-semibold">Alt Name 2</label>
            <input 
              className="w-full p-2 border rounded outline-none focus:ring-1 focus:ring-primary" 
              value={formData.altName2}
              onChange={e => setFormData({...formData, altName2: e.target.value})}
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm mb-1 font-semibold">Assigned Leader *</label>
            <select 
              required className="w-full p-2 border rounded outline-none focus:ring-1 focus:ring-primary"
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
            <button type="submit" className="bg-secondary text-white px-8 py-2 rounded font-bold shadow-md hover:opacity-90 active:scale-95 transition-all">
              {editingId ? 'Update Participant' : 'Save Participant'}
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
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y text-sm">
            {participants.map(p => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="p-4">
                  <div className="font-bold">{p.fullName}</div>
                  <div className="text-xs text-gray-500">{[p.altName1, p.altName2].filter(Boolean).join(', ')}</div>
                </td>
                <td className="p-4 font-mono">{p.phone}</td>
                <td className="p-4">
                  <div className="text-xs font-bold text-primary">
                    {p.currentLeaderId}
                  </div>
                  <div className="text-[10px] text-gray-400">
                    {leaders.find(l => l.id === p.currentLeaderId)?.groupName || 'Unassigned'}
                  </div>
                </td>
                <td className="p-4 text-gray-500">
                  {new Date(p.createdAt).toLocaleDateString()}
                </td>
                <td className="p-4 text-right">
                  <div className="flex justify-end space-x-3">
                    <button 
                      onClick={() => startEdit(p)}
                      className="text-blue-500 hover:text-blue-700"
                      title="Edit Details"
                    >
                      <i className="fas fa-edit"></i>
                    </button>
                    <button 
                      onClick={() => handleDelete(p.id, p.fullName)}
                      className="text-red-500 hover:text-red-700"
                      title="Delete Permanent"
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {participants.length === 0 && (
              <tr><td colSpan={5} className="p-10 text-center text-gray-400">No participants registered yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ParticipantManager;
