import sharp from 'sharp'
import type { Buffer } from 'node:buffer'

export interface ImageProcessingOptions {
  width?: number
  height?: number
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside'
  quality?: number
  format?: 'jpeg' | 'png' | 'webp' | 'avif'
  withoutEnlargement?: boolean
}

export interface ThumbnailOptions {
  width: number
  height: number
  quality?: number
  format?: 'jpeg' | 'png' | 'webp'
}

export interface ImageMetadata {
  width: number
  height: number
  format: string
  size: number
  hasAlpha: boolean
  colorSpace?: string
}

export class ImageProcessingService {
  /**
   * Process and optimize an image
   */
  async processImage(buffer: Buffer, options: ImageProcessingOptions = {}): Promise<Buffer> {
    try {
      let image = sharp(buffer)

      // Resize if dimensions provided
      if (options.width || options.height) {
        image = image.resize({
          width: options.width,
          height: options.height,
          fit: options.fit || 'cover',
          withoutEnlargement: options.withoutEnlargement ?? true
        })
      }

      // Convert format if specified
      const format = options.format || 'webp'
      const quality = options.quality || 80

      switch (format) {
        case 'jpeg':
          image = image.jpeg({ quality, mozjpeg: true })
          break
        case 'png':
          image = image.png({ quality, compressionLevel: 9 })
          break
        case 'webp':
          image = image.webp({ quality })
          break
        case 'avif':
          image = image.avif({ quality })
          break
      }

      return await image.toBuffer()
    } catch (error) {
      console.error('Image processing error:', error)
      throw new Error('Failed to process image')
    }
  }

  /**
   * Generate a thumbnail from an image
   */
  async generateThumbnail(buffer: Buffer, options: ThumbnailOptions): Promise<Buffer> {
    try {
      const format = options.format || 'webp'
      const quality = options.quality || 70

      let image = sharp(buffer).resize({
        width: options.width,
        height: options.height,
        fit: 'cover',
        position: 'center'
      })

      switch (format) {
        case 'jpeg':
          image = image.jpeg({ quality, mozjpeg: true })
          break
        case 'png':
          image = image.png({ quality, compressionLevel: 9 })
          break
        case 'webp':
          image = image.webp({ quality })
          break
      }

      return await image.toBuffer()
    } catch (error) {
      console.error('Thumbnail generation error:', error)
      throw new Error('Failed to generate thumbnail')
    }
  }

  /**
   * Extract image metadata
   */
  async getMetadata(buffer: Buffer): Promise<ImageMetadata> {
    try {
      const metadata = await sharp(buffer).metadata()

      return {
        width: metadata.width || 0,
        height: metadata.height || 0,
        format: metadata.format || 'unknown',
        size: metadata.size || 0,
        hasAlpha: metadata.hasAlpha || false,
        colorSpace: metadata.space
      }
    } catch (error) {
      console.error('Metadata extraction error:', error)
      throw new Error('Failed to extract image metadata')
    }
  }

  /**
   * Validate image file
   */
  async validateImage(buffer: Buffer): Promise<boolean> {
    try {
      await sharp(buffer).metadata()
      return true
    } catch {
      return false
    }
  }

  /**
   * Convert image to specific format
   */
  async convertFormat(buffer: Buffer, format: 'jpeg' | 'png' | 'webp' | 'avif', quality = 80): Promise<Buffer> {
    try {
      let image = sharp(buffer)

      switch (format) {
        case 'jpeg':
          image = image.jpeg({ quality, mozjpeg: true })
          break
        case 'png':
          image = image.png({ quality, compressionLevel: 9 })
          break
        case 'webp':
          image = image.webp({ quality })
          break
        case 'avif':
          image = image.avif({ quality })
          break
      }

      return await image.toBuffer()
    } catch (error) {
      console.error('Format conversion error:', error)
      throw new Error('Failed to convert image format')
    }
  }

  /**
   * Compress image to target size
   */
  async compressImage(buffer: Buffer, targetSizeKB: number, maxWidth = 2048): Promise<Buffer> {
    try {
      let quality = 80
      let result = buffer

      // Start with optimized WebP
      result = await sharp(buffer).resize({ width: maxWidth, withoutEnlargement: true }).webp({ quality }).toBuffer()

      // Reduce quality if still too large
      while (result.length > targetSizeKB * 1024 && quality > 20) {
        quality -= 10
        result = await sharp(buffer).resize({ width: maxWidth, withoutEnlargement: true }).webp({ quality }).toBuffer()
      }

      return result
    } catch (error) {
      console.error('Image compression error:', error)
      throw new Error('Failed to compress image')
    }
  }

  /**
   * Create multiple sizes of an image
   */
  async createResponsiveSizes(buffer: Buffer, sizes: number[] = [320, 640, 1024, 1920]): Promise<Map<number, Buffer>> {
    const results = new Map<number, Buffer>()

    try {
      await Promise.all(
        sizes.map(async (size) => {
          const processed = await sharp(buffer)
            .resize({ width: size, withoutEnlargement: true })
            .webp({ quality: 80 })
            .toBuffer()
          results.set(size, processed)
        })
      )

      return results
    } catch (error) {
      console.error('Responsive sizes creation error:', error)
      throw new Error('Failed to create responsive sizes')
    }
  }
}
