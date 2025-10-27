import { randomUUID } from 'node:crypto'
import process from 'node:process'
import { pricingData } from '../src/infrastructure/config/subscription.config'
import { db } from '../src/infrastructure/database/db'
import { plans } from '../src/infrastructure/database/schema/schema'

async function seedPlans() {
  console.log('🌱 Seeding plans...')

  try {
    // Check if plans already exist
    const existingPlans = await db.select().from(plans)
    if (existingPlans.length > 0) {
      console.log('⚠️  Plans already exist. Skipping seed.')
      return
    }

    // Convert existing pricing data to plan format
    const plansToInsert = pricingData.map((plan, index) => ({
      id: randomUUID(),
      name: plan.title,
      slug: plan.id,
      description: plan.description,
      isActive: true,
      isPublic: true,
      sortOrder: index,
      priceMonthly: plan.prices.monthly * 100, // Convert to cents
      priceYearly: plan.prices.yearly * 100, // Convert to cents
      features: plan.features as any,
      stripeProductId: null,
      stripePriceIdMonthly: plan.stripeIds.monthly,
      stripePriceIdYearly: plan.stripeIds.yearly,
      metadata: {
        childLimit: plan.childLimit
      },
      createdAt: new Date(),
      updatedAt: new Date()
    }))

    // Insert plans
    await db.insert(plans).values(plansToInsert)

    console.log(`✅ Successfully seeded ${plansToInsert.length} plans:`)
    plansToInsert.forEach((plan) => {
      console.log(`   - ${plan.name} (${plan.slug})`)
    })
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
