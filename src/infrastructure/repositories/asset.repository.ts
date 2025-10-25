import { randomUUID } from 'node:crypto'
import { and, asc, desc, eq, ilike, sql } from 'drizzle-orm'
import type { Asset } from '@/domain/models/asset.model'
import type { AssetRepositoryInterface } from '@/domain/repositories/asset.repository.interface'
import { db } from '../database/db'
import { assets } from '../database/schema'

export class AssetRepository implements AssetRepositoryInterface {
  async findById(id: string): Promise<Asset | null> {
    const result = await db.query.assets.findFirst({
      where: eq(assets.id, id)
    })

    if (!result) return null

    return this.mapToAsset(result)
  }

  async findAll(params: {
    userId: string
    skip?: number
    limit?: number
    filter?: string
    category?: string
    tags?: string[]
    sortBy?: 'name' | 'uploadDate' | 'size' | 'usageCount'
    sortOrder?: 'asc' | 'desc'
  }): Promise<{ assets: Asset[]; total: number }> {
    const { userId, skip = 0, limit = 20, filter, category, tags, sortBy = 'uploadDate', sortOrder = 'desc' } = params

    // Build where conditions
    const conditions = [eq(assets.userId, userId)]

    if (filter) {
      conditions.push(ilike(assets.name, `%${filter}%`))
    }

    if (category) {
      conditions.push(eq(assets.category, category))
    }

    if (tags && tags.length > 0) {
      // Filter by tags using JSONB contains
      conditions.push(sql`${assets.tags} @> ${JSON.stringify(tags)}::jsonb`)
    }

    // Build order by
    const orderColumn = {
      name: assets.name,
      uploadDate: assets.uploadedAt,
      size: assets.size,
      usageCount: assets.usageCount
    }[sortBy]

    const orderFn = sortOrder === 'asc' ? asc : desc

    // Get total count
    const [countResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(assets)
      .where(and(...conditions))

    const total = Number(countResult?.count ?? 0)

    // Get assets
    const results = await db
      .select()
      .from(assets)
      .where(and(...conditions))
      .orderBy(orderFn(orderColumn))
      .limit(limit)
      .offset(skip)

    return {
      assets: results.map(this.mapToAsset),
      total
    }
  }

  async create(data: Omit<Asset, 'id' | 'uploadedAt' | 'updatedAt' | 'usageCount'>): Promise<Asset> {
    const now = new Date()
    const [result] = await db
      .insert(assets)
      .values({
        id: randomUUID(),
        ...data,
        usageCount: 0,
        uploadedAt: now,
        updatedAt: now
      })
      .returning()

    return this.mapToAsset(result)
  }

  async update(id: string, data: Partial<Omit<Asset, 'id' | 'uploadedAt' | 'updatedAt' | 'userId'>>): Promise<Asset> {
    const [result] = await db
      .update(assets)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(eq(assets.id, id))
      .returning()

    return this.mapToAsset(result)
  }

  async delete(id: string): Promise<boolean> {
    const result = await db.delete(assets).where(eq(assets.id, id)).returning()

    return result.length > 0
  }

  async incrementUsageCount(id: string): Promise<void> {
    await db
      .update(assets)
      .set({
        usageCount: sql`${assets.usageCount} + 1`,
        lastUsed: new Date()
      })
      .where(eq(assets.id, id))
  }

  async getStats(userId: string): Promise<{
    totalAssets: number
    totalSize: number
    assetsByCategory: Record<string, number>
  }> {
    // Get total count and size
    const [totals] = await db
      .select({
        count: sql<number>`count(*)::int`,
        size: sql<number>`coalesce(sum(${assets.size}), 0)::int`
      })
      .from(assets)
      .where(eq(assets.userId, userId))

    // Get counts by category
    const categoryResults = await db
      .select({
        category: assets.category,
        count: sql<number>`count(*)::int`
      })
      .from(assets)
      .where(eq(assets.userId, userId))
      .groupBy(assets.category)

    const assetsByCategory: Record<string, number> = {}
    for (const row of categoryResults) {
      assetsByCategory[row.category] = Number(row.count)
    }

    return {
      totalAssets: Number(totals?.count ?? 0),
      totalSize: Number(totals?.size ?? 0),
      assetsByCategory
    }
  }

  private mapToAsset(data: any): Asset {
    return {
      id: data.id,
      userId: data.userId,
      name: data.name,
      url: data.url,
      thumbnailUrl: data.thumbnailUrl ?? undefined,
      type: data.type,
      size: data.size,
      width: data.width ?? undefined,
      height: data.height ?? undefined,
      tags: data.tags || [],
      category: data.category,
      lastUsed: data.lastUsed ?? undefined,
      usageCount: data.usageCount,
      metadata: data.metadata ?? undefined,
      uploadedAt: data.uploadedAt,
      updatedAt: data.updatedAt
    }
  }
}
