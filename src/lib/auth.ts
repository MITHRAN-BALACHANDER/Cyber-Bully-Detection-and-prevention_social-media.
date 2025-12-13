/**
 * Authentication Library
 * Handles JWT operations, password hashing, and session management
 */

import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { JWTPayload, AuthUser } from '@/types';
import { User } from '@/models';
import connectDB from './db';

// Constants
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const COOKIE_NAME = 'auth_token';
const SALT_ROUNDS = 12;

// ===========================================
// PASSWORD UTILITIES
// ===========================================

/**
 * Hash a plain text password
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Compare a plain text password with a hash
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// ===========================================
// JWT UTILITIES
// ===========================================

/**
 * Generate a JWT token for a user
 */
export function generateToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN as string,
  } as jwt.SignOptions);
}

/**
 * Verify and decode a JWT token
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}

// ===========================================
// COOKIE MANAGEMENT
// ===========================================

/**
 * Set auth cookie with JWT token
 */
export async function setAuthCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  
  // Calculate expiry based on JWT_EXPIRES_IN
  const expiresIn = JWT_EXPIRES_IN;
  let maxAge = 7 * 24 * 60 * 60; // Default 7 days in seconds
  
  if (expiresIn.endsWith('d')) {
    maxAge = parseInt(expiresIn) * 24 * 60 * 60;
  } else if (expiresIn.endsWith('h')) {
    maxAge = parseInt(expiresIn) * 60 * 60;
  }

  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge,
    path: '/',
  });
}

/**
 * Remove auth cookie (logout)
 */
export async function removeAuthCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

/**
 * Get token from cookies
 */
export async function getTokenFromCookies(): Promise<string | null> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(COOKIE_NAME);
  return cookie?.value || null;
}

/**
 * Get token from request (for API routes)
 */
export function getTokenFromRequest(request: NextRequest): string | null {
  // Check cookie first
  const cookieToken = request.cookies.get(COOKIE_NAME)?.value;
  if (cookieToken) return cookieToken;

  // Fall back to Authorization header
  const authHeader = request.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  return null;
}

// ===========================================
// SESSION MANAGEMENT
// ===========================================

/**
 * Get current authenticated user from cookies
 * Used in server components and API routes
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const token = await getTokenFromCookies();
  
  if (!token) {
    return null;
  }

  const payload = verifyToken(token);
  
  if (!payload) {
    return null;
  }

  try {
    await connectDB();
    const user = await User.findById(payload.userId).lean();
    
    if (!user) {
      return null;
    }

    // Return user without password hash
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash: _pw, __v: _v, ...authUser } = user as Record<string, unknown>;
    return {
      ...authUser,
      _id: String(authUser._id),
    } as AuthUser;
  } catch {
    return null;
  }
}

/**
 * Get current user from request (for API routes)
 */
export async function getUserFromRequest(request: NextRequest): Promise<AuthUser | null> {
  const token = getTokenFromRequest(request);
  
  if (!token) {
    return null;
  }

  const payload = verifyToken(token);
  
  if (!payload) {
    return null;
  }

  try {
    await connectDB();
    const user = await User.findById(payload.userId).lean();
    
    if (!user) {
      return null;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash: _pw, __v: _v, ...authUser } = user as Record<string, unknown>;
    return {
      ...authUser,
      _id: String(authUser._id),
    } as AuthUser;
  } catch {
    return null;
  }
}

/**
 * Verify user has required role
 */
export function hasRole(user: AuthUser, roles: string[]): boolean {
  return roles.includes(user.role);
}

// ===========================================
// AUTH HELPERS FOR API ROUTES
// ===========================================

/**
 * Require authentication for an API route
 * Returns user if authenticated, throws if not
 */
export async function requireAuth(request: NextRequest): Promise<AuthUser> {
  const user = await getUserFromRequest(request);
  
  if (!user) {
    throw new Error('UNAUTHORIZED');
  }

  return user;
}

/**
 * Require specific role for an API route
 */
export async function requireRole(
  request: NextRequest,
  roles: string[]
): Promise<AuthUser> {
  const user = await requireAuth(request);
  
  if (!hasRole(user, roles)) {
    throw new Error('FORBIDDEN');
  }

  return user;
}
