'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { PostCard, MediaGrid, CreatePost, Card } from '@/components';
import { useAuthStore } from '@/store';
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

  const handleLike = async (postId: string) => {
    // Refresh the specific post or entire feed
    fetchFeed(1, true);
  };

  const handleComment = async (postId: string) => {
    // Open comment section (already handled by PostCard)
  };

  const handleShare = async (postId: string) => {
    // Share handled by PostCard
  };

  const handleLikePost = async (id: string, type: 'post' | 'media') => {
    try {
      const endpoint = type === 'post' ? `/api/posts/${id}/like` : `/api/media/${id}/like`;
      await fetch(endpoint, { method: 'POST' });
      // Optimistically update the UI
      setItems((prev) =>
        prev.map((item) =>
          item._id === id
            ? {
                ...item,
                likes: item.likes?.includes(user?._id || '')
                  ? item.likes.filter((id) => id !== user?._id)
                  : [...(item.likes || []), user?._id || ''],
              }
            : item
        )
      );
    } catch (error) {
      console.error('Failed to like:', error);
    }
  };

  const handleAddComment = async (postId: string, content: string) => {
    try {
      const response = await fetch(`/api/posts/${postId}/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ content }),
      });

      if (!response.ok) throw new Error('Failed to add comment');

      const { comment } = await response.json();
      
      // Optimistically update the UI
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
    } catch (error) {
      console.error('Failed to add comment:', error);
      throw error;
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Create Post */}
      <CreatePost onSuccess={handlePostCreated} />

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6">
        {(['all', 'posts', 'media'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              filter === f
                ? 'bg-primary-600 text-white'
                : 'bg-surface-card text-gray-600 hover:bg-gray-100'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

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
              />
            ) : (
              <Card className="p-0 overflow-hidden">
                <div className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full" />
                  <div>
                    <p className="font-semibold">{(item as any).author?.name}</p>
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
            <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
          </div>
        )}

        {/* Load More */}
        {!isLoading && hasMore && (
          <button
            onClick={handleLoadMore}
            className="w-full py-3 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
          >
            Load more
          </button>
        )}

        {/* Empty State */}
        {!isLoading && items.length === 0 && (
          <Card className="text-center py-12">
            <p className="text-gray-500">No posts yet. Be the first to share something!</p>
          </Card>
        )}

        {/* End of Feed */}
        {!isLoading && items.length > 0 && !hasMore && (
          <p className="text-center text-gray-500 py-8">
            You've reached the end of your feed
          </p>
        )}
      </div>
    </div>
  );
}
