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

    it('should reject a layer without width and height properties', () => {
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

      expect(result.success).toBe(false)
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

    it('should reject a layer with only width (missing height)', () => {
      const layerMissingHeight = {
        id: 'layer-missing-height',
        name: 'Layer Missing Height',
        type: 'text' as const,
        mode: 'draw' as const,
        position: { x: 100, y: 200 },
        width: 300,
        zIndex: 1,
        scale: 1,
        opacity: 1
      }

      const result = LayerSchema.safeParse(layerMissingHeight)

      expect(result.success).toBe(false)
    })

    it('should reject a layer with only height (missing width)', () => {
      const layerMissingWidth = {
        id: 'layer-missing-width',
        name: 'Layer Missing Width',
        type: 'text' as const,
        mode: 'draw' as const,
        position: { x: 100, y: 200 },
        height: 150,
        zIndex: 1,
        scale: 1,
        opacity: 1
      }

      const result = LayerSchema.safeParse(layerMissingWidth)

      expect(result.success).toBe(false)
    })

    it('should accept layers with decimal width and height values', () => {
      const layerWithDecimals = {
        id: 'layer-decimals',
        name: 'Layer with Decimals',
        type: 'text' as const,
        mode: 'draw' as const,
        position: { x: 100.5, y: 200.5 },
        width: 300.75,
        height: 150.25,
        zIndex: 1,
        scale: 1,
        opacity: 1
      }

      const result = LayerSchema.safeParse(layerWithDecimals)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.width).toBe(300.75)
        expect(result.data.height).toBe(150.25)
      }
    })

    it('should accept layers with zero width and height', () => {
      const layerWithZeroDimensions = {
        id: 'layer-zero',
        name: 'Layer with Zero Dimensions',
        type: 'shape' as const,
        mode: 'draw' as const,
        position: { x: 100, y: 200 },
        width: 0,
        height: 0,
        zIndex: 1,
        scale: 1,
        opacity: 1
      }

      const result = LayerSchema.safeParse(layerWithZeroDimensions)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.width).toBe(0)
        expect(result.data.height).toBe(0)
      }
    })
  })
})
