/**
 * Socket Hook
 * React hook for managing Socket.IO connection
 */

import { useEffect, useCallback, useRef } from 'react';
import { useAuthStore, useChatStore } from '@/store';
import {
  connectSocket,
  disconnectSocket,
  isSocketConnected,
  joinConversation as socketJoinConversation,
  leaveConversation as socketLeaveConversation,
  sendMessage as socketSendMessage,
  startTyping as socketStartTyping,
  stopTyping as socketStopTyping,
  markSeen as socketMarkSeen,
  onNewMessage,
  onMessageSeen,
  onTypingStart,
  onTypingStop,
  onUserOnline,
  onUserOffline,
  onConnect,
  onDisconnect,
} from '@/lib/socket';

export function useSocket() {
  const { user, isAuthenticated } = useAuthStore();
  const {
    addMessage,
    setTypingUser,
    setUserOnline,
    markMessageSeen,
    activeConversationId,
    incrementUnread,
  } = useChatStore();
  
  const cleanupRef = useRef<(() => void)[]>([]);

  // Connect when authenticated
  useEffect(() => {
    if (!isAuthenticated || !user) {
      disconnectSocket();
      return;
    }

    // Get token from cookie or localStorage for socket auth
    // In production, you'd get this from a secure source
    const token = document.cookie
      .split('; ')
      .find((row) => row.startsWith('auth_token='))
      ?.split('=')[1];

    if (token) {
      connectSocket(token);
    }

    return () => {
      disconnectSocket();
    };
  }, [isAuthenticated, user]);

  // Set up event listeners
  useEffect(() => {
    // Clean up previous listeners
    cleanupRef.current.forEach((cleanup) => cleanup());
    cleanupRef.current = [];

    // New message handler
    cleanupRef.current.push(
      onNewMessage((message) => {
        addMessage(message.conversationId, message);
        
        // Increment unread if not in active conversation
        if (message.conversationId !== activeConversationId) {
          incrementUnread(message.conversationId);
        }
      })
    );

    // Message seen handler
    cleanupRef.current.push(
      onMessageSeen(({ messageId, userId }) => {
        if (activeConversationId) {
          markMessageSeen(activeConversationId, messageId, userId);
        }
      })
    );

    // Typing handlers
    cleanupRef.current.push(
      onTypingStart(({ conversationId, userId }) => {
        setTypingUser(conversationId, userId, true);
      })
    );

    cleanupRef.current.push(
      onTypingStop(({ conversationId, userId }) => {
        setTypingUser(conversationId, userId, false);
      })
    );

    // Online status handlers
    cleanupRef.current.push(
      onUserOnline(({ userId }) => {
        setUserOnline(userId, true);
      })
    );

    cleanupRef.current.push(
      onUserOffline(({ userId }) => {
        setUserOnline(userId, false);
      })
    );

    // Connection handlers
    cleanupRef.current.push(
      onConnect(() => {
        console.log('Socket connected');
      })
    );

    cleanupRef.current.push(
      onDisconnect((reason) => {
        console.log('Socket disconnected:', reason);
      })
    );

    return () => {
      cleanupRef.current.forEach((cleanup) => cleanup());
    };
  }, [
    activeConversationId,
    addMessage,
    incrementUnread,
    markMessageSeen,
    setTypingUser,
    setUserOnline,
  ]);

  // Expose socket methods
  const joinConversation = useCallback((conversationId: string) => {
    socketJoinConversation(conversationId);
  }, []);

  const leaveConversation = useCallback((conversationId: string) => {
    socketLeaveConversation(conversationId);
  }, []);

  const sendMessage = useCallback(
    async (conversationId: string, content: string, type?: 'text' | 'image' | 'file') => {
      // Try socket first for real-time delivery
      if (isSocketConnected()) {
        socketSendMessage(conversationId, content, type);
      } else {
        // Fallback to HTTP API if socket not connected
        try {
          const response = await fetch(`/api/chat/messages/${conversationId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ content, type: type || 'text' }),
          });
          const data = await response.json();
          if (data.success) {
            // Add message to local state
            addMessage(conversationId, data.data);
          }
        } catch (error) {
          console.error('Failed to send message via HTTP:', error);
        }
      }
    },
    [addMessage]
  );

  const startTyping = useCallback((conversationId: string) => {
    socketStartTyping(conversationId);
  }, []);

  const stopTyping = useCallback((conversationId: string) => {
    socketStopTyping(conversationId);
  }, []);

  const markSeen = useCallback((conversationId: string, messageIds: string[]) => {
    socketMarkSeen(conversationId, messageIds);
  }, []);

  return {
    joinConversation,
    leaveConversation,
    sendMessage,
    startTyping,
    stopTyping,
    markSeen,
    isConnected: isSocketConnected(),
  };
}

export default useSocket;
