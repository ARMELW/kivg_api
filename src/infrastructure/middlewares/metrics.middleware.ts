import { MetricsService } from '@/application/services/metrics.service'
import type { Context, Next } from 'hono'

const metricsService = new MetricsService()

/**
 * Metrics tracking middleware
 */
export function metricsMiddleware() {
  return async (c: Context, next: Next) => {
    const startTime = Date.now()
    const method = c.req.method
    const path = c.req.path

    try {
      await next()
    } finally {
      const duration = Date.now() - startTime
      const statusCode = c.res.status

      // Track metrics asynchronously (don't block response)
      metricsService.trackEndpointAccess(path, method, statusCode, duration).catch((error) => {
        console.error('Failed to track metrics:', error)
      })

      // Track errors if status >= 400
      if (statusCode >= 400) {
        const errorType = statusCode >= 500 ? 'server_error' : 'client_error'
        metricsService.trackError(path, method, errorType).catch((error) => {
          console.error('Failed to track error:', error)
        })
      }
    }
  }
}
