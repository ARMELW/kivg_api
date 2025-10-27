import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import { StripePlanSyncService } from '@/application/services/stripe-plan-sync.service'
import { CreatePlanUseCase } from '@/application/use-cases/plan/create-plan.use-case'
import { DeletePlanUseCase } from '@/application/use-cases/plan/delete-plan.use-case'
import { GetAllPlansUseCase } from '@/application/use-cases/plan/get-all-plans.use-case'
import { GetPlanByIdUseCase } from '@/application/use-cases/plan/get-plan-by-id.use-case'
import { UpdatePlanUseCase } from '@/application/use-cases/plan/update-plan.use-case'
import { CreatePlanSchema, PlanSchema, UpdatePlanSchema } from '@/domain/models/plan.model'
import { ErrorCode } from '@/domain/types/error.type'
import { authMiddleware } from '@/infrastructure/middlewares/auth.middleware'
import { roleMiddleware } from '@/infrastructure/middlewares/permission.middleware'
import { PlanRepository } from '@/infrastructure/repositories/plan.repository'
import type { Routes } from '@/domain/types/route.type'

/**
 * Helper function to map error codes to HTTP status codes
 */
function getHttpStatusFromErrorCode(errorCode?: ErrorCode): number {
  switch (errorCode) {
    case ErrorCode.NOT_FOUND:
      return 404
    case ErrorCode.ALREADY_EXISTS:
      return 409
    case ErrorCode.VALIDATION_ERROR:
      return 400
    case ErrorCode.UNAUTHORIZED:
      return 401
    case ErrorCode.FORBIDDEN:
      return 403
    case ErrorCode.EXTERNAL_SERVICE_ERROR:
      return 502
    case ErrorCode.INTERNAL_ERROR:
    default:
      return 400
  }
}

export class PlanController implements Routes {
  public controller: OpenAPIHono
  private planRepository: PlanRepository
  private stripePlanSyncService: StripePlanSyncService

  constructor() {
    this.controller = new OpenAPIHono()
    this.planRepository = new PlanRepository()
    this.stripePlanSyncService = new StripePlanSyncService(this.planRepository)
    this.initRoutes()
  }

