import { IUseCase } from '@/domain/types/use-case.type'
import type { AIUsageRepositoryInterface } from '@/domain/repositories/ai-usage.repository.interface'
import type { AIUsage } from '@/domain/models/ai-usage.model'
import { ActivityType } from '@/infrastructure/config/activity.config'

type Params = {
  userId: string
}

type Response = {
  success: boolean
  data?: AIUsage
  error?: string
}

/**
 * Get Current Month Usage Use Case
 */
export class GetCurrentMonthUsageUseCase extends IUseCase<Params, Response> {
  constructor(private readonly aiUsageRepository: AIUsageRepositoryInterface) {
    super()
  }

  async execute(params: Params): Promise<Response> {
    try {
      const usage = await this.aiUsageRepository.getCurrentMonthUsage(params.userId)

      if (!usage) {
        // If no usage record exists, return default values
        const currentMonth = this.getCurrentMonth()
        return {
          success: true,
          data: {
            id: '',
            userId: params.userId,
            month: currentMonth,
            videoGenerationCount: 0,
            scriptGenerationCount: 0,
            imageGenerationCount: 0,
            voiceGenerationCount: 0,
            musicGenerationCount: 0,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        }
      }

      return {
        success: true,
        data: usage
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to get current month usage'
      }
    }
  }

  private getCurrentMonth(): string {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    return `${year}-${month}`
  }

  log(): ActivityType {
    return ActivityType.GET_AI_USAGE
  }
}
