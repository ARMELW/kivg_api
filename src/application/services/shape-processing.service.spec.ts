import { Buffer } from 'node:buffer'
import { describe, expect, it } from 'vitest'
import { ShapeProcessingService } from './shape-processing.service'

describe('ShapeProcessingService', () => {
  const service = new ShapeProcessingService()

  describe('processSVG', () => {
    it('should process valid SVG content', () => {
      const svgContent = `
        <svg viewBox="0 0 100 100" width="100" height="100">
          <circle cx="50" cy="50" r="40" fill="#000000"/>
        </svg>
      `
      const buffer = Buffer.from(svgContent, 'utf-8')

      const result = service.processSVG(buffer)

      expect(result.svgContent).toBeDefined()
      expect(result.svgContent).toContain('<svg')
      expect(result.viewBox).toBe('0 0 100 100')
      expect(result.width).toBe(100)
      expect(result.height).toBe(100)
    })

    it('should extract viewBox from SVG', () => {
      const svgContent = '<svg viewBox="0 0 200 150"><rect/></svg>'
      const buffer = Buffer.from(svgContent, 'utf-8')

      const result = service.processSVG(buffer)

      expect(result.viewBox).toBe('0 0 200 150')
    })

    it('should extract width and height from attributes', () => {
      const svgContent = '<svg width="300" height="200"><circle/></svg>'
      const buffer = Buffer.from(svgContent, 'utf-8')

      const result = service.processSVG(buffer)

      expect(result.width).toBe(300)
      expect(result.height).toBe(200)
    })

    it('should throw error for invalid SVG', () => {
      const invalidContent = 'This is not an SVG'
      const buffer = Buffer.from(invalidContent, 'utf-8')

      expect(() => service.processSVG(buffer)).toThrow('Invalid SVG file format')
    })

    it('should throw error for file size exceeding limit', () => {
      const largeContent = `<svg>${'x'.repeat(6 * 1024 * 1024)}</svg>`
      const buffer = Buffer.from(largeContent, 'utf-8')

      expect(() => service.processSVG(buffer)).toThrow('SVG file size exceeds')
    })

    it('should sanitize SVG by removing script tags', () => {
      const maliciousSvg = `
        <svg>
          <script>alert('XSS')</script>
          <circle cx="50" cy="50" r="40"/>
        </svg>
      `
      const buffer = Buffer.from(maliciousSvg, 'utf-8')

      const result = service.processSVG(buffer)

      expect(result.svgContent).not.toContain('<script>')
      expect(result.svgContent).toContain('<circle')
    })

    it('should sanitize SVG by removing event handlers', () => {
      const maliciousSvg = `
        <svg>
          <circle onclick="alert('XSS')" cx="50" cy="50" r="40"/>
        </svg>
      `
      const buffer = Buffer.from(maliciousSvg, 'utf-8')

      const result = service.processSVG(buffer)

      expect(result.svgContent).not.toContain('onclick')
    })

    it('should sanitize SVG by removing javascript: URLs', () => {
      const maliciousSvg = `
        <svg>
          <a href="javascript:alert('XSS')">
            <circle cx="50" cy="50" r="40"/>
          </a>
        </svg>
      `
      const buffer = Buffer.from(maliciousSvg, 'utf-8')

      const result = service.processSVG(buffer)

      expect(result.svgContent).not.toContain('javascript:')
    })
  })

  describe('extractPathData', () => {
    it('should extract path data from SVG', () => {
      const svgContent = `
        <svg>
          <path d="M10 10 L90 90"/>
          <path d="M20 20 C 20 100, 100 100, 100 20"/>
        </svg>
      `

      const paths = service.extractPathData(svgContent)

      expect(paths).toHaveLength(2)
      expect(paths[0]).toBe('M10 10 L90 90')
      expect(paths[1]).toBe('M20 20 C 20 100, 100 100, 100 20')
    })

    it('should return empty array if no paths found', () => {
      const svgContent = '<svg><circle cx="50" cy="50" r="40"/></svg>'

      const paths = service.extractPathData(svgContent)

      expect(paths).toHaveLength(0)
    })
  })

  describe('validateDimensions', () => {
    it('should validate valid dimensions', () => {
      const result = service.validateDimensions(100, 200)

      expect(result.width).toBe(100)
      expect(result.height).toBe(200)
    })

    it('should accept undefined dimensions', () => {
      const result = service.validateDimensions(undefined, undefined)

      expect(result.width).toBe(0)
      expect(result.height).toBe(0)
    })

    it('should throw error for width exceeding max dimension', () => {
      expect(() => service.validateDimensions(15000, 100)).toThrow('Width exceeds maximum dimension')
    })

    it('should throw error for height exceeding max dimension', () => {
      expect(() => service.validateDimensions(100, 15000)).toThrow('Height exceeds maximum dimension')
    })
  })

  describe('generateThumbnail', () => {
    it('should generate thumbnail from valid SVG', async () => {
      const svgContent = `
        <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="50" r="40" fill="#FF0000"/>
        </svg>
      `
      const buffer = Buffer.from(svgContent, 'utf-8')

      const thumbnail = await service.generateThumbnail(buffer, {
        thumbnailSize: 200
      })

      expect(thumbnail).toBeInstanceOf(Buffer)
      expect(thumbnail.length).toBeGreaterThan(0)
    })

    it('should throw error for invalid SVG', async () => {
      const invalidContent = 'Not an SVG'
      const buffer = Buffer.from(invalidContent, 'utf-8')

      await expect(service.generateThumbnail(buffer)).rejects.toThrow()
    })
  })
})
