/**
 * GET /api/users
 * Search users with pagination
 */

import { NextRequest } from 'next/server';
import connectDB from '@/lib/db';
import { User } from '@/models';
import { validate, paginationSchema } from '@/lib/validations';
import { paginated, handleError } from '@/lib/api-response';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const { page = 1, limit = 20 } = validate(paginationSchema, {
      page: searchParams.get('page') || 1,
      limit: searchParams.get('limit') || 20,
    });
    const query = searchParams.get('q') || '';

    // Build search filter
    const filter = query
      ? {
          $or: [
            { name: { $regex: query, $options: 'i' } },
            { username: { $regex: query, $options: 'i' } },
            { headline: { $regex: query, $options: 'i' } },
          ],
        }
      : {};

    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      User.find(filter)
        .select('name username avatar headline location')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(filter),
    ]);

    return paginated(users, { page, limit, total });
  } catch (err) {
    return handleError(err);
  }
}
