/**
 * POST /api/network/accept
 * Accept or reject a connection request
 */

import { NextRequest } from 'next/server';
import connectDB from '@/lib/db';
import { Connection } from '@/models';
import { requireAuth } from '@/lib/auth';
import { validate, connectionResponseSchema } from '@/lib/validations';
import { success, notFound, forbidden, handleError } from '@/lib/api-response';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const currentUser = await requireAuth(request);

    const body = await request.json();
    const { connectionId, action } = validate(connectionResponseSchema, body);

    // Find the connection request
    const connection = await Connection.findById(connectionId);

    if (!connection) {
      return notFound('Connection request not found');
    }

    // Verify the current user is the recipient
    if (connection.recipientId.toString() !== currentUser._id.toString()) {
      return forbidden('You can only respond to requests sent to you');
    }

    // Verify the connection is pending
    if (connection.status !== 'pending') {
      return forbidden('This request has already been processed');
    }

    // Update connection status
    connection.status = action === 'accept' ? 'accepted' : 'rejected';
    await connection.save();

    // Populate user info for response
    await connection.populate([
      { path: 'requesterId', select: 'name username avatar headline' },
      { path: 'recipientId', select: 'name username avatar headline' },
    ]);

    return success(connection);
  } catch (err) {
    return handleError(err);
  }
}
