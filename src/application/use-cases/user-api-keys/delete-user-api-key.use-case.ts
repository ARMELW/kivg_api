import { IUseCase } from '@/domain/types/use-case.type'
import type { UserApiKeysRepositoryInterface } from '@/domain/repositories/user-api-keys.repository.interface'
import type { ApiProvider } from '@/domain/models/user-api-keys.model'
import { ActivityType } from '@/infrastructure/config/activity.config'

type Params = {
  userId: string
  provider: ApiProvider
}

type Response = {
  success: boolean
  error?: string
}

/**
 * Use case for deleting a user's API key for a specific provider
 */
export class DeleteUserApiKeyUseCase extends IUseCase<Params, Response> {
  constructor(private readonly userApiKeysRepository: UserApiKeysRepositoryInterface) {
    super()
  }

  async execute(params: Params): Promise<Response> {
    try {
      const { userId, provider } = params

      const deleted = await this.userApiKeysRepository.delete(userId, provider)

      if (!deleted) {
        return {
          success: false,
          error: `No API key found for provider: ${provider}`
        }
      }

      return {
        success: true
      }
    } catch (error: any) {
      console.error('Error deleting user API key:', error)
      return {
        success: false,
        error: error.message || 'Failed to delete API key'
      }
    }
  }

  log(): ActivityType {
    return ActivityType.UPDATE_ACCOUNT
  }
}
