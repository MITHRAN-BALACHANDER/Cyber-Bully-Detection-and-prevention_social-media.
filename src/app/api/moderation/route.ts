/**
 * GET /api/moderation/stats
 * Get content moderation statistics (admin only)
 * 
 * POST /api/moderation/check
 * Check content without posting (for preview)
 */

import { NextRequest } from 'next/server';
import { requireAuth, requireRole } from '@/lib/auth';
import { success, handleError, error } from '@/lib/api-response';
import { 
  moderateContent, 
  getModerationStats,
  ModerationResult 
} from '@/lib/content-moderation';

export const dynamic = 'force-dynamic';

/**
 * GET - Get moderation statistics (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    // Only admins can view moderation stats
    await requireRole(request, ['admin']);
    
    const stats = getModerationStats();
    
    return success({
      statistics: stats,
      description: 'Content moderation statistics from current session',
    });
  } catch (err) {
    return handleError(err);
  }
}

/**
 * POST - Check content for moderation issues (preview before posting)
 */
export async function POST(request: NextRequest) {
  try {
    // Require authentication
    await requireAuth(request);
    
    const body = await request.json();
    const { content } = body;
    
    if (!content || typeof content !== 'string') {
      return error('Content is required', 400);
    }
    
    if (content.length > 10000) {
      return error('Content too long (max 10000 characters)', 400);
    }
    
    // Run moderation check
    const result: ModerationResult = await moderateContent(content);
    
    return success({
      approved: result.approved,
      flagged: result.flagged,
      reasons: result.reasons,
      scores: result.scores,
      sanitizedContent: result.sanitizedContent,
      confidence: result.confidence,
      message: result.approved 
        ? 'Content is safe to post' 
        : 'Content has been flagged and will be rejected',
    });
  } catch (err) {
    return handleError(err);
  }
}
