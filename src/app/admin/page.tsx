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
import { User, Class } from '@/types';

interface DashboardStats {
  totalStudents: number;
  totalClasses: number;
  todayAttendance: {
    present: number;
    absent: number;
    total: number;
    percentage: number;
  };
  recentActivities: Array<{
    id: string;
    type: string;
    message: string;
    timestamp: Date;
  }>;
}

const AdminDashboard: React.FC = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [todayClasses, setTodayClasses] = useState<Class[]>([]);
  const [recentStudents, setRecentStudents] = useState<User[]>([]);

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

    loadDashboardData();
  }, [router]);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Get all data
      const users = dataService.getUsers();
      const classes = dataService.getClasses();
      const attendanceRecords = dataService.getAttendanceRecords();
      
      // Filter students
      const students = users.filter(user => user.role === 'student');
      
      // Get today's date
      const today = new Date();
      const todayStr = today.toDateString();
      
      // Get today's attendance
      const todayAttendance = attendanceRecords.filter(
        record => new Date(record.date).toDateString() === todayStr
      );
      
      // Calculate attendance stats
      const presentToday = todayAttendance.filter(record => record.status === 'present' || record.status === 'late').length;
      const totalExpected = students.length * classes.length; // Simplified calculation
      const attendancePercentage = totalExpected > 0 ? Math.round((presentToday / totalExpected) * 100) : 0;
      
      // Get today's classes (simplified - showing all active classes)
      const activeTodayClasses = classes.filter(cls => cls.isActive).slice(0, 4);
      
      // Get recent students (last 5)
      const sortedStudents = students.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ).slice(0, 5);
      
      // Create recent activities
      const recentActivities = [
        {
          id: '1',
          type: 'attendance',
          message: `${presentToday} students marked attendance today`,
          timestamp: today
        },
        {
          id: '2',
          type: 'class',
          message: `${classes.length} active classes this semester`,
          timestamp: today
        },
        {
          id: '3',
          type: 'student',
          message: `${students.length} students enrolled`,
          timestamp: today
        }
      ];

      setStats({
        totalStudents: students.length,
        totalClasses: classes.length,
        todayAttendance: {
          present: presentToday,
          absent: totalExpected - presentToday,
          total: totalExpected,
          percentage: attendancePercentage
        },
        recentActivities
      });
      
      setTodayClasses(activeTodayClasses);
      setRecentStudents(sortedStudents);
      
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error('Dashboard error:', err);
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

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'attendance': return '✓';
      case 'class': return '📚';
      case 'student': return '👥';
      default: return '📋';
    }
  };

  if (isLoading) {
    return (
      <MainLayout>
        <PageLoading message="Loading dashboard..." />
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
              {getGreeting()}, {clientAuth.getDisplayName()}
            </h1>
            <p className="text-slate-600 mt-1">
              Here's what's happening with your attendance system today.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
            <Button asChild>
              <Link href="/admin/scanner">
                QR Scanner
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/admin/classes/new">
                New Class
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">Total Students</CardTitle>
                <div className="w-4 h-4 text-slate-400">👥</div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900">{stats.totalStudents}</div>
                <p className="text-xs text-slate-600 mt-1">
                  Active enrollments
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">Active Classes</CardTitle>
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
                <CardTitle className="text-sm font-medium text-slate-600">Today's Attendance</CardTitle>
                <div className="w-4 h-4 text-slate-400">✓</div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900">{stats.todayAttendance.present}</div>
                <p className="text-xs text-slate-600 mt-1">
                  Students present
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">Attendance Rate</CardTitle>
                <div className="w-4 h-4 text-slate-400">📊</div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900">{stats.todayAttendance.percentage}%</div>
                <Progress 
                  value={stats.todayAttendance.percentage} 
                  className="mt-2 h-1"
                />
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
                  <CardTitle>Today's Classes</CardTitle>
                  <CardDescription>Active classes and their schedules</CardDescription>
                </div>
                <Button asChild variant="outline" size="sm">
                  <Link href="/admin/classes">View All</Link>
                </Button>
              </CardHeader>
              <CardContent>
                {todayClasses.length > 0 ? (
                  <div className="space-y-4">
                    {todayClasses.map((cls) => (
                      <div key={cls.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50">
                        <div className="flex-1">
                          <h3 className="font-medium text-slate-900">{cls.name}</h3>
                          <p className="text-sm text-slate-600">{cls.subject} • {cls.instructor}</p>
                          <p className="text-xs text-slate-500 mt-1">{cls.room}</p>
                        </div>
                        <div className="text-right space-y-1">
                          <Badge variant="outline" className="text-xs">
                            {cls.enrolledStudents.length} students
                          </Badge>
                          {cls.schedule.map((schedule, index) => (
                            <p key={index} className="text-xs text-slate-600">
                              {schedule.startTime} - {schedule.endTime}
                            </p>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-slate-500">No classes scheduled for today</p>
                    <Button asChild className="mt-4" size="sm">
                      <Link href="/admin/classes/new">Create New Class</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common administrative tasks</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <Button asChild variant="outline" className="h-auto p-4">
                    <Link href="/admin/scanner" className="flex flex-col items-center space-y-2">
                      <span className="text-2xl">📱</span>
                      <span className="text-sm">QR Scanner</span>
                    </Link>
                  </Button>
                  
                  <Button asChild variant="outline" className="h-auto p-4">
                    <Link href="/admin/classes/new" className="flex flex-col items-center space-y-2">
                      <span className="text-2xl">📚</span>
                      <span className="text-sm">New Class</span>
                    </Link>
                  </Button>
                  
                  <Button asChild variant="outline" className="h-auto p-4">
                    <Link href="/admin/students" className="flex flex-col items-center space-y-2">
                      <span className="text-2xl">👥</span>
                      <span className="text-sm">Students</span>
                    </Link>
                  </Button>
                  
                  <Button asChild variant="outline" className="h-auto p-4">
                    <Link href="/admin/reports" className="flex flex-col items-center space-y-2">
                      <span className="text-2xl">📊</span>
                      <span className="text-sm">Reports</span>
                    </Link>
                  </Button>
                  
                  <Button asChild variant="outline" className="h-auto p-4">
                    <Link href="/admin/notifications" className="flex flex-col items-center space-y-2">
                      <span className="text-2xl">💬</span>
                      <span className="text-sm">SMS Alerts</span>
                    </Link>
                  </Button>
                  
                  <Button asChild variant="outline" className="h-auto p-4">
                    <Link href="/admin/settings" className="flex flex-col items-center space-y-2">
                      <span className="text-2xl">⚙️</span>
                      <span className="text-sm">Settings</span>
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Recent Activities */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                {stats?.recentActivities && stats.recentActivities.length > 0 ? (
                  <div className="space-y-4">
                    {stats.recentActivities.map((activity) => (
                      <div key={activity.id} className="flex items-start space-x-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center">
                          <span className="text-sm">{getActivityIcon(activity.type)}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-slate-900">{activity.message}</p>
                          <p className="text-xs text-slate-500 mt-1">
                            {activity.timestamp.toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 text-center py-4">
                    No recent activities
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Recent Students */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Recent Students</CardTitle>
                <Button asChild variant="outline" size="sm">
                  <Link href="/admin/students">View All</Link>
                </Button>
              </CardHeader>
              <CardContent>
                {recentStudents.length > 0 ? (
                  <div className="space-y-3">
                    {recentStudents.map((student) => (
                      <div key={student.id} className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <span className="text-xs font-medium text-green-700">
                            {student.firstName.charAt(0)}{student.lastName.charAt(0)}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 truncate">
                            {student.firstName} {student.lastName}
                          </p>
                          <p className="text-xs text-slate-500 truncate">{student.email}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 text-center py-4">
                    No students enrolled yet
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

export default AdminDashboard;