import type { PreviewRepositoryInterface } from '@/domain/repositories/preview.repository.interface'
import { StorageService } from './storage.service'

export interface CleanupStats {
  deletedPreviews: number
  deletedFiles: number
  freedSpace: number
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
    // Placeholder implementation
    // Would need to add proper date filtering to repository
    await Promise.resolve()
    return {
      deletedPreviews: 0,
      deletedFiles: 0,
      freedSpace: 0
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
  async deleteOlderThan(): Promise<CleanupStats> {
    // Placeholder implementation
    // Would need to add proper date filtering to repository
    await Promise.resolve()
    return {
      deletedPreviews: 0,
      deletedFiles: 0,
      freedSpace: 0
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

  private async findExpiredPreviews(): Promise<Array<{ id: string; previewUrl?: string }>> {
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
