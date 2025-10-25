import { z } from 'zod'

export const BillingHistorySchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  stripeInvoiceId: z.string().optional(),
  stripePaymentIntentId: z.string().optional(),
  amount: z.number().int().positive(),
  currency: z.string().default('eur'),
  status: z.enum(['paid', 'pending', 'failed', 'refunded']),
  plan: z.string(),
  interval: z.enum(['monthly', 'yearly']).optional(),
  invoiceUrl: z.string().url().optional(),
  pdfUrl: z.string().url().optional(),
  metadata: z.record(z.any()).optional(),
  createdAt: z.date()
})

export type BillingHistory = z.infer<typeof BillingHistorySchema>
