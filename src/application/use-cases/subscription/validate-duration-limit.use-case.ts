import { IUseCase } from '@/domain/types/use-case.type'
import { ActivityType } from '@/infrastructure/config/activity.config'
import { getFeatureLimit, isFeatureUnlimited } from '@/infrastructure/config/subscription.config'

type Params = {
  userId: string
  subscriptionPlan: string
  videoDuration: number // in seconds
}

type Response = {
  success: boolean
  isValid: boolean
  maxDuration: number // in seconds
  requestedDuration: number
  isUnlimited: boolean
  error?: string
}

export class ValidateDurationLimitUseCase extends IUseCase<Params, Response> {
  execute(params: Params): Promise<Response> {
    try {
      const { subscriptionPlan, videoDuration } = params

      const maxDuration = getFeatureLimit(subscriptionPlan, 'maxDuration')
      const isUnlimited = isFeatureUnlimited(subscriptionPlan, 'maxDuration')

      if (isUnlimited) {
        return Promise.resolve({
          success: true,
          isValid: true,
          maxDuration: -1,
          requestedDuration: videoDuration,
          isUnlimited: true
        })
      }

      const isValid = videoDuration <= maxDuration

      if (!isValid) {
        const maxMinutes = Math.floor(maxDuration / 60)
        const requestedMinutes = Math.floor(videoDuration / 60)

        return Promise.resolve({
          success: false,
          isValid: false,
          maxDuration,
          requestedDuration: videoDuration,
          isUnlimited: false,
          error: `Video duration (${requestedMinutes}m ${videoDuration % 60}s) exceeds your ${subscriptionPlan} plan limit of ${maxMinutes} minute${maxMinutes > 1 ? 's' : ''}. Please upgrade to export longer videos.`
        })
      }

      return Promise.resolve({
        success: true,
        isValid: true,
        maxDuration,
        requestedDuration: videoDuration,
        isUnlimited: false
      })
    } catch (error: any) {
      return Promise.resolve({
        success: false,
        isValid: false,
        maxDuration: 0,
        requestedDuration: 0,
        isUnlimited: false,
        error: error.message || 'Failed to validate duration limit'
      })
    }
  }

  log(): ActivityType {
    return ActivityType.CHECK_PERMISSION
  }
}
