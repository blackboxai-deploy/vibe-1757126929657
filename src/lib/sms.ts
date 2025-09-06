// SMS integration utilities for attendance notifications

import { SMSNotification } from '@/types';
import { dataService } from './data';

export interface SMSConfig {
  apiEndpoint: string;
  customerId: string;
  model: string;
}

export interface SMSTemplate {
  type: 'attendance_confirmation' | 'absence_alert' | 'class_reminder';
  template: string;
  variables: string[];
}

export interface SMSSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// Default SMS configuration using the custom endpoint
const defaultSMSConfig: SMSConfig = {
  apiEndpoint: 'https://oi-server.onrender.com/chat/completions',
  customerId: 'sagpangmacris@gmail.com',
  model: 'openrouter/claude-sonnet-4'
};

// SMS templates for different notification types
export const smsTemplates: Record<string, SMSTemplate> = {
  attendance_confirmation: {
    type: 'attendance_confirmation',
    template: 'Hello {parentName}, {studentName} has successfully checked into {className} at {time}. Status: {status}.',
    variables: ['parentName', 'studentName', 'className', 'time', 'status']
  },
  absence_alert: {
    type: 'absence_alert',
    template: 'Hello {parentName}, {studentName} was absent from {className} on {date}. Please contact the school if this was excused.',
    variables: ['parentName', 'studentName', 'className', 'date']
  },
  class_reminder: {
    type: 'class_reminder',
    template: 'Reminder: {studentName} has {className} starting at {startTime} in {room}.',
    variables: ['studentName', 'className', 'startTime', 'room']
  }
};

export class SMSService {
  private static config: SMSConfig = defaultSMSConfig;

