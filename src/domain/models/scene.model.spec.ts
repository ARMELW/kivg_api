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

    it('should reject layers with negative width or height', () => {
      const layerWithNegativeWidth = {
        id: 'layer-negative-width',
        name: 'Layer with Negative Width',
        type: 'shape' as const,
        mode: 'draw' as const,
        position: { x: 100, y: 200 },
        width: -100,
        height: 150,
        zIndex: 1,
        scale: 1,
        opacity: 1
      }

      const layerWithNegativeHeight = {
        id: 'layer-negative-height',
        name: 'Layer with Negative Height',
        type: 'shape' as const,
        mode: 'draw' as const,
        position: { x: 100, y: 200 },
        width: 100,
        height: -150,
        zIndex: 1,
        scale: 1,
        opacity: 1
      }

      expect(LayerSchema.safeParse(layerWithNegativeWidth).success).toBe(false)
      expect(LayerSchema.safeParse(layerWithNegativeHeight).success).toBe(false)
    })
  })

  describe('camera_position property', () => {
    it('should accept a layer with camera_position', () => {
      const layerWithCameraPosition = {
        id: 'layer-123',
        name: 'Test Layer',
        type: 'text' as const,
        mode: 'draw' as const,
        position: { x: 960, y: 540 },
        camera_position: { x: 960, y: 540 },
        width: 300,
        height: 57.6,
        zIndex: 1,
        scale: 1,
        opacity: 1
      }

      const result = LayerSchema.safeParse(layerWithCameraPosition)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.camera_position).toEqual({ x: 960, y: 540 })
      }
    })

    it('should accept a layer without camera_position (backward compatibility)', () => {
      const layerWithoutCameraPosition = {
        id: 'layer-456',
        name: 'Old Layer',
        type: 'image' as const,
        mode: 'static' as const,
        position: { x: 500, y: 300 },
        width: 1920,
        height: 1080,
        zIndex: 2,
        scale: 0.8,
        opacity: 0.9
      }

      const result = LayerSchema.safeParse(layerWithoutCameraPosition)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.camera_position).toBeUndefined()
      }
    })

    it('should accept camera_position with negative values (layer outside camera viewport)', () => {
      const layerOutsideViewport = {
        id: 'layer-789',
        name: 'Off-screen Layer',
        type: 'text' as const,
        mode: 'draw' as const,
        position: { x: 2500, y: 1500 },
        camera_position: { x: 2500, y: 1500 },
        width: 200,
        height: 50,
        zIndex: 1,
        scale: 1,
        opacity: 1
      }

      const result = LayerSchema.safeParse(layerOutsideViewport)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.camera_position).toEqual({ x: 2500, y: 1500 })
      }
    })

    it('should accept camera_position with decimal values', () => {
      const layerWithDecimalCameraPosition = {
        id: 'layer-decimal',
        name: 'Decimal Camera Position',
        type: 'image' as const,
        mode: 'draw' as const,
        position: { x: 100.5, y: 200.75 },
        camera_position: { x: 100.5, y: 200.75 },
        width: 300,
        height: 150,
        zIndex: 1,
        scale: 1,
        opacity: 1
      }

      const result = LayerSchema.safeParse(layerWithDecimalCameraPosition)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.camera_position).toEqual({ x: 100.5, y: 200.75 })
      }
    })

    it('should reject camera_position with invalid structure', () => {
      const layerWithInvalidCameraPosition = {
        id: 'layer-invalid',
        name: 'Invalid Camera Position',
        type: 'text' as const,
        mode: 'draw' as const,
        position: { x: 100, y: 200 },
        camera_position: { x: 'invalid', y: 200 }, // Invalid: x should be number
        width: 300,
        height: 150,
        zIndex: 1,
        scale: 1,
        opacity: 1
      }

      const result = LayerSchema.safeParse(layerWithInvalidCameraPosition)

      expect(result.success).toBe(false)
    })

    it('should reject camera_position missing x or y coordinate', () => {
      const layerMissingX = {
        id: 'layer-missing-x',
        name: 'Missing X',
        type: 'text' as const,
        mode: 'draw' as const,
        position: { x: 100, y: 200 },
        camera_position: { y: 200 }, // Missing x
        width: 300,
        height: 150,
        zIndex: 1,
        scale: 1,
        opacity: 1
      }

      const layerMissingY = {
        id: 'layer-missing-y',
        name: 'Missing Y',
        type: 'text' as const,
        mode: 'draw' as const,
        position: { x: 100, y: 200 },
        camera_position: { x: 100 }, // Missing y
        width: 300,
        height: 150,
        zIndex: 1,
        scale: 1,
        opacity: 1
      }

      expect(LayerSchema.safeParse(layerMissingX).success).toBe(false)
      expect(LayerSchema.safeParse(layerMissingY).success).toBe(false)
    })

    it('should work with different layer types', () => {
      const textLayer = {
        id: 'text-1',
        name: 'Text with Camera Position',
        type: 'text' as const,
        mode: 'draw' as const,
        position: { x: 960, y: 540 },
        camera_position: { x: 960, y: 540 },
        width: 300,
        height: 57.6,
        zIndex: 1,
        scale: 1,
        opacity: 1,
        text: 'Sample text'
      }

      const imageLayer = {
        id: 'image-1',
        name: 'Image with Camera Position',
        type: 'image' as const,
        mode: 'static' as const,
        position: { x: 700, y: 400 },
        camera_position: { x: 700, y: 400 },
        width: 1920,
        height: 1080,
        zIndex: 1,
        scale: 0.5,
        opacity: 1,
        imagePath: 'https://example.com/image.jpg'
      }

      const shapeLayer = {
        id: 'shape-1',
        name: 'Shape with Camera Position',
        type: 'shape' as const,
        mode: 'draw' as const,
        position: { x: 800, y: 450 },
        camera_position: { x: 800, y: 450 },
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
  })
})
