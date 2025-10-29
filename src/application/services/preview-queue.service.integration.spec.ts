import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PreviewQueueService } from '@/application/services/preview-queue.service'
import type { PreviewRepositoryInterface } from '@/domain/repositories/preview.repository.interface'

/**
 * Integration test to verify that multiple components share the same queue instance
 * This tests the actual bug fix where controller and processor used different queues
 */
describe('PreviewQueueService Integration', () => {
  let mockRepository: PreviewRepositoryInterface

  beforeEach(() => {
    // Reset singleton instance before each test
    // @ts-expect-error - accessing private static member for testing
    PreviewQueueService.instance = null

    // Mock repository to avoid database dependency
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

  it('should share queue state between controller and processor instances', () => {
    // Simulate controller getting queue instance
    const controllerQueue = PreviewQueueService.getInstance(mockRepository)

    // Controller enqueues a job
    const job = {
      previewId: 'integration-test-id',
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

    controllerQueue.enqueue(job)

    // Simulate processor getting queue instance (without passing repository)
    const processorQueue = PreviewQueueService.getInstance()

    // Verify processor sees the job that controller added
    const stats = processorQueue.getQueueStats()
    expect(stats.queueLength).toBe(1)

    // Processor should be able to get the job
    const nextJob = processorQueue.getNextJob()
    expect(nextJob).toBeDefined()
    expect(nextJob?.previewId).toBe('integration-test-id')

    // After dequeueing, both should see empty queue
    const finalStats = controllerQueue.getQueueStats()
    expect(finalStats.queueLength).toBe(0)
  })

  it('should maintain processing state across instances', () => {
    const queue1 = PreviewQueueService.getInstance(mockRepository)

    // Mark a job as processing
    queue1.markProcessing('job-123')

    // Get another instance and verify processing state is shared
    const queue2 = PreviewQueueService.getInstance()
    const stats = queue2.getQueueStats()

    expect(stats.processing).toBe(1)

    // Complete the job in second instance
    queue2.markComplete('job-123')

    // Verify first instance sees the change
    const finalStats = queue1.getQueueStats()
    expect(finalStats.processing).toBe(0)
  })

  it('should handle job lifecycle correctly', () => {
    const queueService = PreviewQueueService.getInstance(mockRepository)

    // Step 1: Controller enqueues job
    const job = {
      previewId: 'lifecycle-test-id',
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
    expect(position).toBe(0)

    // Step 2: Processor gets next job
    const nextJob = queueService.getNextJob()
    expect(nextJob).toBeDefined()
    expect(nextJob?.previewId).toBe('lifecycle-test-id')

    // Queue should be empty after dequeue
    expect(queueService.getQueueStats().queueLength).toBe(0)

    // Step 3: Processor marks as processing
    queueService.markProcessing('lifecycle-test-id')
    expect(queueService.getQueueStats().processing).toBe(1)

    // Step 4: Processor marks as complete
    queueService.markComplete('lifecycle-test-id')
    expect(queueService.getQueueStats().processing).toBe(0)
  })

  it('should prevent getInstance without repository before initialization', () => {
    // This tests that we get a clear error if processor starts before controller
    expect(() => {
      PreviewQueueService.getInstance()
    }).toThrow('PreviewRepository is required for first initialization')
  })
})
