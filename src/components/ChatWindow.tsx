/**
 * ChatWindow Component
 * WhatsApp-style chat interface
 */

'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Image as ImageIcon, Paperclip, MoreVertical, Check, CheckCheck } from 'lucide-react';
import { Avatar, Button } from '@/components/ui';
import { cn, formatTime, formatRelativeTime } from '@/lib/utils';
import { useChatStore, useAuthStore } from '@/store';
import { useSocket } from '@/hooks';
import { IMessage, PublicUser } from '@/types';

interface ChatWindowProps {
  conversationId: string;
  otherUser?: PublicUser;
  groupName?: string;
  onBack?: () => void;
}

export function ChatWindow({ conversationId, otherUser, groupName }: ChatWindowProps) {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  const { user } = useAuthStore();
  const { messages, typingUsers, onlineUsers } = useChatStore();
  const { sendMessage, startTyping, stopTyping, markSeen } = useSocket();

  const conversationMessages = messages[conversationId] || [];
  const typingInConversation = typingUsers[conversationId] || [];
  const isOtherUserOnline = otherUser ? onlineUsers.has(otherUser._id) : false;

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversationMessages]);

  // Mark messages as seen
  useEffect(() => {
    if (conversationMessages.length > 0) {
      const unseenMessageIds = conversationMessages
        .filter((msg) => msg.senderId.toString() !== user?._id && !msg.seenBy.includes(user?._id || ''))
        .map((msg) => msg._id);

      if (unseenMessageIds.length > 0) {
        markSeen(conversationId, unseenMessageIds);
      }
    }
  }, [conversationMessages, conversationId, user?._id, markSeen]);

  // Handle typing indicator
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setMessage(e.target.value);

      if (!isTyping) {
        setIsTyping(true);
        startTyping(conversationId);
      }

      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Stop typing after 2 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        stopTyping(conversationId);
      }, 2000);
    },
    [conversationId, isTyping, startTyping, stopTyping]
  );

  // Send message
  const handleSend = useCallback(() => {
    if (!message.trim()) return;

    sendMessage(conversationId, message.trim());
    setMessage('');
    setIsTyping(false);
    stopTyping(conversationId);

    // Focus input
    inputRef.current?.focus();
  }, [conversationId, message, sendMessage, stopTyping]);

  // Handle Enter key
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  // Group messages by date
  const groupedMessages = conversationMessages.reduce<Record<string, IMessage[]>>(
    (groups, msg) => {
      const date = new Date(msg.createdAt).toDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(msg);
      return groups;
    },
    {}
  );

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Avatar
              src={otherUser?.avatar}
              name={otherUser?.name || groupName || 'Chat'}
              size="md"
            />
            {isOtherUserOnline && (
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
            )}
          </div>
          <div>
            <p className="font-semibold text-gray-900">
              {otherUser?.name || groupName}
            </p>
            <p className="text-sm text-gray-500">
              {isOtherUserOnline ? 'Online' : otherUser?.lastSeen ? `Last seen ${formatRelativeTime(otherUser.lastSeen)}` : ''}
            </p>
          </div>
        </div>
        <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <MoreVertical className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {Object.entries(groupedMessages).map(([date, msgs]) => (
          <div key={date}>
            {/* Date separator */}
            <div className="flex justify-center my-4">
              <span className="px-3 py-1 bg-white rounded-full text-xs text-gray-500 shadow-sm">
                {new Date(date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            </div>

            {/* Messages */}
            {msgs.map((msg, index) => {
              const isOwn = msg.senderId.toString() === user?._id;
              const showAvatar =
                !isOwn &&
                (index === 0 || msgs[index - 1]?.senderId !== msg.senderId);

              return (
                <motion.div
                  key={msg._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    'flex mb-1',
                    isOwn ? 'justify-end' : 'justify-start'
                  )}
                >
                  {!isOwn && showAvatar && (
                    <Avatar
                      src={(msg.senderId as unknown as PublicUser)?.avatar}
                      name={(msg.senderId as unknown as PublicUser)?.name || 'User'}
                      size="sm"
                      className="mr-2 mt-auto"
                    />
                  )}
                  {!isOwn && !showAvatar && <div className="w-8 mr-2" />}

                  <div
                    className={cn(
                      'max-w-[70%] px-4 py-2 rounded-2xl',
                      isOwn
                        ? 'bg-primary-500 text-white rounded-br-md'
                        : 'bg-white text-gray-900 rounded-bl-md shadow-sm'
                    )}
                  >
                    {/* Media */}
                    {msg.type === 'image' && msg.mediaUrl && (
                      <img
                        src={msg.mediaUrl}
                        alt="Shared image"
                        className="rounded-lg mb-2 max-w-full"
                      />
                    )}

                    {/* Text */}
                    <p className="text-sm whitespace-pre-wrap break-words">
                      {msg.content}
                    </p>

                    {/* Time & Status */}
                    <div
                      className={cn(
                        'flex items-center justify-end gap-1 mt-1',
                        isOwn ? 'text-white/70' : 'text-gray-400'
                      )}
                    >
                      <span className="text-xs">{formatTime(msg.createdAt)}</span>
                      {isOwn && (
                        <span>
                          {msg.seenBy.length > 1 ? (
                            <CheckCheck className="w-4 h-4 text-blue-300" />
                          ) : (
                            <Check className="w-4 h-4" />
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ))}

        {/* Typing indicator */}
        <AnimatePresence>
          {typingInConversation.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2 mt-2"
            >
              <Avatar
                src={otherUser?.avatar}
                name={otherUser?.name || 'User'}
                size="sm"
              />
              <div className="bg-white px-4 py-2 rounded-2xl rounded-bl-md shadow-sm">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-200 px-4 py-3">
        <div className="flex items-end gap-2">
          <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors">
            <Paperclip className="w-5 h-5" />
          </button>
          <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors">
            <ImageIcon className="w-5 h-5" />
          </button>

          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={message}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              rows={1}
              className="w-full px-4 py-2 bg-gray-100 rounded-full resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 max-h-32"
              style={{ minHeight: '40px' }}
            />
          </div>

          <Button
            onClick={handleSend}
            disabled={!message.trim()}
            className="rounded-full p-2 w-10 h-10"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ChatWindow;
