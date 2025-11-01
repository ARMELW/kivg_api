import { redis } from '@/infrastructure/config/redis.config'

export class CacheService {
  /**
   * Get a value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await redis.get(key)
      if (!value) return null
      return JSON.parse(value) as T
    } catch (error) {
      console.error('Cache get error:', error)
      return null
    }
  }

  /**
   * Set a value in cache with TTL
   */
  async set(key: string, value: any, ttl: number): Promise<void> {
    try {
      await redis.setex(key, ttl, JSON.stringify(value))
    } catch (error) {
      console.error('Cache set error:', error)
    }
  }

  /**
   * Delete a key from cache
   */
  async delete(key: string): Promise<void> {
    try {
      await redis.del(key)
    } catch (error) {
      console.error('Cache delete error:', error)
    }
  }

  /**
   * Delete multiple keys matching a pattern
   */
  async deletePattern(pattern: string): Promise<void> {
    try {
      const keys = await redis.keys(pattern)
      if (keys.length > 0) {
        await redis.del(...keys)
      }
    } catch (error) {
      console.error('Cache delete pattern error:', error)
    }
  }

  /**
   * Check if a key exists
   */
  async exists(key: string): Promise<boolean> {
    try {
      const result = await redis.exists(key)
      return result === 1
    } catch (error) {
      console.error('Cache exists error:', error)
      return false
    }
  }

  /**
   * Get or set a value with a factory function
   */
  async getOrSet<T>(key: string, factory: () => Promise<T>, ttl: number): Promise<T> {
    const cached = await this.get<T>(key)
    if (cached !== null) return cached

    const value = await factory()
    await this.set(key, value, ttl)
    return value
  }

  /**
   * Increment a counter
   */
  async increment(key: string, ttl?: number): Promise<number> {
    try {
      const value = await redis.incr(key)
      if (ttl) {
        await redis.expire(key, ttl)
      }
      return value
    } catch (error) {
      console.error('Cache increment error:', error)
      return 0
    }
  }

  /**
   * Get TTL for a key
   */
  async ttl(key: string): Promise<number> {
    try {
      return await redis.ttl(key)
    } catch (error) {
      console.error('Cache TTL error:', error)
      return -1
    }
  }
}

// Cache key generators
export const CacheKeys = {
  asset: (id: string) => `asset:${id}`,
  assets: (userId: string, params?: string) => `assets:${userId}:${params || 'all'}`,
  assetStats: (userId: string) => `asset:stats:${userId}`,

  shape: (id: string) => `shape:${id}`,
  shapes: (userId: string, params?: string) => `shapes:${userId}:${params || 'all'}`,
  shapeStats: (userId: string) => `shape:stats:${userId}`,

  channel: (id: string) => `channel:${id}`,
  channels: (userId: string) => `channels:${userId}`,
  channelStats: (id: string) => `channel:stats:${id}`,

  project: (id: string) => `project:${id}`,
  projects: (channelId: string) => `projects:${channelId}`,

  scene: (id: string) => `scene:${id}`,
  scenes: (projectId: string) => `scenes:${projectId}`,

  audio: (id: string) => `audio:${id}`,
  audios: (userId: string, params?: string) => `audios:${userId}:${params || 'all'}`,

  template: (id: string) => `template:${id}`,
  templates: (params?: string) => `templates:${params || 'all'}`,

  export: (id: string) => `export:${id}`,
  exports: (userId: string) => `exports:${userId}`,

  rateLimit: (identifier: string, endpoint: string) => `ratelimit:${identifier}:${endpoint}`
} as const
