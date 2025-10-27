import { eq, and } from 'drizzle-orm'
import { db } from '../database/db'
import { userApiKeys } from '../database/schema/schema'
import type { UserApiKeysRepositoryInterface } from '@/domain/repositories/user-api-keys.repository.interface'
import type { ApiKeyInput, ApiProvider, MaskedApiKey, UserApiKey } from '@/domain/models/user-api-keys.model'
import { EncryptionService } from '@/application/services/encryption.service'

export class UserApiKeysRepository implements UserApiKeysRepositoryInterface {
  private encryptionService: EncryptionService

  constructor() {
    this.encryptionService = new EncryptionService()
  }

  async save(data: Omit<UserApiKey, 'id' | 'createdAt' | 'updatedAt'>): Promise<UserApiKey> {
    const now = new Date()
    const id = crypto.randomUUID()

    // Check if key already exists for this user and provider
    const existing = await this.findByUserAndProvider(data.userId, data.provider)

    if (existing) {
      // Update existing key
      const [updated] = await db
        .update(userApiKeys)
        .set({
          encryptedApiKey: data.encryptedApiKey,
          isActive: data.isActive,
          lastValidated: data.lastValidated || null,
          validationStatus: data.validationStatus || null,
          metadata: data.metadata || null,
          updatedAt: now
        })
        .where(and(eq(userApiKeys.userId, data.userId), eq(userApiKeys.provider, data.provider)))
        .returning()

      return this.mapToUserApiKey(updated)
    } else {
      // Create new key
      const [created] = await db
        .insert(userApiKeys)
        .values({
          id,
          userId: data.userId,
          provider: data.provider,
          encryptedApiKey: data.encryptedApiKey,
          isActive: data.isActive,
          lastValidated: data.lastValidated || null,
          validationStatus: data.validationStatus || null,
          metadata: data.metadata || null,
          createdAt: now,
          updatedAt: now
        })
        .returning()

      return this.mapToUserApiKey(created)
    }
  }

  async findByUserAndProvider(userId: string, provider: ApiProvider): Promise<UserApiKey | null> {
    const result = await db.query.userApiKeys.findFirst({
      where: and(eq(userApiKeys.userId, userId), eq(userApiKeys.provider, provider))
    })

    if (!result) return null

    return this.mapToUserApiKey(result)
  }

  async findAllByUser(userId: string): Promise<MaskedApiKey[]> {
    const results = await db.query.userApiKeys.findMany({
      where: eq(userApiKeys.userId, userId)
    })

    return results.map((key: any) => {
      // Decrypt to mask properly
      try {
        const decryptedKey = this.encryptionService.decrypt(key.encryptedApiKey)
        const maskedKey = this.encryptionService.maskApiKey(decryptedKey)

        return {
          id: key.id,
          provider: key.provider as ApiProvider,
          maskedKey,
          isActive: key.isActive,
          lastValidated: key.lastValidated,
          validationStatus: key.validationStatus as 'valid' | 'invalid' | 'pending' | null,
          keyName: key.metadata?.keyName,
          createdAt: key.createdAt,
          updatedAt: key.updatedAt
        }
      } catch (error) {
        // If decryption fails, return with generic mask
        return {
          id: key.id,
          provider: key.provider as ApiProvider,
          maskedKey: '****',
          isActive: key.isActive,
          lastValidated: key.lastValidated,
          validationStatus: 'invalid' as const,
          keyName: key.metadata?.keyName,
          createdAt: key.createdAt,
          updatedAt: key.updatedAt
        }
      }
    })
  }

  async delete(userId: string, provider: ApiProvider): Promise<boolean> {
    const result = await db
      .delete(userApiKeys)
      .where(and(eq(userApiKeys.userId, userId), eq(userApiKeys.provider, provider)))
      .returning()

    return result.length > 0
  }

  async updateValidationStatus(
    userId: string,
    provider: ApiProvider,
    status: 'valid' | 'invalid' | 'pending'
  ): Promise<UserApiKey> {
    const now = new Date()

    const [updated] = await db
      .update(userApiKeys)
      .set({
        validationStatus: status,
        lastValidated: now,
        updatedAt: now
      })
      .where(and(eq(userApiKeys.userId, userId), eq(userApiKeys.provider, provider)))
      .returning()

    return this.mapToUserApiKey(updated)
  }

  async markAsUsed(userId: string, provider: ApiProvider): Promise<void> {
    const now = new Date()

    await db
      .update(userApiKeys)
      .set({
        metadata: {
          lastUsed: now.toISOString()
        },
        updatedAt: now
      })
      .where(and(eq(userApiKeys.userId, userId), eq(userApiKeys.provider, provider)))
  }

  async toggleActive(userId: string, provider: ApiProvider, isActive: boolean): Promise<UserApiKey> {
    const now = new Date()

    const [updated] = await db
      .update(userApiKeys)
      .set({
        isActive,
        updatedAt: now
      })
      .where(and(eq(userApiKeys.userId, userId), eq(userApiKeys.provider, provider)))
      .returning()

    return this.mapToUserApiKey(updated)
  }

  private mapToUserApiKey(data: any): UserApiKey {
    return {
      id: data.id,
      userId: data.userId,
      provider: data.provider as ApiProvider,
      encryptedApiKey: data.encryptedApiKey,
      isActive: data.isActive,
      lastValidated: data.lastValidated,
      validationStatus: data.validationStatus as 'valid' | 'invalid' | 'pending' | null,
      metadata: data.metadata || undefined,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt
    }
  }
}
