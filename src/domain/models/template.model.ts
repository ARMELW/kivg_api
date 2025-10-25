import { z } from 'zod'

export const TemplateSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  description: z.string().min(1),
  type: z.enum(['education', 'marketing', 'presentation', 'tutorial', 'entertainment', 'other']),
  style: z.enum(['minimal', 'colorful', 'professional', 'creative', 'dark', 'light']),
  tags: z.array(z.string()).default([]),
  thumbnail: z.string().url().optional(),
  previewAnimation: z.string().url().optional(),
  metadata: z
    .object({
      layerCount: z.number().int(),
      cameraCount: z.number().int(),
      hasAudio: z.boolean(),
      hasBackground: z.boolean(),
      complexity: z.enum(['beginner', 'intermediate', 'advanced', 'expert'])
    })
    .optional(),
  rating: z
    .object({
      average: z.number().min(0).max(5),
      count: z.number().int()
    })
    .default({ average: 0, count: 0 }),
  popularity: z.number().int().default(0),
  sceneData: z.any(), // Full scene data
  version: z.string().default('1.0.0'),
  createdAt: z.date(),
  updatedAt: z.date()
})

export type Template = z.infer<typeof TemplateSchema>
