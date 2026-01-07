
export type Role = 'ADMIN' | 'LEADER';

export interface User {
  id: string;
  username: string;
  role: Role;
  leaderId?: string; // Linked if role is LEADER
}

export interface Leader {
  id: string;
  name: string;
  phone: string;
  email: string;
  groupName: string;
  createdAt: number;
}

export interface Participant {
  id: string;
  fullName: string;
  altName1?: string;
  altName2?: string;
  phone: string;
  currentLeaderId: string;
  createdAt: number;
}

export enum MeetingStatus {
  DRAFT = 'DRAFT',
  CONFIRMED = 'CONFIRMED',
  REVISED = 'REVISED'
}

export interface Meeting {
  id: string;
  name: string;
  timestamp: number; // IST
  fineAmount: 20 | 50;
  status: MeetingStatus;
  version: number;
  parentMeetingId?: string; // For revisions
  createdAt: number;
}

export enum AttendanceStatus {
  PRESENT = 'PRESENT',
  ABSENT = 'ABSENT',
  NEEDS_REVIEW = 'NEEDS_REVIEW'
}

export interface Attendance {
  id: string;
  participantId: string;
  meetingId: string;
  status: AttendanceStatus;
  confidenceScore: number;
  isManualOverride: boolean;
}

export interface Fine {
  id: string;
  participantId: string;
  meetingId: string;
  amount: number;
  isPaid: boolean;
}

export interface AuditLog {
  id: string;
  action: string;
  actor: string;
  timestamp: number;
  details: string;
}

export interface BackupMetadata {
  id: string;
  date: number;
  path: string;
  status: string;
}
