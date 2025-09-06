'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { clientAuth } from '@/lib/auth';

interface MainLayoutProps {
  children: React.ReactNode;
  title?: string;
  showNavigation?: boolean;
}

const MainLayout: React.FC<MainLayoutProps> = ({ 
  children, 
  title = 'Attendance Monitoring', 
  showNavigation = true 
}) => {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initialize auth and get current user
    clientAuth.init();
    const currentUser = clientAuth.isLoggedIn() ? {
      role: clientAuth.getUserRole(),
      name: clientAuth.getDisplayName()
    } : null;
    setUser(currentUser);
    setIsLoading(false);
  }, []);

  const handleLogout = () => {
    clientAuth.logout();
    setUser(null);
    router.push('/auth/login');
  };

  const getNavigationItems = () => {
    if (!user) return [];

    const commonItems = [
      { label: 'Dashboard', href: user.role === 'admin' ? '/admin' : '/student' }
    ];

    if (user.role === 'admin') {
      return [
        ...commonItems,
        { label: 'Classes', href: '/admin/classes' },
        { label: 'Students', href: '/admin/students' },
        { label: 'Reports', href: '/admin/reports' },
        { label: 'QR Scanner', href: '/admin/scanner' }
      ];
    } else {
      return [
        ...commonItems,
        { label: 'My Classes', href: '/student/classes' },
        { label: 'My QR Code', href: '/student/qr-code' },
        { label: 'Attendance History', href: '/student/attendance' }
      ];
    }
  };

  const getUserInitials = (name: string): string => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleColor = (role: string): string => {
    return role === 'admin' ? 'bg-blue-500' : 'bg-green-500';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Title */}
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">AM</span>
                </div>
              </div>
              <div>
                <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
                {user && (
                  <p className="text-sm text-slate-500">
                    {user.role === 'admin' ? 'Administrator Portal' : 'Student Portal'}
                  </p>
                )}
              </div>
            </div>

            {/* Navigation and User Menu */}
            <div className="flex items-center space-x-4">
              {/* Navigation Items */}
              {showNavigation && user && (
                <nav className="hidden md:flex items-center space-x-1">
                  {getNavigationItems().map((item) => (
                    <Link key={item.href} href={item.href}>
                      <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-900">
                        {item.label}
                      </Button>
                    </Link>
                  ))}
                </nav>
              )}

              {/* User Profile Dropdown */}
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className={`${getRoleColor(user.role)} text-white font-medium`}>
                          {getUserInitials(user.name)}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end">
                    <div className="flex items-center justify-start gap-2 p-2">
                      <div className="flex flex-col space-y-1 leading-none">
                        <p className="font-medium">{user.name}</p>
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${user.role === 'admin' ? 'border-blue-200 text-blue-700' : 'border-green-200 text-green-700'}`}
                        >
                          {user.role === 'admin' ? 'Administrator' : 'Student'}
                        </Badge>
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href={user.role === 'admin' ? '/admin/profile' : '/student/profile'}>
                        Profile Settings
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/help">
                        Help & Support
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600">
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <div className="flex items-center space-x-2">
                  <Button asChild variant="ghost" size="sm">
                    <Link href="/auth/login">Sign In</Link>
                  </Button>
                  <Button asChild size="sm">
                    <Link href="/auth/register">Get Started</Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {showNavigation && user && (
          <div className="md:hidden border-t border-slate-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex overflow-x-auto py-2 space-x-1">
                {getNavigationItems().map((item) => (
                  <Link key={item.href} href={item.href}>
                    <Button variant="ghost" size="sm" className="whitespace-nowrap text-slate-600 hover:text-slate-900">
                      {item.label}
                    </Button>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-2 sm:space-y-0">
            <div className="text-sm text-slate-500">
              © 2024 Attendance Monitoring System. All rights reserved.
            </div>
            <div className="flex items-center space-x-4 text-sm text-slate-500">
              <Link href="/privacy" className="hover:text-slate-700 transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="hover:text-slate-700 transition-colors">
                Terms of Service
              </Link>
              <Link href="/contact" className="hover:text-slate-700 transition-colors">
                Contact
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

// Loading component for pages
export const PageLoading: React.FC<{ message?: string }> = ({ message = 'Loading...' }) => {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Card className="p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-slate-600">{message}</p>
      </Card>
    </div>
  );
};

// Error component for pages
export const PageError: React.FC<{ message?: string; onRetry?: () => void }> = ({ 
  message = 'Something went wrong', 
  onRetry 
}) => {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Card className="p-8 text-center max-w-md">
        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-red-500 text-xl">⚠</span>
        </div>
        <h3 className="text-lg font-semibold text-slate-900 mb-2">Error</h3>
        <p className="text-slate-600 mb-4">{message}</p>
        {onRetry && (
          <Button onClick={onRetry} variant="outline">
            Try Again
          </Button>
        )}
      </Card>
    </div>
  );
};

export default MainLayout;