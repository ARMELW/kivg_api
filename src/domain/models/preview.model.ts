import { z } from 'zod'

export const PreviewSchema = z.object({
  id: z.string().uuid(),
  sceneId: z.string().uuid(),
  userId: z.string().uuid(),
  status: z.enum(['queued', 'processing', 'completed', 'failed', 'cancelled']).default('queued'),
  progress: z.number().int().min(0).max(100).default(0),
  currentStep: z.string().optional(),
  previewUrl: z.string().url().optional(),
  error: z.string().optional(),
  createdAt: z.date(),
  completedAt: z.date().nullable().optional()
})

export type Preview = z.infer<typeof PreviewSchema>
