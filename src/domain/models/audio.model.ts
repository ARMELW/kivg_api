import { z } from 'zod'

export const AudioFileSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  fileName: z.string().min(1),
  fileUrl: z.string().url(),
  duration: z.number().positive(), // in seconds
  size: z.number().int().positive(), // in bytes
  category: z.enum(['music', 'sfx', 'voiceover', 'ambient', 'other']).default('other'),
  tags: z.array(z.string()).default([]),
  isFavorite: z.boolean().default(false),
  trimConfig: z
    .object({
      startTime: z.number().optional(),
      endTime: z.number().optional()
    })
    .optional(),
  fadeConfig: z
    .object({
      fadeIn: z.number().optional(),
      fadeOut: z.number().optional()
    })
    .optional(),
  uploadedAt: z.date(),
  updatedAt: z.date()
})

export type AudioFile = z.infer<typeof AudioFileSchema>
