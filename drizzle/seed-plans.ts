import process from 'node:process'
import { StripePlanSyncService } from '../src/application/services/stripe-plan-sync.service'
import { CreatePlanUseCase } from '../src/application/use-cases/plan/create-plan.use-case'
import { pricingData } from '../src/infrastructure/config/subscription.config'
import { PlanRepository } from '../src/infrastructure/repositories/plan.repository'

async function seedPlans() {
  console.log('🌱 Seeding plans...')

  try {
    // Use repository and use case
    const planRepository = new PlanRepository()
    const stripePlanSyncService = new StripePlanSyncService(planRepository)
    const useCase = new CreatePlanUseCase(planRepository, stripePlanSyncService)

    // Check if plans already exist
    const existingPlans = await planRepository.findAll()
    if (existingPlans.length > 0) {
      console.log('⚠️  Plans already exist. Skipping seed.')
      return
    }

    let createdCount = 0
    for (const [index, plan] of pricingData.entries()) {
      const dto = {
        name: plan.title,
        slug: plan.id,
        description: plan.description,
        isActive: true,
        isPublic: true,
        sortOrder: index,
        pricing: {
          monthly: plan.prices.monthly * 100,
          yearly: plan.prices.yearly * 100
        },
        features: plan.features,
        stripeProductId: null,
        stripePriceIdMonthly: plan.stripeIds.monthly,
        stripePriceIdYearly: plan.stripeIds.yearly,
        metadata: {
          childLimit: plan.childLimit
        }
      }
      const result = await useCase.execute(dto)
      if (result.success) {
        createdCount++
        console.log(`   - ${dto.name} (${dto.slug}) [OK]`)
      } else {
        console.error(`   - ${dto.name} (${dto.slug}) [ERROR]: ${result.error}`)
      }
    }
    console.log(`✅ Successfully seeded ${createdCount} plans.`)
  } catch (error) {
    console.error('❌ Error seeding plans:', error)
    throw error
  }
}

// Run seed
seedPlans()
  .then(() => {
    console.log('🎉 Plan seed completed!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Plan seed failed:', error)
    process.exit(1)
  })
