import { z } from 'zod'

export const PlanFeaturesSchema = z.object({
  maxScenes: z.number().default(-1), // -1 for unlimited
  maxDuration: z.number().default(60), // in seconds, -1 for unlimited
  exportQuality: z.enum(['720p', '1080p', '4k']).default('720p'),
  hasWatermark: z.boolean().default(true),
  storageType: z.enum(['local', 'cloud']).default('local'),
  cloudProjectsLimit: z.number().default(0), // -1 for unlimited
  maxAudioTracks: z.number().default(1), // -1 for unlimited
  assetsLibrarySize: z.number().default(50), // -1 for unlimited
  customFonts: z.number().default(10), // -1 for unlimited
  hasAIVoice: z.boolean().default(false),
  hasAIScriptGenerator: z.boolean().default(false),
  hasAIImageGenerator: z.boolean().default(false),
  hasAIMusic: z.boolean().default(false),
  aiVideoLimit: z.number().default(0), // -1 for unlimited
  maxCollaborators: z.number().default(0), // -1 for unlimited
  supportLevel: z.enum(['forum', 'email_48h', 'priority_24h', 'priority_12h', 'premium_4h']).default('forum'),
  hasTemplates: z.boolean().default(false),
  hasBranding: z.boolean().default(false),
  hasAPI: z.boolean().default(false),
  hasSSO: z.boolean().default(false),
  hasDedicatedSupport: z.boolean().default(false),
  hasCustomBranding: z.boolean().default(false),
  hasSLA: z.boolean().default(false)
})

export const PlanPricingSchema = z.object({
  monthly: z.number().default(0), // price in EUR cents (e.g., 500 = €5.00)
  yearly: z.number().default(0) // price in EUR cents
})

export const PlanSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(50),
  slug: z.string().min(1).max(50), // e.g., 'free', 'starter', 'pro', 'enterprise'
  description: z.string().max(500).optional(),
  isActive: z.boolean().default(true),
  isPublic: z.boolean().default(true), // whether to show in pricing page
  sortOrder: z.number().default(0), // for ordering plans on UI
  pricing: PlanPricingSchema,
  features: PlanFeaturesSchema,
  stripeProductId: z.string().optional(), // Stripe Product ID
  stripePriceIdMonthly: z.string().optional(), // Stripe Price ID for monthly
  stripePriceIdYearly: z.string().optional(), // Stripe Price ID for yearly
  metadata: z.record(z.any()).optional(), // additional flexible data
  createdAt: z.date(),
  updatedAt: z.date()
})

export type PlanFeatures = z.infer<typeof PlanFeaturesSchema>
export type PlanPricing = z.infer<typeof PlanPricingSchema>
export type Plan = z.infer<typeof PlanSchema>

// DTOs for API
export const CreatePlanSchema = PlanSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true
})

export const UpdatePlanSchema = CreatePlanSchema.partial()

export type CreatePlanDTO = z.infer<typeof CreatePlanSchema>
export type UpdatePlanDTO = z.infer<typeof UpdatePlanSchema>
