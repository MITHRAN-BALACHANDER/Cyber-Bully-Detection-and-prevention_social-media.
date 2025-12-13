/**
 * POST /api/users/[username]/experience
 * Add experience to user profile
 * 
 * DELETE /api/users/[username]/experience
 * Remove experience from user profile
 */

import { NextRequest } from 'next/server';
import connectDB from '@/lib/db';
import { User } from '@/models';
import { getUserFromRequest } from '@/lib/auth';
import { validate, experienceSchema } from '@/lib/validations';
import { success, notFound, forbidden, error, handleError } from '@/lib/api-response';

interface RouteParams {
  params: Promise<{ username: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    await connectDB();
    const { username } = await params;
    const currentUser = await getUserFromRequest(request);

    if (!currentUser) {
      return forbidden('Authentication required');
    }

    if (currentUser.username !== username.toLowerCase()) {
      return forbidden('You can only update your own profile');
    }

    const body = await request.json();
    const experience = validate(experienceSchema, body);

    const user = await User.findByIdAndUpdate(
      currentUser._id,
      { $push: { experience } },
      { new: true, runValidators: true }
    ).lean();

    if (!user) {
      return notFound('User not found');
    }

    return success(user.experience, 201);
  } catch (err) {
    return handleError(err);
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    await connectDB();
    const { username } = await params;
    const currentUser = await getUserFromRequest(request);

    if (!currentUser) {
      return forbidden('Authentication required');
    }

    if (currentUser.username !== username.toLowerCase()) {
      return forbidden('You can only update your own profile');
    }

    const { searchParams } = new URL(request.url);
    const experienceId = searchParams.get('id');

    if (!experienceId) {
      return error('Experience ID is required', 400);
    }

    const user = await User.findByIdAndUpdate(
      currentUser._id,
      { $pull: { experience: { _id: experienceId } } },
      { new: true }
    ).lean();

    if (!user) {
      return notFound('User not found');
    }

    return success(user.experience);
  } catch (err) {
    return handleError(err);
  }
}
