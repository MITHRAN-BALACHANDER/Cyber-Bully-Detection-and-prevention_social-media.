/**
 * GET /api/media/[id]
 * Get single media item
 * 
 * DELETE /api/media/[id]
 * Delete media (owner only)
 */

import { NextRequest } from 'next/server';
import connectDB from '@/lib/db';
import { Media } from '@/models';
import { getUserFromRequest, requireAuth } from '@/lib/auth';
import { success, notFound, forbidden, handleError } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await connectDB();
    const { id } = await params;
    const currentUser = await getUserFromRequest(request);

    const media = await Media.findById(id)
      .populate('ownerId', 'name username avatar')
      .populate('comments.authorId', 'name username avatar')
      .lean();

    if (!media) {
      return notFound('Media not found');
    }

    const mediaWithStatus = {
      ...media,
      isLiked: currentUser
        ? media.likes.some((lid) => lid.toString() === currentUser._id.toString())
        : false,
      likeCount: media.likes.length,
      commentCount: media.comments.length,
    };

    return success(mediaWithStatus);
  } catch (err) {
    return handleError(err);
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    await connectDB();
    const { id } = await params;
    const currentUser = await requireAuth(request);

    const media = await Media.findById(id);

    if (!media) {
      return notFound('Media not found');
    }

    // Only owner can delete
    if (media.ownerId.toString() !== currentUser._id.toString()) {
      if (currentUser.role !== 'admin') {
        return forbidden('You can only delete your own media');
      }
    }

    await media.deleteOne();

    return success({ deleted: true });
  } catch (err) {
    return handleError(err);
  }
}
