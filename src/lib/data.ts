// Data management utilities for local storage and mock data

import { 
  User, 
  Class, 
  AttendanceRecord, 
  QRCodeSession
} from '@/types';

// Local storage keys
export const STORAGE_KEYS = {
  USERS: 'attendance_app_users',
  CLASSES: 'attendance_app_classes',
  ATTENDANCE: 'attendance_app_attendance',
  QR_SESSIONS: 'attendance_app_qr_sessions',
  SMS_LOGS: 'attendance_app_sms_logs',
  CLASS_SESSIONS: 'attendance_app_class_sessions',
  CURRENT_USER: 'attendance_app_current_user'
};

// Generic localStorage utilities
export const storage = {
  get<T>(key: string, defaultValue: T[] = []): T[] {
    if (typeof window === 'undefined') return defaultValue;
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error(`Error reading from localStorage key "${key}":`, error);
      return defaultValue;
    }
  },

  set<T>(key: string, data: T[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error(`Error writing to localStorage key "${key}":`, error);
    }
  },

  clear(key: string): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(key);
  }
};

// Mock data for development and testing
export const mockUsers: User[] = [
  {
    id: '1',
    email: 'admin@school.edu',
    password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password: password
    firstName: 'John',
    lastName: 'Administrator',
    role: 'admin',
    phone: '+1234567890',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: '2',
    email: 'student1@school.edu',
    password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password: password
    firstName: 'Alice',
    lastName: 'Johnson',
    role: 'student',
    phone: '+1234567891',
    parentPhone: '+1234567892',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: '3',
    email: 'student2@school.edu',
    password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password: password
    firstName: 'Bob',
    lastName: 'Smith',
    role: 'student',
    phone: '+1234567893',
    parentPhone: '+1234567894',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: '4',
    email: 'student3@school.edu',
    password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password: password
    firstName: 'Charlie',
    lastName: 'Brown',
    role: 'student',
    phone: '+1234567895',
    parentPhone: '+1234567896',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  }
];

export const mockClasses: Class[] = [
  {
    id: 'class1',
    name: 'Advanced Mathematics',
    subject: 'Mathematics',
    instructor: 'Dr. Sarah Wilson',
    schedule: [
      { day: 'Monday', startTime: '09:00', endTime: '10:30' },
      { day: 'Wednesday', startTime: '09:00', endTime: '10:30' },
      { day: 'Friday', startTime: '09:00', endTime: '10:30' }
    ],
    enrolledStudents: ['2', '3', '4'],
    room: 'Room 101',
    semester: 'Fall 2024',
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: 'class2',
    name: 'Computer Science Fundamentals',
    subject: 'Computer Science',
    instructor: 'Prof. Michael Davis',
    schedule: [
      { day: 'Tuesday', startTime: '14:00', endTime: '15:30' },
      { day: 'Thursday', startTime: '14:00', endTime: '15:30' }
    ],
    enrolledStudents: ['2', '3'],
    room: 'Lab 201',
    semester: 'Fall 2024',
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: 'class3',
    name: 'Physics Laboratory',
    subject: 'Physics',
    instructor: 'Dr. Emily Garcia',
    schedule: [
      { day: 'Monday', startTime: '15:00', endTime: '17:00' }
    ],
    enrolledStudents: ['3', '4'],
    room: 'Physics Lab',
    semester: 'Fall 2024',
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  }
];

export const mockAttendanceRecords: AttendanceRecord[] = [
  {
    id: 'att1',
    classId: 'class1',
    studentId: '2',
    date: new Date(),
    status: 'present',
    checkedInAt: new Date(),
  },
  {
    id: 'att2',
    classId: 'class1',
    studentId: '3',
    date: new Date(),
    status: 'late',
    checkedInAt: new Date(Date.now() + 15 * 60000), // 15 minutes late
  },
  {
    id: 'att3',
    classId: 'class2',
    studentId: '2',
    date: new Date(Date.now() - 24 * 60 * 60 * 1000), // yesterday
    status: 'present',
    checkedInAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
  }
];

