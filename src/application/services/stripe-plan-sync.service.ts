import { env } from 'node:process'
import Stripe from 'stripe'
import type { Plan } from '@/domain/models/plan.model'
import type { PlanRepositoryInterface } from '@/domain/repositories/plan.repository.interface'

/**
 * Service to sync plans with Stripe
 * Creates/updates Stripe products and prices based on plan data
 */
export class StripePlanSyncService {
  private stripe: Stripe | null

  constructor(private planRepository: PlanRepositoryInterface) {
    const stripeSecretKey = env.STRIPE_SECRET_KEY ?? ''
    this.stripe = stripeSecretKey.length > 0 ? new Stripe(stripeSecretKey, { apiVersion: '2025-09-30.clover' }) : null
  }

  /**
   * Sync a plan with Stripe
   * Creates or updates the Stripe product and prices
   */
  async syncPlanToStripe(plan: Plan): Promise<{
    success: boolean
    stripeProductId?: string
    stripePriceIdMonthly?: string
    stripePriceIdYearly?: string
    error?: string
  }> {
    if (!this.stripe) {
      return {
        success: false,
        error: 'Stripe is not configured'
      }
    }

    try {
      // Create or update Stripe product
      let stripeProduct: Stripe.Product

      if (plan.stripeProductId) {
        // Update existing product
        stripeProduct = await this.stripe.products.update(plan.stripeProductId, {
          name: plan.name,
          description: plan.description || undefined,
          active: plan.isActive,
          metadata: {
            planId: plan.id,
            slug: plan.slug
          }
        })
      } else {
        // Create new product
        stripeProduct = await this.stripe.products.create({
          name: plan.name,
          description: plan.description || undefined,
          active: plan.isActive,
          metadata: {
            planId: plan.id,
            slug: plan.slug
          }
        })
      }

      // Create or update monthly price
      let monthlyPrice: Stripe.Price | undefined
      if (plan.pricing.monthly > 0) {
        if (plan.stripePriceIdMonthly) {
          // Get existing price (prices are immutable, so we may need to create a new one)
          monthlyPrice = await this.stripe.prices.retrieve(plan.stripePriceIdMonthly)
          // If price amount changed, create new price and deactivate old one
          if (monthlyPrice.unit_amount !== plan.pricing.monthly) {
            await this.stripe.prices.update(plan.stripePriceIdMonthly, { active: false })
            monthlyPrice = await this.stripe.prices.create({
              product: stripeProduct.id,
              unit_amount: plan.pricing.monthly,
              currency: 'eur',
              recurring: {
                interval: 'month'
              },
              metadata: {
                planId: plan.id,
                slug: plan.slug
              }
            })
          }
        } else {
          // Create new monthly price
          monthlyPrice = await this.stripe.prices.create({
            product: stripeProduct.id,
            unit_amount: plan.pricing.monthly,
            currency: 'eur',
            recurring: {
              interval: 'month'
            },
            metadata: {
              planId: plan.id,
              slug: plan.slug
            }
          })
        }
      }

      // Create or update yearly price
      let yearlyPrice: Stripe.Price | undefined
      if (plan.pricing.yearly > 0) {
        if (plan.stripePriceIdYearly) {
          yearlyPrice = await this.stripe.prices.retrieve(plan.stripePriceIdYearly)
          if (yearlyPrice.unit_amount !== plan.pricing.yearly) {
            await this.stripe.prices.update(plan.stripePriceIdYearly, { active: false })
            yearlyPrice = await this.stripe.prices.create({
              product: stripeProduct.id,
              unit_amount: plan.pricing.yearly,
              currency: 'eur',
              recurring: {
                interval: 'year'
              },
              metadata: {
                planId: plan.id,
                slug: plan.slug
              }
            })
          }
        } else {
          yearlyPrice = await this.stripe.prices.create({
            product: stripeProduct.id,
            unit_amount: plan.pricing.yearly,
            currency: 'eur',
            recurring: {
              interval: 'year'
            },
            metadata: {
              planId: plan.id,
              slug: plan.slug
            }
          })
        }
      }

      // Update plan with Stripe IDs
      await this.planRepository.update(plan.id, {
        stripeProductId: stripeProduct.id,
        stripePriceIdMonthly: monthlyPrice?.id,
        stripePriceIdYearly: yearlyPrice?.id
      })

      return {
        success: true,
        stripeProductId: stripeProduct.id,
        stripePriceIdMonthly: monthlyPrice?.id,
        stripePriceIdYearly: yearlyPrice?.id
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to sync plan to Stripe'
      }
    }
  }

  /**
   * Sync all plans to Stripe
   */
  async syncAllPlansToStripe(): Promise<{
    success: boolean
    synced: number
    failed: number
    errors: string[]
  }> {
    if (!this.stripe) {
      return {
        success: false,
        synced: 0,
        failed: 0,
        errors: ['Stripe is not configured']
      }
    }

    const plans = await this.planRepository.findAll({ isActive: true })
    const errors: string[] = []
    let synced = 0
    let failed = 0

    for (const plan of plans) {
      const result = await this.syncPlanToStripe(plan)
      if (result.success) {
        synced++
      } else {
        failed++
        errors.push(`${plan.name}: ${result.error}`)
      }
    }

    return {
      success: failed === 0,
      synced,
      failed,
      errors
    }
  }
}
