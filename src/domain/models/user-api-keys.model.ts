import { z } from 'zod'

export const UserApiKeySchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  provider: z.enum(['openai', 'elevenlabs', 'mubert', 'minimax', 'gemini']),
  encryptedApiKey: z.string(),
  isActive: z.boolean().default(true),
  lastValidated: z.date().optional().nullable(),
  validationStatus: z.enum(['valid', 'invalid', 'pending']).optional().nullable(),
  metadata: z
    .object({
      keyName: z.string().optional(),
      addedBy: z.string().optional(),
      lastUsed: z.string().optional()
    })
    .optional(),
  createdAt: z.date(),
  updatedAt: z.date()
})

export type UserApiKey = z.infer<typeof UserApiKeySchema>

export type ApiProvider = 'openai' | 'elevenlabs' | 'mubert' | 'minimax' | 'gemini'

export type ApiKeyInput = {
  userId: string
  provider: ApiProvider
  apiKey: string // Plain text API key - will be encrypted before storage
  keyName?: string
}

export type MaskedApiKey = {
  id: string
  provider: ApiProvider
  maskedKey: string // Only shows last 4 characters
  isActive: boolean
  lastValidated: Date | null
  validationStatus: 'valid' | 'invalid' | 'pending' | null
  keyName?: string
  createdAt: Date
  updatedAt: Date
}
