import { createRoute, OpenAPIHono } from '@hono/zod-openapi'
import { z } from 'zod'
import type { Routes } from '@/domain/types'

export class SceneController implements Routes {
  public controller: OpenAPIHono

  constructor() {
    this.controller = new OpenAPIHono()
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

          const scene = {
            id: crypto.randomUUID(),
            ...body,
            animation: 'fade',
            sceneImage: null,
            sceneCameras: [],
            multiTimeline: {},
            audio: {},
            sceneAudio: null,
            draggingSpeed: 1,
            slideDuration: 0,
            syncSlideWithVoice: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }

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

          return c.json({
            success: true,
            data: [],
            total: 0,
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

          return c.json({
            success: true,
            data: { id, message: 'Scene would be returned here' }
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

          return c.json({
            success: true,
            data: { id, ...body, updatedAt: new Date().toISOString() }
          })
        } catch {
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

          const duplicatedScene = {
            id: crypto.randomUUID(),
            originalId: id,
            createdAt: new Date().toISOString()
          }

          return c.json({ success: true, data: duplicatedScene }, 201)
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

          return c.json({
            success: true,
            scenes: []
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
