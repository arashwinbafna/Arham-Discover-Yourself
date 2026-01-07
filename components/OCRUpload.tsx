
import React, { useState, useRef } from 'react';
import { storageService } from '../services/storageService';
import { performOCR } from '../services/geminiService';
import { COLORS, formatIST } from '../constants';
import { 
  User, Participant, Meeting, MeetingStatus, 
  Attendance, AttendanceStatus, Fine 
} from '../types';
import EmailNotification from './EmailNotification';

interface OCRUploadProps {
  admin: User;
}

const OCRUpload: React.FC<OCRUploadProps> = ({ admin }) => {
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
    storageService.log(admin.username, 'Meeting Confirmed', `Confirmed attendance for ${newMeeting.name}`);

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
        admin={admin} 
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
          <h1 className="text-2xl font-bold text-gray-800">New Attendance Entry</h1>
          <p className="text-gray-500">Upload meeting screenshots to auto-derive attendance</p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 bg-white p-6 rounded-xl shadow-sm border space-y-4">
          <h3 className="font-bold border-b pb-2">Meeting Details</h3>
          <div>
            <label className="block text-sm font-medium mb-1">Meeting Name</label>
            <input 
              type="text" 
              className="w-full p-2 border rounded" 
              placeholder="e.g. Sunday General Meeting"
              value={meetingDetails.name}
              onChange={e => setMeetingDetails({...meetingDetails, name: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Date & Time (IST)</label>
            <input 
              type="datetime-local" 
              className="w-full p-2 border rounded"
              onChange={e => setMeetingDetails({...meetingDetails, timestamp: new Date(e.target.value).getTime()})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Fine Amount</label>
            <div className="flex space-x-4">
              {[20, 50].map(amt => (
                <label key={amt} className="flex items-center space-x-2 cursor-pointer">
                  <input 
                    type="radio" 
                    name="fine" 
                    checked={meetingDetails.fineAmount === amt}
                    onChange={() => setMeetingDetails({...meetingDetails, fineAmount: amt as 20 | 50})}
                  />
                  <span>₹{amt}</span>
                </label>
              ))}
            </div>
          </div>
          
          <div className="pt-4">
            <label className="block text-sm font-medium mb-2">Screenshots</label>
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
            >
              <i className="fas fa-cloud-upload-alt text-3xl text-gray-400 mb-2"></i>
              <p className="text-sm text-gray-500">Click to upload JPG/PNG</p>
              <input 
                ref={fileInputRef} 
                type="file" 
                multiple 
                hidden 
                onChange={handleFileChange}
              />
            </div>
            {files.length > 0 && (
              <div className="mt-2 text-xs text-gray-500 italic">
                {files.length} files selected
              </div>
            )}
          </div>

          <button 
            disabled={loading || files.length === 0}
            onClick={processOCR}
            className="w-full py-3 rounded-lg text-white font-bold bg-secondary disabled:bg-gray-300"
            style={!loading ? { backgroundColor: COLORS.SECONDARY } : {}}
          >
            {loading ? (
              <span className="flex items-center justify-center space-x-2">
                <i className="fas fa-spinner fa-spin"></i>
                <span>Processing...</span>
              </span>
            ) : 'Run OCR Analysis'}
          </button>
          
          {processingStatus && (
            <p className="text-xs text-center text-blue-600 font-medium animate-pulse">
              {processingStatus}
            </p>
          )}
        </div>

        <div className="md:col-span-2 bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex justify-between items-center mb-4 border-b pb-2">
            <h3 className="font-bold">OCR Results {ocrResults && `(${ocrResults.matches.length} Participants)`}</h3>
            {ocrResults && (
              <button 
                onClick={confirmMeeting}
                className="bg-primary text-white px-4 py-2 rounded text-sm font-bold shadow hover:opacity-90 transition-opacity"
              >
                Confirm & Notify Leaders
              </button>
            )}
          </div>

          {!ocrResults && !loading && (
            <div className="h-64 flex flex-col items-center justify-center text-gray-400">
              <i className="fas fa-microchip text-5xl mb-4"></i>
              <p>Ready to analyze screenshots...</p>
            </div>
          )}

          {ocrResults && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left">
                    <th className="p-3">Participant</th>
                    <th className="p-3">Matched Names</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {ocrResults.matches.map((res, idx) => (
                    <tr key={res.participant.id}>
                      <td className="p-3 font-medium">{res.participant.fullName}</td>
                      <td className="p-3 text-xs text-gray-500">
                        {[res.participant.fullName, res.participant.altName1, res.participant.altName2].filter(Boolean).join(', ')}
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                          res.status === AttendanceStatus.PRESENT ? 'bg-green-100 text-green-700' :
                          res.status === AttendanceStatus.ABSENT ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {res.status}
                        </span>
                      </td>
                      <td className="p-3">
                        <button 
                          onClick={() => toggleStatus(idx)}
                          className="text-primary hover:text-deepRed"
                        >
                          <i className="fas fa-rotate"></i>
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
