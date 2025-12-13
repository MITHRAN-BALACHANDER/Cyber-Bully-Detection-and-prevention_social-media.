/**
 * GET /api/auth/me
 * Get current authenticated user
 */

import { NextRequest } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { success, unauthorized, handleError } from '@/lib/api-response';

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);

    if (!user) {
      return unauthorized('Not authenticated');
    }

    return success(user);
  } catch (err) {
    return handleError(err);
  }
}
