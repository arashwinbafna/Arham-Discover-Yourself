
import React, { useState, useRef } from 'react';
import { storageService } from '../services/storageService';
import { performOCR } from '../services/geminiService';
import { COLORS } from '../constants';
import { 
  User, Participant, Meeting, MeetingStatus, 
  Attendance, AttendanceStatus, Fine 
} from '../types';
import EmailNotification from './EmailNotification';

interface OCRUploadProps {
  user: User; // Renamed from admin to user for broader access
}

const OCRUpload: React.FC<OCRUploadProps> = ({ user }) => {
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');
  const [showEmailView, setShowEmailView] = useState(false);
  const [lastConfirmedMeetingId, setLastConfirmedMeetingId] = useState<string | null>(null);
  
  const [meetingDetails, setMeetingDetails] = useState({
    name: '',
    timestamp: Date.now(),
    fineAmount: 20 as 20 | 50
  });

  const [ocrResults, setOcrResults] = useState<{
    foundNames: string[];
    matches: Array<{
      participant: Participant;
      status: AttendanceStatus;
      confidence: number;
    }>;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const processOCR = async () => {
    if (files.length === 0 || !meetingDetails.name) {
      alert("Please upload screenshots and enter meeting name.");
      return;
    }

    setLoading(true);
    setProcessingStatus('Connecting to Gemini AI for OCR...');
    
    try {
      const foundNames = await performOCR(files);
      setProcessingStatus('Matching participants with names...');

      const participants = storageService.getParticipants();
      const results = participants.map(p => {
        const pNames = [p.fullName, p.altName1, p.altName2].filter(Boolean).map(n => n!.toLowerCase());
        
        let found = false;
        let score = 0;

        for (const foundName of foundNames) {
          const lowerFound = foundName.toLowerCase();
          if (pNames.some(pn => pn === lowerFound)) {
            found = true;
            score = 100;
            break;
          } else if (pNames.some(pn => pn.includes(lowerFound) || lowerFound.includes(pn))) {
            found = true;
            score = 85;
            break;
          }
        }

        return {
          participant: p,
          status: found ? (score >= 90 ? AttendanceStatus.PRESENT : AttendanceStatus.NEEDS_REVIEW) : AttendanceStatus.ABSENT,
          confidence: score
        };
      });

      setOcrResults({ foundNames, matches: results });
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
      setProcessingStatus('');
    }
  };

  const confirmMeeting = () => {
    if (!ocrResults) return;

    const meetingId = crypto.randomUUID();
    const newMeeting: Meeting = {
      id: meetingId,
      name: meetingDetails.name,
      timestamp: meetingDetails.timestamp,
      fineAmount: meetingDetails.fineAmount,
      status: MeetingStatus.CONFIRMED,
      version: 1,
      createdAt: Date.now()
    };

    const attendanceBatch: Attendance[] = ocrResults.matches.map(m => ({
      id: crypto.randomUUID(),
      meetingId,
      participantId: m.participant.id,
      status: m.status,
      confidenceScore: m.confidence,
      isManualOverride: false
    }));

    const fineBatch: Fine[] = ocrResults.matches
      .filter(m => m.status === AttendanceStatus.ABSENT)
      .map(m => ({
        id: crypto.randomUUID(),
        meetingId,
        participantId: m.participant.id,
        amount: meetingDetails.fineAmount,
        isPaid: false
      }));

    storageService.addMeeting(newMeeting);
    storageService.saveAttendanceBatch(attendanceBatch);
    storageService.saveFinesBatch(fineBatch);
    storageService.log(user.username, 'Meeting Tracked', `Generated attendance for ${newMeeting.name}`);

    setLastConfirmedMeetingId(meetingId);
    setShowEmailView(true);
  };

  const toggleStatus = (index: number) => {
    if (!ocrResults) return;
    const newMatches = [...ocrResults.matches];
    const current = newMatches[index].status;
    
    if (current === AttendanceStatus.PRESENT) newMatches[index].status = AttendanceStatus.ABSENT;
    else if (current === AttendanceStatus.ABSENT) newMatches[index].status = AttendanceStatus.PRESENT;
    else newMatches[index].status = AttendanceStatus.PRESENT;

    setOcrResults({ ...ocrResults, matches: newMatches });
  };

  if (showEmailView && lastConfirmedMeetingId) {
    return (
      <EmailNotification 
        admin={user} 
        meetingId={lastConfirmedMeetingId} 
        onDone={() => {
          setShowEmailView(false);
          setOcrResults(null);
          setFiles([]);
          setMeetingDetails({ name: '', timestamp: Date.now(), fineAmount: 20 });
        }}
      />
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-gray-800 tracking-tight">AI Attendance Scanner</h1>
          <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1">Role: {user.role} Portal</p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 bg-white p-6 rounded-2xl shadow-sm border space-y-4">
          <h3 className="font-bold border-b pb-2 text-sm uppercase tracking-wider text-gray-400">Meeting Setup</h3>
          <div>
            <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Meeting Title</label>
            <input 
              type="text" 
              className="w-full p-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-primary outline-none font-medium" 
              placeholder="e.g. Area Sadhana Meet"
              value={meetingDetails.name}
              onChange={e => setMeetingDetails({...meetingDetails, name: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Date & Time</label>
            <input 
              type="datetime-local" 
              className="w-full p-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-primary outline-none font-medium"
              onChange={e => setMeetingDetails({...meetingDetails, timestamp: new Date(e.target.value).getTime()})}
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Fine per Absentee</label>
            <div className="flex space-x-2">
              {[20, 50].map(amt => (
                <button 
                  key={amt}
                  onClick={() => setMeetingDetails({...meetingDetails, fineAmount: amt as 20 | 50})}
                  className={`flex-1 py-2 rounded-xl border-2 font-black transition-all ${
                    meetingDetails.fineAmount === amt 
                    ? 'border-primary bg-primary/5 text-primary' 
                    : 'border-gray-100 text-gray-300'
                  }`}
                >
                  ₹{amt}
                </button>
              ))}
            </div>
          </div>
          
          <div className="pt-4">
            <label className="block text-[10px] font-bold uppercase text-gray-400 mb-2">Meeting Proof (Screenshots)</label>
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-200 rounded-2xl p-6 text-center cursor-pointer hover:border-primary hover:bg-blue-50 transition-all group"
            >
              <i className="fas fa-camera text-2xl text-gray-300 group-hover:text-primary mb-2"></i>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Click to select images</p>
              <input 
                ref={fileInputRef} 
                type="file" 
                multiple 
                hidden 
                onChange={handleFileChange}
              />
            </div>
            {files.length > 0 && (
              <div className="mt-2 text-[10px] text-primary font-bold uppercase text-center">
                {files.length} images ready to scan
              </div>
            )}
          </div>

          <button 
            disabled={loading || files.length === 0}
            onClick={processOCR}
            className="w-full py-4 rounded-2xl text-white font-black uppercase tracking-widest text-sm transition-all active:scale-95 shadow-xl disabled:bg-gray-100 disabled:shadow-none"
            style={!loading && files.length > 0 ? { backgroundColor: user.role === 'ADMIN' ? COLORS.DEEP_RED : COLORS.PRIMARY } : {}}
          >
            {loading ? (
              <span className="flex items-center justify-center space-x-2">
                <i className="fas fa-circle-notch fa-spin"></i>
                <span>Analyzing...</span>
              </span>
            ) : 'Analyze Presence'}
          </button>
          
          {processingStatus && (
            <p className="text-[9px] text-center text-primary font-bold uppercase animate-pulse">
              {processingStatus}
            </p>
          )}
        </div>

        <div className="md:col-span-2 bg-white p-6 rounded-2xl shadow-sm border">
          <div className="flex justify-between items-center mb-6 border-b pb-4">
            <h3 className="font-bold text-sm uppercase tracking-wider text-gray-400">Presence Analysis</h3>
            {ocrResults && (
              <button 
                onClick={confirmMeeting}
                className="bg-green-600 text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-green-700 transition-all active:scale-95"
              >
                Confirm & Generate Reports
              </button>
            )}
          </div>

          {!ocrResults && !loading && (
            <div className="h-96 flex flex-col items-center justify-center text-gray-300 opacity-50">
              <i className="fas fa-microchip text-6xl mb-4"></i>
              <p className="text-[10px] font-bold uppercase tracking-widest">Awaiting system input...</p>
            </div>
          )}

          {ocrResults && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left">
                    <th className="p-4 text-[10px] uppercase font-bold text-gray-400">Member</th>
                    <th className="p-4 text-[10px] uppercase font-bold text-gray-400">Confidence</th>
                    <th className="p-4 text-[10px] uppercase font-bold text-gray-400">Presence</th>
                    <th className="p-4 text-right text-[10px] uppercase font-bold text-gray-400">Toggle</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {ocrResults.matches.map((res, idx) => (
                    <tr key={res.participant.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-gray-800">{res.participant.fullName}</div>
                        <div className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">
                          Leader: {res.participant.currentLeaderId}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="w-full max-w-[60px] bg-gray-100 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${res.confidence > 80 ? 'bg-green-500' : 'bg-yellow-500'}`} 
                            style={{ width: `${res.confidence}%` }}
                          ></div>
                        </div>
                        <span className="text-[9px] font-bold text-gray-400">{res.confidence}% match</span>
                      </td>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                          res.status === AttendanceStatus.PRESENT ? 'bg-green-100 text-green-700' :
                          res.status === AttendanceStatus.ABSENT ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {res.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button 
                          onClick={() => toggleStatus(idx)}
                          className="w-8 h-8 rounded-lg bg-gray-50 text-gray-400 hover:text-primary hover:bg-blue-50 transition-all"
                        >
                          <i className="fas fa-exchange-alt text-xs"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OCRUpload;
