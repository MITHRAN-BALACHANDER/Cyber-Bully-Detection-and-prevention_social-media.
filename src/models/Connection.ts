/**
 * Connection Model
 * Handles professional network connections (LinkedIn-style)
 */

import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import { IConnection, ConnectionStatus } from '@/types';

export interface IConnectionDocument extends Omit<IConnection, '_id' | 'requesterId' | 'recipientId'>, Document {
  requesterId: Types.ObjectId;
  recipientId: Types.ObjectId;
}

const ConnectionSchema = new Schema<IConnectionDocument>(
  {
    requesterId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Requester ID is required'],
      index: true,
    },
    recipientId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Recipient ID is required'],
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'] as ConnectionStatus[],
      default: 'pending',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure unique connection pairs
// Also prevents duplicate connection requests
ConnectionSchema.index(
  { requesterId: 1, recipientId: 1 },
  { unique: true }
);

// Index for finding all connections for a user
ConnectionSchema.index({ requesterId: 1, status: 1 });
ConnectionSchema.index({ recipientId: 1, status: 1 });

/**
 * Check if a connection exists between two users (in either direction)
 */
ConnectionSchema.statics.findConnection = async function (
  userId1: string,
  userId2: string
): Promise<IConnectionDocument | null> {
  return this.findOne({
    $or: [
      { requesterId: userId1, recipientId: userId2 },
      { requesterId: userId2, recipientId: userId1 },
    ],
  });
};

/**
 * Check if two users are connected (accepted status)
 */
ConnectionSchema.statics.areConnected = async function (
  userId1: string,
  userId2: string
): Promise<boolean> {
  const connection = await this.findOne({
    $or: [
      { requesterId: userId1, recipientId: userId2 },
      { requesterId: userId2, recipientId: userId1 },
    ],
    status: 'accepted',
  });
  return !!connection;
};

/**
 * Get all connection IDs for a user (accepted connections only)
 */
ConnectionSchema.statics.getConnectionIds = async function (
  userId: string
): Promise<string[]> {
  const connections = await this.find({
    $or: [
      { requesterId: userId, status: 'accepted' },
      { recipientId: userId, status: 'accepted' },
    ],
  }).lean();

  return connections.map((conn: any) =>
    conn.requesterId.toString() === userId
      ? conn.recipientId.toString()
      : conn.requesterId.toString()
  );
};

/**
 * Get pending requests received by a user
 */
ConnectionSchema.statics.getPendingRequests = async function (
  userId: string
): Promise<IConnectionDocument[]> {
  return this.find({
    recipientId: userId,
    status: 'pending',
  }).populate('requesterId', 'name username avatar headline');
};

const Connection: Model<IConnectionDocument> =
  mongoose.models.Connection || mongoose.model<IConnectionDocument>('Connection', ConnectionSchema);

export default Connection;
