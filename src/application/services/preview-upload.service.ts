import { readFile, unlink } from 'node:fs/promises'
import { randomUUID } from 'node:crypto'
import type { PreviewRepositoryInterface } from '@/domain/repositories/preview.repository.interface'
import { StorageService } from './storage.service'

/**
 * Background service to upload temporary preview files to MinIO storage
 * This runs independently without blocking preview availability
 */
export class PreviewUploadService {
  private storageService: StorageService
  private uploadQueue: Map<string, string> = new Map() // previewId -> localPath
  private isProcessing = false
  private processingInterval: ReturnType<typeof setInterval> | null = null
  private readonly PROCESS_INTERVAL = 5000 // Check queue every 5 seconds

  constructor(
    private readonly previewRepository: PreviewRepositoryInterface,
    storageService?: StorageService
  ) {
    this.storageService = storageService || new StorageService()
  }

  /**
   * Start the background upload processor
   */
  start(): void {
    if (this.isProcessing) {
      return
    }

    this.isProcessing = true
    console.info('[PREVIEW UPLOAD] 🚀 Starting background upload processor...')

    this.processingInterval = setInterval(() => {
      this.processNextUpload().catch((error) => {
        console.error('[PREVIEW UPLOAD] ❌ Error processing upload:', error)
      })
    }, this.PROCESS_INTERVAL)
  }

  /**
   * Stop the background upload processor
   */
  stop(): void {
    if (!this.isProcessing) {
      return
    }

    this.isProcessing = false
    console.info('[PREVIEW UPLOAD] 🛑 Stopping background upload processor...')

    if (this.processingInterval) {
      clearInterval(this.processingInterval)
      this.processingInterval = null
    }
  }

  /**
   * Queue a preview file for background upload
   */
  queueUpload(previewId: string, localPath: string): void {
    // Extract the actual file path from the URL if it's a temporary URL
    const filePath = localPath.includes('/tmp/') 
      ? localPath.split('/tmp/').pop() 
      : localPath

    const fullPath = filePath?.startsWith('/') ? filePath : `/tmp/${filePath}`
    
    this.uploadQueue.set(previewId, fullPath)
    console.info(`[PREVIEW UPLOAD] 📥 Queued upload for preview ${previewId}: ${fullPath}`)
  }

  /**
   * Process the next upload in the queue
   */
  private async processNextUpload(): Promise<void> {
    if (this.uploadQueue.size === 0) {
      return
    }

    // Get the first item in the queue
    const [previewId, localPath] = this.uploadQueue.entries().next().value
    this.uploadQueue.delete(previewId)

    try {
      console.info(`[PREVIEW UPLOAD] ⬆️  Uploading preview ${previewId} from ${localPath}...`)

      // Check if preview still exists
      const preview = await this.previewRepository.findById(previewId)
      if (!preview) {
        console.warn(`[PREVIEW UPLOAD] ⚠️  Preview ${previewId} not found, skipping upload`)
        return
      }

      // Check if file exists
      try {
        const videoBuffer = await readFile(localPath)
        const filename = `whiteboard_${randomUUID()}.mp4`

        // Upload to MinIO
        const uploadResult = await this.storageService.uploadFile(videoBuffer, filename, {
          bucket: 'EXPORTS',
          contentType: 'video/mp4',
          metadata: {
            source: 'whiteboard-animator',
            uploadedAt: new Date().toISOString(),
            previewId
          }
        })

        // Update preview with permanent MinIO URL
        await this.previewRepository.updateStatus(previewId, 'completed', uploadResult.url)
        console.info(`[PREVIEW UPLOAD] ✅ Successfully uploaded preview ${previewId} to MinIO: ${uploadResult.url}`)

        // Clean up local file
        try {
          await unlink(localPath)
          console.info(`[PREVIEW UPLOAD] 🗑️  Cleaned up local file: ${localPath}`)
        } catch (error) {
          console.warn(`[PREVIEW UPLOAD] ⚠️  Failed to clean up local file ${localPath}:`, error)
        }
      } catch (error) {
        console.error(`[PREVIEW UPLOAD] ❌ Failed to read file ${localPath}:`, error)
        // Don't retry, just log the error
      }
    } catch (error: any) {
      console.error(`[PREVIEW UPLOAD] ❌ Failed to upload preview ${previewId}:`, error?.message || error)
      // Could implement retry logic here if needed
    }
  }

  /**
   * Get the current queue size
   */
  getQueueSize(): number {
    return this.uploadQueue.size
  }

  /**
   * Check if a preview is in the upload queue
   */
  isQueued(previewId: string): boolean {
    return this.uploadQueue.has(previewId)
  }
}
