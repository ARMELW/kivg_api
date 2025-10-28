import { Buffer } from 'node:buffer'
import { randomUUID } from 'node:crypto'
import process from 'node:process'
import { Client } from 'minio'
import type {
  DownloadResult,
  FileMetadata,
  FileStorageProvider,
  StreamUploadParams,
  UploadParams,
  UploadResult
} from '@/domain/interfaces/storage.interface'

/**
 * MinIO Storage Provider Implementation
 */
export class MinIOStorageProvider implements FileStorageProvider {
  public readonly name = 'minio'
  private client: Client
  private buckets: string[]

  constructor(
    endpoint: string,
    port: number,
    accessKey: string,
    secretKey: string,
    useSSL: boolean,
    buckets: string[]
  ) {
    this.client = new Client({
      endPoint: endpoint,
      port,
      useSSL,
      accessKey,
      secretKey
    })
    this.buckets = buckets
  }

  /**
   * Check if MinIO is available
   */
  isAvailable(): boolean {
    return !!this.client
  }

  /**
   * Initialize MinIO buckets
   */
  async initialize(): Promise<void> {
    try {
      for (const bucket of this.buckets) {
        const exists = await this.client.bucketExists(bucket)
        if (!exists) {
          await this.client.makeBucket(bucket, 'us-east-1')
          console.info(`MinIO bucket created: ${bucket}`)

          // Set bucket policy for public read access for exports
          if (bucket === 'exports') {
            const policy = {
              Version: '2012-10-17',
              Statement: [
                {
                  Effect: 'Allow',
                  Principal: { AWS: ['*'] },
                  Action: ['s3:GetObject'],
                  Resource: [`arn:aws:s3:::${bucket}/*`]
                }
              ]
            }
            await this.client.setBucketPolicy(bucket, JSON.stringify(policy))
          }
        }
      }
      console.info('MinIO buckets initialized successfully')
    } catch (error) {
      console.error('Error initializing MinIO buckets:', error)
      throw error
    }
  }

  /**
   * Upload a file from buffer
   */
  async uploadFile(params: UploadParams): Promise<UploadResult> {
    try {
      const { buffer, filename, bucket, contentType, metadata } = params
      const id = randomUUID()
      const extension = filename.split('.').pop() || 'bin'
      const objectName = `${id}.${extension}`

      await this.client.putObject(bucket, objectName, buffer, buffer.length, {
        'Content-Type': contentType,
        ...metadata
      })

      const url = await this.getFileUrl(bucket, objectName)

      return {
        id,
        url,
        bucket,
        size: buffer.length,
        publicId: `${bucket}/${objectName}`
      }
    } catch (error) {
      console.error('MinIO upload error:', error)
      throw new Error('Failed to upload file')
    }
  }

  /**
   * Upload from stream
   */
  async uploadStream(params: StreamUploadParams): Promise<UploadResult> {
    try {
      const { stream, filename, bucket, size, contentType, metadata } = params
      const id = randomUUID()
      const extension = filename.split('.').pop() || 'bin'
      const objectName = `${id}.${extension}`

      await this.client.putObject(bucket, objectName, stream, size, {
        'Content-Type': contentType,
        ...metadata
      })

      const url = await this.getFileUrl(bucket, objectName)

      return {
        id,
        url,
        bucket,
        size,
        publicId: `${bucket}/${objectName}`
      }
    } catch (error) {
      console.error('MinIO stream upload error:', error)
      throw new Error('Failed to upload stream')
    }
  }

  /**
   * Download a file
   */
  async downloadFile(bucket: string, objectName: string): Promise<DownloadResult> {
    try {
      const stream = await this.client.getObject(bucket, objectName)
      const chunks: Buffer[] = []

      const buffer = await new Promise<Buffer>((resolve, reject) => {
        stream.on('data', (chunk) => chunks.push(chunk))
        stream.on('end', () => resolve(Buffer.concat(chunks)))
        stream.on('error', reject)
      })

      // Get metadata for content type
      const stat = await this.client.statObject(bucket, objectName)

      return {
        buffer,
        contentType: stat.metaData?.['content-type'],
        metadata: stat.metaData
      }
    } catch (error) {
      console.error('MinIO download error:', error)
      throw new Error('Failed to download file')
    }
  }

  /**
   * Delete a file
   */
  async deleteFile(bucket: string, objectName: string): Promise<void> {
    try {
      await this.client.removeObject(bucket, objectName)
    } catch (error) {
      console.error('MinIO deletion error:', error)
      throw new Error('Failed to delete file')
    }
  }

  /**
   * Delete multiple files
   */
  async deleteFiles(bucket: string, objectNames: string[]): Promise<void> {
    try {
      await this.client.removeObjects(bucket, objectNames)
    } catch (error) {
      console.error('MinIO multiple deletion error:', error)
      throw new Error('Failed to delete files')
    }
  }

  /**
   * Get file URL (presigned for private buckets)
   */
  async getFileUrl(bucket: string, objectName: string, expiry = 7 * 24 * 60 * 60): Promise<string> {
    try {
      // For public buckets (like exports), return direct URL
      if (bucket === 'exports') {
        const protocol = process.env.MINIO_USE_SSL === 'true' ? 'https' : 'http'
        const endpoint = process.env.MINIO_ENDPOINT || 'localhost'
        const port = process.env.MINIO_PORT || '9000'
        return `${protocol}://${endpoint}:${port}/${bucket}/${objectName}`
      }

      // For private buckets, return presigned URL
      return await this.client.presignedGetObject(bucket, objectName, expiry)
    } catch (error) {
      console.error('MinIO URL generation error:', error)
      throw new Error('Failed to generate file URL')
    }
  }

  /**
   * Check if file exists
   */
  async fileExists(bucket: string, objectName: string): Promise<boolean> {
    try {
      await this.client.statObject(bucket, objectName)
      return true
    } catch {
      return false
    }
  }

  /**
   * Get file metadata
   */
  async getFileMetadata(bucket: string, objectName: string): Promise<FileMetadata> {
    try {
      const stat = await this.client.statObject(bucket, objectName)
      return {
        size: stat.size,
        contentType: stat.metaData?.['content-type'],
        lastModified: stat.lastModified,
        etag: stat.etag,
        metadata: stat.metaData
      }
    } catch (error) {
      console.error('MinIO metadata retrieval error:', error)
      throw new Error('Failed to get file metadata')
    }
  }

  /**
   * Copy file within MinIO
   */
  async copyFile(sourceBucket: string, sourceObject: string, destBucket: string, destObject: string): Promise<void> {
    try {
      await this.client.copyObject(destBucket, destObject, `/${sourceBucket}/${sourceObject}`)
    } catch (error) {
      console.error('MinIO copy error:', error)
      throw new Error('Failed to copy file')
    }
  }

  /**
   * List files in a bucket
   */
  listFiles(bucket: string, prefix?: string): Promise<string[]> {
    try {
      const stream = this.client.listObjects(bucket, prefix, true)
      const files: string[] = []

      return new Promise((resolve, reject) => {
        stream.on('data', (obj) => {
          if (obj.name) files.push(obj.name)
        })
        stream.on('end', () => resolve(files))
        stream.on('error', reject)
      })
    } catch (error) {
      console.error('MinIO file listing error:', error)
      throw new Error('Failed to list files')
    }
  }
}
