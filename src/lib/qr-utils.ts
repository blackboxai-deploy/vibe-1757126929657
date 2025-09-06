// QR Code generation and validation utilities

import QRCode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';
import { QRCodeSession } from '@/types';
import { dataService } from './data';

export interface QRCodeData {
  classId: string;
  sessionId: string;
  timestamp: number;
  expiresAt: number;
}

export interface QRGenerationResult {
  success: boolean;
  qrCodeDataURL?: string;
  sessionId?: string;
  expiresAt?: Date;
  error?: string;
}

export interface QRValidationResult {
  success: boolean;
  classId?: string;
  sessionId?: string;
  className?: string;
  error?: string;
}

export class QRService {
  /**
   * Generate QR code for a class session
   * @param classId - The ID of the class
   * @param durationMinutes - How long the QR code should be valid (default: 30 minutes)
   */
  static async generateClassQR(classId: string, durationMinutes: number = 30): Promise<QRGenerationResult> {
    try {
      const classData = dataService.getClassById(classId);
      if (!classData) {
        return {
          success: false,
          error: 'Class not found'
        };
      }

      const sessionId = uuidv4();
      const now = new Date();
      const expiresAt = new Date(now.getTime() + durationMinutes * 60000);

      // Create QR code data
      const qrData: QRCodeData = {
        classId,
        sessionId,
        timestamp: now.getTime(),
        expiresAt: expiresAt.getTime()
      };

      // Generate QR code as data URL
      const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(qrData), {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      // Store QR session in database
      const qrSession: Omit<QRCodeSession, 'id'> = {
        classId,
        generatedAt: now,
        expiresAt,
        isActive: true,
        attendanceMarked: []
      };

      dataService.createQRSession(qrSession);

      return {
        success: true,
        qrCodeDataURL,
        sessionId,
        expiresAt
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to generate QR code'
      };
    }
  }

  /**
   * Validate scanned QR code data
   * @param qrDataString - The raw string data from QR code scan
   */
  static validateQRCode(qrDataString: string): QRValidationResult {
    try {
      const qrData: QRCodeData = JSON.parse(qrDataString);
      
      // Validate required fields
      if (!qrData.classId || !qrData.sessionId || !qrData.timestamp || !qrData.expiresAt) {
        return {
          success: false,
          error: 'Invalid QR code format'
        };
      }

      // Check if QR code has expired
      const now = new Date().getTime();
      if (now > qrData.expiresAt) {
        return {
          success: false,
          error: 'QR code has expired'
        };
      }

      // Verify class exists
      const classData = dataService.getClassById(qrData.classId);
      if (!classData) {
        return {
          success: false,
          error: 'Class not found'
        };
      }

      // Verify QR session exists and is active
      const qrSession = dataService.getActiveQRSession(qrData.classId);
      if (!qrSession) {
        return {
          success: false,
          error: 'QR code session is not active'
        };
      }

      return {
        success: true,
        classId: qrData.classId,
        sessionId: qrData.sessionId,
        className: classData.name
      };
    } catch (error) {
      return {
        success: false,
        error: 'Invalid QR code data'
      };
    }
  }

  /**
   * Mark attendance using QR code
   * @param qrDataString - The raw string data from QR code scan
   * @param studentId - The ID of the student marking attendance
   */
  static async markAttendanceWithQR(qrDataString: string, studentId: string): Promise<{
    success: boolean;
    message: string;
    attendanceId?: string;
  }> {
    try {
      // Validate QR code
      const validation = this.validateQRCode(qrDataString);
      if (!validation.success) {
        return {
          success: false,
          message: validation.error || 'QR code validation failed'
        };
      }

      const { classId, sessionId } = validation;
      if (!classId || !sessionId) {
        return {
          success: false,
          message: 'Missing class or session information'
        };
      }

      // Check if student is enrolled in this class
      const classData = dataService.getClassById(classId);
      if (!classData?.enrolledStudents.includes(studentId)) {
        return {
          success: false,
          message: 'You are not enrolled in this class'
        };
      }

      // Check if student has already marked attendance for today
      const today = new Date();
      const todayAttendance = dataService.getAttendanceByDate(today)
        .find(record => record.classId === classId && record.studentId === studentId);
      
      if (todayAttendance) {
        return {
          success: false,
          message: 'Attendance already marked for this class today'
        };
      }

      // Get QR session and check if student already used this session
      const qrSession = dataService.getActiveQRSession(classId);
      if (qrSession?.attendanceMarked.includes(studentId)) {
        return {
          success: false,
          message: 'You have already marked attendance for this session'
        };
      }

      // Determine attendance status based on timing
      const classSchedule = classData.schedule.find(schedule => {
        const today = new Date();
        const dayOfWeek = today.toLocaleDateString('en-US', { weekday: 'long' });
        return schedule.day === dayOfWeek;
      });

      let status: 'present' | 'late' = 'present';
      if (classSchedule) {
        const [startHour, startMinute] = classSchedule.startTime.split(':').map(Number);
        const classStartTime = new Date();
        classStartTime.setHours(startHour, startMinute, 0, 0);
        
        const now = new Date();
        const lateThresholdMinutes = 15; // Consider late after 15 minutes
        const lateThreshold = new Date(classStartTime.getTime() + lateThresholdMinutes * 60000);
        
        if (now > lateThreshold) {
          status = 'late';
        }
      }

      // Create attendance record
      const attendanceRecord = dataService.createAttendanceRecord({
        classId,
        studentId,
        date: today,
        status,
        checkedInAt: new Date(),
        qrCodeUsed: sessionId
      });

      // Update QR session to mark this student as having attended
      if (qrSession) {
        qrSession.attendanceMarked.push(studentId);
        // Note: In a real app, you'd update this in the database
      }

      return {
        success: true,
        message: `Attendance marked as ${status}`,
        attendanceId: attendanceRecord.id
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to mark attendance'
      };
    }
  }

  /**
   * Get active QR code for a class (if any)
   * @param classId - The ID of the class
   */
  static getActiveQRCode(classId: string): QRCodeSession | null {
    return dataService.getActiveQRSession(classId) || null;
  }

  /**
   * Deactivate QR code session
   * @param classId - The ID of the class
   */
  static deactivateQRSession(classId: string): boolean {
    const session = dataService.getActiveQRSession(classId);
    if (session) {
      session.isActive = false;
      // Note: In a real app, you'd update this in the database
      return true;
    }
    return false;
  }

  /**
   * Generate QR code for student identification
   * @param studentId - The ID of the student
   */
  static async generateStudentQR(studentId: string): Promise<QRGenerationResult> {
    try {
      const studentData = dataService.getUserById(studentId);
      if (!studentData || studentData.role !== 'student') {
        return {
          success: false,
          error: 'Student not found'
        };
      }

      const qrData = {
        type: 'student',
        studentId,
        name: `${studentData.firstName} ${studentData.lastName}`,
        email: studentData.email,
        timestamp: new Date().getTime()
      };

      const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(qrData), {
        width: 200,
        margin: 1,
        color: {
          dark: '#1f2937',
          light: '#FFFFFF'
        }
      });

      return {
        success: true,
        qrCodeDataURL
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to generate student QR code'
      };
    }
  }
}

// Utility functions for QR code UI components
export const qrUtils = {
  /**
   * Format time remaining until QR code expires
   */
  formatTimeRemaining(expiresAt: Date): string {
    const now = new Date();
    const timeLeft = expiresAt.getTime() - now.getTime();
    
    if (timeLeft <= 0) {
      return 'Expired';
    }
    
    const minutes = Math.floor(timeLeft / 60000);
    const seconds = Math.floor((timeLeft % 60000) / 1000);
    
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  },

  /**
   * Check if QR code is about to expire (within 5 minutes)
   */
  isAboutToExpire(expiresAt: Date): boolean {
    const now = new Date();
    const timeLeft = expiresAt.getTime() - now.getTime();
    const fiveMinutes = 5 * 60 * 1000;
    
    return timeLeft > 0 && timeLeft <= fiveMinutes;
  },

  /**
   * Generate QR code filename for download
   */
  generateFileName(className: string, date: Date): string {
    const dateStr = date.toISOString().split('T')[0];
    const sanitizedClassName = className.replace(/[^a-zA-Z0-9]/g, '_');
    return `QR_${sanitizedClassName}_${dateStr}.png`;
  }
};

export default QRService;