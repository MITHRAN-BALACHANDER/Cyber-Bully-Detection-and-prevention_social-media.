/**
 * Core type definitions for the social platform
 * These types are shared across all modules and define the data contracts
 */

// ===========================================
// USER & AUTH TYPES
// ===========================================

export type UserRole = 'user' | 'creator' | 'recruiter' | 'admin';

export interface IExperience {
  title: string;
  company: string;
  location?: string;
  startDate: Date;
  endDate?: Date;
  current: boolean;
  description?: string;
}

export interface IEducation {
  school: string;
  degree: string;
  field: string;
  startDate: Date;
  endDate?: Date;
  current: boolean;
}

export interface IUser {
  _id: string;
  name: string;
  username: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  headline?: string;
  bio?: string;
  avatar?: string;
  coverImage?: string;
  location?: string;
  website?: string;
  skills: string[];
  experience: IExperience[];
  education: IEducation[];
  isVerified: boolean;
  lastSeen?: Date;
  streak?: {
    currentStreak: number;
    longestStreak: number;
    lastStreakUpdate: Date | null;
  };
  violations?: {
    dailyCount: number;
    totalCount: number;
    lastViolationDate: Date | null;
    consecutiveViolationDays: number;
  };
  accountLock?: {
    isLocked: boolean;
    lockUntil: Date | null;
    lockCount: number;
    lockReason: string | null;
  };
  createdAt: Date;
  updatedAt: Date;
}

// Safe user type without sensitive fields
export type PublicUser = Omit<IUser, 'passwordHash' | 'email'>;
export type AuthUser = Omit<IUser, 'passwordHash'>;

// ===========================================
// CONNECTION / NETWORK TYPES
// ===========================================

export type ConnectionStatus = 'pending' | 'accepted' | 'rejected';

export interface IConnection {
  _id: string;
  requesterId: string;
  recipientId: string;
  status: ConnectionStatus;
  createdAt: Date;
  updatedAt: Date;
}

// ===========================================
// POST TYPES (Twitter + LinkedIn style)
// ===========================================

export type PostType = 'text' | 'image' | 'video' | 'article';
export type PostVisibility = 'public' | 'connections' | 'private';

export interface IComment {
  _id: string;
  authorId: string | PublicUser;
  content: string;
  createdAt: Date;
}

export interface IPost {
  _id: string;
  authorId: string;
  type: PostType;
  content: string;
  // For articles: title and body separated
  title?: string;
  // Media attachments (URLs)
  media: string[];
  visibility: PostVisibility;
  likes: string[]; // User IDs
  comments: IComment[];
  repostOf?: string; // Original post ID if this is a repost
  repostCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// ===========================================
// MEDIA TYPES (Instagram style)
// ===========================================

export type MediaType = 'image' | 'video';

export interface IMedia {
  _id: string;
  ownerId: string;
  url: string;
  thumbnailUrl?: string;
  type: MediaType;
  caption?: string;
  aspectRatio?: number;
  likes: string[];
  comments: IComment[];
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

// ===========================================
// CHAT TYPES (WhatsApp style)
// ===========================================

export type MessageType = 'text' | 'image' | 'file' | 'system';
export type ConversationType = 'direct' | 'group';

export interface IMessage {
  _id: string;
  conversationId: string;
  senderId: string;
  content: string;
  type: MessageType;
  mediaUrl?: string;
  seenBy: string[];
  deletedFor: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IConversation {
  _id: string;
  type: ConversationType;
  participants: (string | PublicUser)[];
  // Group-specific fields
  name?: string;
  avatar?: string;
  adminIds?: string[];
  // Last message preview
  lastMessage?: {
    content: string;
    senderId: string;
    createdAt: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

// ===========================================
// FEED TYPES
// ===========================================

export type FeedItemType = 'post' | 'media' | 'connection';

export interface IFeedItem {
  id: string;
  type: FeedItemType;
  data: IPost | IMedia;
  author: PublicUser;
  createdAt: Date;
}

// Feed item can also be a direct Post or Media for convenience
export type FeedItem = IFeedItem | IPost | IMedia;

// ===========================================
// API RESPONSE TYPES
// ===========================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

// ===========================================
// SOCKET EVENT TYPES
// ===========================================

export interface SocketEvents {
  // Connection events
  'user:online': { userId: string };
  'user:offline': { userId: string };
  
  // Chat events
  'message:new': IMessage;
  'message:seen': { messageId: string; userId: string };
  'typing:start': { conversationId: string; userId: string };
  'typing:stop': { conversationId: string; userId: string };
  
  // Notification events
  'notification:new': {
    type: 'like' | 'comment' | 'connection' | 'message';
    data: unknown;
  };
}

// ===========================================
// JWT PAYLOAD
// ===========================================

export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

// ===========================================
// TYPE ALIASES (for convenience)
// ===========================================

export type User = IUser;
export type Connection = IConnection;
export type Post = IPost;
export type Media = IMedia;
export type Message = IMessage;
export type Conversation = IConversation;
export type Comment = IComment;
export type Experience = IExperience;
export type Education = IEducation;

// ===========================================
// POPULATED/ENRICHED TYPES (with relations)
// ===========================================

export type PopulatedPost = Omit<IPost, 'authorId'> & {
  authorId: PublicUser;
  isLiked?: boolean;
  likeCount?: number;
  commentCount?: number;
};

export type PopulatedMedia = Omit<IMedia, 'ownerId'> & {
  ownerId: PublicUser;
  isLiked?: boolean;
  likeCount?: number;
  commentCount?: number;
};

export type PopulatedConnection = Omit<IConnection, 'requesterId' | 'recipientId'> & {
  requesterId: string | PublicUser;
  recipientId: string | PublicUser;
};
