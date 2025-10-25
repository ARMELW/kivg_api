import { Buffer } from 'node:buffer'
import { createRoute, OpenAPIHono } from '@hono/zod-openapi'
import { z } from 'zod'
import type { Routes } from '@/domain/types'
import { uploadFile } from '../config/upload.config'

export class AssetController implements Routes {
  public controller: OpenAPIHono

  constructor() {
    this.controller = new OpenAPIHono()
    this.initRoutes()
  }

  public initRoutes() {
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
          const category = (formData.get('category') as string) || 'other'
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
          const uploadResult = await uploadFile(buffer, 'assets')

          const asset = {
            id: crypto.randomUUID(),
            userId: user.id,
            name,
            url: uploadResult.url,
            thumbnailUrl: uploadResult.url,
            type: file.type,
            size: file.size,
            tags,
            category,
            usageCount: 0,
            uploadedAt: new Date().toISOString()
          }

          // In a real implementation, save to database here
          // await assetRepository.create(asset)

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

          // In a real implementation, fetch from database
          // const result = await assetRepository.findAll({ userId: user.id, skip: (page - 1) * limit, limit, ...query })

          return c.json({
            success: true,
            data: [],
            total: 0,
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

          // In a real implementation:
          // const asset = await assetRepository.findById(id)
          // if (!asset || asset.userId !== user.id) {
          //   return c.json({ success: false, error: 'Asset not found' }, 404)
          // }

          return c.json({
            success: true,
            data: { id, message: 'Asset would be returned here' }
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

          // In a real implementation:
          // const asset = await assetRepository.update(id, body)

          return c.json({
            success: true,
            data: { id, ...body, updatedAt: new Date().toISOString() }
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

          // In a real implementation:
          // const asset = await assetRepository.findById(id)
          // if (asset && asset.url) {
          //   await deleteFile(extractPublicId(asset.url))
          // }
          // await assetRepository.delete(id)

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

          // In a real implementation:
          // const stats = await assetRepository.getStats(user.id)

          return c.json({
            success: true,
            data: {
              totalAssets: 0,
              totalSize: 0,
              totalSizeMB: '0.00',
              assetsByCategory: {},
              mostUsedAssets: [],
              recentlyUploaded: []
            }
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
