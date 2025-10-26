import { z } from 'zod'

/**
 * AI Usage Model
 * Tracks AI video generation usage for pay-per-use billing
 */
export const AIUsageSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  month: z.string(), // Format: YYYY-MM
  videoGenerationCount: z.number().int().default(0),
  scriptGenerationCount: z.number().int().default(0),
  imageGenerationCount: z.number().int().default(0),
  voiceGenerationCount: z.number().int().default(0),
  musicGenerationCount: z.number().int().default(0),
  createdAt: z.date(),
  updatedAt: z.date()
})

export type AIUsage = z.infer<typeof AIUsageSchema>
