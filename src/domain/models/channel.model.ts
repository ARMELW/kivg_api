import { z } from 'zod'

export const BrandKitSchema = z.object({
  logoUrl: z.string().url().nullable().optional(),
  colors: z
    .object({
      primary: z.string().optional(),
      secondary: z.string().optional(),
      accent: z.string().optional()
    })
    .optional(),
  introVideoUrl: z.string().url().nullable().optional(),
  outroVideoUrl: z.string().url().nullable().optional(),
  customFonts: z.string().nullable().optional()
})

export const ChannelSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  name: z.string().min(1),
  description: z.string().optional(),
  youtubeUrl: z.string().url().optional(),
  brandKit: BrandKitSchema.default({
    logoUrl: null,
    colors: {
      primary: '#3B82F6',
      secondary: '#10B981',
      accent: '#F59E0B'
    },
    introVideoUrl: null,
    outroVideoUrl: null,
    customFonts: null
  }),
  projectCount: z.number().int().default(0),
  totalVideosExported: z.number().int().default(0),
  status: z.enum(['active', 'archived']).default('active'),
  createdAt: z.date(),
  updatedAt: z.date()
})

export type BrandKit = z.infer<typeof BrandKitSchema>
export type Channel = z.infer<typeof ChannelSchema>
