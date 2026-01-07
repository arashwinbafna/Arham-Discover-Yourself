
import React, { useState, useEffect } from 'react';
import { storageService } from '../services/storageService';
import { User, Leader, Participant, Meeting, Fine, Attendance } from '../types';
import { COLORS, formatIST } from '../constants';

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
    const lInfo = allLeaders.find(l => l.id === leaderUser.leaderId) || {
       id: leaderUser.leaderId!,
       name: leaderUser.username,
       phone: '',
       email: '',
       groupName: 'Assigned Group',
       createdAt: Date.now()
    };
    setLeaderInfo(lInfo);

    const allParticipants = storageService.getParticipants();
    const filtered = allParticipants.filter(p => p.currentLeaderId === lInfo.id);
    setMyParticipants(filtered);

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
        const ma = meetings.find(m => m.id === a.meetingId)?.timestamp || 0;
        const mb = meetings.find(m => m.id === b.meetingId)?.timestamp || 0;
        return mb - ma;
      });
  };

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center bg-white p-6 rounded-xl border shadow-sm">
        <div>
          <h1 className="text-2xl font-bold">Group Dashboard</h1>
          <p className="text-gray-500">{leaderInfo?.groupName} • {myParticipants.length} Members</p>
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-500 uppercase font-bold">Total Pending Fines</div>
          <div className="text-3xl font-bold text-accentRed">
            ₹{getRecentFines().filter(f => !f.isPaid).reduce((sum, f) => sum + f.amount, 0)}
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <div className="p-4 bg-gray-50 border-b font-bold flex justify-between">
            <span>Group Members</span>
            <i className="fas fa-users text-gray-400"></i>
          </div>
          <div className="divide-y max-h-96 overflow-y-auto">
            {myParticipants.map(p => (
              <div key={p.id} className="p-4 flex justify-between items-center">
                <div>
                  <div className="font-bold">{p.fullName}</div>
                  <div className="text-xs text-gray-500">{p.phone}</div>
                </div>
                <div className="text-xs text-gray-400 italic">Active</div>
              </div>
            ))}
            {myParticipants.length === 0 && <div className="p-8 text-center text-gray-400">No participants assigned.</div>}
          </div>
        </div>

        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <div className="p-4 bg-gray-50 border-b font-bold flex justify-between">
            <span>Recent Fine History</span>
            <i className="fas fa-receipt text-gray-400"></i>
          </div>
          <div className="divide-y max-h-96 overflow-y-auto">
            {getRecentFines().map(f => {
              const p = myParticipants.find(x => x.id === f.participantId);
              const m = meetings.find(x => x.id === f.meetingId);
              return (
                <div key={f.id} className="p-4 flex justify-between items-center hover:bg-gray-50 transition-colors">
                  <div>
                    <div className="font-bold">{p?.fullName}</div>
                    <div className="text-xs text-gray-500">{m?.name} ({formatIST(m?.timestamp || 0)})</div>
                  </div>
                  <div className="flex flex-col items-end">
                    <div className="font-bold text-deepRed mb-1">₹{f.amount}</div>
                    <button 
                      disabled={readOnly}
                      onClick={() => toggleFinePaid(f.id)}
                      className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase transition-all ${
                        f.isPaid 
                          ? 'bg-green-500 text-white hover:bg-green-600' 
                          : 'bg-red-100 text-red-700 hover:bg-red-200 border border-red-200'
                      } ${readOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {f.isPaid ? 'Paid' : 'Unpaid'}
                    </button>
                  </div>
                </div>
              );
            })}
            {getRecentFines().length === 0 && <div className="p-8 text-center text-gray-400">No fines recorded.</div>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeaderDashboard;
