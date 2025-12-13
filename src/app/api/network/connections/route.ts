/**
 * GET /api/network/connections
 * Get all connections for the current user
 */

import { NextRequest } from 'next/server';
import connectDB from '@/lib/db';
import { Connection } from '@/models';
import { requireAuth } from '@/lib/auth';
import { validate, paginationSchema } from '@/lib/validations';
import { paginated, handleError } from '@/lib/api-response';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const currentUser = await requireAuth(request);

    const { searchParams } = new URL(request.url);
    const { page = 1, limit = 20 } = validate(paginationSchema, {
      page: searchParams.get('page') || 1,
      limit: searchParams.get('limit') || 20,
    });
    const status = searchParams.get('status') || 'accepted';

    const skip = (page - 1) * limit;

    // Build query based on status
    const query =
      status === 'pending'
        ? {
            // Only show pending requests received by user
            recipientId: currentUser._id,
            status: 'pending',
          }
        : {
            // Show all accepted connections (sent or received)
            $or: [
              { requesterId: currentUser._id, status: 'accepted' },
              { recipientId: currentUser._id, status: 'accepted' },
            ],
          };

    const [connections, total] = await Promise.all([
      Connection.find(query)
        .populate('requesterId', 'name username avatar headline')
        .populate('recipientId', 'name username avatar headline')
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Connection.countDocuments(query),
    ]);

    // Transform connections to show the "other" user
    const transformedConnections = connections.map((conn) => {
      const isRequester = conn.requesterId._id.toString() === currentUser._id.toString();
      const otherUser = isRequester ? conn.recipientId : conn.requesterId;

      return {
        _id: conn._id,
        user: otherUser,
        status: conn.status,
        isRequester,
        createdAt: conn.createdAt,
        updatedAt: conn.updatedAt,
      };
    });

    return paginated(transformedConnections, { page, limit, total });
  } catch (err) {
    return handleError(err);
  }
}
