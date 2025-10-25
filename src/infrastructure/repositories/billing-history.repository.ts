import { eq } from 'drizzle-orm'
import type { BillingHistory } from '@/domain/models/billing-history.model'
import type { BillingHistoryRepositoryInterface } from '@/domain/repositories/billing-history.repository.interface'
import { db } from '../database/db'
import { billingHistory } from '../database/schema'

export class BillingHistoryRepository implements BillingHistoryRepositoryInterface {
  async findById(id: string): Promise<BillingHistory | null> {
    const result = await db.query.billingHistory.findFirst({
      where: eq(billingHistory.id, id)
    })

    return result ? this.mapToBillingHistory(result) : null
  }

  async findByUserId(userId: string, pagination?: { skip: number; limit: number }): Promise<BillingHistory[]> {
    const query = db
      .select()
      .from(billingHistory)
      .where(eq(billingHistory.userId, userId))
      .orderBy(billingHistory.createdAt)

    if (pagination) {
      query.limit(pagination.limit).offset(pagination.skip)
    }

    const results = await query

    return results.map((result) => this.mapToBillingHistory(result))
  }

  async findByStripeInvoiceId(stripeInvoiceId: string): Promise<BillingHistory | null> {
    const result = await db.query.billingHistory.findFirst({
      where: eq(billingHistory.stripeInvoiceId, stripeInvoiceId)
    })

    return result ? this.mapToBillingHistory(result) : null
  }

  async create(data: Omit<BillingHistory, 'id' | 'createdAt'>): Promise<BillingHistory> {
    const id = crypto.randomUUID()
    const now = new Date()

    await db.insert(billingHistory).values({
      id,
      userId: data.userId,
      stripeInvoiceId: data.stripeInvoiceId || null,
      stripePaymentIntentId: data.stripePaymentIntentId || null,
      amount: data.amount,
      currency: data.currency,
      status: data.status,
      plan: data.plan,
      interval: data.interval || null,
      invoiceUrl: data.invoiceUrl || null,
      pdfUrl: data.pdfUrl || null,
      metadata: data.metadata || null,
      createdAt: now
    })

    return {
      ...data,
      id,
      createdAt: now
    }
  }

  async countByUserId(userId: string): Promise<number> {
    const result = await db.select().from(billingHistory).where(eq(billingHistory.userId, userId))

    return result.length
  }

  private mapToBillingHistory(result: any): BillingHistory {
    return {
      id: result.id,
      userId: result.userId,
      stripeInvoiceId: result.stripeInvoiceId || undefined,
      stripePaymentIntentId: result.stripePaymentIntentId || undefined,
      amount: result.amount,
      currency: result.currency,
      status: result.status,
      plan: result.plan,
      interval: result.interval || undefined,
      invoiceUrl: result.invoiceUrl || undefined,
      pdfUrl: result.pdfUrl || undefined,
      metadata: result.metadata || undefined,
      createdAt: result.createdAt
    }
  }
}
