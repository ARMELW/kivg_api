import { createRoute, OpenAPIHono } from '@hono/zod-openapi'
import { z } from 'zod'
import { CacheService } from '@/application/services/cache.service'
import { PreviewCacheService } from '@/application/services/preview-cache.service'
import { PreviewQueueService } from '@/application/services/preview-queue.service'
import { CancelPreviewUseCase } from '@/application/use-cases/preview/cancel-preview.use-case'
import { CreatePreviewUseCase } from '@/application/use-cases/preview/create-preview.use-case'
import { GetPreviewStatusUseCase } from '@/application/use-cases/preview/get-preview-status.use-case'
import type { Routes } from '@/domain/types'
import { PreviewRepository } from '../repositories/preview.repository'
import { SceneRepository } from '../repositories/scene.repository'

/**
 * Preview Controller
 *
 * Handles scene preview generation requests.
 *
 * @see docs/PREVIEW_STRATEGY.md for comprehensive preview strategy documentation
 * including URL generation, caching, resource management, and integration with whiteboard-cli.
 */
export class PreviewController implements Routes {
  public controller: OpenAPIHono
  private previewRepository: PreviewRepository
  private sceneRepository: SceneRepository
  private createPreviewUseCase: CreatePreviewUseCase
  private getPreviewStatusUseCase: GetPreviewStatusUseCase
  private cancelPreviewUseCase: CancelPreviewUseCase

  constructor() {
    this.controller = new OpenAPIHono()
    this.previewRepository = new PreviewRepository()
    this.sceneRepository = new SceneRepository()

    // Initialize services
    const cacheService = new CacheService()
    const previewCacheService = new PreviewCacheService(this.previewRepository)
    // Use singleton PreviewQueueService
    const queueService = PreviewQueueService.getInstance(this.previewRepository)

    // Initialize use cases
    this.createPreviewUseCase = new CreatePreviewUseCase(this.previewRepository, previewCacheService, queueService)
    this.getPreviewStatusUseCase = new GetPreviewStatusUseCase(this.previewRepository, cacheService)
    this.cancelPreviewUseCase = new CancelPreviewUseCase(this.previewRepository, queueService)

    this.initRoutes()
  }

