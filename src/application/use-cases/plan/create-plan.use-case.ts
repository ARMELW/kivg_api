import type { StripePlanSyncService } from '@/application/services/stripe-plan-sync.service'
import type { CreatePlanDTO, Plan } from '@/domain/models/plan.model'
import type { PlanRepositoryInterface } from '@/domain/repositories/plan.repository.interface'
import { IUseCase } from '@/domain/types/use-case.type'
import { ErrorCode } from '@/domain/types/error.type'
import { ActivityType } from '@/infrastructure/config/activity.config'

type Params = CreatePlanDTO

type Response = {
  data: Plan
  success: boolean
  error?: string
  errorCode?: ErrorCode
}

export class CreatePlanUseCase extends IUseCase<Params, Response> {
  constructor(
    private readonly planRepository: PlanRepositoryInterface,
    private readonly stripePlanSyncService?: StripePlanSyncService
  ) {
    super()
  }

  async execute(params: Params): Promise<Response> {
    try {
      // Validate slug doesn't exist
      const slugExists = await this.planRepository.slugExists(params.slug)
      if (slugExists) {
        return {
          success: false,
          error: `Plan with slug '${params.slug}' already exists`,
          errorCode: ErrorCode.ALREADY_EXISTS,
          data: null as any
        }
      }

      // Create the plan
      const plan = await this.planRepository.create(params)

      // Automatically sync with Stripe if service is available
      if (this.stripePlanSyncService && (params.pricing.monthly > 0 || params.pricing.yearly > 0)) {
        const syncResult = await this.stripePlanSyncService.syncPlanToStripe(plan)
        if (!syncResult.success) {
          // Log warning but don't fail the plan creation
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
        error: error.message || 'Failed to create plan',
        errorCode: ErrorCode.INTERNAL_ERROR,
        data: null as any
      }
    }
  }

  log(): ActivityType {
    return ActivityType.CREATE_PLAN
  }
}
