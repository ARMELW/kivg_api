import { Buffer } from 'node:buffer'
import { randomUUID } from 'node:crypto'
import process from 'node:process'
import { MINIO_BUCKETS, minioClient } from '@/infrastructure/config/minio.config'
import type { Readable } from 'node:stream'

export interface UploadOptions {
  bucket: keyof typeof MINIO_BUCKETS
  contentType: string
  metadata?: Record<string, string>
}

export interface UploadResult {
  id: string
  url: string
  bucket: string
  size: number
}

export class StorageService {
  /**
   * Upload a file to MinIO
   */
  async uploadFile(buffer: Buffer, filename: string, options: UploadOptions): Promise<UploadResult> {
    try {
      const bucket = MINIO_BUCKETS[options.bucket]
      const id = randomUUID()
      const extension = filename.split('.').pop() || 'bin'
      const objectName = `${id}.${extension}`

      // Upload to MinIO
      await minioClient.putObject(bucket, objectName, buffer, buffer.length, {
        'Content-Type': options.contentType,
        ...options.metadata
      })

      // Generate URL
      const url = await this.getFileUrl(bucket, objectName)

      return {
        id,
        url,
        bucket,
        size: buffer.length
      }
    } catch (error) {
      console.error('File upload error:', error)
      throw new Error('Failed to upload file')
    }
  }

  /**
   * Upload from stream
   */
  async uploadStream(stream: Readable, filename: string, size: number, options: UploadOptions): Promise<UploadResult> {
    try {
      const bucket = MINIO_BUCKETS[options.bucket]
      const id = randomUUID()
      const extension = filename.split('.').pop() || 'bin'
      const objectName = `${id}.${extension}`

      await minioClient.putObject(bucket, objectName, stream, size, {
        'Content-Type': options.contentType,
        ...options.metadata
      })

      const url = await this.getFileUrl(bucket, objectName)

      return {
        id,
        url,
        bucket,
        size
      }
    } catch (error) {
      console.error('Stream upload error:', error)
      throw new Error('Failed to upload stream')
    }
  }

  /**
   * Download a file from MinIO
   */
  async downloadFile(bucket: string, objectName: string): Promise<Buffer> {
    try {
      const stream = await minioClient.getObject(bucket, objectName)
      const chunks: Buffer[] = []

      return new Promise((resolve, reject) => {
        stream.on('data', (chunk) => chunks.push(chunk))
        stream.on('end', () => resolve(Buffer.concat(chunks)))
        stream.on('error', reject)
      })
    } catch (error) {
      console.error('File download error:', error)
      throw new Error('Failed to download file')
    }
  }

  /**
   * Delete a file from MinIO
   */
  async deleteFile(bucket: string, objectName: string): Promise<void> {
    try {
      await minioClient.removeObject(bucket, objectName)
    } catch (error) {
      console.error('File deletion error:', error)
      throw new Error('Failed to delete file')
    }
  }

  /**
   * Delete multiple files
   */
  async deleteFiles(bucket: string, objectNames: string[]): Promise<void> {
    try {
      await minioClient.removeObjects(bucket, objectNames)
    } catch (error) {
      console.error('Multiple files deletion error:', error)
      throw new Error('Failed to delete files')
    }
  }

  /**
   * Get file URL (presigned for private buckets)
   */
  async getFileUrl(bucket: string, objectName: string, expiry = 7 * 24 * 60 * 60): Promise<string> {
    try {
      // For public buckets (like exports), return direct URL
      if (bucket === MINIO_BUCKETS.EXPORTS) {
        // Use environment variables to construct URL
        const protocol = process.env.MINIO_USE_SSL === 'true' ? 'https' : 'http'
        const endpoint = process.env.MINIO_ENDPOINT || 'localhost'
        const port = process.env.MINIO_PORT || '9000'
        return `${protocol}://${endpoint}:${port}/${bucket}/${objectName}`
      }

      // For private buckets, return presigned URL
      return await minioClient.presignedGetObject(bucket, objectName, expiry)
    } catch (error) {
      console.error('URL generation error:', error)
      throw new Error('Failed to generate file URL')
    }
  }

  /**
   * Check if file exists
   */
  async fileExists(bucket: string, objectName: string): Promise<boolean> {
    try {
      await minioClient.statObject(bucket, objectName)
      return true
    } catch {
      return false
    }
  }

  /**
   * Get file metadata
   */
  async getFileMetadata(bucket: string, objectName: string): Promise<any> {
    try {
      return await minioClient.statObject(bucket, objectName)
    } catch (error) {
      console.error('Metadata retrieval error:', error)
      throw new Error('Failed to get file metadata')
    }
  }

  /**
   * Copy file within MinIO
   */
  async copyFile(sourceBucket: string, sourceObject: string, destBucket: string, destObject: string): Promise<void> {
    try {
      await minioClient.copyObject(destBucket, destObject, `/${sourceBucket}/${sourceObject}`)
    } catch (error) {
      console.error('File copy error:', error)
      throw new Error('Failed to copy file')
    }
  }

  /**
   * List files in a bucket
   */
  listFiles(bucket: string, prefix?: string): Promise<string[]> {
    try {
      const stream = minioClient.listObjects(bucket, prefix, true)
      const files: string[] = []

      return new Promise((resolve, reject) => {
        stream.on('data', (obj) => {
          if (obj.name) files.push(obj.name)
        })
        stream.on('end', () => resolve(files))
        stream.on('error', reject)
      })
    } catch (error) {
      console.error('File listing error:', error)
      throw new Error('Failed to list files')
    }
  }
}
