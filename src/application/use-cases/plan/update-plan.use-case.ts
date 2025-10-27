import { ErrorCode } from '@/domain/types/error.type'
import { IUseCase } from '@/domain/types/use-case.type'
import { ActivityType } from '@/infrastructure/config/activity.config'
import type { StripePlanSyncService } from '@/application/services/stripe-plan-sync.service'
import type { Plan, UpdatePlanDTO } from '@/domain/models/plan.model'
import type { PlanRepositoryInterface } from '@/domain/repositories/plan.repository.interface'

type Params = {
  id: string
  data: UpdatePlanDTO
}

type Response = {
  data: Plan
  success: boolean
  error?: string
  errorCode?: ErrorCode
}

export class UpdatePlanUseCase extends IUseCase<Params, Response> {
  constructor(
    private readonly planRepository: PlanRepositoryInterface,
    private readonly stripePlanSyncService?: StripePlanSyncService
  ) {
    super()
  }

  async execute(params: Params): Promise<Response> {
    try {
      // Check if plan exists
      const existingPlan = await this.planRepository.findById(params.id)
      if (!existingPlan) {
        return {
          success: false,
          error: 'Plan not found',
          errorCode: ErrorCode.NOT_FOUND,
          data: null as any
        }
      }

      // If slug is being updated, check it doesn't conflict
      if (params.data.slug && params.data.slug !== existingPlan.slug) {
        const slugExists = await this.planRepository.slugExists(params.data.slug, params.id)
        if (slugExists) {
          return {
            success: false,
            error: `Plan with slug '${params.data.slug}' already exists`,
            errorCode: ErrorCode.ALREADY_EXISTS,
            data: null as any
          }
        }
      }

      // Update the plan
      const plan = await this.planRepository.update(params.id, params.data)

      // Automatically sync with Stripe if service is available and plan has pricing
      if (this.stripePlanSyncService && (plan.pricing.monthly > 0 || plan.pricing.yearly > 0)) {
        const syncResult = await this.stripePlanSyncService.syncPlanToStripe(plan)
        if (!syncResult.success) {
          // Log warning but don't fail the plan update
          console.warn(`Failed to sync plan ${plan.id} to Stripe: ${syncResult.error}`)
        }
      }

      return {
        data: plan,
        success: true
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to update plan',
        errorCode: ErrorCode.INTERNAL_ERROR,
        data: null as any
      }
    }
  }

  log(): ActivityType {
    return ActivityType.UPDATE_PLAN
  }
}
