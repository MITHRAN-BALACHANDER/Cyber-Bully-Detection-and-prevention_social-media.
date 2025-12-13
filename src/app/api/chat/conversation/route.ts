/**
 * POST /api/chat/conversation
 * Create or get a direct conversation
 * 
 * GET /api/chat/conversations
 * Get all conversations for current user
 */

import { NextRequest } from 'next/server';
import connectDB from '@/lib/db';
import { Conversation, User, Message } from '@/models';
import { requireAuth } from '@/lib/auth';
import { validate, createConversationSchema, paginationSchema } from '@/lib/validations';
import { success, paginated, notFound, handleError } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const currentUser = await requireAuth(request);

    const body = await request.json();
    const { participantId } = validate(createConversationSchema, body);

    // Verify participant exists
    const participant = await User.findById(participantId);
    if (!participant) {
      return notFound('User not found');
    }

    // Find or create direct conversation
    // @ts-expect-error - Static method defined in model
    const conversation = await Conversation.findOrCreateDirect(
      currentUser._id.toString(),
      participantId
    );

    // Populate participants
    await conversation.populate('participants', 'name username avatar lastSeen');

    return success(conversation, 201);
  } catch (err) {
    return handleError(err);
  }
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const currentUser = await requireAuth(request);

    const { searchParams } = new URL(request.url);
    const { page = 1, limit = 20 } = validate(paginationSchema, {
      page: searchParams.get('page') || 1,
      limit: searchParams.get('limit') || 20,
    });

    const skip = (page - 1) * limit;

    const [conversations, total] = await Promise.all([
      Conversation.find({
        participants: currentUser._id,
      })
        .populate('participants', 'name username avatar lastSeen')
        .populate('lastMessage.senderId', 'name username')
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Conversation.countDocuments({
        participants: currentUser._id,
      }),
    ]);

    // Add unread count for each conversation
    const conversationsWithUnread = await Promise.all(
      conversations.map(async (conv) => {
        // @ts-expect-error - Static method defined in model
        const unreadCount = await Message.getUnreadCount(
          conv._id.toString(),
          currentUser._id.toString()
        );

        // For direct chats, get the "other" user
        const otherParticipant =
          conv.type === 'direct'
            ? conv.participants.find(
                (p) => p._id.toString() !== currentUser._id.toString()
              )
            : null;

        return {
          ...conv,
          unreadCount,
          otherParticipant,
        };
      })
    );

    return paginated(conversationsWithUnread, { page, limit, total });
  } catch (err) {
    return handleError(err);
  }
}
