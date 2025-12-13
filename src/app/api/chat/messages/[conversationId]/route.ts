/**
 * GET /api/chat/messages/[conversationId]
 * Get messages for a conversation
 * 
 * POST /api/chat/messages/[conversationId]
 * Send a message to a conversation
 */

import { NextRequest } from 'next/server';
import connectDB from '@/lib/db';
import { Conversation, Message } from '@/models';
import { requireAuth } from '@/lib/auth';
import { validate, sendMessageSchema, paginationSchema } from '@/lib/validations';
import { success, paginated, notFound, forbidden, handleError } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ conversationId: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
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

    const { searchParams } = new URL(request.url);
    const { page = 1, limit = 50 } = validate(paginationSchema, {
      page: searchParams.get('page') || 1,
      limit: searchParams.get('limit') || 50,
    });

    const skip = (page - 1) * limit;

    const [messages, total] = await Promise.all([
      Message.find({
        conversationId,
        deletedFor: { $ne: currentUser._id },
      })
        .populate('senderId', 'name username avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Message.countDocuments({
        conversationId,
        deletedFor: { $ne: currentUser._id },
      }),
    ]);

    // Reverse to get chronological order
    messages.reverse();

    return paginated(messages, { page, limit, total });
  } catch (err) {
    return handleError(err);
  }
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

    const body = await request.json();
    const data = validate(sendMessageSchema, body);

    // Create message
    const message = await Message.create({
      conversationId,
      senderId: currentUser._id,
      content: data.content,
      type: data.type,
      mediaUrl: data.mediaUrl,
      seenBy: [currentUser._id], // Sender has seen their own message
    });

    // Update conversation's last message
    // @ts-expect-error - Static method defined in model
    await Conversation.updateLastMessage(
      conversationId,
      currentUser._id.toString(),
      data.content
    );

    // Populate sender info
    await message.populate('senderId', 'name username avatar');

    return success(message, 201);
  } catch (err) {
    return handleError(err);
  }
}
