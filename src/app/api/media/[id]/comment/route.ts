/**
 * POST /api/media/[id]/comment
 * Add comment to media
 */

import { NextRequest } from 'next/server';
import connectDB from '@/lib/db';
import { Media } from '@/models';
import { requireAuth } from '@/lib/auth';
import { validate, commentSchema } from '@/lib/validations';
import { success, notFound, handleError } from '@/lib/api-response';

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

    const media = await Media.findById(id);

    if (!media) {
      return notFound('Media not found');
    }

    const comment = await media.addComment(currentUser._id.toString(), content);

    // Populate author info
    await media.populate('comments.authorId', 'name username avatar');

    const populatedComment = media.comments.find(
      (c) => c._id.toString() === comment._id.toString()
    );

    return success(populatedComment, 201);
  } catch (err) {
    return handleError(err);
  }
}
