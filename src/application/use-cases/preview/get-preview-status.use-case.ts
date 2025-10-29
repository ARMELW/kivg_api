import { IUseCase } from '@/domain/types/use-case.type'
import { ActivityType } from '@/infrastructure/config/activity.config'
import type { CacheService } from '@/application/services/cache.service'
import type { Preview } from '@/domain/models/preview.model'
import type { PreviewRepositoryInterface } from '@/domain/repositories/preview.repository.interface'

type Params = {
  previewId: string
  userId: string
}

type Response = {
  data: {
    previewId: string
    sceneId: string
    status: string
    progress: number
    currentStep?: string
    previewUrl?: string
    error?: string
    createdAt: string
    completedAt?: string
  } | null
  success: boolean
  error?: string
}

export class GetPreviewStatusUseCase extends IUseCase<Params, Response> {
  constructor(
    private readonly previewRepository: PreviewRepositoryInterface,
    private readonly cacheService: CacheService
  ) {
    super()
  }

  async execute(params: Params): Promise<Response> {
    try {
      const { previewId, userId } = params

      // Try to get from cache first
      const cacheKey = `preview:${previewId}:status`
      const cached = await this.cacheService.get<Preview>(cacheKey)

      if (cached) {
        // Verify ownership
        if (cached.userId !== userId) {
          return {
            success: false,
            error: 'Forbidden',
            data: null
          }
        }

        // Ensure date fields are Date objects (cached data may be strings from JSON)
        const createdAt = typeof cached.createdAt === 'string' ? new Date(cached.createdAt) : cached.createdAt
        const completedAt = cached.completedAt
          ? typeof cached.completedAt === 'string'
            ? new Date(cached.completedAt)
            : cached.completedAt
          : undefined

        return {
          success: true,
          data: {
            previewId: cached.id,
            sceneId: cached.sceneId,
            status: cached.status,
            progress: cached.progress,
            currentStep: cached.currentStep,
            previewUrl: cached.previewUrl,
            error: cached.error,
            createdAt: createdAt.toISOString(),
            completedAt: completedAt?.toISOString()
          }
        }
      }

      // Get from database
      const preview = await this.previewRepository.findById(previewId)

      if (!preview) {
        return {
          success: false,
          error: 'Preview not found',
          data: null
        }
      }

      // Verify ownership
      if (preview.userId !== userId) {
        return {
          success: false,
          error: 'Forbidden',
          data: null
        }
      }

      // Cache the status for 5 minutes
      await this.cacheService.set(cacheKey, preview, 300)

      return {
        success: true,
        data: {
          previewId: preview.id,
          sceneId: preview.sceneId,
          status: preview.status,
          progress: preview.progress,
          currentStep: preview.currentStep,
          previewUrl: preview.previewUrl,
          error: preview.error,
          createdAt: preview.createdAt.toISOString(),
          completedAt: preview.completedAt?.toISOString()
        }
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to fetch preview status',
        data: null
      }
    }
  }

  log(): ActivityType {
    return ActivityType.TEST
  }
}
