/**
 * POST /api/media/upload
 * Upload/register new media
 * 
 * GET /api/media
 * Get media feed with pagination
 */

import { NextRequest } from 'next/server';
import connectDB from '@/lib/db';
import { Media, Connection } from '@/models';
import { requireAuth, getUserFromRequest } from '@/lib/auth';
import { validate, uploadMediaSchema, paginationSchema } from '@/lib/validations';
import { success, paginated, handleError } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const currentUser = await requireAuth(request);

    const body = await request.json();
    const data = validate(uploadMediaSchema, body);

    const media = await Media.create({
      ownerId: currentUser._id,
      ...data,
    });

    // Populate owner info
    await media.populate('ownerId', 'name username avatar');

    return success(media, 201);
  } catch (err) {
    return handleError(err);
  }
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const currentUser = await getUserFromRequest(request);

    const { searchParams } = new URL(request.url);
    const { page = 1, limit = 20 } = validate(paginationSchema, {
      page: searchParams.get('page') || 1,
      limit: searchParams.get('limit') || 20,
    });
    const tag = searchParams.get('tag');

    const skip = (page - 1) * limit;

    // Build filter
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: any = {};

    if (tag) {
      filter.tags = tag.toLowerCase();
    }

    // If logged in, show media from connections too
    if (currentUser) {
      const connectionIds = await Connection.find({
        $or: [
          { requesterId: currentUser._id, status: 'accepted' },
          { recipientId: currentUser._id, status: 'accepted' },
        ],
      }).then((conns) =>
        conns.map((c) =>
          c.requesterId.toString() === currentUser._id.toString()
            ? c.recipientId.toString()
            : c.requesterId.toString()
        )
      );

      // Include own media and connections' media
      filter.ownerId = { $in: [currentUser._id, ...connectionIds] };
    }

    const [media, total] = await Promise.all([
      Media.find(filter)
        .populate('ownerId', 'name username avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Media.countDocuments(filter),
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
