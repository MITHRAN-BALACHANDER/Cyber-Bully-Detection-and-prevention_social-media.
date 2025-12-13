/**
 * PostCard Component
 * Displays a single post (Twitter/LinkedIn style)
 */

'use client';

import { useState, useEffect, useRef } from 'react';
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
  Edit2,
  Trash2,
  X,
  Check,
} from 'lucide-react';
import { Avatar, Card, Button, Textarea } from '@/components/ui';
import { cn, formatRelativeTime, formatCount } from '@/lib/utils';
import type { PopulatedPost, PublicUser } from '@/types';
import CommentSection from './CommentSection';
import { useAuthStore } from '@/store';

interface PostCardProps {
  post: PopulatedPost;
  onLike?: (postId: string) => void;
  onComment?: (postId: string) => void;
  onShare?: (postId: string) => void;
  onAddComment?: (postId: string, content: string) => Promise<void>;
  onEdit?: (postId: string, updatedPost: PopulatedPost) => void;
  onDelete?: (postId: string) => void;
}

const visibilityIcons = {
  public: Globe,
  connections: Users,
  private: Lock,
};

export function PostCard({ post, onLike, onComment, onShare, onAddComment, onEdit, onDelete }: PostCardProps) {
  const { user } = useAuthStore();
  const [isLiked, setIsLiked] = useState(post.isLiked || false);
  const [likeCount, setLikeCount] = useState(post.likeCount ?? post.likes?.length ?? 0);
  const [showComments, setShowComments] = useState(false);
  const [commentCount, setCommentCount] = useState(post.commentCount ?? post.comments?.length ?? 0);
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [editTitle, setEditTitle] = useState(post.title || '');
  const [isUpdating, setIsUpdating] = useState(false);
  const [localComments, setLocalComments] = useState(post.comments || []);
  const menuRef = useRef<HTMLDivElement>(null);

  const author = post.authorId as PublicUser;
  const VisibilityIcon = visibilityIcons[post.visibility];
  const isAuthor = user?._id === author._id;

  // Sync state with prop changes
  useEffect(() => {
    setIsLiked(post.isLiked || false);
    setLikeCount(post.likeCount ?? post.likes?.length ?? 0);
    setCommentCount(post.commentCount ?? post.comments?.length ?? 0);
    setLocalComments(post.comments || []);
    setEditContent(post.content);
    setEditTitle(post.title || '');
  }, [post]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  const handleEdit = async () => {
    if (!editContent.trim()) return;
    
    setIsUpdating(true);
    try {
      const response = await fetch(`/api/posts/${post._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          content: editContent,
          title: post.type === 'article' ? editTitle : undefined,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setIsEditing(false);
          onEdit?.(post._id, data.data);
        }
      }
    } catch (error) {
      console.error('Failed to edit post:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this post?')) return;
    
    try {
      const response = await fetch(`/api/posts/${post._id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        onDelete?.(post._id);
      }
    } catch (error) {
      console.error('Failed to delete post:', error);
    }
  };

  const handleLike = async () => {
    const previousState = isLiked;
    const previousCount = likeCount;
    
    // Optimistic update
    setIsLiked(!isLiked);
    setLikeCount(isLiked ? likeCount - 1 : likeCount + 1);
    
    try {
      const response = await fetch(`/api/posts/${post._id}/like`, {
        method: 'POST',
        credentials: 'include',
      });
      
      if (!response.ok) {
        // Revert on error
        setIsLiked(previousState);
        setLikeCount(previousCount);
      } else {
        const data = await response.json();
        if (data.success) {
          setIsLiked(data.data.isLiked);
          setLikeCount(data.data.likeCount);
        }
      }
    } catch (error) {
      // Revert on error
      setIsLiked(previousState);
      setLikeCount(previousCount);
      console.error('Failed to like post:', error);
    }
    
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
        <div className="relative" ref={menuRef}>
          <button 
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <MoreHorizontal className="w-5 h-5 text-gray-500" />
          </button>
          
          {showMenu && (
            <div className="absolute right-0 top-10 bg-white border border-surface-border rounded-lg shadow-lg z-20 min-w-[150px]">
              {isAuthor && (
                <>
                  <button
                    onClick={() => {
                      setIsEditing(true);
                      setShowMenu(false);
                    }}
                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-left hover:bg-gray-50"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit post
                  </button>
                  <button
                    onClick={() => {
                      handleDelete();
                      setShowMenu(false);
                    }}
                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-left text-red-600 hover:bg-gray-50"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete post
                  </button>
                </>
              )}
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/post/${post._id}`);
                  setShowMenu(false);
                  alert('Link copied to clipboard!');
                }}
                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-left hover:bg-gray-50"
              >
                <Share2 className="w-4 h-4" />
                Copy link
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Edit Mode */}
      {isEditing ? (
        <div className="mb-3 space-y-3">
          {post.type === 'article' && (
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              placeholder="Article title..."
              className="w-full px-3 py-2 text-lg font-semibold border border-surface-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          )}
          <Textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            autoResize
            className="min-h-[100px]"
          />
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsEditing(false);
                setEditContent(post.content);
                setEditTitle(post.title || '');
              }}
            >
              <X className="w-4 h-4 mr-1" />
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleEdit}
              disabled={isUpdating || !editContent.trim()}
              isLoading={isUpdating}
            >
              <Check className="w-4 h-4 mr-1" />
              Save
            </Button>
          </div>
        </div>
      ) : (
        <>
          {/* Article Title */}
          {post.type === 'article' && post.title && (
            <h2 className="text-xl font-bold text-gray-900 mb-2">{post.title}</h2>
          )}

          {/* Content */}
          <div className="mb-3">
            <p className="text-gray-800 whitespace-pre-wrap">{post.content}</p>
          </div>
        </>
      )}

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
          {commentCount > 0 && (
            <button
              onClick={() => setShowComments(!showComments)}
              className="hover:underline"
            >
              {formatCount(commentCount)} {commentCount === 1 ? 'comment' : 'comments'}
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
          onClick={async () => {
            if (navigator.share) {
              try {
                await navigator.share({
                  title: `${author.name}'s post`,
                  text: post.content.substring(0, 100),
                  url: `${window.location.origin}/post/${post._id}`,
                });
              } catch (err) {
                console.log('Share cancelled');
              }
            } else {
              await navigator.clipboard.writeText(`${window.location.origin}/post/${post._id}`);
              alert('Link copied to clipboard!');
            }
            onShare?.(post._id);
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <Share2 className="w-5 h-5" />
          <span className="text-sm font-medium">Share</span>
        </button>
      </div>

      {/* Comments Section (expandable) */}
      {showComments && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="border-t border-surface-border"
        >
          <CommentSection
            postId={post._id}
            comments={localComments}
            onAddComment={async (content: string) => {
              if (onAddComment) {
                await onAddComment(post._id, content);
                setCommentCount(prev => prev + 1);
              }
            }}
          />
        </motion.div>
      )}
    </Card>
  );
}

export default PostCard;
