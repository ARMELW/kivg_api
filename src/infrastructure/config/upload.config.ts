import { randomUUID } from 'node:crypto'
import { getStorageProvider, STORAGE_BUCKETS } from '@/infrastructure/storage/storage.factory'
import type { Buffer } from 'node:buffer'

export interface UploadResponse {
  url: string
  public_id: string
  resource_type: string
}

/**
 * Map folder paths to storage buckets
 */
function getBucketFromFolder(folder: string): string {
  // Check for thumbnails first (before assets check)
  // More specific check to avoid false positives
  if (folder.includes('/thumbnail') || folder.endsWith('thumbnails') || folder === 'thumbnails') {
    return STORAGE_BUCKETS.THUMBNAILS
  }
  if (folder.startsWith('audio')) {
    return STORAGE_BUCKETS.AUDIO
  }
  if (folder.startsWith('assets')) {
    return STORAGE_BUCKETS.ASSETS
  }
  if (folder.startsWith('exports')) {
    return STORAGE_BUCKETS.EXPORTS
  }
  return STORAGE_BUCKETS.GENERAL
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
 * Upload a file to storage
 * Maintains compatibility with the original Cloudinary uploadFile signature
 */
export const uploadFile = async (file: Buffer, folder: string): Promise<UploadResponse> => {
  try {
    const storageProvider = getStorageProvider()
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

    const filename = folder ? `${folder}/${id}.${extension}` : `${id}.${extension}`

    // Determine content type
    let contentType = 'application/octet-stream'
    if (resourceType === 'image') {
      contentType = 'image/webp'
    } else if (resourceType === 'audio') {
      contentType = 'audio/mpeg'
    }

    // Upload using the storage provider
    const result = await storageProvider.uploadFile({
      buffer: file,
      filename,
      bucket,
      contentType
    })

    return {
      url: result.url,
      public_id: result.publicId || `${bucket}/${filename}`,
      resource_type: resourceType
    }
  } catch (error) {
    console.error('Upload error:', error)
    throw new Error('Failed to upload file')
  }
}

/**
 * Delete a file from storage
 * Maintains compatibility with the original Cloudinary deleteFile signature
 */
export const deleteFile = async (publicId: string): Promise<void> => {
  try {
    const storageProvider = getStorageProvider()

    // Parse the public_id to extract bucket and object name
    // Format is typically: bucket/path/to/file.ext
    const parts = publicId.split('/')
    if (parts.length < 2) {
      throw new Error('Invalid public_id format')
    }

    const bucket = parts[0]
    const objectName = parts.slice(1).join('/')

    await storageProvider.deleteFile(bucket, objectName)
  } catch (error: unknown) {
    // Re-throw validation errors as-is
    if (error instanceof Error && error.message === 'Invalid public_id format') {
      throw error
    }
    console.error('Delete error:', error)
    throw new Error('Failed to delete file')
  }
}
