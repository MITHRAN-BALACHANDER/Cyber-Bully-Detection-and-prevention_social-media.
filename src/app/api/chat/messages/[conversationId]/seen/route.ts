/**
 * POST /api/chat/messages/[conversationId]/seen
 * Mark messages as seen
 */

import { NextRequest } from 'next/server';
import connectDB from '@/lib/db';
import { Conversation, Message } from '@/models';
import { requireAuth } from '@/lib/auth';
import { successMessage, notFound, forbidden, handleError } from '@/lib/api-response';

interface RouteParams {
  params: Promise<{ conversationId: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    await connectDB();
    const { conversationId } = await params;
    const currentUser = await requireAuth(request);

    // Verify conversation exists and user is participant
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return notFound('Conversation not found');
    }

    if (!conversation.hasParticipant(currentUser._id.toString())) {
      return forbidden('You are not part of this conversation');
    }

    // Mark all unread messages as seen
    await Message.updateMany(
      {
        conversationId,
        senderId: { $ne: currentUser._id },
        seenBy: { $ne: currentUser._id },
      },
      {
        $addToSet: { seenBy: currentUser._id },
      }
    );

    return successMessage('Messages marked as seen');
  } catch (err) {
    return handleError(err);
  }
}
