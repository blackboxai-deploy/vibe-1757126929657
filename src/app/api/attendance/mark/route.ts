// Attendance Marking API route

import { NextRequest, NextResponse } from 'next/server';
import { QRService } from '@/lib/qr-utils';
import { SMSService } from '@/lib/sms';
import { AuthService } from '@/lib/auth';

interface MarkAttendanceRequest {
  qrData: string;
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    let user;
    try {
      user = AuthService.verifyToken(token);
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }

    const body: MarkAttendanceRequest = await request.json();
    
    // Validate input
    if (!body.qrData) {
      return NextResponse.json(
        { success: false, error: 'QR data is required' },
        { status: 400 }
      );
    }

    // Mark attendance using QR code
    const result = await QRService.markAttendanceWithQR(body.qrData, user.id);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.message },
        { status: 400 }
      );
    }

    // Send SMS notification (fire and forget)
    try {
      // Get QR data to extract class information
      const qrValidation = QRService.validateQRCode(body.qrData);
      if (qrValidation.success && qrValidation.classId) {
        // Determine status based on success
        const status = result.message?.includes('late') ? 'late' : 'present';
        
        // Send SMS notification asynchronously
        SMSService.sendAttendanceConfirmation(
          user.id, 
          qrValidation.classId, 
          status
        ).catch(error => {
          console.error('SMS notification failed:', error);
        });
      }
    } catch (smsError) {
      // Don't fail the attendance marking if SMS fails
      console.error('SMS notification error:', smsError);
    }

    return NextResponse.json({
      success: true,
      data: {
        attendanceId: result.attendanceId,
        message: result.message,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Mark attendance API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Handle GET requests (not allowed)
export async function GET() {
  return NextResponse.json(
    { success: false, error: 'Method not allowed' },
    { status: 405 }
  );
}