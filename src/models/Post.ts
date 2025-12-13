/**
 * Post Model
 * Handles text posts, image posts, video posts, and articles (Twitter + LinkedIn style)
 */

import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import { IPost, IComment, PostType, PostVisibility } from '@/types';

// Comment sub-document interface
export interface ICommentDocument extends Omit<IComment, '_id' | 'authorId'> {
  _id: Types.ObjectId;
  authorId: Types.ObjectId;
}

// Post document interface
export interface IPostDocument extends Omit<IPost, '_id' | 'authorId' | 'likes' | 'comments' | 'repostOf'>, Document {
  authorId: Types.ObjectId;
  likes: Types.ObjectId[];
  comments: ICommentDocument[];
  repostOf?: Types.ObjectId;
  
  // Methods
  addComment(userId: string, content: string): Promise<ICommentDocument>;
  removeComment(commentId: string): Promise<boolean>;
  toggleLike(userId: string): Promise<boolean>;
}

// Comment sub-schema
const CommentSchema = new Schema<ICommentDocument>(
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
      maxlength: [1000, 'Comment cannot exceed 1000 characters'],
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

// Main Post schema
const PostSchema = new Schema<IPostDocument>(
  {
    authorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Author ID is required'],
      index: true,
    },
    type: {
      type: String,
      enum: ['text', 'image', 'video', 'article'] as PostType[],
      default: 'text',
      index: true,
    },
    content: {
      type: String,
      required: [true, 'Content is required'],
      trim: true,
      maxlength: [10000, 'Content cannot exceed 10000 characters'],
    },
    // Article-specific: separate title
    title: {
      type: String,
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    // Media URLs (images/videos attached to post)
    media: [{
      type: String,
      trim: true,
    }],
    visibility: {
      type: String,
      enum: ['public', 'connections', 'private'] as PostVisibility[],
      default: 'public',
      index: true,
    },
    likes: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
    }],
    comments: [CommentSchema],
    // For reposts/shares
    repostOf: {
      type: Schema.Types.ObjectId,
      ref: 'Post',
    },
    repostCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for efficient queries
PostSchema.index({ authorId: 1, createdAt: -1 });
PostSchema.index({ createdAt: -1 }); // For feed sorting
PostSchema.index({ visibility: 1, createdAt: -1 }); // For feed filtering
PostSchema.index({ content: 'text', title: 'text' }); // Full-text search

// Virtual for like count
PostSchema.virtual('likeCount').get(function () {
  return this.likes?.length || 0;
});

// Virtual for comment count
PostSchema.virtual('commentCount').get(function () {
  return this.comments?.length || 0;
});

/**
 * Check if a user has liked this post
 */
PostSchema.methods.isLikedBy = function (userId: string): boolean {
  return this.likes.some((id: Types.ObjectId) => id.toString() === userId);
};

/**
 * Toggle like on a post
 * Returns true if liked, false if unliked
 */
PostSchema.methods.toggleLike = async function (userId: string): Promise<boolean> {
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
 * Add a comment to the post
 */
PostSchema.methods.addComment = async function (
  authorId: string,
  content: string
): Promise<ICommentDocument> {
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
 * Get posts visible to a user based on their connections
 */
PostSchema.statics.getFeedPosts = async function (
  userId: string,
  connectionIds: string[],
  page: number = 1,
  limit: number = 20
): Promise<IPostDocument[]> {
  const skip = (page - 1) * limit;

  return this.find({
    $or: [
      // Public posts
      { visibility: 'public' },
      // User's own posts
      { authorId: userId },
      // Connection posts visible to connections
      {
        authorId: { $in: connectionIds },
        visibility: { $in: ['public', 'connections'] },
      },
    ],
  })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('authorId', 'name username avatar headline')
    .populate('comments.authorId', 'name username avatar')
    .lean();
};

const Post: Model<IPostDocument> =
  mongoose.models.Post || mongoose.model<IPostDocument>('Post', PostSchema);

export default Post;
