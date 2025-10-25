import { z } from 'zod'

export const ExportSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid().optional(),
  sceneId: z.string().uuid().optional(),
  userId: z.string().uuid(),
  format: z.enum(['mp4', 'webm', 'mov', 'png', 'jpg']),
  quality: z.enum(['low', 'medium', 'high', 'ultra']),
  resolution: z.enum(['720p', '1080p', '4k']),
  fps: z.union([z.literal(24), z.literal(30), z.literal(60)]).optional(),
  status: z.enum(['queued', 'processing', 'completed', 'failed', 'cancelled']).default('queued'),
  progress: z.number().int().min(0).max(100).default(0),
  currentStep: z.string().optional(),
  videoUrl: z.string().url().optional(),
  error: z.string().optional(),
  estimatedDuration: z.number().int().optional(), // in seconds
  watermark: z
    .object({
      enabled: z.boolean(),
      text: z.string().optional(),
      position: z.enum(['top-left', 'top-right', 'bottom-left', 'bottom-right']).optional()
    })
    .optional(),
  createdAt: z.date(),
  completedAt: z.date().nullable().optional()
})

export type Export = z.infer<typeof ExportSchema>
