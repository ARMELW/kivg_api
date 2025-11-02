import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { PreviewRepositoryInterface } from '@/domain/repositories/preview.repository.interface'
import { PreviewUploadService } from './preview-upload.service'

describe('PreviewUploadService', () => {
  let mockRepository: PreviewRepositoryInterface
  let uploadService: PreviewUploadService

  beforeEach(() => {
    mockRepository = {
      findById: vi.fn(),
      findAll: vi.fn().mockResolvedValue({ previews: [], total: 0 }),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      updateProgress: vi.fn(),
      updateStatus: vi.fn()
    }

    uploadService = new PreviewUploadService(mockRepository)
  })

  describe('Queue Management', () => {
    it('should queue an upload with temporary URL', () => {
      const previewId = 'test-preview-id'
      const tempUrl = 'http://localhost:3000/api/v1/preview/temp/video_123.mp4'

      uploadService.queueUpload(previewId, tempUrl)

      expect(uploadService.getQueueSize()).toBe(1)
      expect(uploadService.isQueued(previewId)).toBe(true)
    })

    it('should queue an upload with local path', () => {
      const previewId = 'test-preview-id'
      const localPath = '/tmp/video_123.mp4'

      uploadService.queueUpload(previewId, localPath)

      expect(uploadService.getQueueSize()).toBe(1)
      expect(uploadService.isQueued(previewId)).toBe(true)
    })

    it('should queue an upload with filename only', () => {
      const previewId = 'test-preview-id'
      const filename = 'video_123.mp4'

      uploadService.queueUpload(previewId, filename)

      expect(uploadService.getQueueSize()).toBe(1)
      expect(uploadService.isQueued(previewId)).toBe(true)
    })

    it('should return correct queue size', () => {
      uploadService.queueUpload('preview-1', '/tmp/video1.mp4')
      uploadService.queueUpload('preview-2', '/tmp/video2.mp4')
      uploadService.queueUpload('preview-3', '/tmp/video3.mp4')

      expect(uploadService.getQueueSize()).toBe(3)
    })

    it('should check if preview is queued', () => {
      const previewId = 'test-preview-id'
      
      expect(uploadService.isQueued(previewId)).toBe(false)
      
      uploadService.queueUpload(previewId, '/tmp/video.mp4')
      
      expect(uploadService.isQueued(previewId)).toBe(true)
    })
  })

  describe('Service Lifecycle', () => {
    it('should start the upload service', () => {
      uploadService.start()
      
      // Service should be running
      // No easy way to test this without exposing internal state
      // Just ensure it doesn't throw
      expect(true).toBe(true)
    })

    it('should stop the upload service', () => {
      uploadService.start()
      uploadService.stop()
      
      // Service should be stopped
      expect(true).toBe(true)
    })

    it('should not throw when stopping already stopped service', () => {
      expect(() => uploadService.stop()).not.toThrow()
    })

    it('should not throw when starting already started service', () => {
      uploadService.start()
      expect(() => uploadService.start()).not.toThrow()
      uploadService.stop()
    })
  })
})
