import type { ApiProvider, MaskedApiKey, UserApiKey } from '../models/user-api-keys.model'

export interface UserApiKeysRepositoryInterface {
  /**
   * Save or update a user's API key for a specific provider
   * @param data API key data including userId, provider, and encrypted key
   * @returns The created/updated user API key
   */
  save: (data: Omit<UserApiKey, 'id' | 'createdAt' | 'updatedAt'>) => Promise<UserApiKey>

  /**
   * Find a user's API key for a specific provider
   * @param userId User ID
   * @param provider API provider name
   * @returns The user API key or null if not found
   */
  findByUserAndProvider: (userId: string, provider: ApiProvider) => Promise<UserApiKey | null>

  /**
   * Get all API keys for a user (with masked keys for security)
   * @param userId User ID
   * @returns Array of masked API keys
   */
  findAllByUser: (userId: string) => Promise<MaskedApiKey[]>

  /**
   * Delete a user's API key for a specific provider
   * @param userId User ID
   * @param provider API provider name
   * @returns true if deleted, false if not found
   */
  delete: (userId: string, provider: ApiProvider) => Promise<boolean>

  /**
   * Update validation status of an API key
   * @param userId User ID
   * @param provider API provider name
   * @param status Validation status
   * @returns The updated user API key
   */
  updateValidationStatus: (
    userId: string,
    provider: ApiProvider,
    status: 'valid' | 'invalid' | 'pending'
  ) => Promise<UserApiKey>

  /**
   * Mark an API key as used (updates lastUsed timestamp)
   * @param userId User ID
   * @param provider API provider name
   */
  markAsUsed: (userId: string, provider: ApiProvider) => Promise<void>

  /**
   * Toggle active status of an API key
   * @param userId User ID
   * @param provider API provider name
   * @param isActive New active status
   * @returns The updated user API key
   */
  toggleActive: (userId: string, provider: ApiProvider, isActive: boolean) => Promise<UserApiKey>
}
