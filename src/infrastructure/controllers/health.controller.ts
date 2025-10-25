import { createRoute, OpenAPIHono } from '@hono/zod-openapi'
import { z } from 'zod'
import type { Routes } from '@/domain/types'

export class HealthController implements Routes {
  public controller: OpenAPIHono

  constructor() {
    this.controller = new OpenAPIHono()
    this.initRoutes()
  }

  public initRoutes() {
    // Health Check
    this.controller.openapi(
      createRoute({
        method: 'get',
        path: '/v1/health',
        tags: ['Health'],
        summary: 'Health check endpoint',
        responses: {
          200: {
            description: 'Service is healthy',
            content: {
              'application/json': {
                schema: z.object({
                  status: z.string(),
                  timestamp: z.string(),
                  version: z.string(),
                  services: z.object({
                    database: z.string(),
                    storage: z.string(),
                    queue: z.string()
                  })
                })
              }
            }
          }
        }
      }),
      async (c: any) => {
        try {
          return c.json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            version: '1.0.0',
            services: {
              database: 'healthy',
              storage: 'healthy',
              queue: 'healthy'
            }
          })
        } catch (error: any) {
          return c.json(
            {
              status: 'unhealthy',
              timestamp: new Date().toISOString(),
              error: error.message
            },
            500
          )
        }
      }
    )

    // Version Info
    this.controller.openapi(
      createRoute({
        method: 'get',
        path: '/v1/version',
        tags: ['Health'],
        summary: 'Get API version information',
        responses: {
          200: {
            description: 'Version information retrieved',
            content: {
              'application/json': {
                schema: z.object({
                  version: z.string(),
                  apiVersion: z.string(),
                  buildDate: z.string(),
                  environment: z.string()
                })
              }
            }
          }
        }
      }),
      async (c: any) => {
        return c.json({
          version: '1.0.0',
          apiVersion: 'v1',
          buildDate: '2025-01-15',
          environment: Bun.env.NODE_ENV || 'development'
        })
      }
    )
  }
}
