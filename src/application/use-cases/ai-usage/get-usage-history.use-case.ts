import { IUseCase } from '@/domain/types/use-case.type'
import type { AIUsageRepositoryInterface } from '@/domain/repositories/ai-usage.repository.interface'
import type { AIUsage } from '@/domain/models/ai-usage.model'
import { ActivityType } from '@/infrastructure/config/activity.config'

type Params = {
  userId: string
  limit?: number
}

type Response = {
  success: boolean
  data?: AIUsage[]
  error?: string
}

/**
 * Get Usage History Use Case
 */
export class GetUsageHistoryUseCase extends IUseCase<Params, Response> {
  constructor(private readonly aiUsageRepository: AIUsageRepositoryInterface) {
    super()
  }

  async execute(params: Params): Promise<Response> {
    try {
      const history = await this.aiUsageRepository.getUsageHistory(params.userId, params.limit || 12)

      return {
        success: true,
        data: history
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to get usage history'
      }
    }
  }

  log(): ActivityType {
    return ActivityType.GET_AI_USAGE_HISTORY
  }
}
