import type { CreatePlanDTO, Plan } from '@/domain/models/plan.model'
import type { PlanRepositoryInterface } from '@/domain/repositories/plan.repository.interface'
import { ErrorCode } from '@/domain/types/error.type'
import { IUseCase } from '@/domain/types/use-case.type'
import { ActivityType } from '@/infrastructure/config/activity.config'

type Params = CreatePlanDTO

type Response = {
  data: Plan
  success: boolean
  error?: string
  errorCode?: ErrorCode
}

export class CreatePlanUseCase extends IUseCase<Params, Response> {
  constructor(private readonly planRepository: PlanRepositoryInterface) {
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