  public initRoutes() {
    // POST /v1/preview/scene - Create scene preview with options
    this.controller.openapi(
      createRoute({
        method: 'post',
        path: '/v1/preview/scene',
        security: [{ Bearer: [] }],
        tags: ['Preview'],
        summary: 'Create scene preview with quality options',
        request: {
          body: {
            content: {
              'application/json': {
                schema: z.object({
                  sceneId: z.string().uuid(),
                  options: z
                    .object({
                      quality: z.enum(['preview', 'draft', 'standard', 'high']).optional().default('standard'),
                      aspectRatio: z.enum(['1:1', '16:9', '9:16']).optional().default('16:9'),
                      skipAudio: z.boolean().optional().default(false)
                    })
                    .optional()
                })
              }
            }
          }
        },
        responses: {
          200: {
            description: 'Preview creation started',
            content: {
              'application/json': {
                schema: z.object({
                  success: z.boolean(),
                  data: z.object({
                    previewId: z.string(),
                    sceneId: z.string(),
                    status: z.string(),
                    progress: z.number(),
                    queuePosition: z.number().optional(),
                    cached: z.boolean().optional(),
                    createdAt: z.string()
                  })
                })
              }
            }
          }
        }
      }),
      async (c: any) => {
        try {
          const user = c.get('user')
          if (!user) {
            return c.json({ success: false, error: 'Unauthorized' }, 401)
          }

          const body = await c.req.json()

          // Verify scene exists
          const scene = await this.sceneRepository.findById(body.sceneId)
          if (!scene) {
            return c.json({ success: false, error: 'Scene not found' }, 404)
          }

          // Use the create preview use case
          const result = await this.createPreviewUseCase.execute({
            sceneId: body.sceneId,
            userId: user.id,
            scene,
            options: body.options
          })

          if (!result.success) {
            return c.json({ success: false, error: result.error }, 400)
          }

          return c.json({
            success: true,
            data: result.data
          })
        } catch (error: any) {
          return c.json({ success: false, error: error.message || 'Failed to create preview' }, 400)
        }
      }
    )

    // POST /v1/preview/complete - Complete preview generation
    this.controller.openapi(
      createRoute({
        method: 'post',
        path: '/v1/preview/complete',
        security: [{ Bearer: [] }],
        tags: ['Preview'],
        summary: 'Complete preview generation',
        request: {
          body: {
            content: {
              'application/json': {
                schema: z.object({
                  previewId: z.string().uuid(),
                  previewUrl: z.string().url().optional()
                })
              }
            }
          }
        },
        responses: {
          200: {
            description: 'Preview marked as complete',
            content: {
              'application/json': {
                schema: z.object({
                  success: z.boolean(),
                  data: z.object({
                    previewId: z.string(),
                    status: z.string(),
                    progress: z.number(),
                    previewUrl: z.string().optional(),
                    completedAt: z.string().optional()
                  })
                })
              }
            }
          }
        }
      }),
      async (c: any) => {
        try {
          const user = c.get('user')
          if (!user) {
            return c.json({ success: false, error: 'Unauthorized' }, 401)
          }

          const body = await c.req.json()

          // Verify preview exists and belongs to user
          const preview = await this.previewRepository.findById(body.previewId)
          if (!preview) {
            return c.json({ success: false, error: 'Preview not found' }, 404)
          }

          if (preview.userId !== user.id) {
            return c.json({ success: false, error: 'Forbidden' }, 403)
          }

          // Update preview to completed
          const baseUrl = Bun.env.BASE_URL || 'https://api.doodlio.com'
          const previewUrl = body.previewUrl || `${baseUrl}/previews/${body.previewId}.mp4`
          await this.previewRepository.updateStatus(body.previewId, 'completed', previewUrl)

          const updatedPreview = await this.previewRepository.findById(body.previewId)

          return c.json({
            success: true,
            data: {
              previewId: updatedPreview!.id,
              status: updatedPreview!.status,
              progress: updatedPreview!.progress,
              previewUrl: updatedPreview!.previewUrl,
              completedAt: updatedPreview!.completedAt?.toISOString()
            }
          })
        } catch {
          return c.json({ success: false, error: 'Failed to complete preview' }, 400)
        }
      }
    )

    // GET /v1/preview/status/:previewId - Get preview status
    this.controller.openapi(
      createRoute({
        method: 'get',
        path: '/v1/preview/status/{previewId}',
        security: [{ Bearer: [] }],
        tags: ['Preview'],
        summary: 'Get preview status',
        request: {
          params: z.object({
            previewId: z.string().uuid()
          })
        },
        responses: {
          200: {
            description: 'Preview status retrieved',
            content: {
              'application/json': {
                schema: z.object({
                  success: z.boolean(),
                  data: z.object({
                    previewId: z.string(),
                    sceneId: z.string(),
                    status: z.string(),
                    progress: z.number(),
                    currentStep: z.string().optional(),
                    previewUrl: z.string().optional(),
                    error: z.string().optional(),
                    createdAt: z.string(),
                    completedAt: z.string().optional()
                  })
                })
              }
            }
          }
        }
      }),
      async (c: any) => {
        try {
          const user = c.get('user')
          if (!user) {
            return c.json({ success: false, error: 'Unauthorized' }, 401)
          }

          const { previewId } = c.req.param()

          const result = await this.getPreviewStatusUseCase.execute({
            previewId,
            userId: user.id
          })

          if (!result.success) {
            const statusCode = result.error === 'Forbidden' ? 403 : result.error === 'Preview not found' ? 404 : 400
            return c.json({ success: false, error: result.error }, statusCode)
          }

          return c.json({
            success: true,
            data: result.data
          })
        } catch (error: any) {
          return c.json({ success: false, error: error.message || 'Failed to fetch preview status' }, 400)
        }
      }
    )

    // POST /v1/preview/cancel/:previewId - Cancel preview
    this.controller.openapi(
      createRoute({
        method: 'post',
        path: '/v1/preview/cancel/{previewId}',
        security: [{ Bearer: [] }],
        tags: ['Preview'],
        summary: 'Cancel preview generation',
        request: {
          params: z.object({
            previewId: z.string().uuid()
          })
        },
        responses: {
          200: {
            description: 'Preview cancelled successfully',
            content: {
              'application/json': {
                schema: z.object({
                  success: z.boolean(),
                  data: z.object({
                    previewId: z.string(),
                    status: z.string()
                  })
                })
              }
            }
          }
        }
      }),
      async (c: any) => {
        try {
          const user = c.get('user')
          if (!user) {
            return c.json({ success: false, error: 'Unauthorized' }, 401)
          }

          const { previewId } = c.req.param()

          const result = await this.cancelPreviewUseCase.execute({
            previewId,
            userId: user.id
          })

          if (!result.success) {
            const statusCode = result.error === 'Forbidden' ? 403 : result.error === 'Preview not found' ? 404 : 400
            return c.json({ success: false, error: result.error }, statusCode)
          }

          return c.json({
            success: true,
            data: result.data
          })
        } catch (error: any) {
          return c.json({ success: false, error: error.message || 'Failed to cancel preview' }, 400)
        }
      }
    )

    // GET /v1/preview/list - List user's previews
    this.controller.openapi(
      createRoute({
        method: 'get',
        path: '/v1/preview/list',
        security: [{ Bearer: [] }],
        tags: ['Preview'],
        summary: 'List user previews',
        request: {
          query: z.object({
            status: z.enum(['queued', 'processing', 'completed', 'failed', 'cancelled']).optional(),
            sceneId: z.string().uuid().optional(),
            page: z.string().optional(),
            limit: z.string().optional()
          })
        },
        responses: {
          200: {
            description: 'Previews retrieved successfully',
            content: {
              'application/json': {
                schema: z.object({
                  success: z.boolean(),
                  data: z.object({
                    previews: z.array(
                      z.object({
                        previewId: z.string(),
                        sceneId: z.string(),
                        status: z.string(),
                        progress: z.number(),
                        previewUrl: z.string().optional(),
                        createdAt: z.string(),
                        completedAt: z.string().optional()
                      })
                    ),
                    total: z.number(),
                    page: z.number(),
                    limit: z.number(),
                    totalPages: z.number()
                  })
                })
              }
            }
          }
        }
      }),
      async (c: any) => {
        try {
          const user = c.get('user')
          if (!user) {
            return c.json({ success: false, error: 'Unauthorized' }, 401)
          }

          const query = c.req.query()
          const page = Number.parseInt(query.page || '1')
          const limit = Number.parseInt(query.limit || '20')
          const skip = (page - 1) * limit

          const result = await this.previewRepository.findAll({
            userId: user.id,
            status: query.status,
            sceneId: query.sceneId,
            skip,
            limit
          })

          const totalPages = Math.ceil(result.total / limit)

          return c.json({
            success: true,
            data: {
              previews: result.previews.map((p) => ({
                previewId: p.id,
                sceneId: p.sceneId,
                status: p.status,
                progress: p.progress,
                previewUrl: p.previewUrl,
                createdAt: p.createdAt.toISOString(),
                completedAt: p.completedAt?.toISOString()
              })),
              total: result.total,
              page,
              limit,
              totalPages
            }
          })
        } catch (error: any) {
          return c.json({ success: false, error: error.message || 'Failed to fetch previews' }, 400)
        }
      }
    )

    // DELETE /v1/preview/:previewId - Delete preview
    this.controller.openapi(
      createRoute({
        method: 'delete',
        path: '/v1/preview/{previewId}',
        security: [{ Bearer: [] }],
        tags: ['Preview'],
        summary: 'Delete preview',
        request: {
          params: z.object({
            previewId: z.string().uuid()
          })
        },
        responses: {
          200: {
            description: 'Preview deleted successfully',
            content: {
              'application/json': {
                schema: z.object({
                  success: z.boolean(),
                  data: z.object({
                    previewId: z.string()
                  })
                })
              }
            }
          }
        }
      }),
      async (c: any) => {
        try {
          const user = c.get('user')
          if (!user) {
            return c.json({ success: false, error: 'Unauthorized' }, 401)
          }

          const { previewId } = c.req.param()

          const preview = await this.previewRepository.findById(previewId)
          if (!preview) {
            return c.json({ success: false, error: 'Preview not found' }, 404)
          }

          if (preview.userId !== user.id) {
            return c.json({ success: false, error: 'Forbidden' }, 403)
          }

          // Delete preview file if exists
          if (preview.previewUrl) {
            // TODO: Delete from storage
          }

          await this.previewRepository.delete(previewId)

          return c.json({
            success: true,
            data: {
              previewId
            }
          })
        } catch (error: any) {
          return c.json({ success: false, error: error.message || 'Failed to delete preview' }, 400)
        }
      }
    )
  }
}
