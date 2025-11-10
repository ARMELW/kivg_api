import { Buffer } from 'node:buffer'
import { createRoute, OpenAPIHono } from '@hono/zod-openapi'
import { z } from 'zod'
import { CacheKeys } from '@/application/services/cache.service'
import { ShapeProcessingService } from '@/application/services/shape-processing.service'
import { ShapeTemplateService } from '@/application/services/shape-template.service'
import type { Routes } from '@/domain/types'
import { uploadFile } from '../config/upload.config'
import { cacheMiddleware, invalidateCacheMiddleware } from '../middlewares/cache.middleware'
import { rateLimitMiddleware, RateLimits } from '../middlewares/rate-limit.middleware'
import { ShapeRepository } from '../repositories/shape.repository'

export class ShapeController implements Routes {
  public controller: OpenAPIHono
  private shapeRepository: ShapeRepository
  private shapeProcessingService: ShapeProcessingService
  private shapeTemplateService: ShapeTemplateService

  constructor() {
    this.controller = new OpenAPIHono()
    this.shapeRepository = new ShapeRepository()
    this.shapeProcessingService = new ShapeProcessingService()
    this.shapeTemplateService = new ShapeTemplateService()
    this.initRoutes()
  }

  public initRoutes() {
    // Apply rate limiting to upload endpoints
    this.controller.use('/v1/shapes/upload', rateLimitMiddleware(RateLimits.UPLOAD))

    // Upload Shape
    this.controller.openapi(
      createRoute({
        method: 'post',
        path: '/v1/shapes/upload',
        security: [{ Bearer: [] }],
        tags: ['Shapes'],
        summary: 'Upload an SVG shape',
        request: {
          body: {
            content: {
              'multipart/form-data': {
                schema: z.object({
                  file: z.any(),
                  name: z.string().optional(),
                  tags: z.string().optional(), // JSON stringified array
                  category: z.enum(['basic', 'arrow', 'callout', 'banner', 'icon', 'decorative', 'other']).optional()
                })
              }
            }
          }
        },
        responses: {
          200: {
            description: 'Shape uploaded successfully',
            content: {
              'application/json': {
                schema: z.object({
                  success: z.boolean(),
                  data: z.object({
                    id: z.string(),
                    name: z.string(),
                    url: z.string(),
                    thumbnailUrl: z.string().optional(),
                    type: z.string(),
                    size: z.number(),
                    width: z.number().optional(),
                    height: z.number().optional(),
                    tags: z.array(z.string()),
                    category: z.string(),
                    shapeData: z.any().optional(),
                    templateJsonPath: z.string().optional(),
                    uploadedAt: z.string(),
                    userId: z.string()
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

          const formData = await c.req.formData()
          const file = formData.get('file') as File
          const name = (formData.get('name') as string) || file.name
          const categoryStr = formData.get('category') as string
          const category: 'basic' | 'arrow' | 'callout' | 'banner' | 'icon' | 'decorative' | 'other' =
            categoryStr && ['basic', 'arrow', 'callout', 'banner', 'icon', 'decorative', 'other'].includes(categoryStr)
              ? (categoryStr as 'basic' | 'arrow' | 'callout' | 'banner' | 'icon' | 'decorative' | 'other')
              : 'other'
          const tagsStr = formData.get('tags') as string
          const tags = tagsStr ? JSON.parse(tagsStr) : []

          if (!file) {
            return c.json({ success: false, error: 'No file provided' }, 400)
          }

          // Validate file type - allow SVG and XML
          const validTypes = ['image/svg+xml', 'text/xml', 'application/xml']
          if (!validTypes.includes(file.type) && !file.name.endsWith('.svg')) {
            return c.json({ success: false, error: 'File must be an SVG' }, 400)
          }

          // Validate file size (5MB max)
          if (file.size > 5 * 1024 * 1024) {
            return c.json({ success: false, error: 'File size must be less than 5MB' }, 413)
          }

          const buffer = Buffer.from(await file.arrayBuffer())

          // Process SVG
          const shapeData = this.shapeProcessingService.processSVG(buffer)

          // Generate thumbnail
          const thumbnailBuffer = await this.shapeProcessingService.generateThumbnail(buffer, {
            thumbnailSize: 200
          })

          // Extract path data
          const pathData = this.shapeProcessingService.extractPathData(shapeData.svgContent)

          // Upload original SVG and thumbnail
          const uploadResult = await uploadFile(buffer, 'shapes', file.type)
          const thumbnailResult = await uploadFile(thumbnailBuffer, 'shapes/thumbnails', 'image/webp')

          // Generate template JSON configuration
          // Use the uploaded SVG file path for template generation
          const svgPath = uploadResult.url.replace(/^\//, '') // Remove leading slash for filesystem path
          const templateWidth = shapeData.width || 640
          const templateHeight = shapeData.height || 640

          let templateJsonPath: string | undefined

          // Only generate template if Python script is available
          if (await this.shapeTemplateService.isAvailable()) {
            const templateResult = await this.shapeTemplateService.generateTemplate(
              svgPath,
              templateWidth,
              templateHeight
            )

            if (templateResult.success && templateResult.templatePath) {
              templateJsonPath = templateResult.templatePath
            } else {
              console.warn(`Template generation failed: ${templateResult.error}`)
            }
          } else {
            console.warn('Shape template service not available, skipping template generation')
          }

          const shape = await this.shapeRepository.create({
            userId: user.id,
            name,
            url: uploadResult.url,
            thumbnailUrl: thumbnailResult.url,
            type: 'svg',
            size: buffer.length,
            width: shapeData.width,
            height: shapeData.height,
            tags,
            category,
            shapeData: {
              svgContent: shapeData.svgContent,
              viewBox: shapeData.viewBox,
              pathData: pathData.length > 0 ? pathData[0] : undefined,
              isEditable: true
            },
            templateJsonPath,
            usageCount: 0
          })

          return c.json({
            success: true,
            data: shape
          })
        } catch (error: any) {
          console.error('Upload error:', error)
          return c.json(
            {
              success: false,
              error: error.message || 'Failed to upload shape'
            },
            400
          )
        }
      }
    )

    // Apply caching to list shapes
    this.controller.use(
      '/v1/shapes',
      cacheMiddleware({
        ttl: 300, // 5 minutes
        keyGenerator: (c) => {
          const user = c.get('user')
          const query = c.req.query()
          return CacheKeys.shapes(user?.id || 'anonymous', JSON.stringify(query))
        }
      })
    )

    // List Shapes
    this.controller.openapi(
      createRoute({
        method: 'get',
        path: '/v1/shapes',
        security: [{ Bearer: [] }],
        tags: ['Shapes'],
        summary: 'List all shapes',
        request: {
          query: z.object({
            page: z.string().optional().default('1'),
            limit: z.string().optional().default('20'),
            filter: z.string().optional(),
            category: z.string().optional(),
            tags: z.array(z.string()).optional(),
            sortBy: z.enum(['name', 'uploadDate', 'size', 'usageCount']).optional(),
            sortOrder: z.enum(['asc', 'desc']).optional()
          })
        },
        responses: {
          200: {
            description: 'Shapes retrieved successfully',
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

          const result = await this.shapeRepository.findAll({
            userId: user.id,
            skip: (page - 1) * limit,
            limit,
            category: query.category,
            sortBy: query.sortBy,
            sortOrder: query.sortOrder
          })

          return c.json({
            success: true,
            data: result.shapes,
            total: result.total,
            page,
            limit
          })
        } catch {
          return c.json(
            {
              success: false,
              error: 'Failed to fetch shapes'
            },
            400
          )
        }
      }
    )

    // Apply caching to single shape endpoint
    this.controller.use(
      '/v1/shapes/:id',
      cacheMiddleware({
        ttl: 600, // 10 minutes
        keyGenerator: (c) => CacheKeys.shape(c.req.param('id'))
      })
    )

    // Get Shape by ID
    this.controller.openapi(
      createRoute({
        method: 'get',
        path: '/v1/shapes/{id}',
        security: [{ Bearer: [] }],
        tags: ['Shapes'],
        summary: 'Get shape by ID',
        request: {
          params: z.object({
            id: z.string().uuid()
          })
        },
        responses: {
          200: {
            description: 'Shape retrieved successfully',
            content: {
              'application/json': {
                schema: z.object({
                  success: z.boolean(),
                  data: z.any()
                })
              }
            }
          },
          404: {
            description: 'Shape not found',
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
          if (!user) {
            return c.json({ success: false, error: 'Unauthorized' }, 401)
          }

          const { id } = c.req.param()

          const shape = await this.shapeRepository.findById(id)
          if (!shape || shape.userId !== user.id) {
            return c.json({ success: false, error: 'Shape not found' }, 404)
          }

          return c.json({
            success: true,
            data: shape
          })
        } catch {
          return c.json(
            {
              success: false,
              error: 'Failed to fetch shape'
            },
            400
          )
        }
      }
    )

    // Update Shape
    this.controller.openapi(
      createRoute({
        method: 'put',
        path: '/v1/shapes/{id}',
        security: [{ Bearer: [] }],
        tags: ['Shapes'],
        summary: 'Update shape metadata',
        request: {
          params: z.object({
            id: z.string().uuid()
          }),
          body: {
            content: {
              'application/json': {
                schema: z.object({
                  name: z.string().optional(),
                  tags: z.array(z.string()).optional(),
                  category: z.enum(['basic', 'arrow', 'callout', 'banner', 'icon', 'decorative', 'other']).optional(),
                  shapeData: z
                    .object({
                      fill: z.string().optional(),
                      stroke: z.string().optional(),
                      strokeWidth: z.number().optional(),
                      isEditable: z.boolean().optional()
                    })
                    .optional()
                })
              }
            }
          }
        },
        responses: {
          200: {
            description: 'Shape updated successfully',
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

          const shape = await this.shapeRepository.findById(id)
          if (!shape || shape.userId !== user.id) {
            return c.json({ success: false, error: 'Shape not found' }, 404)
          }

          // Merge shape data if provided
          const updateData: any = { ...body }
          if (body.shapeData) {
            updateData.shapeData = {
              ...shape.shapeData,
              ...body.shapeData
            }
          }

          const updated = await this.shapeRepository.update(id, updateData)

          // Invalidate caches
          await invalidateCacheMiddleware([
            CacheKeys.shape(id),
            `${CacheKeys.shapes(user.id, '')}*`,
            CacheKeys.shapeStats(user.id)
          ])(c, async () => {})

          return c.json({
            success: true,
            data: updated
          })
        } catch {
          return c.json(
            {
              success: false,
              error: 'Failed to update shape'
            },
            400
          )
        }
      }
    )

    // Delete Shape
    this.controller.openapi(
      createRoute({
        method: 'delete',
        path: '/v1/shapes/{id}',
        security: [{ Bearer: [] }],
        tags: ['Shapes'],
        summary: 'Delete a shape',
        request: {
          params: z.object({
            id: z.string().uuid()
          })
        },
        responses: {
          200: {
            description: 'Shape deleted successfully',
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

          const shape = await this.shapeRepository.findById(id)
          if (!shape || shape.userId !== user.id) {
            return c.json({ success: false, error: 'Shape not found' }, 404)
          }

          await this.shapeRepository.delete(id)

          // Invalidate caches
          await invalidateCacheMiddleware([
            CacheKeys.shape(id),
            `${CacheKeys.shapes(user.id, '')}*`,
            CacheKeys.shapeStats(user.id)
          ])(c, async () => {})

          return c.json({
            success: true,
            id,
            message: 'Shape deleted successfully'
          })
        } catch {
          return c.json(
            {
              success: false,
              error: 'Failed to delete shape'
            },
            400
          )
        }
      }
    )

    // Get Shape Stats
    this.controller.openapi(
      createRoute({
        method: 'get',
        path: '/v1/shapes/stats',
        security: [{ Bearer: [] }],
        tags: ['Shapes'],
        summary: 'Get shape statistics',
        responses: {
          200: {
            description: 'Stats retrieved successfully',
            content: {
              'application/json': {
                schema: z.object({
                  success: z.boolean(),
                  data: z.object({
                    totalShapes: z.number(),
                    totalSize: z.number(),
                    totalSizeMB: z.string(),
                    shapesByCategory: z.record(z.number()),
                    mostUsedShapes: z.array(z.any()).optional(),
                    recentlyUploaded: z.array(z.any()).optional()
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

          const stats = await this.shapeRepository.getStats(user.id)

          return c.json({
            success: true,
            data: stats
          })
        } catch {
          return c.json(
            {
              success: false,
              error: 'Failed to fetch stats'
            },
            400
          )
        }
      }
    )
  }
}
