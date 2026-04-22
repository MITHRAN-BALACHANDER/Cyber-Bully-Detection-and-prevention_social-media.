'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { PostCard, MediaGrid, CreatePost, Card } from '@/components';
import { useAuthStore } from '@/store';
import { cn } from '@/lib/utils';
import type { PopulatedPost, PopulatedMedia } from '@/types';

export default function FeedPage() {
  const { user } = useAuthStore();
  const [items, setItems] = useState<(PopulatedPost | PopulatedMedia)[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [filter, setFilter] = useState<'all' | 'posts' | 'media'>('all');

  const fetchFeed = useCallback(async (pageNum: number, reset = false) => {
    try {
      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: '10',
      });
      if (filter !== 'all') {
        params.set('type', filter);
      }

      const response = await fetch(`/api/feed?${params}`);
      const data = await response.json();

      if (data.success) {
        setItems((prev) => reset ? data.data : [...prev, ...data.data]);
        setHasMore(data.pagination?.hasMore ?? false);
      }
    } catch (error) {
      console.error('Failed to fetch feed:', error);
    } finally {
      setIsLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    setPage(1);
    setItems([]);
    setIsLoading(true);
    fetchFeed(1, true);
  }, [filter, fetchFeed]);

  const handleLoadMore = () => {
    if (!isLoading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchFeed(nextPage);
    }
  };

  const handlePostCreated = () => {
    setPage(1);
    setItems([]);
    fetchFeed(1, true);
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleLike = async (_postId: string) => {
    // Like is handled optimistically by PostCard, no need to refetch
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleComment = async (_postId: string) => {
    // Open comment section (already handled by PostCard)
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleShare = async (_postId: string) => {
    // Share handled by PostCard
  };

  const handleLikePost = async (id: string, type: 'post' | 'media') => {
    try {
      const endpoint = type === 'post' ? `/api/posts/${id}/like` : `/api/media/${id}/like`;
      const response = await fetch(endpoint, { method: 'POST', credentials: 'include' });
      const data = await response.json();
      
      if (data.success) {
        // Update with actual server response
        setItems((prev) =>
          prev.map((item) =>
            item._id === id
              ? {
                  ...item,
                  isLiked: data.data.isLiked,
                  likeCount: data.data.likeCount,
                  likes: data.data.isLiked 
                    ? [...(item.likes || []), user?._id || '']
                    : (item.likes || []).filter((likeId) => likeId !== user?._id),
                }
              : item
          )
        );
      }
    } catch (error) {
      console.error('Failed to like:', error);
    }
  };

  const handleEditPost = (postId: string, updatedPost: PopulatedPost) => {
    setItems((prev) =>
      prev.map((item) => (item._id === postId ? updatedPost : item))
    );
  };

  const handleDeletePost = (postId: string) => {
    setItems((prev) => prev.filter((item) => item._id !== postId));
  };

  const handleAddComment = async (postId: string, content: string) => {
    try {
      const response = await fetch(`/api/posts/${postId}/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ content }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Show detailed error message from API
        const errorMessage = data.error || 'Failed to add comment';
        const errorData = data.data || {};
        
        // Check if account is locked
        if (errorData.code === 'ACCOUNT_LOCKED') {
          const hours = Math.floor(errorData.remainingMinutes / 60);
          const minutes = errorData.remainingMinutes % 60;
          throw new Error(`Your account is locked for ${hours}h ${minutes}m due to multiple violations.`);
        }
        
        // Check if it's a moderation violation
        if (errorData.code === 'CONTENT_MODERATION_FAILED') {
          const violationMsg = `${errorMessage} (${errorData.dailyViolationCount || 0}/3 violations today)`;
          throw new Error(violationMsg);
        }
        
        throw new Error(errorMessage);
      }

      const comment = data.data?.comment;
      
      if (comment) {
        // Update the UI with the new comment
        setItems((prev) =>
          prev.map((item) => {
            if (item._id === postId && 'comments' in item) {
              return {
                ...item,
                comments: [...(item.comments || []), comment],
              };
            }
            return item;
          })
        );
      }
    } catch (error) {
      console.error('Failed to add comment:', error);
      throw error;
    }
  };

  return (
    <div className="mx-auto w-full max-w-[720px]">
      {/* Composer (sticky) */}
      <div className="sticky top-4 z-20">
        <div className="glass rounded-3xl p-3 sm:p-4">
          <CreatePost onSuccess={handlePostCreated} />
        </div>
        <div className="h-4" />
      </div>

      {/* Filter Tabs */}
      <Card className="mb-5 p-2">
        <div className="flex gap-2">
          {(['all', 'posts', 'media'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'px-5 py-2.5 rounded-2xl text-sm font-semibold transition-all duration-200 flex-1',
                filter === f
                  ? 'bg-white/6 text-foreground shadow-[0_0_0_1px_var(--border)_inset]'
                  : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
              )}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </Card>

      {/* Feed Items */}
      <div className="space-y-4">
        {items.map((item, index) => (
          <motion.div
            key={item._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            {'content' in item ? (
              <PostCard
                post={item}
                onLike={() => handleLikePost(item._id, 'post')}
                onAddComment={handleAddComment}
                onEdit={handleEditPost}
                onDelete={handleDeletePost}
              />
            ) : (
              <Card className="p-0 overflow-hidden">
                <div className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full" />
                  <div>
                    <p className="font-semibold">{(item as PopulatedMedia & { author?: { name: string } }).author?.name}</p>
                    <p className="text-sm text-gray-500">
                      Shared a photo
                    </p>
                  </div>
                </div>
                <MediaGrid
                  media={[item]}
                  onLike={() => handleLikePost(item._id, 'media')}
                />
              </Card>
            )}
          </motion.div>
        ))}

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}

        {/* Load More */}
        {!isLoading && hasMore && (
          <button
            onClick={handleLoadMore}
            className="w-full py-3 text-primary hover:bg-white/5 rounded-2xl transition-colors"
          >
            Load more
          </button>
        )}

        {/* Empty State */}
        {!isLoading && items.length === 0 && (
          <Card className="text-center py-12">
            <p className="text-muted-foreground">No posts yet. Be the first to share something!</p>
          </Card>
        )}

        {/* End of Feed */}
        {!isLoading && items.length > 0 && !hasMore && (
          <p className="text-center text-muted-foreground py-8">
            You&apos;ve reached the end of your feed
          </p>
        )}
      </div>
    </div>
  );
}
