import { createRoute, OpenAPIHono } from '@hono/zod-openapi'
import { z } from 'zod'
import type { Routes } from '@/domain/types'
import { TemplateRepository } from '../repositories/template.repository'

export class TemplateController implements Routes {
  public controller: OpenAPIHono
  private templateRepository: TemplateRepository

  constructor() {
    this.controller = new OpenAPIHono()
    this.templateRepository = new TemplateRepository()
    this.initRoutes()
  }

  public initRoutes() {
    // Create Template
    this.controller.openapi(
      createRoute({
        method: 'post',
        path: '/v1/templates',
        security: [{ Bearer: [] }],
        tags: ['Templates'],
        summary: 'Create a new template',
        request: {
          body: {
            content: {
              'application/json': {
                schema: z.object({
                  name: z.string().min(1),
                  description: z.string().min(1),
                  type: z.enum(['education', 'marketing', 'presentation', 'tutorial', 'entertainment', 'other']),
                  style: z.enum(['minimal', 'colorful', 'professional', 'creative', 'dark', 'light']),
                  tags: z.array(z.string()).default([]),
                  thumbnail: z.string().url().optional(),
                  sceneData: z.any(),
                  metadata: z
                    .object({
                      layerCount: z.number().int(),
                      cameraCount: z.number().int(),
                      hasAudio: z.boolean(),
                      hasBackground: z.boolean(),
                      complexity: z.enum(['beginner', 'intermediate', 'advanced', 'expert'])
                    })
                    .optional()
                })
              }
            }
          }
        },
        responses: {
          201: {
            description: 'Template created successfully',
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

          const template = await this.templateRepository.create({
            name: body.name,
            description: body.description,
            type: body.type,
            style: body.style,
            tags: body.tags || [],
            thumbnail: body.thumbnail,
            previewAnimation: undefined,
            metadata: body.metadata,
            sceneData: body.sceneData,
            version: '1.0.0'
          })

          return c.json({ success: true, data: template }, 201)
        } catch {
          return c.json({ success: false, error: 'Failed to create template' }, 400)
        }
      }
    )

    // List Templates
    this.controller.openapi(
      createRoute({
        method: 'get',
        path: '/v1/templates',
        security: [{ Bearer: [] }],
        tags: ['Templates'],
        summary: 'List all templates',
        request: {
          query: z.object({
            page: z.string().optional().default('1'),
            limit: z.string().optional().default('20'),
            type: z.string().optional(),
            style: z.string().optional(),
            complexity: z.enum(['beginner', 'intermediate', 'advanced', 'expert']).optional(),
            search: z.string().optional(),
            minRating: z.string().optional(),
            sortByPopularity: z.string().optional()
          })
        },
        responses: {
          200: {
            description: 'Templates retrieved successfully',
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
          const limit = Number.parseInt(query.limit || '20')

          const result = await this.templateRepository.findAll({
            skip: (page - 1) * limit,
            limit,
            type: query.type,
            style: query.style,
            search: query.search,
            sortBy: query.sortByPopularity === 'true' ? 'popularity' : 'createdAt',
            sortOrder: 'desc'
          })

          return c.json({
            success: true,
            data: result.templates,
            total: result.total,
            page,
            limit
          })
        } catch {
          return c.json({ success: false, error: 'Failed to fetch templates' }, 400)
        }
      }
    )

    // Get Template by ID
    this.controller.openapi(
      createRoute({
        method: 'get',
        path: '/v1/templates/{id}',
        security: [{ Bearer: [] }],
        tags: ['Templates'],
        summary: 'Get template by ID',
        request: {
          params: z.object({
            id: z.string().uuid()
          })
        },
        responses: {
          200: {
            description: 'Template retrieved successfully',
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

          const template = await this.templateRepository.findById(id)
          if (!template) {
            return c.json({ success: false, error: 'Template not found' }, 404)
          }

          // Increment popularity when a template is viewed
          await this.templateRepository.incrementPopularity(id)

          return c.json({
            success: true,
            data: template
          })
        } catch {
          return c.json({ success: false, error: 'Failed to fetch template' }, 400)
        }
      }
    )

    // Export Template
    this.controller.openapi(
      createRoute({
        method: 'get',
        path: '/v1/templates/{id}/export',
        security: [{ Bearer: [] }],
        tags: ['Templates'],
        summary: 'Export template as JSON',
        request: {
          params: z.object({
            id: z.string().uuid()
          })
        },
        responses: {
          200: {
            description: 'Template exported successfully',
            content: {
              'application/json': {
                schema: z.object({
                  version: z.string(),
                  template: z.any(),
                  exportedAt: z.string()
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

          const template = await this.templateRepository.findById(id)
          if (!template) {
            return c.json({ success: false, error: 'Template not found' }, 404)
          }

          return c.json({
            version: template.version,
            template,
            exportedAt: new Date().toISOString()
          })
        } catch {
          return c.json({ success: false, error: 'Failed to export template' }, 400)
        }
      }
    )

    // Import Template
    this.controller.openapi(
      createRoute({
        method: 'post',
        path: '/v1/templates/import',
        security: [{ Bearer: [] }],
        tags: ['Templates'],
        summary: 'Import a template from JSON',
        request: {
          body: {
            content: {
              'application/json': {
                schema: z.object({
                  templateData: z.object({
                    version: z.string(),
                    template: z.any()
                  })
                })
              }
            }
          }
        },
        responses: {
          201: {
            description: 'Template imported successfully',
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

          const importedTemplate = {
            id: crypto.randomUUID(),
            ...body.templateData.template,
            createdAt: new Date().toISOString()
          }

          return c.json({ success: true, data: importedTemplate }, 201)
        } catch {
          return c.json({ success: false, error: 'Failed to import template' }, 400)
        }
      }
    )

    // Delete Template
    this.controller.openapi(
      createRoute({
        method: 'delete',
        path: '/v1/templates/{id}',
        security: [{ Bearer: [] }],
        tags: ['Templates'],
        summary: 'Delete a template',
        request: {
          params: z.object({
            id: z.string().uuid()
          })
        },
        responses: {
          200: {
            description: 'Template deleted successfully',
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

          const template = await this.templateRepository.findById(id)
          if (!template) {
            return c.json({ success: false, error: 'Template not found' }, 404)
          }

          await this.templateRepository.delete(id)

          return c.json({
            success: true,
            id
          })
        } catch {
          return c.json({ success: false, error: 'Failed to delete template' }, 400)
        }
      }
    )
  }
}
