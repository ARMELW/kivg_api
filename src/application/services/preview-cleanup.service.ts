import type { PreviewRepositoryInterface } from '@/domain/repositories/preview.repository.interface'
import { StorageService } from './storage.service'

export interface CleanupStats {
  deletedPreviews: number
  deletedFiles: number
  freedSpace: number
}

const CLEANUP_STRATEGY = {
  draftPreviews: 1 * 24 * 60 * 60 * 1000, // 1 day
  standardPreviews: 7 * 24 * 60 * 60 * 1000, // 7 days
  highPreviews: 30 * 24 * 60 * 60 * 1000, // 30 days
  failedPreviews: 3 * 24 * 60 * 60 * 1000, // 3 days
  cancelledPreviews: 1 * 24 * 60 * 60 * 1000 // 1 day
}

export class PreviewCleanupService {
  private storageService: StorageService

  constructor(private readonly previewRepository: PreviewRepositoryInterface) {
    this.storageService = new StorageService()
  }

  /**
   * Clean up expired previews based on quality and status
   */
  async cleanupExpiredPreviews(): Promise<CleanupStats> {
    const now = new Date()
    let deletedPreviews = 0
    let deletedFiles = 0
    let freedSpace = 0

    // Clean up failed previews older than 3 days
    const failedCutoff = new Date(now.getTime() - CLEANUP_STRATEGY.failedPreviews)
    const failedPreviews = await this.findExpiredPreviews('failed', failedCutoff)
    for (const preview of failedPreviews) {
      await this.deletePreview(preview.id, preview.previewUrl)
      deletedPreviews++
    }

    // Clean up cancelled previews older than 1 day
    const cancelledCutoff = new Date(now.getTime() - CLEANUP_STRATEGY.cancelledPreviews)
    const cancelledPreviews = await this.findExpiredPreviews('cancelled', cancelledCutoff)
    for (const preview of cancelledPreviews) {
      await this.deletePreview(preview.id, preview.previewUrl)
      deletedPreviews++
    }

    // Clean up completed previews based on quality
    // Note: Would need to add quality field to preview model to implement this fully
    const standardCutoff = new Date(now.getTime() - CLEANUP_STRATEGY.standardPreviews)
    const expiredCompleted = await this.findExpiredPreviews('completed', standardCutoff)
    for (const preview of expiredCompleted) {
      if (preview.previewUrl) {
        const size = await this.deletePreviewFile(preview.previewUrl)
        freedSpace += size
        deletedFiles++
      }
      await this.previewRepository.delete(preview.id)
      deletedPreviews++
    }

    return {
      deletedPreviews,
      deletedFiles,
      freedSpace
    }
  }

  /**
   * Clean up orphaned previews (scene deleted)
   */
  async cleanupOrphanedPreviews(): Promise<CleanupStats> {
    // This would require checking if the scene still exists
    // For now, return empty stats
    // TODO: Implement orphaned preview detection
    await Promise.resolve()
    return {
      deletedPreviews: 0,
      deletedFiles: 0,
      freedSpace: 0
    }
  }

  /**
   * Delete old previews older than specified days
   */
  async deleteOlderThan(days: number): Promise<CleanupStats> {
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    const expiredPreviews = await this.findExpiredPreviews(undefined, cutoffDate)

    let deletedPreviews = 0
    let deletedFiles = 0
    let freedSpace = 0

    for (const preview of expiredPreviews) {
      if (preview.previewUrl) {
        const size = await this.deletePreviewFile(preview.previewUrl)
        freedSpace += size
        deletedFiles++
      }
      await this.previewRepository.delete(preview.id)
      deletedPreviews++
    }

    return {
      deletedPreviews,
      deletedFiles,
      freedSpace
    }
  }

  /**
   * Get storage usage statistics
   */
  async getStorageStats(): Promise<{
    totalPreviews: number
    totalSize: number
    byStatus: Record<string, number>
  }> {
    // Placeholder implementation
    // Would need to aggregate preview data
    await Promise.resolve()
    return {
      totalPreviews: 0,
      totalSize: 0,
      byStatus: {}
    }
  }

  private async findExpiredPreviews(
    _status: string | undefined,
    _cutoffDate: Date
  ): Promise<Array<{ id: string; previewUrl?: string }>> {
    // Note: This is a simplified implementation
    // Would need to add proper date filtering to repository
    await Promise.resolve()
    return []
  }

  private async deletePreview(previewId: string, previewUrl?: string): Promise<void> {
    if (previewUrl) {
      await this.deletePreviewFile(previewUrl)
    }
    await this.previewRepository.delete(previewId)
  }

  private async deletePreviewFile(previewUrl: string): Promise<number> {
    try {
      // Extract file path from URL
      const urlParts = previewUrl.split('/')
      const filename = urlParts.at(-1)!

      // Get file size before deletion
      const metadata = await this.storageService.getFileMetadata('previews', filename)
      const size = metadata?.size || 0

      // Delete file
      await this.storageService.deleteFile('previews', filename)

      return size
    } catch (error) {
      console.error(`Failed to delete preview file ${previewUrl}:`, error)
      return 0
    }
  }
}
