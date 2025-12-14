/**
 * POST /api/posts
 * Create a new post (with content moderation)
 * 
 * GET /api/posts
 * Get posts with pagination (for discovery/public feed)
 */

import { NextRequest } from 'next/server';
import connectDB from '@/lib/db';
import { Post, Connection } from '@/models';
import { requireAuth, getUserFromRequest } from '@/lib/auth';
import { validate, createPostSchema, paginationSchema } from '@/lib/validations';
import { success, paginated, handleError, error } from '@/lib/api-response';
import { moderateContent, logModerationDecision } from '@/lib/content-moderation';
import { checkAccountLock, recordViolation, updateStreak } from '@/lib/violation-tracker';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const currentUser = await requireAuth(request);

    // ========================================
    // CHECK ACCOUNT LOCK STATUS
    // ========================================
    const lockStatus = await checkAccountLock(currentUser.email);
    if (lockStatus.isLocked) {
      const hours = Math.floor(lockStatus.remainingMinutes / 60);
      const minutes = lockStatus.remainingMinutes % 60;
      return error(
        `Your account is temporarily locked due to multiple violations. Time remaining: ${hours}h ${minutes}m`,
        403,
        {
          code: 'ACCOUNT_LOCKED',
          lockUntil: lockStatus.lockUntil,
          remainingMinutes: lockStatus.remainingMinutes,
          reason: lockStatus.lockReason,
        }
      );
    }
    // ========================================

    const body = await request.json();
    const data = validate(createPostSchema, body);

    // ========================================
    // CONTENT MODERATION CHECK
    // ========================================
    if (data.content) {
      const moderationResult = await moderateContent(data.content);
      
      // Log the moderation decision
      logModerationDecision(data.content, moderationResult, {
        userId: currentUser._id.toString(),
      });
      
      // If content is flagged, reject the post and record violation
      if (!moderationResult.approved) {
        // Record violation and potentially lock account
        const violationResult = await recordViolation(currentUser.email, moderationResult);
        
        const errorData: any = {
          code: 'CONTENT_MODERATION_FAILED',
          flaggedCategories: moderationResult.reasons,
          scores: moderationResult.scores,
          dailyViolationCount: violationResult.dailyCount,
          streakReset: violationResult.streakReset,
        };

        // If account was locked, include lock info
        if (violationResult.accountLocked) {
          errorData.accountLocked = true;
          errorData.lockDuration = violationResult.lockDuration;
          errorData.lockUntil = violationResult.lockUntil;
          
          return error(
            `Post rejected. Account locked for ${violationResult.lockDuration} hours due to ${violationResult.dailyCount} violations. Reasons: ${moderationResult.reasons.join(', ')}`,
            403,
            errorData
          );
        }

        return error(
          `Post rejected: ${moderationResult.reasons.join(', ')}. Warning: ${violationResult.dailyCount}/3 violations today.`,
          400,
          errorData
        );
      }
      
      // Content is clean - update streak
      await updateStreak(currentUser.email);
      
      // Use sanitized content if available
      if (moderationResult.sanitizedContent) {
        data.content = moderationResult.sanitizedContent;
      }
    }
    // ========================================

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
