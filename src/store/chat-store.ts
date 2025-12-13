/**
 * Chat Store
 * Global state for real-time chat using Zustand
 */

import { create } from 'zustand';
import { IConversation, IMessage } from '@/types';

interface ChatState {
  conversations: IConversation[];
  activeConversationId: string | null;
  messages: Record<string, IMessage[]>;
  typingUsers: Record<string, string[]>; // conversationId -> userIds
  onlineUsers: Set<string>;
  unreadCounts: Record<string, number>;

  // Actions
  setConversations: (conversations: IConversation[]) => void;
  addConversation: (conversation: IConversation) => void;
  setActiveConversation: (conversationId: string | null) => void;
  setMessages: (conversationId: string, messages: IMessage[]) => void;
  addMessage: (conversationId: string, message: IMessage) => void;
  setTypingUser: (conversationId: string, userId: string, isTyping: boolean) => void;
  setUserOnline: (userId: string, isOnline: boolean) => void;
  setUnreadCount: (conversationId: string, count: number) => void;
  incrementUnread: (conversationId: string) => void;
  clearUnread: (conversationId: string) => void;
  markMessageSeen: (conversationId: string, messageId: string, userId: string) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  conversations: [],
  activeConversationId: null,
  messages: {},
  typingUsers: {},
  onlineUsers: new Set(),
  unreadCounts: {},

  setConversations: (conversations) => set({ conversations }),

  addConversation: (conversation) =>
    set((state) => ({
      conversations: [conversation, ...state.conversations],
    })),

  setActiveConversation: (conversationId) =>
    set({ activeConversationId: conversationId }),

  setMessages: (conversationId, messages) =>
    set((state) => ({
      messages: { ...state.messages, [conversationId]: messages },
    })),

  addMessage: (conversationId, message) =>
    set((state) => {
      const existingMessages = state.messages[conversationId] || [];
      // Prevent duplicates
      if (existingMessages.some((m) => m._id === message._id)) {
        return state;
      }
      return {
        messages: {
          ...state.messages,
          [conversationId]: [...existingMessages, message],
        },
      };
    }),

  setTypingUser: (conversationId, userId, isTyping) =>
    set((state) => {
      const currentTyping = state.typingUsers[conversationId] || [];
      const newTyping = isTyping
        ? Array.from(new Set([...currentTyping, userId]))
        : currentTyping.filter((id) => id !== userId);

      return {
        typingUsers: {
          ...state.typingUsers,
          [conversationId]: newTyping,
        },
      };
    }),

  setUserOnline: (userId, isOnline) =>
    set((state) => {
      const newOnlineUsers = new Set(state.onlineUsers);
      if (isOnline) {
        newOnlineUsers.add(userId);
      } else {
        newOnlineUsers.delete(userId);
      }
      return { onlineUsers: newOnlineUsers };
    }),

  setUnreadCount: (conversationId, count) =>
    set((state) => ({
      unreadCounts: { ...state.unreadCounts, [conversationId]: count },
    })),

  incrementUnread: (conversationId) =>
    set((state) => ({
      unreadCounts: {
        ...state.unreadCounts,
        [conversationId]: (state.unreadCounts[conversationId] || 0) + 1,
      },
    })),

  clearUnread: (conversationId) =>
    set((state) => ({
      unreadCounts: { ...state.unreadCounts, [conversationId]: 0 },
    })),

  markMessageSeen: (conversationId, messageId, userId) =>
    set((state) => {
      const messages = state.messages[conversationId];
      if (!messages) return state;

      const updatedMessages = messages.map((msg) => {
        if (msg._id === messageId && !msg.seenBy.includes(userId)) {
          return { ...msg, seenBy: [...msg.seenBy, userId] };
        }
        return msg;
      });

      return {
        messages: { ...state.messages, [conversationId]: updatedMessages },
      };
    }),
}));

export default useChatStore;
