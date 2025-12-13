/**
 * POST /api/chat/group
 * Create a group conversation
 */

import { NextRequest } from 'next/server';
import connectDB from '@/lib/db';
import { Conversation, User } from '@/models';
import { requireAuth } from '@/lib/auth';
import { validate, createGroupSchema } from '@/lib/validations';
import { success, error, handleError } from '@/lib/api-response';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const currentUser = await requireAuth(request);

    const body = await request.json();
    const { name, participantIds, avatar } = validate(createGroupSchema, body);

    // Verify all participants exist
    const participants = await User.find({
      _id: { $in: participantIds },
    });

    if (participants.length !== participantIds.length) {
      return error('One or more participants not found', 400);
    }

    // Create group conversation
    const conversation = await Conversation.create({
      type: 'group',
      name,
      avatar,
      participants: [currentUser._id, ...participantIds],
      adminIds: [currentUser._id], // Creator is admin
    });

    // Populate participants
    await conversation.populate('participants', 'name username avatar lastSeen');

    return success(conversation, 201);
  } catch (err) {
    return handleError(err);
  }
}
