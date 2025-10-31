import { randomUUID } from 'node:crypto'
import { and, asc, eq, ilike, sql } from 'drizzle-orm'
import type { Scene } from '@/domain/models/scene.model'
import type { SceneRepositoryInterface } from '@/domain/repositories/scene.repository.interface'
import { db } from '../database/db'
import { scenes } from '../database/schema'

export class SceneRepository implements SceneRepositoryInterface {
  async findById(id: string): Promise<Scene | null> {
    const result = await db.query.scenes.findFirst({
      where: eq(scenes.id, id)
    })

    if (!result) return null

    return this.mapToScene(result)
  }

  async findAll(params: {
    projectId?: string
    skip?: number
    limit?: number
    filter?: string
  }): Promise<{ scenes: Scene[]; total: number }> {
    const { projectId, skip = 0, limit = 100, filter } = params

    const conditions = []

    if (projectId) {
      conditions.push(eq(scenes.projectId, projectId))
    }

    if (filter) {
      conditions.push(ilike(scenes.title, `%${filter}%`))
    }

    const [countResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(scenes)
      .where(conditions.length > 0 ? and(...conditions) : undefined)

    const total = Number(countResult?.count ?? 0)

    const results = await db
      .select()
      .from(scenes)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(asc(scenes.createdAt))
      .limit(limit)
      .offset(skip)

    return {
      scenes: results.map(this.mapToScene),
      total
    }
  }

  async create(data: Omit<Scene, 'id' | 'createdAt' | 'updatedAt'>): Promise<Scene> {
    const now = new Date()
    const [result] = await db
      .insert(scenes)
      .values({
        id: randomUUID(),
        ...data,
        createdAt: now,
        updatedAt: now
      })
      .returning()

    return this.mapToScene(result)
  }

  async update(id: string, data: Partial<Omit<Scene, 'id' | 'createdAt' | 'updatedAt' | 'projectId'>>): Promise<Scene> {
    // Sanitize date fields
    const patch: any = { ...data }
    if ('updatedAt' in patch && typeof patch.updatedAt === 'string') {
      patch.updatedAt = new Date(patch.updatedAt)
    }
    if ('createdAt' in patch && typeof patch.createdAt === 'string') {
      patch.createdAt = new Date(patch.createdAt)
    }
    patch.updatedAt = patch.updatedAt ?? new Date()
    const [result] = await db.update(scenes).set(patch).where(eq(scenes.id, id)).returning()

    return this.mapToScene(result)
  }

  async delete(id: string): Promise<boolean> {
    const result = await db.delete(scenes).where(eq(scenes.id, id)).returning()

    return result.length > 0
  }

  async duplicate(id: string): Promise<Scene> {
    const original = await this.findById(id)
    if (!original) {
      throw new Error('Scene not found')
    }

    const now = new Date()
    const [duplicated] = await db
      .insert(scenes)
      .values({
        id: randomUUID(),
        projectId: original.projectId,
        title: `${original.title} (Copy)`,
        content: original.content,
        duration: original.duration,
        animation: original.animation,
        backgroundImage: original.backgroundImage,
        sceneImage: original.sceneImage,
        layers: original.layers as any,
        cameras: original.cameras as any,
        sceneCameras: original.sceneCameras as any,
        multiTimeline: original.multiTimeline as any,
        audio: original.audio as any,
        sceneAudio: original.sceneAudio as any,
        transitionType: original.transitionType,
        draggingSpeed: original.draggingSpeed,
        slideDuration: original.slideDuration,
        syncSlideWithVoice: original.syncSlideWithVoice,
        createdAt: now,
        updatedAt: now
      })
      .returning()

    return this.mapToScene(duplicated)
  }

  async reorder(projectId: string, sceneIds: string[]): Promise<boolean> {
    try {
      // NOTE: This implementation updates timestamps to mark scenes as changed,
      // but doesn't implement actual position-based ordering as the schema
      // doesn't have an 'order' or 'position' column.
      // For full reordering support, add a migration to add a 'position' integer column
      // and update this method to set position values based on the sceneIds array order.
      // Example migration:
      //   ALTER TABLE scenes ADD COLUMN position INTEGER;
      // Then update this to:
      //   await tx.update(scenes).set({ position: i }).where(eq(scenes.id, sceneId))

      await db.transaction(async (tx) => {
        for (const sceneId of sceneIds) {
          // Since we don't have an order column, we can update timestamps
          // or add a position column in a future migration
          await tx.update(scenes).set({ updatedAt: new Date() }).where(eq(scenes.id, sceneId))
        }
      })
      return true
    } catch (error) {
      console.error('Scene reorder error:', error)
      return false
    }
  }

  async getTotalDuration(projectId: string): Promise<number> {
    const [result] = await db
      .select({
        total: sql<number>`coalesce(sum(${scenes.duration}), 0)::int`
      })
      .from(scenes)
      .where(eq(scenes.projectId, projectId))

    return Number(result?.total ?? 0)
  }

  private mapToScene(data: any): Scene {
    //  console.log('Mapping scene data:', data)
    return {
      id: data.id,
      projectId: data.projectId,
      title: data.title,
      content: data.content ?? undefined,
      duration: data.duration,
      animation: data.animation ?? undefined,
      backgroundImage: data.backgroundImage ?? undefined,
      sceneImage: data.sceneImage ?? undefined,
      layers: data.layers || [],
      cameras: data.cameras || [],
      sceneCameras: data.sceneCameras || [],
      multiTimeline: data.multiTimeline || {},
      audio: data.audio || {},
      sceneAudio: data.sceneAudio ?? undefined,
      transitionType: data.transitionType ?? undefined,
      draggingSpeed: data.draggingSpeed ?? undefined,
      slideDuration: data.slideDuration ?? undefined,
      syncSlideWithVoice: data.syncSlideWithVoice ?? undefined,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt
    }
  }
}
