import { randomUUID } from 'node:crypto'
import { and, desc, eq, sql } from 'drizzle-orm'
import type { Export } from '@/domain/models/export.model'
import type { ExportRepositoryInterface } from '@/domain/repositories/export.repository.interface'
import { db } from '../database/db'
import { exports } from '../database/schema'

export class ExportRepository implements ExportRepositoryInterface {
  async findById(id: string): Promise<Export | null> {
    const result = await db.query.exports.findFirst({
      where: eq(exports.id, id)
    })

    if (!result) return null

    return this.mapToExport(result)
  }

  async findAll(params: {
    userId: string
    skip?: number
    limit?: number
    status?: string
    projectId?: string
  }): Promise<{ exports: Export[]; total: number }> {
    const { userId, skip = 0, limit = 20, status, projectId } = params

    const conditions = [eq(exports.userId, userId)]

    if (status) {
      conditions.push(eq(exports.status, status))
    }

    if (projectId) {
      conditions.push(eq(exports.projectId, projectId))
    }

    const [countResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(exports)
      .where(and(...conditions))

    const total = Number(countResult?.count ?? 0)

    const results = await db
      .select()
      .from(exports)
      .where(and(...conditions))
      .orderBy(desc(exports.createdAt))
      .limit(limit)
      .offset(skip)

    return {
      exports: results.map(this.mapToExport),
      total
    }
  }

  async create(data: Omit<Export, 'id' | 'createdAt' | 'completedAt' | 'progress' | 'status'>): Promise<Export> {
    const now = new Date()
    const [result] = await db
      .insert(exports)
      .values({
        id: randomUUID(),
        ...data,
        status: 'queued',
        progress: 0,
        createdAt: now
      })
      .returning()

    return this.mapToExport(result)
  }

  async update(
    id: string,
    data: Partial<Omit<Export, 'id' | 'createdAt' | 'completedAt' | 'userId' | 'projectId' | 'sceneId'>>
  ): Promise<Export> {
    const updateData: any = { ...data }

    // If status is completed, set completedAt
    if (data.status === 'completed') {
      updateData.completedAt = new Date()
    }

    const [result] = await db.update(exports).set(updateData).where(eq(exports.id, id)).returning()

    return this.mapToExport(result)
  }

  async delete(id: string): Promise<boolean> {
    const result = await db.delete(exports).where(eq(exports.id, id)).returning()

    return result.length > 0
  }

  async updateProgress(id: string, progress: number, currentStep?: string): Promise<void> {
    await db
      .update(exports)
      .set({
        progress,
        currentStep: currentStep ?? undefined
      })
      .where(eq(exports.id, id))
  }

  async updateStatus(id: string, status: string, videoUrl?: string, error?: string): Promise<void> {
    const updateData: any = { status }

    if (videoUrl) {
      updateData.videoUrl = videoUrl
    }

    if (error) {
      updateData.error = error
    }

    if (status === 'completed') {
      updateData.completedAt = new Date()
      updateData.progress = 100
    }

    await db.update(exports).set(updateData).where(eq(exports.id, id))
  }

  async setVideoUrl(id: string, videoUrl: string): Promise<Export> {
    const [result] = await db
      .update(exports)
      .set({
        videoUrl,
        status: 'completed',
        progress: 100,
        completedAt: new Date()
      })
      .where(eq(exports.id, id))
      .returning()

    return this.mapToExport(result)
  }

  async getStats(userId: string): Promise<{
    totalExports: number
    completedExports: number
    failedExports: number
    processingExports: number
  }> {
    const [stats] = await db
      .select({
        total: sql<number>`count(*)::int`,
        completed: sql<number>`count(*) filter (where ${exports.status} = 'completed')::int`,
        failed: sql<number>`count(*) filter (where ${exports.status} = 'failed')::int`,
        processing: sql<number>`count(*) filter (where ${exports.status} = 'processing' or ${exports.status} = 'queued')::int`
      })
      .from(exports)
      .where(eq(exports.userId, userId))

    return {
      totalExports: Number(stats?.total ?? 0),
      completedExports: Number(stats?.completed ?? 0),
      failedExports: Number(stats?.failed ?? 0),
      processingExports: Number(stats?.processing ?? 0)
    }
  }

  private mapToExport(data: any): Export {
    return {
      id: data.id,
      projectId: data.projectId ?? undefined,
      sceneId: data.sceneId ?? undefined,
      userId: data.userId,
      format: data.format,
      quality: data.quality,
      resolution: data.resolution,
      fps: data.fps ?? undefined,
      status: data.status,
      progress: data.progress,
      currentStep: data.currentStep ?? undefined,
      videoUrl: data.videoUrl ?? undefined,
      error: data.error ?? undefined,
      estimatedDuration: data.estimatedDuration ?? undefined,
      watermark: data.watermark ?? undefined,
      createdAt: data.createdAt,
      completedAt: data.completedAt ?? undefined
    }
  }
}
