import { readFile } from 'node:fs/promises'
import type { PreviewRepositoryInterface } from '@/domain/repositories/preview.repository.interface'
import type { SceneRepository } from '@/infrastructure/repositories/scene.repository'
import { CacheService } from './cache.service'
import { StorageService } from './storage.service'
import { WhiteboardCliService } from './whiteboard-cli.service'
import type { PreviewJob } from './preview-queue.service'

export class PreviewGenerationService {
  private whiteboardService: WhiteboardCliService
  private storageService: StorageService
  private cacheService: CacheService

  constructor(
    private readonly previewRepository: PreviewRepositoryInterface,
    private readonly sceneRepository: SceneRepository
  ) {
    this.whiteboardService = new WhiteboardCliService()
    this.storageService = new StorageService()
    this.cacheService = new CacheService()
  }

  /**
   * Process a preview generation job
   */
  async processPreviewGeneration(job: PreviewJob): Promise<void> {
    const { previewId, sceneId, options } = job

    try {
      // Update status to processing
      await this.previewRepository.updateStatus(previewId, 'processing')
      await this.updateProgress(previewId, 0, 'Initializing...')

      // Check if whiteboard-cli is available
      const isAvailable = await this.whiteboardService.isAvailable()
      if (!isAvailable) {
        throw new Error('Whiteboard CLI is not available. Please install whiteboard-it.')
      }

      // Fetch scene data
      await this.updateProgress(previewId, 5, 'Fetching scene data...')
      const scene = await this.sceneRepository.findById(sceneId)
      if (!scene) {
        throw new Error('Scene not found')
      }

      // Generate whiteboard config
      await this.updateProgress(previewId, 10, 'Preparing configuration...')
      const config = this.whiteboardService.generateConfig(scene)

      // TODO: Download scene assets if needed
      await this.updateProgress(previewId, 20, 'Preparing assets...')

      // Generate video
      await this.updateProgress(previewId, 30, 'Generating video...')
      const videoPath = await this.whiteboardService.execute(config, options, (progress) => {
        this.updateProgress(previewId, 30 + Math.floor(progress.progress * 0.6), progress.currentStep).catch(
          console.error
        )
      })

      // Upload to storage
      await this.updateProgress(previewId, 90, 'Uploading preview...')
      const videoBuffer = await readFile(videoPath)
      const uploadResult = await this.storageService.uploadFile(videoBuffer, `preview_${previewId}.mp4`, {
        bucket: 'EXPORTS',
        contentType: 'video/mp4',
        metadata: {
          previewId,
          sceneId,
          quality: options.quality
        }
      })

      // Mark as completed
      await this.updateProgress(previewId, 100, 'Completed')
      await this.previewRepository.updateStatus(previewId, 'completed', uploadResult.url)

      // Invalidate cache
      await this.cacheService.delete(`preview:${previewId}:status`)
    } catch (error: any) {
      console.error(`Preview generation failed for ${previewId}:`, error)
      await this.previewRepository.updateStatus(previewId, 'failed', undefined, error.message)
      await this.cacheService.delete(`preview:${previewId}:status`)
    }
  }

  /**
   * Update preview progress
   */
  private async updateProgress(previewId: string, progress: number, currentStep: string): Promise<void> {
    await this.previewRepository.updateProgress(previewId, progress, currentStep)

    // Update cache
    const preview = await this.previewRepository.findById(previewId)
    if (preview) {
      await this.cacheService.set(`preview:${previewId}:status`, preview, 300)
    }
  }
}
