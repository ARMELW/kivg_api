import { IUseCase } from '@/domain/types/use-case.type'
import { ActivityType } from '@/infrastructure/config/activity.config'
import type { PreviewRepositoryInterface } from '@/domain/repositories/preview.repository.interface'

type Params = {
  sceneId: string
  userId: string
}

type Response = {
  data: {
    previewId?: string
    sceneId: string
    status: string
    progress: number
    currentStep?: string
    previewUrl?: string
    error?: string
    createdAt?: string
    completedAt?: string
  } | null
  success: boolean
  error?: string
}

/**
 * Use case to get the projection (preview) of a scene for modal display
 * This retrieves the latest completed preview for a scene if available
 */
export class GetSceneProjectionUseCase extends IUseCase<Params, Response> {
  constructor(private readonly previewRepository: PreviewRepositoryInterface) {
    super()
  }

  async execute(params: Params): Promise<Response> {
    try {
      const { sceneId, userId } = params

      // Get the most recent preview for this scene (ordered by createdAt desc)
      const result = await this.previewRepository.findAll({
        userId,
        sceneId,
        limit: 10 // Get last 10 to check for completed ones
      })

      if (!result.previews || result.previews.length === 0) {
        // No preview exists yet
        return {
          success: true,
          data: {
            sceneId,
            status: 'none',
            progress: 0
          }
        }
      }

      // Find the most recent completed preview, or the most recent preview if none completed
      const completedPreviews = result.previews.filter((p) => p.status === 'completed' && p.previewUrl)
      const latestPreview = completedPreviews.length > 0 ? completedPreviews[0] : result.previews[0]

      return {
        success: true,
        data: {
          previewId: latestPreview.id,
          sceneId: latestPreview.sceneId,
          status: latestPreview.status,
          progress: latestPreview.progress,
          currentStep: latestPreview.currentStep,
          previewUrl: latestPreview.previewUrl,
          error: latestPreview.error,
          createdAt: latestPreview.createdAt.toISOString(),
          completedAt: latestPreview.completedAt?.toISOString()
        }
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to get scene projection',
        data: null
      }
    }
  }

  log(): ActivityType {
    return ActivityType.TEST
  }
}
