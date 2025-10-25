import { randomUUID } from 'node:crypto'
import { and, asc, desc, eq, ilike, isNull, sql } from 'drizzle-orm'
import type { Project } from '@/domain/models/project.model'
import type { ProjectRepositoryInterface } from '@/domain/repositories/project.repository.interface'
import { db } from '../database/db'
import { projects, scenes } from '../database/schema'

export class ProjectRepository implements ProjectRepositoryInterface {
  async findById(id: string): Promise<Project | null> {
    const result = await db.query.projects.findFirst({
      where: and(eq(projects.id, id), isNull(projects.deletedAt))
    })

    if (!result) return null

    return this.mapToProject(result)
  }

  async findAll(params: {
    channelId: string
    status?: 'draft' | 'in_progress' | 'completed'
    skip?: number
    limit?: number
    sortBy?: 'created_at' | 'updated_at' | 'title'
    sortOrder?: 'asc' | 'desc'
    search?: string
  }): Promise<{ projects: Project[]; total: number }> {
    const { channelId, skip = 0, limit = 20, status, sortBy = 'updated_at', sortOrder = 'desc', search } = params

    const conditions = [isNull(projects.deletedAt), eq(projects.channelId, channelId)]

    if (status) {
      conditions.push(eq(projects.status, status))
    }

    if (search) {
      conditions.push(ilike(projects.title, `%${search}%`))
    }

    const orderColumn = {
      created_at: projects.createdAt,
      updated_at: projects.updatedAt,
      title: projects.title
    }[sortBy]

    const orderFn = sortOrder === 'asc' ? asc : desc

    const [countResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(projects)
      .where(and(...conditions))

    const total = Number(countResult?.count ?? 0)

    const results = await db
      .select()
      .from(projects)
      .where(and(...conditions))
      .orderBy(orderFn(orderColumn))
      .limit(limit)
      .offset(skip)

    return {
      projects: results.map(this.mapToProject),
      total
    }
  }

  async create(data: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt' | 'duration'>): Promise<Project> {
    const now = new Date()
    const [result] = await db
      .insert(projects)
      .values({
        id: randomUUID(),
        ...data,
        duration: 0,
        createdAt: now,
        updatedAt: now
      })
      .returning()

    return this.mapToProject(result)
  }

  async update(
    id: string,
    data: Partial<Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt' | 'userId' | 'channelId'>>
  ): Promise<Project> {
    const [result] = await db
      .update(projects)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(and(eq(projects.id, id), isNull(projects.deletedAt)))
      .returning()

    return this.mapToProject(result)
  }

  async delete(id: string): Promise<boolean> {
    // Soft delete
    const result = await db
      .update(projects)
      .set({
        deletedAt: new Date()
      })
      .where(eq(projects.id, id))
      .returning()

    return result.length > 0
  }

  async duplicate(id: string, newTitle: string): Promise<Project> {
    const original = await this.findById(id)
    if (!original) {
      throw new Error('Project not found')
    }

    const now = new Date()
    const [duplicated] = await db
      .insert(projects)
      .values({
        id: randomUUID(),
        userId: original.userId,
        channelId: original.channelId,
        title: newTitle,
        description: original.description,
        thumbnailUrl: original.thumbnailUrl,
        resolution: original.resolution,
        aspectRatio: original.aspectRatio,
        fps: original.fps,
        duration: original.duration,
        status: 'draft',
        createdAt: now,
        updatedAt: now
      })
      .returning()

    // Copy scenes
    const originalScenes = await db.select().from(scenes).where(eq(scenes.projectId, id))

    if (originalScenes.length > 0) {
      await db.insert(scenes).values(
        originalScenes.map((scene) => ({
          ...scene,
          id: randomUUID(),
          projectId: duplicated.id,
          createdAt: now,
          updatedAt: now
        }))
      )
    }

    return this.mapToProject(duplicated)
  }

  async updateDuration(id: string, duration: number): Promise<void> {
    await db
      .update(projects)
      .set({
        duration,
        updatedAt: new Date()
      })
      .where(eq(projects.id, id))
  }

  async getStats(userId: string): Promise<{
    totalProjects: number
    draftProjects: number
    inProgressProjects: number
    completedProjects: number
  }> {
    const [stats] = await db
      .select({
        total: sql<number>`count(*)::int`,
        draft: sql<number>`count(*) filter (where ${projects.status} = 'draft')::int`,
        inProgress: sql<number>`count(*) filter (where ${projects.status} = 'in_progress')::int`,
        completed: sql<number>`count(*) filter (where ${projects.status} = 'completed')::int`
      })
      .from(projects)
      .where(and(eq(projects.userId, userId), isNull(projects.deletedAt)))

    return {
      totalProjects: Number(stats?.total ?? 0),
      draftProjects: Number(stats?.draft ?? 0),
      inProgressProjects: Number(stats?.inProgress ?? 0),
      completedProjects: Number(stats?.completed ?? 0)
    }
  }

  private mapToProject(data: any): Project {
    return {
      id: data.id,
      userId: data.userId,
      channelId: data.channelId,
      title: data.title,
      description: data.description ?? undefined,
      thumbnailUrl: data.thumbnailUrl ?? undefined,
      resolution: data.resolution,
      aspectRatio: data.aspectRatio,
      fps: data.fps,
      duration: data.duration,
      status: data.status,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      deletedAt: data.deletedAt ?? undefined
    }
  }
}
