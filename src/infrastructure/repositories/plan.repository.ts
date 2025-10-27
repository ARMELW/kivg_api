import { and, eq, or } from 'drizzle-orm'
import { randomUUID } from 'node:crypto'
import type { CreatePlanDTO, Plan, UpdatePlanDTO } from '@/domain/models/plan.model'
import type { PlanRepositoryInterface } from '@/domain/repositories/plan.repository.interface'
import { db } from '../database/db'
import { plans } from '../database/schema/schema'

export class PlanRepository implements PlanRepositoryInterface {
  async findById(id: string): Promise<Plan | null> {
    const result = await db.query.plans.findFirst({
      where: eq(plans.id, id)
    })

    if (!result) return null

    return this.mapToPlan(result)
  }

  async findBySlug(slug: string): Promise<Plan | null> {
    const result = await db.query.plans.findFirst({
      where: eq(plans.slug, slug)
    })

    if (!result) return null

    return this.mapToPlan(result)
  }

  async findAll(filters?: { isActive?: boolean; isPublic?: boolean }): Promise<Plan[]> {
    // Build the query with filters - using AND logic for multiple conditions
    const conditions = []
    if (filters?.isActive !== undefined) {
      conditions.push(eq(plans.isActive, filters.isActive))
    }
    if (filters?.isPublic !== undefined) {
      conditions.push(eq(plans.isPublic, filters.isPublic))
    }

    let results
    if (conditions.length > 0) {
      // Use and() to combine conditions - plans must match ALL criteria
      results = await db.select().from(plans).where(and(...conditions)).orderBy(plans.sortOrder, plans.createdAt)
    } else {
      results = await db.select().from(plans).orderBy(plans.sortOrder, plans.createdAt)
    }

    return results.map((result) => this.mapToPlan(result))
  }

  async create(data: CreatePlanDTO): Promise<Plan> {
    const id = randomUUID()
    const now = new Date()

    const [result] = await db
      .insert(plans)
      .values({
        id,
        name: data.name,
        slug: data.slug,
        description: data.description,
        isActive: data.isActive ?? true,
        isPublic: data.isPublic ?? true,
        sortOrder: data.sortOrder ?? 0,
        priceMonthly: data.pricing.monthly,
        priceYearly: data.pricing.yearly,
        features: data.features,
        stripeProductId: data.stripeProductId,
        stripePriceIdMonthly: data.stripePriceIdMonthly,
        stripePriceIdYearly: data.stripePriceIdYearly,
        metadata: data.metadata,
        createdAt: now,
        updatedAt: now
      })
      .returning()

    return this.mapToPlan(result)
  }

  async update(id: string, data: UpdatePlanDTO): Promise<Plan> {
    const updateData: any = {
      updatedAt: new Date()
    }

    if (data.name !== undefined) updateData.name = data.name
    if (data.slug !== undefined) updateData.slug = data.slug
    if (data.description !== undefined) updateData.description = data.description
    if (data.isActive !== undefined) updateData.isActive = data.isActive
    if (data.isPublic !== undefined) updateData.isPublic = data.isPublic
    if (data.sortOrder !== undefined) updateData.sortOrder = data.sortOrder
    if (data.stripeProductId !== undefined) updateData.stripeProductId = data.stripeProductId
    if (data.stripePriceIdMonthly !== undefined) updateData.stripePriceIdMonthly = data.stripePriceIdMonthly
    if (data.stripePriceIdYearly !== undefined) updateData.stripePriceIdYearly = data.stripePriceIdYearly
    if (data.metadata !== undefined) updateData.metadata = data.metadata

    if (data.pricing) {
      if (data.pricing.monthly !== undefined) updateData.priceMonthly = data.pricing.monthly
      if (data.pricing.yearly !== undefined) updateData.priceYearly = data.pricing.yearly
    }

    if (data.features) {
      // Merge features with existing ones
      const existingPlan = await this.findById(id)
      if (!existingPlan) {
        throw new Error('Plan not found')
      }
      updateData.features = {
        ...existingPlan.features,
        ...data.features
      }
    }

    const [result] = await db.update(plans).set(updateData).where(eq(plans.id, id)).returning()

    if (!result) {
      throw new Error('Plan not found')
    }

    return this.mapToPlan(result)
  }

  async delete(id: string): Promise<boolean> {
    // Soft delete by setting isActive to false
    const result = await db
      .update(plans)
      .set({
        isActive: false,
        updatedAt: new Date()
      })
      .where(eq(plans.id, id))
      .returning()

    return result.length > 0
  }

  async slugExists(slug: string, excludeId?: string): Promise<boolean> {
    const query = db.select({ id: plans.id }).from(plans).where(eq(plans.slug, slug))

    const results = await query

    if (results.length === 0) return false

    if (excludeId) {
      return results.some((r) => r.id !== excludeId)
    }

    return true
  }

  async findByStripePriceId(priceId: string): Promise<Plan | null> {
    const result = await db.query.plans.findFirst({
      where: or(eq(plans.stripePriceIdMonthly, priceId), eq(plans.stripePriceIdYearly, priceId))
    })

    if (!result) return null

    return this.mapToPlan(result)
  }

  private mapToPlan(row: any): Plan {
    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      description: row.description,
      isActive: row.isActive,
      isPublic: row.isPublic,
      sortOrder: row.sortOrder,
      pricing: {
        monthly: row.priceMonthly,
        yearly: row.priceYearly
      },
      features: row.features,
      stripeProductId: row.stripeProductId,
      stripePriceIdMonthly: row.stripePriceIdMonthly,
      stripePriceIdYearly: row.stripePriceIdYearly,
      metadata: row.metadata,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt
    }
  }
}
