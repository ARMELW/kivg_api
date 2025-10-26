import { z } from 'zod'

/**
 * Font Model
 */
export const Font = z.object({
  id: z.string(),
  name: z.string(),
  family: z.string(),
  category: z.enum(['serif', 'sans-serif', 'display', 'handwriting', 'monospace']),
  variants: z.array(z.string()), // e.g., ['regular', 'bold', 'italic']
  weights: z.array(z.number()), // e.g., [400, 700]
  url: z.string().optional(), // Font file URL
  previewUrl: z.string().optional(), // Preview image URL
  isPremium: z.boolean().default(false),
  isPopular: z.boolean().default(false),
  createdAt: z.date(),
  updatedAt: z.date()
})

export type Font = z.infer<typeof Font>
