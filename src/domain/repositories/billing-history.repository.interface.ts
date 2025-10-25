import type { BillingHistory } from '../models/billing-history.model'

export interface BillingHistoryRepositoryInterface {
  findById: (id: string) => Promise<BillingHistory | null>
  findByUserId: (userId: string, pagination?: { skip: number; limit: number }) => Promise<BillingHistory[]>
  findByStripeInvoiceId: (stripeInvoiceId: string) => Promise<BillingHistory | null>
  create: (data: Omit<BillingHistory, 'id' | 'createdAt'>) => Promise<BillingHistory>
  countByUserId: (userId: string) => Promise<number>
}
