/**
 * API Response Utilities
 * Standardized response helpers for consistent API responses
 */

import { NextResponse } from 'next/server';
import { ApiResponse, PaginatedResponse } from '@/types';
import { ValidationError } from './validations';

// ===========================================
// SUCCESS RESPONSES
// ===========================================

/**
 * Send a successful response with data
 */
export function success<T>(data: T, status: number = 200): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
    },
    { status }
  );
}

/**
 * Send a successful response with message
 */
export function successMessage(message: string, status: number = 200): NextResponse<ApiResponse> {
  return NextResponse.json(
    {
      success: true,
      message,
    },
    { status }
  );
}

/**
 * Send a paginated response
 */
export function paginated<T>(
  data: T[],
  pagination: {
    page: number;
    limit: number;
    total: number;
  },
  status: number = 200
): NextResponse<PaginatedResponse<T>> {
  const totalPages = Math.ceil(pagination.total / pagination.limit);
  
  return NextResponse.json(
    {
      success: true,
      data,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total: pagination.total,
        totalPages,
        hasMore: pagination.page < totalPages,
      },
    },
    { status }
  );
}

// ===========================================
// ERROR RESPONSES
// ===========================================

/**
 * Send an error response
 */
export function error(message: string, status: number = 400): NextResponse<ApiResponse> {
  return NextResponse.json(
    {
      success: false,
      error: message,
    },
    { status }
  );
}

/**
 * Send unauthorized error (401)
 */
export function unauthorized(message: string = 'Unauthorized'): NextResponse<ApiResponse> {
  return error(message, 401);
}

/**
 * Send forbidden error (403)
 */
export function forbidden(message: string = 'Forbidden'): NextResponse<ApiResponse> {
  return error(message, 403);
}

/**
 * Send not found error (404)
 */
export function notFound(message: string = 'Not found'): NextResponse<ApiResponse> {
  return error(message, 404);
}

/**
 * Send validation error (422)
 */
export function validationError(
  errors: Array<{ field: string; message: string }>
): NextResponse<ApiResponse & { errors: typeof errors }> {
  return NextResponse.json(
    {
      success: false,
      error: 'Validation failed',
      errors,
    },
    { status: 422 }
  );
}

/**
 * Send server error (500)
 */
export function serverError(message: string = 'Internal server error'): NextResponse<ApiResponse> {
  return error(message, 500);
}

// ===========================================
// ERROR HANDLER
// ===========================================

/**
 * Handle errors in API routes
 * Provides consistent error responses based on error type
 */
export function handleError(err: unknown): NextResponse<ApiResponse> {
  console.error('API Error:', err);

  // Handle known error types
  if (err instanceof ValidationError) {
    return validationError(err.errors);
  }

  if (err instanceof Error) {
    // Handle specific error messages
    switch (err.message) {
      case 'UNAUTHORIZED':
        return unauthorized();
      case 'FORBIDDEN':
        return forbidden();
      case 'NOT_FOUND':
        return notFound();
      default:
        // In production, don't expose error details
        if (process.env.NODE_ENV === 'production') {
          return serverError();
        }
        return error(err.message, 500);
    }
  }

  return serverError();
}

// ===========================================
// CREATED RESPONSE (201)
// ===========================================

/**
 * Send a created response (201)
 */
export function created<T>(data: T): NextResponse<ApiResponse<T>> {
  return success(data, 201);
}

// ===========================================
// NO CONTENT RESPONSE (204)
// ===========================================

/**
 * Send a no content response (204)
 */
export function noContent(): NextResponse {
  return new NextResponse(null, { status: 204 });
}
