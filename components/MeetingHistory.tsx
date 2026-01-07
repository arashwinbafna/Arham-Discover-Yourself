
import React, { useState, useEffect } from 'react';
import { storageService } from '../services/storageService';
import { Meeting, User, MeetingStatus, Participant, Attendance } from '../types';
import { formatIST, COLORS } from '../constants';

interface MeetingHistoryProps {
  user: User; // Changed from admin to user
}

const MeetingHistory: React.FC<MeetingHistoryProps> = ({ user }) => {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);

  useEffect(() => {
    setMeetings(storageService.getMeetings().sort((a, b) => b.timestamp - a.timestamp));
    setParticipants(storageService.getParticipants());
  }, []);

  const handleSelect = (m: Meeting) => {
    setSelectedMeeting(m);
    setAttendance(storageService.getAttendance(m.id));
  };

  const reopenMeeting = (m: Meeting) => {
    if (user.role !== 'ADMIN') {
      alert("Only Administrators can reopen meetings for revision.");
      return;
    }
    const confirm = window.confirm("Reopening this meeting will allow you to revise attendance. Do you want to continue?");
    if (confirm) {
      const revised: Meeting = {
        ...m,
        status: MeetingStatus.REVISED,
        version: m.version + 1,
        parentMeetingId: m.id
      };
      storageService.updateMeeting(revised);
      setMeetings(meetings.map(item => item.id === m.id ? revised : item));
      storageService.log(user.username, 'Meeting Reopened', `Reopened meeting ${m.name} for revision`);
    }
  };

  const exportExcel = () => {
    if (!selectedMeeting) return;
    
    let csv = "Participant Name,Status,Confidence,Override\n";
    attendance.forEach(a => {
      const p = participants.find(x => x.id === a.participantId);
      csv += `"${p?.fullName}","${a.status}","${a.confidenceScore}%","${a.isManualOverride}"\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `Attendance_${selectedMeeting.name}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <header>
        <h1 className="text-2xl font-black text-gray-800 tracking-tight">Meeting Records</h1>
        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Global Community History</p>
      </header>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-white rounded-2xl border shadow-sm overflow-hidden">
          <div className="p-4 bg-gray-50 border-b text-[10px] font-bold uppercase text-gray-400 tracking-widest">Meeting List</div>
          <div className="divide-y max-h-[600px] overflow-y-auto">
            {meetings.map(m => (
              <div 
                key={m.id} 
                onClick={() => handleSelect(m)}
                className={`p-4 cursor-pointer hover:bg-gray-50 transition-all ${selectedMeeting?.id === m.id ? 'bg-blue-50 border-l-4 border-primary' : ''}`}
              >
                <div className="font-bold truncate text-gray-800">{m.name}</div>
                <div className="text-[10px] text-gray-400 font-bold uppercase">{formatIST(m.timestamp)}</div>
                <div className="mt-3 flex items-center justify-between">
                   <span className={`text-[9px] px-2 py-0.5 rounded-full uppercase font-black tracking-widest ${
                     m.status === MeetingStatus.CONFIRMED ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                   }`}>
                     {m.status}
                   </span>
                   <span className="text-[10px] font-black text-primary bg-blue-50 px-2 py-0.5 rounded-full">₹{m.fineAmount} Fine</span>
                </div>
              </div>
            ))}
            {meetings.length === 0 && <div className="p-12 text-center text-gray-300 italic text-sm">No records found.</div>}
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-2xl border shadow-sm p-6">
          {selectedMeeting ? (
            <div className="space-y-6">
              <header className="flex justify-between items-start border-b pb-6">
                <div>
                  <h2 className="text-xl font-black text-gray-800 tracking-tight">{selectedMeeting.name}</h2>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{formatIST(selectedMeeting.timestamp)}</p>
                </div>
                <div className="flex space-x-2">
                  <button 
                    onClick={exportExcel}
                    className="bg-gray-50 text-gray-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-100 transition-all active:scale-95"
                  >
                    <i className="fas fa-file-export mr-2"></i> CSV Export
                  </button>
                  {user.role === 'ADMIN' && (
                    <button 
                      onClick={() => reopenMeeting(selectedMeeting)}
                      className="bg-red-50 text-red-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-100 transition-all active:scale-95 border border-red-100"
                    >
                      <i className="fas fa-edit mr-2"></i> Revise
                    </button>
                  )}
                </div>
              </header>

              <div className="grid grid-cols-3 gap-4">
                 <div className="bg-green-50/50 p-4 rounded-2xl border border-green-100 text-center">
                    <div className="text-[9px] text-green-600 font-black uppercase tracking-widest mb-1">Present</div>
                    <div className="text-3xl font-black text-green-700">{attendance.filter(a => a.status === 'PRESENT').length}</div>
                 </div>
                 <div className="bg-red-50/50 p-4 rounded-2xl border border-red-100 text-center">
                    <div className="text-[9px] text-red-600 font-black uppercase tracking-widest mb-1">Absent</div>
                    <div className="text-3xl font-black text-red-700">{attendance.filter(a => a.status === 'ABSENT').length}</div>
                 </div>
                 <div className="bg-yellow-50/50 p-4 rounded-2xl border border-yellow-100 text-center">
                    <div className="text-[9px] text-yellow-600 font-black uppercase tracking-widest mb-1">Review</div>
                    <div className="text-3xl font-black text-yellow-700">{attendance.filter(a => a.status === 'NEEDS_REVIEW').length}</div>
                 </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-left border-b">
                      <th className="p-4 text-[10px] uppercase font-bold text-gray-400">Participant</th>
                      <th className="p-4 text-[10px] uppercase font-bold text-gray-400">Presence</th>
                      <th className="p-4 text-[10px] uppercase font-bold text-gray-400">Leader</th>
                      <th className="p-4 text-right text-[10px] uppercase font-bold text-gray-400">Fine</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {attendance.map(a => {
                      const p = participants.find(x => x.id === a.participantId);
                      return (
                        <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                          <td className="p-4 font-bold text-gray-800">{p?.fullName}</td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                              a.status === 'PRESENT' ? 'bg-green-100 text-green-700' :
                              a.status === 'ABSENT' ? 'bg-red-100 text-red-700' :
                              'bg-yellow-100 text-yellow-700'
                            }`}>
                              {a.status}
                            </span>
                          </td>
                          <td className="p-4 text-[10px] font-bold text-gray-400">{p?.currentLeaderId}</td>
                          <td className="p-4 text-right font-black text-gray-800">
                            {a.status === 'ABSENT' ? `₹${selectedMeeting.fineAmount}` : '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="h-96 flex flex-col items-center justify-center text-gray-300 opacity-50">
              <i className="fas fa-chart-line text-6xl mb-4"></i>
              <p className="text-[10px] font-bold uppercase tracking-widest">Select a meeting to view records</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MeetingHistory;
