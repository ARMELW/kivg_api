export type SubscriptionPlanFeatures = {
  maxScenes: number // -1 for unlimited
  maxDuration: number // in seconds, -1 for unlimited
  exportQuality: '720p' | '1080p' | '4k'
  hasWatermark: boolean
  storageType: 'local' | 'cloud'
  cloudProjectsLimit: number // -1 for unlimited
  maxAudioTracks: number // -1 for unlimited
  assetsLibrarySize: number // -1 for unlimited
  customFonts: number // -1 for unlimited
  hasAIVoice: boolean
  hasAIScriptGenerator: boolean
  maxCollaborators: number // -1 for unlimited
  supportLevel: 'forum' | 'email_48h' | 'priority_24h' | 'premium_4h'
  hasTemplates: boolean
  hasBranding: boolean
  hasAPI: boolean
  hasSSO?: boolean
  hasDedicatedSupport?: boolean
  hasCustomBranding?: boolean
  hasSLA?: boolean
}

export type SubscriptionPlan = {
  id: string
  title: string
  description: string
  childLimit: number
  prices: {
    monthly: number
    yearly: number
  }
  stripeIds: {
    monthly: string | null
    yearly: string | null
  }
  features: SubscriptionPlanFeatures
}

export type UserSubscriptionPlan = SubscriptionPlan & {
  stripeCurrentPeriodEnd: number
  isTrialActive: boolean
  trialStartDate: string | null
  trialEndDate: string | null
  hasUsedTrial: boolean
  isPaid: boolean
  interval: 'month' | 'year' | null
  isCanceled?: boolean
}
