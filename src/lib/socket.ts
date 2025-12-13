/**
 * Socket.IO Client Library
 * Provides type-safe socket connection for client-side usage
 */

import { io, Socket } from 'socket.io-client';
import { SocketEvents } from '@/types';

// Socket URL - defaults to separate socket server
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';

// Singleton socket instance
let socket: Socket | null = null;

/**
 * Get or create socket connection
 */
export function getSocket(): Socket {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: false,
      withCredentials: true,
      transports: ['websocket', 'polling'],
    });
  }
  return socket;
}

/**
 * Connect to socket server with authentication
 */
export function connectSocket(token: string): Socket {
  const sock = getSocket();
  
  // Set auth token
  sock.auth = { token };
  
  // Connect if not already connected
  if (!sock.connected) {
    sock.connect();
  }
  
  return sock;
}

/**
 * Disconnect from socket server
 */
export function disconnectSocket(): void {
  if (socket?.connected) {
    socket.disconnect();
  }
}

/**
 * Check if socket is connected
 */
export function isSocketConnected(): boolean {
  return socket?.connected || false;
}

// ===========================================
// TYPE-SAFE EVENT EMITTERS
// ===========================================

/**
 * Join a conversation room
 */
export function joinConversation(conversationId: string): void {
  socket?.emit('conversation:join', { conversationId });
}

/**
 * Leave a conversation room
 */
export function leaveConversation(conversationId: string): void {
  socket?.emit('conversation:leave', { conversationId });
}

/**
 * Send a new message via socket (for real-time delivery)
 */
export function sendMessage(
  conversationId: string,
  content: string,
  type: 'text' | 'image' | 'file' = 'text',
  mediaUrl?: string
): void {
  socket?.emit('message:send', {
    conversationId,
    content,
    type,
    mediaUrl,
  });
}

/**
 * Start typing indicator
 */
export function startTyping(conversationId: string): void {
  socket?.emit('typing:start', { conversationId });
}

/**
 * Stop typing indicator
 */
export function stopTyping(conversationId: string): void {
  socket?.emit('typing:stop', { conversationId });
}

/**
 * Mark messages as seen
 */
export function markSeen(conversationId: string, messageIds: string[]): void {
  socket?.emit('message:seen', { conversationId, messageIds });
}

// ===========================================
// TYPE-SAFE EVENT LISTENERS
// ===========================================

type EventCallback<T> = (data: T) => void;

/**
 * Listen for new messages
 */
export function onNewMessage(callback: EventCallback<SocketEvents['message:new']>): () => void {
  socket?.on('message:new', callback);
  return () => socket?.off('message:new', callback);
}

/**
 * Listen for message seen events
 */
export function onMessageSeen(callback: EventCallback<SocketEvents['message:seen']>): () => void {
  socket?.on('message:seen', callback);
  return () => socket?.off('message:seen', callback);
}

/**
 * Listen for typing start
 */
export function onTypingStart(callback: EventCallback<SocketEvents['typing:start']>): () => void {
  socket?.on('typing:start', callback);
  return () => socket?.off('typing:start', callback);
}

/**
 * Listen for typing stop
 */
export function onTypingStop(callback: EventCallback<SocketEvents['typing:stop']>): () => void {
  socket?.on('typing:stop', callback);
  return () => socket?.off('typing:stop', callback);
}

/**
 * Listen for user online status
 */
export function onUserOnline(callback: EventCallback<SocketEvents['user:online']>): () => void {
  socket?.on('user:online', callback);
  return () => socket?.off('user:online', callback);
}

/**
 * Listen for user offline status
 */
export function onUserOffline(callback: EventCallback<SocketEvents['user:offline']>): () => void {
  socket?.on('user:offline', callback);
  return () => socket?.off('user:offline', callback);
}

/**
 * Listen for new notifications
 */
export function onNotification(callback: EventCallback<SocketEvents['notification:new']>): () => void {
  socket?.on('notification:new', callback);
  return () => socket?.off('notification:new', callback);
}

// ===========================================
// CONNECTION EVENT LISTENERS
// ===========================================

/**
 * Listen for connection
 */
export function onConnect(callback: () => void): () => void {
  socket?.on('connect', callback);
  return () => socket?.off('connect', callback);
}

/**
 * Listen for disconnection
 */
export function onDisconnect(callback: (reason: string) => void): () => void {
  socket?.on('disconnect', callback);
  return () => socket?.off('disconnect', callback);
}

/**
 * Listen for connection errors
 */
export function onConnectError(callback: (error: Error) => void): () => void {
  socket?.on('connect_error', callback);
  return () => socket?.off('connect_error', callback);
}

const socketClient = {
  getSocket,
  connectSocket,
  disconnectSocket,
  isSocketConnected,
  joinConversation,
  leaveConversation,
  sendMessage,
  startTyping,
  stopTyping,
  markSeen,
  onNewMessage,
  onMessageSeen,
  onTypingStart,
  onTypingStop,
  onUserOnline,
  onUserOffline,
  onNotification,
  onConnect,
  onDisconnect,
  onConnectError,
};

export default socketClient;
