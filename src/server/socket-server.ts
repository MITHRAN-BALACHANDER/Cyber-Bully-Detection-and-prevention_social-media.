/**
 * Socket.IO Server
 * Standalone server for real-time chat functionality
 * Run with: npm run socket
 */

import { Server, Socket } from 'socket.io';
import { createServer } from 'http';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import Redis from 'ioredis';

// Environment variables
const PORT = parseInt(process.env.SOCKET_PORT || '3001');
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-change-in-production';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/social-platform';
const REDIS_URL = process.env.REDIS_URL;

// Redis client for presence (optional)
let redis: Redis | null = null;
if (REDIS_URL) {
  redis = new Redis(REDIS_URL);
  redis.on('error', (err) => {
    console.warn('⚠️  Redis connection error (using in-memory fallback):', err.message);
    redis = null;
  });
} else {
  console.log('ℹ️  Redis disabled - using in-memory presence tracking');
}

const PRESENCE_TTL = 300; // 5 minutes
const TYPING_TTL = 5; // 5 seconds

// In-memory fallback for presence tracking
const inMemoryPresence = new Map<string, { status: string; lastSeen: Date }>();
const inMemoryTyping = new Map<string, Set<string>>();

// JWT Payload type
interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

// Extended socket with user data
interface AuthenticatedSocket extends Socket {
  userId?: string;
  email?: string;
}

// Initialize HTTP server and Socket.IO
const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

// ===========================================
// DATABASE CONNECTION
// ===========================================

async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB connected for Socket.IO server');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
}

// ===========================================
// PRESENCE MANAGEMENT
// ===========================================

async function setUserOnline(userId: string, socketId: string) {
  if (redis) {
    const key = `presence:${userId}`;
    await redis.setex(key, PRESENCE_TTL, JSON.stringify({
      socketId,
      lastSeen: Date.now(),
    }));
  } else {
    inMemoryPresence.set(userId, {
      status: 'online',
      lastSeen: new Date(),
    });
  }
}

async function setUserOffline(userId: string) {
  if (redis) {
    const key = `presence:${userId}`;
    await redis.del(key);
  } else {
    inMemoryPresence.delete(userId);
  }
}

async function refreshPresence(userId: string) {
  if (redis) {
    const key = `presence:${userId}`;
    await redis.expire(key, PRESENCE_TTL);
  } else {
    const presence = inMemoryPresence.get(userId);
    if (presence) {
      presence.lastSeen = new Date();
    }
  }
}

async function setTyping(conversationId: string, userId: string) {
  if (redis) {
    const key = `typing:${conversationId}:${userId}`;
    await redis.setex(key, TYPING_TTL, '1');
  } else {
    if (!inMemoryTyping.has(conversationId)) {
      inMemoryTyping.set(conversationId, new Set());
    }
    inMemoryTyping.get(conversationId)!.add(userId);
    
    // Auto-clear after TYPING_TTL
    setTimeout(() => {
      const typingUsers = inMemoryTyping.get(conversationId);
      if (typingUsers) {
        typingUsers.delete(userId);
        if (typingUsers.size === 0) {
          inMemoryTyping.delete(conversationId);
        }
      }
    }, TYPING_TTL * 1000);
  }
}

async function clearTyping(conversationId: string, userId: string) {
  if (redis) {
    const key = `typing:${conversationId}:${userId}`;
    await redis.del(key);
  } else {
    const typingUsers = inMemoryTyping.get(conversationId);
    if (typingUsers) {
      typingUsers.delete(userId);
      if (typingUsers.size === 0) {
        inMemoryTyping.delete(conversationId);
      }
    }
  }
}

// ===========================================
// AUTHENTICATION MIDDLEWARE
// ===========================================

io.use((socket: AuthenticatedSocket, next) => {
  const token = socket.handshake.auth?.token;

  if (!token) {
    return next(new Error('Authentication required'));
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as JWTPayload;
    socket.userId = payload.userId;
    socket.email = payload.email;
    next();
  } catch {
    next(new Error('Invalid token'));
  }
});

// ===========================================
// CONNECTION HANDLER
// ===========================================

