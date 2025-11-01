import sharp from 'sharp'
import type { Buffer } from 'node:buffer'

export interface ShapeData {
  svgContent: string
  viewBox?: string
  width?: number
  height?: number
}

export interface ShapeProcessingOptions {
  maxSize?: number // Maximum file size in bytes
  thumbnailSize?: number // Thumbnail size (square)
}

export class ShapeProcessingService {
  private readonly DEFAULT_MAX_SIZE = 5 * 1024 * 1024 // 5MB
  private readonly DEFAULT_THUMBNAIL_SIZE = 200

  /**
   * Validate and process SVG content
   */
  processSVG(buffer: Buffer, options?: ShapeProcessingOptions): ShapeData {
    const maxSize = options?.maxSize || this.DEFAULT_MAX_SIZE

    // Check file size
    if (buffer.length > maxSize) {
      throw new Error(`SVG file size exceeds ${maxSize / 1024 / 1024}MB limit`)
    }

    // Convert buffer to string
    const svgContent = buffer.toString('utf-8')

    // Basic SVG validation
    if (!svgContent.includes('<svg') || !svgContent.includes('</svg>')) {
      throw new Error('Invalid SVG file format')
    }

    // Extract viewBox and dimensions
    const viewBoxMatch = svgContent.match(/viewBox=["']([^"']+)["']/)
    const widthMatch = svgContent.match(/width=["']?(\d+)/i)
    const heightMatch = svgContent.match(/height=["']?(\d+)/i)

    const viewBox = viewBoxMatch ? viewBoxMatch[1] : undefined
    let width: number | undefined
    let height: number | undefined

    // Try to extract width and height from attributes
    if (widthMatch) {
      width = Number.parseFloat(widthMatch[1])
    }
    if (heightMatch) {
      height = Number.parseFloat(heightMatch[1])
    }

    // If no width/height attributes, try to get from viewBox
    if ((!width || !height) && viewBox) {
      const viewBoxParts = viewBox.split(/\s+/)
      if (viewBoxParts.length === 4) {
        width = width || Number.parseFloat(viewBoxParts[2])
        height = height || Number.parseFloat(viewBoxParts[3])
      }
    }

    return {
      svgContent: this.sanitizeSVG(svgContent),
      viewBox,
      width,
      height
    }
  }

  /**
   * Generate a PNG thumbnail from SVG
   */
  async generateThumbnail(svgBuffer: Buffer, options?: ShapeProcessingOptions): Promise<Buffer> {
    const size = options?.thumbnailSize || this.DEFAULT_THUMBNAIL_SIZE

    try {
      // Use sharp to convert SVG to PNG thumbnail
      const thumbnail = await sharp(svgBuffer, { density: 150 })
        .resize(size, size, {
          fit: 'inside',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .png()
        .toBuffer()

      return thumbnail
    } catch (error) {
      console.error('Failed to generate thumbnail:', error)
      throw new Error('Failed to generate thumbnail from SVG')
    }
  }

  /**
   * Extract path data from SVG
   */
  extractPathData(svgContent: string): string[] {
    const pathRegex = /<path[^>]+d=["']([^"']+)["'][^>]*>/gi
    const paths: string[] = []
    let match: RegExpExecArray | null

    while ((match = pathRegex.exec(svgContent)) !== null) {
      paths.push(match[1])
    }

    return paths
  }

  /**
   * Basic SVG sanitization (remove scripts, etc.)
   */
  private sanitizeSVG(svgContent: string): string {
    // Remove script tags
    let sanitized = svgContent.replaceAll(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')

    // Remove event handlers (onclick, onload, etc.)
    sanitized = sanitized.replaceAll(/\son\w+\s*=\s*["'][^"']*["']/gi, '')

    // Remove javascript: URLs
    sanitized = sanitized.replaceAll(/javascript:/gi, '')

    return sanitized
  }

  /**
   * Validate SVG dimensions
   */
  validateDimensions(width?: number, height?: number): { width: number; height: number } {
    const maxDimension = 10000 // 10000px max

    if (width && width > maxDimension) {
      throw new Error(`Width exceeds maximum dimension of ${maxDimension}px`)
    }

    if (height && height > maxDimension) {
      throw new Error(`Height exceeds maximum dimension of ${maxDimension}px`)
    }

    return {
      width: width || 0,
      height: height || 0
    }
  }
}
