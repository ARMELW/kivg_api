import { IUseCase } from '@/domain/types/use-case.type'
import { ActivityType } from '@/infrastructure/config/activity.config'
import type { BillingHistory } from '@/domain/models/billing-history.model'
import type { BillingHistoryRepositoryInterface } from '@/domain/repositories/billing-history.repository.interface'

type Params = {
  userId: string
  page?: number
  limit?: number
}

type Response = {
  data: {
    items: BillingHistory[]
    total: number
    page: number
    limit: number
    totalPages: number
  } | null
  success: boolean
  error?: string
}

export class GetBillingHistoryUseCase extends IUseCase<Params, Response> {
  constructor(private readonly billingHistoryRepository: BillingHistoryRepositoryInterface) {
    super()
  }

  async execute(params: Params): Promise<Response> {
    try {
      const { userId, page = 1, limit = 10 } = params
      const skip = (page - 1) * limit

      const items = await this.billingHistoryRepository.findByUserId(userId, { skip, limit })
      const total = await this.billingHistoryRepository.countByUserId(userId)
      const totalPages = Math.ceil(total / limit)

      return {
        success: true,
        data: {
          items,
          total,
          page,
          limit,
          totalPages
        }
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to get billing history',
        data: null
      }
    }
  }

  log(): ActivityType {
    return ActivityType.GET_BILLING_HISTORY
  }
}
