
import React, { useState, useEffect } from 'react';
import { storageService } from '../services/storageService';
import { User, Meeting, Leader, Participant, Attendance, Fine } from '../types';
import { COLORS, formatISTDateOnly } from '../constants';

interface EmailNotificationProps {
  admin: User;
  meetingId: string;
  onDone: () => void;
}

interface LeaderNotification {
  leader: Leader;
  totalFines: number;
  members: Array<{
    participant: Participant;
    attendance: Attendance;
    fine?: Fine;
  }>;
  emailStatus: 'PENDING' | 'SENT';
  whatsappStatus: 'PENDING' | 'SENT';
}

const NotificationCenter: React.FC<EmailNotificationProps> = ({ admin, meetingId, onDone }) => {
  const [notifications, setNotifications] = useState<LeaderNotification[]>([]);
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [loginModal, setLoginModal] = useState<'NONE' | 'GMAIL' | 'WHATSAPP'>('NONE');

  useEffect(() => {
    const m = storageService.getMeetings().find(x => x.id === meetingId);
    if (!m) return;
    setMeeting(m);

    const leaders = storageService.getLeaders();
    const participants = storageService.getParticipants();
    const attendance = storageService.getAttendance(meetingId);
    const fines = storageService.getFines(meetingId);

    const data: LeaderNotification[] = leaders.map(l => {
      const groupMembers = participants.filter(p => p.currentLeaderId === l.id);
      const membersData = groupMembers.map(p => ({
        participant: p,
        attendance: attendance.find(a => a.participantId === p.id)!,
        fine: fines.find(f => f.participantId === p.id)
      })).filter(md => md.attendance);

      return {
        leader: l,
        totalFines: membersData.filter(md => md.fine).length * m.fineAmount,
        members: membersData,
        emailStatus: 'PENDING' as const,
        whatsappStatus: 'PENDING' as const
      };
    }).filter(n => n.members.length > 0);

    setNotifications(data);
  }, [meetingId]);

  const generateReportText = (notif: LeaderNotification, isWhatsApp: boolean) => {
    const star = isWhatsApp ? '*' : '';
    const newline = '\n';
    
    // Explicitly use the meeting date only
    const meetingDate = meeting ? formatISTDateOnly(meeting.timestamp) : 'N/A';
    
    let text = `Respected ${notif.leader.name},${newline}${newline}`;
    text += `Meeting: ${star}${meeting?.name}${star}${newline}`;
    text += `Date: ${meetingDate}${newline}`;
    text += `Group: ${star}${notif.leader.groupName}${star}${newline}`;
    text += `Total Fines: ${star}₹${notif.totalFines}${star}${newline}${newline}`;
    
    text += `${star}Attendance Summary:${star}${newline}`;
    notif.members.forEach(m => {
      const fineText = m.fine ? ` (Fine: ₹${m.fine.amount})` : '';
      text += `- ${m.participant.fullName}: ${m.attendance.status}${fineText}${newline}`;
    });

    text += `${newline}Regards,${newline}ADY ADMIN`;
    return text;
  };

  const sendEmail = (idx: number) => {
    const notif = notifications[idx];
    const subject = encodeURIComponent(`Sadhana Report: ${meeting?.name}`);
    const body = encodeURIComponent(generateReportText(notif, false));
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(notif.leader.email)}&su=${subject}&body=${body}`;
    
    window.open(gmailUrl, '_blank');
    
    const newList = [...notifications];
    newList[idx].emailStatus = 'SENT';
    setNotifications(newList);
    storageService.log(admin.username, 'Email Prep', `Opened email compose for ${notif.leader.name}`);
  };

  const sendWhatsApp = (idx: number) => {
    const notif = notifications[idx];
    const phone = notif.leader.phone.replace(/\D/g, '');
    const text = encodeURIComponent(generateReportText(notif, true));
    const waUrl = `https://web.whatsapp.com/send?phone=${phone}&text=${text}`;
    
    window.open(waUrl, '_blank');
    
    const newList = [...notifications];
    newList[idx].whatsappStatus = 'SENT';
    storageService.log(admin.username, 'WhatsApp Prep', `Opened WhatsApp for ${notif.leader.name}`);
    setNotifications(newList);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {loginModal !== 'NONE' && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center animate-bounceIn">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${
              loginModal === 'GMAIL' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
            }`}>
              <i className={`fab ${loginModal === 'GMAIL' ? 'fa-google' : 'fa-whatsapp'} text-4xl`}></i>
            </div>
            <h2 className="text-2xl font-bold mb-4">
              Log in to {loginModal === 'GMAIL' ? 'Gmail' : 'WhatsApp Web'}
            </h2>
            <p className="text-gray-600 mb-8 leading-relaxed">
              To send reports, please ensure you are logged into 
              <strong>{loginModal === 'GMAIL' ? ' gmail.com' : ' web.whatsapp.com'}</strong> 
              in this browser.
            </p>
            <div className="space-y-3">
              <button 
                onClick={() => { 
                  window.open(loginModal === 'GMAIL' ? 'https://gmail.com' : 'https://web.whatsapp.com', '_blank'); 
                  setLoginModal('NONE'); 
                }}
                className={`w-full py-4 rounded-xl text-white font-bold text-lg transition-colors shadow-lg ${
                  loginModal === 'GMAIL' ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                Open {loginModal === 'GMAIL' ? 'Gmail.com' : 'WhatsApp Web'}
              </button>
              <button 
                onClick={() => setLoginModal('NONE')}
                className="w-full py-3 text-gray-400 font-medium hover:text-gray-600"
              >
                I am already logged in
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold">Notification Center</h1>
          <p className="text-gray-500">Meeting: {meeting?.name}</p>
        </div>
        <div className="flex space-x-2">
          <button 
            onClick={() => setLoginModal('GMAIL')}
            className="bg-red-50 text-red-600 px-4 py-2 rounded-lg font-bold text-sm border border-red-100 hover:bg-red-100"
          >
            Check Gmail Login
          </button>
          <button 
            onClick={() => setLoginModal('WHATSAPP')}
            className="bg-green-50 text-green-600 px-4 py-2 rounded-lg font-bold text-sm border border-green-100 hover:bg-green-100"
          >
            Check WhatsApp Login
          </button>
          <button 
            onClick={onDone}
            className="bg-primary text-white px-6 py-2 rounded-lg font-bold shadow-md hover:opacity-90 ml-4"
          >
            Finish & Return
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
        <div className="p-6 bg-gray-50 border-b flex justify-between items-center">
          <span className="font-bold">Pending Reports ({notifications.filter(n => n.emailStatus === 'PENDING' && n.whatsappStatus === 'PENDING').length})</span>
          <div className="text-xs text-gray-400 flex items-center">
            <i className="fas fa-info-circle mr-2"></i>
            Reports are sent as text messages using meeting date only.
          </div>
        </div>
        <table className="w-full text-left">
          <thead>
            <tr className="text-xs uppercase tracking-wider text-gray-500 border-b">
              <th className="p-4">Leader / Group</th>
              <th className="p-4">Fines</th>
              <th className="p-4">Contacts</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y text-sm">
            {notifications.map((n, idx) => (
              <tr key={n.leader.id} className={(n.emailStatus === 'SENT' || n.whatsappStatus === 'SENT') ? 'bg-gray-50/50' : ''}>
                <td className="p-4">
                  <div className="font-bold">{n.leader.name}</div>
                  <div className="text-xs text-gray-500">{n.leader.groupName}</div>
                </td>
                <td className="p-4">
                  <span className={`font-mono font-bold ${n.totalFines > 0 ? 'text-accentRed' : 'text-gray-400'}`}>
                    ₹{n.totalFines}
                  </span>
                </td>
                <td className="p-4">
                  <div className="text-xs text-gray-500 truncate max-w-[150px]">{n.leader.email}</div>
                  <div className="text-xs text-gray-400">{n.leader.phone}</div>
                </td>
                <td className="p-4 text-right">
                  <div className="flex justify-end space-x-2">
                    <button 
                      onClick={() => sendEmail(idx)}
                      title="Send via Gmail"
                      className={`inline-flex items-center px-3 py-2 rounded-lg font-bold text-xs transition-all ${
                        n.emailStatus === 'SENT' 
                        ? 'bg-gray-100 text-gray-400' 
                        : 'bg-red-50 text-red-600 hover:bg-red-100 active:scale-95'
                      }`}
                    >
                      <i className="fab fa-google mr-2"></i>
                      {n.emailStatus === 'SENT' ? 'Resend' : 'Email'}
                    </button>
                    <button 
                      onClick={() => sendWhatsApp(idx)}
                      title="Send via WhatsApp"
                      className={`inline-flex items-center px-3 py-2 rounded-lg font-bold text-xs transition-all ${
                        n.whatsappStatus === 'SENT' 
                        ? 'bg-gray-100 text-gray-400' 
                        : 'bg-green-50 text-green-600 hover:bg-green-100 active:scale-95'
                      }`}
                    >
                      <i className="fab fa-whatsapp mr-2"></i>
                      {n.whatsappStatus === 'SENT' ? 'Resend' : 'WhatsApp'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default NotificationCenter;
