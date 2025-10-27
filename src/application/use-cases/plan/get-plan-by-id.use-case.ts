import type { Plan } from '@/domain/models/plan.model'
import type { PlanRepositoryInterface } from '@/domain/repositories/plan.repository.interface'
import { ErrorCode } from '@/domain/types/error.type'
import { IUseCase } from '@/domain/types/use-case.type'
import { ActivityType } from '@/infrastructure/config/activity.config'

type Params = {
  id: string
}

type Response = {
  data: Plan | null
  success: boolean
  error?: string
  errorCode?: ErrorCode
}

export class GetPlanByIdUseCase extends IUseCase<Params, Response> {
  constructor(private readonly planRepository: PlanRepositoryInterface) {
    super()
  }

  async execute(params: Params): Promise<Response> {
    try {
      const plan = await this.planRepository.findById(params.id)

      if (!plan) {
        return {
          success: false,
          error: 'Plan not found',
          errorCode: ErrorCode.NOT_FOUND,
          data: null
        }
      }

      return {
        data: plan,
        success: true
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to fetch plan',
        errorCode: ErrorCode.INTERNAL_ERROR,
        data: null
      }
    }
  }

  log(): ActivityType {
    return ActivityType.GET_PLAN
  }
}
