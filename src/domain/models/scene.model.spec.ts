import { describe, expect, it } from 'vitest'
import { LayerSchema } from './scene.model'

describe('LayerSchema', () => {
  describe('width and height properties', () => {
    it('should accept a layer with width and height properties', () => {
      const layerWithDimensions = {
        id: 'layer-123',
        name: 'Test Layer',
        type: 'text' as const,
        mode: 'draw' as const,
        position: { x: 100, y: 200 },
        width: 300,
        height: 150,
        zIndex: 1,
        scale: 1,
        opacity: 1
      }

      const result = LayerSchema.safeParse(layerWithDimensions)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.width).toBe(300)
        expect(result.data.height).toBe(150)
      }
    })

    it('should accept a layer without width and height properties (backward compatibility)', () => {
      const layerWithoutDimensions = {
        id: 'layer-456',
        name: 'Old Layer',
        type: 'image' as const,
        mode: 'static' as const,
        position: { x: 500, y: 300 },
        zIndex: 2,
        scale: 0.8,
        opacity: 0.9
      }

      const result = LayerSchema.safeParse(layerWithoutDimensions)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.width).toBeUndefined()
        expect(result.data.height).toBeUndefined()
      }
    })

    it('should accept different layer types with dimensions', () => {
      const textLayer = {
        id: 'text-1',
        name: 'Text',
        type: 'text' as const,
        mode: 'draw' as const,
        position: { x: 960, y: 540 },
        width: 300,
        height: 57.6,
        zIndex: 1,
        scale: 1,
        opacity: 1
      }

      const imageLayer = {
        id: 'image-1',
        name: 'Image',
        type: 'image' as const,
        mode: 'static' as const,
        position: { x: 700, y: 400 },
        width: 1920,
        height: 1080,
        zIndex: 1,
        scale: 0.5,
        opacity: 1
      }

      const shapeLayer = {
        id: 'shape-1',
        name: 'Rectangle',
        type: 'shape' as const,
        mode: 'draw' as const,
        position: { x: 800, y: 450 },
        width: 200,
        height: 150,
        zIndex: 1,
        scale: 1,
        opacity: 1
      }

      expect(LayerSchema.safeParse(textLayer).success).toBe(true)
      expect(LayerSchema.safeParse(imageLayer).success).toBe(true)
      expect(LayerSchema.safeParse(shapeLayer).success).toBe(true)
    })

    it('should reject invalid width/height values', () => {
      const invalidLayer = {
        id: 'layer-789',
        name: 'Invalid Layer',
        type: 'text' as const,
        mode: 'draw' as const,
        position: { x: 100, y: 200 },
        width: 'not-a-number', // Invalid: should be number
        height: 150,
        zIndex: 1,
        scale: 1,
        opacity: 1
      }

      const result = LayerSchema.safeParse(invalidLayer)

      expect(result.success).toBe(false)
    })
  })
})
