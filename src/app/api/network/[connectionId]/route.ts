/**
 * DELETE /api/network/[connectionId]
 * Remove a connection
 */

import { NextRequest } from 'next/server';
import connectDB from '@/lib/db';
import { Connection } from '@/models';
import { requireAuth } from '@/lib/auth';
import { successMessage, notFound, forbidden, handleError } from '@/lib/api-response';

interface RouteParams {
  params: Promise<{ connectionId: string }>;
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    await connectDB();
    const currentUser = await requireAuth(request);
    const { connectionId } = await params;

    const connection = await Connection.findById(connectionId);

    if (!connection) {
      return notFound('Connection not found');
    }

    // Verify user is part of this connection
    const isParticipant =
      connection.requesterId.toString() === currentUser._id.toString() ||
      connection.recipientId.toString() === currentUser._id.toString();

    if (!isParticipant) {
      return forbidden('You are not part of this connection');
    }

    await connection.deleteOne();

    return successMessage('Connection removed');
  } catch (err) {
    return handleError(err);
  }
}
