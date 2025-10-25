import { CacheKeys, CacheService } from '@/application/services/cache.service'
import type { Context, Next } from 'hono'

export interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Max requests per window
  message?: string
  skipSuccessfulRequests?: boolean
  skipFailedRequests?: boolean
}

const cacheService = new CacheService()

/**
 * Rate limiting middleware using Redis
 */
export function rateLimitMiddleware(config: RateLimitConfig) {
  const {
    windowMs,
    maxRequests,
    message = 'Too many requests, please try again later.',
    skipSuccessfulRequests = false,
    skipFailedRequests = false
  } = config

  return async (c: Context, next: Next) => {
    try {
      // Get identifier (IP or user ID)
      const identifier =
        c.get('user')?.id || c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'anonymous'

      // Get endpoint path
      const endpoint = c.req.path

      // Create rate limit key
      const key = CacheKeys.rateLimit(identifier, endpoint)

      // Get current count
      const current = await cacheService.get<number>(key)
      const count = current || 0

      // Check if limit exceeded
      if (count >= maxRequests) {
        return c.json(
          {
            success: false,
            error: message,
            retryAfter: await cacheService.ttl(key)
          },
          429
        )
      }

      // Continue to next middleware
      await next()

      // Track the request based on response status
      const status = c.res.status
      const shouldCount =
        !(skipSuccessfulRequests && status >= 200 && status < 400) &&
        !(skipFailedRequests && status >= 400)

      if (shouldCount) {
        await cacheService.increment(key, Math.floor(windowMs / 1000))
      }
    } catch (error) {
      console.error('Rate limit middleware error:', error)
      // On error, allow the request to proceed
      await next()
    }
  }
}

/**
 * Predefined rate limit configurations
 */
export const RateLimits = {
  // Very strict - for sensitive operations
  STRICT: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
    message: 'Too many requests for this operation. Please wait 15 minutes.'
  },

  // Moderate - for API endpoints
  MODERATE: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
    message: 'Rate limit exceeded. Please try again in a few minutes.'
  },

  // Lenient - for general use
  LENIENT: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 1000,
    message: 'Rate limit exceeded. Please slow down.'
  },

  // File upload specific
  UPLOAD: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 50,
    message: 'Upload limit exceeded. Please wait before uploading more files.'
  },

  // Export specific
  EXPORT: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 20,
    message: 'Export limit exceeded. Please wait before creating more exports.'
  },

  // Auth specific
  AUTH: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
    message: 'Too many authentication attempts. Please wait 15 minutes.',
    skipSuccessfulRequests: true
  }
} as const
