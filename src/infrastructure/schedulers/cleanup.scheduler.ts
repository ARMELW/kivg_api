import { ExportCleanupService } from '@/application/services/export-cleanup.service'
import { MetricsService } from '@/application/services/metrics.service'

/**
 * Time constants in milliseconds
 */
const DAY_IN_MS = 24 * 60 * 60 * 1000
const WEEK_IN_MS = 7 * 24 * 60 * 60 * 1000

export class CleanupScheduler {
  private exportCleanupService: ExportCleanupService
  private metricsService: MetricsService
  private intervals: NodeJS.Timeout[] = []

  constructor() {
    this.exportCleanupService = new ExportCleanupService()
    this.metricsService = new MetricsService()
  }

  /**
   * Start all cleanup jobs
   */
  start(): void {
    console.info('Starting cleanup scheduler...')

    // Cleanup old completed exports daily at 2 AM
    this.scheduleDaily(() => {
      console.info('Running daily export cleanup job')
      this.exportCleanupService
        .cleanupOldExports(30)
        .then((result) => {
          console.info(`Export cleanup completed: ${result.deleted} deleted, ${result.errors} errors`)
        })
        .catch((error) => {
          console.error('Export cleanup failed:', error)
        })
    }, 2)

    // Cleanup failed exports daily at 3 AM
    this.scheduleDaily(() => {
      console.info('Running failed exports cleanup job')
      this.exportCleanupService
        .cleanupFailedExports(7)
        .then((result) => {
          console.info(`Failed exports cleanup completed: ${result.deleted} deleted, ${result.errors} errors`)
        })
        .catch((error) => {
          console.error('Failed exports cleanup failed:', error)
        })
    }, 3)

    // Cleanup old metrics weekly (Sundays at 4 AM)
    this.scheduleWeekly(
      () => {
        console.info('Running metrics cleanup job')
        this.metricsService
          .clearOldMetrics(30)
          .then(() => {
            console.info('Metrics cleanup completed')
          })
          .catch((error) => {
            console.error('Metrics cleanup failed:', error)
          })
      },
      0,
      4
    ) // Sunday at 4 AM

    console.info('Cleanup scheduler started')
  }

  /**
   * Stop all cleanup jobs
   */
  stop(): void {
    console.info('Stopping cleanup scheduler...')
    this.intervals.forEach((interval) => clearInterval(interval))
    this.intervals = []
    console.info('Cleanup scheduler stopped')
  }

  /**
   * Schedule a job to run daily at a specific hour
   */
  private scheduleDaily(job: () => void, hour: number): void {
    const now = new Date()
    const scheduledTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, 0, 0, 0)

    // If the scheduled time has passed today, schedule for tomorrow
    if (scheduledTime <= now) {
      scheduledTime.setDate(scheduledTime.getDate() + 1)
    }

    const timeUntilJob = scheduledTime.getTime() - now.getTime()

    // Run the first job at the scheduled time
    setTimeout(() => {
      job()
      // Then run it every 24 hours
      const interval = setInterval(job, DAY_IN_MS)
      this.intervals.push(interval)
    }, timeUntilJob)
  }

  /**
   * Schedule a job to run weekly on a specific day at a specific hour
   */
  private scheduleWeekly(job: () => void, dayOfWeek: number, hour: number): void {
    const now = new Date()
    const scheduledTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, 0, 0, 0)

    // Calculate days until target day
    const currentDay = now.getDay()
    let daysUntilTarget = dayOfWeek - currentDay

    if (daysUntilTarget < 0 || (daysUntilTarget === 0 && scheduledTime <= now)) {
      daysUntilTarget += 7
    }

    scheduledTime.setDate(scheduledTime.getDate() + daysUntilTarget)

    const timeUntilJob = scheduledTime.getTime() - now.getTime()

    // Run the first job at the scheduled time
    setTimeout(() => {
      job()
      // Then run it every week
      const interval = setInterval(job, WEEK_IN_MS)
      this.intervals.push(interval)
    }, timeUntilJob)
  }
}
