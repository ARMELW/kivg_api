import { IUseCase } from '@/domain/types/use-case.type'
import { ActivityType } from '@/infrastructure/config/activity.config'
import type { PreviewCacheService } from '@/application/services/preview-cache.service'
import type { PreviewQueueService } from '@/application/services/preview-queue.service'
import type { Scene } from '@/domain/models/scene.model'
import type { PreviewRepositoryInterface } from '@/domain/repositories/preview.repository.interface'

export interface PreviewOptions {
  quality?: 'draft' | 'standard' | 'high'
  aspectRatio?: '1:1' | '16:9' | '9:16'
  skipAudio?: boolean
}

type Params = {
  sceneId: string
  userId: string
  scene: Scene
  options?: PreviewOptions
}

type Response = {
  data: {
    previewId: string
    sceneId: string
    status: string
    progress: number
    queuePosition?: number
    cached?: boolean
    createdAt: string
  }
  success: boolean
  error?: string
}

export class CreatePreviewUseCase extends IUseCase<Params, Response> {
  constructor(
    private readonly previewRepository: PreviewRepositoryInterface,
    private readonly cacheService: PreviewCacheService,
    private readonly queueService: PreviewQueueService
  ) {
    super()
  }

  async execute(params: Params): Promise<Response> {
    try {
      const { sceneId, userId, scene, options = {} } = params

      // Check for existing cached preview
      const sceneHash = this.cacheService.calculateSceneHash(scene)
      const cachedPreview = await this.cacheService.findCachedPreview(sceneHash, userId)

      if (cachedPreview) {
        // Ensure date fields are Date objects (cached data may be strings from JSON)
        const createdAt =
          typeof cachedPreview.createdAt === 'string' ? new Date(cachedPreview.createdAt) : cachedPreview.createdAt
        return {
          success: true,
          data: {
            previewId: cachedPreview.id,
            sceneId: cachedPreview.sceneId,
            status: cachedPreview.status,
            progress: cachedPreview.progress,
            cached: true,
            createdAt: createdAt.toISOString()
          }
        }
      }

      // Check rate limits
      const rateLimitCheck = await this.queueService.checkRateLimits(userId)
      if (!rateLimitCheck.allowed) {
        return {
          success: false,
          error: rateLimitCheck.message || 'Rate limit exceeded',
          data: null as any
        }
      }

      // Create preview
      const preview = await this.previewRepository.create({
        sceneId,
        userId,
        currentStep: 'Queued',
        previewUrl: undefined,
        error: undefined
      })

      // Add to queue
      const queuePosition = this.queueService.enqueue({
        previewId: preview.id,
        userId,
        sceneId,
        sceneHash,
        createdAt: preview.createdAt,
        options: {
          quality: options.quality || 'standard',
          aspectRatio: options.aspectRatio || '16:9',
          skipAudio: options.skipAudio || false
        }
      })

      return {
        success: true,
        data: {
          previewId: preview.id,
          sceneId: preview.sceneId,
          status: preview.status,
          progress: preview.progress,
          queuePosition,
          createdAt: preview.createdAt.toISOString()
        }
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to create preview',
        data: null as any
      }
    }
  }

  log(): ActivityType {
    return ActivityType.TEST
  }
}
