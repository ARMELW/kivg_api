import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import { GetBillingHistoryUseCase } from '@/application/use-cases/billing/get-billing-history.use-case'
import type { Routes } from '@/domain/types/route.type'
import { getPlanById, pricingData } from '../config/subscription.config'
import { BillingHistoryRepository } from '../repositories/billing-history.repository'

export class PricingController implements Routes {
  public controller: OpenAPIHono
  private billingHistoryRepository: BillingHistoryRepository

  constructor() {
    this.controller = new OpenAPIHono()
    this.billingHistoryRepository = new BillingHistoryRepository()
    this.initRoutes()
  }

  public initRoutes() {
    // Get all pricing plans
    this.controller.openapi(
      createRoute({
        method: 'get',
        path: '/v1/pricing/plans',
        tags: ['Pricing'],
        summary: 'Get all pricing plans',
        description: 'Get all available subscription plans with features and pricing',
        responses: {
          200: {
            description: 'Pricing plans retrieved successfully',
            content: {
              'application/json': {
                schema: z.object({
                  success: z.boolean(),
                  data: z.array(
                    z.object({
                      id: z.string(),
                      title: z.string(),
                      description: z.string(),
                      prices: z.object({
                        monthly: z.number(),
                        yearly: z.number()
                      }),
                      features: z.record(z.any())
                    })
                  )
                })
              }
            }
          }
        }
      }),
      (c: any) => {
        return c.json({
          success: true,
          data: pricingData.map((plan) => ({
            id: plan.id,
            title: plan.title,
            description: plan.description,
            prices: plan.prices,
            features: plan.features
          }))
        })
      }
    )

    // Get specific plan
    this.controller.openapi(
      createRoute({
        method: 'get',
        path: '/v1/pricing/plans/{planId}',
        tags: ['Pricing'],
        summary: 'Get plan details',
        description: 'Get details of a specific subscription plan',
        request: {
          params: z.object({
            planId: z.string()
          })
        },
        responses: {
          200: {
            description: 'Plan details retrieved successfully',
            content: {
              'application/json': {
                schema: z.object({
                  success: z.boolean(),
                  data: z.object({
                    id: z.string(),
                    title: z.string(),
                    description: z.string(),
                    prices: z.object({
                      monthly: z.number(),
                      yearly: z.number()
                    }),
                    features: z.record(z.any())
                  })
                })
              }
            }
          },
          404: {
            description: 'Plan not found',
            content: {
              'application/json': {
                schema: z.object({
                  success: z.boolean(),
                  error: z.string()
                })
              }
            }
          }
        }
      }),
      (c: any) => {
        const { planId } = c.req.param()
        const plan = getPlanById(planId)

        if (!plan) {
          return c.json({ success: false, error: 'Plan not found' }, 404)
        }

        return c.json({
          success: true,
          data: {
            id: plan.id,
            title: plan.title,
            description: plan.description,
            prices: plan.prices,
            features: plan.features
          }
        })
      }
    )

    // Get billing history (authenticated)
    this.controller.openapi(
      createRoute({
        method: 'get',
        path: '/v1/pricing/billing-history',
        tags: ['Pricing'],
        summary: 'Get billing history',
        description: 'Get billing history for the authenticated user',
        security: [{ Bearer: [] }],
        request: {
          query: z.object({
            page: z.string().optional().default('1'),
            limit: z.string().optional().default('10')
          })
        },
        responses: {
          200: {
            description: 'Billing history retrieved successfully',
            content: {
              'application/json': {
                schema: z.object({
                  success: z.boolean(),
                  data: z.object({
                    items: z.array(z.any()),
                    total: z.number(),
                    page: z.number(),
                    limit: z.number(),
                    totalPages: z.number()
                  })
                })
              }
            }
          },
          401: {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: z.object({
                  success: z.boolean(),
                  error: z.string()
                })
              }
            }
          }
        }
      }),
      async (c: any) => {
        const user = c.get('user')
        if (!user) {
          return c.json({ success: false, error: 'Unauthorized' }, 401)
        }

        const query = c.req.query()
        const page = Number.parseInt(query.page || '1', 10)
        const limit = Number.parseInt(query.limit || '10', 10)

        const getBillingHistoryUseCase = new GetBillingHistoryUseCase(this.billingHistoryRepository)
        const result = await getBillingHistoryUseCase.execute({
          userId: user.id,
          page,
          limit
        })

        if (result.success) {
          return c.json({ success: true, data: result.data })
        } else {
          return c.json({ success: false, error: result.error }, 400)
        }
      }
    )
  }
}
