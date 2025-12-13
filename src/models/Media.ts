/**
 * Media Model
 * Handles Instagram-style media content (images, videos)
 */

import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import { IMedia, IComment, MediaType } from '@/types';

// Comment sub-document (reusing from Post)
export interface IMediaCommentDocument extends Omit<IComment, '_id' | 'authorId'> {
  _id: Types.ObjectId;
  authorId: Types.ObjectId;
}

// Media document interface
export interface IMediaDocument extends Omit<IMedia, '_id' | 'ownerId' | 'likes' | 'comments'>, Document {
  ownerId: Types.ObjectId;
  likes: Types.ObjectId[];
  comments: IMediaCommentDocument[];
  
  // Methods
  addComment(userId: string, content: string): Promise<IMediaCommentDocument>;
  removeComment(commentId: string): Promise<boolean>;
  toggleLike(userId: string): Promise<boolean>;
}

// Comment sub-schema
const MediaCommentSchema = new Schema<IMediaCommentDocument>(
  {
    authorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: [true, 'Comment content is required'],
      trim: true,
      maxlength: [500, 'Comment cannot exceed 500 characters'],
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

// Main Media schema
const MediaSchema = new Schema<IMediaDocument>(
  {
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Owner ID is required'],
      index: true,
    },
    url: {
      type: String,
      required: [true, 'Media URL is required'],
      trim: true,
    },
    thumbnailUrl: {
      type: String,
      trim: true,
    },
    type: {
      type: String,
      enum: ['image', 'video'] as MediaType[],
      default: 'image',
      index: true,
    },
    caption: {
      type: String,
      trim: true,
      maxlength: [2200, 'Caption cannot exceed 2200 characters'],
    },
    // Store aspect ratio for proper rendering in grid
    aspectRatio: {
      type: Number,
      default: 1, // 1:1 square by default
    },
    likes: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
    }],
    comments: [MediaCommentSchema],
    // Hashtags extracted from caption
    tags: [{
      type: String,
      trim: true,
      lowercase: true,
    }],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
MediaSchema.index({ ownerId: 1, createdAt: -1 });
MediaSchema.index({ createdAt: -1 });
MediaSchema.index({ tags: 1 });
MediaSchema.index({ caption: 'text' });

// Virtual for like count
MediaSchema.virtual('likeCount').get(function () {
  return this.likes?.length || 0;
});

// Virtual for comment count
MediaSchema.virtual('commentCount').get(function () {
  return this.comments?.length || 0;
});

/**
 * Check if a user has liked this media
 */
MediaSchema.methods.isLikedBy = function (userId: string): boolean {
  return this.likes.some((id: Types.ObjectId) => id.toString() === userId);
};

/**
 * Toggle like on media
 */
MediaSchema.methods.toggleLike = async function (userId: string): Promise<boolean> {
  const userObjectId = new Types.ObjectId(userId);
  const isLiked = this.isLikedBy(userId);

  if (isLiked) {
    this.likes = this.likes.filter((id: Types.ObjectId) => id.toString() !== userId);
  } else {
    this.likes.push(userObjectId);
  }

  await this.save();
  return !isLiked;
};

/**
 * Add a comment to the media
 */
MediaSchema.methods.addComment = async function (
  authorId: string,
  content: string
): Promise<IMediaCommentDocument> {
  const comment = {
    authorId: new Types.ObjectId(authorId),
    content,
    createdAt: new Date(),
  };

  this.comments.push(comment);
  await this.save();

  return this.comments[this.comments.length - 1];
};

/**
 * Extract hashtags from caption and save to tags
 */
MediaSchema.pre('save', function (next) {
  if (this.isModified('caption') && this.caption) {
    const hashtagRegex = /#(\w+)/g;
    const matches = this.caption.match(hashtagRegex);
    
    if (matches) {
      this.tags = matches.map((tag) => tag.slice(1).toLowerCase());
    }
  }
  next();
});

/**
 * Get media by username with pagination
 */
MediaSchema.statics.getByUsername = async function (
  userId: string,
  page: number = 1,
  limit: number = 12
): Promise<IMediaDocument[]> {
  const skip = (page - 1) * limit;

  return this.find({ ownerId: userId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();
};

/**
 * Get media feed (from followed users)
 */
MediaSchema.statics.getFeed = async function (
  connectionIds: string[],
  page: number = 1,
  limit: number = 20
): Promise<IMediaDocument[]> {
  const skip = (page - 1) * limit;

  return this.find({
    ownerId: { $in: connectionIds },
  })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('ownerId', 'name username avatar')
    .populate('comments.authorId', 'name username avatar')
    .lean();
};

const Media: Model<IMediaDocument> =
  mongoose.models.Media || mongoose.model<IMediaDocument>('Media', MediaSchema);

export default Media;
