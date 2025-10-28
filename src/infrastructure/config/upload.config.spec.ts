import { Buffer } from 'node:buffer'
import process from 'node:process'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { STORAGE_BUCKETS } from '@/infrastructure/storage/storage.factory'
import { deleteFile, uploadFile } from './upload.config'

// Mock the storage factory
vi.mock('@/infrastructure/storage/storage.factory', () => {
  const mockStorageProvider = {
    name: 'minio',
    isAvailable: vi.fn(() => true),
    initialize: vi.fn(),
    uploadFile: vi.fn(),
    deleteFile: vi.fn()
  }

  return {
    getStorageProvider: vi.fn(() => mockStorageProvider),
    ensureStorageInitialized: vi.fn(() => Promise.resolve()),
    STORAGE_BUCKETS: {
      ASSETS: 'assets',
      AUDIO: 'audio',
      EXPORTS: 'exports',
      THUMBNAILS: 'thumbnails',
      GENERAL: 'general'
    }
  }
})

describe('upload.config', () => {
  let mockStorageProvider: any

  beforeEach(async () => {
    vi.clearAllMocks()
    // Set environment variables for URL generation
    process.env.MINIO_USE_SSL = 'false'
    process.env.MINIO_ENDPOINT = 'localhost'
    process.env.MINIO_PORT = '9000'

    // Get the mock storage provider
    const { getStorageProvider } = await import('@/infrastructure/storage/storage.factory')
    mockStorageProvider = getStorageProvider()
  })

  describe('uploadFile', () => {
    it('should upload an image file to the assets bucket', async () => {
      // Create a PNG buffer (magic number: 89 50 4E 47)
      const buffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])

      mockStorageProvider.uploadFile.mockResolvedValue({
        id: 'test-id',
        url: 'http://localhost:9000/assets/assets/test-id.webp',
        bucket: 'assets',
        size: buffer.length,
        publicId: 'assets/assets/test-id.webp'
      })

      const result = await uploadFile(buffer, 'assets')

      expect(mockStorageProvider.uploadFile).toHaveBeenCalledTimes(1)
      const call = mockStorageProvider.uploadFile.mock.calls[0][0]
      expect(call.bucket).toBe(STORAGE_BUCKETS.ASSETS)
      expect(call.filename).toMatch(/^assets\/.*\.webp$/)
      expect(call.buffer).toBe(buffer)
      expect(call.contentType).toBe('image/webp')

      expect(result.resource_type).toBe('image')
      expect(result.url).toMatch(/assets/)
      expect(result.public_id).toMatch(/^assets\/assets\/.*\.webp$/)
    })

    it('should upload an audio file to the audio bucket', async () => {
      // Create an MP3 buffer (magic number: ID3)
      const buffer = Buffer.from([0x49, 0x44, 0x33, 0x04, 0x00, 0x00])

      mockStorageProvider.uploadFile.mockResolvedValue({
        id: 'test-id',
        url: 'http://localhost:9000/audio/audio/test-id.mp3',
        bucket: 'audio',
        size: buffer.length,
        publicId: 'audio/audio/test-id.mp3'
      })

      const result = await uploadFile(buffer, 'audio')

      expect(mockStorageProvider.uploadFile).toHaveBeenCalledTimes(1)
      const call = mockStorageProvider.uploadFile.mock.calls[0][0]
      expect(call.bucket).toBe(STORAGE_BUCKETS.AUDIO)
      expect(call.filename).toMatch(/^audio\/.*\.mp3$/)
      expect(call.contentType).toBe('audio/mpeg')

      expect(result.resource_type).toBe('audio')
    })

    it('should upload to general bucket for unknown folder types', async () => {
      const buffer = Buffer.from('test data')

      mockStorageProvider.uploadFile.mockResolvedValue({
        id: 'test-id',
        url: 'http://localhost:9000/general/documents/test-id.bin',
        bucket: 'general',
        size: buffer.length,
        publicId: 'general/documents/test-id.bin'
      })

      const result = await uploadFile(buffer, 'documents')

      const call = mockStorageProvider.uploadFile.mock.calls[0][0]
      expect(call.bucket).toBe(STORAGE_BUCKETS.GENERAL)
      expect(result.resource_type).toBe('raw')
    })

    it('should upload thumbnails to the thumbnails bucket', async () => {
      const buffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])

      mockStorageProvider.uploadFile.mockResolvedValue({
        id: 'test-id',
        url: 'http://localhost:9000/thumbnails/assets/thumbnails/test-id.webp',
        bucket: 'thumbnails',
        size: buffer.length,
        publicId: 'thumbnails/assets/thumbnails/test-id.webp'
      })

      await uploadFile(buffer, 'assets/thumbnails')

      const call = mockStorageProvider.uploadFile.mock.calls[0][0]
      expect(call.bucket).toBe(STORAGE_BUCKETS.THUMBNAILS)
    })

    it('should throw error on upload failure', async () => {
      const buffer = Buffer.from('test')
      mockStorageProvider.uploadFile.mockRejectedValue(new Error('Upload failed'))

      await expect(uploadFile(buffer, 'assets')).rejects.toThrow('Failed to upload file')
    })
  })

  describe('deleteFile', () => {
    it('should delete a file with valid public_id', async () => {
      mockStorageProvider.deleteFile.mockResolvedValue(undefined)

      await deleteFile('assets/folder/file.jpg')

      expect(mockStorageProvider.deleteFile).toHaveBeenCalledWith('assets', 'folder/file.jpg')
    })

    it('should handle nested paths correctly', async () => {
      mockStorageProvider.deleteFile.mockResolvedValue(undefined)

      await deleteFile('audio/subfolder/deep/file.mp3')

      expect(mockStorageProvider.deleteFile).toHaveBeenCalledWith('audio', 'subfolder/deep/file.mp3')
    })

    it('should throw error for invalid public_id format', async () => {
      await expect(deleteFile('invalid')).rejects.toThrow('Invalid public_id format')
    })

    it('should throw error on delete failure', async () => {
      mockStorageProvider.deleteFile.mockRejectedValue(new Error('Delete failed'))

      await expect(deleteFile('assets/file.jpg')).rejects.toThrow('Failed to delete file')
    })
  })

  describe('bucket mapping', () => {
    it('should map audio folders to audio bucket', async () => {
      const buffer = Buffer.from('test')
      mockStorageProvider.uploadFile.mockResolvedValue({
        id: 'test-id',
        url: 'http://localhost:9000/audio/audio/voice/test-id.bin',
        bucket: 'audio',
        size: buffer.length,
        publicId: 'audio/audio/voice/test-id.bin'
      })

      await uploadFile(buffer, 'audio/voice')
      const call = mockStorageProvider.uploadFile.mock.calls[0][0]
      expect(call.bucket).toBe(STORAGE_BUCKETS.AUDIO)
    })

    it('should map assets folders to assets bucket', async () => {
      const buffer = Buffer.from('test')
      mockStorageProvider.uploadFile.mockResolvedValue({
        id: 'test-id',
        url: 'http://localhost:9000/assets/assets/images/test-id.bin',
        bucket: 'assets',
        size: buffer.length,
        publicId: 'assets/assets/images/test-id.bin'
      })

      await uploadFile(buffer, 'assets/images')
      const call = mockStorageProvider.uploadFile.mock.calls[0][0]
      expect(call.bucket).toBe(STORAGE_BUCKETS.ASSETS)
    })

    it('should map exports folders to exports bucket', async () => {
      const buffer = Buffer.from('test')
      mockStorageProvider.uploadFile.mockResolvedValue({
        id: 'test-id',
        url: 'http://localhost:9000/exports/exports/data/test-id.bin',
        bucket: 'exports',
        size: buffer.length,
        publicId: 'exports/exports/data/test-id.bin'
      })

      await uploadFile(buffer, 'exports/data')
      const call = mockStorageProvider.uploadFile.mock.calls[0][0]
      expect(call.bucket).toBe(STORAGE_BUCKETS.EXPORTS)
    })
  })

  describe('resource type detection', () => {
    it('should detect JPEG images', async () => {
      const buffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0])
      mockStorageProvider.uploadFile.mockResolvedValue({
        id: 'test-id',
        url: 'http://localhost:9000/general/test/test-id.webp',
        bucket: 'general',
        size: buffer.length,
        publicId: 'general/test/test-id.webp'
      })

      const result = await uploadFile(buffer, 'test')
      expect(result.resource_type).toBe('image')
    })

    it('should detect GIF images', async () => {
      const buffer = Buffer.from([0x47, 0x49, 0x46, 0x38])
      mockStorageProvider.uploadFile.mockResolvedValue({
        id: 'test-id',
        url: 'http://localhost:9000/general/test/test-id.webp',
        bucket: 'general',
        size: buffer.length,
        publicId: 'general/test/test-id.webp'
      })

      const result = await uploadFile(buffer, 'test')
      expect(result.resource_type).toBe('image')
    })

    it('should detect RIFF audio files', async () => {
      const buffer = Buffer.from([0x52, 0x49, 0x46, 0x46])
      mockStorageProvider.uploadFile.mockResolvedValue({
        id: 'test-id',
        url: 'http://localhost:9000/general/test/test-id.mp3',
        bucket: 'general',
        size: buffer.length,
        publicId: 'general/test/test-id.mp3'
      })

      const result = await uploadFile(buffer, 'test')
      expect(result.resource_type).toBe('audio')
    })

    it('should default to raw for unknown types', async () => {
      const buffer = Buffer.from('unknown data')
      mockStorageProvider.uploadFile.mockResolvedValue({
        id: 'test-id',
        url: 'http://localhost:9000/general/test/test-id.bin',
        bucket: 'general',
        size: buffer.length,
        publicId: 'general/test/test-id.bin'
      })

      const result = await uploadFile(buffer, 'test')
      expect(result.resource_type).toBe('raw')
    })
  })
})
