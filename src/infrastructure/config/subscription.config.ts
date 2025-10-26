import process from 'node:process'
import type { SubscriptionPlan } from '@/domain/types/subscription.type'

export const pricingData: SubscriptionPlan[] = [
  {
    id: 'free',
    title: 'Gratuit',
    description: 'Découverte - Démarrez sans risque',
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
      maxScenes: 3,
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
    description: 'Créateur - Pour les créateurs débutants',
    childLimit: 0,
    prices: {
      monthly: 9,
      yearly: 90
    },
    stripeIds: {
      monthly: process.env.STRIPE_STARTER_MONTHLY_PRICE_ID || '',
      yearly: process.env.STRIPE_STARTER_YEARLY_PRICE_ID || ''
    },
    features: {
      maxScenes: 10,
      maxDuration: 300, // 5 minutes in seconds
      exportQuality: '1080p',
      hasWatermark: false,
      storageType: 'cloud',
      cloudProjectsLimit: 5,
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
    description: 'Professionnel - Pour les créateurs établis',
    childLimit: 3,
    prices: {
      monthly: 39,
      yearly: 390
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
      hasAIVoice: true,
      hasAIScriptGenerator: true,
      hasAIImageGenerator: true,
      aiVideoLimit: 30, // 30 AI videos per month
      maxCollaborators: 3,
      supportLevel: 'priority_24h',
      hasTemplates: true,
      hasBranding: true,
      hasAPI: false
    }
  },
  {
    id: 'pro_plus',
    title: 'Pro Plus',
    description: 'Avancé - Production intensive avec musique IA',
    childLimit: 5,
    prices: {
      monthly: 59,
      yearly: 590
    },
    stripeIds: {
      monthly: process.env.STRIPE_PRO_PLUS_MONTHLY_PRICE_ID || '',
      yearly: process.env.STRIPE_PRO_PLUS_YEARLY_PRICE_ID || ''
    },
    features: {
      maxScenes: -1, // unlimited
      maxDuration: -1, // unlimited
      exportQuality: '4k',
      hasWatermark: false,
      storageType: 'cloud',
      cloudProjectsLimit: -1, // unlimited
      maxAudioTracks: -1, // unlimited
      assetsLibrarySize: 5000,
      customFonts: -1, // unlimited
      hasAIVoice: true,
      hasAIScriptGenerator: true,
      hasAIImageGenerator: true,
      hasAIMusic: true,
      aiVideoLimit: 100, // 100 AI videos per month
      maxCollaborators: 5,
      supportLevel: 'priority_12h',
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
      monthly: 149,
      yearly: 1490
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
      hasAIVoice: true,
      hasAIScriptGenerator: true,
      hasAIImageGenerator: true,
      hasAIMusic: true,
      aiVideoLimit: 250, // 250 AI videos per month
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
