import { describe, expect, it } from 'vitest'
import { rateLimitMiddleware, RateLimits } from '@/infrastructure/middlewares/rate-limit.middleware'

describe('Rate Limiting', () => {
  describe('Rate Limit Middleware', () => {
    it('should create rate limit middleware with config', () => {
      const middleware = rateLimitMiddleware(RateLimits.MODERATE)

      expect(middleware).toBeDefined()
      expect(typeof middleware).toBe('function')
    })

    it('should have predefined rate limit configurations', () => {
      expect(RateLimits.STRICT).toBeDefined()
      expect(RateLimits.MODERATE).toBeDefined()
      expect(RateLimits.LENIENT).toBeDefined()
      expect(RateLimits.UPLOAD).toBeDefined()
      expect(RateLimits.EXPORT).toBeDefined()
      expect(RateLimits.AUTH).toBeDefined()
    })

    it('should configure different limits for different operations', () => {
      expect(RateLimits.STRICT.maxRequests).toBeLessThan(RateLimits.MODERATE.maxRequests)
      expect(RateLimits.MODERATE.maxRequests).toBeLessThan(RateLimits.LENIENT.maxRequests)
    })

    it('should have appropriate limits for uploads', () => {
      expect(RateLimits.UPLOAD.maxRequests).toBe(50)
      expect(RateLimits.UPLOAD.windowMs).toBe(60 * 60 * 1000) // 1 hour
    })

    it('should have appropriate limits for exports', () => {
      expect(RateLimits.EXPORT.maxRequests).toBe(20)
      expect(RateLimits.EXPORT.windowMs).toBe(60 * 60 * 1000) // 1 hour
    })
  })

  describe('Rate Limit Config', () => {
    it('should accept custom configuration', () => {
      const customConfig = {
        windowMs: 10 * 60 * 1000, // 10 minutes
        maxRequests: 100,
        message: 'Custom rate limit message'
      }

      const middleware = rateLimitMiddleware(customConfig)

      expect(middleware).toBeDefined()
    })

    it('should support skip options', () => {
      const config = {
        windowMs: 15 * 60 * 1000,
        maxRequests: 100,
        skipSuccessfulRequests: true,
        skipFailedRequests: false
      }

      const middleware = rateLimitMiddleware(config)

      expect(middleware).toBeDefined()
    })
  })
})
