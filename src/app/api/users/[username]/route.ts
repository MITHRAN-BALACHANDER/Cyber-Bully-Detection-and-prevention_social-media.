/**
 * GET /api/users/[username]
 * Get user profile by username
 * 
 * PATCH /api/users/[username]
 * Update user profile (own profile only)
 */

import { NextRequest } from 'next/server';
import connectDB from '@/lib/db';
import { User, Connection } from '@/models';
import { getUserFromRequest } from '@/lib/auth';
import { validate, updateProfileSchema } from '@/lib/validations';
import { success, notFound, forbidden, handleError } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ username: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await connectDB();
    const { username } = await params;
    const currentUser = await getUserFromRequest(request);

    const user = await User.findOne({ username: username.toLowerCase() }).lean();

    if (!user) {
      return notFound('User not found');
    }

    // Remove sensitive fields
    const { passwordHash, ...publicUser } = user as typeof user & { passwordHash?: string };

    // If viewing own profile, include email
    if (currentUser && currentUser._id.toString() === publicUser._id.toString()) {
      return success(publicUser);
    }

    // For other users, remove email
    const { email, ...safeUser } = publicUser;

    // Add connection status if logged in
    let connectionStatus = null;
    if (currentUser) {
      const connection = await Connection.findOne({
        $or: [
          { requesterId: currentUser._id, recipientId: user._id },
          { requesterId: user._id, recipientId: currentUser._id },
        ],
      });

      if (connection) {
        connectionStatus = {
          status: connection.status,
          isRequester: connection.requesterId.toString() === currentUser._id.toString(),
        };
      }
    }

    return success({
      ...safeUser,
      connectionStatus,
    });
  } catch (err) {
    return handleError(err);
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    await connectDB();
    const { username } = await params;
    const currentUser = await getUserFromRequest(request);

    if (!currentUser) {
      return forbidden('Authentication required');
    }

    // Check if user is updating their own profile
    if (currentUser.username !== username.toLowerCase()) {
      return forbidden('You can only update your own profile');
    }

    const body = await request.json();
    const data = validate(updateProfileSchema, body);

    const updatedUser = await User.findByIdAndUpdate(
      currentUser._id,
      { $set: data },
      { new: true, runValidators: true }
    ).lean();

    if (!updatedUser) {
      return notFound('User not found');
    }

    const { passwordHash, ...publicUser } = updatedUser as typeof updatedUser & { passwordHash?: string };

    return success(publicUser);
  } catch (err) {
    return handleError(err);
  }
}
