import { CacheService } from '@/application/services/cache.service'
import type { Context, Next } from 'hono'

const cacheService = new CacheService()

export interface CacheMiddlewareConfig {
  ttl: number // Time to live in seconds
  keyGenerator?: (c: Context) => string
}

/**
 * Caching middleware for GET requests
 */
export function cacheMiddleware(config: CacheMiddlewareConfig) {
  const { ttl, keyGenerator } = config

  return async (c: Context, next: Next) => {
    // Only cache GET requests
    if (c.req.method !== 'GET') {
      await next()
      return
    }

    try {
      // Generate cache key
      const key = keyGenerator ? keyGenerator(c) : `cache:${c.req.path}`

      // Check cache
      const cached = await cacheService.get(key)
      if (cached) {
        return c.json(cached)
      }

      // Execute handler
      await next()

      // Cache successful responses
      if (c.res.status >= 200 && c.res.status < 300) {
        try {
          const responseClone = c.res.clone()
          const body = await responseClone.json()
          await cacheService.set(key, body, ttl)
        } catch {
          // If response is not JSON, skip caching
        }
      }
    } catch (error) {
      console.error('Cache middleware error:', error)
      await next()
    }
  }
}

/**
 * Cache invalidation middleware
 */
export function invalidateCacheMiddleware(patterns: string[]) {
  return async (c: Context, next: Next) => {
    await next()

    // Only invalidate on successful mutations
    if (c.res.status >= 200 && c.res.status < 300) {
      try {
        await Promise.all(patterns.map((pattern) => cacheService.deletePattern(pattern)))
      } catch (error) {
        console.error('Cache invalidation error:', error)
      }
    }
  }
}
