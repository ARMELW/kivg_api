import { IUseCase } from '@/domain/types/use-case.type'
import { ActivityType } from '@/infrastructure/config/activity.config'
import type { AIUsage } from '@/domain/models/ai-usage.model'
import type { AIUsageRepositoryInterface } from '@/domain/repositories/ai-usage.repository.interface'

type Params = {
  userId: string
  type: 'video' | 'script' | 'image' | 'voice' | 'music'
}

type Response = {
  success: boolean
  data?: AIUsage
  error?: string
}

/**
 * Track AI Generation Use Case
 * Increments usage counters and reports to Stripe for billing
 */
export class TrackAIGenerationUseCase extends IUseCase<Params, Response> {
  constructor(private readonly aiUsageRepository: AIUsageRepositoryInterface) {
    super()
  }

  async execute(params: Params): Promise<Response> {
    try {
      const currentMonth = this.getCurrentMonth()
      let usage: AIUsage

      switch (params.type) {
        case 'video':
          usage = await this.aiUsageRepository.incrementVideoGeneration(params.userId, currentMonth)
          break
        case 'script':
          usage = await this.aiUsageRepository.incrementScriptGeneration(params.userId, currentMonth)
          break
        case 'image':
          usage = await this.aiUsageRepository.incrementImageGeneration(params.userId, currentMonth)
          break
        case 'voice':
          usage = await this.aiUsageRepository.incrementVoiceGeneration(params.userId, currentMonth)
          break
        case 'music':
          usage = await this.aiUsageRepository.incrementMusicGeneration(params.userId, currentMonth)
          break
        default:
          throw new Error(`Invalid generation type: ${params.type}`)
      }

      return {
        success: true,
        data: usage
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to track AI generation'
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
    return ActivityType.TRACK_AI_GENERATION
  }
}
