/**
 * POST /api/posts
 * Create a new post
 * 
 * GET /api/posts
 * Get posts with pagination (for discovery/public feed)
 */

import { NextRequest } from 'next/server';
import connectDB from '@/lib/db';
import { Post, Connection } from '@/models';
import { requireAuth, getUserFromRequest } from '@/lib/auth';
import { validate, createPostSchema, paginationSchema } from '@/lib/validations';
import { success, paginated, handleError } from '@/lib/api-response';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const currentUser = await requireAuth(request);

    const body = await request.json();
    const data = validate(createPostSchema, body);

    const post = await Post.create({
      authorId: currentUser._id,
      ...data,
    });

    // Populate author info
    await post.populate('authorId', 'name username avatar headline');

    return success(post, 201);
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
    const authorId = searchParams.get('author');
    const type = searchParams.get('type');

    const skip = (page - 1) * limit;

    // Build query filter
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: any = {};

    if (authorId) {
      filter.authorId = authorId;
    }

    if (type) {
      filter.type = type;
    }

    // If not logged in, only show public posts
    if (!currentUser) {
      filter.visibility = 'public';
    } else {
      // Get user's connections for visibility filtering
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

      // Show: public posts, own posts, and connection posts with connections visibility
      filter.$or = [
        { visibility: 'public' },
        { authorId: currentUser._id },
        {
          authorId: { $in: connectionIds },
          visibility: { $in: ['public', 'connections'] },
        },
      ];
    }

    const [posts, total] = await Promise.all([
      Post.find(filter)
        .populate('authorId', 'name username avatar headline')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Post.countDocuments(filter),
    ]);

    // Add isLiked flag for current user
    const postsWithLikeStatus = posts.map((post) => ({
      ...post,
      isLiked: currentUser
        ? post.likes.some((id) => id.toString() === currentUser._id.toString())
        : false,
      likeCount: post.likes.length,
      commentCount: post.comments.length,
    }));

    return paginated(postsWithLikeStatus, { page, limit, total });
  } catch (err) {
    return handleError(err);
  }
}
