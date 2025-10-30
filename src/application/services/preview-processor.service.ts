import type { PreviewRepositoryInterface } from '@/domain/repositories/preview.repository.interface'
import type { SceneRepositoryInterface } from '@/domain/repositories/scene.repository.interface'
import type { CacheService } from './cache.service'
import type { PreviewQueueService } from './preview-queue.service'
import type { WhiteboardCliService } from './whiteboard-cli.service'

// Top-level job type (must not be declared inside the class)
type PreviewJob = {
  previewId: string
  sceneId: string
  options?: {
    quality?: 'preview' | 'draft' | 'standard' | 'high'
    aspectRatio?: '1:1' | '16:9' | '9:16'
    skipAudio?: boolean
  }
}

/**
 * Service to process preview generation jobs from the queue
 * Runs as a background worker/scheduler
 */
export class PreviewProcessorService {
  private isRunning = false
  // use ReturnType<typeof setInterval> for platform compatibility
  private processingInterval: ReturnType<typeof setInterval> | null = null
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
      //  console.warn('[PREVIEW PROCESSOR] ⚠️  Preview processor is already running')
      return
    }

    this.isRunning = true
    // console.info('[PREVIEW PROCESSOR] 🚀 Starting preview processor...')
    // console.info(`[PREVIEW PROCESSOR] ⏱️  Processing interval: every ${this.PROCESS_INTERVAL}ms`)

    // Periodically try to process next job
    this.processingInterval = setInterval(() => {
      this.processNextJob().catch((error) => {
        console.error('[PREVIEW PROCESSOR] ❌ Error while processing job:', error)
      })
    }, this.PROCESS_INTERVAL)

    // console.info('[PREVIEW PROCESSOR] ✅ Preview processor started successfully')
  }

  /**
   * Stop the processor
   */
  stop(): void {
    if (!this.isRunning) {
      return
    }

    this.isRunning = false
    // console.info('[PREVIEW PROCESSOR] 🛑 Stopping preview processor...')

    if (this.processingInterval) {
      clearInterval(this.processingInterval)
      this.processingInterval = null
    }
  }

  /**
   * Process the next job in queue
   */
  async processNextJob(job?: PreviewJob): Promise<void> {
    // If no job passed, try to retrieve one from the queue service using common method names.
    if (!job) {
      // Try common method names on the queue service without assuming a strict interface
      const maybeGetters = [
        // common method names: getNextJob, getNext, dequeue, pop, peek
        'getNextJob',
        'getNext',
        'dequeue',
        'pop',
        'peek'
      ]

      for (const fnName of maybeGetters) {
        // @ts-expect-error dynamic lookup
        const fn = (this.queueService as any)[fnName]
        if (typeof fn === 'function') {
          // support both sync and async getters
          // @ts-expect-error dynamic call
          const result = fn.call(this.queueService)
          job = result instanceof Promise ? await result : result
          if (job) break
        }
      }

      if (!job) {
        // console.info('[PREVIEW PROCESSOR] ℹ️  No job available in queue, skipping iteration')
        return
      }
    }

    const { previewId, sceneId, options } = job

    // helper to call possibly-absent or possibly-async methods on queueService
    const callMaybeAsync = async (obj: any, fnName: string, ...args: any[]) => {
      const fn = obj?.[fnName]
      if (typeof fn === 'function') {
        const res = fn.apply(obj, args)
        if (res instanceof Promise) await res
      }
    }

    try {
      // console.info(`[PREVIEW PROCESSOR] ▶️  Processing job: ${previewId}`)

      // Mark as processing (if method exists)
      await callMaybeAsync(this.queueService, 'markProcessing', previewId)

      // Update preview status
      // console.info(`[PREVIEW PROCESSOR] 📝 Updating status to 'processing': ${previewId}`)
      await this.previewRepository.updateStatus(previewId, 'processing')
      await this.previewRepository.updateProgress(previewId, 10, 'Loading scene...')
      // console.info(`[PREVIEW_PROCESSOR] ✔️  Status updated, progress: 10%`)

      // Get scene
      // console.info(`[PREVIEW PROCESSOR] 🔍 Fetching scene: ${sceneId}`)
      const scene = await this.sceneRepository.findById(sceneId)
      if (!scene) {
        throw new Error('Scene not found')
      }
      // console.info(`[PREVIEW_PROCESSOR] ✔️  Scene loaded`)

      // Generate config
      // console.info(`[PREVIEW_PROCESSOR] ⚙️  Generating whiteboard config...`)
      await this.previewRepository.updateProgress(previewId, 20, 'Generating config...')
      const config = this.whiteboardCliService.generateConfig(scene)
      // console.info(`[PREVIEW_PROCESSOR] ✔️  Config generated`,config)

      // Check if whiteboard CLI is available
      // console.info(`[PREVIEW_PROCESSOR] 🔎 Checking whiteboard CLI availability...`)
      const available = await this.whiteboardCliService.isAvailable()
      if (!available) {
        throw new Error('Whiteboard CLI is not available')
      }
      // console.info(`[PREVIEW_PROCESSOR] ✔️  Whiteboard CLI is available`)

      // Execute generation
      // console.info(`[PREVIEW_PROCESSOR] 🎬 Starting video rendering for ${previewId}...`)
      await this.previewRepository.updateProgress(previewId, 30, 'Starting rendering...')
      const whiteboardOptions: any = options || { quality: 'standard', aspectRatio: '16:9' }
      const outputPath = await this.whiteboardCliService.execute(
        config,
        whiteboardOptions,
        (progress: { progress: number; currentStep: string }) => {
          // console.info(`[PREVIEW_PROCESSOR] 📊 Progress: ${progress.progress}% - ${progress.currentStep}`)
          this.previewRepository
            .updateProgress(previewId, 30 + (progress.progress * 0.7) / 100, progress.currentStep)
            .catch((error) => {
              console.error('[PREVIEW PROCESSOR] ❌ Error updating preview progress:', error)
            })
        }
      )

      // Mark as completed
      // console.info(`[PREVIEW_PROCESSOR] 🎉 Video rendering complete: ${outputPath}`)
      await this.previewRepository.updateStatus(previewId, 'completed', outputPath)
      // console.info(`[PREVIEW_PROCESSOR] 📝 Status updated to 'completed'`)

      // Cache the preview
      // console.info(`[PREVIEW_PROCESSOR] 💾 Caching preview...`)
      const preview = await this.previewRepository.findById(previewId)
      if (preview) {
        const cacheKey = `preview:${previewId}:status`
        await this.cacheService.set(cacheKey, preview, 3600) // Cache for 1 hour
      }
      // console.info(`[PREVIEW_PROCESSOR] ✔️  Preview cached`)

      // console.info(`[PREVIEW_PROCESSOR] ✅ Preview ${previewId} generated successfully!`)
    } catch (error: any) {
      console.error(`[PREVIEW_PROCESSOR] ❌ Failed to generate preview ${previewId}:`, error?.message || error)

      // Update with error
      await this.previewRepository.updateStatus(previewId, 'failed', undefined, error?.message || 'Unknown error')
      // console.info(`[PREVIEW_PROCESSOR] 📝 Status updated to 'failed' with error message`)
    } finally {
      // Mark as not processing (if method exists)
      await callMaybeAsync(this.queueService, 'markComplete', previewId)
    }
  }
}
