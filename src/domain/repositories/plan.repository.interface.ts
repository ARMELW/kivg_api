import type { CreatePlanDTO, Plan, UpdatePlanDTO } from '../models/plan.model'

export interface PlanRepositoryInterface {
  /**
   * Find a plan by ID
   */
  findById: (id: string) => Promise<Plan | null>

  /**
   * Find a plan by slug
   */
  findBySlug: (slug: string) => Promise<Plan | null>

  /**
   * Find all plans with optional filters
   */
  findAll: (filters?: { isActive?: boolean; isPublic?: boolean }) => Promise<Plan[]>

  /**
   * Create a new plan
   */
  create: (data: CreatePlanDTO) => Promise<Plan>

  /**
   * Update an existing plan
   */
  update: (id: string, data: UpdatePlanDTO) => Promise<Plan>

  /**
   * Delete a plan (soft delete by setting isActive to false)
   */
  delete: (id: string) => Promise<boolean>

  /**
   * Check if a slug exists (for validation)
   */
  slugExists: (slug: string, excludeId?: string) => Promise<boolean>

  /**
   * Get plan by Stripe Price ID
   */
  findByStripePriceId: (priceId: string) => Promise<Plan | null>
}
