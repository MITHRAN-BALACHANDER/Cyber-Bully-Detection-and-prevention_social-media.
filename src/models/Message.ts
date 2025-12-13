/**
 * Message Model
 * Handles individual messages within conversations
 */

import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import { IMessage, MessageType } from '@/types';

// Document interface
export interface IMessageDocument extends Omit<IMessage, '_id' | 'conversationId' | 'senderId' | 'seenBy' | 'deletedFor'>, Document {
  conversationId: Types.ObjectId;
  senderId: Types.ObjectId;
  seenBy: Types.ObjectId[];
  deletedFor: Types.ObjectId[];
}

const MessageSchema = new Schema<IMessageDocument>(
  {
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: 'Conversation',
      required: [true, 'Conversation ID is required'],
      index: true,
    },
    senderId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Sender ID is required'],
      index: true,
    },
    content: {
      type: String,
      required: [true, 'Message content is required'],
      trim: true,
      maxlength: [5000, 'Message cannot exceed 5000 characters'],
    },
    type: {
      type: String,
      enum: ['text', 'image', 'file', 'system'] as MessageType[],
      default: 'text',
    },
    mediaUrl: {
      type: String,
      trim: true,
    },
    // Array of user IDs who have seen this message
    seenBy: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
    }],
    // Soft delete - array of user IDs for whom this message is deleted
    deletedFor: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
    }],
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient message retrieval
MessageSchema.index({ conversationId: 1, createdAt: -1 });
MessageSchema.index({ conversationId: 1, senderId: 1 });

/**
 * Get messages for a conversation with pagination
 * Excludes messages deleted for the requesting user
 */
MessageSchema.statics.getByConversationId = async function (
  conversationId: string,
  userId: string,
  page: number = 1,
  limit: number = 50
): Promise<IMessageDocument[]> {
  const skip = (page - 1) * limit;

  return this.find({
    conversationId,
    deletedFor: { $ne: userId },
  })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('senderId', 'name username avatar')
    .lean();
};

/**
 * Mark message as seen by a user
 */
MessageSchema.methods.markSeenBy = async function (userId: string): Promise<void> {
  const userObjectId = new Types.ObjectId(userId);
  
  if (!this.seenBy.some((id: Types.ObjectId) => id.toString() === userId)) {
    this.seenBy.push(userObjectId);
    await this.save();
  }
};

/**
 * Mark multiple messages as seen
 */
MessageSchema.statics.markManyAsSeen = async function (
  messageIds: string[],
  userId: string
): Promise<void> {
  await this.updateMany(
    {
      _id: { $in: messageIds },
      seenBy: { $ne: userId },
    },
    {
      $addToSet: { seenBy: userId },
    }
  );
};

/**
 * Soft delete a message for a user
 */
MessageSchema.methods.deleteForUser = async function (userId: string): Promise<void> {
  const userObjectId = new Types.ObjectId(userId);
  
  if (!this.deletedFor.some((id: Types.ObjectId) => id.toString() === userId)) {
    this.deletedFor.push(userObjectId);
    await this.save();
  }
};

/**
 * Get unread count for a user in a conversation
 */
MessageSchema.statics.getUnreadCount = async function (
  conversationId: string,
  userId: string
): Promise<number> {
  return this.countDocuments({
    conversationId,
    senderId: { $ne: userId },
    seenBy: { $ne: userId },
    deletedFor: { $ne: userId },
  });
};

/**
 * Get latest message in a conversation
 */
MessageSchema.statics.getLatest = async function (
  conversationId: string
): Promise<IMessageDocument | null> {
  return this.findOne({ conversationId })
    .sort({ createdAt: -1 })
    .populate('senderId', 'name username')
    .lean();
};

const Message: Model<IMessageDocument> =
  mongoose.models.Message || mongoose.model<IMessageDocument>('Message', MessageSchema);

export default Message;
