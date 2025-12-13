/**
 * Validation schemas using Zod
 * Centralized validation for all API inputs
 */

import { z } from 'zod';

// ===========================================
// AUTH SCHEMAS
// ===========================================

export const registerSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name cannot exceed 100 characters')
    .trim(),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username cannot exceed 30 characters')
    .regex(/^[a-z0-9_]+$/, 'Username can only contain lowercase letters, numbers, and underscores')
    .toLowerCase()
    .trim(),
  email: z
    .string()
    .email('Please enter a valid email')
    .toLowerCase()
    .trim(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email').toLowerCase().trim(),
  password: z.string().min(1, 'Password is required'),
});

// ===========================================
// USER/PROFILE SCHEMAS
// ===========================================

export const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).trim().optional(),
  headline: z.string().max(220).trim().optional(),
  bio: z.string().max(2600).trim().optional(),
  location: z.string().max(100).trim().optional(),
  website: z.string().url().optional().or(z.literal('')),
  skills: z.array(z.string().max(50)).max(50).optional(),
});

export const experienceSchema = z.object({
  title: z.string().min(1).max(100).trim(),
  company: z.string().min(1).max(100).trim(),
  location: z.string().max(100).trim().optional(),
  startDate: z.string().datetime().or(z.date()),
  endDate: z.string().datetime().or(z.date()).optional(),
  current: z.boolean().default(false),
  description: z.string().max(2000).trim().optional(),
});

export const educationSchema = z.object({
  school: z.string().min(1).max(100).trim(),
  degree: z.string().min(1).max(100).trim(),
  field: z.string().min(1).max(100).trim(),
  startDate: z.string().datetime().or(z.date()),
  endDate: z.string().datetime().or(z.date()).optional(),
  current: z.boolean().default(false),
});

// ===========================================
// POST SCHEMAS
// ===========================================

export const createPostSchema = z.object({
  type: z.enum(['text', 'image', 'video', 'article']).default('text'),
  content: z.string().min(1, 'Content is required').max(10000),
  title: z.string().max(200).optional(),
  media: z.array(z.string().url()).max(10).optional(),
  visibility: z.enum(['public', 'connections', 'private']).default('public'),
});

export const commentSchema = z.object({
  content: z.string().min(1).max(1000).trim(),
});

// ===========================================
// MEDIA SCHEMAS
// ===========================================

export const uploadMediaSchema = z.object({
  url: z.string().url('Invalid media URL'),
  type: z.enum(['image', 'video']).default('image'),
  caption: z.string().max(2200).optional(),
  aspectRatio: z.number().positive().optional(),
});

// ===========================================
// CHAT SCHEMAS
// ===========================================

export const createConversationSchema = z.object({
  participantId: z.string().min(1, 'Participant ID is required'),
});

export const createGroupSchema = z.object({
  name: z.string().min(1).max(100).trim(),
  participantIds: z.array(z.string()).min(1),
  avatar: z.string().url().optional(),
});

export const sendMessageSchema = z.object({
  content: z.string().min(1).max(5000),
  type: z.enum(['text', 'image', 'file']).default('text'),
  mediaUrl: z.string().url().optional(),
});

// ===========================================
// NETWORK SCHEMAS
// ===========================================

export const connectionRequestSchema = z.object({
  recipientId: z.string().min(1, 'Recipient ID is required'),
});

export const connectionResponseSchema = z.object({
  connectionId: z.string().min(1, 'Connection ID is required'),
  action: z.enum(['accept', 'reject']),
});

// ===========================================
// PAGINATION SCHEMA
// ===========================================

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

// ===========================================
// VALIDATION HELPER
// ===========================================

/**
 * Validate data against a schema
 * Returns parsed data if valid, throws formatted error if invalid
 */
export function validate<T>(schema: z.ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);
  
  if (!result.success) {
    const errors = result.error.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    throw new ValidationError('Validation failed', errors);
  }
  
  return result.data;
}

/**
 * Custom validation error with field-level errors
 */
export class ValidationError extends Error {
  public errors: Array<{ field: string; message: string }>;
  
  constructor(message: string, errors: Array<{ field: string; message: string }>) {
    super(message);
    this.name = 'ValidationError';
    this.errors = errors;
  }
}
