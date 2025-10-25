import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CacheKeys, CacheService } from './cache.service'

// Mock Redis
vi.mock('@/infrastructure/config/redis.config', () => ({
  redis: {
    get: vi.fn(),
    setex: vi.fn(),
    del: vi.fn(),
    keys: vi.fn(),
    exists: vi.fn(),
    incr: vi.fn(),
    expire: vi.fn(),
    ttl: vi.fn()
  },
  CACHE_TTL: {
    SHORT: 60,
    MEDIUM: 300,
    LONG: 1800,
    VERY_LONG: 3600
  }
}))

describe('CacheService', () => {
  let cacheService: CacheService

  beforeEach(() => {
    cacheService = new CacheService()
    vi.clearAllMocks()
  })

  describe('get', () => {
    it('should return parsed value when key exists', async () => {
      const mockData = { id: '123', name: 'test' }
      const { redis } = await import('@/infrastructure/config/redis.config')
      vi.mocked(redis.get).mockResolvedValue(JSON.stringify(mockData))

      const result = await cacheService.get('test-key')

      expect(result).toEqual(mockData)
      expect(redis.get).toHaveBeenCalledWith('test-key')
    })

    it('should return null when key does not exist', async () => {
      const { redis } = await import('@/infrastructure/config/redis.config')
      vi.mocked(redis.get).mockResolvedValue(null)

      const result = await cacheService.get('test-key')

      expect(result).toBeNull()
    })

    it('should return null on error', async () => {
      const { redis } = await import('@/infrastructure/config/redis.config')
      vi.mocked(redis.get).mockRejectedValue(new Error('Redis error'))

      const result = await cacheService.get('test-key')

      expect(result).toBeNull()
    })
  })

  describe('set', () => {
    it('should set value with TTL', async () => {
      const mockData = { id: '123', name: 'test' }
      const { redis } = await import('@/infrastructure/config/redis.config')

      await cacheService.set('test-key', mockData, 300)

      expect(redis.setex).toHaveBeenCalledWith('test-key', 300, JSON.stringify(mockData))
    })
  })

  describe('delete', () => {
    it('should delete key', async () => {
      const { redis } = await import('@/infrastructure/config/redis.config')

      await cacheService.delete('test-key')

      expect(redis.del).toHaveBeenCalledWith('test-key')
    })
  })

  describe('getOrSet', () => {
    it('should return cached value if exists', async () => {
      const mockData = { id: '123', name: 'test' }
      const { redis } = await import('@/infrastructure/config/redis.config')
      vi.mocked(redis.get).mockResolvedValue(JSON.stringify(mockData))

      const factory = vi.fn()
      const result = await cacheService.getOrSet('test-key', factory, 300)

      expect(result).toEqual(mockData)
      expect(factory).not.toHaveBeenCalled()
    })

    it('should call factory and cache result if not exists', async () => {
      const mockData = { id: '123', name: 'test' }
      const { redis } = await import('@/infrastructure/config/redis.config')
      vi.mocked(redis.get).mockResolvedValue(null)

      const factory = vi.fn().mockResolvedValue(mockData)
      const result = await cacheService.getOrSet('test-key', factory, 300)

      expect(result).toEqual(mockData)
      expect(factory).toHaveBeenCalled()
      expect(redis.setex).toHaveBeenCalledWith('test-key', 300, JSON.stringify(mockData))
    })
  })

  describe('CacheKeys', () => {
    it('should generate correct asset key', () => {
      expect(CacheKeys.asset('123')).toBe('asset:123')
    })

    it('should generate correct channel key', () => {
      expect(CacheKeys.channel('456')).toBe('channel:456')
    })

    it('should generate correct rate limit key', () => {
      expect(CacheKeys.rateLimit('user123', '/api/upload')).toBe('ratelimit:user123:/api/upload')
    })
  })
})
