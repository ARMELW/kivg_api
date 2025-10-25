import { z } from 'zod'

export const AssetSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  name: z.string().min(1),
  url: z.string().url(),
  thumbnailUrl: z.string().url().optional(),
  type: z.string(), // MIME type
  size: z.number().int().positive(),
  width: z.number().int().optional(),
  height: z.number().int().optional(),
  tags: z.array(z.string()).default([]),
  category: z.enum(['illustration', 'icon', 'background', 'other']).default('other'),
  lastUsed: z.date().optional(),
  usageCount: z.number().int().default(0),
  metadata: z
    .object({
      format: z.string().optional(),
      colorSpace: z.string().optional(),
      hasAlpha: z.boolean().optional()
    })
    .optional(),
  uploadedAt: z.date(),
  updatedAt: z.date()
})

export type Asset = z.infer<typeof AssetSchema>
