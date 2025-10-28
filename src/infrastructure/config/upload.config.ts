import { randomUUID } from 'node:crypto'
import process from 'node:process'
import { MINIO_BUCKETS, minioClient } from './minio.config'
import type { Buffer } from 'node:buffer'

export interface UploadResponse {
  url: string
  public_id: string
  resource_type: string
}

/**
 * Map folder paths to MinIO buckets
 */
function getBucketFromFolder(folder: string): string {
  if (folder.startsWith('audio')) {
    return MINIO_BUCKETS.AUDIO
  }
  if (folder.startsWith('assets')) {
    return MINIO_BUCKETS.ASSETS
  }
  if (folder.includes('thumbnail')) {
    return MINIO_BUCKETS.THUMBNAILS
  }
  if (folder.startsWith('exports')) {
    return MINIO_BUCKETS.EXPORTS
  }
  return MINIO_BUCKETS.GENERAL
}

/**
 * Determine resource type from buffer content
 */
function getResourceType(buffer: Buffer): string {
  // Check magic numbers for common file types
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image'
  }
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
    return 'image'
  }
  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) {
    return 'image'
  }
  if (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46) {
    return 'audio'
  }
  if (buffer[0] === 0x49 && buffer[1] === 0x44 && buffer[2] === 0x33) {
    return 'audio'
  }
  return 'raw'
}

/**
 * Upload a file to MinIO
 * Maintains compatibility with the original Cloudinary uploadFile signature
 */
export const uploadFile = async (file: Buffer, folder: string): Promise<UploadResponse> => {
  try {
    const bucket = getBucketFromFolder(folder)
    const id = randomUUID()
    const resourceType = getResourceType(file)

    // Determine file extension based on resource type
    let extension = 'bin'
    if (resourceType === 'image') {
      extension = 'webp' // Default to webp for images as they're often processed
    } else if (resourceType === 'audio') {
      extension = 'mp3'
    }

    const objectName = folder ? `${folder}/${id}.${extension}` : `${id}.${extension}`

    // Determine content type
    let contentType = 'application/octet-stream'
    if (resourceType === 'image') {
      contentType = 'image/webp'
    } else if (resourceType === 'audio') {
      contentType = 'audio/mpeg'
    }

    // Upload to MinIO
    await minioClient.putObject(bucket, objectName, file, file.length, {
      'Content-Type': contentType
    })

    // Generate URL
    const protocol = process.env.MINIO_USE_SSL === 'true' ? 'https' : 'http'
    const endpoint = process.env.MINIO_ENDPOINT || 'localhost'
    const port = process.env.MINIO_PORT || '9000'
    const url = `${protocol}://${endpoint}:${port}/${bucket}/${objectName}`

    return {
      url,
      public_id: `${bucket}/${objectName}`,
      resource_type: resourceType
    }
  } catch (error) {
    console.error('Upload error:', error)
    throw new Error('Failed to upload file')
  }
}

/**
 * Delete a file from MinIO
 * Maintains compatibility with the original Cloudinary deleteFile signature
 */
export const deleteFile = async (publicId: string): Promise<void> => {
  try {
    // Parse the public_id to extract bucket and object name
    // Format is typically: bucket/path/to/file.ext
    const parts = publicId.split('/')
    if (parts.length < 2) {
      throw new Error('Invalid public_id format')
    }

    const bucket = parts[0]
    const objectName = parts.slice(1).join('/')

    await minioClient.removeObject(bucket, objectName)
  } catch (error) {
    console.error('Delete error:', error)
    throw new Error('Failed to delete file')
  }
}
