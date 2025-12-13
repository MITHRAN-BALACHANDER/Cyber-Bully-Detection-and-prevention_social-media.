/**
 * PostCard Component
 * Displays a single post (Twitter/LinkedIn style)
 */

'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Heart,
  MessageCircle,
  Share2,
  MoreHorizontal,
  Globe,
  Users,
  Lock,
} from 'lucide-react';
import { Avatar, Card, Button } from '@/components/ui';
import { cn, formatRelativeTime, formatCount } from '@/lib/utils';
import type { PopulatedPost, PublicUser } from '@/types';

interface PostCardProps {
  post: PopulatedPost;
  onLike?: (postId: string) => void;
  onComment?: (postId: string) => void;
  onShare?: (postId: string) => void;
}

const visibilityIcons = {
  public: Globe,
  connections: Users,
  private: Lock,
};

export function PostCard({ post, onLike, onComment, onShare }: PostCardProps) {
  const [isLiked, setIsLiked] = useState(post.isLiked || false);
  const [likeCount, setLikeCount] = useState(post.likeCount || post.likes.length);
  const [showComments, setShowComments] = useState(false);

  const author = post.authorId as PublicUser;
  const VisibilityIcon = visibilityIcons[post.visibility];

  const handleLike = async () => {
    setIsLiked(!isLiked);
    setLikeCount(isLiked ? likeCount - 1 : likeCount + 1);
    onLike?.(post._id);
  };

  return (
    <Card className="mb-4">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <Link
          href={`/profile/${author.username}`}
          className="flex items-center gap-3 group"
        >
          <Avatar
            src={author.avatar}
            name={author.name}
            size="md"
            className="group-hover:ring-2 ring-primary-200 transition-all"
          />
          <div>
            <p className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
              {author.name}
            </p>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              {author.headline && (
                <span className="truncate max-w-[200px]">{author.headline}</span>
              )}
              <span>·</span>
              <span>{formatRelativeTime(post.createdAt)}</span>
              <VisibilityIcon className="w-3.5 h-3.5" />
            </div>
          </div>
        </Link>
        <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <MoreHorizontal className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {/* Article Title */}
      {post.type === 'article' && post.title && (
        <h2 className="text-xl font-bold text-gray-900 mb-2">{post.title}</h2>
      )}

      {/* Content */}
      <div className="mb-3">
        <p className="text-gray-800 whitespace-pre-wrap">{post.content}</p>
      </div>

      {/* Media */}
      {post.media && post.media.length > 0 && (
        <div
          className={cn(
            'mb-3 rounded-lg overflow-hidden',
            post.media.length === 1 && 'aspect-video',
            post.media.length > 1 && 'grid gap-1',
            post.media.length === 2 && 'grid-cols-2',
            post.media.length >= 3 && 'grid-cols-2 grid-rows-2'
          )}
        >
          {post.media.slice(0, 4).map((url, index) => (
            <div
              key={index}
              className={cn(
                'relative bg-gray-100',
                post.media.length === 1 && 'w-full h-full',
                post.media.length > 1 && 'aspect-square',
                post.media.length === 3 && index === 0 && 'row-span-2'
              )}
            >
              <Image
                src={url}
                alt={`Post media ${index + 1}`}
                fill
                className="object-cover"
              />
              {index === 3 && post.media.length > 4 && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <span className="text-white text-xl font-bold">
                    +{post.media.length - 4}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Stats */}
      <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
        <div className="flex items-center gap-1">
          {likeCount > 0 && (
            <span>
              {formatCount(likeCount)} {likeCount === 1 ? 'like' : 'likes'}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {(post.commentCount || post.comments.length) > 0 && (
            <button
              onClick={() => setShowComments(!showComments)}
              className="hover:underline"
            >
              {formatCount(post.commentCount || post.comments.length)} comments
            </button>
          )}
          {post.repostCount > 0 && (
            <span>{formatCount(post.repostCount)} reposts</span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between border-t border-surface-border pt-3">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleLike}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg transition-colors',
            isLiked
              ? 'text-red-500 hover:bg-red-50'
              : 'text-gray-600 hover:bg-gray-100'
          )}
        >
          <Heart
            className={cn('w-5 h-5', isLiked && 'fill-current')}
          />
          <span className="text-sm font-medium">Like</span>
        </motion.button>

        <button
          onClick={() => {
            setShowComments(!showComments);
            onComment?.(post._id);
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <MessageCircle className="w-5 h-5" />
          <span className="text-sm font-medium">Comment</span>
        </button>

        <button
          onClick={() => onShare?.(post._id)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <Share2 className="w-5 h-5" />
          <span className="text-sm font-medium">Share</span>
        </button>
      </div>

      {/* Comments Section (expandable) */}
      {showComments && post.comments.length > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="border-t border-surface-border pt-3 mt-3"
        >
          {post.comments.slice(0, 3).map((comment) => (
            <div key={comment._id} className="flex gap-3 mb-3">
              <Avatar
                src={(comment.authorId as unknown as PublicUser)?.avatar}
                name={(comment.authorId as unknown as PublicUser)?.name || 'User'}
                size="sm"
              />
              <div className="flex-1 bg-gray-50 rounded-lg px-3 py-2">
                <p className="font-medium text-sm text-gray-900">
                  {(comment.authorId as unknown as PublicUser)?.name}
                </p>
                <p className="text-sm text-gray-700">{comment.content}</p>
              </div>
            </div>
          ))}
        </motion.div>
      )}
    </Card>
  );
}

export default PostCard;
