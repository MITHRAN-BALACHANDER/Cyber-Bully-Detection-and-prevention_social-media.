/**
 * Socket Hook
 * React hook for managing Socket.IO connection
 */

import { useEffect, useCallback, useRef } from 'react';
import { useAuthStore, useChatStore } from '@/store';
import socket, {
  connectSocket,
  disconnectSocket,
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
    socket.joinConversation(conversationId);
  }, []);

  const leaveConversation = useCallback((conversationId: string) => {
    socket.leaveConversation(conversationId);
  }, []);

  const sendMessage = useCallback(
    (conversationId: string, content: string, type?: 'text' | 'image' | 'file') => {
      socket.sendMessage(conversationId, content, type);
    },
    []
  );

  const startTyping = useCallback((conversationId: string) => {
    socket.startTyping(conversationId);
  }, []);

  const stopTyping = useCallback((conversationId: string) => {
    socket.stopTyping(conversationId);
  }, []);

  const markSeen = useCallback((conversationId: string, messageIds: string[]) => {
    socket.markSeen(conversationId, messageIds);
  }, []);

  return {
    joinConversation,
    leaveConversation,
    sendMessage,
    startTyping,
    stopTyping,
    markSeen,
    isConnected: socket.isSocketConnected(),
  };
}

export default useSocket;
