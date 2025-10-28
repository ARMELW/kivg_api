import { initializeStorageProvider } from '@/infrastructure/storage/storage.factory'

// Re-export for backward compatibility
export { STORAGE_BUCKETS as MINIO_BUCKETS } from '@/infrastructure/storage/storage.factory'

// Initialize storage buckets
export async function initializeMinIOBuckets(): Promise<void> {
  try {
    await initializeStorageProvider()
    console.info('Storage provider initialized successfully')
  } catch (error) {
    console.error('Error initializing storage provider:', error)
  }
}
