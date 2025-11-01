import { beforeEach, describe, expect, it } from 'vitest'
import type { ShapeAsset } from '@/domain/models/shape.model'
import { ShapeRepository } from './shape.repository'

describe('ShapeRepository', () => {
  let repository: ShapeRepository
  let testUserId: string
  let testShape: ShapeAsset

  beforeEach(() => {
    repository = new ShapeRepository()
    testUserId = 'test-user-id'
  })

  describe('create', () => {
    it('should create a shape with required fields', async () => {
      const shapeData = {
        userId: testUserId,
        name: 'Test Circle',
        url: 'https://storage.example.com/shapes/circle.svg',
        thumbnailUrl: 'https://storage.example.com/shapes/thumbnails/circle.png',
        type: 'svg' as const,
        size: 1024,
        width: 100,
        height: 100,
        tags: ['geometric', 'basic'],
        category: 'basic' as const,
        shapeData: {
          svgContent: '<svg><circle r="50"/></svg>',
          viewBox: '0 0 100 100',
          fill: '#000000',
          stroke: '#000000',
          strokeWidth: 1,
          isEditable: true
        },
        usageCount: 0
      }

      const result = await repository.create(shapeData)

      expect(result.id).toBeDefined()
      expect(result.name).toBe('Test Circle')
      expect(result.userId).toBe(testUserId)
      expect(result.type).toBe('svg')
      expect(result.tags).toEqual(['geometric', 'basic'])
      expect(result.uploadedAt).toBeInstanceOf(Date)
      expect(result.updatedAt).toBeInstanceOf(Date)

      testShape = result
    })
  })

  describe('findById', () => {
    it('should return shape by id', async () => {
      if (!testShape) {
        // Create a test shape first
        const shapeData = {
          userId: testUserId,
          name: 'Test Shape',
          url: 'https://storage.example.com/shapes/test.svg',
          type: 'svg' as const,
          size: 512,
          tags: [],
          category: 'other' as const,
          usageCount: 0
        }
        testShape = await repository.create(shapeData)
      }

      const result = await repository.findById(testShape.id)

      expect(result).toBeDefined()
      expect(result?.id).toBe(testShape.id)
      expect(result?.name).toBe(testShape.name)
    })

    it('should return null for non-existent shape', async () => {
      const result = await repository.findById('non-existent-id')
      expect(result).toBeNull()
    })
  })

  describe('findAll', () => {
    it('should return paginated shapes', async () => {
      const result = await repository.findAll({
        userId: testUserId,
        skip: 0,
        limit: 20
      })

      expect(result).toBeDefined()
      expect(result.shapes).toBeInstanceOf(Array)
      expect(result.total).toBeGreaterThanOrEqual(0)
    })

    it('should filter by category', async () => {
      const result = await repository.findAll({
        userId: testUserId,
        category: 'basic',
        skip: 0,
        limit: 20
      })

      expect(result).toBeDefined()
      result.shapes.forEach((shape) => {
        expect(shape.category).toBe('basic')
      })
    })

    it('should sort by name', async () => {
      const result = await repository.findAll({
        userId: testUserId,
        sortBy: 'name',
        sortOrder: 'asc',
        skip: 0,
        limit: 20
      })

      expect(result).toBeDefined()
      // Verify sorting if multiple shapes exist
      if (result.shapes.length > 1) {
        for (let i = 1; i < result.shapes.length; i++) {
          expect(result.shapes[i].name >= result.shapes[i - 1].name).toBe(true)
        }
      }
    })
  })

  describe('update', () => {
    it('should update shape metadata', async () => {
      if (!testShape) {
        const shapeData = {
          userId: testUserId,
          name: 'Original Name',
          url: 'https://storage.example.com/shapes/test.svg',
          type: 'svg' as const,
          size: 512,
          tags: [],
          category: 'other' as const,
          usageCount: 0
        }
        testShape = await repository.create(shapeData)
      }

      const updates = {
        name: 'Updated Name',
        tags: ['new-tag'],
        category: 'icon' as const
      }

      const result = await repository.update(testShape.id, updates)

      expect(result.name).toBe('Updated Name')
      expect(result.tags).toEqual(['new-tag'])
      expect(result.category).toBe('icon')
    })
  })

  describe('delete', () => {
    it('should delete a shape', async () => {
      // Create a shape to delete
      const shapeData = {
        userId: testUserId,
        name: 'To Delete',
        url: 'https://storage.example.com/shapes/delete.svg',
        type: 'svg' as const,
        size: 256,
        tags: [],
        category: 'other' as const,
        usageCount: 0
      }
      const shape = await repository.create(shapeData)

      const result = await repository.delete(shape.id)
      expect(result).toBe(true)

      // Verify it's deleted
      const deleted = await repository.findById(shape.id)
      expect(deleted).toBeNull()
    })
  })

  describe('getStats', () => {
    it('should return shape statistics', async () => {
      const stats = await repository.getStats(testUserId)

      expect(stats).toBeDefined()
      expect(stats.totalShapes).toBeGreaterThanOrEqual(0)
      expect(stats.totalSize).toBeGreaterThanOrEqual(0)
      expect(stats.totalSizeMB).toBeDefined()
      expect(stats.shapesByCategory).toBeDefined()
      expect(typeof stats.shapesByCategory).toBe('object')
    })
  })

  describe('incrementUsageCount', () => {
    it('should increment usage count', async () => {
      if (!testShape) {
        const shapeData = {
          userId: testUserId,
          name: 'Usage Test',
          url: 'https://storage.example.com/shapes/usage.svg',
          type: 'svg' as const,
          size: 512,
          tags: [],
          category: 'other' as const,
          usageCount: 0
        }
        testShape = await repository.create(shapeData)
      }

      const initialCount = testShape.usageCount

      await repository.incrementUsageCount(testShape.id)

      const updated = await repository.findById(testShape.id)
      expect(updated?.usageCount).toBe(initialCount + 1)
      expect(updated?.lastUsed).toBeInstanceOf(Date)
    })
  })
})
