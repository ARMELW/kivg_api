import type { Asset } from '../models/asset.model'

export interface AssetRepositoryInterface {
  findById: (id: string) => Promise<Asset | null>
  findAll: (params: {
    userId: string
    skip?: number
    limit?: number
    filter?: string
    category?: string
    tags?: string[]
    sortBy?: 'name' | 'uploadDate' | 'size' | 'usageCount'
    sortOrder?: 'asc' | 'desc'
  }) => Promise<{ assets: Asset[]; total: number }>
  create: (data: Omit<Asset, 'id' | 'uploadedAt' | 'updatedAt' | 'usageCount'>) => Promise<Asset>
  update: (id: string, data: Partial<Omit<Asset, 'id' | 'uploadedAt' | 'updatedAt' | 'userId'>>) => Promise<Asset>
  delete: (id: string) => Promise<boolean>
  incrementUsageCount: (id: string) => Promise<void>
  getStats: (userId: string) => Promise<{
    totalAssets: number
    totalSize: number
    assetsByCategory: Record<string, number>
  }>
}
