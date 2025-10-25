import { z } from 'zod'

export const ProjectSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  channelId: z.string().uuid(),
  title: z.string().min(1),
  description: z.string().optional(),
  thumbnailUrl: z.string().url().optional(),
  resolution: z.enum(['720p', '1080p', '4k']).default('1080p'),
  aspectRatio: z.enum(['16:9', '9:16', '1:1', '4:5']).default('16:9'),
  fps: z.union([z.literal(24), z.literal(30), z.literal(60)]).default(30),
  duration: z.number().int().default(0), // in seconds
  status: z.enum(['draft', 'in_progress', 'completed']).default('draft'),
  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date().nullable().optional()
})

export type Project = z.infer<typeof ProjectSchema>
