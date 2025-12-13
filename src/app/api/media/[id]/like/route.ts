/**
 * POST /api/media/[id]/like
 * Toggle like on media
 */

import { NextRequest } from 'next/server';
import connectDB from '@/lib/db';
import { Media } from '@/models';
import { requireAuth } from '@/lib/auth';
import { success, notFound, handleError } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    await connectDB();
    const { id } = await params;
    const currentUser = await requireAuth(request);

    const media = await Media.findById(id);

    if (!media) {
      return notFound('Media not found');
    }

    const isLiked = await media.toggleLike(currentUser._id.toString());

    return success({
      isLiked,
      likeCount: media.likes.length,
    });
  } catch (err) {
    return handleError(err);
  }
}
