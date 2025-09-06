// QR Code Generation API route

import { NextRequest, NextResponse } from 'next/server';
import { QRService } from '@/lib/qr-utils';
import { AuthService } from '@/lib/auth';
import { dataService } from '@/lib/data';

interface GenerateQRRequest {
  classId: string;
  durationMinutes?: number;
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

    // Check admin role
    if (user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body: GenerateQRRequest = await request.json();
    
    // Validate input
    if (!body.classId) {
      return NextResponse.json(
        { success: false, error: 'Class ID is required' },
        { status: 400 }
      );
    }

    // Verify class exists
    const classData = dataService.getClassById(body.classId);
    if (!classData) {
      return NextResponse.json(
        { success: false, error: 'Class not found' },
        { status: 404 }
      );
    }

    // Generate QR code
    const result = await QRService.generateClassQR(
      body.classId, 
      body.durationMinutes || 30
    );

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        qrCodeDataURL: result.qrCodeDataURL,
        sessionId: result.sessionId,
        expiresAt: result.expiresAt,
        classInfo: {
          name: classData.name,
          instructor: classData.instructor,
          room: classData.room
        }
      }
    });

  } catch (error) {
    console.error('QR Generation API error:', error);
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