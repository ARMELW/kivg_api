import { boolean, integer, jsonb, pgTable, real, text, timestamp, varchar } from 'drizzle-orm/pg-core'
import type { Action, Subject } from '../../../domain/types/permission.type'

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  firstname: text('firstname'),
  lastname: text('lastname'),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull(),
  image: text('image'),
  role: text('role').notNull().default('user'),
  banned: boolean('banned').notNull().default(false),
  banReason: text('ban_reason'),
  banExpires: timestamp('ban_expires'),
  isAdmin: boolean('is_admin').notNull().default(false),
  subscriptionPlan: text('subscription_plan').notNull().default('free'),
  stripeCustomerId: text('stripe_customer_id'), // Better Auth Stripe plugin
  // API access control
  hasApiAccess: boolean('has_api_access').notNull().default(false),
  useOwnApiKeys: boolean('use_own_api_keys').notNull().default(false),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull()
})

export const sessions = pgTable('sessions', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expires_at').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id')
    .notNull()
    .references(() => users.id),
  impersonatedBy: text('impersonated_by').references(() => users.id)
})

export const accounts = pgTable('accounts', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull()
})

export const verifications = pgTable('verifications', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at'),
  updatedAt: timestamp('updated_at')
})

export const activityLogs = pgTable('activity_logs', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  action: text('action').notNull(),
  timestamp: timestamp('timestamp').notNull().defaultNow(),
  ipAddress: varchar('ip_address', { length: 45 })
})

export const subscriptionHistory = pgTable('subscription_history', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  action: text('action').notNull(),
  oldPlan: text('old_plan'),
  newPlan: text('new_plan'),
  amount: text('amount'),
  currency: text('currency'),
  status: text('status').notNull(),
  timestamp: timestamp('timestamp').notNull().defaultNow()
})

// Better Auth Stripe plugin subscriptions table
export const subscriptions = pgTable('subscriptions', {
  id: text('id').primaryKey(),
  plan: text('plan').notNull(),
  referenceId: text('reference_id').notNull(), // user or organization ID
  stripeCustomerId: text('stripe_customer_id').notNull(),
  stripeSubscriptionId: text('stripe_subscription_id').notNull(),
  status: text('status').notNull(), // active, canceled, past_due, trialing, etc.
  periodStart: timestamp('period_start'),
  periodEnd: timestamp('period_end'),
  cancelAtPeriodEnd: boolean('cancel_at_period_end').default(false),
  seats: integer('seats').default(1),
  trialStart: timestamp('trial_start'),
  trialEnd: timestamp('trial_end'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
})

export const billingHistory = pgTable('billing_history', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  stripeInvoiceId: text('stripe_invoice_id').unique(),
  stripePaymentIntentId: text('stripe_payment_intent_id'),
  amount: integer('amount').notNull(), // in cents
  currency: text('currency').notNull().default('eur'),
  status: text('status').notNull(), // paid, pending, failed, refunded
  plan: text('plan').notNull(),
  interval: text('interval'), // monthly, yearly
  invoiceUrl: text('invoice_url'),
  pdfUrl: text('pdf_url'),
  metadata: jsonb('metadata').$type<Record<string, any>>(),
  createdAt: timestamp('created_at').notNull().defaultNow()
})

export const roles = pgTable('roles', {
  id: text('id').primaryKey(),
  name: text('name').notNull().unique(),
  description: text('description'),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull()
})

export const roleResources = pgTable('role_resources', {
  id: text('id').primaryKey(),
  roleId: text('role_id')
    .notNull()
    .references(() => roles.id, { onDelete: 'cascade' }),
  resourceType: text('resource_type').notNull().$type<Subject>(),
  actions: jsonb('actions').notNull().$type<Action[]>(),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull()
})

export const userRoles = pgTable('user_roles', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  roleId: text('role_id')
    .notNull()
    .references(() => roles.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull()
})

// Assets (Images) table
export const assets = pgTable('assets', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  url: text('url').notNull(),
  thumbnailUrl: text('thumbnail_url'),
  type: text('type').notNull(), // MIME type
  size: integer('size').notNull(), // in bytes
  width: integer('width'),
  height: integer('height'),
  tags: jsonb('tags').$type<string[]>().default([]),
  category: text('category').notNull().default('other'), // illustration, icon, background, other
  lastUsed: timestamp('last_used'),
  usageCount: integer('usage_count').notNull().default(0),
  metadata: jsonb('metadata').$type<{
    format?: string
    colorSpace?: string
    hasAlpha?: boolean
  }>(),
  uploadedAt: timestamp('uploaded_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
})

