// Authentication utilities and JWT management

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, LoginCredentials, AuthResponse } from '@/types';
import { dataService, storage, STORAGE_KEYS } from './data';

// JWT Secret - in production, this should be an environment variable
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

// Token expiration time
const TOKEN_EXPIRY = '24h';

export class AuthService {
  /**
   * Hash a password using bcrypt
   */
  static async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
  }

  /**
   * Compare password with hashed password
   */
  static async comparePassword(password: string, hashedPassword: string): Promise<boolean> {
    return await bcrypt.compare(password, hashedPassword);
  }

  /**
   * Generate JWT token for user
   */
  static generateToken(user: Omit<User, 'password'>): string {
    return jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName
      },
      JWT_SECRET,
      { expiresIn: TOKEN_EXPIRY }
    );
  }

  /**
   * Verify and decode JWT token
   */
  static verifyToken(token: string): any {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  /**
   * Login user with email and password
   */
  static async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const user = dataService.getUserByEmail(credentials.email);
      
      if (!user) {
        return {
          success: false,
          error: 'User not found'
        };
      }

      const isPasswordValid = await this.comparePassword(credentials.password, user.password);
      
      if (!isPasswordValid) {
        return {
          success: false,
          error: 'Invalid password'
        };
      }

      const userWithoutPassword = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        phone: user.phone,
        parentPhone: user.parentPhone,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      };

      const token = this.generateToken(userWithoutPassword);

      // Store current user in localStorage for client-side access
      if (typeof window !== 'undefined') {
        storage.set(STORAGE_KEYS.CURRENT_USER, [userWithoutPassword]);
        localStorage.setItem('auth_token', token);
      }

      return {
        success: true,
        user: userWithoutPassword,
        token
      };
    } catch (error) {
      return {
        success: false,
        error: 'Login failed'
      };
    }
  }

  /**
   * Register new user
   */
  static async register(userData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    role: 'admin' | 'student';
    phone?: string;
    parentPhone?: string;
  }): Promise<AuthResponse> {
    try {
      // Check if user already exists
      const existingUser = dataService.getUserByEmail(userData.email);
      if (existingUser) {
        return {
          success: false,
          error: 'User already exists with this email'
        };
      }

      // Hash password
      const hashedPassword = await this.hashPassword(userData.password);

      // Create user
      const newUser = dataService.createUser({
        ...userData,
        password: hashedPassword
      });

      const userWithoutPassword = {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        role: newUser.role,
        phone: newUser.phone,
        parentPhone: newUser.parentPhone,
        createdAt: newUser.createdAt,
        updatedAt: newUser.updatedAt
      };

      const token = this.generateToken(userWithoutPassword);

      return {
        success: true,
        user: userWithoutPassword,
        token
      };
    } catch (error) {
      return {
        success: false,
        error: 'Registration failed'
      };
    }
  }

  /**
   * Logout user
   */
  static logout(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      storage.clear(STORAGE_KEYS.CURRENT_USER);
    }
  }

  /**
   * Get current logged-in user
   */
  static getCurrentUser(): User | null {
    if (typeof window === 'undefined') return null;
    
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return null;

      const decoded = this.verifyToken(token);
      return decoded;
    } catch (error) {
      return null;
    }
  }

  /**
   * Check if user is authenticated
   */
  static isAuthenticated(): boolean {
    return this.getCurrentUser() !== null;
  }

  /**
   * Check if current user has specific role
   */
  static hasRole(role: 'admin' | 'student'): boolean {
    const user = this.getCurrentUser();
    return user?.role === role;
  }

  /**
   * Middleware function to protect routes
   */
  static requireAuth(): User | null {
    const user = this.getCurrentUser();
    if (!user) {
      throw new Error('Authentication required');
    }
    return user;
  }

  /**
   * Admin-only access middleware
   */
  static requireAdmin(): User | null {
    const user = this.requireAuth();
    if (user?.role !== 'admin') {
      throw new Error('Admin access required');
    }
    return user;
  }
}

// Client-side authentication utilities
export const clientAuth = {
  /**
   * Initialize authentication on client side
   */
  init(): void {
    if (typeof window !== 'undefined') {
      dataService.initializeData();
    }
  },

  /**
   * Get authentication headers for API calls
   */
  getAuthHeaders(): Record<string, string> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
  },

  /**
   * Check authentication status
   */
  isLoggedIn(): boolean {
    return AuthService.isAuthenticated();
  },

  /**
   * Get current user role
   */
  getUserRole(): 'admin' | 'student' | null {
    const user = AuthService.getCurrentUser();
    return user?.role || null;
  },

  /**
   * Get user display name
   */
  getDisplayName(): string {
    const user = AuthService.getCurrentUser();
    return user ? `${user.firstName} ${user.lastName}` : 'Guest';
  }
};

// Export default service
export default AuthService;