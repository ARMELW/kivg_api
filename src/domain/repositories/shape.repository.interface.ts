import type { ShapeAsset } from '../models/shape.model'

export interface ShapeRepositoryInterface {
  findById: (id: string) => Promise<ShapeAsset | null>
  findAll: (params: {
    userId: string
    skip?: number
    limit?: number
    filter?: string
    category?: string
    tags?: string[]
    sortBy?: 'name' | 'uploadDate' | 'size' | 'usageCount'
    sortOrder?: 'asc' | 'desc'
  }) => Promise<{ shapes: ShapeAsset[]; total: number }>
  create: (data: Omit<ShapeAsset, 'id' | 'uploadedAt' | 'updatedAt'>) => Promise<ShapeAsset>
  update: (
    id: string,
    data: Partial<Omit<ShapeAsset, 'id' | 'userId' | 'uploadedAt' | 'updatedAt'>>
  ) => Promise<ShapeAsset>
  delete: (id: string) => Promise<boolean>
  getStats: (userId: string) => Promise<{
    totalShapes: number
    totalSize: number
    totalSizeMB: string
    shapesByCategory: Record<string, number>
    mostUsedShapes?: ShapeAsset[]
    recentlyUploaded?: ShapeAsset[]
  }>
  incrementUsageCount: (id: string) => Promise<void>
}
