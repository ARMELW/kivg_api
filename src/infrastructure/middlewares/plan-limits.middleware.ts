import { getFeatureLimit, getPlanById, isFeatureUnlimited } from '../config/subscription.config'
import type { Context, Next } from 'hono'

/**
 * Middleware to check scene limits based on user's subscription plan
 */
export async function checkSceneLimit(c: Context, next: Next) {
  const user = c.get('user') as any

  if (!user) {
    return c.json({ success: false, error: 'Unauthorized' }, 401)
  }

  // Get user's subscription plan (default to free)
  const userPlan = user.subscriptionPlan || 'free'

  // Check if the user is trying to create/add scenes
  const body = await c.req.json()
  const projectId = c.req.param('projectId') || body.projectId

  if (!projectId) {
    // If no project ID, allow the request to proceed
    return next()
  }

  // Get current scene count for the project
  // This would need to query the database - for now we'll pass through
  // and let the use case handle it
  const maxScenes = getFeatureLimit(userPlan, 'maxScenes')
  const isUnlimited = isFeatureUnlimited(userPlan, 'maxScenes')

  // Store limits in context for use cases to check
  c.set('planLimits', {
    maxScenes: isUnlimited ? -1 : maxScenes,
    isUnlimited
  })

  return next()
}

/**
 * Middleware to check duration limits based on user's subscription plan
 */
export function checkDurationLimit(c: Context, next: Next) {
  const user = c.get('user') as any

  if (!user) {
    return c.json({ success: false, error: 'Unauthorized' }, 401)
  }

  const userPlan = user.subscriptionPlan || 'free'
  const maxDuration = getFeatureLimit(userPlan, 'maxDuration')
  const isUnlimited = isFeatureUnlimited(userPlan, 'maxDuration')

  // Store limits in context for use cases to check
  c.set('planLimits', {
    ...c.get('planLimits'),
    maxDuration: isUnlimited ? -1 : maxDuration,
    isDurationUnlimited: isUnlimited
  })

  return next()
}

/**
 * Middleware to check export quality limits based on user's subscription plan
 */
export async function checkExportQuality(c: Context, next: Next) {
  const user = c.get('user') as any

  if (!user) {
    return c.json({ success: false, error: 'Unauthorized' }, 401)
  }

  const userPlan = user.subscriptionPlan || 'free'
  const plan = getPlanById(userPlan)

  if (!plan) {
    return c.json({ success: false, error: 'Invalid subscription plan' }, 400)
  }

  const allowedQuality = plan.features.exportQuality
  const body = await c.req.json()
  const requestedQuality = body.quality || body.resolution

  // Quality hierarchy: 720p < 1080p < 4k
  const qualityHierarchy: Record<string, number> = {
    '720p': 1,
    '1080p': 2,
    '4k': 3
  }

  if (requestedQuality && qualityHierarchy[requestedQuality] > qualityHierarchy[allowedQuality]) {
    return c.json(
      {
        success: false,
        error: `Your ${userPlan} plan only supports ${allowedQuality} exports. Please upgrade to export in ${requestedQuality}.`,
        upgradeRequired: true,
        currentPlan: userPlan,
        allowedQuality
      },
      403
    )
  }

  // Store quality limit in context
  c.set('planLimits', {
    ...c.get('planLimits'),
    allowedQuality,
    hasWatermark: plan.features.hasWatermark
  })

  return next()
}

/**
 * Middleware to check storage limits based on user's subscription plan
 */
export function checkStorageLimit(c: Context, next: Next) {
  const user = c.get('user') as any

  if (!user) {
    return c.json({ success: false, error: 'Unauthorized' }, 401)
  }

  const userPlan = user.subscriptionPlan || 'free'
  const plan = getPlanById(userPlan)

  if (!plan) {
    return c.json({ success: false, error: 'Invalid subscription plan' }, 400)
  }

  const cloudProjectsLimit = plan.features.cloudProjectsLimit
  const storageType = plan.features.storageType

  // Store storage limits in context
  c.set('planLimits', {
    ...c.get('planLimits'),
    cloudProjectsLimit,
    storageType,
    hasCloudStorage: storageType === 'cloud'
  })

  return next()
}

/**
 * Middleware to check audio tracks limit based on user's subscription plan
 */
export function checkAudioTracksLimit(c: Context, next: Next) {
  const user = c.get('user') as any

  if (!user) {
    return c.json({ success: false, error: 'Unauthorized' }, 401)
  }

  const userPlan = user.subscriptionPlan || 'free'
  const maxAudioTracks = getFeatureLimit(userPlan, 'maxAudioTracks')
  const isUnlimited = isFeatureUnlimited(userPlan, 'maxAudioTracks')

  // Store limits in context
  c.set('planLimits', {
    ...c.get('planLimits'),
    maxAudioTracks: isUnlimited ? -1 : maxAudioTracks,
    isAudioTracksUnlimited: isUnlimited
  })

  return next()
}

/**
 * Middleware to check if user has access to AI features
 */
export function checkAIFeatureAccess(c: Context, next: Next) {
  const user = c.get('user') as any

  if (!user) {
    return c.json({ success: false, error: 'Unauthorized' }, 401)
  }

  const userPlan = user.subscriptionPlan || 'free'
  const plan = getPlanById(userPlan)

  if (!plan) {
    return c.json({ success: false, error: 'Invalid subscription plan' }, 400)
  }

  // Check if user has API access via subscription
  const hasAIVoice = plan.features.hasAIVoice
  const hasAIScriptGenerator = plan.features.hasAIScriptGenerator
  const hasApiAccess = user.hasApiAccess || false
  const useOwnApiKeys = user.useOwnApiKeys || false

  // User can access AI features if:
  // 1. Their plan includes AI features, OR
  // 2. They have API access enabled, OR
  // 3. They are using their own API keys (BYOK)
  const canAccessAI = hasAIVoice || hasAIScriptGenerator || hasApiAccess || useOwnApiKeys

  if (!canAccessAI) {
    return c.json(
      {
        success: false,
        error: 'AI features are not available on your current plan. Please upgrade or configure your own API keys.',
        upgradeRequired: true,
        currentPlan: userPlan,
        canUseBYOK: true
      },
      403
    )
  }

  // Store AI access info in context for use cases
  c.set('aiAccess', {
    hasApiAccess,
    useOwnApiKeys,
    planIncludesAI: hasAIVoice || hasAIScriptGenerator
  })

  return next()
}
