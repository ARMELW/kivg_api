import { randomUUID } from 'node:crypto'
import { and, asc, desc, eq, ilike, sql } from 'drizzle-orm'
import type { ShapeAsset } from '@/domain/models/shape.model'
import type { ShapeRepositoryInterface } from '@/domain/repositories/shape.repository.interface'
import { db } from '../database/db'
import { shapes } from '../database/schema'

export class ShapeRepository implements ShapeRepositoryInterface {
  async findById(id: string): Promise<ShapeAsset | null> {
    const result = await db.query.shapes.findFirst({
      where: eq(shapes.id, id)
    })

    if (!result) return null

    return this.mapToShape(result)
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
  }): Promise<{ shapes: ShapeAsset[]; total: number }> {
    const { userId, skip = 0, limit = 20, filter, category, tags, sortBy = 'uploadDate', sortOrder = 'desc' } = params

    // Build where conditions
    const conditions = [eq(shapes.userId, userId)]

    if (filter) {
      conditions.push(ilike(shapes.name, `%${filter}%`))
    }

    if (category) {
      conditions.push(eq(shapes.category, category))
    }

    if (tags && tags.length > 0) {
      // Filter by tags using JSONB contains
      conditions.push(sql`${shapes.tags} @> ${JSON.stringify(tags)}::jsonb`)
    }

    // Build order by
    const orderColumn = {
      name: shapes.name,
      uploadDate: shapes.uploadedAt,
      size: shapes.size,
      usageCount: shapes.usageCount
    }[sortBy]

    const orderDirection = sortOrder === 'asc' ? asc : desc

    const results = await db.query.shapes.findMany({
      where: and(...conditions),
      orderBy: orderDirection(orderColumn),
      limit,
      offset: skip
    })

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(shapes)
      .where(and(...conditions))

    return {
      shapes: results.map((r) => this.mapToShape(r)),
      total: count
    }
  }

  async create(data: Omit<ShapeAsset, 'id' | 'uploadedAt' | 'updatedAt'>): Promise<ShapeAsset> {
    const id = randomUUID()
    const now = new Date()

    await db.insert(shapes).values({
      id,
      userId: data.userId,
      name: data.name,
      url: data.url,
      thumbnailUrl: data.thumbnailUrl,
      type: data.type,
      size: data.size,
      // Ensure width/height are integers to match DB schema (avoid inserting floats)
      width: data.width !== undefined && data.width !== null ? Math.round(data.width) : undefined,
      height: data.height !== undefined && data.height !== null ? Math.round(data.height) : undefined,
      tags: data.tags,
      category: data.category,
      shapeData: data.shapeData,
      templateJsonPath: data.templateJsonPath,
      lastUsed: data.lastUsed,
      usageCount: data.usageCount,
      uploadedAt: now,
      updatedAt: now
    })

    const created = await this.findById(id)
    if (!created) throw new Error('Failed to create shape')

    return created
  }

  async update(
    id: string,
    data: Partial<Omit<ShapeAsset, 'id' | 'userId' | 'uploadedAt' | 'updatedAt'>>
  ): Promise<ShapeAsset> {
    // Normalize numeric fields to match DB column types
    const normalized: any = { ...data }
    if (normalized.width !== undefined && normalized.width !== null) {
      normalized.width = Math.round(normalized.width)
    }
    if (normalized.height !== undefined && normalized.height !== null) {
      normalized.height = Math.round(normalized.height)
    }

    await db
      .update(shapes)
      .set({
        ...normalized,
        updatedAt: new Date()
      })
      .where(eq(shapes.id, id))

    const updated = await this.findById(id)
    if (!updated) throw new Error('Failed to update shape')

    return updated
  }

  async delete(id: string): Promise<boolean> {
    await db.delete(shapes).where(eq(shapes.id, id))
    return true
  }

  async getStats(userId: string): Promise<{
    totalShapes: number
    totalSize: number
    totalSizeMB: string
    shapesByCategory: Record<string, number>
    mostUsedShapes?: ShapeAsset[]
    recentlyUploaded?: ShapeAsset[]
  }> {
    // Get total count and size
    const [totals] = await db
      .select({
        count: sql<number>`count(*)::int`,
        totalSize: sql<number>`coalesce(sum(${shapes.size}), 0)::int`
      })
      .from(shapes)
      .where(eq(shapes.userId, userId))

    // Get shapes by category
    const categoryResults = await db
      .select({
        category: shapes.category,
        count: sql<number>`count(*)::int`
      })
      .from(shapes)
      .where(eq(shapes.userId, userId))
      .groupBy(shapes.category)

    const shapesByCategory: Record<string, number> = {}
    for (const row of categoryResults) {
      shapesByCategory[row.category] = row.count
    }

    // Get most used shapes
    const mostUsed = await db.query.shapes.findMany({
      where: eq(shapes.userId, userId),
      orderBy: desc(shapes.usageCount),
      limit: 5
    })

    // Get recently uploaded shapes
    const recent = await db.query.shapes.findMany({
      where: eq(shapes.userId, userId),
      orderBy: desc(shapes.uploadedAt),
      limit: 5
    })

    return {
      totalShapes: totals.count,
      totalSize: totals.totalSize,
      totalSizeMB: (totals.totalSize / 1024 / 1024).toFixed(2),
      shapesByCategory,
      mostUsedShapes: mostUsed.map((s) => this.mapToShape(s)),
      recentlyUploaded: recent.map((s) => this.mapToShape(s))
    }
  }

  async incrementUsageCount(id: string): Promise<void> {
    await db
      .update(shapes)
      .set({
        usageCount: sql`${shapes.usageCount} + 1`,
        lastUsed: new Date()
      })
      .where(eq(shapes.id, id))
  }

  private mapToShape(data: any): ShapeAsset {
    return {
      id: data.id,
      userId: data.userId,
      name: data.name,
      url: data.url,
      thumbnailUrl: data.thumbnailUrl || undefined,
      type: data.type,
      size: data.size,
      width: data.width || undefined,
      height: data.height || undefined,
      tags: Array.isArray(data.tags) ? data.tags : [],
      category: data.category,
      shapeData: data.shapeData || undefined,
      templateJsonPath: data.templateJsonPath || undefined,
      lastUsed: data.lastUsed || undefined,
      usageCount: data.usageCount,
      uploadedAt: data.uploadedAt,
      updatedAt: data.updatedAt
    }
  }
}
