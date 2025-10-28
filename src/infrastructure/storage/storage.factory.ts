import { env } from 'node:process'
import type { FileStorageProvider } from '@/domain/interfaces/storage.interface'
import { MinIOStorageProvider } from './minio-storage.provider'

/**
 * Storage bucket names
 */
export const STORAGE_BUCKETS = {
  ASSETS: 'assets',
  AUDIO: 'audio',
  EXPORTS: 'exports',
  THUMBNAILS: 'thumbnails',
  GENERAL: 'general'
} as const

/**
 * Create storage provider based on configuration
 */
export function createStorageProvider(): FileStorageProvider {
  const provider = env.STORAGE_PROVIDER || 'minio'

  switch (provider) {
    case 'minio':
      return new MinIOStorageProvider(
        env.MINIO_ENDPOINT || 'localhost',
        Number.parseInt(env.MINIO_PORT || '9000'),
        env.MINIO_ACCESS_KEY || 'minioadmin',
        env.MINIO_SECRET_KEY || 'minioadmin',
        env.MINIO_USE_SSL === 'true',
        Object.values(STORAGE_BUCKETS)
      )

    // Future providers can be added here:
    // case 's3':
    //   return new S3StorageProvider(...)
    // case 'cloudinary':
    //   return new CloudinaryStorageProvider(...)
    // case 'local':
    //   return new LocalStorageProvider(...)

    default:
      throw new Error(`Unsupported storage provider: ${provider}`)
  }
}

/**
 * Singleton storage provider instance
 */
let storageProviderInstance: FileStorageProvider | null = null

/**
 * Get the storage provider instance (singleton)
 */
export function getStorageProvider(): FileStorageProvider {
  if (!storageProviderInstance) {
    storageProviderInstance = createStorageProvider()
  }
  return storageProviderInstance
}

/**
 * Initialize storage provider
 */
export async function initializeStorageProvider(): Promise<void> {
  const provider = getStorageProvider()
  if (provider.isAvailable()) {
    await provider.initialize()
  } else {
    throw new Error('Storage provider is not available')
  }
}

/**
 * Reset storage provider instance (useful for testing)
 */
export function resetStorageProvider(): void {
  storageProviderInstance = null
}
