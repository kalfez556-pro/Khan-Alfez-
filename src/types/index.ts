export type Role = 'faculty' | 'student';
export type Division = 'A' | 'B';

export interface UserProfile {
  id: string;
  name: string;
  role: Role;
  division?: Division;
  department: string;
  avatar: string;
  title: string;
  email: string;
  rollNumber?: string;
  parentPhone?: string;
  attendancePercent: number;
  gems: number;
  streakDays: number;
  hasStreakFreeze: boolean;
  activeBadges: string[];
}

export interface QRSession {
  sessionId: string;
  courseCode: string;
  courseName: string;
  division: Division;
  facultyId: string;
  facultyName: string;
  secretToken: string;
  expiresAt: number; // timestamp
  refreshIntervalSeconds: number;
  createdAt: number;
  isActive: boolean;
  totalPresent: number;
}

export interface AttendanceRecord {
  id: string;
  sessionId: string;
  studentId: string;
  studentName: string;
  studentDivision: Division;
  targetDivision: Division;
  courseCode: string;
  timestamp: string;
  status: 'valid' | 'proxy_rejected' | 'expired_rejected';
  rejectionReason?: string;
  ipHash: string;
  deviceFingerprint: string;
}

export interface Assignment {
  id: string;
  title: string;
  courseCode: string;
  courseName: string;
  division: Division | 'ALL';
  facultyId: string;
  facultyName: string;
  deadline: string;
  totalMarks: number;
  instructions: string;
  deliverables: string[];
  submissionCount: number;
  totalStudents: number;
}

export interface Submission {
  id: string;
  assignmentId: string;
  studentId: string;
  studentName: string;
  studentDivision: Division;
  fileName: string;
  fileSize: string;
  submittedAt: string;
  benchmarkStats: {
    executionTimeMs: number;
    memoryKb: number;
    testCasesPassed: number;
    totalTestCases: number;
  };
  codeSnippet?: string;
  status: 'pending' | 'graded';
  obtainedMarks?: number;
  facultyFeedback?: string;
  gradedBy?: string;
  gradedAt?: string;
}

export interface StudyNote {
  id: string;
  title: string;
  subject: string;
  chapter: string;
  division: Division | 'ALL';
  author: string;
  authorRole: string;
  dateAdded: string;
  pages: number;
  fileSize: string;
  pdfUrl?: string;
  summary: string;
  keyTopics: string[];
  samplePagesContent: {
    pageNumber: number;
    title: string;
    content: string;
    diagramLabel?: string;
    equations?: string[];
  }[];
}

export interface QuizQuestion {
  id: string;
  subject: 'DSA' | 'OS' | 'DBMS' | 'Networks';
  difficulty: 'Easy' | 'Medium' | 'Hard';
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  points: number;
}

export interface QuizAttempt {
  id: string;
  quizType: 'daily' | 'mega_test';
  date: string;
  score: number;
  totalQuestions: number;
  gemsEarned: number;
  tierEarned: 'Bronze' | 'Silver' | 'Gold' | 'Diamond' | 'Grandmaster';
}

export interface StorePerk {
  id: string;
  title: string;
  description: string;
  gemCost: number;
  iconName: string;
  category: 'study' | 'attendance' | 'cosmetic';
  available: boolean;
  perkEffect: string;
}

export interface UserInventoryItem {
  id: string;
  perkId: string;
  title: string;
  purchasedAt: string;
  isUsed: boolean;
  iconName: string;
}

export interface ClassroomGroup {
  id: string;
  courseCode: string;
  courseName: string;
  division: Division;
  facultyId: string;
  facultyName: string;
  facultyAvatar: string;
  groupPassword: string; // The secret group join password set by faculty
  inviteCode: string; // e.g. "CMP-9042"
  inviteLink: string;
  enrolledStudentIds: string[];
  createdAt: string;
  description: string;
}

export type NotificationType = 'assignment' | 'note' | 'notice' | 'attendance' | 'deadline_reminder';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  facultyId: string;
  facultyName: string;
  facultyAvatar: string;
  targetDivision: Division | 'ALL';
  courseCode?: string;
  createdAt: string;
  timestamp: number;
  readByStudentIds: string[];
  linkTab?: string;
  itemId?: string;
  isUrgent?: boolean;
  hoursRemaining?: number;
}

export interface ClassNotice {
  id: string;
  facultyId: string;
  facultyName: string;
  facultyAvatar: string;
  title: string;
  content: string;
  division: Division | 'ALL';
  courseCode: string;
  createdAt: string;
  isUrgent?: boolean;
}

