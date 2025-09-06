'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import MainLayout, { PageLoading } from '@/components/layout/main-layout';
import { clientAuth } from '@/lib/auth';
import { QRService } from '@/lib/qr-utils';
import { dataService } from '@/lib/data';

const StudentQRCodePage: React.FC = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [studentQRCode, setStudentQRCode] = useState<string>('');
  const [studentInfo, setStudentInfo] = useState<{
    name: string;
    email: string;
    id: string;
  } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    // Check authentication and role
    clientAuth.init();
    if (!clientAuth.isLoggedIn()) {
      router.push('/auth/login');
      return;
    }
    
    if (clientAuth.getUserRole() !== 'student') {
      router.push('/admin');
      return;
    }

    loadStudentQRCode();
  }, [router]);

  const loadStudentQRCode = async () => {
    try {
      setIsLoading(true);
      
      // Get current user
      const currentUser = clientAuth.getCurrentUser();
      if (!currentUser) {
        router.push('/auth/login');
        return;
      }

      // Get full user data
      const userData = dataService.getUserById(currentUser.id);
      if (!userData) {
        setError('Student data not found');
        return;
      }

      setStudentInfo({
        name: `${userData.firstName} ${userData.lastName}`,
        email: userData.email,
        id: userData.id
      });

      // Generate student QR code
      await generateQRCode(userData.id);

    } catch (err) {
      setError('Failed to load student information');
      console.error('Student QR code error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const generateQRCode = async (studentId: string) => {
    try {
      setIsGenerating(true);
      setError('');
      
      const result = await QRService.generateStudentQR(studentId);
      
      if (result.success && result.qrCodeDataURL) {
        setStudentQRCode(result.qrCodeDataURL);
      } else {
        setError(result.error || 'Failed to generate QR code');
      }
    } catch (err) {
      setError('Failed to generate QR code');
      console.error('QR generation error:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRefreshQR = () => {
    if (studentInfo) {
      generateQRCode(studentInfo.id);
    }
  };

  const downloadQRCode = () => {
    if (!studentQRCode || !studentInfo) return;

    // Create download link
    const link = document.createElement('a');
    link.href = studentQRCode;
    link.download = `Student_QR_${studentInfo.name.replace(/\s+/g, '_')}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <MainLayout>
        <PageLoading message="Loading your QR code..." />
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-slate-900">My QR Code</h1>
          <p className="text-slate-600 mt-1">
            Your personal QR code for attendance verification
          </p>
        </div>

        {error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertDescription className="text-red-700">{error}</AlertDescription>
          </Alert>
        )}

        {/* Student Info Card */}
        {studentInfo && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <span>👤</span>
                <span>Student Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-600">Full Name</p>
                  <p className="font-medium text-slate-900">{studentInfo.name}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Email</p>
                  <p className="font-medium text-slate-900">{studentInfo.email}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Student ID</p>
                  <p className="font-mono text-sm text-slate-900">{studentInfo.id}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Status</p>
                  <Badge className="bg-green-100 text-green-800">Active</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* QR Code Display */}
        <Card className="text-center">
          <CardHeader>
            <CardTitle className="flex items-center justify-center space-x-2">
              <span>📱</span>
              <span>Personal QR Code</span>
            </CardTitle>
            <CardDescription>
              Show this code to your instructor for manual attendance marking
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {isGenerating ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center space-y-4">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="text-slate-600">Generating QR code...</p>
                </div>
              </div>
            ) : studentQRCode ? (
              <>
                {/* QR Code Image */}
                <div className="flex justify-center">
                  <div className="relative">
                    <img 
                      src={studentQRCode} 
                      alt="Student QR Code" 
                      className="border-2 border-slate-200 rounded-lg shadow-sm"
                      style={{ maxWidth: '300px', width: '100%' }}
                    />
                    <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-blue-100 text-blue-800 text-xs">
                        Personal ID
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-4 pt-4">
                  <Button onClick={handleRefreshQR} variant="outline" disabled={isGenerating}>
                    🔄 Refresh Code
                  </Button>
                  <Button onClick={downloadQRCode} disabled={isGenerating}>
                    📥 Download PNG
                  </Button>
                </div>
              </>
            ) : (
              <div className="py-12">
                <p className="text-slate-500 mb-4">Failed to load QR code</p>
                <Button onClick={handleRefreshQR} disabled={isGenerating}>
                  Try Again
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Usage Instructions */}
        <Card className="bg-slate-50">
          <CardHeader>
            <CardTitle className="text-lg">How to Use Your QR Code</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-blue-600 text-xs font-bold">1</span>
                </div>
                <div>
                  <p className="font-medium text-slate-900">For Manual Check-in</p>
                  <p className="text-slate-600">Show this QR code to your instructor when they are taking attendance manually.</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-green-600 text-xs font-bold">2</span>
                </div>
                <div>
                  <p className="font-medium text-slate-900">For Class Attendance</p>
                  <p className="text-slate-600">Use the "Mark Attendance" feature to scan class QR codes during sessions.</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-purple-600 text-xs font-bold">3</span>
                </div>
                <div>
                  <p className="font-medium text-slate-900">Download & Print</p>
                  <p className="text-slate-600">Download and print your QR code for offline use or backup purposes.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks related to attendance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 gap-4">
              <Button asChild variant="outline" className="h-auto p-4">
                <a href="/student/scanner" className="flex flex-col items-center space-y-2 text-center">
                  <span className="text-2xl">📱</span>
                  <div>
                    <div className="font-medium">Mark Attendance</div>
                    <div className="text-xs text-slate-500">Scan class QR codes</div>
                  </div>
                </a>
              </Button>

              <Button asChild variant="outline" className="h-auto p-4">
                <a href="/student/attendance" className="flex flex-col items-center space-y-2 text-center">
                  <span className="text-2xl">📊</span>
                  <div>
                    <div className="font-medium">View History</div>
                    <div className="text-xs text-slate-500">Check attendance records</div>
                  </div>
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default StudentQRCodePage;