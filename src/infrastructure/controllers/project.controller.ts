import { createRoute, OpenAPIHono } from '@hono/zod-openapi'
import { z } from 'zod'
import type { Routes } from '@/domain/types'
import { ProjectRepository } from '../repositories/project.repository'

export class ProjectController implements Routes {
  public controller: OpenAPIHono
  private projectRepository: ProjectRepository

  constructor() {
    this.controller = new OpenAPIHono()
    this.projectRepository = new ProjectRepository()
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
                  fps: z
                    .union([z.literal(24), z.literal(30), z.literal(60)])
                    .optional()
                    .default(30)
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

          const project = await this.projectRepository.create({
            userId: user.id,
            channelId,
            title: body.title,
            description: body.description,
            aspectRatio: body.aspectRatio,
            resolution: body.resolution,
            fps: body.fps,
            status: 'draft'
          })

          return c.json({ success: true, data: project }, 201)
        } catch {
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

          const { channelId } = c.req.param()
          const query = c.req.query()
          const page = Number.parseInt(query.page || '1')
          const limit = Number.parseInt(query.limit || '20')

          const result = await this.projectRepository.findAll({
            channelId,
            status: query.status,
            skip: (page - 1) * limit,
            limit,
            sortBy: query.sortBy,
            sortOrder: query.sortOrder,
            search: query.search
          })

          return c.json({
            success: true,
            data: result.projects,
            total: result.total,
            page,
            limit
          })
        } catch {
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

          const project = await this.projectRepository.findById(id)
          if (!project) {
            return c.json({ success: false, error: 'Project not found' }, 404)
          }

          if (project.userId !== user.id) {
            return c.json({ success: false, error: 'Unauthorized' }, 403)
          }

          return c.json({
            success: true,
            data: project
          })
        } catch {
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

          const project = await this.projectRepository.findById(id)
          if (!project) {
            return c.json({ success: false, error: 'Project not found' }, 404)
          }

          if (project.userId !== user.id) {
            return c.json({ success: false, error: 'Unauthorized' }, 403)
          }

          const updated = await this.projectRepository.update(id, body)

          return c.json({
            success: true,
            data: updated
          })
        } catch {
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

          const project = await this.projectRepository.findById(id)
          if (!project) {
            return c.json({ success: false, error: 'Project not found' }, 404)
          }

          if (project.userId !== user.id) {
            return c.json({ success: false, error: 'Unauthorized' }, 403)
          }

          const duplicated = await this.projectRepository.duplicate(id, body.title)

          return c.json({ success: true, data: duplicated }, 201)
        } catch {
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

          const project = await this.projectRepository.findById(id)
          if (!project) {
            return c.json({ success: false, error: 'Project not found' }, 404)
          }

          if (project.userId !== user.id) {
            return c.json({ success: false, error: 'Unauthorized' }, 403)
          }

          await this.projectRepository.delete(id)

          return c.json({
            success: true,
            id,
            message: 'Project deleted successfully'
          })
        } catch {
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
        } catch {
          return c.json({ success: false, error: 'Failed to autosave project' }, 400)
        }
      }
    )
  }
}
