import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ExportRepository } from '@/infrastructure/repositories/export.repository'
import { ExportCleanupService } from './export-cleanup.service'

// Mock the repository
vi.mock('@/infrastructure/repositories/export.repository')
vi.mock('@/infrastructure/config/upload.config')

describe('Export Cleanup Service', () => {
  let cleanupService: ExportCleanupService
  let mockRepository: any

  beforeEach(() => {
    mockRepository = {
      findAll: vi.fn(),
      delete: vi.fn()
    }

    vi.mocked(ExportRepository).mockImplementation(() => mockRepository)
    cleanupService = new ExportCleanupService()
  })

  describe('cleanupOldExports', () => {
    it('should delete exports older than specified days', async () => {
      const oldDate = new Date()
      oldDate.setDate(oldDate.getDate() - 35) // 35 days old

      const mockExports = {
        exports: [
          {
            id: 'export-1',
            status: 'completed',
            completedAt: oldDate,
            videoUrl: 'https://example.com/video1.mp4'
          },
          {
            id: 'export-2',
            status: 'completed',
            completedAt: new Date(), // Recent
            videoUrl: 'https://example.com/video2.mp4'
          }
        ],
        total: 2
      }

      mockRepository.findAll.mockResolvedValue(mockExports)
      mockRepository.delete.mockResolvedValue(true)

      const result = await cleanupService.cleanupOldExports(30)

      expect(result.deleted).toBeGreaterThan(0)
      expect(mockRepository.delete).toHaveBeenCalled()
    })

    it('should handle errors gracefully', async () => {
      mockRepository.findAll.mockRejectedValue(new Error('Database error'))

      await expect(cleanupService.cleanupOldExports(30)).rejects.toThrow()
    })

    it('should not delete recent exports', async () => {
      const recentDate = new Date()

      const mockExports = {
        exports: [
          {
            id: 'export-1',
            status: 'completed',
            completedAt: recentDate,
            videoUrl: 'https://example.com/video1.mp4'
          }
        ],
        total: 1
      }

      mockRepository.findAll.mockResolvedValue(mockExports)
      mockRepository.delete.mockResolvedValue(true)

      const result = await cleanupService.cleanupOldExports(30)

      expect(result.deleted).toBe(0)
    })
  })

  describe('cleanupFailedExports', () => {
    it('should delete failed exports older than specified days', async () => {
      const oldDate = new Date()
      oldDate.setDate(oldDate.getDate() - 10) // 10 days old

      const mockExports = {
        exports: [
          {
            id: 'export-1',
            status: 'failed',
            createdAt: oldDate
          },
          {
            id: 'export-2',
            status: 'failed',
            createdAt: new Date() // Recent
          }
        ],
        total: 2
      }

      mockRepository.findAll.mockResolvedValue(mockExports)
      mockRepository.delete.mockResolvedValue(true)

      const result = await cleanupService.cleanupFailedExports(7)

      expect(result.deleted).toBeGreaterThan(0)
      expect(mockRepository.delete).toHaveBeenCalled()
    })

    it('should handle cleanup errors and continue', async () => {
      const oldDate = new Date()
      oldDate.setDate(oldDate.getDate() - 10)

      const mockExports = {
        exports: [
          { id: 'export-1', status: 'failed', createdAt: oldDate },
          { id: 'export-2', status: 'failed', createdAt: oldDate }
        ],
        total: 2
      }

      mockRepository.findAll.mockResolvedValue(mockExports)
      mockRepository.delete.mockRejectedValueOnce(new Error('Delete failed')).mockResolvedValueOnce(true)

      const result = await cleanupService.cleanupFailedExports(7)

      expect(result.errors).toBeGreaterThan(0)
      expect(result.deleted).toBeGreaterThan(0)
    })
  })
})
