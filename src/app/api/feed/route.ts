/**
 * GET /api/feed
 * Get unified feed combining posts and media from connections
 * Chronological ordering (V1 - no algorithm ranking)
 */

import { NextRequest } from 'next/server';
import connectDB from '@/lib/db';
import { Post, Media, Connection } from '@/models';
import { requireAuth } from '@/lib/auth';
import { validate, paginationSchema } from '@/lib/validations';
import { paginated, handleError } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

interface FeedItem {
  createdAt: Date | string;
  [key: string]: unknown;
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const currentUser = await requireAuth(request);

    const { searchParams } = new URL(request.url);
    const { page = 1, limit = 20 } = validate(paginationSchema, {
      page: searchParams.get('page') || 1,
      limit: searchParams.get('limit') || 20,
    });
    const filter = searchParams.get('filter'); // 'posts', 'media', or null for all

    // Get user's connections
    const connections = await Connection.find({
      $or: [
        { requesterId: currentUser._id, status: 'accepted' },
        { recipientId: currentUser._id, status: 'accepted' },
      ],
    });

    const connectionIds = connections.map((c) =>
      c.requesterId.toString() === currentUser._id.toString()
        ? c.recipientId.toString()
        : c.requesterId.toString()
    );

    // Include self and connections
    const authorIds = [currentUser._id.toString(), ...connectionIds];

    const feedItems: FeedItem[] = [];

    // Fetch posts if no filter or filter is 'posts'
    if (!filter || filter === 'posts') {
      const posts = await Post.find({
        $or: [
          // Public posts from anyone
          { visibility: 'public' },
          // Own posts (any visibility)
          { authorId: currentUser._id },
          // Connection posts with public or connections visibility
          {
            authorId: { $in: connectionIds },
            visibility: { $in: ['public', 'connections'] },
          },
        ],
      })
        .populate('authorId', 'name username avatar headline')
        .populate('comments.authorId', 'name username avatar')
        .sort({ createdAt: -1 })
        .limit(limit * 2) // Get more to merge with media
        .lean();

      posts.forEach((post) => {
        feedItems.push({
          ...post,
          _id: post._id.toString(),
          isLiked: post.likes.some(
            (id) => id.toString() === currentUser._id.toString()
          ),
          likeCount: post.likes.length,
          commentCount: post.comments.length,
          author: post.authorId,
        });
      });
    }

    // Fetch media if no filter or filter is 'media'
    if (!filter || filter === 'media') {
      const media = await Media.find({
        ownerId: { $in: authorIds },
      })
        .populate('ownerId', 'name username avatar')
        .sort({ createdAt: -1 })
        .limit(limit * 2)
        .lean();

      media.forEach((m) => {
        feedItems.push({
          ...m,
          _id: m._id.toString(),
          isLiked: m.likes.some(
            (id) => id.toString() === currentUser._id.toString()
          ),
          likeCount: m.likes.length,
          commentCount: m.comments.length,
          author: m.ownerId,
        });
      });
    }

    // Sort by createdAt (chronological, newest first)
    feedItems.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // Paginate the combined feed
    const skip = (page - 1) * limit;
    const paginatedItems = feedItems.slice(skip, skip + limit);
    const total = feedItems.length;

    return paginated(paginatedItems, { page, limit, total });
  } catch (err) {
    return handleError(err);
  }
}
