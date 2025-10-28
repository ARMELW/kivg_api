import { Buffer } from 'node:buffer'
import process from 'node:process'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MINIO_BUCKETS, minioClient } from './minio.config'
import { deleteFile, uploadFile } from './upload.config'

// Mock the MinIO client
vi.mock('./minio.config', () => {
  const mockMinioClient = {
    putObject: vi.fn(),
    removeObject: vi.fn()
  }

  return {
    minioClient: mockMinioClient,
    MINIO_BUCKETS: {
      ASSETS: 'assets',
      AUDIO: 'audio',
      EXPORTS: 'exports',
      THUMBNAILS: 'thumbnails',
      GENERAL: 'general'
    }
  }
})

describe('upload.config', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Set environment variables for URL generation
    process.env.MINIO_USE_SSL = 'false'
    process.env.MINIO_ENDPOINT = 'localhost'
    process.env.MINIO_PORT = '9000'
  })

  describe('uploadFile', () => {
    it('should upload an image file to the assets bucket', async () => {
      // Create a PNG buffer (magic number: 89 50 4E 47)
      const buffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
      vi.mocked(minioClient.putObject).mockResolvedValue({} as any)

      const result = await uploadFile(buffer, 'assets')

      expect(minioClient.putObject).toHaveBeenCalledTimes(1)
      const call = vi.mocked(minioClient.putObject).mock.calls[0]
      expect(call[0]).toBe(MINIO_BUCKETS.ASSETS)
      expect(call[1]).toMatch(/^assets\/.*\.webp$/)
      expect(call[2]).toBe(buffer)
      expect(call[3]).toBe(buffer.length)
      expect(call[4]).toEqual({ 'Content-Type': 'image/webp' })

      expect(result.resource_type).toBe('image')
      expect(result.url).toMatch(/^http:\/\/localhost:9000\/assets\/assets\/.*\.webp$/)
      expect(result.public_id).toMatch(/^assets\/assets\/.*\.webp$/)
    })

    it('should upload an audio file to the audio bucket', async () => {
      // Create an MP3 buffer (magic number: ID3)
      const buffer = Buffer.from([0x49, 0x44, 0x33, 0x04, 0x00, 0x00])
      vi.mocked(minioClient.putObject).mockResolvedValue({} as any)

      const result = await uploadFile(buffer, 'audio')

      expect(minioClient.putObject).toHaveBeenCalledTimes(1)
      const call = vi.mocked(minioClient.putObject).mock.calls[0]
      expect(call[0]).toBe(MINIO_BUCKETS.AUDIO)
      expect(call[1]).toMatch(/^audio\/.*\.mp3$/)
      expect(call[4]).toEqual({ 'Content-Type': 'audio/mpeg' })

      expect(result.resource_type).toBe('audio')
    })

    it('should upload to general bucket for unknown folder types', async () => {
      const buffer = Buffer.from('test data')
      vi.mocked(minioClient.putObject).mockResolvedValue({} as any)

      const result = await uploadFile(buffer, 'documents')

      const call = vi.mocked(minioClient.putObject).mock.calls[0]
      expect(call[0]).toBe(MINIO_BUCKETS.GENERAL)
      expect(result.resource_type).toBe('raw')
    })

    it('should upload thumbnails to the thumbnails bucket', async () => {
      const buffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
      vi.mocked(minioClient.putObject).mockResolvedValue({} as any)

      await uploadFile(buffer, 'assets/thumbnails')

      const call = vi.mocked(minioClient.putObject).mock.calls[0]
      expect(call[0]).toBe(MINIO_BUCKETS.THUMBNAILS)
    })

    it('should throw error on upload failure', async () => {
      const buffer = Buffer.from('test')
      vi.mocked(minioClient.putObject).mockRejectedValue(new Error('Upload failed'))

      await expect(uploadFile(buffer, 'assets')).rejects.toThrow('Failed to upload file')
    })
  })

  describe('deleteFile', () => {
    it('should delete a file with valid public_id', async () => {
      vi.mocked(minioClient.removeObject).mockResolvedValue({} as any)

      await deleteFile('assets/folder/file.jpg')

      expect(minioClient.removeObject).toHaveBeenCalledWith('assets', 'folder/file.jpg')
    })

    it('should handle nested paths correctly', async () => {
      vi.mocked(minioClient.removeObject).mockResolvedValue({} as any)

      await deleteFile('audio/subfolder/deep/file.mp3')

      expect(minioClient.removeObject).toHaveBeenCalledWith('audio', 'subfolder/deep/file.mp3')
    })

    it('should throw error for invalid public_id format', async () => {
      await expect(deleteFile('invalid')).rejects.toThrow('Invalid public_id format')
    })

    it('should throw error on delete failure', async () => {
      vi.mocked(minioClient.removeObject).mockRejectedValue(new Error('Delete failed'))

      await expect(deleteFile('assets/file.jpg')).rejects.toThrow('Failed to delete file')
    })
  })

  describe('bucket mapping', () => {
    it('should map audio folders to audio bucket', async () => {
      const buffer = Buffer.from('test')
      vi.mocked(minioClient.putObject).mockResolvedValue({} as any)

      await uploadFile(buffer, 'audio/voice')
      const call = vi.mocked(minioClient.putObject).mock.calls[0]
      expect(call[0]).toBe(MINIO_BUCKETS.AUDIO)
    })

    it('should map assets folders to assets bucket', async () => {
      const buffer = Buffer.from('test')
      vi.mocked(minioClient.putObject).mockResolvedValue({} as any)

      await uploadFile(buffer, 'assets/images')
      const call = vi.mocked(minioClient.putObject).mock.calls[0]
      expect(call[0]).toBe(MINIO_BUCKETS.ASSETS)
    })

    it('should map exports folders to exports bucket', async () => {
      const buffer = Buffer.from('test')
      vi.mocked(minioClient.putObject).mockResolvedValue({} as any)

      await uploadFile(buffer, 'exports/data')
      const call = vi.mocked(minioClient.putObject).mock.calls[0]
      expect(call[0]).toBe(MINIO_BUCKETS.EXPORTS)
    })
  })

  describe('resource type detection', () => {
    it('should detect JPEG images', async () => {
      const buffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0])
      vi.mocked(minioClient.putObject).mockResolvedValue({} as any)

      const result = await uploadFile(buffer, 'test')
      expect(result.resource_type).toBe('image')
    })

    it('should detect GIF images', async () => {
      const buffer = Buffer.from([0x47, 0x49, 0x46, 0x38])
      vi.mocked(minioClient.putObject).mockResolvedValue({} as any)

      const result = await uploadFile(buffer, 'test')
      expect(result.resource_type).toBe('image')
    })

    it('should detect RIFF audio files', async () => {
      const buffer = Buffer.from([0x52, 0x49, 0x46, 0x46])
      vi.mocked(minioClient.putObject).mockResolvedValue({} as any)

      const result = await uploadFile(buffer, 'test')
      expect(result.resource_type).toBe('audio')
    })

    it('should default to raw for unknown types', async () => {
      const buffer = Buffer.from('unknown data')
      vi.mocked(minioClient.putObject).mockResolvedValue({} as any)

      const result = await uploadFile(buffer, 'test')
      expect(result.resource_type).toBe('raw')
    })
  })
})
