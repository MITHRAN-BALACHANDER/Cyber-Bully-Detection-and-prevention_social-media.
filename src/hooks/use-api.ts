/**
 * API Client Hooks
 * Custom hooks for making API requests with proper typing
 */

import { useState, useCallback } from 'react';
import { ApiResponse, PaginatedResponse } from '@/types';

interface UseApiOptions {
  onSuccess?: (data: unknown) => void;
  onError?: (error: string) => void;
}

interface UseApiReturn<T> {
  data: T | null;
  error: string | null;
  isLoading: boolean;
  execute: (url: string, options?: RequestInit) => Promise<T | null>;
  reset: () => void;
}

/**
 * Generic API hook for making requests
 */
export function useApi<T>(options?: UseApiOptions): UseApiReturn<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const execute = useCallback(
    async (url: string, requestOptions?: RequestInit): Promise<T | null> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(url, {
          headers: {
            'Content-Type': 'application/json',
            ...requestOptions?.headers,
          },
          credentials: 'include',
          ...requestOptions,
        });

        const result: ApiResponse<T> = await response.json();

        if (!result.success) {
          const errorMessage = result.error || 'An error occurred';
          setError(errorMessage);
          options?.onError?.(errorMessage);
          return null;
        }

        setData(result.data as T);
        options?.onSuccess?.(result.data);
        return result.data as T;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Network error';
        setError(errorMessage);
        options?.onError?.(errorMessage);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [options]
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return { data, error, isLoading, execute, reset };
}

/**
 * Hook for paginated API requests
 */
export function usePaginatedApi<T>() {
  const [data, setData] = useState<T[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasMore: false,
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const execute = useCallback(
    async (
      url: string,
      options?: { append?: boolean; requestOptions?: RequestInit }
    ): Promise<T[]> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(url, {
          headers: {
            'Content-Type': 'application/json',
            ...options?.requestOptions?.headers,
          },
          credentials: 'include',
          ...options?.requestOptions,
        });

        const result: PaginatedResponse<T> = await response.json();

        if (!result.success) {
          setError(result.error || 'An error occurred');
          return [];
        }

        const newData = result.data || [];
        
        if (options?.append) {
          setData((prev) => [...prev, ...newData]);
        } else {
          setData(newData);
        }

        if (result.pagination) {
          setPagination(result.pagination);
        }

        return newData;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Network error';
        setError(errorMessage);
        return [];
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const loadMore = useCallback(
    async (baseUrl: string) => {
      if (!pagination.hasMore || isLoading) return;

      const separator = baseUrl.includes('?') ? '&' : '?';
      const url = `${baseUrl}${separator}page=${pagination.page + 1}&limit=${pagination.limit}`;
      
      await execute(url, { append: true });
    },
    [pagination, isLoading, execute]
  );

  const reset = useCallback(() => {
    setData([]);
    setPagination({
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 0,
      hasMore: false,
    });
    setError(null);
  }, []);

  return {
    data,
    pagination,
    error,
    isLoading,
    execute,
    loadMore,
    reset,
  };
}

// ===========================================
// SPECIALIZED HOOKS
// ===========================================

/**
 * Hook for auth operations
 */
export function useAuth() {
  const api = useApi();

  const login = useCallback(
    async (email: string, password: string) => {
      return api.execute('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
    },
    [api]
  );

  const register = useCallback(
    async (data: { name: string; username: string; email: string; password: string }) => {
      return api.execute('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    [api]
  );

  const logout = useCallback(async () => {
    return api.execute('/api/auth/logout', { method: 'POST' });
  }, [api]);

  const getMe = useCallback(async () => {
    return api.execute('/api/auth/me');
  }, [api]);

  return {
    ...api,
    login,
    register,
    logout,
    getMe,
  };
}

/**
 * Hook for post operations
 */
export function usePosts() {
  const api = usePaginatedApi();

  const createPost = useCallback(
    async (data: { content: string; type?: string; title?: string; media?: string[]; visibility?: string }) => {
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      return response.json();
    },
    []
  );

  const likePost = useCallback(async (postId: string) => {
    const response = await fetch(`/api/posts/${postId}/like`, {
      method: 'POST',
      credentials: 'include',
    });
    return response.json();
  }, []);

  const commentOnPost = useCallback(async (postId: string, content: string) => {
    const response = await fetch(`/api/posts/${postId}/comment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ content }),
    });
    return response.json();
  }, []);

  return {
    ...api,
    createPost,
    likePost,
    commentOnPost,
  };
}

/**
 * Hook for chat operations
 */
export function useChat() {
  const conversationsApi = usePaginatedApi();
  const messagesApi = usePaginatedApi();

  const createConversation = useCallback(async (participantId: string) => {
    const response = await fetch('/api/chat/conversation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ participantId }),
    });
    return response.json();
  }, []);

  const sendMessage = useCallback(
    async (conversationId: string, content: string, type: string = 'text') => {
      const response = await fetch(`/api/chat/messages/${conversationId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ content, type }),
      });
      return response.json();
    },
    []
  );

  const markAsSeen = useCallback(async (conversationId: string) => {
    const response = await fetch(`/api/chat/messages/${conversationId}/seen`, {
      method: 'POST',
      credentials: 'include',
    });
    return response.json();
  }, []);

  return {
    conversations: conversationsApi,
    messages: messagesApi,
    createConversation,
    sendMessage,
    markAsSeen,
  };
}
