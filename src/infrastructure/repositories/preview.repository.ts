import { randomUUID } from 'node:crypto'
import { and, desc, eq, sql } from 'drizzle-orm'
import type { Preview } from '@/domain/models/preview.model'
import type { PreviewRepositoryInterface } from '@/domain/repositories/preview.repository.interface'
import { db } from '../database/db'
import { previews } from '../database/schema'

export class PreviewRepository implements PreviewRepositoryInterface {
  async findById(id: string): Promise<Preview | null> {
    const result = await db.query.previews.findFirst({
      where: eq(previews.id, id)
    })

    if (!result) return null

    return this.mapToPreview(result)
  }

  async findAll(params: {
    userId: string
    skip?: number
    limit?: number
    status?: string
    sceneId?: string
  }): Promise<{ previews: Preview[]; total: number }> {
    const { userId, skip = 0, limit = 20, status, sceneId } = params

    const conditions = [eq(previews.userId, userId)]

    if (status) {
      conditions.push(eq(previews.status, status))
    }

    if (sceneId) {
      conditions.push(eq(previews.sceneId, sceneId))
    }

    const [countResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(previews)
      .where(and(...conditions))

    const total = Number(countResult?.count ?? 0)

    const results = await db
      .select()
      .from(previews)
      .where(and(...conditions))
      .orderBy(desc(previews.createdAt))
      .limit(limit)
      .offset(skip)

    return {
      previews: results.map(this.mapToPreview),
      total
    }
  }

  async create(data: Omit<Preview, 'id' | 'createdAt' | 'completedAt' | 'progress' | 'status'>): Promise<Preview> {
    const now = new Date()
    const [result] = await db
      .insert(previews)
      .values({
        id: randomUUID(),
        ...data,
        status: 'queued',
        progress: 0,
        createdAt: now
      })
      .returning()

    return this.mapToPreview(result)
  }

  async update(
    id: string,
    data: Partial<Omit<Preview, 'id' | 'createdAt' | 'completedAt' | 'userId' | 'sceneId'>>
  ): Promise<Preview> {
    const updateData: any = { ...data }

    // If status is completed, set completedAt
    if (data.status === 'completed') {
      updateData.completedAt = new Date()
    }

    const [result] = await db.update(previews).set(updateData).where(eq(previews.id, id)).returning()

    return this.mapToPreview(result)
  }

  async delete(id: string): Promise<boolean> {
    const result = await db.delete(previews).where(eq(previews.id, id)).returning()

    return result.length > 0
  }

  async updateProgress(id: string, progress: number, currentStep?: string): Promise<void> {
    await db
      .update(previews)
      .set({
        progress,
        currentStep: currentStep ?? undefined
      })
      .where(eq(previews.id, id))
  }

  async updateStatus(id: string, status: string, previewUrl?: string, error?: string): Promise<void> {
    const updateData: any = { status }

    if (previewUrl) {
      updateData.previewUrl = previewUrl
    }

    if (error) {
      updateData.error = error
    }

    if (status === 'completed') {
      updateData.completedAt = new Date()
      updateData.progress = 100
    }

    await db.update(previews).set(updateData).where(eq(previews.id, id))
  }

  private mapToPreview(data: any): Preview {
    return {
      id: data.id,
      sceneId: data.sceneId,
      userId: data.userId,
      status: data.status,
      progress: data.progress,
      currentStep: data.currentStep ?? undefined,
      previewUrl: data.previewUrl ?? undefined,
      error: data.error ?? undefined,
      createdAt: data.createdAt,
      completedAt: data.completedAt ?? undefined
    }
  }
}
