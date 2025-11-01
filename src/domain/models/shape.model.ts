import { z } from 'zod'

export const ShapeAssetSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  name: z.string().min(1),
  url: z.string().url(),
  thumbnailUrl: z.string().url().optional(),
  type: z.enum(['svg', 'path', 'geometric']).default('svg'),
  size: z.number().int().positive(),
  width: z.number().int().optional(),
  height: z.number().int().optional(),
  tags: z.array(z.string()).default([]),
  category: z.enum(['basic', 'arrow', 'callout', 'banner', 'icon', 'decorative', 'other']).default('other'),
  shapeData: z
    .object({
      svgContent: z.string().optional(), // Full SVG content
      pathData: z.string().optional(), // SVG path data
      viewBox: z.string().optional(), // SVG viewBox attribute
      fill: z.string().optional(), // Default fill color
      stroke: z.string().optional(), // Default stroke color
      strokeWidth: z.number().optional(), // Default stroke width
      isEditable: z.boolean().default(true) // Whether colors/stroke can be edited
    })
    .optional(),
  lastUsed: z.date().optional(),
  usageCount: z.number().int().default(0),
  uploadedAt: z.date(),
  updatedAt: z.date()
})

export type ShapeAsset = z.infer<typeof ShapeAssetSchema>
