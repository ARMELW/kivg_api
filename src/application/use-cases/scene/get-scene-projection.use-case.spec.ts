import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { PreviewRepositoryInterface } from '@/domain/repositories/preview.repository.interface'
import { GetSceneProjectionUseCase } from './get-scene-projection.use-case'

describe('GetSceneProjectionUseCase', () => {
  let useCase: GetSceneProjectionUseCase
  let mockPreviewRepository: PreviewRepositoryInterface

  beforeEach(() => {
    mockPreviewRepository = {
      findById: vi.fn(),
      findAll: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      updateProgress: vi.fn(),
      updateStatus: vi.fn()
    }
    useCase = new GetSceneProjectionUseCase(mockPreviewRepository)
  })

  describe('when no previews exist', () => {
    it('should return status "none" when no previews exist for the scene', async () => {
      ;(mockPreviewRepository.findAll as any).mockResolvedValue({
        previews: [],
        total: 0
      })

      const result = await useCase.execute({
        sceneId: 'scene-123',
        userId: 'user-456'
      })

      expect(result.success).toBe(true)
      expect(result.data).toEqual({
        sceneId: 'scene-123',
        status: 'none',
        progress: 0
      })
      expect(mockPreviewRepository.findAll).toHaveBeenCalledWith({
        userId: 'user-456',
        sceneId: 'scene-123',
        limit: 10
      })
    })
  })

  describe('when previews exist', () => {
    it('should return the most recent completed preview when available', async () => {
      const mockPreviews = [
        {
          id: 'preview-completed',
          sceneId: 'scene-123',
          userId: 'user-456',
          status: 'completed' as const,
          progress: 100,
          currentStep: undefined,
          previewUrl: 'https://example.com/preview-3.mp4',
          error: undefined,
          createdAt: new Date('2025-10-31T10:00:00Z'),
          completedAt: new Date('2025-10-31T10:05:00Z')
        },
        {
          id: 'preview-processing',
          sceneId: 'scene-123',
          userId: 'user-456',
          status: 'processing' as const,
          progress: 50,
          currentStep: 'Generating video',
          previewUrl: undefined,
          error: undefined,
          createdAt: new Date('2025-10-31T09:00:00Z'),
          completedAt: undefined
        }
      ]

      ;(mockPreviewRepository.findAll as any).mockResolvedValue({
        previews: mockPreviews,
        total: 2
      })

      const result = await useCase.execute({
        sceneId: 'scene-123',
        userId: 'user-456'
      })

      expect(result.success).toBe(true)
      expect(result.data).toEqual({
        previewId: 'preview-completed',
        sceneId: 'scene-123',
        status: 'completed',
        progress: 100,
        currentStep: undefined,
        previewUrl: 'https://example.com/preview-3.mp4',
        error: undefined,
        createdAt: '2025-10-31T10:00:00.000Z',
        completedAt: '2025-10-31T10:05:00.000Z'
      })
    })

    it('should return the most recent preview when no completed previews exist', async () => {
      const mockPreviews = [
        {
          id: 'preview-processing',
          sceneId: 'scene-123',
          userId: 'user-456',
          status: 'processing' as const,
          progress: 75,
          currentStep: 'Rendering scene',
          previewUrl: undefined,
          error: undefined,
          createdAt: new Date('2025-10-31T10:00:00Z'),
          completedAt: undefined
        },
        {
          id: 'preview-queued',
          sceneId: 'scene-123',
          userId: 'user-456',
          status: 'queued' as const,
          progress: 0,
          currentStep: undefined,
          previewUrl: undefined,
          error: undefined,
          createdAt: new Date('2025-10-31T09:00:00Z'),
          completedAt: undefined
        }
      ]

      ;(mockPreviewRepository.findAll as any).mockResolvedValue({
        previews: mockPreviews,
        total: 2
      })

      const result = await useCase.execute({
        sceneId: 'scene-123',
        userId: 'user-456'
      })

      expect(result.success).toBe(true)
      expect(result.data).toEqual({
        previewId: 'preview-processing',
        sceneId: 'scene-123',
        status: 'processing',
        progress: 75,
        currentStep: 'Rendering scene',
        previewUrl: undefined,
        error: undefined,
        createdAt: '2025-10-31T10:00:00.000Z',
        completedAt: undefined
      })
    })

    it('should prioritize completed previews with previewUrl', async () => {
      const mockPreviews = [
        {
          id: 'preview-completed-with-url',
          sceneId: 'scene-123',
          userId: 'user-456',
          status: 'completed' as const,
          progress: 100,
          currentStep: undefined,
          previewUrl: 'https://example.com/preview-1.mp4',
          error: undefined,
          createdAt: new Date('2025-10-31T10:00:00Z'),
          completedAt: new Date('2025-10-31T10:05:00Z')
        },
        {
          id: 'preview-completed-no-url',
          sceneId: 'scene-123',
          userId: 'user-456',
          status: 'completed' as const,
          progress: 100,
          currentStep: undefined,
          previewUrl: undefined,
          error: undefined,
          createdAt: new Date('2025-10-31T09:00:00Z'),
          completedAt: new Date('2025-10-31T09:05:00Z')
        }
      ]

      ;(mockPreviewRepository.findAll as any).mockResolvedValue({
        previews: mockPreviews,
        total: 2
      })

      const result = await useCase.execute({
        sceneId: 'scene-123',
        userId: 'user-456'
      })

      expect(result.success).toBe(true)
      expect(result.data?.previewId).toBe('preview-completed-with-url')
      expect(result.data?.previewUrl).toBe('https://example.com/preview-1.mp4')
    })

    it('should return failed preview with error message', async () => {
      const mockPreviews = [
        {
          id: 'preview-failed',
          sceneId: 'scene-123',
          userId: 'user-456',
          status: 'failed' as const,
          progress: 50,
          currentStep: 'Rendering failed',
          previewUrl: undefined,
          error: 'Timeout during rendering',
          createdAt: new Date('2025-10-31T10:00:00Z'),
          completedAt: undefined
        }
      ]

      ;(mockPreviewRepository.findAll as any).mockResolvedValue({
        previews: mockPreviews,
        total: 1
      })

      const result = await useCase.execute({
        sceneId: 'scene-123',
        userId: 'user-456'
      })

      expect(result.success).toBe(true)
      expect(result.data?.status).toBe('failed')
      expect(result.data?.error).toBe('Timeout during rendering')
    })
  })

  describe('error handling', () => {
    it('should handle repository errors gracefully', async () => {
      ;(mockPreviewRepository.findAll as any).mockRejectedValue(new Error('Database connection failed'))

      const result = await useCase.execute({
        sceneId: 'scene-123',
        userId: 'user-456'
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Database connection failed')
      expect(result.data).toBeNull()
    })

    it('should handle generic errors', async () => {
      ;(mockPreviewRepository.findAll as any).mockRejectedValue('Unknown error')

      const result = await useCase.execute({
        sceneId: 'scene-123',
        userId: 'user-456'
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Failed to get scene projection')
      expect(result.data).toBeNull()
    })
  })
})
