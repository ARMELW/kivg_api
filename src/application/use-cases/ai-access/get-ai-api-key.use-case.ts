import { IUseCase } from '@/domain/types/use-case.type'
import type { ApiProvider } from '@/domain/models/user-api-keys.model'
import { ApiKeyResolverService } from '@/application/services/api-key-resolver.service'
import { ActivityType } from '@/infrastructure/config/activity.config'

type Params = {
  userId: string | null
  provider: ApiProvider
  useOwnKeys: boolean
  hasApiAccess: boolean
}

type Response = {
  data: {
    apiKey: string | null
    usingUserKey: boolean
    provider: ApiProvider
  } | null
  success: boolean
  error?: string
}

/**
 * Use case to get the appropriate API key for an AI service
 * Determines whether to use user's own key or platform key
 */
export class GetAIApiKeyUseCase extends IUseCase<Params, Response> {
  private apiKeyResolver: ApiKeyResolverService

  constructor() {
    super()
    this.apiKeyResolver = new ApiKeyResolverService()
  }

  async execute(params: Params): Promise<Response> {
    try {
      const { userId, provider, useOwnKeys, hasApiAccess } = params

      // Check if user has any form of API access
      const canUseAI = this.apiKeyResolver.canUseAI(hasApiAccess, useOwnKeys)

      if (!canUseAI) {
        return {
          success: false,
          error: 'AI features not available. Please upgrade your plan or configure your own API keys.',
          data: null
        }
      }

      // Resolve which API key to use
      const apiKey = await this.apiKeyResolver.resolveApiKey(userId, provider, useOwnKeys)

      if (!apiKey) {
        return {
          success: false,
          error: `No API key available for ${provider}. Please configure your API key or contact support.`,
          data: null
        }
      }

      // Determine if using user's key or platform key
      const usingUserKey = useOwnKeys && userId !== null

      return {
        success: true,
        data: {
          apiKey,
          usingUserKey,
          provider
        }
      }
    } catch (error: any) {
      console.error('Error getting AI API key:', error)
      return {
        success: false,
        error: error.message || 'Failed to get API key',
        data: null
      }
    }
  }

  log(): ActivityType {
    return ActivityType.UPDATE_ACCOUNT
  }
}
