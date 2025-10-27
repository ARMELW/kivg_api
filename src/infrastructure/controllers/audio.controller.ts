import { Buffer } from 'node:buffer'
import { createRoute, OpenAPIHono } from '@hono/zod-openapi'
import { z } from 'zod'
import type { Routes } from '@/domain/types'
import { uploadFile } from '../config/upload.config'
import { AudioRepository } from '../repositories/audio.repository'

export class AudioController implements Routes {
  public controller: OpenAPIHono
  private audioRepository: AudioRepository

  constructor() {
    this.controller = new OpenAPIHono()
    this.audioRepository = new AudioRepository()
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

          const audio = await this.audioRepository.create({
            userId: user.id,
            fileName,
            fileUrl: uploadResult.url,
            duration: 0, // Would be extracted from file metadata
            size: file.size,
            category: category as 'music' | 'sfx' | 'voiceover' | 'ambient' | 'other',
            tags,
            isFavorite: false
          })

          return c.json({ success: true, data: audio })
        } catch {
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
          const page = Number.parseInt(query.page || '1')
          const limit = Number.parseInt(query.limit || '20')
          const isFavorite = query.favoritesOnly === 'true' ? true : undefined

          const result = await this.audioRepository.findAll({
            userId: user.id,
            skip: (page - 1) * limit,
            limit,
            category: query.category,
            isFavorite
          })

          return c.json({
            success: true,
            data: result.audioFiles,
            total: result.total,
            page,
            limit
          })
        } catch {
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

          const audio = await this.audioRepository.findById(id)
          if (!audio) {
            return c.json({ success: false, error: 'Audio file not found' }, 404)
          }

          if (audio.userId !== user.id) {
            return c.json({ success: false, error: 'Unauthorized' }, 403)
          }

          return c.json({
            success: true,
            data: audio
          })
        } catch {
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

          const audio = await this.audioRepository.findById(id)
          if (!audio) {
            return c.json({ success: false, error: 'Audio file not found' }, 404)
          }

          if (audio.userId !== user.id) {
            return c.json({ success: false, error: 'Unauthorized' }, 403)
          }

          const updated = await this.audioRepository.update(id, body)

          return c.json({
            success: true,
            data: updated
          })
        } catch {
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

          const audio = await this.audioRepository.findById(id)
          if (!audio) {
            return c.json({ success: false, error: 'Audio file not found' }, 404)
          }

          if (audio.userId !== user.id) {
            return c.json({ success: false, error: 'Unauthorized' }, 403)
          }

          await this.audioRepository.delete(id)

          return c.json({
            success: true,
            id
          })
        } catch {
          return c.json({ success: false, error: 'Failed to delete audio file' }, 400)
        }
      }
    )
  }
}
