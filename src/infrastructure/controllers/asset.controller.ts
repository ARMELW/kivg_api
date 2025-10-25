import { Buffer } from 'node:buffer'
import { createRoute, OpenAPIHono } from '@hono/zod-openapi'
import { z } from 'zod'
import { CacheKeys } from '@/application/services/cache.service'
import { ImageProcessingService } from '@/application/services/image-processing.service'
import type { Routes } from '@/domain/types'
import { uploadFile } from '../config/upload.config'
import { cacheMiddleware, invalidateCacheMiddleware } from '../middlewares/cache.middleware'
import { rateLimitMiddleware, RateLimits } from '../middlewares/rate-limit.middleware'
import { AssetRepository } from '../repositories/asset.repository'

export class AssetController implements Routes {
  public controller: OpenAPIHono
  private assetRepository: AssetRepository
  private imageProcessingService: ImageProcessingService

  constructor() {
    this.controller = new OpenAPIHono()
    this.assetRepository = new AssetRepository()
    this.imageProcessingService = new ImageProcessingService()
    this.initRoutes()
  }

  public initRoutes() {
    // Apply rate limiting to upload endpoints
    this.controller.use('/v1/assets/upload', rateLimitMiddleware(RateLimits.UPLOAD))

    // Upload Asset
    this.controller.openapi(
      createRoute({
        method: 'post',
        path: '/v1/assets/upload',
        security: [{ Bearer: [] }],
        tags: ['Assets'],
        summary: 'Upload an image asset',
        request: {
          body: {
            content: {
              'multipart/form-data': {
                schema: z.object({
                  file: z.any(),
                  name: z.string().optional(),
                  tags: z.string().optional(), // JSON stringified array
                  category: z.enum(['illustration', 'icon', 'background', 'other']).optional()
                })
              }
            }
          }
        },
        responses: {
          200: {
            description: 'Asset uploaded successfully',
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
          const category: 'illustration' | 'icon' | 'background' | 'other' =
            categoryStr && ['illustration', 'icon', 'background', 'other'].includes(categoryStr)
              ? (categoryStr as 'illustration' | 'icon' | 'background' | 'other')
              : 'other'
          const tagsStr = formData.get('tags') as string
          const tags = tagsStr ? JSON.parse(tagsStr) : []

          if (!file) {
            return c.json({ success: false, error: 'No file provided' }, 400)
          }

          // Validate file type
          if (!file.type.startsWith('image/')) {
            return c.json({ success: false, error: 'File must be an image' }, 400)
          }

          // Validate file size (10MB max)
          if (file.size > 10 * 1024 * 1024) {
            return c.json({ success: false, error: 'File size must be less than 10MB' }, 413)
          }

          const buffer = Buffer.from(await file.arrayBuffer())

          // Process image - optimize and generate thumbnail
          const processedBuffer = await this.imageProcessingService.processImage(buffer, {
            quality: 85,
            format: 'webp'
          })

          const thumbnailBuffer = await this.imageProcessingService.generateThumbnail(buffer, {
            width: 300,
            height: 300,
            quality: 70,
            format: 'webp'
          })

          const metadata = await this.imageProcessingService.getMetadata(buffer)

          // Upload processed image and thumbnail
          const uploadResult = await uploadFile(processedBuffer, 'assets')
          const thumbnailResult = await uploadFile(thumbnailBuffer, 'assets/thumbnails')

          const asset = await this.assetRepository.create({
            userId: user.id,
            name,
            url: uploadResult.url,
            thumbnailUrl: thumbnailResult.url,
            type: 'image/webp',
            size: processedBuffer.length,
            width: metadata.width,
            height: metadata.height,
            tags,
            category
          })

          return c.json({
            success: true,
            data: asset
          })
        } catch (error: any) {
          console.error('Upload error:', error)
          return c.json(
            {
              success: false,
              error: 'Failed to upload asset'
            },
            400
          )
        }
      }
    )

    // Apply caching to list assets
    this.controller.use(
      '/v1/assets',
      cacheMiddleware({
        ttl: 300, // 5 minutes
        keyGenerator: (c) => {
          const user = c.get('user')
          const query = c.req.query()
          return CacheKeys.assets(user?.id || 'anonymous', JSON.stringify(query))
        }
      })
    )

    // List Assets
    this.controller.openapi(
      createRoute({
        method: 'get',
        path: '/v1/assets',
        security: [{ Bearer: [] }],
        tags: ['Assets'],
        summary: 'List all assets',
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
            description: 'Assets retrieved successfully',
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

          const result = await this.assetRepository.findAll({
            userId: user.id,
            skip: (page - 1) * limit,
            limit,
            category: query.category,
            sortBy: query.sortBy,
            sortOrder: query.sortOrder
          })

          return c.json({
            success: true,
            data: result.assets,
            total: result.total,
            page,
            limit
          })
        } catch {
          return c.json(
            {
              success: false,
              error: 'Failed to fetch assets'
            },
            400
          )
        }
      }
    )

    // Apply caching to single asset endpoint
    this.controller.use(
      '/v1/assets/:id',
      cacheMiddleware({
        ttl: 600, // 10 minutes
        keyGenerator: (c) => CacheKeys.asset(c.req.param('id'))
      })
    )

    // Get Asset by ID
    this.controller.openapi(
      createRoute({
        method: 'get',
        path: '/v1/assets/{id}',
        security: [{ Bearer: [] }],
        tags: ['Assets'],
        summary: 'Get asset by ID',
        request: {
          params: z.object({
            id: z.string().uuid()
          })
        },
        responses: {
          200: {
            description: 'Asset retrieved successfully',
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
            description: 'Asset not found',
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

          const asset = await this.assetRepository.findById(id)
          if (!asset || asset.userId !== user.id) {
            return c.json({ success: false, error: 'Asset not found' }, 404)
          }

          return c.json({
            success: true,
            data: asset
          })
        } catch {
          return c.json(
            {
              success: false,
              error: 'Failed to fetch asset'
            },
            400
          )
        }
      }
    )

    // Update Asset
    this.controller.openapi(
      createRoute({
        method: 'put',
        path: '/v1/assets/{id}',
        security: [{ Bearer: [] }],
        tags: ['Assets'],
        summary: 'Update asset metadata',
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
                  category: z.enum(['illustration', 'icon', 'background', 'other']).optional()
                })
              }
            }
          }
        },
        responses: {
          200: {
            description: 'Asset updated successfully',
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

          const asset = await this.assetRepository.findById(id)
          if (!asset || asset.userId !== user.id) {
            return c.json({ success: false, error: 'Asset not found' }, 404)
          }

          const updated = await this.assetRepository.update(id, body)

          // Invalidate caches
          await invalidateCacheMiddleware([
            CacheKeys.asset(id),
            `${CacheKeys.assets(user.id, '')}*`,
            CacheKeys.assetStats(user.id)
          ])(c, async () => {})

          return c.json({
            success: true,
            data: updated
          })
        } catch {
          return c.json(
            {
              success: false,
              error: 'Failed to update asset'
            },
            400
          )
        }
      }
    )

    // Delete Asset
    this.controller.openapi(
      createRoute({
        method: 'delete',
        path: '/v1/assets/{id}',
        security: [{ Bearer: [] }],
        tags: ['Assets'],
        summary: 'Delete an asset',
        request: {
          params: z.object({
            id: z.string().uuid()
          })
        },
        responses: {
          200: {
            description: 'Asset deleted successfully',
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

          const asset = await this.assetRepository.findById(id)
          if (!asset || asset.userId !== user.id) {
            return c.json({ success: false, error: 'Asset not found' }, 404)
          }

          await this.assetRepository.delete(id)

          // Invalidate caches
          await invalidateCacheMiddleware([
            CacheKeys.asset(id),
            `${CacheKeys.assets(user.id, '')}*`,
            CacheKeys.assetStats(user.id)
          ])(c, async () => {})

          return c.json({
            success: true,
            id,
            message: 'Asset deleted successfully'
          })
        } catch {
          return c.json(
            {
              success: false,
              error: 'Failed to delete asset'
            },
            400
          )
        }
      }
    )

    // Get Asset Stats
    this.controller.openapi(
      createRoute({
        method: 'get',
        path: '/v1/assets/stats',
        security: [{ Bearer: [] }],
        tags: ['Assets'],
        summary: 'Get asset statistics',
        responses: {
          200: {
            description: 'Stats retrieved successfully',
            content: {
              'application/json': {
                schema: z.object({
                  success: z.boolean(),
                  data: z.object({
                    totalAssets: z.number(),
                    totalSize: z.number(),
                    totalSizeMB: z.string(),
                    assetsByCategory: z.record(z.number()),
                    mostUsedAssets: z.array(z.any()).optional(),
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

          const stats = await this.assetRepository.getStats(user.id)

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
