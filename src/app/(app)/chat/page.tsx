'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Plus, Search, Loader2 } from 'lucide-react';
import { ChatWindow, Card, Avatar, Input } from '@/components';
import { useAuthStore, useChatStore } from '@/store';
import { useSocket } from '@/hooks';
import { cn, formatRelativeTime } from '@/lib/utils';
import type { Conversation } from '@/types';

export default function ChatPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const { conversations, setConversations, onlineUsers } = useChatStore();
  const { isConnected } = useSocket();

  const selectedConversationId = searchParams.get('conversation');
  const newChatUserId = searchParams.get('user');

  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);

  const fetchConversations = useCallback(async () => {
    try {
      const response = await fetch('/api/chat/conversation');
      const data = await response.json();
      if (data.success) {
        setConversations(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    } finally {
      setIsLoading(false);
    }
  }, [setConversations]);

  // Create new conversation if user param exists
  const createNewConversation = useCallback(async (userId: string) => {
    try {
      const response = await fetch('/api/chat/conversation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ participantId: userId }),
      });
      const data = await response.json();
      if (data.success) {
        setSelectedConversation(data.data);
        router.replace(`/chat?conversation=${data.data._id}`);
        fetchConversations();
      } else {
        console.error('Failed to create conversation:', data);
      }
    } catch (error) {
      console.error('Failed to create conversation:', error);
    }
  }, [router, fetchConversations]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    if (newChatUserId) {
      createNewConversation(newChatUserId);
    }
  }, [newChatUserId, createNewConversation]);

  useEffect(() => {
    if (selectedConversationId && conversations.length > 0) {
      const conv = conversations.find((c) => c._id === selectedConversationId);
      if (conv) {
        setSelectedConversation(conv);
      }
    }
  }, [selectedConversationId, conversations]);

  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    router.replace(`/chat?conversation=${conversation._id}`);
  };

  const getOtherUser = (conversation: Conversation) => {
    const otherParticipant = conversation.participants?.find(
      (p) => (typeof p === 'string' ? p : p._id) !== user?._id
    );
    return typeof otherParticipant === 'object' ? otherParticipant : undefined;
  };

  const getConversationName = (conversation: Conversation) => {
    if (conversation.name) return conversation.name;
    const otherParticipant = conversation.participants?.find(
      (p) => (typeof p === 'string' ? p : p._id) !== user?._id
    );
    if (typeof otherParticipant === 'object') {
      return otherParticipant.name;
    }
    return 'Unknown';
  };

  const getConversationAvatar = (conversation: Conversation) => {
    const otherParticipant = conversation.participants?.find(
      (p) => (typeof p === 'string' ? p : p._id) !== user?._id
    );
    if (typeof otherParticipant === 'object') {
      return otherParticipant.avatar;
    }
    return undefined;
  };

  const isParticipantOnline = (conversation: Conversation) => {
    const otherParticipant = conversation.participants?.find(
      (p) => (typeof p === 'string' ? p : p._id) !== user?._id
    );
    const participantId = typeof otherParticipant === 'object' ? otherParticipant._id : otherParticipant;
    return participantId ? onlineUsers.has(participantId) : false;
  };

  const filteredConversations = conversations.filter((conv) => {
    if (!searchQuery) return true;
    const name = getConversationName(conv).toLowerCase();
    return name.includes(searchQuery.toLowerCase());
  });

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Conversation List */}
      <div className={cn(
        'w-full md:w-80 lg:w-96 border-r border-surface-border flex flex-col',
        selectedConversation && 'hidden md:flex'
      )}>
        {/* Header */}
        <div className="p-4 border-b border-surface-border">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold">Messages</h1>
            <button 
              onClick={() => router.push('/network?tab=connections')}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              title="Start a new conversation"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-surface-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
            </div>
          ) : filteredConversations.length > 0 ? (
            filteredConversations.map((conversation) => (
              <motion.button
                key={conversation._id}
                onClick={() => handleSelectConversation(conversation)}
                className={cn(
                  'w-full p-4 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left',
                  selectedConversation?._id === conversation._id && 'bg-primary-50'
                )}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <div className="relative">
                  <Avatar
                    src={getConversationAvatar(conversation)}
                    name={getConversationName(conversation)}
                    size="md"
                  />
                  {isParticipantOnline(conversation) && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-success border-2 border-white rounded-full" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-gray-900 truncate">
                      {getConversationName(conversation)}
                    </p>
                    {conversation.lastMessage && (
                      <span className="text-xs text-gray-500">
                        {formatRelativeTime(new Date(conversation.lastMessage.createdAt))}
                      </span>
                    )}
                  </div>
                  {conversation.lastMessage && (
                    <p className="text-sm text-gray-500 truncate">
                      {conversation.lastMessage.content}
                    </p>
                  )}
                </div>
              </motion.button>
            ))
          ) : (
            <div className="text-center py-12 px-4">
              <p className="text-gray-500">No conversations yet</p>
              <p className="text-sm text-gray-400 mt-1">
                Start a conversation from someone's profile
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Chat Window */}
      <div className={cn(
        'flex-1 flex flex-col',
        !selectedConversation && 'hidden md:flex'
      )}>
        {selectedConversation ? (
          <ChatWindow
            conversationId={selectedConversation._id}
            otherUser={getOtherUser(selectedConversation)}
            groupName={selectedConversation.type === 'group' ? selectedConversation.name : undefined}
            onBack={() => {
              setSelectedConversation(null);
              router.replace('/chat');
            }}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Your Messages</h2>
              <p className="text-gray-500 mt-2">Select a conversation to start chatting</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