// Channels table
export const channels = pgTable('channels', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  youtubeUrl: text('youtube_url'),
  brandKit: jsonb('brand_kit')
    .$type<{
      logoUrl?: string | null
      colors?: {
        primary?: string
        secondary?: string
        accent?: string
      }
      introVideoUrl?: string | null
      outroVideoUrl?: string | null
      customFonts?: string | null
    }>()
    .default({
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
  projectCount: integer('project_count').notNull().default(0),
  totalVideosExported: integer('total_videos_exported').notNull().default(0),
  status: text('status').notNull().default('active'), // active, archived
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
})

// Projects table
export const projects = pgTable('projects', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  channelId: text('channel_id')
    .notNull()
    .references(() => channels.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  thumbnailUrl: text('thumbnail_url'),
  resolution: text('resolution').notNull().default('1080p'), // 720p, 1080p, 4k
  aspectRatio: text('aspect_ratio').notNull().default('16:9'), // 16:9, 9:16, 1:1, 4:5
  fps: integer('fps').notNull().default(30), // 24, 30, 60
  duration: integer('duration').notNull().default(0), // in seconds
  status: text('status').notNull().default('draft'), // draft, in_progress, completed
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  deletedAt: timestamp('deleted_at')
})

// Scenes table
export const scenes = pgTable('scenes', {
  id: text('id').primaryKey(),
  projectId: text('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  content: text('content'),
  duration: integer('duration').notNull().default(10), // in seconds
  animation: text('animation').default('fade'),
  backgroundImage: text('background_image'),
  sceneImage: text('scene_image'),
  layers: jsonb('layers')
    .$type<
      Array<{
        id: string
        name: string
        type: 'image' | 'text' | 'shape' | 'video' | 'audio'
        mode: 'draw' | 'static' | 'animated'
        position: { x: number; y: number }
        width?: number
        height?: number
        zIndex: number
        scale: number
        opacity: number
        skipRate?: number
        imagePath?: string
        text?: string
        locked?: boolean
        animationType?: string
        animationSpeed?: number
        endDelay?: number
        handType?: string
      }>
    >()
    .default([]),
  cameras: jsonb('cameras')
    .$type<
      Array<{
        id: string
        name: string
        position: { x: number; y: number }
        scale?: number
        zoom?: number
        width?: number
        height?: number
        animation?: any
        locked?: boolean
        isDefault?: boolean
        duration?: number
        transitionDuration?: number
        easing?: string
        pauseDuration?: number
        movementType?: string
      }>
    >()
    .default([]),
  sceneCameras: jsonb('scene_cameras').$type<any[]>().default([]),
  multiTimeline: jsonb('multi_timeline').$type<any>().default({}),
  audio: jsonb('audio').$type<any>().default({}),
  sceneAudio: jsonb('scene_audio').$type<any>(),
  transitionType: text('transition_type').default('fade'), // none, fade, slide
  draggingSpeed: real('dragging_speed').default(1),
  slideDuration: integer('slide_duration').default(0),
  syncSlideWithVoice: boolean('sync_slide_with_voice').default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
})

// Audio Files table
export const audioFiles = pgTable('audio_files', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  fileName: text('file_name').notNull(),
  fileUrl: text('file_url').notNull(),
  duration: real('duration').notNull(), // in seconds
  size: integer('size').notNull(), // in bytes
  category: text('category').notNull().default('other'), // music, sfx, voiceover, ambient, other
  tags: jsonb('tags').$type<string[]>().default([]),
  isFavorite: boolean('is_favorite').notNull().default(false),
  trimConfig: jsonb('trim_config').$type<{
    startTime?: number
    endTime?: number
  }>(),
  fadeConfig: jsonb('fade_config').$type<{
    fadeIn?: number
    fadeOut?: number
  }>(),
  uploadedAt: timestamp('uploaded_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
})

// Templates table
export const templates = pgTable('templates', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  type: text('type').notNull(), // education, marketing, presentation, tutorial, entertainment, other
  style: text('style').notNull(), // minimal, colorful, professional, creative, dark, light
  tags: jsonb('tags').$type<string[]>().default([]),
  thumbnail: text('thumbnail'),
  previewAnimation: text('preview_animation'),
  metadata: jsonb('metadata').$type<{
    layerCount: number
    cameraCount: number
    hasAudio: boolean
    hasBackground: boolean
    complexity: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  }>(),
  rating: jsonb('rating')
    .$type<{
      average: number
      count: number
    }>()
    .default({ average: 0, count: 0 }),
  popularity: integer('popularity').notNull().default(0),
  sceneData: jsonb('scene_data').$type<any>().notNull(),
  version: text('version').notNull().default('1.0.0'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
})

// Exports table (for tracking video export jobs)
export const exports = pgTable('exports', {
  id: text('id').primaryKey(),
  projectId: text('project_id').references(() => projects.id, { onDelete: 'cascade' }),
  sceneId: text('scene_id').references(() => scenes.id, { onDelete: 'cascade' }),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  format: text('format').notNull(), // mp4, webm, mov, png, jpg
  quality: text('quality').notNull(), // low, medium, high, ultra
  resolution: text('resolution').notNull(), // 720p, 1080p, 4k
  fps: integer('fps'),
  status: text('status').notNull().default('queued'), // queued, processing, completed, failed, cancelled
  progress: integer('progress').notNull().default(0), // 0-100
  currentStep: text('current_step'),
  videoUrl: text('video_url'),
  error: text('error'),
  estimatedDuration: integer('estimated_duration'), // in seconds
  watermark: jsonb('watermark').$type<{
    enabled: boolean
    text?: string
    position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  }>(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  completedAt: timestamp('completed_at')
})

export const previews = pgTable('previews', {
  id: text('id').primaryKey(),
  sceneId: text('scene_id')
    .notNull()
    .references(() => scenes.id, { onDelete: 'cascade' }),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  status: text('status').notNull().default('queued'), // queued, processing, completed, failed, cancelled
  progress: integer('progress').notNull().default(0), // 0-100
  currentStep: text('current_step'),
  previewUrl: text('preview_url'),
  error: text('error'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  completedAt: timestamp('completed_at')
})

// AI Usage tracking for pay-per-use billing
export const aiUsage = pgTable('ai_usage', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  month: text('month').notNull(), // Format: YYYY-MM
  videoGenerationCount: integer('video_generation_count').notNull().default(0),
  scriptGenerationCount: integer('script_generation_count').notNull().default(0),
  imageGenerationCount: integer('image_generation_count').notNull().default(0),
  voiceGenerationCount: integer('voice_generation_count').notNull().default(0),
  musicGenerationCount: integer('music_generation_count').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
})

// User API Keys table - stores encrypted API keys for external services
export const userApiKeys = pgTable('user_api_keys', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  provider: text('provider').notNull(), // 'openai', 'elevenlabs', 'mubert', 'minimax', 'gemini'
  encryptedApiKey: text('encrypted_api_key').notNull(), // Encrypted API key
  isActive: boolean('is_active').notNull().default(true),
  lastValidated: timestamp('last_validated'),
  validationStatus: text('validation_status'), // 'valid', 'invalid', 'pending'
  metadata: jsonb('metadata').$type<{
    keyName?: string
    addedBy?: string
    lastUsed?: string
  }>(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
})

// Plans table - manages subscription plans
export const plans = pgTable('plans', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  isActive: boolean('is_active').notNull().default(true),
  isPublic: boolean('is_public').notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0),
  // Pricing (stored in cents)
  priceMonthly: integer('price_monthly').notNull().default(0),
  priceYearly: integer('price_yearly').notNull().default(0),
  // Features as JSONB for flexibility
  features: jsonb('features')
    .$type<{
      maxScenes: number
      maxDuration: number
      exportQuality: '720p' | '1080p' | '4k'
      hasWatermark: boolean
      storageType: 'local' | 'cloud'
      cloudProjectsLimit: number
      maxAudioTracks: number
      assetsLibrarySize: number
      customFonts: number
      hasAIVoice: boolean
      hasAIScriptGenerator: boolean
      hasAIImageGenerator?: boolean
      hasAIMusic?: boolean
      aiVideoLimit?: number
      maxCollaborators: number
      supportLevel: 'forum' | 'email_48h' | 'priority_24h' | 'priority_12h' | 'premium_4h'
      hasTemplates: boolean
      hasBranding: boolean
      hasAPI: boolean
      hasSSO?: boolean
      hasDedicatedSupport?: boolean
      hasCustomBranding?: boolean
      hasSLA?: boolean
    }>()
    .notNull(),
  // Stripe Integration
  stripeProductId: text('stripe_product_id'),
  stripePriceIdMonthly: text('stripe_price_id_monthly'),
  stripePriceIdYearly: text('stripe_price_id_yearly'),
  // Additional metadata
  metadata: jsonb('metadata').$type<Record<string, any>>(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
})
