/**
 * GET /api/media/user/[username]
 * Get media grid for a user's profile
 */

import { NextRequest } from 'next/server';
import connectDB from '@/lib/db';
import { Media, User } from '@/models';
import { getUserFromRequest } from '@/lib/auth';
import { validate, paginationSchema } from '@/lib/validations';
import { paginated, notFound, handleError } from '@/lib/api-response';

interface RouteParams {
  params: Promise<{ username: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await connectDB();
    const { username } = await params;
    const currentUser = await getUserFromRequest(request);

    // Find user by username
    const user = await User.findOne({ username: username.toLowerCase() });

    if (!user) {
      return notFound('User not found');
    }

    const { searchParams } = new URL(request.url);
    const { page = 1, limit = 20 } = validate(paginationSchema, {
      page: searchParams.get('page') || 1,
      limit: searchParams.get('limit') || 12, // 12 for grid (3x4)
    });

    const skip = (page - 1) * limit;

    const [media, total] = await Promise.all([
      Media.find({ ownerId: user._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Media.countDocuments({ ownerId: user._id }),
    ]);

    // Add isLiked flag for current user
    const mediaWithStatus = media.map((m) => ({
      ...m,
      isLiked: currentUser
        ? m.likes.some((id) => id.toString() === currentUser._id.toString())
        : false,
      likeCount: m.likes.length,
      commentCount: m.comments.length,
    }));

    return paginated(mediaWithStatus, { page, limit, total });
  } catch (err) {
    return handleError(err);
  }
}
