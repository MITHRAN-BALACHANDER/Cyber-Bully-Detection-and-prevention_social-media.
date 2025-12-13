/**
 * POST /api/network/connect
 * Send a connection request to another user
 */

import { NextRequest } from 'next/server';
import { Types } from 'mongoose';
import connectDB from '@/lib/db';
import { Connection, User } from '@/models';
import { requireAuth } from '@/lib/auth';
import { validate, connectionRequestSchema } from '@/lib/validations';
import { success, error, notFound, handleError } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const currentUser = await requireAuth(request);

    const body = await request.json();
    const { recipientId } = validate(connectionRequestSchema, body);

    // Prevent self-connection
    if (recipientId === currentUser._id.toString()) {
      return error('You cannot connect with yourself', 400);
    }

    // Check if recipient exists
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return notFound('User not found');
    }

    // Check if connection already exists (in either direction)
    const recipientObjectId = new Types.ObjectId(recipientId);
    const existingConnection = await Connection.findOne({
      $or: [
        { requesterId: currentUser._id, recipientId: recipientObjectId },
        { requesterId: recipientObjectId, recipientId: currentUser._id },
      ],
    });

    if (existingConnection) {
      if (existingConnection.status === 'accepted') {
        return error('You are already connected', 400);
      }
      if (existingConnection.status === 'pending') {
        return error('Connection request already pending', 400);
      }
      if (existingConnection.status === 'rejected') {
        // Allow re-requesting after rejection
        existingConnection.status = 'pending';
        existingConnection.requesterId = new Types.ObjectId(currentUser._id);
        existingConnection.recipientId = recipientObjectId;
        await existingConnection.save();
        return success(existingConnection, 201);
      }
    }

    // Create new connection request
    const connection = await Connection.create({
      requesterId: new Types.ObjectId(currentUser._id),
      recipientId: recipientObjectId,
      status: 'pending',
    });

    return success(connection, 201);
  } catch (err) {
    return handleError(err);
  }
}
