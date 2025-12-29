import { createRoute, OpenAPIHono } from '@hono/zod-openapi'
import { z } from 'zod'
import { GetSceneProjectionUseCase } from '@/application/use-cases/scene/get-scene-projection.use-case'
import { LayerSchema } from '@/domain/models/scene.model'
import type { Routes } from '@/domain/types'
import { PreviewRepository } from '../repositories/preview.repository'
import { SceneRepository } from '../repositories/scene.repository'

// Shared validation patterns
const HexColorSchema = z.string().regex(/^#[0-9A-Fa-f]{6}$/)

export class SceneController implements Routes {
  public controller: OpenAPIHono
  private sceneRepository: SceneRepository
  private previewRepository: PreviewRepository
  private getSceneProjectionUseCase: GetSceneProjectionUseCase

  constructor() {
    this.controller = new OpenAPIHono()
    this.sceneRepository = new SceneRepository()
    this.previewRepository = new PreviewRepository()
    this.getSceneProjectionUseCase = new GetSceneProjectionUseCase(this.previewRepository)
    this.initRoutes()
  }

  public initRoutes() {
    // Create Scene
    this.controller.openapi(
      createRoute({
        method: 'post',
        path: '/v1/scenes',
        security: [{ Bearer: [] }],
        tags: ['Scenes'],
        summary: 'Create a new scene',
        request: {
          body: {
            content: {
              'application/json': {
                schema: z.object({
                  projectId: z.string().uuid(),
                  title: z.string().min(1),
                  content: z.string().optional(),
                  duration: z.number().int().optional().default(10),
                  // ===== Visual =====
                  backgroundImage: z.string().optional(),
                  backgroundColor: HexColorSchema.optional(),
                  background: z.any().optional(),
                  sceneWidth: z.number().int().min(320).max(7680).optional().default(1920),
                  sceneHeight: z.number().int().min(180).max(4320).optional().default(1080),
                  // ===== Data =====
                  layers: z.array(LayerSchema).optional().default([]),
                  cameras: z.array(z.any()).optional().default([]),
                  sceneCameras: z.array(z.any()).optional().default([]),
                  // ===== Transitions =====
                  transition: z.any().optional(),
                  waitDurationBeforeNextScene: z.number().min(0).max(30).optional().default(2.0),
                  // ===== Advanced Features =====
                  eraserConfig: z.any().optional(),
                  occlusionCulling: z.boolean().optional().default(false),
                  occlusionCullingConfig: z.any().optional(),
                  // ===== DEPRECATED (kept for backward compatibility) =====
                  transitionType: z.enum(['none', 'fade', 'slide']).optional().default('fade')
                })
              }
            }
          }
        },
        responses: {
          201: {
            description: 'Scene created successfully',
            content: {
              'application/json': {
                schema: z.object({
                  success: z.boolean(),
                  data: z.any()
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

          const scene = await this.sceneRepository.create({
            projectId: body.projectId,
            title: body.title,
            content: body.content,
            duration: body.duration || 10,
            animation: 'fade',
            // ===== Visual =====
            backgroundImage: body.backgroundImage,
            backgroundColor: body.backgroundColor,
            background: body.background,
            sceneImage: undefined,
            sceneWidth: body.sceneWidth || 1920,
            sceneHeight: body.sceneHeight || 1080,
            // ===== Data =====
            layers: body.layers || [],
            cameras: body.cameras || [],
            sceneCameras: body.sceneCameras || [],
            multiTimeline: {},
            audio: {},
            sceneAudio: undefined,
            // ===== Transitions =====
            transition: body.transition,
            waitDurationBeforeNextScene: body.waitDurationBeforeNextScene || 2.0,
            // ===== Advanced Features =====
            eraserConfig: body.eraserConfig,
            occlusionCulling: body.occlusionCulling || false,
            occlusionCullingConfig: body.occlusionCullingConfig,
            // ===== DEPRECATED (kept for backward compatibility) =====
            transitionType: body.transitionType || (body.transition && typeof body.transition === 'object' ? body.transition.type : undefined) || 'fade',
            draggingSpeed: 1,
            slideDuration: body.slideDuration || (body.transition && typeof body.transition === 'object' ? body.transition.duration : undefined) || 0,
            syncSlideWithVoice: false
          })

          return c.json({ success: true, data: scene }, 201)
        } catch {
          return c.json({ success: false, error: 'Failed to create scene' }, 400)
        }
      }
    )

    // List Scenes
    this.controller.openapi(
      createRoute({
        method: 'get',
        path: '/v1/scenes',
        security: [{ Bearer: [] }],
        tags: ['Scenes'],
        summary: 'List all scenes',
        request: {
          query: z.object({
            projectId: z.string().uuid().optional(),
            page: z.string().optional().default('1'),
            limit: z.string().optional().default('10'),
            filter: z.string().optional()
          })
        },
        responses: {
          200: {
            description: 'Scenes retrieved successfully',
            content: {
              'application/json': {
                schema: z.object({
                  success: z.boolean(),
                  data: z.array(z.any()),
                  total: z.number(),
                  page: z.number(),
                  limit: z.number()
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
          const limit = Number.parseInt(query.limit || '10')

          const result = await this.sceneRepository.findAll({
            projectId: query.projectId,
            skip: (page - 1) * limit,
            limit,
            filter: query.filter
          })

          return c.json({
            success: true,
            data: result.scenes,
            total: result.total,
            page,
            limit
          })
        } catch {
          return c.json({ success: false, error: 'Failed to fetch scenes' }, 400)
        }
      }
    )

    // Get Scene by ID
    this.controller.openapi(
      createRoute({
        method: 'get',
        path: '/v1/scenes/{id}',
        security: [{ Bearer: [] }],
        tags: ['Scenes'],
        summary: 'Get scene by ID',
        request: {
          params: z.object({
            id: z.string().uuid()
          })
        },
        responses: {
          200: {
            description: 'Scene retrieved successfully',
            content: {
              'application/json': {
                schema: z.object({
                  success: z.boolean(),
                  data: z.any()
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

          const scene = await this.sceneRepository.findById(id)
          if (!scene) {
            return c.json({ success: false, error: 'Scene not found' }, 404)
          }

          return c.json({
            success: true,
            data: scene
          })
        } catch {
          return c.json({ success: false, error: 'Failed to fetch scene' }, 400)
        }
      }
    )

    // Get Scene Projection (Preview for Modal)
    this.controller.openapi(
      createRoute({
        method: 'get',
        path: '/v1/scenes/{id}/projection',
        security: [{ Bearer: [] }],
        tags: ['Scenes'],
        summary: 'Get scene projection (preview) for modal display',
        description: 'Retrieves the most recent preview/projection of a scene for display in a modal',
        request: {
          params: z.object({
            id: z.string().uuid()
          })
        },
        responses: {
          200: {
            description: 'Scene projection retrieved successfully',
            content: {
              'application/json': {
                schema: z.object({
                  success: z.boolean(),
                  data: z
                    .object({
                      previewId: z.string().optional(),
                      sceneId: z.string(),
                      status: z.string(),
                      progress: z.number(),
                      currentStep: z.string().optional(),
                      previewUrl: z.string().optional(),
                      error: z.string().optional(),
                      createdAt: z.string().optional(),
                      completedAt: z.string().optional()
                    })
                    .nullable()
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

          // Verify scene exists
          const scene = await this.sceneRepository.findById(id)
          if (!scene) {
            return c.json({ success: false, error: 'Scene not found' }, 404)
          }

          // Get the projection (preview) for this scene
          const result = await this.getSceneProjectionUseCase.execute({
            sceneId: id,
            userId: user.id
          })

          if (!result.success) {
            return c.json({ success: false, error: result.error }, 400)
          }

          return c.json({
            success: true,
            data: result.data
          })
        } catch (error: any) {
          return c.json({ success: false, error: error.message || 'Failed to get scene projection' }, 400)
        }
      }
    )

    // Update Scene
    this.controller.openapi(
      createRoute({
        method: 'put',
        path: '/v1/scenes/{id}',
        security: [{ Bearer: [] }],
        tags: ['Scenes'],
        summary: 'Update scene',
        request: {
          params: z.object({
            id: z.string().uuid()
          }),
          body: {
            content: {
              'application/json': {
                schema: z.object({
                  title: z.string().optional(),
                  content: z.string().optional(),
                  duration: z.number().int().optional(),
                  // ===== Visual =====
                  backgroundImage: z.string().optional(),
                  backgroundColor: HexColorSchema.optional(),
                  background: z.any().optional(),
                  sceneWidth: z.number().int().min(320).max(7680).optional(),
                  sceneHeight: z.number().int().min(180).max(4320).optional(),
                  // ===== Data =====
                  layers: z.array(z.any()).optional(),
                  cameras: z.array(z.any()).optional(),
                  sceneCameras: z.array(z.any()).optional(),
                  // ===== Transitions =====
                  transition: z.any().optional(),
                  waitDurationBeforeNextScene: z.number().min(0).max(30).optional(),
                  // ===== Advanced Features =====
                  eraserConfig: z.any().optional(),
                  occlusionCulling: z.boolean().optional(),
                  occlusionCullingConfig: z.any().optional(),
                  // ===== DEPRECATED (kept for backward compatibility) =====
                  transitionType: z.enum(['none', 'fade', 'slide']).optional()
                })
              }
            }
          }
        },
        responses: {
          200: {
            description: 'Scene updated successfully',
            content: {
              'application/json': {
                schema: z.object({
                  success: z.boolean(),
                  data: z.any()
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

          const scene = await this.sceneRepository.findById(id)
          if (!scene) {
            return c.json({ success: false, error: 'Scene not found' }, 404)
          }
          console.info('scene', body)
          // Ensure updatedAt is a Date object for Drizzle ORM
          if ('updatedAt' in body && typeof body.updatedAt === 'string') {
            body.updatedAt = new Date(body.updatedAt)
          }
          // Always set updatedAt to now if not provided
          if (!('updatedAt' in body)) {
            body.updatedAt = new Date()
          }
          const updated = await this.sceneRepository.update(id, body)

          return c.json({
            success: true,
            data: updated
          })
        } catch (error: any) {
          console.error('Scene update error:', error)
          return c.json({ success: false, error: 'Failed to update scene' }, 400)
        }
      }
    )

    // Duplicate Scene
    this.controller.openapi(
      createRoute({
        method: 'post',
        path: '/v1/scenes/{id}/duplicate',
        security: [{ Bearer: [] }],
        tags: ['Scenes'],
        summary: 'Duplicate a scene',
        request: {
          params: z.object({
            id: z.string().uuid()
          })
        },
        responses: {
          201: {
            description: 'Scene duplicated successfully',
            content: {
              'application/json': {
                schema: z.object({
                  success: z.boolean(),
                  data: z.any()
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

          const scene = await this.sceneRepository.findById(id)
          if (!scene) {
            return c.json({ success: false, error: 'Scene not found' }, 404)
          }

          const duplicated = await this.sceneRepository.duplicate(id)

          return c.json({ success: true, data: duplicated }, 201)
        } catch {
          return c.json({ success: false, error: 'Failed to duplicate scene' }, 400)
        }
      }
    )

    // Reorder Scenes
    this.controller.openapi(
      createRoute({
        method: 'post',
        path: '/v1/scenes/reorder',
        security: [{ Bearer: [] }],
        tags: ['Scenes'],
        summary: 'Reorder scenes in a project',
        request: {
          body: {
            content: {
              'application/json': {
                schema: z.object({
                  projectId: z.string().uuid(),
                  sceneIds: z.array(z.string().uuid())
                })
              }
            }
          }
        },
        responses: {
          200: {
            description: 'Scenes reordered successfully',
            content: {
              'application/json': {
                schema: z.object({
                  success: z.boolean(),
                  scenes: z.array(z.any())
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

          const success = await this.sceneRepository.reorder(body.projectId, body.sceneIds)

          if (!success) {
            return c.json({ success: false, error: 'Failed to reorder scenes' }, 400)
          }

          const result = await this.sceneRepository.findAll({
            projectId: body.projectId
          })

          return c.json({
            success: true,
            scenes: result.scenes
          })
        } catch {
          return c.json({ success: false, error: 'Failed to reorder scenes' }, 400)
        }
      }
    )

    // Delete Scene
    this.controller.openapi(
      createRoute({
        method: 'delete',
        path: '/v1/scenes/{id}',
        security: [{ Bearer: [] }],
        tags: ['Scenes'],
        summary: 'Delete a scene',
        request: {
          params: z.object({
            id: z.string().uuid()
          })
        },
        responses: {
          200: {
            description: 'Scene deleted successfully',
            content: {
              'application/json': {
                schema: z.object({
                  success: z.boolean(),
                  id: z.string()
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

          const scene = await this.sceneRepository.findById(id)
          if (!scene) {
            return c.json({ success: false, error: 'Scene not found' }, 404)
          }

          await this.sceneRepository.delete(id)

          return c.json({
            success: true,
            id
          })
        } catch {
          return c.json({ success: false, error: 'Failed to delete scene' }, 400)
        }
      }
    )
  }
}
