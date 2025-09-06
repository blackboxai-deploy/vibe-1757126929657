// Core type definitions for the Attendance Monitoring Application

export interface User {
  id: string;
  email: string;
  password: string; // hashed
  firstName: string;
  lastName: string;
  role: 'admin' | 'student';
  phone?: string;
  parentPhone?: string; // for SMS notifications
  createdAt: Date;
  updatedAt: Date;
}

export interface Class {
  id: string;
  name: string;
  subject: string;
  instructor: string;
  schedule: {
    day: string;
    startTime: string;
    endTime: string;
  }[];
  enrolledStudents: string[]; // User IDs
  qrCode?: string;
  qrCodeExpiry?: Date;
  room: string;
  semester: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AttendanceRecord {
  id: string;
  classId: string;
  studentId: string;
  date: Date;
  status: 'present' | 'absent' | 'late';
  checkedInAt?: Date;
  qrCodeUsed?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  notes?: string;
}

export interface QRCodeSession {
  id: string;
  classId: string;
  generatedAt: Date;
  expiresAt: Date;
  isActive: boolean;
  attendanceMarked: string[]; // Student IDs who have already marked attendance
}

export interface SMSNotification {
  id: string;
  recipientPhone: string;
  message: string;
  type: 'attendance_confirmation' | 'absence_alert' | 'class_reminder';
  status: 'pending' | 'sent' | 'failed';
  sentAt?: Date;
  studentId?: string;
  classId?: string;
  error?: string;
}

export interface AttendanceStats {
  totalClasses: number;
  attendedClasses: number;
  missedClasses: number;
  lateClasses: number;
  attendancePercentage: number;
}

export interface ClassSession {
  id: string;
  classId: string;
  date: Date;
  startTime: string;
  endTime: string;
  status: 'scheduled' | 'active' | 'completed' | 'cancelled';
  qrCodeSession?: QRCodeSession;
  attendanceRecords: AttendanceRecord[];
}

// Authentication types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  user?: Omit<User, 'password'>;
  token?: string;
  error?: string;
}

// API Response types
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Dashboard data types
export interface AdminDashboardData {
  totalStudents: number;
  totalClasses: number;
  todayAttendance: {
    present: number;
    absent: number;
    total: number;
  };
  recentActivities: {
    type: string;
    message: string;
    timestamp: Date;
  }[];
}

export interface StudentDashboardData {
  upcomingClasses: Class[];
  todayAttendance: AttendanceRecord[];
  weeklyStats: AttendanceStats;
  notifications: {
    id: string;
    message: string;
    type: 'info' | 'warning' | 'success';
    timestamp: Date;
    read: boolean;
  }[];
}

// Form validation types
export interface CreateClassForm {
  name: string;
  subject: string;
  instructor: string;
  room: string;
  semester: string;
  schedule: {
    day: string;
    startTime: string;
    endTime: string;
  }[];
  enrolledStudents: string[];
}

export interface CreateUserForm {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: 'admin' | 'student';
  phone?: string;
  parentPhone?: string;
}

// QR Code Scanner types
export interface QRScanResult {
  success: boolean;
  data?: {
    classId: string;
    sessionId: string;
    timestamp: Date;
  };
  error?: string;
}

// Export utility type for database operations
export type CreateType<T> = Omit<T, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateType<T> = Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>;