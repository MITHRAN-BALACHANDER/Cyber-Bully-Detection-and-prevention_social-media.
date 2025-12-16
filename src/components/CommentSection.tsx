'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IComment, PublicUser } from '@/types';
import { useAuthStore } from '@/store/auth-store';
import Image from 'next/image';
import { AlertCircle, Lock, X } from 'lucide-react';

interface CommentSectionProps {
  postId: string;
  comments: IComment[];
  onAddComment: (content: string) => Promise<void>;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function CommentSection({ postId: _postId, comments: initialComments, onAddComment }: CommentSectionProps) {
  const { user } = useAuthStore();
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localComments, setLocalComments] = useState<IComment[]>(initialComments || []);
  const [error, setError] = useState<string | null>(null);

  // Update local comments when initialComments changes
  useEffect(() => {
    setLocalComments(initialComments || []);
  }, [initialComments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isSubmitting || !user) return;

    setIsSubmitting(true);
    setError(null); // Clear any previous errors
    
    // Create optimistic comment
    const optimisticComment: IComment = {
      _id: `temp-${Date.now()}`,
      authorId: {
        _id: user._id,
        name: user.name,
        username: user.username,
        avatar: user.avatar,
      } as PublicUser,
      content: content.trim(),
      createdAt: new Date(),
    };
    
    // Add optimistic comment immediately
    setLocalComments(prev => [...prev, optimisticComment]);
    const commentContent = content.trim();
    setContent('');
    
    try {
      await onAddComment(commentContent);
    } catch (error) {
      // Remove optimistic comment on error
      setLocalComments(prev => prev.filter(c => c._id !== optimisticComment._id));
      setContent(commentContent); // Restore the content
      
      // Display error message in UI
      const errorMessage = error instanceof Error ? error.message : 'Failed to add comment';
      setError(errorMessage);
      console.error('Failed to add comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="px-4 pb-4 space-y-4">
      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`flex items-start gap-3 p-4 rounded-xl border-2 ${
              error.includes('locked') 
                ? 'bg-red-50 border-red-300 text-red-900'
                : error.includes('violation')
                ? 'bg-yellow-50 border-yellow-300 text-yellow-900'
                : 'bg-red-50 border-red-300 text-red-900'
            }`}
          >
            {error.includes('locked') ? (
              <Lock className="w-5 h-5 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <p className="font-medium text-sm">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="flex-shrink-0 hover:opacity-70 transition-opacity"
            >
              <X className="w-5 h-5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Comment Form */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="flex-shrink-0">
          {user?.avatar ? (
            <Image
              src={user.avatar}
              alt={user.name}
              width={32}
              height={32}
              className="rounded-full"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-sm font-medium">
              {user?.name?.[0]?.toUpperCase()}
            </div>
          )}
        </div>
        <div className="flex-1 flex gap-2">
          <input
            type="text"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write a comment..."
            className="flex-1 px-3 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isSubmitting}
          />
          <button
            type="submit"
            disabled={!content.trim() || isSubmitting}
            className="px-4 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Posting...' : 'Post'}
          </button>
        </div>
      </form>

      {/* Comments List */}
      <div className="space-y-3">
        {localComments.filter(comment => comment && comment._id).map((comment) => {
          const author = typeof comment.authorId === 'string' ? null : comment.authorId;
          return (
            <motion.div
              key={comment._id as string}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-2"
            >
              <div className="flex-shrink-0">
                {author?.avatar ? (
                  <Image
                    src={author.avatar}
                    alt={author.name}
                    width={32}
                    height={32}
                    className="rounded-full"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-sm font-medium">
                    {author?.name?.[0]?.toUpperCase() || 'U'}
                  </div>
                )}
              </div>
              <div className="flex-1">
                <div className="bg-gray-100 rounded-2xl px-3 py-2">
                  <p className="font-medium text-sm">{author?.name || 'Unknown User'}</p>
                  <p className="text-sm">{comment.content}</p>
                </div>
                <div className="flex gap-3 px-3 mt-1 text-xs text-gray-500">
                  <button className="hover:underline">Like</button>
                  <button className="hover:underline">Reply</button>
                  <span>{new Date(comment.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </motion.div>
          );
        })}
        {localComments.length === 0 && (
          <p className="text-center text-gray-500 text-sm py-4">
            No comments yet. Be the first to comment!
          </p>
        )}
      </div>
    </div>
  );
}