  /**
   * Update SMS configuration
   */
  static updateConfig(config: Partial<SMSConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Send SMS using AI service to generate and format messages
   */
  static async sendSMS(
    phoneNumber: string, 
    message: string, 
    type: SMSNotification['type'] = 'attendance_confirmation'
  ): Promise<SMSSendResult> {
    try {
      // Format the message using AI to ensure proper SMS formatting
      const response = await fetch(this.config.apiEndpoint, {
        method: 'POST',
        headers: {
          'customerId': this.config.customerId,
          'Content-Type': 'application/json',
          'Authorization': 'Bearer xxx'
        },
        body: JSON.stringify({
          model: this.config.model,
          messages: [
            {
              role: 'system',
              content: 'You are an SMS formatting service. Format the given message to be concise, professional, and appropriate for SMS delivery. Keep it under 160 characters if possible. Return only the formatted message without quotes or additional text.'
            },
            {
              role: 'user',
              content: `Format this SMS message: ${message}`
            }
          ],
          max_tokens: 100
        })
      });

      if (!response.ok) {
        return {
          success: false,
          error: 'Failed to format SMS message'
        };
      }

      const result = await response.json();
      const formattedMessage = result.choices?.[0]?.message?.content?.trim() || message;

      // In a real application, you would integrate with an actual SMS service like Twilio
      // For demo purposes, we'll simulate SMS sending
      console.log(`📱 SMS would be sent to ${phoneNumber}: ${formattedMessage}`);
      
      // Store SMS log (in a real app, you would store this in the database)
      // For demo, we'll just log it
      console.log('📋 SMS Log:', {
        recipientPhone: phoneNumber,
        message: formattedMessage,
        type,
        status: 'sent',
        sentAt: new Date()
      });
      
      return {
        success: true,
        messageId: `sms_${Date.now()}`
      };
    } catch (error) {
      console.error('SMS sending failed:', error);
      return {
        success: false,
        error: 'Failed to send SMS'
      };
    }
  }

  /**
   * Send attendance confirmation SMS
   */
  static async sendAttendanceConfirmation(
    studentId: string,
    classId: string,
    status: 'present' | 'late' | 'absent'
  ): Promise<SMSSendResult> {
    try {
      const student = dataService.getUserById(studentId);
      const classData = dataService.getClassById(classId);

      if (!student || !classData) {
        return {
          success: false,
          error: 'Student or class not found'
        };
      }

      if (!student.parentPhone) {
        return {
          success: false,
          error: 'Parent phone number not available'
        };
      }

      const template = smsTemplates.attendance_confirmation;
      const message = template.template
        .replace('{parentName}', 'Parent')
        .replace('{studentName}', `${student.firstName} ${student.lastName}`)
        .replace('{className}', classData.name)
        .replace('{time}', new Date().toLocaleTimeString())
        .replace('{status}', status);

      return await this.sendSMS(student.parentPhone, message, 'attendance_confirmation');
    } catch (error) {
      return {
        success: false,
        error: 'Failed to send attendance confirmation'
      };
    }
  }

  /**
   * Send absence alert SMS
   */
  static async sendAbsenceAlert(studentId: string, classId: string): Promise<SMSSendResult> {
    try {
      const student = dataService.getUserById(studentId);
      const classData = dataService.getClassById(classId);

      if (!student || !classData) {
        return {
          success: false,
          error: 'Student or class not found'
        };
      }

      if (!student.parentPhone) {
        return {
          success: false,
          error: 'Parent phone number not available'
        };
      }

      const template = smsTemplates.absence_alert;
      const message = template.template
        .replace('{parentName}', 'Parent')
        .replace('{studentName}', `${student.firstName} ${student.lastName}`)
        .replace('{className}', classData.name)
        .replace('{date}', new Date().toLocaleDateString());

      return await this.sendSMS(student.parentPhone, message, 'absence_alert');
    } catch (error) {
      return {
        success: false,
        error: 'Failed to send absence alert'
      };
    }
  }

  /**
   * Send class reminder SMS
   */
  static async sendClassReminder(studentId: string, classId: string): Promise<SMSSendResult> {
    try {
      const student = dataService.getUserById(studentId);
      const classData = dataService.getClassById(classId);

      if (!student || !classData) {
        return {
          success: false,
          error: 'Student or class not found'
        };
      }

      if (!student.phone) {
        return {
          success: false,
          error: 'Student phone number not available'
        };
      }

      // Find today's schedule for this class
      const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
      const todaySchedule = classData.schedule.find(s => s.day === today);

      if (!todaySchedule) {
        return {
          success: false,
          error: 'No class scheduled for today'
        };
      }

      const template = smsTemplates.class_reminder;
      const message = template.template
        .replace('{studentName}', `${student.firstName} ${student.lastName}`)
        .replace('{className}', classData.name)
        .replace('{startTime}', todaySchedule.startTime)
        .replace('{room}', classData.room);

      return await this.sendSMS(student.phone, message, 'class_reminder');
    } catch (error) {
      return {
        success: false,
        error: 'Failed to send class reminder'
      };
    }
  }

  /**
   * Send bulk SMS notifications
   */
  static async sendBulkNotifications(
    notifications: Array<{
      studentId: string;
      classId: string;
      type: SMSNotification['type'];
      customMessage?: string;
    }>
  ): Promise<{
    sent: number;
    failed: number;
    results: Array<{ studentId: string; success: boolean; error?: string; }>;
  }> {
    const results = [];
    let sent = 0;
    let failed = 0;

    for (const notification of notifications) {
      try {
        let result: SMSSendResult;
        
        if (notification.customMessage) {
          const student = dataService.getUserById(notification.studentId);
          if (student?.parentPhone) {
            result = await this.sendSMS(
              student.parentPhone, 
              notification.customMessage, 
              notification.type
            );
          } else {
            result = { success: false, error: 'Phone number not available' };
          }
        } else {
          switch (notification.type) {
            case 'attendance_confirmation':
              result = await this.sendAttendanceConfirmation(
                notification.studentId, 
                notification.classId, 
                'present'
              );
              break;
            case 'absence_alert':
              result = await this.sendAbsenceAlert(
                notification.studentId, 
                notification.classId
              );
              break;
            case 'class_reminder':
              result = await this.sendClassReminder(
                notification.studentId, 
                notification.classId
              );
              break;
            default:
              result = { success: false, error: 'Unknown notification type' };
          }
        }

        results.push({
          studentId: notification.studentId,
          success: result.success,
          error: result.error
        });

        if (result.success) {
          sent++;
        } else {
          failed++;
        }

        // Add small delay between SMS sends to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        failed++;
        results.push({
          studentId: notification.studentId,
          success: false,
          error: 'Unexpected error sending SMS'
        });
      }
    }

    return { sent, failed, results };
  }

  /**
   * Test SMS configuration
   */
  static async testSMSConfig(testPhoneNumber: string): Promise<SMSSendResult> {
    const testMessage = 'This is a test message from the Attendance Monitoring System.';
    return await this.sendSMS(testPhoneNumber, testMessage, 'class_reminder');
  }
}

// Utility functions for SMS management
export const smsUtils = {
  /**
   * Validate phone number format
   */
  isValidPhoneNumber(phone: string): boolean {
    // Basic phone number validation (can be enhanced based on requirements)
    const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
    return phoneRegex.test(phone);
  },

  /**
   * Format phone number for display
   */
  formatPhoneNumber(phone: string): string {
    // Remove non-digit characters
    const digitsOnly = phone.replace(/\D/g, '');
    
    // Format as (XXX) XXX-XXXX for US numbers
    if (digitsOnly.length === 10) {
      return `(${digitsOnly.slice(0, 3)}) ${digitsOnly.slice(3, 6)}-${digitsOnly.slice(6)}`;
    } else if (digitsOnly.length === 11 && digitsOnly[0] === '1') {
      return `+1 (${digitsOnly.slice(1, 4)}) ${digitsOnly.slice(4, 7)}-${digitsOnly.slice(7)}`;
    }
    
    return phone; // Return original if doesn't match expected format
  },

  /**
   * Get SMS delivery status badge color
   */
  getStatusBadgeColor(status: SMSNotification['status']): string {
    switch (status) {
      case 'sent': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }
};

export default SMSService;