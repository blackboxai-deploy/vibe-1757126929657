'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import MainLayout from '@/components/layout/main-layout';
import { AuthService, clientAuth } from '@/lib/auth';

const LoginPage: React.FC = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Redirect if already authenticated
    clientAuth.init();
    if (clientAuth.isLoggedIn()) {
      const role = clientAuth.getUserRole();
      router.push(role === 'admin' ? '/admin' : '/student');
    }
  }, [router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    if (error) setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const result = await AuthService.login({
        email: formData.email,
        password: formData.password
      });

      if (result.success && result.user) {
        // Redirect based on user role
        const redirectPath = result.user.role === 'admin' ? '/admin' : '/student';
        router.push(redirectPath);
      } else {
        setError(result.error || 'Login failed');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async (email: string) => {
    setFormData({ email, password: 'password' });
    setError('');
    
    try {
      setIsLoading(true);
      const result = await AuthService.login({
        email,
        password: 'password'
      });

      if (result.success && result.user) {
        const redirectPath = result.user.role === 'admin' ? '/admin' : '/student';
        router.push(redirectPath);
      } else {
        setError(result.error || 'Demo login failed');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <MainLayout title="Sign In" showNavigation={false}>
      <div className="max-w-md mx-auto">
        <Card className="shadow-lg border-0">
          <CardHeader className="text-center pb-4">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-4">
              <span className="text-white font-bold text-xl">AM</span>
            </div>
            <CardTitle className="text-2xl font-bold text-slate-900">Welcome Back</CardTitle>
            <CardDescription className="text-slate-600">
              Sign in to your attendance monitoring account
            </CardDescription>
          </CardHeader>

          <CardContent>
            {/* Demo Account Cards */}
            <div className="mb-6 space-y-3">
              <h3 className="text-sm font-medium text-slate-700 text-center mb-3">Demo Access</h3>
              
              <Card 
                className="cursor-pointer border-blue-200 bg-blue-50/50 hover:bg-blue-50 transition-colors"
                onClick={() => handleDemoLogin('admin@school.edu')}
              >
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-blue-900">Administrator</div>
                      <div className="text-sm text-blue-700">admin@school.edu</div>
                    </div>
                    <Badge className="bg-blue-600 hover:bg-blue-700">
                      Try Admin
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card 
                className="cursor-pointer border-green-200 bg-green-50/50 hover:bg-green-50 transition-colors"
                onClick={() => handleDemoLogin('student1@school.edu')}
              >
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-green-900">Student</div>
                      <div className="text-sm text-green-700">student1@school.edu</div>
                    </div>
                    <Badge variant="outline" className="border-green-600 text-green-600 hover:bg-green-600 hover:text-white">
                      Try Student
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-slate-500">Or continue with email</span>
              </div>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertDescription className="text-red-700">{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Enter your email"
                  required
                  disabled={isLoading}
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Enter your password"
                  required
                  disabled={isLoading}
                  className="h-11"
                />
              </div>

              <Button type="submit" className="w-full h-11" disabled={isLoading}>
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Signing In...</span>
                  </div>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>

            {/* Additional Options */}
            <div className="mt-6 space-y-4">
              <div className="text-center">
                <Link 
                  href="/auth/forgot-password" 
                  className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
                >
                  Forgot your password?
                </Link>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-slate-500">New to the platform?</span>
                </div>
              </div>

              <Button asChild variant="outline" className="w-full h-11">
                <Link href="/auth/register">
                  Create New Account
                </Link>
              </Button>
            </div>

            {/* Demo Instructions */}
            <div className="mt-6 p-4 bg-slate-50 rounded-lg">
              <h4 className="text-sm font-medium text-slate-900 mb-2">Demo Information</h4>
              <div className="text-xs text-slate-600 space-y-1">
                <p>• <strong>Admin Account:</strong> Full access to class management, reports, and settings</p>
                <p>• <strong>Student Account:</strong> Access to personal QR codes and attendance history</p>
                <p>• Default password for all demo accounts: <code className="bg-slate-200 px-1 rounded">password</code></p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Back to Home Link */}
        <div className="text-center mt-6">
          <Link 
            href="/" 
            className="text-sm text-slate-600 hover:text-slate-900 hover:underline"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </MainLayout>
  );
};

export default LoginPage;