import type { Buffer } from 'node:buffer'
import type { Readable } from 'node:stream'

/**
 * Storage Provider Interface
 * This abstraction allows swapping storage providers (MinIO, S3, Cloudinary, etc.)
 * without changing business logic
 */
export interface StorageProvider {
  /**
   * Provider name (e.g., 'minio', 's3', 'cloudinary', 'local')
   */
  name: string

  /**
   * Check if the provider is available and configured
   */
  isAvailable: () => boolean

  /**
   * Initialize the storage provider (create buckets, check connections, etc.)
   */
  initialize: () => Promise<void>
}

/**
 * File Upload Parameters
 */
export interface UploadParams {
  buffer: Buffer
  filename: string
  bucket: string
  contentType: string
  metadata?: Record<string, string>
}

/**
 * Stream Upload Parameters
 */
export interface StreamUploadParams {
  stream: Readable
  filename: string
  bucket: string
  size: number
  contentType: string
  metadata?: Record<string, string>
}

/**
 * File Upload Result
 */
export interface UploadResult {
  id: string
  url: string
  bucket: string
  size: number
  publicId?: string // For compatibility with providers that use public IDs
}

/**
 * File Download Result
 */
export interface DownloadResult {
  buffer: Buffer
  contentType?: string
  metadata?: Record<string, string>
}

/**
 * File Metadata
 */
export interface FileMetadata {
  size: number
  contentType?: string
  lastModified?: Date
  etag?: string
  metadata?: Record<string, string>
}

/**
 * File Storage Provider Interface
 */
export interface FileStorageProvider extends StorageProvider {
  /**
   * Upload a file from buffer
   */
  uploadFile: (params: UploadParams) => Promise<UploadResult>

  /**
   * Upload a file from stream
   */
  uploadStream: (params: StreamUploadParams) => Promise<UploadResult>

  /**
   * Download a file
   */
  downloadFile: (bucket: string, objectName: string) => Promise<DownloadResult>

  /**
   * Delete a single file
   */
  deleteFile: (bucket: string, objectName: string) => Promise<void>

  /**
   * Delete multiple files
   */
  deleteFiles: (bucket: string, objectNames: string[]) => Promise<void>

  /**
   * Get file URL (presigned or direct)
   */
  getFileUrl: (bucket: string, objectName: string, expiry?: number) => Promise<string>

  /**
   * Check if file exists
   */
  fileExists: (bucket: string, objectName: string) => Promise<boolean>

  /**
   * Get file metadata
   */
  getFileMetadata: (bucket: string, objectName: string) => Promise<FileMetadata>

  /**
   * Copy file within storage
   */
  copyFile: (sourceBucket: string, sourceObject: string, destBucket: string, destObject: string) => Promise<void>

  /**
   * List files in a bucket
   */
  listFiles: (bucket: string, prefix?: string) => Promise<string[]>
}

/**
 * Storage configuration
 */
export interface StorageConfig {
  provider: 'minio' | 's3' | 'cloudinary' | 'local'
  buckets: {
    ASSETS: string
    AUDIO: string
    EXPORTS: string
    THUMBNAILS: string
    GENERAL: string
  }
  // Provider-specific configurations
  minio?: {
    endpoint: string
    port: number
    accessKey: string
    secretKey: string
    useSSL: boolean
  }
  s3?: {
    region: string
    accessKeyId: string
    secretAccessKey: string
    bucket?: string
  }
  cloudinary?: {
    cloudName: string
    apiKey: string
    apiSecret: string
  }
  local?: {
    basePath: string
  }
}
