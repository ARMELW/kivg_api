import { getStorageProvider, STORAGE_BUCKETS } from '@/infrastructure/storage/storage.factory'
import type { FileStorageProvider } from '@/domain/interfaces/storage.interface'
import type { Buffer } from 'node:buffer'
import type { Readable } from 'node:stream'

export interface UploadOptions {
  bucket: keyof typeof STORAGE_BUCKETS
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
  private storageProvider: FileStorageProvider

  constructor(storageProvider?: FileStorageProvider) {
    this.storageProvider = storageProvider || getStorageProvider()
  }

  /**
   * Upload a file to storage
   */
  async uploadFile(buffer: Buffer, filename: string, options: UploadOptions): Promise<UploadResult> {
    try {
      const bucket = STORAGE_BUCKETS[options.bucket]

      const result = await this.storageProvider.uploadFile({
        buffer,
        filename,
        bucket,
        contentType: options.contentType,
        metadata: options.metadata
      })

      return {
        id: result.id,
        url: result.url,
        bucket: result.bucket,
        size: result.size
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
      const bucket = STORAGE_BUCKETS[options.bucket]

      const result = await this.storageProvider.uploadStream({
        stream,
        filename,
        bucket,
        size,
        contentType: options.contentType,
        metadata: options.metadata
      })

      return {
        id: result.id,
        url: result.url,
        bucket: result.bucket,
        size: result.size
      }
    } catch (error) {
      console.error('Stream upload error:', error)
      throw new Error('Failed to upload stream')
    }
  }

  /**
   * Download a file from storage
   */
  async downloadFile(bucket: string, objectName: string): Promise<Buffer> {
    try {
      const result = await this.storageProvider.downloadFile(bucket, objectName)
      return result.buffer
    } catch (error) {
      console.error('File download error:', error)
      throw new Error('Failed to download file')
    }
  }

  /**
   * Delete a file from storage
   */
  async deleteFile(bucket: string, objectName: string): Promise<void> {
    try {
      await this.storageProvider.deleteFile(bucket, objectName)
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
      await this.storageProvider.deleteFiles(bucket, objectNames)
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
      return await this.storageProvider.getFileUrl(bucket, objectName, expiry)
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
      return await this.storageProvider.fileExists(bucket, objectName)
    } catch {
      return false
    }
  }

  /**
   * Get file metadata
   */
  async getFileMetadata(bucket: string, objectName: string): Promise<any> {
    try {
      return await this.storageProvider.getFileMetadata(bucket, objectName)
    } catch (error) {
      console.error('Metadata retrieval error:', error)
      throw new Error('Failed to get file metadata')
    }
  }

  /**
   * Copy file within storage
   */
  async copyFile(sourceBucket: string, sourceObject: string, destBucket: string, destObject: string): Promise<void> {
    try {
      await this.storageProvider.copyFile(sourceBucket, sourceObject, destBucket, destObject)
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
      return this.storageProvider.listFiles(bucket, prefix)
    } catch (error) {
      console.error('File listing error:', error)
      throw new Error('Failed to list files')
    }
  }
}
