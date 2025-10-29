import type { PreviewRepositoryInterface } from '@/domain/repositories/preview.repository.interface'
import type { SceneRepositoryInterface } from '@/domain/repositories/scene.repository.interface'
import type { CacheService } from './cache.service'
import type { PreviewQueueService } from './preview-queue.service'
import type { WhiteboardCliService } from './whiteboard-cli.service'

/**
 * Service to process preview generation jobs from the queue
 * Runs as a background worker/scheduler
 */
export class PreviewProcessorService {
  private isRunning = false
  private processingInterval: NodeJS.Timer | null = null
  private readonly PROCESS_INTERVAL = 2000 // Check queue every 2 seconds
  private readonly MAX_RETRIES = 3

  constructor(
    private readonly queueService: PreviewQueueService,
    private readonly previewRepository: PreviewRepositoryInterface,
    private readonly sceneRepository: SceneRepositoryInterface,
    private readonly cacheService: CacheService,
    private readonly whiteboardCliService: WhiteboardCliService
  ) {}

  /**
   * Start the processor (call this on app startup)
   */
  start(): void {
    if (this.isRunning) {
      console.warn('[PREVIEW PROCESSOR] ⚠️  Preview processor is already running')
      return
    }

    this.isRunning = true
    console.info('[PREVIEW PROCESSOR] 🚀 Starting preview processor...')
    console.info(`[PREVIEW PROCESSOR] ⏱️  Processing interval: every ${this.PROCESS_INTERVAL}ms`)

    // Check queue periodically
    this.processingInterval = setInterval(() => {
      console.info('[PREVIEW PROCESSOR] 🔄 Checking queue for jobs...')
      this.processNextJob().catch((error) => {
        console.error('[PREVIEW PROCESSOR] ❌ Error processing preview job:', error)
      })
    }, this.PROCESS_INTERVAL)

    console.info('[PREVIEW PROCESSOR] ✅ Preview processor started successfully')
  }

  /**
   * Stop the processor
   */
  stop(): void {
    if (!this.isRunning) {
      return
    }

    this.isRunning = false
    console.info('[PREVIEW PROCESSOR] 🛑 Stopping preview processor...')

    if (this.processingInterval) {
      clearInterval(this.processingInterval)
      this.processingInterval = null
    }
  }

  /**
   * Process the next job in queue
   */
  private async processNextJob(): Promise<void> {
    const job = this.queueService.getNextJob()
    if (!job) {
      // Queue is empty or at capacity, nothing to do
      return
    }

    const { previewId, sceneId, options } = job

    try {
      console.info(`[PREVIEW PROCESSOR] ▶️  Processing job: ${previewId}`)

      // Mark as processing
      this.queueService.markProcessing(previewId)

      // Update preview status
      console.info(`[PREVIEW PROCESSOR] 📝 Updating status to 'processing': ${previewId}`)
      await this.previewRepository.updateStatus(previewId, 'processing')
      await this.previewRepository.updateProgress(previewId, 10, 'Loading scene...')
      console.info(`[PREVIEW PROCESSOR] ✔️  Status updated, progress: 10%`)

      // Get scene
      console.info(`[PREVIEW PROCESSOR] 🔍 Fetching scene: ${sceneId}`)
      const scene = await this.sceneRepository.findById(sceneId)
      if (!scene) {
        throw new Error('Scene not found')
      }
      console.info(`[PREVIEW PROCESSOR] ✔️  Scene loaded`)

      // Generate config
      console.info(`[PREVIEW PROCESSOR] ⚙️  Generating whiteboard config...`)
      await this.previewRepository.updateProgress(previewId, 20, 'Generating config...')
      const config = this.whiteboardCliService.generateConfig(scene)
      console.info(`[PREVIEW PROCESSOR] ✔️  Config generated`)

      // Check if whiteboard CLI is available
      console.info(`[PREVIEW PROCESSOR] 🔎 Checking whiteboard CLI availability...`)
      const available = await this.whiteboardCliService.isAvailable()
      if (!available) {
        throw new Error('Whiteboard CLI is not available')
      }
      console.info(`[PREVIEW PROCESSOR] ✔️  Whiteboard CLI is available`)

      // Execute generation
      console.info(`[PREVIEW PROCESSOR] 🎬 Starting video rendering for ${previewId}...`)
      await this.previewRepository.updateProgress(previewId, 30, 'Starting rendering...')
      const outputPath = await this.whiteboardCliService.execute(config, options, (progress) => {
        console.info(`[PREVIEW PROCESSOR] 📊 Progress: ${progress.progress}% - ${progress.currentStep}`)
        this.previewRepository
          .updateProgress(previewId, 30 + (progress.progress * 0.7) / 100, progress.currentStep)
          .catch((error) => {
            console.error('[PREVIEW PROCESSOR] ❌ Error updating preview progress:', error)
          })
      })

      // Mark as completed
      console.info(`[PREVIEW PROCESSOR] 🎉 Video rendering complete: ${outputPath}`)
      await this.previewRepository.updateStatus(previewId, 'completed', outputPath)
      console.info(`[PREVIEW PROCESSOR] 📝 Status updated to 'completed'`)

      // Cache the preview
      console.info(`[PREVIEW PROCESSOR] 💾 Caching preview...`)
      const preview = await this.previewRepository.findById(previewId)
      if (preview) {
        const cacheKey = `preview:${previewId}:status`
        await this.cacheService.set(cacheKey, preview, 3600) // Cache for 1 hour
      }
      console.info(`[PREVIEW PROCESSOR] ✔️  Preview cached`)

      console.info(`[PREVIEW PROCESSOR] ✅ Preview ${previewId} generated successfully!`)
    } catch (error: any) {
      console.error(`[PREVIEW PROCESSOR] ❌ Failed to generate preview ${previewId}:`, error.message)

      // Update with error
      await this.previewRepository.updateStatus(previewId, 'failed', undefined, error.message || 'Unknown error')
      console.info(`[PREVIEW PROCESSOR] 📝 Status updated to 'failed' with error message`)
    } finally {
      // Mark as not processing
      this.queueService.markComplete(previewId)
    }
  }
}
