import { env } from 'node:process'
import { UserApiKeysRepository } from '@/infrastructure/repositories/user-api-keys.repository'
import type { ApiProvider } from '@/domain/models/user-api-keys.model'
import { EncryptionService } from './encryption.service'

/**
 * Service to resolve which API key to use - user's own key or platform key
 */
export class ApiKeyResolverService {
  private userApiKeysRepository: UserApiKeysRepository
  private encryptionService: EncryptionService

  constructor() {
    this.userApiKeysRepository = new UserApiKeysRepository()
    this.encryptionService = new EncryptionService()
  }

  /**
   * Get API key for a provider, checking user keys first, then platform keys
   * @param userId User ID
   * @param provider API provider
   * @param useOwnKeys Whether user wants to use their own keys
   * @returns API key to use, or null if not available
   */
  async resolveApiKey(
    userId: string | null,
    provider: ApiProvider,
    useOwnKeys: boolean = false
  ): Promise<string | null> {
    // If user wants to use their own keys and is authenticated
    if (userId && useOwnKeys) {
      const userKey = await this.getUserApiKey(userId, provider)
      if (userKey) {
        return userKey
      }
      // If user key not found, fall back to platform key
    }

    // Use platform API key
    return this.getPlatformApiKey(provider)
  }

  /**
   * Get user's API key for a specific provider
   * @param userId User ID
   * @param provider API provider
   * @returns Decrypted API key or null if not found/inactive
   */
  private async getUserApiKey(userId: string, provider: ApiProvider): Promise<string | null> {
    try {
      const userApiKey = await this.userApiKeysRepository.findByUserAndProvider(userId, provider)

      if (!userApiKey || !userApiKey.isActive) {
        return null
      }

      // Check if validation failed
      if (userApiKey.validationStatus === 'invalid') {
        console.warn(`User API key for ${provider} is marked as invalid`)
        return null
      }

      // Decrypt and return
      const decryptedKey = this.encryptionService.decrypt(userApiKey.encryptedApiKey)

      // Mark as used
      await this.userApiKeysRepository.markAsUsed(userId, provider)

      return decryptedKey
    } catch (error) {
      console.error(`Error getting user API key for ${provider}:`, error)
      return null
    }
  }

  /**
   * Get platform API key from environment variables
   * @param provider API provider
   * @returns API key from environment or null
   */
  private getPlatformApiKey(provider: ApiProvider): string | null {
    switch (provider) {
      case 'openai':
        return env.OPENAI_API_KEY || null
      case 'elevenlabs':
        return env.ELEVENLABS_API_KEY || null
      case 'gemini':
        return env.GEMINI_API_KEY || null
      case 'minimax':
        return env.MINIMAX_API_KEY || null
      case 'mubert':
        return env.MUBERT_API_KEY || null
      default:
        return null
    }
  }

  /**
   * Check if user has API access (either through subscription or own keys)
   * @param hasApiAccess User's API access flag from subscription
   * @param useOwnKeys User's preference to use own keys
   * @returns true if user can use AI features
   */
  canUseAI(hasApiAccess: boolean, useOwnKeys: boolean): boolean {
    return hasApiAccess || useOwnKeys
  }

  /**
   * Get available AI providers for a user
   * @param userId User ID
   * @param useOwnKeys Whether user wants to use their own keys
   * @returns Object with boolean flags for each AI capability
   */
  async getAvailableProviders(
    userId: string | null,
    useOwnKeys: boolean = false
  ): Promise<{
    hasImageGeneration: boolean
    hasVoiceSynthesis: boolean
    hasScriptGeneration: boolean
    hasMusicGeneration: boolean
  }> {
    const providers = {
      hasImageGeneration: false,
      hasVoiceSynthesis: false,
      hasScriptGeneration: false,
      hasMusicGeneration: false
    }

    // Check OpenAI (image generation)
    const openaiKey = await this.resolveApiKey(userId, 'openai', useOwnKeys)
    if (openaiKey) {
      providers.hasImageGeneration = true
    }

    // Check Gemini (script generation and alternative image generation)
    const geminiKey = await this.resolveApiKey(userId, 'gemini', useOwnKeys)
    if (geminiKey) {
      providers.hasScriptGeneration = true
      if (!providers.hasImageGeneration) {
        providers.hasImageGeneration = true
      }
    }

    // Check ElevenLabs (voice synthesis)
    const elevenlabsKey = await this.resolveApiKey(userId, 'elevenlabs', useOwnKeys)
    if (elevenlabsKey) {
      providers.hasVoiceSynthesis = true
    }

    // Check MiniMax (alternative voice synthesis)
    const minimaxKey = await this.resolveApiKey(userId, 'minimax', useOwnKeys)
    if (minimaxKey && !providers.hasVoiceSynthesis) {
      providers.hasVoiceSynthesis = true
    }

    // Check Mubert (music generation)
    const mubertKey = await this.resolveApiKey(userId, 'mubert', useOwnKeys)
    if (mubertKey) {
      providers.hasMusicGeneration = true
    }

    return providers
  }
}
