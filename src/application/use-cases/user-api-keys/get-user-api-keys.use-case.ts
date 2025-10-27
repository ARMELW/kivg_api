import { IUseCase } from '@/domain/types/use-case.type'
import { ActivityType } from '@/infrastructure/config/activity.config'
import type { MaskedApiKey } from '@/domain/models/user-api-keys.model'
import type { UserApiKeysRepositoryInterface } from '@/domain/repositories/user-api-keys.repository.interface'

type Params = {
  userId: string
}

type Response = {
  data: MaskedApiKey[] | null
  success: boolean
  error?: string
}

/**
 * Use case for retrieving all API keys for a user
 * Returns masked versions of the keys for security
 */
export class GetUserApiKeysUseCase extends IUseCase<Params, Response> {
  constructor(private readonly userApiKeysRepository: UserApiKeysRepositoryInterface) {
    super()
  }

  async execute(params: Params): Promise<Response> {
    try {
      const { userId } = params

      const apiKeys = await this.userApiKeysRepository.findAllByUser(userId)

      return {
        success: true,
        data: apiKeys
      }
    } catch (error: any) {
      console.error('Error retrieving user API keys:', error)
      return {
        success: false,
        error: error.message || 'Failed to retrieve API keys',
        data: null
      }
    }
  }

  log(): ActivityType {
    return ActivityType.UPDATE_ACCOUNT
  }
}
