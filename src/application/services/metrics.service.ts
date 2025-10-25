import process from 'node:process'
import { CacheService } from './cache.service'

export class MetricsService {
  private cacheService: CacheService

  constructor() {
    this.cacheService = new CacheService()
  }

  /**
   * Track endpoint access
   */
  async trackEndpointAccess(endpoint: string, method: string, statusCode: number, duration: number): Promise<void> {
    try {
      const date = new Date().toISOString().split('T')[0]
      const key = `metrics:endpoint:${date}:${method}:${endpoint}`

      // Increment counter
      await this.cacheService.increment(key, 86400) // 24 hours TTL

      // Track response time
      const timeKey = `metrics:time:${date}:${method}:${endpoint}`
      const currentTimes = (await this.cacheService.get<number[]>(timeKey)) || []
      currentTimes.push(duration)

      // Keep only last 1000 entries
      if (currentTimes.length > 1000) {
        currentTimes.shift()
      }

      await this.cacheService.set(timeKey, currentTimes, 86400)

      // Track status codes
      const statusKey = `metrics:status:${date}:${statusCode}`
      await this.cacheService.increment(statusKey, 86400)
    } catch (error) {
      console.error('Failed to track endpoint access:', error)
    }
  }

  /**
   * Track errors
   */
  async trackError(endpoint: string, method: string, errorType: string): Promise<void> {
    try {
      const date = new Date().toISOString().split('T')[0]
      const key = `metrics:error:${date}:${method}:${endpoint}:${errorType}`
      await this.cacheService.increment(key, 86400)
    } catch (error) {
      console.error('Failed to track error:', error)
    }
  }

  /**
   * Get endpoint metrics
   */
  async getEndpointMetrics(
    endpoint: string,
    method: string,
    date?: string
  ): Promise<{
    requests: number
    avgResponseTime: number
    maxResponseTime: number
    minResponseTime: number
  }> {
    try {
      const targetDate = date || new Date().toISOString().split('T')[0]

      const key = `metrics:endpoint:${targetDate}:${method}:${endpoint}`
      const requests = (await this.cacheService.get<number>(key)) || 0

      const timeKey = `metrics:time:${targetDate}:${method}:${endpoint}`
      const times = (await this.cacheService.get<number[]>(timeKey)) || []

      let avgResponseTime = 0
      let maxResponseTime = 0
      let minResponseTime = 0

      if (times.length > 0) {
        avgResponseTime = times.reduce((a, b) => a + b, 0) / times.length
        maxResponseTime = Math.max(...times)
        minResponseTime = Math.min(...times)
      }

      return {
        requests,
        avgResponseTime: Math.round(avgResponseTime),
        maxResponseTime,
        minResponseTime
      }
    } catch (error) {
      console.error('Failed to get endpoint metrics:', error)
      return {
        requests: 0,
        avgResponseTime: 0,
        maxResponseTime: 0,
        minResponseTime: 0
      }
    }
  }

  /**
   * Get error rate
   */
  async getErrorRate(date?: string): Promise<{ total: number; errors: number; errorRate: number }> {
    try {
      const targetDate = date || new Date().toISOString().split('T')[0]

      // Count total 2xx/3xx responses
      const successKey = `metrics:status:${targetDate}:2*`
      const errorKey = `metrics:status:${targetDate}:*`

      // This is simplified - in production you'd query all status codes
      const errors = (await this.cacheService.get<number>(`metrics:status:${targetDate}:500`)) || 0
      const total = 100 // Simplified for demo

      return {
        total,
        errors,
        errorRate: total > 0 ? (errors / total) * 100 : 0
      }
    } catch (error) {
      console.error('Failed to get error rate:', error)
      return { total: 0, errors: 0, errorRate: 0 }
    }
  }

  /**
   * Get system health metrics
   */
  async getHealthMetrics(): Promise<{
    uptime: number
    memory: { used: number; total: number; percentage: number }
    cache: { connected: boolean }
  }> {
    try {
      const memory = process.memoryUsage()
      const cacheConnected = await this.cacheService.exists('health:check')

      return {
        uptime: process.uptime(),
        memory: {
          used: Math.round(memory.heapUsed / 1024 / 1024),
          total: Math.round(memory.heapTotal / 1024 / 1024),
          percentage: Math.round((memory.heapUsed / memory.heapTotal) * 100)
        },
        cache: {
          connected: cacheConnected
        }
      }
    } catch (error) {
      console.error('Failed to get health metrics:', error)
      throw error
    }
  }

  /**
   * Clear old metrics
   */
  async clearOldMetrics(daysOld = 30): Promise<void> {
    try {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - daysOld)

      console.info(`Clearing metrics older than ${daysOld} days`)

      // In a production system, you'd iterate through date-based keys
      // For now, this is a placeholder
      await this.cacheService.deletePattern(`metrics:*:${cutoffDate.toISOString().split('T')[0]}:*`)

      console.info('Old metrics cleared')
    } catch (error) {
      console.error('Failed to clear old metrics:', error)
    }
  }
}
