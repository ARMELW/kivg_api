import { createRoute, OpenAPIHono } from '@hono/zod-openapi'
import { z } from 'zod'
import type { Routes } from '@/domain/types'

export class ProjectController implements Routes {
  public controller: OpenAPIHono

  constructor() {
    this.controller = new OpenAPIHono()
    this.initRoutes()
  }

  public initRoutes() {
    // Create Project
    this.controller.openapi(
      createRoute({
        method: 'post',
        path: '/v1/channels/{channelId}/projects',
        security: [{ Bearer: [] }],
        tags: ['Projects'],
        summary: 'Create a new project',
        request: {
          params: z.object({
            channelId: z.string().uuid()
          }),
          body: {
            content: {
              'application/json': {
                schema: z.object({
                  title: z.string().min(1),
                  description: z.string().optional(),
                  aspectRatio: z.enum(['16:9', '9:16', '1:1', '4:5']).optional().default('16:9'),
                  resolution: z.enum(['720p', '1080p', '4k']).optional().default('1080p'),
                  fps: z.union([z.literal(24), z.literal(30), z.literal(60)]).optional().default(30)
                })
              }
            }
          }
        },
        responses: {
          201: {
            description: 'Project created successfully',
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

          const { channelId } = c.req.param()
          const body = await c.req.json()

          const project = {
            id: crypto.randomUUID(),
            userId: user.id,
            channelId,
            ...body,
            thumbnailUrl: null,
            duration: 0,
            status: 'draft',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            deletedAt: null
          }

          return c.json({ success: true, data: project }, 201)
        } catch (error: any) {
          return c.json({ success: false, error: 'Failed to create project' }, 400)
        }
      }
    )

    // List Projects
    this.controller.openapi(
      createRoute({
        method: 'get',
        path: '/v1/channels/{channelId}/projects',
        security: [{ Bearer: [] }],
        tags: ['Projects'],
        summary: 'List all projects in a channel',
        request: {
          params: z.object({
            channelId: z.string().uuid()
          }),
          query: z.object({
            page: z.string().optional().default('1'),
            limit: z.string().optional().default('20'),
            status: z.enum(['draft', 'in_progress', 'completed']).optional(),
            sortBy: z.enum(['created_at', 'updated_at', 'title']).optional(),
            sortOrder: z.enum(['asc', 'desc']).optional(),
            search: z.string().optional()
          })
        },
        responses: {
          200: {
            description: 'Projects retrieved successfully',
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
          const page = parseInt(query.page || '1')
          const limit = parseInt(query.limit || '20')

          return c.json({
            success: true,
            data: [],
            total: 0,
            page,
            limit
          })
        } catch (error: any) {
          return c.json({ success: false, error: 'Failed to fetch projects' }, 400)
        }
      }
    )

    // Get Project by ID
    this.controller.openapi(
      createRoute({
        method: 'get',
        path: '/v1/projects/{id}',
        security: [{ Bearer: [] }],
        tags: ['Projects'],
        summary: 'Get project by ID',
        request: {
          params: z.object({
            id: z.string().uuid()
          })
        },
        responses: {
          200: {
            description: 'Project retrieved successfully',
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
            data: { id, message: 'Project would be returned here' }
          })
        } catch (error: any) {
          return c.json({ success: false, error: 'Failed to fetch project' }, 400)
        }
      }
    )

    // Update Project
    this.controller.openapi(
      createRoute({
        method: 'put',
        path: '/v1/projects/{id}',
        security: [{ Bearer: [] }],
        tags: ['Projects'],
        summary: 'Update project',
        request: {
          params: z.object({
            id: z.string().uuid()
          }),
          body: {
            content: {
              'application/json': {
                schema: z.object({
                  title: z.string().optional(),
                  description: z.string().optional(),
                  status: z.enum(['draft', 'in_progress', 'completed']).optional()
                })
              }
            }
          }
        },
        responses: {
          200: {
            description: 'Project updated successfully',
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
        } catch (error: any) {
          return c.json({ success: false, error: 'Failed to update project' }, 400)
        }
      }
    )

    // Duplicate Project
    this.controller.openapi(
      createRoute({
        method: 'post',
        path: '/v1/projects/{id}/duplicate',
        security: [{ Bearer: [] }],
        tags: ['Projects'],
        summary: 'Duplicate a project',
        request: {
          params: z.object({
            id: z.string().uuid()
          }),
          body: {
            content: {
              'application/json': {
                schema: z.object({
                  title: z.string().min(1)
                })
              }
            }
          }
        },
        responses: {
          201: {
            description: 'Project duplicated successfully',
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

          const duplicatedProject = {
            id: crypto.randomUUID(),
            originalId: id,
            ...body,
            createdAt: new Date().toISOString()
          }

          return c.json({ success: true, data: duplicatedProject }, 201)
        } catch (error: any) {
          return c.json({ success: false, error: 'Failed to duplicate project' }, 400)
        }
      }
    )

    // Delete Project
    this.controller.openapi(
      createRoute({
        method: 'delete',
        path: '/v1/projects/{id}',
        security: [{ Bearer: [] }],
        tags: ['Projects'],
        summary: 'Delete a project',
        request: {
          params: z.object({
            id: z.string().uuid()
          })
        },
        responses: {
          200: {
            description: 'Project deleted successfully',
            content: {
              'application/json': {
                schema: z.object({
                  success: z.boolean(),
                  id: z.string(),
                  message: z.string()
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
            id,
            message: 'Project deleted successfully'
          })
        } catch (error: any) {
          return c.json({ success: false, error: 'Failed to delete project' }, 400)
        }
      }
    )

    // Autosave Project
    this.controller.openapi(
      createRoute({
        method: 'post',
        path: '/v1/projects/{id}/autosave',
        security: [{ Bearer: [] }],
        tags: ['Projects'],
        summary: 'Autosave project state',
        request: {
          params: z.object({
            id: z.string().uuid()
          }),
          body: {
            content: {
              'application/json': {
                schema: z.object({
                  data: z.any(),
                  timestamp: z.string()
                })
              }
            }
          }
        },
        responses: {
          200: {
            description: 'Project autosaved successfully',
            content: {
              'application/json': {
                schema: z.object({
                  success: z.boolean(),
                  savedAt: z.string()
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
            savedAt: new Date().toISOString()
          })
        } catch (error: any) {
          return c.json({ success: false, error: 'Failed to autosave project' }, 400)
        }
      }
    )
  }
}