io.on('connection', async (socket: AuthenticatedSocket) => {
  const userId = socket.userId!;
  console.log(`User connected: ${userId}`);

  // Set user online
  await setUserOnline(userId, socket.id);

  // Join user's personal room for direct notifications
  socket.join(`user:${userId}`);

  // Broadcast online status to interested parties
  socket.broadcast.emit('user:online', { userId });

  // ===========================================
  // CONVERSATION EVENTS
  // ===========================================

  // Join a conversation room
  socket.on('conversation:join', async ({ conversationId }) => {
    socket.join(`conversation:${conversationId}`);
    console.log(`User ${userId} joined conversation ${conversationId}`);
  });

  // Leave a conversation room
  socket.on('conversation:leave', async ({ conversationId }) => {
    socket.leave(`conversation:${conversationId}`);
    console.log(`User ${userId} left conversation ${conversationId}`);
  });

  // ===========================================
  // MESSAGE EVENTS
  // ===========================================

  // Handle new message (for real-time delivery)
  socket.on('message:send', async (data: {
    conversationId: string;
    content: string;
    type: string;
    mediaUrl?: string;
  }) => {
    const { conversationId, content, type, mediaUrl } = data;

    // Import Message model dynamically to avoid circular deps
    const { Message, Conversation } = await import('../models');

    // Verify user is participant (security check)
    const conversation = await Conversation.findById(conversationId);
    const participantIds = conversation?.participants.map((p) => p.toString()) || [];
    if (!conversation || !participantIds.includes(userId)) {
      socket.emit('error', { message: 'Not authorized for this conversation' });
      return;
    }

    // Create message in database
    const message = await Message.create({
      conversationId,
      senderId: userId,
      content,
      type,
      mediaUrl,
      seenBy: [userId],
    });

    // Update conversation's last message
    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessage: {
        content: content.substring(0, 100),
        senderId: userId,
        createdAt: new Date(),
      },
      updatedAt: new Date(),
    });

    // Populate sender info
    await message.populate('senderId', 'name username avatar');

    // Broadcast to conversation room
    io.to(`conversation:${conversationId}`).emit('message:new', message);

    // Also send to participants' personal rooms (for notification badges)
    conversation.participants.forEach((participantId: mongoose.Types.ObjectId) => {
      if (participantId.toString() !== userId) {
        io.to(`user:${participantId}`).emit('notification:new', {
          type: 'message',
          data: {
            conversationId,
            message,
          },
        });
      }
    });
  });

  // Handle message seen
  socket.on('message:seen', async ({ conversationId, messageIds }: {
    conversationId: string;
    messageIds: string[];
  }) => {
    const { Message } = await import('../models');

    // Update messages as seen
    await Message.updateMany(
      {
        _id: { $in: messageIds },
        seenBy: { $ne: userId },
      },
      {
        $addToSet: { seenBy: userId },
      }
    );

    // Broadcast seen status to conversation
    io.to(`conversation:${conversationId}`).emit('message:seen', {
      messageIds,
      userId,
    });
  });

  // ===========================================
  // TYPING EVENTS
  // ===========================================

  socket.on('typing:start', async ({ conversationId }) => {
    await setTyping(conversationId, userId);
    socket.to(`conversation:${conversationId}`).emit('typing:start', {
      conversationId,
      userId,
    });
  });

  socket.on('typing:stop', async ({ conversationId }) => {
    await clearTyping(conversationId, userId);
    socket.to(`conversation:${conversationId}`).emit('typing:stop', {
      conversationId,
      userId,
    });
  });

  // ===========================================
  // HEARTBEAT / PRESENCE
  // ===========================================

  // Refresh presence periodically
  const presenceInterval = setInterval(async () => {
    await refreshPresence(userId);
  }, 60000); // Every minute

  // ===========================================
  // DISCONNECT
  // ===========================================

  socket.on('disconnect', async (reason) => {
    console.log(`User disconnected: ${userId} (${reason})`);
    
    clearInterval(presenceInterval);
    await setUserOffline(userId);

    // Broadcast offline status
    socket.broadcast.emit('user:offline', { userId });
  });
});

// ===========================================
// START SERVER
// ===========================================

async function start() {
  await connectDB();
  
  httpServer.listen(PORT, () => {
    console.log(`✅ Socket.IO server running on port ${PORT}`);
  });
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down Socket.IO server...');
  await mongoose.disconnect();
  if (redis) {
    redis.disconnect();
  }
  process.exit(0);
});

start().catch(console.error);