  public initRoutes() {
    // Public endpoint - Get all public plans
    this.controller.openapi(
      createRoute({
        method: 'get',
        path: '/v1/plans',
        tags: ['Plans'],
        summary: 'Get all public plans',
        description: 'Get all active and public subscription plans',
        responses: {
          200: {
            description: 'Plans retrieved successfully',
            content: {
              'application/json': {
                schema: z.object({
                  success: z.boolean(),
                  data: z.array(PlanSchema)
                })
              }
            }
          },
          400: {
            description: 'Failed to fetch plans',
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
        const getAllPlansUseCase = new GetAllPlansUseCase(this.planRepository)
        const result = await getAllPlansUseCase.execute({
          filters: { isActive: true, isPublic: true }
        })

        if (result.success) {
          return c.json({ success: true, data: result.data })
        }
        return c.json({ success: false, error: result.error }, 400)
      }
    )

    // Public endpoint - Get plan by ID
    this.controller.openapi(
      createRoute({
        method: 'get',
        path: '/v1/plans/{id}',
        tags: ['Plans'],
        summary: 'Get plan by ID',
        description: 'Get details of a specific plan',
        request: {
          params: z.object({
            id: z.string().uuid()
          })
        },
        responses: {
          200: {
            description: 'Plan retrieved successfully',
            content: {
              'application/json': {
                schema: z.object({
                  success: z.boolean(),
                  data: PlanSchema
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
      async (c: any) => {
        const { id } = c.req.param()
        const getPlanByIdUseCase = new GetPlanByIdUseCase(this.planRepository)
        const result = await getPlanByIdUseCase.execute({ id })

        if (result.success) {
          return c.json({ success: true, data: result.data })
        }
        return c.json({ success: false, error: result.error }, 404)
      }
    )

    // Admin endpoints - Require authentication and admin role
    this.controller.use('/v1/admin/plans/*', authMiddleware)
    this.controller.use('/v1/admin/plans/*', roleMiddleware(['admin', 'super_admin']))

    // Admin - Get all plans (including inactive)
    this.controller.openapi(
      createRoute({
        method: 'get',
        path: '/v1/admin/plans',
        tags: ['Plans (Admin)'],
        summary: 'Get all plans (Admin)',
        description: 'Get all plans including inactive ones',
        security: [{ Bearer: [] }],
        request: {
          query: z.object({
            isActive: z.enum(['true', 'false']).optional(),
            isPublic: z.enum(['true', 'false']).optional()
          })
        },
        responses: {
          200: {
            description: 'Plans retrieved successfully',
            content: {
              'application/json': {
                schema: z.object({
                  success: z.boolean(),
                  data: z.array(PlanSchema)
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
        const query = c.req.query()
        const filters: any = {}

        if (query.isActive !== undefined) {
          filters.isActive = query.isActive === 'true'
        }
        if (query.isPublic !== undefined) {
          filters.isPublic = query.isPublic === 'true'
        }

        const getAllPlansUseCase = new GetAllPlansUseCase(this.planRepository)
        const result = await getAllPlansUseCase.execute({ filters })

        if (result.success) {
          return c.json({ success: true, data: result.data })
        }
        return c.json({ success: false, error: result.error }, 400)
      }
    )

    // Admin - Create plan
    this.controller.openapi(
      createRoute({
        method: 'post',
        path: '/v1/admin/plans',
        tags: ['Plans (Admin)'],
        summary: 'Create plan (Admin)',
        description: 'Create a new subscription plan',
        security: [{ Bearer: [] }],
        request: {
          body: {
            content: {
              'application/json': {
                schema: CreatePlanSchema
              }
            }
          }
        },
        responses: {
          201: {
            description: 'Plan created successfully',
            content: {
              'application/json': {
                schema: z.object({
                  success: z.boolean(),
                  data: PlanSchema
                })
              }
            }
          },
          400: {
            description: 'Failed to create plan',
            content: {
              'application/json': {
                schema: z.object({
                  success: z.boolean(),
                  error: z.string()
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
        const body = await c.req.json()
        const createPlanUseCase = new CreatePlanUseCase(this.planRepository)
        const result = await createPlanUseCase.execute(body)

        if (result.success) {
          return c.json({ success: true, data: result.data }, 201)
        }
        return c.json({ success: false, error: result.error }, 400)
      }
    )

    // Admin - Update plan
    this.controller.openapi(
      createRoute({
        method: 'put',
        path: '/v1/admin/plans/{id}',
        tags: ['Plans (Admin)'],
        summary: 'Update plan (Admin)',
        description: 'Update an existing subscription plan',
        security: [{ Bearer: [] }],
        request: {
          params: z.object({
            id: z.string().uuid()
          }),
          body: {
            content: {
              'application/json': {
                schema: UpdatePlanSchema
              }
            }
          }
        },
        responses: {
          200: {
            description: 'Plan updated successfully',
            content: {
              'application/json': {
                schema: z.object({
                  success: z.boolean(),
                  data: PlanSchema
                })
              }
            }
          },
          400: {
            description: 'Failed to update plan',
            content: {
              'application/json': {
                schema: z.object({
                  success: z.boolean(),
                  error: z.string()
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
      async (c: any) => {
        const { id } = c.req.param()
        const body = await c.req.json()
        const updatePlanUseCase = new UpdatePlanUseCase(this.planRepository)
        const result = await updatePlanUseCase.execute({ id, data: body })

        if (result.success) {
          return c.json({ success: true, data: result.data })
        }
        return c.json({ success: false, error: result.error }, getHttpStatusFromErrorCode(result.errorCode))
      }
    )

    // Admin - Delete plan (soft delete)
    this.controller.openapi(
      createRoute({
        method: 'delete',
        path: '/v1/admin/plans/{id}',
        tags: ['Plans (Admin)'],
        summary: 'Delete plan (Admin)',
        description: 'Soft delete a subscription plan by setting isActive to false',
        security: [{ Bearer: [] }],
        request: {
          params: z.object({
            id: z.string().uuid()
          })
        },
        responses: {
          200: {
            description: 'Plan deleted successfully',
            content: {
              'application/json': {
                schema: z.object({
                  success: z.boolean(),
                  message: z.string()
                })
              }
            }
          },
          400: {
            description: 'Failed to delete plan',
            content: {
              'application/json': {
                schema: z.object({
                  success: z.boolean(),
                  error: z.string()
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
      async (c: any) => {
        const { id } = c.req.param()
        const deletePlanUseCase = new DeletePlanUseCase(this.planRepository)
        const result = await deletePlanUseCase.execute({ id })

        if (result.success) {
          return c.json({ success: true, message: 'Plan deleted successfully' })
        }
        return c.json({ success: false, error: result.error }, getHttpStatusFromErrorCode(result.errorCode))
      }
    )

    // Admin - Sync plan with Stripe
    this.controller.openapi(
      createRoute({
        method: 'post',
        path: '/v1/admin/plans/{id}/sync-stripe',
        tags: ['Plans (Admin)'],
        summary: 'Sync plan with Stripe (Admin)',
        description: 'Create or update Stripe product and prices for this plan',
        security: [{ Bearer: [] }],
        request: {
          params: z.object({
            id: z.string().uuid()
          })
        },
        responses: {
          200: {
            description: 'Plan synced successfully',
            content: {
              'application/json': {
                schema: z.object({
                  success: z.boolean(),
                  data: z.object({
                    stripeProductId: z.string().optional(),
                    stripePriceIdMonthly: z.string().optional(),
                    stripePriceIdYearly: z.string().optional()
                  })
                })
              }
            }
          },
          400: {
            description: 'Failed to sync plan',
            content: {
              'application/json': {
                schema: z.object({
                  success: z.boolean(),
                  error: z.string()
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
      async (c: any) => {
        const { id } = c.req.param()

        // Get the plan
        const getPlanUseCase = new GetPlanByIdUseCase(this.planRepository)
        const planResult = await getPlanUseCase.execute({ id })

        if (!planResult.success || !planResult.data) {
          return c.json({ success: false, error: 'Plan not found' }, 404)
        }

        // Sync with Stripe
        const syncResult = await this.stripePlanSyncService.syncPlanToStripe(planResult.data)

        if (syncResult.success) {
          return c.json({
            success: true,
            data: {
              stripeProductId: syncResult.stripeProductId,
              stripePriceIdMonthly: syncResult.stripePriceIdMonthly,
              stripePriceIdYearly: syncResult.stripePriceIdYearly
            }
          })
        }

        return c.json({ success: false, error: syncResult.error }, 400)
      }
    )

    // Admin - Sync all plans with Stripe
    this.controller.openapi(
      createRoute({
        method: 'post',
        path: '/v1/admin/plans/sync-all-stripe',
        tags: ['Plans (Admin)'],
        summary: 'Sync all plans with Stripe (Admin)',
        description: 'Create or update Stripe products and prices for all active plans',
        security: [{ Bearer: [] }],
        responses: {
          200: {
            description: 'Plans sync completed',
            content: {
              'application/json': {
                schema: z.object({
                  success: z.boolean(),
                  data: z.object({
                    synced: z.number(),
                    failed: z.number(),
                    errors: z.array(z.string())
                  })
                })
              }
            }
          },
          400: {
            description: 'Failed to sync plans',
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
        const result = await this.stripePlanSyncService.syncAllPlansToStripe()

        return c.json({
          success: result.success,
          data: {
            synced: result.synced,
            failed: result.failed,
            errors: result.errors
          }
        })
      }
    )
  }
}
