"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.plans = exports.userApiKeys = exports.aiUsage = exports.exports = exports.templates = exports.audioFiles = exports.scenes = exports.projects = exports.channels = exports.assets = exports.userRoles = exports.roleResources = exports.roles = exports.billingHistory = exports.subscriptions = exports.subscriptionHistory = exports.activityLogs = exports.verifications = exports.accounts = exports.sessions = exports.users = void 0;
var pg_core_1 = require("drizzle-orm/pg-core");
exports.users = (0, pg_core_1.pgTable)('users', {
    id: (0, pg_core_1.text)('id').primaryKey(),
    name: (0, pg_core_1.text)('name').notNull(),
    firstname: (0, pg_core_1.text)('firstname'),
    lastname: (0, pg_core_1.text)('lastname'),
    email: (0, pg_core_1.text)('email').notNull().unique(),
    emailVerified: (0, pg_core_1.boolean)('email_verified').notNull(),
    image: (0, pg_core_1.text)('image'),
    role: (0, pg_core_1.text)('role').notNull().default('user'),
    banned: (0, pg_core_1.boolean)('banned').notNull().default(false),
    banReason: (0, pg_core_1.text)('ban_reason'),
    banExpires: (0, pg_core_1.timestamp)('ban_expires'),
    isAdmin: (0, pg_core_1.boolean)('is_admin').notNull().default(false),
    subscriptionPlan: (0, pg_core_1.text)('subscription_plan').notNull().default('free'),
    stripeCustomerId: (0, pg_core_1.text)('stripe_customer_id'), // Better Auth Stripe plugin
    // API access control
    hasApiAccess: (0, pg_core_1.boolean)('has_api_access').notNull().default(false),
    useOwnApiKeys: (0, pg_core_1.boolean)('use_own_api_keys').notNull().default(false),
    createdAt: (0, pg_core_1.timestamp)('created_at').notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').notNull()
});
exports.sessions = (0, pg_core_1.pgTable)('sessions', {
    id: (0, pg_core_1.text)('id').primaryKey(),
    expiresAt: (0, pg_core_1.timestamp)('expires_at').notNull(),
    token: (0, pg_core_1.text)('token').notNull().unique(),
    createdAt: (0, pg_core_1.timestamp)('created_at').notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').notNull(),
    ipAddress: (0, pg_core_1.text)('ip_address'),
    userAgent: (0, pg_core_1.text)('user_agent'),
    userId: (0, pg_core_1.text)('user_id')
        .notNull()
        .references(function () { return exports.users.id; }),
    impersonatedBy: (0, pg_core_1.text)('impersonated_by').references(function () { return exports.users.id; })
});
exports.accounts = (0, pg_core_1.pgTable)('accounts', {
    id: (0, pg_core_1.text)('id').primaryKey(),
    accountId: (0, pg_core_1.text)('account_id').notNull(),
    providerId: (0, pg_core_1.text)('provider_id').notNull(),
    userId: (0, pg_core_1.text)('user_id')
        .notNull()
        .references(function () { return exports.users.id; }),
    accessToken: (0, pg_core_1.text)('access_token'),
    refreshToken: (0, pg_core_1.text)('refresh_token'),
    idToken: (0, pg_core_1.text)('id_token'),
    accessTokenExpiresAt: (0, pg_core_1.timestamp)('access_token_expires_at'),
    refreshTokenExpiresAt: (0, pg_core_1.timestamp)('refresh_token_expires_at'),
    scope: (0, pg_core_1.text)('scope'),
    password: (0, pg_core_1.text)('password'),
    createdAt: (0, pg_core_1.timestamp)('created_at').notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').notNull()
});
exports.verifications = (0, pg_core_1.pgTable)('verifications', {
    id: (0, pg_core_1.text)('id').primaryKey(),
    identifier: (0, pg_core_1.text)('identifier').notNull(),
    value: (0, pg_core_1.text)('value').notNull(),
    expiresAt: (0, pg_core_1.timestamp)('expires_at').notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at'),
    updatedAt: (0, pg_core_1.timestamp)('updated_at')
});
exports.activityLogs = (0, pg_core_1.pgTable)('activity_logs', {
    id: (0, pg_core_1.text)('id').primaryKey(),
    userId: (0, pg_core_1.text)('user_id')
        .notNull()
        .references(function () { return exports.users.id; }, { onDelete: 'cascade' }),
    action: (0, pg_core_1.text)('action').notNull(),
    timestamp: (0, pg_core_1.timestamp)('timestamp').notNull().defaultNow(),
    ipAddress: (0, pg_core_1.varchar)('ip_address', { length: 45 })
});
exports.subscriptionHistory = (0, pg_core_1.pgTable)('subscription_history', {
    id: (0, pg_core_1.text)('id').primaryKey(),
    userId: (0, pg_core_1.text)('user_id')
        .notNull()
        .references(function () { return exports.users.id; }, { onDelete: 'cascade' }),
    action: (0, pg_core_1.text)('action').notNull(),
    oldPlan: (0, pg_core_1.text)('old_plan'),
    newPlan: (0, pg_core_1.text)('new_plan'),
    amount: (0, pg_core_1.text)('amount'),
    currency: (0, pg_core_1.text)('currency'),
    status: (0, pg_core_1.text)('status').notNull(),
    timestamp: (0, pg_core_1.timestamp)('timestamp').notNull().defaultNow()
});
// Better Auth Stripe plugin subscriptions table
exports.subscriptions = (0, pg_core_1.pgTable)('subscriptions', {
    id: (0, pg_core_1.text)('id').primaryKey(),
    plan: (0, pg_core_1.text)('plan').notNull(),
    referenceId: (0, pg_core_1.text)('reference_id').notNull(), // user or organization ID
    stripeCustomerId: (0, pg_core_1.text)('stripe_customer_id').notNull(),
    stripeSubscriptionId: (0, pg_core_1.text)('stripe_subscription_id').notNull(),
    status: (0, pg_core_1.text)('status').notNull(), // active, canceled, past_due, trialing, etc.
    periodStart: (0, pg_core_1.timestamp)('period_start'),
    periodEnd: (0, pg_core_1.timestamp)('period_end'),
    cancelAtPeriodEnd: (0, pg_core_1.boolean)('cancel_at_period_end').default(false),
    seats: (0, pg_core_1.integer)('seats').default(1),
    trialStart: (0, pg_core_1.timestamp)('trial_start'),
    trialEnd: (0, pg_core_1.timestamp)('trial_end'),
    createdAt: (0, pg_core_1.timestamp)('created_at').notNull().defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').notNull().defaultNow()
});
exports.billingHistory = (0, pg_core_1.pgTable)('billing_history', {
    id: (0, pg_core_1.text)('id').primaryKey(),
    userId: (0, pg_core_1.text)('user_id')
        .notNull()
        .references(function () { return exports.users.id; }, { onDelete: 'cascade' }),
    stripeInvoiceId: (0, pg_core_1.text)('stripe_invoice_id').unique(),
    stripePaymentIntentId: (0, pg_core_1.text)('stripe_payment_intent_id'),
    amount: (0, pg_core_1.integer)('amount').notNull(), // in cents
    currency: (0, pg_core_1.text)('currency').notNull().default('eur'),
    status: (0, pg_core_1.text)('status').notNull(), // paid, pending, failed, refunded
    plan: (0, pg_core_1.text)('plan').notNull(),
    interval: (0, pg_core_1.text)('interval'), // monthly, yearly
    invoiceUrl: (0, pg_core_1.text)('invoice_url'),
    pdfUrl: (0, pg_core_1.text)('pdf_url'),
    metadata: (0, pg_core_1.jsonb)('metadata').$type(),
    createdAt: (0, pg_core_1.timestamp)('created_at').notNull().defaultNow()
});
exports.roles = (0, pg_core_1.pgTable)('roles', {
    id: (0, pg_core_1.text)('id').primaryKey(),
    name: (0, pg_core_1.text)('name').notNull().unique(),
    description: (0, pg_core_1.text)('description'),
    createdAt: (0, pg_core_1.timestamp)('created_at').notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').notNull()
});
exports.roleResources = (0, pg_core_1.pgTable)('role_resources', {
    id: (0, pg_core_1.text)('id').primaryKey(),
    roleId: (0, pg_core_1.text)('role_id')
        .notNull()
        .references(function () { return exports.roles.id; }, { onDelete: 'cascade' }),
    resourceType: (0, pg_core_1.text)('resource_type').notNull().$type(),
    actions: (0, pg_core_1.jsonb)('actions').notNull().$type(),
    createdAt: (0, pg_core_1.timestamp)('created_at').notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').notNull()
});
exports.userRoles = (0, pg_core_1.pgTable)('user_roles', {
    id: (0, pg_core_1.text)('id').primaryKey(),
    userId: (0, pg_core_1.text)('user_id')
        .notNull()
        .references(function () { return exports.users.id; }, { onDelete: 'cascade' }),
    roleId: (0, pg_core_1.text)('role_id')
        .notNull()
        .references(function () { return exports.roles.id; }, { onDelete: 'cascade' }),
    createdAt: (0, pg_core_1.timestamp)('created_at').notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').notNull()
});
// Assets (Images) table
exports.assets = (0, pg_core_1.pgTable)('assets', {
    id: (0, pg_core_1.text)('id').primaryKey(),
    userId: (0, pg_core_1.text)('user_id')
        .notNull()
        .references(function () { return exports.users.id; }, { onDelete: 'cascade' }),
    name: (0, pg_core_1.text)('name').notNull(),
    url: (0, pg_core_1.text)('url').notNull(),
    thumbnailUrl: (0, pg_core_1.text)('thumbnail_url'),
    type: (0, pg_core_1.text)('type').notNull(), // MIME type
    size: (0, pg_core_1.integer)('size').notNull(), // in bytes
    width: (0, pg_core_1.integer)('width'),
    height: (0, pg_core_1.integer)('height'),
    tags: (0, pg_core_1.jsonb)('tags').$type().default([]),
    category: (0, pg_core_1.text)('category').notNull().default('other'), // illustration, icon, background, other
    lastUsed: (0, pg_core_1.timestamp)('last_used'),
    usageCount: (0, pg_core_1.integer)('usage_count').notNull().default(0),
    metadata: (0, pg_core_1.jsonb)('metadata').$type(),
    uploadedAt: (0, pg_core_1.timestamp)('uploaded_at').notNull().defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').notNull().defaultNow()
});
// Channels table
exports.channels = (0, pg_core_1.pgTable)('channels', {
    id: (0, pg_core_1.text)('id').primaryKey(),
    userId: (0, pg_core_1.text)('user_id')
        .notNull()
        .references(function () { return exports.users.id; }, { onDelete: 'cascade' }),
    name: (0, pg_core_1.text)('name').notNull(),
    description: (0, pg_core_1.text)('description'),
    youtubeUrl: (0, pg_core_1.text)('youtube_url'),
    brandKit: (0, pg_core_1.jsonb)('brand_kit')
        .$type()
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
    projectCount: (0, pg_core_1.integer)('project_count').notNull().default(0),
    totalVideosExported: (0, pg_core_1.integer)('total_videos_exported').notNull().default(0),
    status: (0, pg_core_1.text)('status').notNull().default('active'), // active, archived
    createdAt: (0, pg_core_1.timestamp)('created_at').notNull().defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').notNull().defaultNow()
});
// Projects table
exports.projects = (0, pg_core_1.pgTable)('projects', {
    id: (0, pg_core_1.text)('id').primaryKey(),
    userId: (0, pg_core_1.text)('user_id')
        .notNull()
        .references(function () { return exports.users.id; }, { onDelete: 'cascade' }),
    channelId: (0, pg_core_1.text)('channel_id')
        .notNull()
        .references(function () { return exports.channels.id; }, { onDelete: 'cascade' }),
    title: (0, pg_core_1.text)('title').notNull(),
    description: (0, pg_core_1.text)('description'),
    thumbnailUrl: (0, pg_core_1.text)('thumbnail_url'),
    resolution: (0, pg_core_1.text)('resolution').notNull().default('1080p'), // 720p, 1080p, 4k
    aspectRatio: (0, pg_core_1.text)('aspect_ratio').notNull().default('16:9'), // 16:9, 9:16, 1:1, 4:5
    fps: (0, pg_core_1.integer)('fps').notNull().default(30), // 24, 30, 60
    duration: (0, pg_core_1.integer)('duration').notNull().default(0), // in seconds
    status: (0, pg_core_1.text)('status').notNull().default('draft'), // draft, in_progress, completed
    createdAt: (0, pg_core_1.timestamp)('created_at').notNull().defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').notNull().defaultNow(),
    deletedAt: (0, pg_core_1.timestamp)('deleted_at')
});
// Scenes table
exports.scenes = (0, pg_core_1.pgTable)('scenes', {
    id: (0, pg_core_1.text)('id').primaryKey(),
    projectId: (0, pg_core_1.text)('project_id')
        .notNull()
        .references(function () { return exports.projects.id; }, { onDelete: 'cascade' }),
    title: (0, pg_core_1.text)('title').notNull(),
    content: (0, pg_core_1.text)('content'),
    duration: (0, pg_core_1.integer)('duration').notNull().default(10), // in seconds
    animation: (0, pg_core_1.text)('animation').default('fade'),
    backgroundImage: (0, pg_core_1.text)('background_image'),
    sceneImage: (0, pg_core_1.text)('scene_image'),
    layers: (0, pg_core_1.jsonb)('layers')
        .$type()
        .default([]),
    cameras: (0, pg_core_1.jsonb)('cameras')
        .$type()
        .default([]),
    sceneCameras: (0, pg_core_1.jsonb)('scene_cameras').$type().default([]),
    multiTimeline: (0, pg_core_1.jsonb)('multi_timeline').$type().default({}),
    audio: (0, pg_core_1.jsonb)('audio').$type().default({}),
    sceneAudio: (0, pg_core_1.jsonb)('scene_audio').$type(),
    transitionType: (0, pg_core_1.text)('transition_type').default('fade'), // none, fade, slide
    draggingSpeed: (0, pg_core_1.real)('dragging_speed').default(1),
    slideDuration: (0, pg_core_1.integer)('slide_duration').default(0),
    syncSlideWithVoice: (0, pg_core_1.boolean)('sync_slide_with_voice').default(false),
    createdAt: (0, pg_core_1.timestamp)('created_at').notNull().defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').notNull().defaultNow()
});
// Audio Files table
exports.audioFiles = (0, pg_core_1.pgTable)('audio_files', {
    id: (0, pg_core_1.text)('id').primaryKey(),
    userId: (0, pg_core_1.text)('user_id')
        .notNull()
        .references(function () { return exports.users.id; }, { onDelete: 'cascade' }),
    fileName: (0, pg_core_1.text)('file_name').notNull(),
    fileUrl: (0, pg_core_1.text)('file_url').notNull(),
    duration: (0, pg_core_1.real)('duration').notNull(), // in seconds
    size: (0, pg_core_1.integer)('size').notNull(), // in bytes
    category: (0, pg_core_1.text)('category').notNull().default('other'), // music, sfx, voiceover, ambient, other
    tags: (0, pg_core_1.jsonb)('tags').$type().default([]),
    isFavorite: (0, pg_core_1.boolean)('is_favorite').notNull().default(false),
    trimConfig: (0, pg_core_1.jsonb)('trim_config').$type(),
    fadeConfig: (0, pg_core_1.jsonb)('fade_config').$type(),
    uploadedAt: (0, pg_core_1.timestamp)('uploaded_at').notNull().defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').notNull().defaultNow()
});
// Templates table
exports.templates = (0, pg_core_1.pgTable)('templates', {
    id: (0, pg_core_1.text)('id').primaryKey(),
    name: (0, pg_core_1.text)('name').notNull(),
    description: (0, pg_core_1.text)('description').notNull(),
    type: (0, pg_core_1.text)('type').notNull(), // education, marketing, presentation, tutorial, entertainment, other
    style: (0, pg_core_1.text)('style').notNull(), // minimal, colorful, professional, creative, dark, light
    tags: (0, pg_core_1.jsonb)('tags').$type().default([]),
    thumbnail: (0, pg_core_1.text)('thumbnail'),
    previewAnimation: (0, pg_core_1.text)('preview_animation'),
    metadata: (0, pg_core_1.jsonb)('metadata').$type(),
    rating: (0, pg_core_1.jsonb)('rating')
        .$type()
        .default({ average: 0, count: 0 }),
    popularity: (0, pg_core_1.integer)('popularity').notNull().default(0),
    sceneData: (0, pg_core_1.jsonb)('scene_data').$type().notNull(),
    version: (0, pg_core_1.text)('version').notNull().default('1.0.0'),
    createdAt: (0, pg_core_1.timestamp)('created_at').notNull().defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').notNull().defaultNow()
});
// Exports table (for tracking video export jobs)
exports.exports = (0, pg_core_1.pgTable)('exports', {
    id: (0, pg_core_1.text)('id').primaryKey(),
    projectId: (0, pg_core_1.text)('project_id').references(function () { return exports.projects.id; }, { onDelete: 'cascade' }),
    sceneId: (0, pg_core_1.text)('scene_id').references(function () { return exports.scenes.id; }, { onDelete: 'cascade' }),
    userId: (0, pg_core_1.text)('user_id')
        .notNull()
        .references(function () { return exports.users.id; }, { onDelete: 'cascade' }),
    format: (0, pg_core_1.text)('format').notNull(), // mp4, webm, mov, png, jpg
    quality: (0, pg_core_1.text)('quality').notNull(), // low, medium, high, ultra
    resolution: (0, pg_core_1.text)('resolution').notNull(), // 720p, 1080p, 4k
    fps: (0, pg_core_1.integer)('fps'),
    status: (0, pg_core_1.text)('status').notNull().default('queued'), // queued, processing, completed, failed, cancelled
    progress: (0, pg_core_1.integer)('progress').notNull().default(0), // 0-100
    currentStep: (0, pg_core_1.text)('current_step'),
    videoUrl: (0, pg_core_1.text)('video_url'),
    error: (0, pg_core_1.text)('error'),
    estimatedDuration: (0, pg_core_1.integer)('estimated_duration'), // in seconds
    watermark: (0, pg_core_1.jsonb)('watermark').$type(),
    createdAt: (0, pg_core_1.timestamp)('created_at').notNull().defaultNow(),
    completedAt: (0, pg_core_1.timestamp)('completed_at')
});
// AI Usage tracking for pay-per-use billing
exports.aiUsage = (0, pg_core_1.pgTable)('ai_usage', {
    id: (0, pg_core_1.text)('id').primaryKey(),
    userId: (0, pg_core_1.text)('user_id')
        .notNull()
        .references(function () { return exports.users.id; }, { onDelete: 'cascade' }),
    month: (0, pg_core_1.text)('month').notNull(), // Format: YYYY-MM
    videoGenerationCount: (0, pg_core_1.integer)('video_generation_count').notNull().default(0),
    scriptGenerationCount: (0, pg_core_1.integer)('script_generation_count').notNull().default(0),
    imageGenerationCount: (0, pg_core_1.integer)('image_generation_count').notNull().default(0),
    voiceGenerationCount: (0, pg_core_1.integer)('voice_generation_count').notNull().default(0),
    musicGenerationCount: (0, pg_core_1.integer)('music_generation_count').notNull().default(0),
    createdAt: (0, pg_core_1.timestamp)('created_at').notNull().defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').notNull().defaultNow()
});
// User API Keys table - stores encrypted API keys for external services
exports.userApiKeys = (0, pg_core_1.pgTable)('user_api_keys', {
    id: (0, pg_core_1.text)('id').primaryKey(),
    userId: (0, pg_core_1.text)('user_id')
        .notNull()
        .references(function () { return exports.users.id; }, { onDelete: 'cascade' }),
    provider: (0, pg_core_1.text)('provider').notNull(), // 'openai', 'elevenlabs', 'mubert', 'minimax', 'gemini'
    encryptedApiKey: (0, pg_core_1.text)('encrypted_api_key').notNull(), // Encrypted API key
    isActive: (0, pg_core_1.boolean)('is_active').notNull().default(true),
    lastValidated: (0, pg_core_1.timestamp)('last_validated'),
    validationStatus: (0, pg_core_1.text)('validation_status'), // 'valid', 'invalid', 'pending'
    metadata: (0, pg_core_1.jsonb)('metadata').$type(),
    createdAt: (0, pg_core_1.timestamp)('created_at').notNull().defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').notNull().defaultNow()
});
// Plans table - manages subscription plans
exports.plans = (0, pg_core_1.pgTable)('plans', {
    id: (0, pg_core_1.text)('id').primaryKey(),
    name: (0, pg_core_1.text)('name').notNull(),
    slug: (0, pg_core_1.text)('slug').notNull().unique(),
    description: (0, pg_core_1.text)('description'),
    isActive: (0, pg_core_1.boolean)('is_active').notNull().default(true),
    isPublic: (0, pg_core_1.boolean)('is_public').notNull().default(true),
    sortOrder: (0, pg_core_1.integer)('sort_order').notNull().default(0),
    // Pricing (stored in cents)
    priceMonthly: (0, pg_core_1.integer)('price_monthly').notNull().default(0),
    priceYearly: (0, pg_core_1.integer)('price_yearly').notNull().default(0),
    // Features as JSONB for flexibility
    features: (0, pg_core_1.jsonb)('features')
        .$type()
        .notNull(),
    // Stripe Integration
    stripeProductId: (0, pg_core_1.text)('stripe_product_id'),
    stripePriceIdMonthly: (0, pg_core_1.text)('stripe_price_id_monthly'),
    stripePriceIdYearly: (0, pg_core_1.text)('stripe_price_id_yearly'),
    // Additional metadata
    metadata: (0, pg_core_1.jsonb)('metadata').$type(),
    createdAt: (0, pg_core_1.timestamp)('created_at').notNull().defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').notNull().defaultNow()
});
