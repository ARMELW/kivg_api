import { createRoute, OpenAPIHono } from '@hono/zod-openapi'
import { z } from 'zod'
import type { Routes } from '@/domain/types'
import { uploadFile, deleteFile } from '../config/upload.config'
import { Buffer } from 'node:buffer'

export class AudioController implements Routes {
  public controller: OpenAPIHono

  constructor() {
    this.controller = new OpenAPIHono()
    this.initRoutes()
  }

  public initRoutes() {
    // Upload Audio
    this.controller.openapi(
      createRoute({
        method: 'post',
        path: '/v1/audio/upload',
        security: [{ Bearer: [] }],
        tags: ['Audio'],
        summary: 'Upload an audio file',
        request: {
          body: {
            content: {
              'multipart/form-data': {
                schema: z.object({
                  file: z.any(),
                  name: z.string().optional(),
                  category: z.enum(['music', 'sfx', 'voiceover', 'ambient', 'other']).optional(),
                  tags: z.string().optional()
                })
              }
            }
          }
        },
        responses: {
          200: {
            description: 'Audio uploaded successfully',
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

          const formData = await c.req.formData()
          const file = formData.get('file') as File
          const fileName = (formData.get('name') as string) || file.name
          const category = (formData.get('category') as string) || 'other'
          const tagsStr = formData.get('tags') as string
          const tags = tagsStr ? JSON.parse(tagsStr) : []

          if (!file) {
            return c.json({ success: false, error: 'No file provided' }, 400)
          }

          // Validate file type
          if (!file.type.startsWith('audio/')) {
            return c.json({ success: false, error: 'File must be an audio file' }, 400)
          }

          const buffer = Buffer.from(await file.arrayBuffer())
          const uploadResult = await uploadFile(buffer, 'audio')

          const audio = {
            id: crypto.randomUUID(),
            userId: user.id,
            fileName,
            fileUrl: uploadResult.url,
            duration: 0, // Would be extracted from file metadata
            size: file.size,
            category,
            tags,
            isFavorite: false,
            uploadedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }

          return c.json({ success: true, data: audio })
        } catch (error: any) {
          return c.json({ success: false, error: 'Failed to upload audio' }, 400)
        }
      }
    )

    // List Audio Files
    this.controller.openapi(
      createRoute({
        method: 'get',
        path: '/v1/audio',
        security: [{ Bearer: [] }],
        tags: ['Audio'],
        summary: 'List all audio files',
        request: {
          query: z.object({
            page: z.string().optional().default('1'),
            limit: z.string().optional().default('20'),
            category: z.string().optional(),
            search: z.string().optional(),
            favoritesOnly: z.string().optional()
          })
        },
        responses: {
          200: {
            description: 'Audio files retrieved successfully',
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
          return c.json({ success: false, error: 'Failed to fetch audio files' }, 400)
        }
      }
    )

    // Get Audio by ID
    this.controller.openapi(
      createRoute({
        method: 'get',
        path: '/v1/audio/{id}',
        security: [{ Bearer: [] }],
        tags: ['Audio'],
        summary: 'Get audio file by ID',
        request: {
          params: z.object({
            id: z.string().uuid()
          })
        },
        responses: {
          200: {
            description: 'Audio file retrieved successfully',
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
            data: { id, message: 'Audio file would be returned here' }
          })
        } catch (error: any) {
          return c.json({ success: false, error: 'Failed to fetch audio file' }, 400)
        }
      }
    )

    // Update Audio
    this.controller.openapi(
      createRoute({
        method: 'put',
        path: '/v1/audio/{id}',
        security: [{ Bearer: [] }],
        tags: ['Audio'],
        summary: 'Update audio file metadata',
        request: {
          params: z.object({
            id: z.string().uuid()
          }),
          body: {
            content: {
              'application/json': {
                schema: z.object({
                  fileName: z.string().optional(),
                  category: z.enum(['music', 'sfx', 'voiceover', 'ambient', 'other']).optional(),
                  tags: z.array(z.string()).optional(),
                  isFavorite: z.boolean().optional(),
                  trimConfig: z
                    .object({
                      startTime: z.number().optional(),
                      endTime: z.number().optional()
                    })
                    .optional(),
                  fadeConfig: z
                    .object({
                      fadeIn: z.number().optional(),
                      fadeOut: z.number().optional()
                    })
                    .optional()
                })
              }
            }
          }
        },
        responses: {
          200: {
            description: 'Audio file updated successfully',
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
          return c.json({ success: false, error: 'Failed to update audio file' }, 400)
        }
      }
    )

    // Delete Audio
    this.controller.openapi(
      createRoute({
        method: 'delete',
        path: '/v1/audio/{id}',
        security: [{ Bearer: [] }],
        tags: ['Audio'],
        summary: 'Delete an audio file',
        request: {
          params: z.object({
            id: z.string().uuid()
          })
        },
        responses: {
          200: {
            description: 'Audio file deleted successfully',
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
        } catch (error: any) {
          return c.json({ success: false, error: 'Failed to delete audio file' }, 400)
        }
      }
    )
  }
}
