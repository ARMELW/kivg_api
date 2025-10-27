import type { PlanRepositoryInterface } from '@/domain/repositories/plan.repository.interface'
import { ErrorCode } from '@/domain/types/error.type'
import { IUseCase } from '@/domain/types/use-case.type'
import { ActivityType } from '@/infrastructure/config/activity.config'

type Params = {
  id: string
}

type Response = {
  success: boolean
  error?: string
  errorCode?: ErrorCode
}

export class DeletePlanUseCase extends IUseCase<Params, Response> {
  constructor(private readonly planRepository: PlanRepositoryInterface) {
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
          errorCode: ErrorCode.NOT_FOUND
        }
      }

      // Soft delete the plan
      const deleted = await this.planRepository.delete(params.id)

      if (!deleted) {
        return {
          success: false,
          error: 'Failed to delete plan',
          errorCode: ErrorCode.INTERNAL_ERROR
        }
      }

      return {
        success: true
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to delete plan',
        errorCode: ErrorCode.INTERNAL_ERROR
      }
    }
  }

  log(): ActivityType {
    return ActivityType.DELETE_PLAN
  }
}
