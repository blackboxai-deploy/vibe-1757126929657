'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import MainLayout, { PageLoading } from '@/components/layout/main-layout';
import { clientAuth } from '@/lib/auth';
import { dataService } from '@/lib/data';
import { Class, AttendanceRecord, User } from '@/types';

interface StudentStats {
  totalClasses: number;
  attendedClasses: number;
  attendancePercentage: number;
  upcomingClasses: Class[];
  recentAttendance: AttendanceRecord[];
}

const StudentDashboard: React.FC = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [student, setStudent] = useState<User | null>(null);
  const [stats, setStats] = useState<StudentStats | null>(null);

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

    loadStudentData();
  }, [router]);

  const loadStudentData = async () => {
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
      setStudent(userData);

      // Get student's classes
      const studentClasses = dataService.getClassesByStudent(currentUser.id);
      
      // Get student's attendance records
      const attendanceRecords = dataService.getAttendanceByStudent(currentUser.id);
      
      // Calculate stats
      const attendedCount = attendanceRecords.filter(record => 
        record.status === 'present' || record.status === 'late'
      ).length;
      
      const totalPossibleClasses = studentClasses.length * 30; // Approximate for semester
      const attendancePercentage = totalPossibleClasses > 0 
        ? Math.round((attendedCount / totalPossibleClasses) * 100) 
        : 0;

      // Get today's classes
      const today = new Date();
      const todayDay = today.toLocaleDateString('en-US', { weekday: 'long' });
      
      const todayClasses = studentClasses.filter(cls => 
        cls.schedule.some(schedule => schedule.day === todayDay)
      );

      // Get recent attendance (last 7 records)
      const recentAttendance = attendanceRecords
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 7);

      setStats({
        totalClasses: studentClasses.length,
        attendedClasses: attendedCount,
        attendancePercentage,
        upcomingClasses: todayClasses,
        recentAttendance
      });

    } catch (err) {
      setError('Failed to load student data');
      console.error('Student dashboard error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present': return 'bg-green-100 text-green-800';
      case 'late': return 'bg-yellow-100 text-yellow-800';
      case 'absent': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const getAttendanceColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (isLoading) {
    return (
      <MainLayout>
        <PageLoading message="Loading your dashboard..." />
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <Alert className="border-red-200 bg-red-50 max-w-md mx-auto">
          <AlertDescription className="text-red-700">{error}</AlertDescription>
        </Alert>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Welcome Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              {getGreeting()}, {student?.firstName}
            </h1>
            <p className="text-slate-600 mt-1">
              Track your attendance and stay up to date with your classes.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
            <Button asChild>
              <Link href="/student/qr-code">
                My QR Code
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/student/scanner">
                Mark Attendance
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">Enrolled Classes</CardTitle>
                <div className="w-4 h-4 text-slate-400">📚</div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900">{stats.totalClasses}</div>
                <p className="text-xs text-slate-600 mt-1">
                  This semester
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">Classes Attended</CardTitle>
                <div className="w-4 h-4 text-slate-400">✓</div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900">{stats.attendedClasses}</div>
                <p className="text-xs text-slate-600 mt-1">
                  Sessions completed
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">Attendance Rate</CardTitle>
                <div className="w-4 h-4 text-slate-400">📊</div>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${getAttendanceColor(stats.attendancePercentage)}`}>
                  {stats.attendancePercentage}%
                </div>
                <Progress 
                  value={stats.attendancePercentage} 
                  className="mt-2 h-1"
                />
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">Today's Classes</CardTitle>
                <div className="w-4 h-4 text-slate-400">📅</div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900">{stats.upcomingClasses.length}</div>
                <p className="text-xs text-slate-600 mt-1">
                  Classes scheduled
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Today's Classes */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Today's Schedule</CardTitle>
                  <CardDescription>Your classes for today</CardDescription>
                </div>
                <Button asChild variant="outline" size="sm">
                  <Link href="/student/classes">View All Classes</Link>
                </Button>
              </CardHeader>
              <CardContent>
                {stats && stats.upcomingClasses.length > 0 ? (
                  <div className="space-y-4">
                    {stats.upcomingClasses.map((cls) => {
                      // Find today's schedule
                      const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
                      const todaySchedule = cls.schedule.find(s => s.day === today);
                      
                      return (
                        <div key={cls.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50">
                          <div className="flex-1">
                            <h3 className="font-medium text-slate-900">{cls.name}</h3>
                            <p className="text-sm text-slate-600">{cls.subject} • {cls.instructor}</p>
                            <p className="text-xs text-slate-500 mt-1">{cls.room}</p>
                          </div>
                          <div className="text-right space-y-1">
                            {todaySchedule && (
                              <div className="text-sm font-medium text-slate-900">
                                {todaySchedule.startTime} - {todaySchedule.endTime}
                              </div>
                            )}
                            <Badge variant="outline" className="text-xs">
                              {cls.enrolledStudents.length} students
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                    <div className="pt-4 border-t">
                      <Button asChild className="w-full" variant="outline">
                        <Link href="/student/scanner">
                          Mark Attendance with QR Code
                        </Link>
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-slate-500 mb-4">No classes scheduled for today</p>
                    <Button asChild size="sm" variant="outline">
                      <Link href="/student/classes">View All Classes</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common student tasks</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <Button asChild variant="outline" className="h-auto p-4">
                    <Link href="/student/scanner" className="flex flex-col items-center space-y-2">
                      <span className="text-2xl">📱</span>
                      <span className="text-sm">Mark Attendance</span>
                    </Link>
                  </Button>
                  
                  <Button asChild variant="outline" className="h-auto p-4">
                    <Link href="/student/qr-code" className="flex flex-col items-center space-y-2">
                      <span className="text-2xl">💳</span>
                      <span className="text-sm">My QR Code</span>
                    </Link>
                  </Button>
                  
                  <Button asChild variant="outline" className="h-auto p-4">
                    <Link href="/student/classes" className="flex flex-col items-center space-y-2">
                      <span className="text-2xl">📚</span>
                      <span className="text-sm">My Classes</span>
                    </Link>
                  </Button>
                  
                  <Button asChild variant="outline" className="h-auto p-4">
                    <Link href="/student/attendance" className="flex flex-col items-center space-y-2">
                      <span className="text-2xl">📊</span>
                      <span className="text-sm">Attendance History</span>
                    </Link>
                  </Button>
                  
                  <Button asChild variant="outline" className="h-auto p-4">
                    <Link href="/student/profile" className="flex flex-col items-center space-y-2">
                      <span className="text-2xl">👤</span>
                      <span className="text-sm">Profile</span>
                    </Link>
                  </Button>
                  
                  <Button asChild variant="outline" className="h-auto p-4">
                    <Link href="/help" className="flex flex-col items-center space-y-2">
                      <span className="text-2xl">❓</span>
                      <span className="text-sm">Help</span>
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Attendance Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Attendance Overview</CardTitle>
              </CardHeader>
              <CardContent>
                {stats && (
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className={`text-3xl font-bold ${getAttendanceColor(stats.attendancePercentage)}`}>
                        {stats.attendancePercentage}%
                      </div>
                      <p className="text-sm text-slate-600">Overall Attendance</p>
                    </div>
                    
                    <div className="space-y-2 pt-4 border-t">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Classes Attended</span>
                        <span className="font-medium">{stats.attendedClasses}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Enrolled Classes</span>
                        <span className="font-medium">{stats.totalClasses}</span>
                      </div>
                    </div>

                    {stats.attendancePercentage < 75 && (
                      <Alert className="border-yellow-200 bg-yellow-50 mt-4">
                        <AlertDescription className="text-yellow-800 text-xs">
                          Your attendance is below 75%. Consider attending more classes to improve your record.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Attendance */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Recent Attendance</CardTitle>
                <Button asChild variant="outline" size="sm">
                  <Link href="/student/attendance">View All</Link>
                </Button>
              </CardHeader>
              <CardContent>
                {stats && stats.recentAttendance.length > 0 ? (
                  <div className="space-y-3">
                    {stats.recentAttendance.map((record) => {
                      const classData = dataService.getClassById(record.classId);
                      return (
                        <div key={record.id} className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-900 truncate">
                              {classData?.name || 'Unknown Class'}
                            </p>
                            <p className="text-xs text-slate-500">
                              {formatDate(record.date)}
                            </p>
                          </div>
                          <Badge className={`text-xs ${getStatusColor(record.status)}`}>
                            {record.status}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 text-center py-4">
                    No attendance records yet
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default StudentDashboard;