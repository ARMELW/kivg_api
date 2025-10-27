import { IUseCase } from '@/domain/types/use-case.type'
import type { UserApiKeysRepositoryInterface } from '@/domain/repositories/user-api-keys.repository.interface'
import type { ApiProvider } from '@/domain/models/user-api-keys.model'
import { EncryptionService } from '@/application/services/encryption.service'
import { ActivityType } from '@/infrastructure/config/activity.config'

type Params = {
  userId: string
  provider: ApiProvider
}

type Response = {
  data: {
    provider: string
    isValid: boolean
    message: string
  } | null
  success: boolean
  error?: string
}

/**
 * Use case for validating a user's API key
 * Tests if the API key works by making a simple API call
 */
export class ValidateUserApiKeyUseCase extends IUseCase<Params, Response> {
  private encryptionService: EncryptionService

  constructor(private readonly userApiKeysRepository: UserApiKeysRepositoryInterface) {
    super()
    this.encryptionService = new EncryptionService()
  }

  async execute(params: Params): Promise<Response> {
    try {
      const { userId, provider } = params

      // Get the encrypted API key
      const userApiKey = await this.userApiKeysRepository.findByUserAndProvider(userId, provider)

      if (!userApiKey) {
        return {
          success: false,
          error: `No API key found for provider: ${provider}`,
          data: null
        }
      }

      // Decrypt the API key
      const apiKey = this.encryptionService.decrypt(userApiKey.encryptedApiKey)

      // Validate based on provider
      let isValid = false
      let message = ''

      switch (provider) {
        case 'openai':
          isValid = await this.validateOpenAI(apiKey)
          message = isValid ? 'OpenAI API key is valid' : 'OpenAI API key is invalid'
          break
        case 'elevenlabs':
          isValid = await this.validateElevenLabs(apiKey)
          message = isValid ? 'ElevenLabs API key is valid' : 'ElevenLabs API key is invalid'
          break
        case 'gemini':
          isValid = await this.validateGemini(apiKey)
          message = isValid ? 'Gemini API key is valid' : 'Gemini API key is invalid'
          break
        case 'minimax':
          isValid = await this.validateMiniMax(apiKey)
          message = isValid ? 'MiniMax API key is valid' : 'MiniMax API key is invalid'
          break
        case 'mubert':
          isValid = await this.validateMubert(apiKey)
          message = isValid ? 'Mubert API key is valid' : 'Mubert API key is invalid'
          break
        default:
          return {
            success: false,
            error: `Unsupported provider: ${provider}`,
            data: null
          }
      }

      // Update validation status
      await this.userApiKeysRepository.updateValidationStatus(userId, provider, isValid ? 'valid' : 'invalid')

      return {
        success: true,
        data: {
          provider,
          isValid,
          message
        }
      }
    } catch (error: any) {
      console.error('Error validating user API key:', error)
      return {
        success: false,
        error: error.message || 'Failed to validate API key',
        data: null
      }
    }
  }

  private async validateOpenAI(apiKey: string): Promise<boolean> {
    try {
      // Simple validation: check if key format is correct and make a test call
      const response = await fetch('https://api.openai.com/v1/models', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${apiKey}`
        }
      })
      return response.ok
    } catch (error) {
      console.error('OpenAI validation error:', error)
      return false
    }
  }

  private async validateElevenLabs(apiKey: string): Promise<boolean> {
    try {
      // Test ElevenLabs API key with a user info request
      const response = await fetch('https://api.elevenlabs.io/v1/user', {
        method: 'GET',
        headers: {
          'xi-api-key': apiKey
        }
      })
      return response.ok
    } catch (error) {
      console.error('ElevenLabs validation error:', error)
      return false
    }
  }

  private async validateGemini(apiKey: string): Promise<boolean> {
    try {
      // Test Gemini API key with a simple models list request
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`, {
        method: 'GET'
      })
      return response.ok
    } catch (error) {
      console.error('Gemini validation error:', error)
      return false
    }
  }

  private async validateMiniMax(apiKey: string): Promise<boolean> {
    try {
      // MiniMax validation - basic format check for now
      // You can implement a real API call when MiniMax provides a test endpoint
      return apiKey.length > 20 // Basic format validation
    } catch (error) {
      console.error('MiniMax validation error:', error)
      return false
    }
  }

  private async validateMubert(apiKey: string): Promise<boolean> {
    try {
      // Mubert validation - basic format check for now
      // You can implement a real API call when Mubert provides a test endpoint
      return apiKey.length > 20 // Basic format validation
    } catch (error) {
      console.error('Mubert validation error:', error)
      return false
    }
  }

  log(): ActivityType {
    return ActivityType.UPDATE_ACCOUNT
  }
}
