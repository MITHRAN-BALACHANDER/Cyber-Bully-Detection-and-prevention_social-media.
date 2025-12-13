/**
 * POST /api/posts/[id]/comment
 * Add a comment to a post
 * 
 * GET /api/posts/[id]/comment
 * Get comments for a post
 */

import { NextRequest } from 'next/server';
import connectDB from '@/lib/db';
import { Post } from '@/models';
import { requireAuth, getUserFromRequest } from '@/lib/auth';
import { validate, commentSchema, paginationSchema } from '@/lib/validations';
import { success, notFound, paginated, handleError } from '@/lib/api-response';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    await connectDB();
    const { id } = await params;
    const currentUser = await requireAuth(request);

    const body = await request.json();
    const { content } = validate(commentSchema, body);

    const post = await Post.findById(id);

    if (!post) {
      return notFound('Post not found');
    }

    const comment = await post.addComment(currentUser._id.toString(), content);

    // Populate author info for the new comment
    await post.populate('comments.authorId', 'name username avatar');

    const populatedComment = post.comments.find(
      (c) => c._id.toString() === comment._id.toString()
    );

    return success(populatedComment, 201);
  } catch (err) {
    return handleError(err);
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await connectDB();
    const { id } = await params;
    await getUserFromRequest(request);

    const { searchParams } = new URL(request.url);
    const { page = 1, limit = 20 } = validate(paginationSchema, {
      page: searchParams.get('page') || 1,
      limit: searchParams.get('limit') || 20,
    });

    const post = await Post.findById(id)
      .populate('comments.authorId', 'name username avatar')
      .lean();

    if (!post) {
      return notFound('Post not found');
    }

    // Paginate comments (newest first)
    const sortedComments = [...post.comments].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    const skip = (page - 1) * limit;
    const paginatedComments = sortedComments.slice(skip, skip + limit);

    return paginated(paginatedComments, {
      page,
      limit,
      total: post.comments.length,
    });
  } catch (err) {
    return handleError(err);
  }
}
