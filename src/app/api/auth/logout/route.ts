/**
 * POST /api/auth/logout
 * Clear session and logout user
 */

import { removeAuthCookie } from '@/lib/auth';
import { successMessage, handleError } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    await removeAuthCookie();
    return successMessage('Logged out successfully');
  } catch (err) {
    return handleError(err);
  }
}
