
export const MASTER_PASSWORD = 'ADY2025';
export const OCR_CONFIDENCE_THRESHOLD_DEFAULT = 90;
export const DELETION_LOCK_DAYS = 60;
export const TIMEZONE = 'Asia/Kolkata';

export const COLORS = {
  PRIMARY: '#4777B5',
  SECONDARY: '#ECAF5D',
  DEEP_RED: '#471119',
  ACCENT_RED: '#8C2E30'
};

export const formatIST = (timestamp: number): string => {
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: TIMEZONE,
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(timestamp));
};
