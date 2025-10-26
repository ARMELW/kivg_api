import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import { StripeUsageBillingService } from '@/application/services/stripe-usage-billing.service'
import { GetCurrentMonthUsageUseCase } from '@/application/use-cases/ai-usage/get-current-month-usage.use-case'
import { GetUsageHistoryUseCase } from '@/application/use-cases/ai-usage/get-usage-history.use-case'
import type { Routes } from '@/domain/types/route.type'
import { AIUsageRepository } from '../repositories/ai-usage.repository'

/**
 * AI Usage Controller
 * Handles endpoints for tracking and reporting AI usage
 */
export class AIUsageController implements Routes {
  public controller: OpenAPIHono
  private aiUsageRepository: AIUsageRepository
  private stripeUsageBillingService: StripeUsageBillingService

  constructor() {
    this.controller = new OpenAPIHono()
    this.aiUsageRepository = new AIUsageRepository()
    this.stripeUsageBillingService = new StripeUsageBillingService(this.aiUsageRepository)
    this.initRoutes()
  }

  public initRoutes() {
    // Get current month usage
    this.controller.openapi(
      createRoute({
        method: 'get',
        path: '/v1/ai-usage/current',
        tags: ['AI Usage'],
        summary: 'Get current month AI usage',
        description: 'Get AI usage statistics for the current month',
        security: [{ Bearer: [] }],
        responses: {
          200: {
            description: 'Current month usage retrieved successfully',
            content: {
              'application/json': {
                schema: z.object({
                  success: z.boolean(),
                  data: z.object({
                    userId: z.string(),
                    month: z.string(),
                    videoGenerationCount: z.number(),
                    scriptGenerationCount: z.number(),
                    imageGenerationCount: z.number(),
                    voiceGenerationCount: z.number(),
                    musicGenerationCount: z.number(),
                    planLimit: z.number(),
                    exceeded: z.boolean(),
                    overage: z.number(),
                    overageCost: z.number()
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

        const getCurrentMonthUsageUseCase = new GetCurrentMonthUsageUseCase(this.aiUsageRepository)
        const usageResult = await getCurrentMonthUsageUseCase.execute({ userId: user.id })

        if (!usageResult.success || !usageResult.data) {
          return c.json({ success: false, error: usageResult.error }, 400)
        }

        // Check usage limits
        const limitCheck = await this.stripeUsageBillingService.checkUsageLimit(user.id, user.subscriptionPlan)
        const overageCost = await this.stripeUsageBillingService.calculateOverageCost(user.id, user.subscriptionPlan)

        return c.json({
          success: true,
          data: {
            userId: usageResult.data.userId,
            month: usageResult.data.month,
            videoGenerationCount: usageResult.data.videoGenerationCount,
            scriptGenerationCount: usageResult.data.scriptGenerationCount,
            imageGenerationCount: usageResult.data.imageGenerationCount,
            voiceGenerationCount: usageResult.data.voiceGenerationCount,
            musicGenerationCount: usageResult.data.musicGenerationCount,
            planLimit: limitCheck.limit,
            exceeded: limitCheck.exceeded,
            overage: limitCheck.overage,
            overageCost
          }
        })
      }
    )

    // Get usage history
    this.controller.openapi(
      createRoute({
        method: 'get',
        path: '/v1/ai-usage/history',
        tags: ['AI Usage'],
        summary: 'Get AI usage history',
        description: 'Get historical AI usage statistics',
        security: [{ Bearer: [] }],
        request: {
          query: z.object({
            limit: z.string().optional().default('12')
          })
        },
        responses: {
          200: {
            description: 'Usage history retrieved successfully',
            content: {
              'application/json': {
                schema: z.object({
                  success: z.boolean(),
                  data: z.array(
                    z.object({
                      month: z.string(),
                      videoGenerationCount: z.number(),
                      scriptGenerationCount: z.number(),
                      imageGenerationCount: z.number(),
                      voiceGenerationCount: z.number(),
                      musicGenerationCount: z.number()
                    })
                  )
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
        const limit = Number.parseInt(query.limit || '12', 10)

        const getUsageHistoryUseCase = new GetUsageHistoryUseCase(this.aiUsageRepository)
        const result = await getUsageHistoryUseCase.execute({ userId: user.id, limit })

        if (!result.success || !result.data) {
          return c.json({ success: false, error: result.error }, 400)
        }

        return c.json({
          success: true,
          data: result.data.map((usage) => ({
            month: usage.month,
            videoGenerationCount: usage.videoGenerationCount,
            scriptGenerationCount: usage.scriptGenerationCount,
            imageGenerationCount: usage.imageGenerationCount,
            voiceGenerationCount: usage.voiceGenerationCount,
            musicGenerationCount: usage.musicGenerationCount
          }))
        })
      }
    )

    // Get overage pricing
    this.controller.openapi(
      createRoute({
        method: 'get',
        path: '/v1/ai-usage/pricing',
        tags: ['AI Usage'],
        summary: 'Get overage pricing information',
        description: 'Get pricing information for AI usage beyond plan limits',
        security: [{ Bearer: [] }],
        responses: {
          200: {
            description: 'Pricing information retrieved successfully',
            content: {
              'application/json': {
                schema: z.object({
                  success: z.boolean(),
                  data: z.object({
                    plan: z.string(),
                    pricePerVideo: z.number(),
                    currency: z.string()
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
      (c: any) => {
        const user = c.get('user')
        if (!user) {
          return c.json({ success: false, error: 'Unauthorized' }, 401)
        }

        const pricePerVideo = this.stripeUsageBillingService.getOveragePricing(user.subscriptionPlan)

        return c.json({
          success: true,
          data: {
            plan: user.subscriptionPlan,
            pricePerVideo,
            currency: 'EUR'
          }
        })
      }
    )
  }
}
