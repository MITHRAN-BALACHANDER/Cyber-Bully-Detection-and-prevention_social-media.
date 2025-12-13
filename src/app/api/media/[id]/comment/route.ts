/**
 * POST /api/media/[id]/comment
 * Add comment to media (with content moderation)
 */

import { NextRequest } from 'next/server';
import connectDB from '@/lib/db';
import { Media } from '@/models';
import { requireAuth } from '@/lib/auth';
import { validate, commentSchema } from '@/lib/validations';
import { success, notFound, handleError, error } from '@/lib/api-response';
import { moderateContent, logModerationDecision } from '@/lib/content-moderation';

export const dynamic = 'force-dynamic';

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

    // ========================================
    // CONTENT MODERATION CHECK
    // ========================================
    const moderationResult = await moderateContent(content);
    
    // Log the moderation decision
    logModerationDecision(content, moderationResult, {
      userId: currentUser._id.toString(),
      postId: id,
    });
    
    // If content is flagged, reject the comment
    if (!moderationResult.approved) {
      return error(
        `Comment rejected: ${moderationResult.reasons.join(', ')}`,
        400,
        {
          code: 'CONTENT_MODERATION_FAILED',
          flaggedCategories: moderationResult.reasons,
          scores: moderationResult.scores,
        }
      );
    }
    // ========================================

    const media = await Media.findById(id);

    if (!media) {
      return notFound('Media not found');
    }

    // Use sanitized content if available (profanity masked)
    const finalContent = moderationResult.sanitizedContent || content;
    const comment = await media.addComment(currentUser._id.toString(), finalContent);

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
