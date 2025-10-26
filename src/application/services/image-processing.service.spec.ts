import { Buffer } from 'node:buffer'
import sharp from 'sharp'
import { beforeEach, describe, expect, it } from 'vitest'
import { ImageProcessingService } from './image-processing.service'

describe('ImageProcessingService', () => {
  let imageService: ImageProcessingService

  beforeEach(() => {
    imageService = new ImageProcessingService()
  })

  describe('validateImage', () => {
    it('should validate valid image buffer', async () => {
      // Create a simple 1x1 PNG image
      const buffer = await sharp({
        create: {
          width: 1,
          height: 1,
          channels: 4,
          background: { r: 255, g: 0, b: 0, alpha: 1 }
        }
      })
        .png()
        .toBuffer()

      const isValid = await imageService.validateImage(buffer)
      expect(isValid).toBe(true)
    })

    it('should reject invalid image buffer', async () => {
      const buffer = Buffer.from('not an image')
      const isValid = await imageService.validateImage(buffer)
      expect(isValid).toBe(false)
    })
  })

  describe('getMetadata', () => {
    it('should extract image metadata', async () => {
      const buffer = await sharp({
        create: {
          width: 100,
          height: 200,
          channels: 4,
          background: { r: 255, g: 0, b: 0, alpha: 1 }
        }
      })
        .png()
        .toBuffer()

      const metadata = await imageService.getMetadata(buffer)

      expect(metadata.width).toBe(100)
      expect(metadata.height).toBe(200)
      expect(metadata.format).toBe('png')
      expect(metadata.hasAlpha).toBe(true)
    })
  })

  describe('processImage', () => {
    it('should resize image to specified dimensions', async () => {
      const buffer = await sharp({
        create: {
          width: 200,
          height: 200,
          channels: 4,
          background: { r: 255, g: 0, b: 0, alpha: 1 }
        }
      })
        .png()
        .toBuffer()

      const processed = await imageService.processImage(buffer, {
        width: 100,
        height: 100,
        format: 'png'
      })

      const metadata = await sharp(processed).metadata()
      expect(metadata.width).toBe(100)
      expect(metadata.height).toBe(100)
    })

    it('should convert image format', async () => {
      const buffer = await sharp({
        create: {
          width: 100,
          height: 100,
          channels: 4,
          background: { r: 255, g: 0, b: 0, alpha: 1 }
        }
      })
        .png()
        .toBuffer()

      const processed = await imageService.processImage(buffer, {
        format: 'webp',
        quality: 80
      })

      const metadata = await sharp(processed).metadata()
      expect(metadata.format).toBe('webp')
    })
  })

  describe('generateThumbnail', () => {
    it('should generate thumbnail with correct dimensions', async () => {
      const buffer = await sharp({
        create: {
          width: 800,
          height: 600,
          channels: 4,
          background: { r: 255, g: 0, b: 0, alpha: 1 }
        }
      })
        .png()
        .toBuffer()

      const thumbnail = await imageService.generateThumbnail(buffer, {
        width: 200,
        height: 150,
        format: 'webp'
      })

      const metadata = await sharp(thumbnail).metadata()
      expect(metadata.width).toBe(200)
      expect(metadata.height).toBe(150)
      expect(metadata.format).toBe('webp')
    })
  })

  describe('convertFormat', () => {
    it('should convert PNG to JPEG', async () => {
      const buffer = await sharp({
        create: {
          width: 100,
          height: 100,
          channels: 4,
          background: { r: 255, g: 0, b: 0, alpha: 1 }
        }
      })
        .png()
        .toBuffer()

      const converted = await imageService.convertFormat(buffer, 'jpeg', 80)
      const metadata = await sharp(converted).metadata()
      expect(metadata.format).toBe('jpeg')
    })
  })

  describe('compressImage', () => {
    it('should compress image to approximately target size', async () => {
      const buffer = await sharp({
        create: {
          width: 1000,
          height: 1000,
          channels: 4,
          background: { r: 255, g: 0, b: 0, alpha: 1 }
        }
      })
        .png()
        .toBuffer()

      const targetSizeKB = 50
      const compressed = await imageService.compressImage(buffer, targetSizeKB, 500)

      // Check that the compressed size is within reasonable bounds
      const compressedSizeKB = compressed.length / 1024
      expect(compressedSizeKB).toBeLessThan(targetSizeKB * 2)
    })
  })
})
