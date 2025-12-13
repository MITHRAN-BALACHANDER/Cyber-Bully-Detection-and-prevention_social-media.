/**
 * POST /api/auth/login
 * Authenticate user and create session
 */

import { NextRequest } from 'next/server';
import connectDB from '@/lib/db';
import { User } from '@/models';
import { comparePassword, generateToken, setAuthCookie } from '@/lib/auth';
import { validate, loginSchema } from '@/lib/validations';
import { success, error, handleError } from '@/lib/api-response';
import { AuthUser } from '@/types';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const data = validate(loginSchema, body);

    // Find user by email and include password hash
    const user = await User.findOne({ email: data.email }).select('+passwordHash');

    if (!user) {
      return error('Invalid email or password', 401);
    }

    // Verify password
    const isValidPassword = await comparePassword(data.password, user.passwordHash);

    if (!isValidPassword) {
      return error('Invalid email or password', 401);
    }

    // Update last seen
    user.lastSeen = new Date();
    await user.save();

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
      headline: user.headline,
      bio: user.bio,
      avatar: user.avatar,
      coverImage: user.coverImage,
      location: user.location,
      website: user.website,
      skills: user.skills || [],
      experience: user.experience || [],
      education: user.education || [],
      isVerified: user.isVerified,
      lastSeen: user.lastSeen,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    return success(authUser);
  } catch (err) {
    return handleError(err);
  }
}
