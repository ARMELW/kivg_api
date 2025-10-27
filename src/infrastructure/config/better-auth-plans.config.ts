import { PlanRepository } from '../repositories/plan.repository'
import type { StripePlan } from '@better-auth/stripe'

/**
 * Fetches plans from the database and formats them for Better Auth Stripe plugin
 * Returns an array of plans with their Stripe price IDs for subscription management
 */
export async function getBetterAuthPlans(): Promise<StripePlan[]> {
  const planRepository = new PlanRepository()

  try {
    // Fetch active and public plans from the database
    const plans = await planRepository.findAll({ isActive: true, isPublic: true })

    // Transform plans to Better Auth format
    // According to Better Auth docs, each plan should be a StripePlan with:
    // - name: plan name (required)
    // - priceId: monthly price ID
    // - annualDiscountPriceId: yearly price ID (optional)
    const betterAuthPlans: StripePlan[] = plans
      .filter((plan) => plan.stripeProductId && plan.stripePriceIdMonthly) // Only include plans with Stripe product and at least monthly price
      .map((plan) => {
        const stripePlan: StripePlan = {
          name: plan.name,
          priceId: plan.stripePriceIdMonthly!
        }

        // Add yearly price ID if available
        if (plan.stripePriceIdYearly) {
          stripePlan.annualDiscountPriceId = plan.stripePriceIdYearly
        }

        return stripePlan
      })

    return betterAuthPlans
  } catch (error) {
    console.error('Error fetching plans for Better Auth:', error)
    // Return empty array on error to prevent auth initialization failure
    return []
  }
}
