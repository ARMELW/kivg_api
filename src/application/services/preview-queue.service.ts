import type { PreviewRepositoryInterface } from '@/domain/repositories/preview.repository.interface'

export interface PreviewJob {
  previewId: string
  userId: string
  sceneId: string
  sceneHash: string
  options: {
    quality: 'draft' | 'standard' | 'high'
    aspectRatio: '1:1' | '16:9' | '9:16'
    skipAudio: boolean
  }
  priority?: number
  createdAt: Date
}

// Add an internal job type where priority and createdAt are guaranteed
type InternalPreviewJob = Omit<PreviewJob, 'priority' | 'createdAt'> & {
  priority: number
  createdAt: Date
}

const PREVIEW_LIMITS = {
  maxConcurrentPreviews: 3,
  maxQueuedPreviews: 10,
  maxGlobalConcurrent: 50,
  maxPreviewsPerHour: 20,
  maxPreviewsPerDay: 100
}

export class PreviewQueueService {
  private queue: InternalPreviewJob[] = []
  private processing: Set<string> = new Set()
  private userPreviewCounts: Map<string, { hour: number; day: number; lastReset: Date }> = new Map()

  constructor(private readonly previewRepository: PreviewRepositoryInterface) {}

  /**
   * Check if user has exceeded rate limits
   */
  async checkRateLimits(userId: string): Promise<RateLimitCheck> {
    // Count active previews
    const activePreviews = await this.previewRepository.findAll({
      userId,
      status: 'processing'
    })

    if (activePreviews.total >= PREVIEW_LIMITS.maxConcurrentPreviews) {
      return {
        allowed: false,
        message: 'Too many active previews. Please wait for completion or cancel existing previews.'
      }
    }

    // Count queued previews
    const queuedPreviews = await this.previewRepository.findAll({
      userId,
      status: 'queued'
    })

    if (queuedPreviews.total >= PREVIEW_LIMITS.maxQueuedPreviews) {
      return {
        allowed: false,
        message: 'Too many queued previews. Please wait for some to complete.'
      }
    }

    // Check hourly/daily limits
    const userCounts = this.getUserCounts(userId)
    const now = new Date()
    const hoursSinceReset = (now.getTime() - userCounts.lastReset.getTime()) / (1000 * 60 * 60)

    if (hoursSinceReset >= 24) {
      // Reset daily count
      userCounts.day = 0
      userCounts.hour = 0
      userCounts.lastReset = now
    } else if (hoursSinceReset >= 1) {
      // Reset hourly count
      userCounts.hour = 0
    }

    if (userCounts.hour >= PREVIEW_LIMITS.maxPreviewsPerHour) {
      return {
        allowed: false,
        message: `Hourly limit reached. Maximum ${PREVIEW_LIMITS.maxPreviewsPerHour} previews per hour.`
      }
    }

    if (userCounts.day >= PREVIEW_LIMITS.maxPreviewsPerDay) {
      return {
        allowed: false,
        message: `Daily limit reached. Maximum ${PREVIEW_LIMITS.maxPreviewsPerDay} previews per day.`
      }
    }

    // Check global concurrent limit
    if (this.processing.size >= PREVIEW_LIMITS.maxGlobalConcurrent) {
      return {
        allowed: false,
        message: 'System is at capacity. Please try again in a few moments.'
      }
    }

    return { allowed: true, remaining: PREVIEW_LIMITS.maxPreviewsPerHour - userCounts.hour }
  }

  /**
   * Add preview to queue
   */
  enqueue(job: PreviewJob): number {
    const jobWithDefaults: InternalPreviewJob = {
      ...job,
      // ensure priority is a number (default to 1) and ensure createdAt exists
      priority: typeof job.priority === 'number' ? job.priority : 1,
      createdAt: job.createdAt ?? new Date()
    }

    this.queue.push(jobWithDefaults)

    // Sort by priority (lower = higher priority) and creation time
    this.queue.sort((a, b) => {
      if (a.priority !== b.priority) {
        return a.priority - b.priority
      }
      return a.createdAt.getTime() - b.createdAt.getTime()
    })

    // Update user counts
    const userCounts = this.getUserCounts(job.userId)
    userCounts.hour++
    userCounts.day++

    const position = this.queue.findIndex((j) => j.previewId === job.previewId)
    console.info(
      `[PREVIEW QUEUE] 📥 Job enqueued: ${job.previewId} (scene: ${job.sceneId}, position: ${position}, total in queue: ${this.queue.length})`
    )

    // Return position in queue
    return position
  }

  /**
   * Remove preview from queue
   */
  dequeue(previewId: string): boolean {
    const index = this.queue.findIndex((j) => j.previewId === previewId)
    if (index !== -1) {
      this.queue.splice(index, 1)
      return true
    }
    return false
  }

  /**
   * Get next job from queue
   */
  getNextJob(): PreviewJob | null {
    if (this.queue.length === 0) {
      return null
    }

    // Check if we're at global capacity
    if (this.processing.size >= PREVIEW_LIMITS.maxGlobalConcurrent) {
      console.warn(
        `[PREVIEW QUEUE] ⚠️  Global capacity reached (${this.processing.size}/${PREVIEW_LIMITS.maxGlobalConcurrent}). Waiting...`
      )
      return null
    }

    const job = this.queue.shift() as PreviewJob | undefined
    if (job) {
      console.info(
        `[PREVIEW QUEUE] 📤 Job dequeued: ${job.previewId} (scene: ${job.sceneId}, remaining in queue: ${this.queue.length})`
      )
    }
    return job || null
  }

  /**
   * Mark job as processing
   */
  markProcessing(previewId: string): void {
    this.processing.add(previewId)
    console.info(
      `[PREVIEW QUEUE] ⚙️  Job marked as processing: ${previewId} (${this.processing.size}/${PREVIEW_LIMITS.maxGlobalConcurrent})`
    )
  }

  /**
   * Mark job as complete
   */
  markComplete(previewId: string): void {
    this.processing.delete(previewId)
    console.info(
      `[PREVIEW QUEUE] ✅ Job marked as complete: ${previewId} (${this.processing.size}/${PREVIEW_LIMITS.maxGlobalConcurrent})`
    )
  }

  /**
   * Get queue statistics
   */
  getQueueStats(): {
    queueLength: number
    processing: number
    available: number
  } {
    return {
      queueLength: this.queue.length,
      processing: this.processing.size,
      available: PREVIEW_LIMITS.maxGlobalConcurrent - this.processing.size
    }
  }

  /**
   * Get user's position in queue
   */
  getQueuePosition(previewId: string): number {
    return this.queue.findIndex((j) => j.previewId === previewId)
  }

  private getUserCounts(userId: string): { hour: number; day: number; lastReset: Date } {
    if (!this.userPreviewCounts.has(userId)) {
      this.userPreviewCounts.set(userId, {
        hour: 0,
        day: 0,
        lastReset: new Date()
      })
    }
    return this.userPreviewCounts.get(userId)!
  }
}
