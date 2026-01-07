
import React, { useState, useEffect } from 'react';
import { storageService } from '../services/storageService';
import { Meeting, User, MeetingStatus, Participant, Attendance } from '../types';
import { formatIST, COLORS } from '../constants';

interface MeetingHistoryProps {
  admin: User;
}

const MeetingHistory: React.FC<MeetingHistoryProps> = ({ admin }) => {
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
      storageService.log(admin.username, 'Meeting Reopened', `Reopened meeting ${m.name} for revision`);
    }
  };

  const exportExcel = () => {
    if (!selectedMeeting) return;
    
    // Simple CSV export logic
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
    a.setAttribute('download', `Attendance_${selectedMeeting.name}_${selectedMeeting.id}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Meeting History</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-white rounded-xl border shadow-sm overflow-hidden">
          <div className="p-4 bg-gray-50 border-b font-bold">Recent Meetings</div>
          <div className="divide-y max-h-[600px] overflow-y-auto">
            {meetings.map(m => (
              <div 
                key={m.id} 
                onClick={() => handleSelect(m)}
                className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${selectedMeeting?.id === m.id ? 'bg-blue-50 border-l-4 border-primary' : ''}`}
              >
                <div className="font-bold truncate">{m.name}</div>
                <div className="text-xs text-gray-500">{formatIST(m.timestamp)}</div>
                <div className="mt-2 flex items-center justify-between">
                   <span className={`text-[10px] px-2 py-0.5 rounded uppercase font-bold ${
                     m.status === MeetingStatus.CONFIRMED ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                   }`}>
                     {m.status} (v{m.version})
                   </span>
                   <span className="text-[10px] text-gray-400">₹{m.fineAmount} Fine</span>
                </div>
              </div>
            ))}
            {meetings.length === 0 && <div className="p-8 text-center text-gray-400">No meetings recorded.</div>}
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-xl border shadow-sm p-6">
          {selectedMeeting ? (
            <div className="space-y-6">
              <header className="flex justify-between items-start border-b pb-4">
                <div>
                  <h2 className="text-xl font-bold">{selectedMeeting.name}</h2>
                  <p className="text-sm text-gray-500">{formatIST(selectedMeeting.timestamp)}</p>
                </div>
                <div className="flex space-x-2">
                  <button 
                    onClick={exportExcel}
                    className="bg-gray-100 text-gray-700 px-3 py-2 rounded text-sm font-bold hover:bg-gray-200"
                  >
                    <i className="fas fa-file-excel mr-2"></i> Export
                  </button>
                  <button 
                    onClick={() => reopenMeeting(selectedMeeting)}
                    className="bg-deepRed text-white px-3 py-2 rounded text-sm font-bold hover:opacity-90"
                  >
                    <i className="fas fa-edit mr-2"></i> Revise
                  </button>
                </div>
              </header>

              <div className="grid grid-cols-3 gap-4">
                 <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                    <div className="text-xs text-green-600 uppercase font-bold">Present</div>
                    <div className="text-2xl font-bold">{attendance.filter(a => a.status === 'PRESENT').length}</div>
                 </div>
                 <div className="bg-red-50 p-4 rounded-lg border border-red-100">
                    <div className="text-xs text-red-600 uppercase font-bold">Absent</div>
                    <div className="text-2xl font-bold">{attendance.filter(a => a.status === 'ABSENT').length}</div>
                 </div>
                 <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100">
                    <div className="text-xs text-yellow-600 uppercase font-bold">Need Review</div>
                    <div className="text-2xl font-bold">{attendance.filter(a => a.status === 'NEEDS_REVIEW').length}</div>
                 </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-left border-b">
                      <th className="p-3">Participant</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Score</th>
                      <th className="p-3">Fine</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {attendance.map(a => {
                      const p = participants.find(x => x.id === a.participantId);
                      return (
                        <tr key={a.id}>
                          <td className="p-3 font-medium">{p?.fullName}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              a.status === 'PRESENT' ? 'bg-green-100 text-green-700' :
                              a.status === 'ABSENT' ? 'bg-red-100 text-red-700' :
                              'bg-yellow-100 text-yellow-700'
                            }`}>
                              {a.status}
                            </span>
                          </td>
                          <td className="p-3 text-gray-500">{a.confidenceScore}%</td>
                          <td className="p-3">
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
            <div className="h-96 flex flex-col items-center justify-center text-gray-400">
              <i className="fas fa-hand-pointer text-5xl mb-4"></i>
              <p>Select a meeting to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MeetingHistory;
