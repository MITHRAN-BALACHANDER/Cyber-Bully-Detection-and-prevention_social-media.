/**
 * Conversation Model
 * Handles WhatsApp-style chat conversations (1-1 and group)
 */

import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import { IConversation, ConversationType } from '@/types';

// Document interface
export interface IConversationDocument extends Omit<IConversation, '_id' | 'participants' | 'adminIds' | 'lastMessage'>, Document {
  participants: Types.ObjectId[];
  adminIds?: Types.ObjectId[];
  lastMessage?: {
    content: string;
    senderId: Types.ObjectId;
    createdAt: Date;
  };
  
  // Methods
  hasParticipant(userId: string): boolean;
  addParticipant(userId: string): Promise<boolean>;
  removeParticipant(userId: string): Promise<boolean>;
  updateLastMessage(content: string, senderId: string): Promise<void>;
}

const ConversationSchema = new Schema<IConversationDocument>(
  {
    type: {
      type: String,
      enum: ['direct', 'group'] as ConversationType[],
      default: 'direct',
      index: true,
    },
    participants: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    }],
    // Group chat fields
    name: {
      type: String,
      trim: true,
      maxlength: [100, 'Group name cannot exceed 100 characters'],
    },
    avatar: {
      type: String,
      trim: true,
    },
    adminIds: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
    }],
    // Last message preview for efficient list rendering
    lastMessage: {
      content: { type: String },
      senderId: { type: Schema.Types.ObjectId, ref: 'User' },
      createdAt: { type: Date },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
ConversationSchema.index({ participants: 1 });
ConversationSchema.index({ 'lastMessage.createdAt': -1 });
ConversationSchema.index({ updatedAt: -1 });

/**
 * Find or create a direct conversation between two users
 */
ConversationSchema.statics.findOrCreateDirect = async function (
  userId1: string,
  userId2: string
): Promise<IConversationDocument> {
  // Check if conversation already exists
  const existing = await this.findOne({
    type: 'direct',
    participants: { $all: [userId1, userId2], $size: 2 },
  });

  if (existing) {
    return existing;
  }

  // Create new conversation
  const conversation = await this.create({
    type: 'direct',
    participants: [userId1, userId2],
  });

  return conversation;
};

/**
 * Get all conversations for a user, sorted by last activity
 */
ConversationSchema.statics.getByUserId = async function (
  userId: string,
  page: number = 1,
  limit: number = 20
): Promise<IConversationDocument[]> {
  const skip = (page - 1) * limit;

  return this.find({
    participants: userId,
  })
    .sort({ updatedAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('participants', 'name username avatar lastSeen')
    .populate('lastMessage.senderId', 'name username')
    .lean();
};

/**
 * Update last message in conversation
 */
ConversationSchema.statics.updateLastMessage = async function (
  conversationId: string,
  senderId: string,
  content: string
): Promise<void> {
  await this.findByIdAndUpdate(conversationId, {
    lastMessage: {
      content: content.substring(0, 100), // Truncate for preview
      senderId,
      createdAt: new Date(),
    },
    updatedAt: new Date(),
  });
};

/**
 * Check if user is participant
 */
ConversationSchema.methods.hasParticipant = function (userId: string): boolean {
  return this.participants.some(
    (p: Types.ObjectId) => p.toString() === userId
  );
};

/**
 * Add participant to group
 */
ConversationSchema.methods.addParticipant = async function (
  userId: string
): Promise<boolean> {
  if (this.type !== 'group') {
    throw new Error('Cannot add participants to direct conversations');
  }

  if (this.hasParticipant(userId)) {
    return false;
  }

  this.participants.push(new Types.ObjectId(userId));
  await this.save();
  return true;
};

/**
 * Remove participant from group
 */
ConversationSchema.methods.removeParticipant = async function (
  userId: string
): Promise<boolean> {
  if (this.type !== 'group') {
    throw new Error('Cannot remove participants from direct conversations');
  }

  const index = this.participants.findIndex(
    (p: Types.ObjectId) => p.toString() === userId
  );

  if (index === -1) {
    return false;
  }

  this.participants.splice(index, 1);
  await this.save();
  return true;
};

const Conversation: Model<IConversationDocument> =
  mongoose.models.Conversation || mongoose.model<IConversationDocument>('Conversation', ConversationSchema);

export default Conversation;
