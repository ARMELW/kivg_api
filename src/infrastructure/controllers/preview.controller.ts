import { createRoute, OpenAPIHono } from '@hono/zod-openapi'
import { z } from 'zod'
import type { Routes } from '@/domain/types'
import { PreviewRepository } from '../repositories/preview.repository'
import { SceneRepository } from '../repositories/scene.repository'

export class PreviewController implements Routes {
  public controller: OpenAPIHono
  private previewRepository: PreviewRepository
  private sceneRepository: SceneRepository

  constructor() {
    this.controller = new OpenAPIHono()
    this.previewRepository = new PreviewRepository()
    this.sceneRepository = new SceneRepository()
    this.initRoutes()
  }

  public initRoutes() {
    // POST /v1/preview/scene - Create scene preview
    this.controller.openapi(
      createRoute({
        method: 'post',
        path: '/v1/preview/scene',
        security: [{ Bearer: [] }],
        tags: ['Preview'],
        summary: 'Create scene preview',
        request: {
          body: {
            content: {
              'application/json': {
                schema: z.object({
                  sceneId: z.string().uuid()
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

          // Create preview
          const preview = await this.previewRepository.create({
            sceneId: body.sceneId,
            userId: user.id
          })

          return c.json({
            success: true,
            data: {
              previewId: preview.id,
              sceneId: preview.sceneId,
              status: preview.status,
              progress: preview.progress,
              createdAt: preview.createdAt.toISOString()
            }
          })
        } catch {
          return c.json({ success: false, error: 'Failed to create preview' }, 400)
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

          const preview = await this.previewRepository.findById(previewId)
          if (!preview) {
            return c.json({ success: false, error: 'Preview not found' }, 404)
          }

          if (preview.userId !== user.id) {
            return c.json({ success: false, error: 'Forbidden' }, 403)
          }

          return c.json({
            success: true,
            data: {
              previewId: preview.id,
              sceneId: preview.sceneId,
              status: preview.status,
              progress: preview.progress,
              currentStep: preview.currentStep,
              previewUrl: preview.previewUrl,
              error: preview.error,
              createdAt: preview.createdAt.toISOString(),
              completedAt: preview.completedAt?.toISOString()
            }
          })
        } catch {
          return c.json({ success: false, error: 'Failed to fetch preview status' }, 400)
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

          const preview = await this.previewRepository.findById(previewId)
          if (!preview) {
            return c.json({ success: false, error: 'Preview not found' }, 404)
          }

          if (preview.userId !== user.id) {
            return c.json({ success: false, error: 'Forbidden' }, 403)
          }

          // Check if preview can be cancelled
          if (preview.status === 'completed' || preview.status === 'failed' || preview.status === 'cancelled') {
            return c.json({ success: false, error: `Cannot cancel preview with status: ${preview.status}` }, 400)
          }

          // Update status to cancelled
          await this.previewRepository.updateStatus(previewId, 'cancelled')

          return c.json({
            success: true,
            data: {
              previewId,
              status: 'cancelled'
            }
          })
        } catch {
          return c.json({ success: false, error: 'Failed to cancel preview' }, 400)
        }
      }
    )
  }
}
