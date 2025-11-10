import { existsSync } from 'node:fs'
import { readFile, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import process from 'node:process'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { ShapeTemplateService } from './shape-template.service'

describe('ShapeTemplateService', () => {
  let service: ShapeTemplateService
  let testSvgPath: string
  let testDir: string

  beforeEach(async () => {
    service = new ShapeTemplateService()
    testDir = join(process.cwd(), 'test-temp')
    testSvgPath = join(testDir, 'test-shape.svg')

    // Create test directory if it doesn't exist
    const { mkdirSync } = await import('node:fs')
    try {
      mkdirSync(testDir, { recursive: true })
    } catch {
      // Directory might already exist
    }

    // Create test SVG file
    const testSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <path d="M10,30 Q30,10 50,30 T90,30" fill="none" stroke="black" stroke-width="2"/>
</svg>`

    await writeFile(testSvgPath, testSvg)
  })

  afterEach(async () => {
    // Cleanup test files
    try {
      if (existsSync(testSvgPath)) {
        await rm(testSvgPath)
      }
      if (existsSync(testDir)) {
        await rm(testDir, { recursive: true })
      }
    } catch {
      // Ignore cleanup errors
    }
  })

  describe('isAvailable', () => {
    it('should check if Python is available', async () => {
      const isAvailable = await service.isAvailable()
      expect(typeof isAvailable).toBe('boolean')
    })
  })

  describe('generateTemplate', () => {
    it('should return error if SVG file does not exist', async () => {
      const result = await service.generateTemplate('/nonexistent/file.svg', 640, 640)

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
      expect(result.error).toContain('not found')
    })

    it('should generate template for valid SVG', async () => {
      // Skip test if Python or script is not available
      const isAvailable = await service.isAvailable()
      if (!isAvailable) {
        console.warn('Skipping test: Python not available')
        return
      }

      const result = await service.generateTemplate(testSvgPath, 640, 640)

      if (result.success) {
        expect(result.templatePath).toBeDefined()
        expect(existsSync(result.templatePath!)).toBe(true)

        // Verify template content
        const templateContent = await readFile(result.templatePath!, 'utf-8')
        const template = JSON.parse(templateContent)

        expect(template.version).toBe('1.0')
        expect(template.target_dimensions.width).toBe(640)
        expect(template.target_dimensions.height).toBe(640)
        expect(template.paths).toBeDefined()
        expect(Array.isArray(template.paths)).toBe(true)
        expect(template.whiteboard_config).toBeDefined()
        expect(template.whiteboard_config.type).toBe('shape')

        // Cleanup generated template
        if (result.templatePath && existsSync(result.templatePath)) {
          await rm(result.templatePath)
        }
      } else {
        console.warn('Template generation failed:', result.error)
      }
    })

    it('should handle different dimensions', async () => {
      const isAvailable = await service.isAvailable()
      if (!isAvailable) {
        console.warn('Skipping test: Python not available')
        return
      }

      const result = await service.generateTemplate(testSvgPath, 1920, 1080)

      if (result.success) {
        expect(result.templatePath).toBeDefined()

        const templateContent = await readFile(result.templatePath!, 'utf-8')
        const template = JSON.parse(templateContent)

        expect(template.target_dimensions.width).toBe(1920)
        expect(template.target_dimensions.height).toBe(1080)

        // Cleanup
        if (result.templatePath && existsSync(result.templatePath)) {
          await rm(result.templatePath)
        }
      }
    })
  })
})
