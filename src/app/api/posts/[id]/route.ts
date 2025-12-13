/**
 * GET /api/posts/[id]
 * Get a single post by ID
 * 
 * DELETE /api/posts/[id]
 * Delete a post (author only)
 */

import { NextRequest } from 'next/server';
import connectDB from '@/lib/db';
import { Post, Connection } from '@/models';
import { getUserFromRequest, requireAuth } from '@/lib/auth';
import { success, notFound, forbidden, handleError } from '@/lib/api-response';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await connectDB();
    const { id } = await params;
    const currentUser = await getUserFromRequest(request);

    const post = await Post.findById(id)
      .populate('authorId', 'name username avatar headline')
      .populate('comments.authorId', 'name username avatar')
      .lean();

    if (!post) {
      return notFound('Post not found');
    }

    // Check visibility permissions
    if (post.visibility !== 'public') {
      if (!currentUser) {
        return forbidden('This post is not public');
      }

      const isAuthor = post.authorId._id.toString() === currentUser._id.toString();
      
      if (!isAuthor && post.visibility === 'private') {
        return forbidden('This post is private');
      }

      if (!isAuthor && post.visibility === 'connections') {
        // Check if current user is connected to author
        const isConnected = await Connection.findOne({
          $or: [
            { requesterId: currentUser._id, recipientId: post.authorId._id, status: 'accepted' },
            { requesterId: post.authorId._id, recipientId: currentUser._id, status: 'accepted' },
          ],
        });

        if (!isConnected) {
          return forbidden('This post is only visible to connections');
        }
      }
    }

    const postWithStatus = {
      ...post,
      isLiked: currentUser
        ? post.likes.some((id) => id.toString() === currentUser._id.toString())
        : false,
      likeCount: post.likes.length,
      commentCount: post.comments.length,
    };

    return success(postWithStatus);
  } catch (err) {
    return handleError(err);
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    await connectDB();
    const { id } = await params;
    const currentUser = await requireAuth(request);

    const post = await Post.findById(id);

    if (!post) {
      return notFound('Post not found');
    }

    // Only author can delete
    if (post.authorId.toString() !== currentUser._id.toString()) {
      // Allow admin to delete any post
      if (currentUser.role !== 'admin') {
        return forbidden('You can only delete your own posts');
      }
    }

    await post.deleteOne();

    return success({ deleted: true });
  } catch (err) {
    return handleError(err);
  }
}
