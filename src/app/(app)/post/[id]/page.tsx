/**
 * Single Post Page
 * View a single post with all its details
 */

'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ArrowLeft } from 'lucide-react';
import { PostCard, Card } from '@/components';
import { useAuthStore } from '@/store';
import type { PopulatedPost } from '@/types';

interface PostPageProps {
  params: Promise<{ id: string }>;
}

export default function PostPage({ params }: PostPageProps) {
  const { id } = use(params);
  const router = useRouter();
  useAuthStore();
  const [post, setPost] = useState<PopulatedPost | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const response = await fetch(`/api/posts/${id}`, {
          credentials: 'include',
        });
        const data = await response.json();

        if (data.success) {
          setPost(data.data);
        } else {
          setError(data.error || 'Failed to load post');
        }
      } catch (err) {
        setError('Failed to load post');
        console.error('Failed to fetch post:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPost();
  }, [id]);

  const handleAddComment = async (_postId: string, content: string) => {
    try {
      const response = await fetch(`/api/posts/${id}/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ content }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data.error || 'Failed to add comment';
        const errorData = data.data || {};
        
        if (errorData.code === 'ACCOUNT_LOCKED') {
          const hours = Math.floor(errorData.remainingMinutes / 60);
          const minutes = errorData.remainingMinutes % 60;
          throw new Error(`Your account is locked for ${hours}h ${minutes}m due to multiple violations.`);
        }
        
        if (errorData.code === 'CONTENT_MODERATION_FAILED') {
          const violationMsg = `${errorMessage} (${errorData.dailyViolationCount || 0}/3 violations today)`;
          throw new Error(violationMsg);
        }
        
        throw new Error(errorMessage);
      }
      
      if (data.success && post) {
        setPost({
          ...post,
          comments: [...(post.comments || []), data.data.comment],
        });
      }
    } catch (error) {
      console.error('Failed to add comment:', error);
      throw error;
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleEdit = (_postId: string, updatedPost: PopulatedPost) => {
    setPost(updatedPost);
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleDelete = (_postId: string) => {
    router.push('/feed');
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6">
        <Card className="p-8 text-center">
          <p className="text-gray-500">{error || 'Post not found'}</p>
          <button
            onClick={() => router.back()}
            className="mt-4 text-primary-600 hover:underline"
          >
            Go back
          </button>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>Back</span>
      </button>

      {/* Post */}
      <PostCard
        post={post}
        onAddComment={handleAddComment}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </div>
  );
}
