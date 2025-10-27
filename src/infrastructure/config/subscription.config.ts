import process from 'node:process'
import type { SubscriptionPlan } from '@/domain/types/subscription.type'

export const pricingData: SubscriptionPlan[] = [
  {
    id: 'free',
    title: 'Gratuit',
    description: 'Plan gratuit - Vidéos illimitées de 1 minute',
    childLimit: 0,
    prices: {
      monthly: 0,
      yearly: 0
    },
    stripeIds: {
      monthly: null,
      yearly: null
    },
    features: {
      maxScenes: -1, // unlimited
      maxDuration: 60, // 1 minute in seconds
      exportQuality: '720p',
      hasWatermark: true,
      storageType: 'local',
      cloudProjectsLimit: 0,
      maxAudioTracks: 1,
      assetsLibrarySize: 50,
      customFonts: 10,
      hasAIVoice: false,
      hasAIScriptGenerator: false,
      maxCollaborators: 0,
      supportLevel: 'forum',
      hasTemplates: false,
      hasBranding: false,
      hasAPI: false
    }
  },
  {
    id: 'starter',
    title: 'Starter',
    description: 'Créateur - Vidéos de 5 minutes',
    childLimit: 0,
    prices: {
      monthly: 5,
      yearly: 50
    },
    stripeIds: {
      monthly: process.env.STRIPE_STARTER_MONTHLY_PRICE_ID || '',
      yearly: process.env.STRIPE_STARTER_YEARLY_PRICE_ID || ''
    },
    features: {
      maxScenes: -1, // unlimited
      maxDuration: 300, // 5 minutes in seconds
      exportQuality: '1080p',
      hasWatermark: false,
      storageType: 'cloud',
      cloudProjectsLimit: 10,
      maxAudioTracks: 3,
      assetsLibrarySize: 500,
      customFonts: 50,
      hasAIVoice: false,
      hasAIScriptGenerator: false,
      maxCollaborators: 0,
      supportLevel: 'email_48h',
      hasTemplates: true,
      hasBranding: false,
      hasAPI: false
    }
  },
  {
    id: 'pro',
    title: 'Pro',
    description: 'Professionnel - Vidéos illimitées',
    childLimit: 3,
    prices: {
      monthly: 9,
      yearly: 90
    },
    stripeIds: {
      monthly: process.env.STRIPE_PRO_MONTHLY_PRICE_ID || '',
      yearly: process.env.STRIPE_PRO_YEARLY_PRICE_ID || ''
    },
    features: {
      maxScenes: -1, // unlimited
      maxDuration: -1, // unlimited
      exportQuality: '4k',
      hasWatermark: false,
      storageType: 'cloud',
      cloudProjectsLimit: -1, // unlimited
      maxAudioTracks: -1, // unlimited
      assetsLibrarySize: 2000,
      customFonts: -1, // unlimited
      hasAIVoice: false, // AI features are add-ons
      hasAIScriptGenerator: false,
      hasAIImageGenerator: false,
      aiVideoLimit: 0, // AI features require add-on
      maxCollaborators: 3,
      supportLevel: 'priority_24h',
      hasTemplates: true,
      hasBranding: true,
      hasAPI: false
    }
  },
  {
    id: 'enterprise',
    title: 'Entreprise',
    description: 'Business - Solutions sur-mesure',
    childLimit: -1, // unlimited
    prices: {
      monthly: 49,
      yearly: 490
    },
    stripeIds: {
      monthly: process.env.STRIPE_ENTERPRISE_MONTHLY_PRICE_ID || '',
      yearly: process.env.STRIPE_ENTERPRISE_YEARLY_PRICE_ID || ''
    },
    features: {
      maxScenes: -1, // unlimited
      maxDuration: -1, // unlimited
      exportQuality: '4k',
      hasWatermark: false,
      storageType: 'cloud',
      cloudProjectsLimit: -1, // unlimited
      maxAudioTracks: -1, // unlimited
      assetsLibrarySize: -1, // unlimited
      customFonts: -1, // unlimited
      hasAIVoice: false, // AI features optional via API keys
      hasAIScriptGenerator: false,
      hasAIImageGenerator: false,
      hasAIMusic: false,
      aiVideoLimit: 0,
      maxCollaborators: -1, // unlimited
      supportLevel: 'premium_4h',
      hasTemplates: true,
      hasBranding: true,
      hasAPI: true,
      hasSSO: true,
      hasDedicatedSupport: true,
      hasCustomBranding: true,
      hasSLA: true
    }
  }
]

// Helper function to get plan by ID
export function getPlanById(planId: string): SubscriptionPlan | undefined {
  return pricingData.find((plan) => plan.id === planId)
}

// Helper function to check if plan has feature
export function hasFeature(planId: string, feature: keyof SubscriptionPlan['features']): boolean {
  const plan = getPlanById(planId)
  const value = plan?.features?.[feature]
  return typeof value === 'boolean' ? value : false
}

// Helper function to get feature limit
export function getFeatureLimit(planId: string, feature: keyof SubscriptionPlan['features']): number {
  const plan = getPlanById(planId)
  const value = plan?.features?.[feature]
  return typeof value === 'number' ? value : 0
}

// Helper function to check if feature is unlimited (-1)
export function isFeatureUnlimited(planId: string, feature: keyof SubscriptionPlan['features']): boolean {
  const limit = getFeatureLimit(planId, feature)
  return limit === -1
}
