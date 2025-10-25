import { deleteFile } from '@/infrastructure/config/upload.config'
import { ExportRepository } from '@/infrastructure/repositories/export.repository'

export class ExportCleanupService {
  private exportRepository: ExportRepository

  constructor() {
    this.exportRepository = new ExportRepository()
  }

  /**
   * Delete old completed exports (older than X days)
   */
  async cleanupOldExports(daysOld = 30): Promise<{ deleted: number; errors: number }> {
    try {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - daysOld)

      console.info(`Starting cleanup of exports older than ${daysOld} days (before ${cutoffDate.toISOString()})`)

      // NOTE: Current implementation has limitations:
      // - Empty userId means this won't work in production without repository enhancement
      // - Limited to 1000 exports - should implement proper pagination
      // TODO: Add a system-level method to ExportRepository for admin operations
      const allExports = await this.exportRepository.findAll({
        userId: '', // This would need to be enhanced to get all users' exports
        skip: 0,
        limit: 1000,
        status: 'completed'
      })

      let deleted = 0
      let errors = 0

      for (const exp of allExports.exports) {
        try {
          const completedAt = exp.completedAt ? new Date(exp.completedAt) : null

          if (completedAt && completedAt < cutoffDate) {
            // Delete video file if it exists
            if (exp.videoUrl) {
              try {
                // Extract public_id from URL and delete
                const publicId = this.extractPublicId(exp.videoUrl)
                if (publicId) {
                  await deleteFile(publicId)
                }
              } catch (error) {
                console.error(`Failed to delete file for export ${exp.id}:`, error)
              }
            }

            // Delete export record
            await this.exportRepository.delete(exp.id)
            deleted++

            console.info(`Deleted old export: ${exp.id} (completed at ${completedAt.toISOString()})`)
          }
        } catch (error) {
          console.error(`Error cleaning up export ${exp.id}:`, error)
          errors++
        }
      }

      console.info(`Cleanup completed: ${deleted} exports deleted, ${errors} errors`)

      return { deleted, errors }
    } catch (error) {
      console.error('Export cleanup failed:', error)
      throw error
    }
  }

  /**
   * Delete failed exports (older than X days)
   */
  async cleanupFailedExports(daysOld = 7): Promise<{ deleted: number; errors: number }> {
    try {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - daysOld)

      console.info(`Starting cleanup of failed exports older than ${daysOld} days`)

      const allExports = await this.exportRepository.findAll({
        userId: '',
        skip: 0,
        limit: 1000,
        status: 'failed'
      })

      let deleted = 0
      let errors = 0

      for (const exp of allExports.exports) {
        try {
          const createdAt = new Date(exp.createdAt)

          if (createdAt < cutoffDate) {
            await this.exportRepository.delete(exp.id)
            deleted++
            console.info(`Deleted failed export: ${exp.id}`)
          }
        } catch (error) {
          console.error(`Error cleaning up failed export ${exp.id}:`, error)
          errors++
        }
      }

      console.info(`Failed exports cleanup completed: ${deleted} deleted, ${errors} errors`)

      return { deleted, errors }
    } catch (error) {
      console.error('Failed exports cleanup error:', error)
      throw error
    }
  }

  /**
   * Extract public_id from file URL
   */
  private extractPublicId(url: string): string | null {
    try {
      // This is a simple extraction - adjust based on your storage provider
      const parts = url.split('/')
      const filename = parts.at(-1)
      if (!filename) return null
      return filename.split('.')[0]
    } catch {
      return null
    }
  }
}
