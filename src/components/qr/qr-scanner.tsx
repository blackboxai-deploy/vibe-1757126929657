'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';


interface QRScannerProps {
  onScanSuccess: (data: string) => void;
  onScanError?: (error: string) => void;
  isScanning?: boolean;
  className?: string;
}

// Note: This is a simplified QR scanner component
// In a real implementation, you would use libraries like @zxing/browser for actual camera scanning
const QRScanner: React.FC<QRScannerProps> = ({
  onScanSuccess,
  onScanError,
  isScanning = false,
  className = ''
}) => {
  const [hasCamera, setHasCamera] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState('');
  const [lastScan, setLastScan] = useState<string>('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    checkCameraSupport();
    return () => {
      stopCamera();
    };
  }, []);

  const checkCameraSupport = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        setHasCamera(true);
      } else {
        setError('Camera access is not supported in this browser');
      }
    } catch (err) {
      setError('Failed to check camera support');
    }
  };

  const startCamera = async () => {
    if (!hasCamera) {
      setError('No camera support detected');
      return;
    }

    try {
      setError('');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment' // Use back camera if available
        }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsActive(true);
      }
    } catch (err) {
      setError('Failed to access camera. Please check permissions.');
      onScanError?.('Camera access denied');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsActive(false);
  };

  // Simulate QR code scanning for demo purposes
  const simulateScan = (qrData: string) => {
    if (qrData === lastScan) return; // Prevent duplicate scans
    
    setLastScan(qrData);
    onScanSuccess(qrData);
    
    // Auto-stop after successful scan
    setTimeout(() => {
      stopCamera();
    }, 1000);
  };

  // Demo QR codes for testing
  const demoQRCodes = [
    {
      label: 'Math Class - Valid',
      data: JSON.stringify({
        classId: 'class1',
        sessionId: 'demo-session-1',
        timestamp: Date.now(),
        expiresAt: Date.now() + 30 * 60 * 1000 // 30 minutes from now
      })
    },
    {
      label: 'CS Class - Valid',
      data: JSON.stringify({
        classId: 'class2',
        sessionId: 'demo-session-2',
        timestamp: Date.now(),
        expiresAt: Date.now() + 30 * 60 * 1000
      })
    },
    {
      label: 'Physics Lab - Valid',
      data: JSON.stringify({
        classId: 'class3',
        sessionId: 'demo-session-3',
        timestamp: Date.now(),
        expiresAt: Date.now() + 30 * 60 * 1000
      })
    }
  ];

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <span>📱</span>
          <span>QR Code Scanner</span>
        </CardTitle>
        <CardDescription>
          Scan QR codes to mark attendance for your classes
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertDescription className="text-red-700">{error}</AlertDescription>
          </Alert>
        )}

        {/* Camera Preview */}
        <div className="relative">
          <div className="aspect-square bg-slate-100 rounded-lg overflow-hidden relative">
            {isActive ? (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                  onLoadedMetadata={() => {
                    if (videoRef.current) {
                      videoRef.current.play();
                    }
                  }}
                />
                {/* Scanning Overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-48 h-48 border-2 border-white rounded-lg shadow-lg">
                    <div className="w-full h-full border-2 border-dashed border-white/50 rounded-lg animate-pulse"></div>
                  </div>
                </div>
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="bg-black/60 rounded-lg p-2 text-white text-sm text-center">
                    Position QR code within the frame
                  </div>
                </div>
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mx-auto">
                    <span className="text-2xl text-slate-400">📷</span>
                  </div>
                  <p className="text-slate-500">Camera not active</p>
                  {hasCamera ? (
                    <Button onClick={startCamera} disabled={isScanning}>
                      {isScanning ? 'Scanning...' : 'Start Camera'}
                    </Button>
                  ) : (
                    <p className="text-sm text-red-500">Camera not supported</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Camera Controls */}
        {hasCamera && (
          <div className="flex space-x-2">
            {!isActive ? (
              <Button onClick={startCamera} className="flex-1" disabled={isScanning}>
                {isScanning ? 'Processing...' : 'Start Scanning'}
              </Button>
            ) : (
              <Button onClick={stopCamera} variant="outline" className="flex-1">
                Stop Camera
              </Button>
            )}
          </div>
        )}

        {/* Demo Section for Testing */}
        <div className="pt-4 border-t">
          <h4 className="text-sm font-medium text-slate-900 mb-3">Demo QR Codes (For Testing)</h4>
          <div className="space-y-2">
            {demoQRCodes.map((demo, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                className="w-full justify-between"
                onClick={() => simulateScan(demo.data)}
                disabled={isScanning}
              >
                <span>{demo.label}</span>
                <Badge variant="secondary" className="ml-2">Test</Badge>
              </Button>
            ))}
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Click any demo QR code above to test the attendance marking process
          </p>
        </div>

        {/* Status */}
        {isActive && (
          <div className="text-center">
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              📷 Camera Active - Ready to Scan
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// QR Code Display Component
interface QRCodeDisplayProps {
  qrCodeDataURL: string;
  className?: string;
  expiresAt?: Date;
  classInfo?: {
    name: string;
    instructor: string;
    room: string;
  };
}

export const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({
  qrCodeDataURL,
  className = '',
  expiresAt,
  classInfo
}) => {
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  useEffect(() => {
    if (!expiresAt) return;

    const updateTimer = () => {
      const now = new Date();
      const timeLeft = expiresAt.getTime() - now.getTime();
      
      if (timeLeft <= 0) {
        setTimeRemaining('Expired');
        return;
      }
      
      const minutes = Math.floor(timeLeft / 60000);
      const seconds = Math.floor((timeLeft % 60000) / 1000);
      setTimeRemaining(`${minutes}:${seconds.toString().padStart(2, '0')}`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    
    return () => clearInterval(interval);
  }, [expiresAt]);

  const isExpired = expiresAt ? new Date() > expiresAt : false;
  const isAboutToExpire = expiresAt ? (expiresAt.getTime() - Date.now()) < 5 * 60 * 1000 : false;

  return (
    <Card className={`text-center ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center justify-center space-x-2">
          <span>📱</span>
          <span>Class QR Code</span>
        </CardTitle>
        {classInfo && (
          <CardDescription>
            {classInfo.name} • {classInfo.instructor} • {classInfo.room}
          </CardDescription>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* QR Code Image */}
        <div className="relative inline-block">
          <img 
            src={qrCodeDataURL} 
            alt="Class QR Code" 
            className={`mx-auto border-2 rounded-lg ${
              isExpired ? 'grayscale border-red-300' : 'border-slate-200'
            }`}
            style={{ maxWidth: '300px', width: '100%' }}
          />
          {isExpired && (
            <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center rounded-lg">
              <Badge className="bg-red-500 text-white">EXPIRED</Badge>
            </div>
          )}
        </div>

        {/* Timer */}
        {expiresAt && (
          <div className="space-y-2">
            <p className="text-sm text-slate-600">Time Remaining</p>
            <div className={`text-2xl font-mono font-bold ${
              isExpired ? 'text-red-600' : 
              isAboutToExpire ? 'text-yellow-600' : 'text-green-600'
            }`}>
              {timeRemaining}
            </div>
            {isAboutToExpire && !isExpired && (
              <Badge variant="outline" className="border-yellow-500 text-yellow-700">
                ⚠ Expiring Soon
              </Badge>
            )}
          </div>
        )}

        {/* Instructions */}
        <div className="pt-4 border-t">
          <p className="text-sm text-slate-600 mb-2">
            Students: Scan this QR code to mark your attendance
          </p>
          <div className="text-xs text-slate-500 space-y-1">
            <p>• Position your phone camera over the QR code</p>
            <p>• Wait for automatic detection and scanning</p>
            <p>• Your attendance will be recorded instantly</p>
          </div>
        </div>

        {/* Status */}
        <Badge 
          variant="outline" 
          className={
            isExpired 
              ? "bg-red-50 text-red-700 border-red-200"
              : "bg-green-50 text-green-700 border-green-200"
          }
        >
          {isExpired ? '❌ Code Expired' : '✅ Active & Ready'}
        </Badge>
      </CardContent>
    </Card>
  );
};

export default QRScanner;