// Data access functions
export const dataService = {
  // Users
  getUsers(): User[] {
    return storage.get<User>(STORAGE_KEYS.USERS, mockUsers);
  },

  createUser(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): User {
    const users = this.getUsers();
    const newUser: User = {
      ...user,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    users.push(newUser);
    storage.set(STORAGE_KEYS.USERS, users);
    return newUser;
  },

  getUserById(id: string): User | undefined {
    return this.getUsers().find(user => user.id === id);
  },

  getUserByEmail(email: string): User | undefined {
    return this.getUsers().find(user => user.email === email);
  },

  updateUser(id: string, updates: Partial<User>): User | null {
    const users = this.getUsers();
    const userIndex = users.findIndex(user => user.id === id);
    if (userIndex === -1) return null;
    
    users[userIndex] = { ...users[userIndex], ...updates, updatedAt: new Date() };
    storage.set(STORAGE_KEYS.USERS, users);
    return users[userIndex];
  },

  // Classes
  getClasses(): Class[] {
    return storage.get<Class>(STORAGE_KEYS.CLASSES, mockClasses);
  },

  createClass(classData: Omit<Class, 'id' | 'createdAt' | 'updatedAt'>): Class {
    const classes = this.getClasses();
    const newClass: Class = {
      ...classData,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    classes.push(newClass);
    storage.set(STORAGE_KEYS.CLASSES, classes);
    return newClass;
  },

  getClassById(id: string): Class | undefined {
    return this.getClasses().find(cls => cls.id === id);
  },

  getClassesByInstructor(instructorName: string): Class[] {
    return this.getClasses().filter(cls => cls.instructor === instructorName);
  },

  getClassesByStudent(studentId: string): Class[] {
    return this.getClasses().filter(cls => cls.enrolledStudents.includes(studentId));
  },

  // Attendance Records
  getAttendanceRecords(): AttendanceRecord[] {
    return storage.get<AttendanceRecord>(STORAGE_KEYS.ATTENDANCE, mockAttendanceRecords);
  },

  createAttendanceRecord(record: Omit<AttendanceRecord, 'id'>): AttendanceRecord {
    const records = this.getAttendanceRecords();
    const newRecord: AttendanceRecord = {
      ...record,
      id: Date.now().toString()
    };
    records.push(newRecord);
    storage.set(STORAGE_KEYS.ATTENDANCE, records);
    return newRecord;
  },

  getAttendanceByStudent(studentId: string): AttendanceRecord[] {
    return this.getAttendanceRecords().filter(record => record.studentId === studentId);
  },

  getAttendanceByClass(classId: string): AttendanceRecord[] {
    return this.getAttendanceRecords().filter(record => record.classId === classId);
  },

  getAttendanceByDate(date: Date): AttendanceRecord[] {
    const targetDate = date.toDateString();
    return this.getAttendanceRecords().filter(
      record => new Date(record.date).toDateString() === targetDate
    );
  },

  // QR Code Sessions
  getQRSessions(): QRCodeSession[] {
    return storage.get<QRCodeSession>(STORAGE_KEYS.QR_SESSIONS, []);
  },

  createQRSession(session: Omit<QRCodeSession, 'id'>): QRCodeSession {
    const sessions = this.getQRSessions();
    const newSession: QRCodeSession = {
      ...session,
      id: Date.now().toString()
    };
    sessions.push(newSession);
    storage.set(STORAGE_KEYS.QR_SESSIONS, sessions);
    return newSession;
  },

  getActiveQRSession(classId: string): QRCodeSession | undefined {
    const now = new Date();
    return this.getQRSessions().find(
      session => 
        session.classId === classId && 
        session.isActive && 
        session.expiresAt > now
    );
  },

  // Initialize data if not exists
  initializeData(): void {
    if (typeof window === 'undefined') return;
    
    // Initialize with mock data if no data exists
    if (storage.get<User>(STORAGE_KEYS.USERS).length === 0) {
      storage.set(STORAGE_KEYS.USERS, mockUsers);
    }
    if (storage.get<Class>(STORAGE_KEYS.CLASSES).length === 0) {
      storage.set(STORAGE_KEYS.CLASSES, mockClasses);
    }
    if (storage.get<AttendanceRecord>(STORAGE_KEYS.ATTENDANCE).length === 0) {
      storage.set(STORAGE_KEYS.ATTENDANCE, mockAttendanceRecords);
    }
  }
};