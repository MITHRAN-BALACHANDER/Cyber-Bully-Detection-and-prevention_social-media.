/**
 * POST /api/auth/register
 * Register a new user account
 */

import { NextRequest } from 'next/server';
import connectDB from '@/lib/db';
import { User } from '@/models';
import { hashPassword, generateToken, setAuthCookie } from '@/lib/auth';
import { validate, registerSchema } from '@/lib/validations';
import { success, error, handleError } from '@/lib/api-response';
import { AuthUser } from '@/types';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const data = validate(registerSchema, body);

    // Check if email already exists
    const existingEmail = await User.findOne({ email: data.email });
    if (existingEmail) {
      return error('Email already registered', 409);
    }

    // Check if username already exists
    const existingUsername = await User.findOne({ username: data.username });
    if (existingUsername) {
      return error('Username already taken', 409);
    }

    // Hash password
    const passwordHash = await hashPassword(data.password);

    // Create user
    const user = await User.create({
      name: data.name,
      username: data.username,
      email: data.email,
      passwordHash,
      role: 'user',
    });

    // Generate JWT token
    const token = generateToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    // Set auth cookie
    await setAuthCookie(token);

    // Return user without sensitive data
    const authUser: AuthUser = {
      _id: user._id.toString(),
      name: user.name,
      username: user.username,
      email: user.email,
      role: user.role,
      skills: user.skills || [],
      experience: user.experience || [],
      education: user.education || [],
      isVerified: user.isVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    return success(authUser, 201);
  } catch (err) {
    return handleError(err);
  }
}
