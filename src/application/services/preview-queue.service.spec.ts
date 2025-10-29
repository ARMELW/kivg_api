import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PreviewQueueService } from './preview-queue.service'
import type { PreviewRepositoryInterface } from '@/domain/repositories/preview.repository.interface'

describe('PreviewQueueService', () => {
  let mockRepository: PreviewRepositoryInterface

  beforeEach(() => {
    // Reset singleton instance before each test
    // @ts-expect-error - accessing private static member for testing
    PreviewQueueService.instance = null

    mockRepository = {
      findById: vi.fn(),
      findAll: vi.fn().mockResolvedValue({ previews: [], total: 0 }),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      updateProgress: vi.fn(),
      updateStatus: vi.fn()
    }
  })

  describe('Singleton Pattern', () => {
    it('should return the same instance when called multiple times', () => {
      const instance1 = PreviewQueueService.getInstance(mockRepository)
      const instance2 = PreviewQueueService.getInstance()

      expect(instance1).toBe(instance2)
    })

    it('should throw error if getInstance is called without repository on first initialization', () => {
      expect(() => PreviewQueueService.getInstance()).toThrow('PreviewRepository is required for first initialization')
    })

    it('should allow getInstance without repository after first initialization', () => {
      PreviewQueueService.getInstance(mockRepository)
      const instance2 = PreviewQueueService.getInstance()

      expect(instance2).toBeDefined()
    })
  })

  describe('Queue Operations', () => {
    it('should enqueue a job and return position', () => {
      const queueService = PreviewQueueService.getInstance(mockRepository)
      const job = {
        previewId: 'test-preview-id',
        userId: 'test-user-id',
        sceneId: 'test-scene-id',
        sceneHash: 'test-hash',
        options: {
          quality: 'standard' as const,
          aspectRatio: '16:9' as const,
          skipAudio: false
        },
        createdAt: new Date()
      }

      const position = queueService.enqueue(job)

      expect(position).toBe(0) // First job should be at position 0
    })

    it('should maintain same queue across multiple getInstance calls', () => {
      const queueService1 = PreviewQueueService.getInstance(mockRepository)
      const job = {
        previewId: 'test-preview-id',
        userId: 'test-user-id',
        sceneId: 'test-scene-id',
        sceneHash: 'test-hash',
        options: {
          quality: 'standard' as const,
          aspectRatio: '16:9' as const,
          skipAudio: false
        },
        createdAt: new Date()
      }

      queueService1.enqueue(job)

      const queueService2 = PreviewQueueService.getInstance()
      const stats = queueService2.getQueueStats()

      expect(stats.queueLength).toBe(1)
    })

    it('should get next job from queue', () => {
      const queueService = PreviewQueueService.getInstance(mockRepository)
      const job = {
        previewId: 'test-preview-id',
        userId: 'test-user-id',
        sceneId: 'test-scene-id',
        sceneHash: 'test-hash',
        options: {
          quality: 'standard' as const,
          aspectRatio: '16:9' as const,
          skipAudio: false
        },
        createdAt: new Date()
      }

      queueService.enqueue(job)
      const nextJob = queueService.getNextJob()

      expect(nextJob).toBeDefined()
      expect(nextJob?.previewId).toBe('test-preview-id')
    })

    it('should return null when queue is empty', () => {
      const queueService = PreviewQueueService.getInstance(mockRepository)
      const nextJob = queueService.getNextJob()

      expect(nextJob).toBeNull()
    })

    it('should dequeue a job', () => {
      const queueService = PreviewQueueService.getInstance(mockRepository)
      const job = {
        previewId: 'test-preview-id',
        userId: 'test-user-id',
        sceneId: 'test-scene-id',
        sceneHash: 'test-hash',
        options: {
          quality: 'standard' as const,
          aspectRatio: '16:9' as const,
          skipAudio: false
        },
        createdAt: new Date()
      }

      queueService.enqueue(job)
      const result = queueService.dequeue('test-preview-id')

      expect(result).toBe(true)

      const stats = queueService.getQueueStats()
      expect(stats.queueLength).toBe(0)
    })

    it('should return false when dequeueing non-existent job', () => {
      const queueService = PreviewQueueService.getInstance(mockRepository)
      const result = queueService.dequeue('non-existent-id')

      expect(result).toBe(false)
    })
  })

  describe('Processing State', () => {
    it('should mark job as processing', () => {
      const queueService = PreviewQueueService.getInstance(mockRepository)
      queueService.markProcessing('test-preview-id')

      const stats = queueService.getQueueStats()
      expect(stats.processing).toBe(1)
    })

    it('should mark job as complete', () => {
      const queueService = PreviewQueueService.getInstance(mockRepository)
      queueService.markProcessing('test-preview-id')
      queueService.markComplete('test-preview-id')

      const stats = queueService.getQueueStats()
      expect(stats.processing).toBe(0)
    })
  })

  describe('Rate Limiting', () => {
    it('should allow preview creation when within limits', async () => {
      const queueService = PreviewQueueService.getInstance(mockRepository)
      const result = await queueService.checkRateLimits('test-user-id')

      expect(result.allowed).toBe(true)
    })

    it('should deny when too many active previews', async () => {
      mockRepository.findAll = vi.fn().mockResolvedValue({
        previews: [{ id: '1' }, { id: '2' }, { id: '3' }],
        total: 3
      })

      const queueService = PreviewQueueService.getInstance(mockRepository)
      const result = await queueService.checkRateLimits('test-user-id')

      expect(result.allowed).toBe(false)
      expect(result.message).toContain('Too many active previews')
    })
  })
})
