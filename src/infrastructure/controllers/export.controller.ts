import { createRoute, OpenAPIHono } from '@hono/zod-openapi'
import { z } from 'zod'
import type { Routes } from '@/domain/types'
import { rateLimitMiddleware, RateLimits } from '../middlewares/rate-limit.middleware'
import { ExportRepository } from '../repositories/export.repository'

export class ExportController implements Routes {
  public controller: OpenAPIHono
  private exportRepository: ExportRepository

  constructor() {
    this.controller = new OpenAPIHono()
    this.exportRepository = new ExportRepository()
    this.initRoutes()
  }

  public initRoutes() {
    // Apply rate limiting to export endpoints
    this.controller.use('/v1/export/*', rateLimitMiddleware(RateLimits.EXPORT))

    // Export Scene
    this.controller.openapi(
      createRoute({
        method: 'post',
        path: '/v1/export/scene/{id}',
        security: [{ Bearer: [] }],
        tags: ['Export'],
        summary: 'Export a scene',
        request: {
          params: z.object({
            id: z.string().uuid()
          }),
          body: {
            content: {
              'application/json': {
                schema: z.object({
                  format: z.enum(['png', 'jpg', 'mp4', 'webm']),
                  quality: z.enum(['low', 'medium', 'high', 'ultra']),
                  resolution: z.enum(['720p', '1080p', '4k'])
                })
              }
            }
          }
        },
        responses: {
          200: {
            description: 'Export started successfully',
            content: {
              'application/json': {
                schema: z.object({
                  success: z.boolean(),
                  data: z.object({
                    exportId: z.string(),
                    sceneId: z.string(),
                    format: z.string(),
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

          const { id } = c.req.param()
          const body = await c.req.json()

          const exportJob = await this.exportRepository.create({
            userId: user.id,
            sceneId: id,
            format: body.format,
            quality: body.quality,
            resolution: body.resolution
          })

          return c.json({ success: true, data: exportJob })
        } catch {
          return c.json({ success: false, error: 'Failed to export scene' }, 400)
        }
      }
    )

    // Generate Full Video
    this.controller.openapi(
      createRoute({
        method: 'post',
        path: '/v1/export/video',
        security: [{ Bearer: [] }],
        tags: ['Export'],
        summary: 'Generate full project video',
        request: {
          body: {
            content: {
              'application/json': {
                schema: z.object({
                  projectId: z.string().uuid(),
                  format: z.enum(['mp4', 'webm', 'mov']),
                  quality: z.enum(['low', 'medium', 'high', 'ultra']),
                  resolution: z.enum(['720p', '1080p', '4k']),
                  fps: z.union([z.literal(24), z.literal(30), z.literal(60)]),
                  includeAudio: z.boolean(),
                  watermark: z
                    .object({
                      enabled: z.boolean(),
                      text: z.string().optional(),
                      position: z.enum(['top-left', 'top-right', 'bottom-left', 'bottom-right']).optional()
                    })
                    .optional()
                })
              }
            }
          }
        },
        responses: {
          200: {
            description: 'Video generation started',
            content: {
              'application/json': {
                schema: z.object({
                  success: z.boolean(),
                  data: z.object({
                    exportId: z.string(),
                    projectId: z.string(),
                    format: z.string(),
                    status: z.string(),
                    progress: z.number(),
                    estimatedDuration: z.number().optional(),
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

          const exportJob = {
            exportId: crypto.randomUUID(),
            projectId: body.projectId,
            format: body.format,
            status: 'queued',
            progress: 0,
            estimatedDuration: 300,
            createdAt: new Date().toISOString()
          }

          return c.json({ success: true, data: exportJob })
        } catch {
          return c.json({ success: false, error: 'Failed to start video generation' }, 400)
        }
      }
    )

    // Check Export Status
    this.controller.openapi(
      createRoute({
        method: 'get',
        path: '/v1/export/status/{exportId}',
        security: [{ Bearer: [] }],
        tags: ['Export'],
        summary: 'Check export status',
        request: {
          params: z.object({
            exportId: z.string().uuid()
          })
        },
        responses: {
          200: {
            description: 'Export status retrieved',
            content: {
              'application/json': {
                schema: z.object({
                  success: z.boolean(),
                  data: z.object({
                    exportId: z.string(),
                    status: z.string(),
                    progress: z.number(),
                    currentStep: z.string().optional(),
                    videoUrl: z.string().optional(),
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

          const { exportId } = c.req.param()

          return c.json({
            success: true,
            data: {
              exportId,
              status: 'processing',
              progress: 45,
              currentStep: 'Rendering scene 3/10',
              videoUrl: null,
              error: null,
              createdAt: new Date().toISOString(),
              completedAt: null
            }
          })
        } catch {
          return c.json({ success: false, error: 'Failed to fetch export status' }, 400)
        }
      }
    )

    // Download Exported Video
    this.controller.openapi(
      createRoute({
        method: 'get',
        path: '/v1/export/download/{exportId}',
        security: [{ Bearer: [] }],
        tags: ['Export'],
        summary: 'Download exported video',
        request: {
          params: z.object({
            exportId: z.string().uuid()
          })
        },
        responses: {
          200: {
            description: 'Video file download',
            content: {
              'application/octet-stream': {
                schema: z.any()
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

          const { exportId } = c.req.param()

          // In real implementation, return the actual file
          return c.json({ message: 'File download would be initiated here' })
        } catch {
          return c.json({ success: false, error: 'Failed to download video' }, 400)
        }
      }
    )

    // Get Export Config
    this.controller.openapi(
      createRoute({
        method: 'get',
        path: '/v1/export/config',
        security: [{ Bearer: [] }],
        tags: ['Export'],
        summary: 'Get export configuration options',
        responses: {
          200: {
            description: 'Export configuration retrieved',
            content: {
              'application/json': {
                schema: z.object({
                  success: z.boolean(),
                  data: z.object({
                    formats: z.array(z.string()),
                    resolutions: z.array(z.string()),
                    qualities: z.array(z.string()),
                    fpsOptions: z.array(z.number()),
                    limits: z.object({
                      maxDuration: z.number(),
                      maxScenes: z.number(),
                      maxResolution: z.string()
                    })
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

          return c.json({
            success: true,
            data: {
              formats: ['mp4', 'webm', 'mov'],
              resolutions: ['720p', '1080p', '4k'],
              qualities: ['low', 'medium', 'high', 'ultra'],
              fpsOptions: [24, 30, 60],
              limits: {
                maxDuration: 600,
                maxScenes: 50,
                maxResolution: '4k'
              }
            }
          })
        } catch {
          return c.json({ success: false, error: 'Failed to fetch export config' }, 400)
        }
      }
    )
  }
}
