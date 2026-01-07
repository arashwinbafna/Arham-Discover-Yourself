
import React, { useState, useEffect } from 'react';
import { storageService } from '../services/storageService';
import { User, Leader, Participant, Meeting, Fine, Attendance } from '../types';
import { COLORS, formatISTDateOnly } from '../constants';

interface LeaderDashboardProps {
  leaderUser: User;
  readOnly: boolean;
}

const LeaderDashboard: React.FC<LeaderDashboardProps> = ({ leaderUser, readOnly }) => {
  const [leaderInfo, setLeaderInfo] = useState<Leader | null>(null);
  const [myParticipants, setMyParticipants] = useState<Participant[]>([]);
  const [fines, setFines] = useState<Fine[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);

  useEffect(() => {
    const allLeaders = storageService.getLeaders();
    const lInfo = allLeaders.find(l => 
      l.id.toLowerCase() === leaderUser.username.toLowerCase() || 
      l.name.toLowerCase() === leaderUser.username.toLowerCase()
    );
    
    if (lInfo) {
      setLeaderInfo(lInfo);
      const allParticipants = storageService.getParticipants();
      const filtered = allParticipants.filter(p => p.currentLeaderId === lInfo.id);
      setMyParticipants(filtered);
    } else {
      setLeaderInfo({
         id: leaderUser.username,
         name: leaderUser.username,
         phone: '',
         email: '',
         groupName: 'Unassigned Group',
         createdAt: Date.now()
      });
    }

    setFines(storageService.getFines());
    setMeetings(storageService.getMeetings());
  }, [leaderUser]);

  const toggleFinePaid = (fineId: string) => {
    if (readOnly) return;
    const allFines = storageService.getFines();
    const fine = allFines.find(f => f.id === fineId);
    if (fine) {
      const updated = { ...fine, isPaid: !fine.isPaid };
      storageService.updateFine(updated);
      setFines(allFines.map(f => f.id === fineId ? updated : f));
      
      const p = myParticipants.find(x => x.id === fine.participantId);
      storageService.log(leaderUser.username, 'Fine Updated', `Marked fine for ${p?.fullName} as ${updated.isPaid ? 'PAID' : 'UNPAID'}`);
    }
  };

  const getRecentFines = () => {
    return fines
      .filter(f => myParticipants.some(p => p.id === f.participantId))
      .sort((a, b) => {
        // Priority 1: Unpaid (isPaid === false) comes first
        if (a.isPaid !== b.isPaid) {
          return a.isPaid ? 1 : -1;
        }
        // Priority 2: Newest meeting date first
        const ma = meetings.find(m => m.id === a.meetingId)?.timestamp || 0;
        const mb = meetings.find(m => m.id === b.meetingId)?.timestamp || 0;
        return mb - ma;
      });
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <header className="flex justify-between items-center bg-white p-6 rounded-xl border shadow-sm">
        <div>
          <h1 className="text-2xl font-bold">Group Dashboard</h1>
          <p className="text-gray-500">{leaderInfo?.groupName || 'No Group assigned'} • {myParticipants.length} Members</p>
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-500 uppercase font-bold">Total Pending Fines</div>
          <div className="text-3xl font-bold text-accentRed">
            ₹{getRecentFines().filter(f => !f.isPaid).reduce((sum, f) => sum + f.amount, 0)}
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Members List with Call/WA */}
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 bg-gray-50 border-b font-bold flex justify-between items-center">
            <span>Members & Direct Contact</span>
            <i className="fas fa-users text-gray-400"></i>
          </div>
          <div className="divide-y overflow-y-auto max-h-[500px]">
            {myParticipants.map(p => (
              <div key={p.id} className="p-4 flex justify-between items-center hover:bg-gray-50 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="font-bold truncate">{p.fullName}</div>
                  <div className="text-xs text-gray-500 mb-2">{p.phone}</div>
                  <div className="flex space-x-3">
                    <a 
                      href={`tel:${p.phone}`}
                      className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold flex items-center hover:bg-blue-100 transition-colors"
                    >
                      <i className="fas fa-phone-alt mr-2"></i> Call
                    </a>
                    <a 
                      href={`https://wa.me/${p.phone.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1 bg-green-50 text-green-600 rounded-lg text-xs font-bold flex items-center hover:bg-green-100 transition-colors"
                    >
                      <i className="fab fa-whatsapp mr-2"></i> WhatsApp
                    </a>
                  </div>
                </div>
                <div className="text-[10px] text-gray-400 italic bg-gray-100 px-2 py-1 rounded ml-4 uppercase tracking-tighter">Member</div>
              </div>
            ))}
            {myParticipants.length === 0 && (
              <div className="p-12 text-center text-gray-400">
                <i className="fas fa-user-slash text-4xl mb-3 opacity-20"></i>
                <p>No members assigned to your name.</p>
              </div>
            )}
          </div>
        </div>

        {/* Paid Status Tracker - Sorted */}
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 bg-gray-50 border-b font-bold flex justify-between items-center">
            <span>Member Payment Status</span>
            <div className="flex items-center text-[10px] text-gray-400 uppercase">
              <i className="fas fa-sort-amount-down mr-1"></i> Paid move to bottom
            </div>
          </div>
          <div className="divide-y overflow-y-auto max-h-[500px]">
            {getRecentFines().map(f => {
              const p = myParticipants.find(x => x.id === f.participantId);
              const m = meetings.find(x => x.id === f.meetingId);
              return (
                <div key={f.id} className={`p-4 flex justify-between items-center transition-all ${f.isPaid ? 'bg-gray-50 opacity-60' : 'bg-white'}`}>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold truncate text-sm">{p?.fullName}</div>
                    <div className="text-[10px] text-gray-400">{m?.name} ({m ? formatISTDateOnly(m.timestamp) : 'N/A'})</div>
                  </div>
                  <div className="flex flex-col items-end flex-shrink-0 ml-4">
                    <div className={`font-bold mb-1 ${f.isPaid ? 'text-gray-400' : 'text-accentRed'}`}>₹{f.amount}</div>
                    <button 
                      disabled={readOnly}
                      onClick={() => toggleFinePaid(f.id)}
                      className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase transition-all shadow-sm border ${
                        f.isPaid 
                          ? 'bg-green-500 text-white border-green-600' 
                          : 'bg-white text-red-600 border-red-200 hover:bg-red-50'
                      } ${readOnly ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'}`}
                    >
                      {f.isPaid ? <><i className="fas fa-check mr-1"></i> Paid</> : 'Mark Paid'}
                    </button>
                  </div>
                </div>
              );
            })}
            {getRecentFines().length === 0 && (
              <div className="p-12 text-center text-gray-400">
                <i className="fas fa-receipt text-4xl mb-3 opacity-20"></i>
                <p>All clean! No pending fines recorded.</p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="bg-blue-600 p-6 rounded-2xl shadow-lg text-white flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-2xl">
            <i className="fas fa-cloud-upload-alt"></i>
          </div>
          <div>
            <h4 className="font-bold text-lg">Community Cloud Sync</h4>
            <p className="text-blue-100 text-xs">All updates are securely saved and synced to the global ADY storage.</p>
          </div>
        </div>
        <div className="text-[10px] uppercase font-bold px-3 py-1 bg-white/10 rounded-full">
          Sync Status: Connected
        </div>
      </div>
    </div>
  );
};

export default LeaderDashboard;
