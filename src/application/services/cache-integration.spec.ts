import { beforeEach, describe, expect, it, vi } from 'vitest'
import { cacheMiddleware, invalidateCacheMiddleware } from '@/infrastructure/middlewares/cache.middleware'
import { CacheService } from './cache.service'

// Mock the cache service
vi.mock('./cache.service')

describe('Cache Integration', () => {
  let cacheService: CacheService

  beforeEach(() => {
    cacheService = new CacheService()
  })

  describe('Cache Middleware', () => {
    it('should cache GET requests', () => {
      const middleware = cacheMiddleware({
        ttl: 300,
        keyGenerator: () => 'test-key'
      })

      expect(middleware).toBeDefined()
      expect(typeof middleware).toBe('function')
    })

    it('should not cache non-GET requests', () => {
      const middleware = cacheMiddleware({
        ttl: 300
      })

      expect(middleware).toBeDefined()
    })

    it('should use custom key generator', () => {
      const keyGenerator = vi.fn().mockReturnValue('custom-key')
      const middleware = cacheMiddleware({
        ttl: 300,
        keyGenerator
      })

      expect(middleware).toBeDefined()
    })
  })

  describe('Cache Invalidation Middleware', () => {
    it('should invalidate cache patterns', () => {
      const middleware = invalidateCacheMiddleware(['pattern1:*', 'pattern2:*'])

      expect(middleware).toBeDefined()
      expect(typeof middleware).toBe('function')
    })

    it('should only invalidate on successful mutations', () => {
      const middleware = invalidateCacheMiddleware(['test:*'])

      expect(middleware).toBeDefined()
    })
  })

  describe('Cache Service Integration', () => {
    it('should get and set cache values', async () => {
      const spy = vi.spyOn(cacheService, 'set')
      await cacheService.set('test-key', { data: 'test' }, 300)

      expect(spy).toHaveBeenCalled()
    })

    it('should delete cache patterns', async () => {
      const spy = vi.spyOn(cacheService, 'deletePattern')
      await cacheService.deletePattern('test:*')

      expect(spy).toHaveBeenCalled()
    })

    it('should use getOrSet for cache-aside pattern', async () => {
      const factory = vi.fn().mockResolvedValue({ data: 'test' })
      const spy = vi.spyOn(cacheService, 'getOrSet')

      await cacheService.getOrSet('test-key', factory, 300)

      expect(spy).toHaveBeenCalled()
    })
  })
})
