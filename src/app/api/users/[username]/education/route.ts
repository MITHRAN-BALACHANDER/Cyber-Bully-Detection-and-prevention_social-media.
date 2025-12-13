/**
 * POST /api/users/[username]/education
 * Add education to user profile
 * 
 * DELETE /api/users/[username]/education
 * Remove education from user profile
 */

import { NextRequest } from 'next/server';
import connectDB from '@/lib/db';
import { User } from '@/models';
import { getUserFromRequest } from '@/lib/auth';
import { validate, educationSchema } from '@/lib/validations';
import { success, notFound, forbidden, error, handleError } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

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
    const education = validate(educationSchema, body);

    const user = await User.findByIdAndUpdate(
      currentUser._id,
      { $push: { education } },
      { new: true, runValidators: true }
    ).lean();

    if (!user) {
      return notFound('User not found');
    }

    return success(user.education, 201);
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
    const educationId = searchParams.get('id');

    if (!educationId) {
      return error('Education ID is required', 400);
    }

    const user = await User.findByIdAndUpdate(
      currentUser._id,
      { $pull: { education: { _id: educationId } } },
      { new: true }
    ).lean();

    if (!user) {
      return notFound('User not found');
    }

    return success(user.education);
  } catch (err) {
    return handleError(err);
  }
}
