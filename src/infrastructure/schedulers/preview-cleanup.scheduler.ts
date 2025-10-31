import { PreviewCleanupService } from '@/application/services/preview-cleanup.service'
import { PreviewRepository } from '@/infrastructure/repositories/preview.repository'

export class PreviewCleanupScheduler {
  private cleanupService: PreviewCleanupService
  private intervalId: NodeJS.Timeout | null = null
  private readonly CLEANUP_INTERVAL = 60 * 60 * 1000 // 1 hour

  constructor() {
    const previewRepository = new PreviewRepository()
    this.cleanupService = new PreviewCleanupService(previewRepository)
  }

  /**
   * Start the cleanup scheduler
   */
  start(): void {
    if (this.intervalId) {
      console.warn('Preview cleanup scheduler is already running')
      return
    }

    // console.info('Starting preview cleanup scheduler...')

    // Run immediately on start
    this.runCleanup().catch(console.error)

    // Then run every hour
    this.intervalId = setInterval(() => {
      this.runCleanup().catch(console.error)
    }, this.CLEANUP_INTERVAL)

    // console.info(`Preview cleanup scheduler started. Will run every ${this.CLEANUP_INTERVAL / 1000 / 60} minutes.`)
  }

  /**
   * Stop the cleanup scheduler
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
      // console.info('Preview cleanup scheduler stopped.')
    }
  }

  /**
   * Run cleanup tasks
   */
  private async runCleanup(): Promise<void> {
    const startTime = Date.now()
    // console.info('[Preview Cleanup] Starting cleanup tasks...')

    try {
      // Clean up expired previews
      const expiredStats = await this.cleanupService.cleanupExpiredPreviews()
      console.info(
        `[Preview Cleanup] Expired previews: ${expiredStats.deletedPreviews} deleted, ${expiredStats.freedSpace} bytes freed`
      )

      // Clean up orphaned previews
      const orphanedStats = await this.cleanupService.cleanupOrphanedPreviews()
      console.info(
        `[Preview Cleanup] Orphaned previews: ${orphanedStats.deletedPreviews} deleted, ${orphanedStats.freedSpace} bytes freed`
      )

      const totalTime = Date.now() - startTime
      console.info(`[Preview Cleanup] Cleanup completed in ${totalTime}ms`)
    } catch (error) {
      console.error('[Preview Cleanup] Error during cleanup:', error)
    }
  }

  /**
   * Manually trigger cleanup
   */
  async triggerCleanup(): Promise<void> {
    await this.runCleanup()
  }
}
