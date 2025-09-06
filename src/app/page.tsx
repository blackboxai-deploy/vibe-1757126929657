'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import MainLayout from '@/components/layout/main-layout';
import { clientAuth } from '@/lib/auth';

const HomePage: React.FC = () => {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<'admin' | 'student' | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initialize authentication
    clientAuth.init();
    
    // Check authentication status
    const authenticated = clientAuth.isLoggedIn();
    const role = clientAuth.getUserRole();
    
    setIsAuthenticated(authenticated);
    setUserRole(role);
    setIsLoading(false);

    // Redirect if already authenticated
    if (authenticated && role) {
      router.push(role === 'admin' ? '/admin' : '/student');
    }
  }, [router]);

  if (isLoading) {
    return (
      <MainLayout showNavigation={false}>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </MainLayout>
    );
  }

  if (isAuthenticated && userRole) {
    return null; // Will redirect
  }

  return (
    <MainLayout showNavigation={false}>
      <div className="max-w-6xl mx-auto">
        {/* Hero Section */}
        <div className="text-center py-16">
          <div className="mb-8">
            <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <span className="text-white font-bold text-2xl">AM</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-4">
              Smart Attendance
              <span className="block text-blue-600">Monitoring System</span>
            </h1>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
              Revolutionary QR code-based attendance tracking with real-time SMS notifications, 
              comprehensive analytics, and seamless management for educational institutions.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4 mb-12">
            <Button asChild size="lg" className="w-full sm:w-auto">
              <Link href="/auth/register">
                Get Started Free
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
              <Link href="/auth/login">
                Sign In
              </Link>
            </Button>
          </div>

          {/* Demo Credentials Card */}
          <Card className="max-w-md mx-auto mb-16 border-blue-200 bg-blue-50/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-blue-900">Demo Access</CardTitle>
              <CardDescription className="text-blue-700">
                Try the system with these demo credentials
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm">
                <div className="flex items-center justify-between p-2 bg-white rounded border">
                  <span className="font-medium">Admin:</span>
                  <span>admin@school.edu</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-white rounded border mt-1">
                  <span className="font-medium">Student:</span>
                  <span>student1@school.edu</span>
                </div>
                <div className="text-center mt-2 text-blue-600 font-medium">
                  Password: <code>password</code>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Features Section */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          <Card className="relative overflow-hidden hover:shadow-lg transition-shadow">
            <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-bl-3xl"></div>
            <CardHeader>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-blue-600 text-xl">📱</span>
              </div>
              <CardTitle className="text-xl">QR Code Scanning</CardTitle>
              <CardDescription>
                Instant attendance marking with secure, time-limited QR codes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-slate-600">
                <li>• Dynamic QR code generation</li>
                <li>• Camera-based mobile scanning</li>
                <li>• Automatic expiry protection</li>
                <li>• Real-time validation</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden hover:shadow-lg transition-shadow">
            <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-bl-3xl"></div>
            <CardHeader>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-green-600 text-xl">💬</span>
              </div>
              <CardTitle className="text-xl">SMS Notifications</CardTitle>
              <CardDescription>
                Automated SMS alerts for parents and students
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-slate-600">
                <li>• Attendance confirmations</li>
                <li>• Absence alerts to parents</li>
                <li>• Class reminders</li>
                <li>• Custom notification templates</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden hover:shadow-lg transition-shadow">
            <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-bl-3xl"></div>
            <CardHeader>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-purple-600 text-xl">📊</span>
              </div>
              <CardTitle className="text-xl">Analytics Dashboard</CardTitle>
              <CardDescription>
                Comprehensive attendance tracking and reporting
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-slate-600">
                <li>• Real-time attendance metrics</li>
                <li>• Detailed student reports</li>
                <li>• Class-wise analytics</li>
                <li>• Export capabilities</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden hover:shadow-lg transition-shadow">
            <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-bl-3xl"></div>
            <CardHeader>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-orange-600 text-xl">🎓</span>
              </div>
              <CardTitle className="text-xl">Class Management</CardTitle>
              <CardDescription>
                Efficient class scheduling and student enrollment
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-slate-600">
                <li>• Easy class creation</li>
                <li>• Student enrollment management</li>
                <li>• Schedule coordination</li>
                <li>• Instructor assignments</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden hover:shadow-lg transition-shadow">
            <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-bl-3xl"></div>
            <CardHeader>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-red-600 text-xl">🔐</span>
              </div>
              <CardTitle className="text-xl">Secure Access</CardTitle>
              <CardDescription>
                Role-based authentication and data protection
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-slate-600">
                <li>• Admin and student portals</li>
                <li>• JWT-based authentication</li>
                <li>• Encrypted data storage</li>
                <li>• Access control permissions</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden hover:shadow-lg transition-shadow">
            <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-teal-500 to-teal-600 rounded-bl-3xl"></div>
            <CardHeader>
              <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-teal-600 text-xl">📱</span>
              </div>
              <CardTitle className="text-xl">Mobile Optimized</CardTitle>
              <CardDescription>
                Responsive design for all devices and screen sizes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-slate-600">
                <li>• Mobile-first design</li>
                <li>• Touch-optimized interface</li>
                <li>• Cross-platform compatibility</li>
                <li>• Offline QR code display</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* How it Works Section */}
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">How It Works</h2>
          <p className="text-lg text-slate-600 mb-12">Simple, secure, and efficient attendance tracking</p>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl text-blue-600 font-bold">1</span>
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">Generate QR Code</h3>
              <p className="text-slate-600">
                Teachers generate time-limited QR codes for each class session with automatic expiry
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl text-green-600 font-bold">2</span>
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">Scan & Attend</h3>
              <p className="text-slate-600">
                Students scan the QR code using their mobile devices to mark attendance instantly
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl text-purple-600 font-bold">3</span>
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">Track & Notify</h3>
              <p className="text-slate-600">
                System tracks attendance in real-time and sends SMS notifications to parents automatically
              </p>
            </div>
          </div>
        </div>

        {/* Status Badges */}
        <div className="flex flex-wrap justify-center items-center gap-4 mb-16">
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            ✓ Real-time Processing
          </Badge>
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            ✓ Mobile Responsive
          </Badge>
          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
            ✓ SMS Integration
          </Badge>
          <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
            ✓ Secure & Reliable
          </Badge>
        </div>

        {/* CTA Section */}
        <Card className="text-center p-8 bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-0">
          <CardHeader className="pb-4">
            <CardTitle className="text-2xl">Ready to Get Started?</CardTitle>
            <CardDescription className="text-blue-100">
              Join thousands of schools already using our attendance monitoring system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
              <Button asChild size="lg" variant="secondary">
                <Link href="/auth/register">
                  Create Free Account
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="bg-transparent border-white text-white hover:bg-white hover:text-blue-600">
                <Link href="/auth/login">
                  Sign In
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default HomePage;