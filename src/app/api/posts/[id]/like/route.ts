/**
 * POST /api/posts/[id]/like
 * Toggle like on a post
 */

import { NextRequest } from 'next/server';
import connectDB from '@/lib/db';
import { Post } from '@/models';
import { requireAuth } from '@/lib/auth';
import { success, notFound, handleError } from '@/lib/api-response';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    await connectDB();
    const { id } = await params;
    const currentUser = await requireAuth(request);

    const post = await Post.findById(id);

    if (!post) {
      return notFound('Post not found');
    }

    const isLiked = await post.toggleLike(currentUser._id.toString());

    return success({
      isLiked,
      likeCount: post.likes.length,
    });
  } catch (err) {
    return handleError(err);
  }
}
