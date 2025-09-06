'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import MainLayout, { PageLoading } from '@/components/layout/main-layout';
import QRScanner from '@/components/qr/qr-scanner';
import { clientAuth } from '@/lib/auth';
import { dataService } from '@/lib/data';
import { QRService } from '@/lib/qr-utils';
import { Class } from '@/types';

interface ScanResult {
  success: boolean;
  studentName?: string;
  className?: string;
  status?: string;
  message?: string;
  error?: string;
  timestamp?: Date;
}

const AdminScannerPage: React.FC = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanResults, setScanResults] = useState<ScanResult[]>([]);
  const [currentScan, setCurrentScan] = useState<ScanResult | null>(null);

  useEffect(() => {
    // Check authentication and role
    clientAuth.init();
    if (!clientAuth.isLoggedIn()) {
      router.push('/auth/login');
      return;
    }
    
    if (clientAuth.getUserRole() !== 'admin') {
      router.push('/student');
      return;
    }

    loadClasses();
  }, [router]);

  const loadClasses = async () => {
    try {
      setIsLoading(true);
      const allClasses = dataService.getClasses();
      const activeClasses = allClasses.filter(cls => cls.isActive);
      setClasses(activeClasses);
      
      if (activeClasses.length > 0) {
        setSelectedClass(activeClasses[0].id);
      }
    } catch (error) {
      console.error('Failed to load classes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleScanSuccess = async (qrData: string) => {
    if (!selectedClass) {
      setCurrentScan({
        success: false,
        error: 'Please select a class first',
        timestamp: new Date()
      });
      return;
    }

    setIsScanning(true);
    
    try {
      // Validate QR code
      const validation = QRService.validateQRCode(qrData);
      
      if (!validation.success) {
        setCurrentScan({
          success: false,
          error: validation.error || 'Invalid QR code',
          timestamp: new Date()
        });
        setScanResults(prev => [{
          success: false,
          error: validation.error || 'Invalid QR code',
          timestamp: new Date()
        }, ...prev.slice(0, 9)]);
        return;
      }

      // For demo purposes, simulate finding a student
      // In a real app, you would extract student ID from the QR code or manual entry
      const users = dataService.getUsers();
      const students = users.filter(user => user.role === 'student');
      const randomStudent = students[Math.floor(Math.random() * students.length)];

      if (!randomStudent) {
        setCurrentScan({
          success: false,
          error: 'No students found',
          timestamp: new Date()
        });
        return;
      }

      // Mark attendance
      const result = await QRService.markAttendanceWithQR(qrData, randomStudent.id);
      
      const scanResult: ScanResult = {
        success: result.success,
        studentName: `${randomStudent.firstName} ${randomStudent.lastName}`,
        className: validation.className,
        status: result.success ? 'present' : 'error',
        message: result.message,
        error: result.success ? undefined : result.message,
        timestamp: new Date()
      };

      setCurrentScan(scanResult);
      setScanResults(prev => [scanResult, ...prev.slice(0, 9)]);

    } catch (error) {
      const errorResult: ScanResult = {
        success: false,
        error: 'Failed to process QR code',
        timestamp: new Date()
      };
      
      setCurrentScan(errorResult);
      setScanResults(prev => [errorResult, ...prev.slice(0, 9)]);
    } finally {
      setIsScanning(false);
    }
  };

  const handleScanError = (error: string) => {
    const errorResult: ScanResult = {
      success: false,
      error,
      timestamp: new Date()
    };
    
    setCurrentScan(errorResult);
    setScanResults(prev => [errorResult, ...prev.slice(0, 9)]);
  };

  const getStatusBadgeProps = (result: ScanResult) => {
    if (!result.success) {
      return { className: 'bg-red-100 text-red-800', text: 'Error' };
    }
    
    switch (result.status) {
      case 'present':
        return { className: 'bg-green-100 text-green-800', text: 'Present' };
      case 'late':
        return { className: 'bg-yellow-100 text-yellow-800', text: 'Late' };
      default:
        return { className: 'bg-gray-100 text-gray-800', text: 'Unknown' };
    }
  };

  const clearResults = () => {
    setScanResults([]);
    setCurrentScan(null);
  };

  if (isLoading) {
    return (
      <MainLayout>
        <PageLoading message="Loading scanner..." />
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900">QR Code Scanner</h1>
          <p className="text-slate-600 mt-1">
            Scan student QR codes to mark attendance for classes
          </p>
        </div>

        {/* Class Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Select Class</CardTitle>
            <CardDescription>Choose the class session for attendance marking</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a class..." />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.name} - {cls.subject} ({cls.instructor})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {selectedClass && (
                <Badge variant="outline" className="whitespace-nowrap">
                  {classes.find(c => c.id === selectedClass)?.enrolledStudents.length || 0} students
                </Badge>
              )}
            </div>
            
            {!selectedClass && classes.length === 0 && (
              <Alert className="mt-4 border-yellow-200 bg-yellow-50">
                <AlertDescription className="text-yellow-800">
                  No active classes found. Please create a class first.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Scanner */}
          <div>
            <QRScanner
              onScanSuccess={handleScanSuccess}
              onScanError={handleScanError}
              isScanning={isScanning}
              className="h-fit"
            />
          </div>

          {/* Results */}
          <div className="space-y-6">
            {/* Current Scan Result */}
            {currentScan && (
              <Card className={`border-l-4 ${
                currentScan.success ? 'border-l-green-500' : 'border-l-red-500'
              }`}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Latest Scan</span>
                    <Badge className={getStatusBadgeProps(currentScan).className}>
                      {getStatusBadgeProps(currentScan).text}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {currentScan.success ? (
                    <div className="space-y-2">
                      <p className="font-medium text-slate-900">
                        {currentScan.studentName}
                      </p>
                      <p className="text-sm text-slate-600">
                        {currentScan.className}
                      </p>
                      <p className="text-sm text-green-600">
                        ✓ {currentScan.message}
                      </p>
                      <p className="text-xs text-slate-500">
                        {currentScan.timestamp?.toLocaleTimeString()}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-sm text-red-600">
                        ✗ {currentScan.error}
                      </p>
                      <p className="text-xs text-slate-500">
                        {currentScan.timestamp?.toLocaleTimeString()}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Scan History */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Scan History</CardTitle>
                  <CardDescription>Recent attendance scans</CardDescription>
                </div>
                {scanResults.length > 0 && (
                  <Button onClick={clearResults} variant="outline" size="sm">
                    Clear
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {scanResults.length > 0 ? (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {scanResults.map((result, index) => (
                      <div 
                        key={index} 
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50"
                      >
                        <div className="flex-1 min-w-0">
                          {result.success ? (
                            <>
                              <p className="font-medium text-slate-900 truncate">
                                {result.studentName}
                              </p>
                              <p className="text-sm text-slate-600 truncate">
                                {result.className}
                              </p>
                            </>
                          ) : (
                            <p className="text-sm text-red-600 truncate">
                              {result.error}
                            </p>
                          )}
                          <p className="text-xs text-slate-500">
                            {result.timestamp?.toLocaleTimeString()}
                          </p>
                        </div>
                        <Badge className={getStatusBadgeProps(result).className}>
                          {getStatusBadgeProps(result).text}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-slate-500">No scans yet</p>
                    <p className="text-sm text-slate-400 mt-1">
                      Scan QR codes to see results here
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Instructions */}
        <Card className="bg-slate-50">
          <CardHeader>
            <CardTitle className="text-lg">Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6 text-sm">
              <div>
                <h4 className="font-medium text-slate-900 mb-2">For Administrators:</h4>
                <ul className="space-y-1 text-slate-600">
                  <li>• Select the appropriate class from the dropdown</li>
                  <li>• Click "Start Camera" to activate the scanner</li>
                  <li>• Position QR codes within the camera frame</li>
                  <li>• Review scan results in the right panel</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-slate-900 mb-2">Demo Features:</h4>
                <ul className="space-y-1 text-slate-600">
                  <li>• Use the demo QR codes for testing</li>
                  <li>• Random student assignment for demo</li>
                  <li>• Real-time scan result feedback</li>
                  <li>• Attendance status tracking</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default AdminScannerPage;