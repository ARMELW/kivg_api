import { IUseCase } from '@/domain/types/use-case.type'
import { ActivityType } from '@/infrastructure/config/activity.config'
import type { Plan } from '@/domain/models/plan.model'
import type { PlanRepositoryInterface } from '@/domain/repositories/plan.repository.interface'

type Params = {
  filters?: {
    isActive?: boolean
    isPublic?: boolean
  }
}

type Response = {
  data: Plan[]
  success: boolean
  error?: string
}

export class GetAllPlansUseCase extends IUseCase<Params, Response> {
  constructor(private readonly planRepository: PlanRepositoryInterface) {
    super()
  }

  async execute(params: Params): Promise<Response> {
    try {
      const plans = await this.planRepository.findAll(params.filters)

      return {
        data: plans,
        success: true
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to fetch plans',
        data: []
      }
    }
  }

  log(): ActivityType {
    return ActivityType.GET_PLANS
  }
}
