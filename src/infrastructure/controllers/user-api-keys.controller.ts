import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import type { Routes } from '@/domain/types/route.type'
import { authMiddleware } from '@/infrastructure/middlewares/auth.middleware'
import { UserApiKeysRepository } from '@/infrastructure/repositories/user-api-keys.repository'
import { SaveUserApiKeyUseCase } from '@/application/use-cases/user-api-keys/save-user-api-key.use-case'
import { GetUserApiKeysUseCase } from '@/application/use-cases/user-api-keys/get-user-api-keys.use-case'
import { DeleteUserApiKeyUseCase } from '@/application/use-cases/user-api-keys/delete-user-api-key.use-case'
import { ValidateUserApiKeyUseCase } from '@/application/use-cases/user-api-keys/validate-user-api-key.use-case'

const ApiProviderSchema = z.enum(['openai', 'elevenlabs', 'mubert', 'minimax', 'gemini'])

const SaveApiKeyRequestSchema = z.object({
  provider: ApiProviderSchema,
  apiKey: z.string().min(10, 'API key must be at least 10 characters'),
  keyName: z.string().optional()
})

const MaskedApiKeyResponseSchema = z.object({
  id: z.string(),
  provider: ApiProviderSchema,
  maskedKey: z.string(),
  isActive: z.boolean(),
  lastValidated: z.string().nullable(),
  validationStatus: z.enum(['valid', 'invalid', 'pending']).nullable(),
  keyName: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string()
})

export class UserApiKeysController implements Routes {
  public controller: OpenAPIHono
  private userApiKeysRepository: UserApiKeysRepository

  constructor() {
    this.controller = new OpenAPIHono()
    this.userApiKeysRepository = new UserApiKeysRepository()
    this.initRoutes()
  }

  public initRoutes() {
    // Apply authentication to all routes
    this.controller.use('/v1/user/api-keys/*', authMiddleware)

    // Save/Update API key
    this.controller.openapi(
      createRoute({
        method: 'post',
        path: '/v1/user/api-keys',
        tags: ['User API Keys'],
        summary: 'Save or update user API key',
        description: 'Save or update an API key for external services. The key will be encrypted before storage.',
        security: [{ bearerAuth: [] }],
        request: {
          body: {
            content: {
              'application/json': {
                schema: SaveApiKeyRequestSchema
              }
            }
          }
        },
        responses: {
          200: {
            description: 'API key saved successfully',
            content: {
              'application/json': {
                schema: z.object({
                  success: z.boolean(),
                  data: z.object({
                    id: z.string(),
                    provider: ApiProviderSchema,
                    maskedKey: z.string(),
                    isActive: z.boolean()
                  })
                })
              }
            }
          },
          400: {
            description: 'Bad request',
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
        try {
          const user = c.get('user')
          if (!user?.id) {
            return c.json({ success: false, error: 'Unauthorized' }, 401)
          }

          const body = await c.req.json()
          const saveUseCase = new SaveUserApiKeyUseCase(this.userApiKeysRepository)

          const result = await saveUseCase.execute({
            userId: user.id,
            provider: body.provider,
            apiKey: body.apiKey,
            keyName: body.keyName
          })

          if (!result.success) {
            return c.json({ success: false, error: result.error }, 400)
          }

          return c.json({ success: true, data: result.data }, 200)
        } catch (error: any) {
          console.error('Error saving API key:', error)
          return c.json({ success: false, error: 'Internal server error' }, 500)
        }
      }
    )

    // Get all API keys
    this.controller.openapi(
      createRoute({
        method: 'get',
        path: '/v1/user/api-keys',
        tags: ['User API Keys'],
        summary: 'Get all user API keys',
        description: 'Retrieve all saved API keys for the current user. Keys are returned masked for security.',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'API keys retrieved successfully',
            content: {
              'application/json': {
                schema: z.object({
                  success: z.boolean(),
                  data: z.array(MaskedApiKeyResponseSchema)
                })
              }
            }
          }
        }
      }),
      async (c: any) => {
        try {
          const user = c.get('user')
          if (!user?.id) {
            return c.json({ success: false, error: 'Unauthorized' }, 401)
          }

          const getUseCase = new GetUserApiKeysUseCase(this.userApiKeysRepository)
          const result = await getUseCase.execute({ userId: user.id })

          if (!result.success) {
            return c.json({ success: false, error: result.error }, 400)
          }

          return c.json({ success: true, data: result.data }, 200)
        } catch (error: any) {
          console.error('Error retrieving API keys:', error)
          return c.json({ success: false, error: 'Internal server error' }, 500)
        }
      }
    )

    // Delete API key
    this.controller.openapi(
      createRoute({
        method: 'delete',
        path: '/v1/user/api-keys/{provider}',
        tags: ['User API Keys'],
        summary: 'Delete user API key',
        description: 'Delete an API key for a specific provider.',
        security: [{ bearerAuth: [] }],
        request: {
          params: z.object({
            provider: ApiProviderSchema
          })
        },
        responses: {
          200: {
            description: 'API key deleted successfully',
            content: {
              'application/json': {
                schema: z.object({
                  success: z.boolean(),
                  message: z.string()
                })
              }
            }
          },
          404: {
            description: 'API key not found',
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
        try {
          const user = c.get('user')
          if (!user?.id) {
            return c.json({ success: false, error: 'Unauthorized' }, 401)
          }

          const { provider } = c.req.param()
          const deleteUseCase = new DeleteUserApiKeyUseCase(this.userApiKeysRepository)

          const result = await deleteUseCase.execute({
            userId: user.id,
            provider: provider as any
          })

          if (!result.success) {
            return c.json({ success: false, error: result.error }, 404)
          }

          return c.json({ success: true, message: 'API key deleted successfully' }, 200)
        } catch (error: any) {
          console.error('Error deleting API key:', error)
          return c.json({ success: false, error: 'Internal server error' }, 500)
        }
      }
    )

    // Validate API key
    this.controller.openapi(
      createRoute({
        method: 'post',
        path: '/v1/user/api-keys/{provider}/validate',
        tags: ['User API Keys'],
        summary: 'Validate user API key',
        description: 'Test if an API key is valid by making a test call to the provider.',
        security: [{ bearerAuth: [] }],
        request: {
          params: z.object({
            provider: ApiProviderSchema
          })
        },
        responses: {
          200: {
            description: 'API key validation result',
            content: {
              'application/json': {
                schema: z.object({
                  success: z.boolean(),
                  data: z.object({
                    provider: z.string(),
                    isValid: z.boolean(),
                    message: z.string()
                  })
                })
              }
            }
          },
          404: {
            description: 'API key not found',
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
        try {
          const user = c.get('user')
          if (!user?.id) {
            return c.json({ success: false, error: 'Unauthorized' }, 401)
          }

          const { provider } = c.req.param()
          const validateUseCase = new ValidateUserApiKeyUseCase(this.userApiKeysRepository)

          const result = await validateUseCase.execute({
            userId: user.id,
            provider: provider as any
          })

          if (!result.success) {
            return c.json({ success: false, error: result.error }, 404)
          }

          return c.json({ success: true, data: result.data }, 200)
        } catch (error: any) {
          console.error('Error validating API key:', error)
          return c.json({ success: false, error: 'Internal server error' }, 500)
        }
      }
    )
  }
}
