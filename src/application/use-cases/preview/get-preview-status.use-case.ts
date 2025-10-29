import type { Preview } from '@/domain/models/preview.model'
import type { PreviewRepositoryInterface } from '@/domain/repositories/preview.repository.interface'
import type { IUseCase } from '@/domain/types/use-case.type'
import type { CacheService } from '@/application/services/cache.service'

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
            createdAt: cached.createdAt.toISOString(),
            completedAt: cached.completedAt?.toISOString()
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

  log(): string {
    return 'GET_PREVIEW_STATUS'
  }
}
