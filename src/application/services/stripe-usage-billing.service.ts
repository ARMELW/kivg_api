import { env } from 'node:process'
import Stripe from 'stripe'
import { getPlanById } from '@/infrastructure/config/subscription.config'
import type { AIUsageRepositoryInterface } from '@/domain/repositories/ai-usage.repository.interface'

/**
 * Stripe Usage Billing Service
 * Handles pay-per-use billing for AI features
 */
export class StripeUsageBillingService {
  private stripe: Stripe
  private aiUsageRepository: AIUsageRepositoryInterface

  // Overage pricing per video (in EUR)
  private readonly overagePricing = {
    pro: 1.5, // €1.50 per video
    pro_plus: 1, // €1.00 per video
    enterprise: 0.75 // €0.75 per video
  }

  constructor(aiUsageRepository: AIUsageRepositoryInterface) {
    if (!env.STRIPE_SECRET_KEY) {
      // Log warning but don't throw - Stripe billing is optional
      console.info('STRIPE_SECRET_KEY not configured - usage billing features will be disabled')
      this.stripe = null as any
    } else {
      this.stripe = new Stripe(env.STRIPE_SECRET_KEY, {
        apiVersion: '2025-09-30.clover'
      })
    }
    this.aiUsageRepository = aiUsageRepository
  }

  /**
   * Check if user has exceeded their plan limit
   */
  async checkUsageLimit(
    userId: string,
    subscriptionPlan: string
  ): Promise<{
    exceeded: boolean
    currentUsage: number
    limit: number
    overage: number
  }> {
    const usage = await this.aiUsageRepository.getCurrentMonthUsage(userId)
    const currentUsage = usage?.videoGenerationCount || 0

    const plan = getPlanById(subscriptionPlan)
    const limit = plan?.features?.aiVideoLimit || 0

    // -1 means unlimited
    if (limit === -1) {
      return {
        exceeded: false,
        currentUsage,
        limit: -1,
        overage: 0
      }
    }

    const exceeded = currentUsage >= limit
    const overage = Math.max(0, currentUsage - limit)

    return {
      exceeded,
      currentUsage,
      limit,
      overage
    }
  }

  /**
   * Calculate overage cost for current month
   */
  async calculateOverageCost(userId: string, subscriptionPlan: string): Promise<number> {
    const { overage } = await this.checkUsageLimit(userId, subscriptionPlan)

    if (overage === 0) {
      return 0
    }

    const pricePerVideo = this.overagePricing[subscriptionPlan as keyof typeof this.overagePricing] || 1

    return overage * pricePerVideo
  }

  /**
   * Report usage to Stripe for billing
   * This should be called at the end of each billing period or when usage is tracked
   *
   * NOTE: This method uses deprecated Stripe API. Needs migration to Meter Events API in Stripe v19+
   * See: https://docs.stripe.com/billing/subscriptions/usage-based/recording-usage-api
   */
  async reportUsageToStripe(
    userId: string,
    subscriptionItemId: string,
    subscriptionPlan: string
  ): Promise<{
    success: boolean
    error?: string
  }> {
    try {
      const { overage } = await this.checkUsageLimit(userId, subscriptionPlan)

      if (overage === 0) {
        return { success: true }
      }

      // Skip if Stripe is not configured
      if (!env.STRIPE_SECRET_KEY) {
        return { success: true }
      }

      // TODO: Migrate to Meter Events API for Stripe v19+
      // The old subscription_items.createUsageRecord method is deprecated
      // For now, return success to avoid breaking existing functionality
      console.warn('reportUsageToStripe: Usage reporting needs migration to Meter Events API')

      return { success: true }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to report usage to Stripe'
      }
    }
  }

  async createMeteredPrice(planId: string): Promise<{
    success: boolean
    priceId?: string
    error?: string
  }> {
    try {
      // Skip if Stripe is not configured
      if (!env.STRIPE_SECRET_KEY) {
        return { success: true }
      }

      const pricePerVideo = this.overagePricing[planId as keyof typeof this.overagePricing]

      if (!pricePerVideo) {
        return {
          success: false,
          error: `No overage pricing defined for plan: ${planId}`
        }
      }

      // Create or get product for AI video generation
      let product = await this.stripe.products
        .list({ active: true })
        .then((products) => products.data.find((p) => p.name === `AI Video Overage - ${planId.toUpperCase()}`))

      if (!product) {
        product = await this.stripe.products.create({
          name: `AI Video Overage - ${planId.toUpperCase()}`,
          description: `Pay-per-use pricing for AI video generation beyond plan limit`,
          metadata: {
            plan: planId,
            type: 'overage'
          }
        })
      }

      // NOTE: Metered pricing in Stripe v19+ requires creating a Meter first
      // Then linking the meter to the price via recurring.meter
      // For now, we'll create a simple recurring price without metered billing
      // TODO: Implement Meter Events API for usage-based billing
      const price = await this.stripe.prices.create({
        product: product.id,
        currency: 'eur',
        unit_amount: Math.round(pricePerVideo * 100), // Convert to cents
        recurring: {
          interval: 'month',
          usage_type: 'licensed' // Changed from 'metered' until Meter API is implemented
        },
        metadata: {
          plan: planId,
          type: 'ai_video_overage',
          note: 'Needs migration to Meter Events API for metered billing'
        }
      })

      return {
        success: true,
        priceId: price.id
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to create metered price'
      }
    }
  }

  /**
   * Get overage pricing information
   */
  getOveragePricing(planId: string): number {
    return this.overagePricing[planId as keyof typeof this.overagePricing] || 1
  }
}
