import { createRoute, OpenAPIHono } from '@hono/zod-openapi'
import { z } from 'zod'
import type { Routes } from '@/domain/types'
import { ChannelRepository } from '../repositories/channel.repository'

export class ChannelController implements Routes {
  public controller: OpenAPIHono
  private channelRepository: ChannelRepository

  constructor() {
    this.controller = new OpenAPIHono()
    this.channelRepository = new ChannelRepository()
    this.initRoutes()
  }

  public initRoutes() {
    // Create Channel
    this.controller.openapi(
      createRoute({
        method: 'post',
        path: '/v1/channels',
        security: [{ Bearer: [] }],
        tags: ['Channels'],
        summary: 'Create a new channel',
        request: {
          body: {
            content: {
              'application/json': {
                schema: z.object({
                  name: z.string().min(1),
                  description: z.string().optional(),
                  youtubeUrl: z.string().url().optional()
                })
              }
            }
          }
        },
        responses: {
          201: {
            description: 'Channel created successfully',
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

          const channel = await this.channelRepository.create({
            userId: user.id,
            name: body.name,
            description: body.description,
            youtubeUrl: body.youtubeUrl,
            brandKit: {
              logoUrl: null,
              colors: {
                primary: '#3B82F6',
                secondary: '#10B981',
                accent: '#F59E0B'
              },
              introVideoUrl: null,
              outroVideoUrl: null,
              customFonts: null
            },
            status: 'active'
          })

          return c.json({ success: true, data: channel }, 201)
        } catch {
          return c.json({ success: false, error: 'Failed to create channel' }, 400)
        }
      }
    )

    // List Channels
    this.controller.openapi(
      createRoute({
        method: 'get',
        path: '/v1/channels',
        security: [{ Bearer: [] }],
        tags: ['Channels'],
        summary: 'List all channels',
        request: {
          query: z.object({
            status: z.enum(['active', 'archived']).optional(),
            page: z.string().optional().default('1'),
            limit: z.string().optional().default('10')
          })
        },
        responses: {
          200: {
            description: 'Channels retrieved successfully',
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

          const result = await this.channelRepository.findAll({
            userId: user.id,
            skip: (page - 1) * limit,
            limit,
            status: query.status as 'active' | 'archived' | undefined
          })

          return c.json({
            success: true,
            data: result.channels,
            total: result.total,
            page,
            limit
          })
        } catch {
          return c.json({ success: false, error: 'Failed to fetch channels' }, 400)
        }
      }
    )

    // Get Channel by ID
    this.controller.openapi(
      createRoute({
        method: 'get',
        path: '/v1/channels/{id}',
        security: [{ Bearer: [] }],
        tags: ['Channels'],
        summary: 'Get channel by ID',
        request: {
          params: z.object({
            id: z.string().uuid()
          })
        },
        responses: {
          200: {
            description: 'Channel retrieved successfully',
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

          const channel = await this.channelRepository.findById(id)
          if (!channel) {
            return c.json({ success: false, error: 'Channel not found' }, 404)
          }

          if (channel.userId !== user.id) {
            return c.json({ success: false, error: 'Unauthorized' }, 403)
          }

          return c.json({
            success: true,
            data: channel
          })
        } catch {
          return c.json({ success: false, error: 'Failed to fetch channel' }, 400)
        }
      }
    )

    // Update Channel
    this.controller.openapi(
      createRoute({
        method: 'put',
        path: '/v1/channels/{id}',
        security: [{ Bearer: [] }],
        tags: ['Channels'],
        summary: 'Update channel',
        request: {
          params: z.object({
            id: z.string().uuid()
          }),
          body: {
            content: {
              'application/json': {
                schema: z.object({
                  name: z.string().optional(),
                  description: z.string().optional(),
                  youtubeUrl: z.string().url().optional()
                })
              }
            }
          }
        },
        responses: {
          200: {
            description: 'Channel updated successfully',
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

          const channel = await this.channelRepository.findById(id)
          if (!channel) {
            return c.json({ success: false, error: 'Channel not found' }, 404)
          }

          if (channel.userId !== user.id) {
            return c.json({ success: false, error: 'Unauthorized' }, 403)
          }

          const updated = await this.channelRepository.update(id, body)

          return c.json({
            success: true,
            data: updated
          })
        } catch {
          return c.json({ success: false, error: 'Failed to update channel' }, 400)
        }
      }
    )

    // Archive Channel
    this.controller.openapi(
      createRoute({
        method: 'post',
        path: '/v1/channels/{id}/archive',
        security: [{ Bearer: [] }],
        tags: ['Channels'],
        summary: 'Archive a channel',
        request: {
          params: z.object({
            id: z.string().uuid()
          })
        },
        responses: {
          200: {
            description: 'Channel archived successfully',
            content: {
              'application/json': {
                schema: z.object({
                  success: z.boolean(),
                  id: z.string(),
                  status: z.string()
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

          const channel = await this.channelRepository.findById(id)
          if (!channel) {
            return c.json({ success: false, error: 'Channel not found' }, 404)
          }

          if (channel.userId !== user.id) {
            return c.json({ success: false, error: 'Unauthorized' }, 403)
          }

          const archived = await this.channelRepository.archive(id)

          return c.json({
            success: true,
            id: archived.id,
            status: archived.status
          })
        } catch {
          return c.json({ success: false, error: 'Failed to archive channel' }, 400)
        }
      }
    )

    // Get Channel Stats
    this.controller.openapi(
      createRoute({
        method: 'get',
        path: '/v1/channels/{id}/stats',
        security: [{ Bearer: [] }],
        tags: ['Channels'],
        summary: 'Get channel statistics',
        request: {
          params: z.object({
            id: z.string().uuid()
          })
        },
        responses: {
          200: {
            description: 'Stats retrieved successfully',
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

          const channel = await this.channelRepository.findById(id)
          if (!channel) {
            return c.json({ success: false, error: 'Channel not found' }, 404)
          }

          if (channel.userId !== user.id) {
            return c.json({ success: false, error: 'Unauthorized' }, 403)
          }

          const stats = await this.channelRepository.getStats(id)

          return c.json({
            success: true,
            data: {
              channelId: id,
              totalProjects: stats.projectCount,
              projectsByStatus: {
                draft: 0, // Can be enhanced based on active/completed stats
                inProgress: stats.activeProjects,
                completed: stats.completedProjects
              },
              totalVideosExported: stats.totalVideosExported,
              totalDurationMinutes: 0, // Can be enhanced if needed
              lastActivity: channel.updatedAt
            }
          })
        } catch {
          return c.json({ success: false, error: 'Failed to fetch stats' }, 400)
        }
      }
    )
  }
}
