
import { 
  Participant, Leader, Meeting, Attendance, Fine, AuditLog, 
  MeetingStatus, AttendanceStatus, User 
} from '../types';

const STORAGE_KEYS = {
  USERS: 'ady_users',
  PARTICIPANTS: 'ady_participants',
  LEADERS: 'ady_leaders',
  MEETINGS: 'ady_meetings',
  ATTENDANCE: 'ady_attendance',
  FINES: 'ady_fines',
  AUDIT_LOGS: 'ady_audit_logs'
};

const get = <T,>(key: string): T[] => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
};

const set = <T,>(key: string, data: T[]): void => {
  localStorage.setItem(key, JSON.stringify(data));
};

export const storageService = {
  // Cloud Sync Utilities
  exportFullData: () => {
    const data: Record<string, any> = {};
    Object.entries(STORAGE_KEYS).forEach(([key, storageKey]) => {
      data[key] = get(storageKey);
    });
    return data;
  },

  importFullData: (data: Record<string, any>) => {
    Object.entries(STORAGE_KEYS).forEach(([key, storageKey]) => {
      if (data[key]) {
        set(storageKey, data[key]);
      }
    });
  },

  // General
  resetAll: () => {
    Object.values(STORAGE_KEYS).forEach(k => localStorage.removeItem(k));
  },

  // Users
  getUsers: () => get<User>(STORAGE_KEYS.USERS),
  saveUser: (user: User) => {
    const users = get<User>(STORAGE_KEYS.USERS);
    const exists = users.find(u => u.username.toLowerCase() === user.username.toLowerCase());
    if (!exists) {
      set(STORAGE_KEYS.USERS, [...users, user]);
    }
  },
  deleteUser: (id: string) => {
    const users = get<User>(STORAGE_KEYS.USERS);
    set(STORAGE_KEYS.USERS, users.filter(u => u.id !== id));
  },

  // Participants
  getParticipants: () => get<Participant>(STORAGE_KEYS.PARTICIPANTS),
  addParticipant: (p: Participant) => set(STORAGE_KEYS.PARTICIPANTS, [...get<Participant>(STORAGE_KEYS.PARTICIPANTS), p]),
  updateParticipant: (p: Participant) => {
    const list = get<Participant>(STORAGE_KEYS.PARTICIPANTS);
    set(STORAGE_KEYS.PARTICIPANTS, list.map(item => item.id === p.id ? p : item));
  },
  deleteParticipant: (id: string) => {
    const list = get<Participant>(STORAGE_KEYS.PARTICIPANTS);
    set(STORAGE_KEYS.PARTICIPANTS, list.filter(item => item.id !== id));
  },

  // Leaders
  getLeaders: () => get<Leader>(STORAGE_KEYS.LEADERS),
  addLeader: (l: Leader) => set(STORAGE_KEYS.LEADERS, [...get<Leader>(STORAGE_KEYS.LEADERS), l]),
  deleteLeader: (id: string) => {
    const list = get<Leader>(STORAGE_KEYS.LEADERS);
    set(STORAGE_KEYS.LEADERS, list.filter(item => item.id !== id));
  },

  // Meetings
  getMeetings: () => get<Meeting>(STORAGE_KEYS.MEETINGS),
  addMeeting: (m: Meeting) => set(STORAGE_KEYS.MEETINGS, [...get<Meeting>(STORAGE_KEYS.MEETINGS), m]),
  updateMeeting: (m: Meeting) => {
    const list = get<Meeting>(STORAGE_KEYS.MEETINGS);
    set(STORAGE_KEYS.MEETINGS, list.map(item => item.id === m.id ? m : item));
  },

  // Attendance
  getAttendance: (meetingId?: string) => {
    const all = get<Attendance>(STORAGE_KEYS.ATTENDANCE);
    return meetingId ? all.filter(a => a.meetingId === meetingId) : all;
  },
  saveAttendanceBatch: (batch: Attendance[]) => {
    const existing = get<Attendance>(STORAGE_KEYS.ATTENDANCE);
    const meetingIds = new Set(batch.map(b => b.meetingId));
    const filtered = existing.filter(e => !meetingIds.has(e.meetingId));
    set(STORAGE_KEYS.ATTENDANCE, [...filtered, ...batch]);
  },
  updateAttendance: (a: Attendance) => {
    const list = get<Attendance>(STORAGE_KEYS.ATTENDANCE);
    set(STORAGE_KEYS.ATTENDANCE, list.map(item => item.id === a.id ? a : item));
  },

  // Fines
  getFines: (meetingId?: string) => {
    const all = get<Fine>(STORAGE_KEYS.FINES);
    return meetingId ? all.filter(f => f.meetingId === meetingId) : all;
  },
  saveFinesBatch: (batch: Fine[]) => {
    const existing = get<Fine>(STORAGE_KEYS.FINES);
    const meetingIds = new Set(batch.map(b => b.meetingId));
    const filtered = existing.filter(e => !meetingIds.has(e.meetingId));
    set(STORAGE_KEYS.FINES, [...filtered, ...batch]);
  },
  updateFine: (f: Fine) => {
    const list = get<Fine>(STORAGE_KEYS.FINES);
    set(STORAGE_KEYS.FINES, list.map(item => item.id === f.id ? f : item));
  },

  // Audit
  getAuditLogs: () => get<AuditLog>(STORAGE_KEYS.AUDIT_LOGS).sort((a, b) => b.timestamp - a.timestamp),
  log: (actor: string, action: string, details: string) => {
    const logs = get<AuditLog>(STORAGE_KEYS.AUDIT_LOGS);
    logs.push({
      id: crypto.randomUUID(),
      actor,
      action,
      timestamp: Date.now(),
      details
    });
    set(STORAGE_KEYS.AUDIT_LOGS, logs);
  }
};
