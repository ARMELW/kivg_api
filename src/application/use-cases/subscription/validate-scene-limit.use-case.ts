import { IUseCase } from '@/domain/types/use-case.type'
import { ActivityType } from '@/infrastructure/config/activity.config'
import { getFeatureLimit, isFeatureUnlimited } from '@/infrastructure/config/subscription.config'

type Params = {
  userId: string
  subscriptionPlan: string
  currentSceneCount: number
}

type Response = {
  success: boolean
  canAddScene: boolean
  maxScenes: number
  currentCount: number
  isUnlimited: boolean
  error?: string
}

export class ValidateSceneLimitUseCase extends IUseCase<Params, Response> {
  execute(params: Params): Promise<Response> {
    try {
      const { subscriptionPlan, currentSceneCount } = params

      const maxScenes = getFeatureLimit(subscriptionPlan, 'maxScenes')
      const isUnlimited = isFeatureUnlimited(subscriptionPlan, 'maxScenes')

      if (isUnlimited) {
        return Promise.resolve({
          success: true,
          canAddScene: true,
          maxScenes: -1,
          currentCount: currentSceneCount,
          isUnlimited: true
        })
      }

      const canAddScene = currentSceneCount < maxScenes

      if (!canAddScene) {
        return Promise.resolve({
          success: false,
          canAddScene: false,
          maxScenes,
          currentCount: currentSceneCount,
          isUnlimited: false,
          error: `You have reached the maximum number of scenes (${maxScenes}) for your ${subscriptionPlan} plan. Please upgrade to add more scenes.`
        })
      }

      return Promise.resolve({
        success: true,
        canAddScene: true,
        maxScenes,
        currentCount: currentSceneCount,
        isUnlimited: false
      })
    } catch (error: any) {
      return Promise.resolve({
        success: false,
        canAddScene: false,
        maxScenes: 0,
        currentCount: 0,
        isUnlimited: false,
        error: error.message || 'Failed to validate scene limit'
      })
    }
  }

  log(): ActivityType {
    return ActivityType.CHECK_PERMISSION
  }
}
