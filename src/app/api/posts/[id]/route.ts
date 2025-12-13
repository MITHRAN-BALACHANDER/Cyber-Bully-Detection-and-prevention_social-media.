/**
 * GET /api/posts/[id]
 * Get a single post by ID
 * 
 * PUT /api/posts/[id]
 * Update a post (author only)
 * 
 * DELETE /api/posts/[id]
 * Delete a post (author only)
 */

import { NextRequest } from 'next/server';
import connectDB from '@/lib/db';
import { Post, Connection } from '@/models';
import { getUserFromRequest, requireAuth } from '@/lib/auth';
import { success, paginated, notFound, forbidden, handleError } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

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

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    await connectDB();
    const { id } = await params;
    const currentUser = await requireAuth(request);

    const post = await Post.findById(id);

    if (!post) {
      return notFound('Post not found');
    }

    // Only author can edit
    if (post.authorId.toString() !== currentUser._id.toString()) {
      return forbidden('You can only edit your own posts');
    }

    const body = await request.json();
    const { content, title, visibility, media } = body;

    // Update fields if provided
    if (content !== undefined) post.content = content;
    if (title !== undefined) post.title = title;
    if (visibility !== undefined) post.visibility = visibility;
    if (media !== undefined) post.media = media;

    await post.save();

    // Populate author info
    await post.populate('authorId', 'name username avatar headline');
    await post.populate('comments.authorId', 'name username avatar');

    const postWithStatus = {
      ...post.toObject(),
      isLiked: post.likes.some((likeId) => likeId.toString() === currentUser._id.toString()),
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
