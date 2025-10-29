import { createRoute, OpenAPIHono } from '@hono/zod-openapi'
import { z } from 'zod'
import type { Routes } from '@/domain/types'
import { SceneRepository } from '../repositories/scene.repository'

export class SceneController implements Routes {
  public controller: OpenAPIHono
  private sceneRepository: SceneRepository

  constructor() {
    this.controller = new OpenAPIHono()
    this.sceneRepository = new SceneRepository()
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
                  backgroundImage: z.string().optional(),
                  layers: z.array(z.any()).optional().default([]),
                  cameras: z.array(z.any()).optional().default([]),
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
            backgroundImage: body.backgroundImage,
            sceneImage: undefined,
            layers: body.layers || [],
            cameras: body.cameras || [],
            sceneCameras: body.sceneCameras || [],
            multiTimeline: {},
            audio: {},
            sceneAudio: undefined,
            transitionType: body.transitionType || 'fade',
            draggingSpeed: 1,
            slideDuration: 0,
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
                  backgroundImage: z.string().optional(),
                  layers: z.array(z.any()).optional(),
                  cameras: z.array(z.any()).optional(),
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
