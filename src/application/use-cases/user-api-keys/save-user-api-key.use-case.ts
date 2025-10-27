import { EncryptionService } from '@/application/services/encryption.service'
import { IUseCase } from '@/domain/types/use-case.type'
import { ActivityType } from '@/infrastructure/config/activity.config'
import type { ApiKeyInput } from '@/domain/models/user-api-keys.model'
import type { UserApiKeysRepositoryInterface } from '@/domain/repositories/user-api-keys.repository.interface'

type Params = ApiKeyInput

type Response = {
  data: {
    id: string
    provider: string
    maskedKey: string
    isActive: boolean
  } | null
  success: boolean
  error?: string
}

/**
 * Use case for saving a user's API key
 * Encrypts the API key before storing it in the database
 */
export class SaveUserApiKeyUseCase extends IUseCase<Params, Response> {
  private encryptionService: EncryptionService

  constructor(private readonly userApiKeysRepository: UserApiKeysRepositoryInterface) {
    super()
    this.encryptionService = new EncryptionService()
  }

  async execute(params: Params): Promise<Response> {
    try {
      const { userId, provider, apiKey, keyName } = params

      // Validate API key is not empty
      if (!apiKey || apiKey.trim().length === 0) {
        return {
          success: false,
          error: 'API key cannot be empty',
          data: null
        }
      }

      // Encrypt the API key
      const encryptedApiKey = this.encryptionService.encrypt(apiKey)

      // Save to database
      const savedKey = await this.userApiKeysRepository.save({
        userId,
        provider,
        encryptedApiKey,
        isActive: true,
        lastValidated: null,
        validationStatus: 'pending',
        metadata: keyName ? { keyName } : undefined
      })

      // Return masked version
      const maskedKey = this.encryptionService.maskApiKey(apiKey)

      return {
        success: true,
        data: {
          id: savedKey.id,
          provider: savedKey.provider,
          maskedKey,
          isActive: savedKey.isActive
        }
      }
    } catch (error: any) {
      console.error('Error saving user API key:', error)
      return {
        success: false,
        error: error.message || 'Failed to save API key',
        data: null
      }
    }
  }

  log(): ActivityType {
    return ActivityType.UPDATE_ACCOUNT
  }
}
