import { IUseCase } from '@/domain/types/use-case.type'
import { ActivityType } from '@/infrastructure/config/activity.config'
import type { PreviewQueueService } from '@/application/services/preview-queue.service'
import type { PreviewRepositoryInterface } from '@/domain/repositories/preview.repository.interface'

type Params = {
  previewId: string
  userId: string
}

type Response = {
  data: {
    previewId: string
    status: string
  } | null
  success: boolean
  error?: string
}

export class CancelPreviewUseCase extends IUseCase<Params, Response> {
  constructor(
    private readonly previewRepository: PreviewRepositoryInterface,
    private readonly queueService: PreviewQueueService
  ) {
    super()
  }

  async execute(params: Params): Promise<Response> {
    try {
      const { previewId, userId } = params

      // Get preview
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

      // Check if preview can be cancelled
      if (preview.status === 'completed' || preview.status === 'failed' || preview.status === 'cancelled') {
        return {
          success: false,
          error: `Cannot cancel preview with status: ${preview.status}`,
          data: null
        }
      }

      // Remove from queue if queued
      if (preview.status === 'queued') {
        this.queueService.dequeue(previewId)
      }

      // Update status to cancelled
      await this.previewRepository.updateStatus(previewId, 'cancelled')

      return {
        success: true,
        data: {
          previewId,
          status: 'cancelled'
        }
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to cancel preview',
        data: null
      }
    }
  }

  log(): ActivityType {
    return ActivityType.CANCEL_PREVIEW
  }
}
