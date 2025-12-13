/**
 * Redis client for chat presence, typing indicators, and caching
 * Uses ioredis for robust connection handling
 */

import Redis from 'ioredis';

// Extend global type for Redis singleton
declare global {
  // eslint-disable-next-line no-var
  var redisClient: Redis | null;
}

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

/**
 * Get or create Redis client singleton
 */
function getRedisClient(): Redis {
  if (global.redisClient) {
    return global.redisClient;
  }

  const client = new Redis(REDIS_URL, {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      // Exponential backoff with max 30 seconds
      const delay = Math.min(times * 100, 30000);
      return delay;
    },
    lazyConnect: true,
  });

  client.on('error', (err) => {
    console.error('Redis connection error:', err.message);
  });

  client.on('connect', () => {
    console.log('✅ Redis connected successfully');
  });

  global.redisClient = client;
  return client;
}

export const redis = getRedisClient();

// ===========================================
// PRESENCE MANAGEMENT
// ===========================================

const PRESENCE_KEY_PREFIX = 'presence:';
const PRESENCE_TTL = 300; // 5 minutes

/**
 * Mark user as online
 */
export async function setUserOnline(userId: string, socketId: string): Promise<void> {
  const key = `${PRESENCE_KEY_PREFIX}${userId}`;
  await redis.setex(key, PRESENCE_TTL, JSON.stringify({
    socketId,
    lastSeen: Date.now(),
  }));
}

/**
 * Mark user as offline
 */
export async function setUserOffline(userId: string): Promise<void> {
  const key = `${PRESENCE_KEY_PREFIX}${userId}`;
  await redis.del(key);
}

/**
 * Check if user is online
 */
export async function isUserOnline(userId: string): Promise<boolean> {
  const key = `${PRESENCE_KEY_PREFIX}${userId}`;
  const result = await redis.exists(key);
  return result === 1;
}

/**
 * Get multiple users' online status
 */
export async function getOnlineUsers(userIds: string[]): Promise<Record<string, boolean>> {
  const pipeline = redis.pipeline();
  
  userIds.forEach((id) => {
    pipeline.exists(`${PRESENCE_KEY_PREFIX}${id}`);
  });

  const results = await pipeline.exec();
  
  return userIds.reduce((acc, id, index) => {
    acc[id] = results?.[index]?.[1] === 1;
    return acc;
  }, {} as Record<string, boolean>);
}

/**
 * Refresh user presence (heartbeat)
 */
export async function refreshPresence(userId: string): Promise<void> {
  const key = `${PRESENCE_KEY_PREFIX}${userId}`;
  await redis.expire(key, PRESENCE_TTL);
}

// ===========================================
// TYPING INDICATORS
// ===========================================

const TYPING_KEY_PREFIX = 'typing:';
const TYPING_TTL = 5; // 5 seconds

/**
 * Set user as typing in a conversation
 */
export async function setTyping(conversationId: string, userId: string): Promise<void> {
  const key = `${TYPING_KEY_PREFIX}${conversationId}:${userId}`;
  await redis.setex(key, TYPING_TTL, '1');
}

/**
 * Remove typing indicator
 */
export async function clearTyping(conversationId: string, userId: string): Promise<void> {
  const key = `${TYPING_KEY_PREFIX}${conversationId}:${userId}`;
  await redis.del(key);
}

/**
 * Get all users typing in a conversation
 */
export async function getTypingUsers(conversationId: string): Promise<string[]> {
  const pattern = `${TYPING_KEY_PREFIX}${conversationId}:*`;
  const keys = await redis.keys(pattern);
  
  return keys.map((key) => key.split(':').pop() as string);
}

// ===========================================
// CACHING UTILITIES
// ===========================================

const CACHE_PREFIX = 'cache:';

/**
 * Cache data with TTL
 */
export async function cacheSet<T>(key: string, data: T, ttlSeconds: number): Promise<void> {
  await redis.setex(`${CACHE_PREFIX}${key}`, ttlSeconds, JSON.stringify(data));
}

/**
 * Get cached data
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  const data = await redis.get(`${CACHE_PREFIX}${key}`);
  return data ? JSON.parse(data) : null;
}

/**
 * Delete cached data
 */
export async function cacheDel(key: string): Promise<void> {
  await redis.del(`${CACHE_PREFIX}${key}`);
}

/**
 * Clear cache by pattern
 */
export async function cacheClearPattern(pattern: string): Promise<void> {
  const keys = await redis.keys(`${CACHE_PREFIX}${pattern}`);
  if (keys.length > 0) {
    await redis.del(...keys);
  }
}

export default redis;
