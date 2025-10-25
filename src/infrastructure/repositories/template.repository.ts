import { randomUUID } from 'node:crypto'
import { and, asc, desc, eq, sql } from 'drizzle-orm'
import type { Template } from '@/domain/models/template.model'
import type { TemplateRepositoryInterface } from '@/domain/repositories/template.repository.interface'
import { db } from '../database/db'
import { templates } from '../database/schema'

export class TemplateRepository implements TemplateRepositoryInterface {
  async findById(id: string): Promise<Template | null> {
    const result = await db.query.templates.findFirst({
      where: eq(templates.id, id)
    })

    if (!result) return null

    return this.mapToTemplate(result)
  }

  async findAll(params: {
    skip?: number
    limit?: number
    type?: string
    style?: string
    tags?: string[]
    search?: string
    sortBy?: 'popularity' | 'rating' | 'createdAt'
    sortOrder?: 'asc' | 'desc'
  }): Promise<{ templates: Template[]; total: number }> {
    const { skip = 0, limit = 20, type, style, tags, search, sortBy = 'popularity', sortOrder = 'desc' } = params

    const conditions = []

    if (type) {
      conditions.push(eq(templates.type, type))
    }

    if (style) {
      conditions.push(eq(templates.style, style))
    }

    if (tags && tags.length > 0) {
      conditions.push(sql`${templates.tags} @> ${JSON.stringify(tags)}::jsonb`)
    }

    if (search) {
      conditions.push(sql`${templates.name} ilike ${`%${search}%`} or ${templates.description} ilike ${`%${search}%`}`)
    }

    const orderColumn = {
      popularity: templates.popularity,
      rating: sql`(${templates.rating}->>'average')::numeric`,
      createdAt: templates.createdAt
    }[sortBy]

    const orderFn = sortOrder === 'asc' ? asc : desc

    const [countResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(templates)
      .where(conditions.length > 0 ? and(...conditions) : undefined)

    const total = Number(countResult?.count ?? 0)

    const results = await db
      .select()
      .from(templates)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(orderFn(orderColumn))
      .limit(limit)
      .offset(skip)

    return {
      templates: results.map(this.mapToTemplate),
      total
    }
  }

  async create(data: Omit<Template, 'id' | 'createdAt' | 'updatedAt' | 'rating' | 'popularity'>): Promise<Template> {
    const now = new Date()

    // Prepare values with proper typing
    const values = {
      id: randomUUID(),
      name: data.name,
      description: data.description,
      type: data.type,
      style: data.style,
      tags: data.tags,
      thumbnail: data.thumbnail,
      previewAnimation: data.previewAnimation,
      metadata: data.metadata,
      sceneData: data.sceneData,
      version: data.version,
      createdAt: now,
      updatedAt: now
    }

    const [result] = await db.insert(templates).values(values).returning()

    return this.mapToTemplate(result)
  }

  async update(
    id: string,
    data: Partial<Omit<Template, 'id' | 'createdAt' | 'updatedAt' | 'rating' | 'popularity'>>
  ): Promise<Template> {
    const [result] = await db
      .update(templates)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(eq(templates.id, id))
      .returning()

    return this.mapToTemplate(result)
  }

  async delete(id: string): Promise<boolean> {
    const result = await db.delete(templates).where(eq(templates.id, id)).returning()

    return result.length > 0
  }

  async incrementPopularity(id: string): Promise<void> {
    await db
      .update(templates)
      .set({
        popularity: sql`${templates.popularity} + 1`,
        updatedAt: new Date()
      })
      .where(eq(templates.id, id))
  }

  async updateRating(id: string, newRating: number): Promise<Template> {
    // Get current rating
    const current = await this.findById(id)
    if (!current) {
      throw new Error('Template not found')
    }

    const currentRating = current.rating || { average: 0, count: 0 }
    const totalRating = currentRating.average * currentRating.count + newRating
    const newCount = currentRating.count + 1
    const newAverage = totalRating / newCount

    const [result] = await db
      .update(templates)
      .set({
        rating: { average: newAverage, count: newCount },
        updatedAt: new Date()
      })
      .where(eq(templates.id, id))
      .returning()

    return this.mapToTemplate(result)
  }

  async getPopular(limit = 10): Promise<Template[]> {
    const results = await db.select().from(templates).orderBy(desc(templates.popularity)).limit(limit)

    return results.map(this.mapToTemplate)
  }

  async getTopRated(limit = 10): Promise<Template[]> {
    const results = await db
      .select()
      .from(templates)
      .orderBy(desc(sql`(${templates.rating}->>'average')::numeric`))
      .limit(limit)

    return results.map(this.mapToTemplate)
  }

  async getByType(type: string, limit = 10): Promise<Template[]> {
    const results = await db
      .select()
      .from(templates)
      .where(eq(templates.type, type))
      .orderBy(desc(templates.popularity))
      .limit(limit)

    return results.map(this.mapToTemplate)
  }

  async getByStyle(style: string, limit = 10): Promise<Template[]> {
    const results = await db
      .select()
      .from(templates)
      .where(eq(templates.style, style))
      .orderBy(desc(templates.popularity))
      .limit(limit)

    return results.map(this.mapToTemplate)
  }

  private mapToTemplate(data: any): Template {
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      type: data.type,
      style: data.style,
      tags: data.tags || [],
      thumbnail: data.thumbnail ?? undefined,
      previewAnimation: data.previewAnimation ?? undefined,
      metadata: data.metadata ?? undefined,
      rating: data.rating || { average: 0, count: 0 },
      popularity: data.popularity,
      sceneData: data.sceneData,
      version: data.version,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt
    }
  }
}
