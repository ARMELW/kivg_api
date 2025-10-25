import { randomUUID } from 'node:crypto'
import { and, desc, eq, sql } from 'drizzle-orm'
import type { Channel } from '@/domain/models/channel.model'
import type { ChannelRepositoryInterface } from '@/domain/repositories/channel.repository.interface'
import { db } from '../database/db'
import { channels, projects } from '../database/schema'

export class ChannelRepository implements ChannelRepositoryInterface {
  async findById(id: string): Promise<Channel | null> {
    const result = await db.query.channels.findFirst({
      where: eq(channels.id, id)
    })

    if (!result) return null

    return this.mapToChannel(result)
  }

  async findAll(params: {
    userId: string
    skip?: number
    limit?: number
    status?: 'active' | 'archived'
  }): Promise<{ channels: Channel[]; total: number }> {
    const { userId, skip = 0, limit = 20, status } = params

    const conditions = [eq(channels.userId, userId)]

    if (status) {
      conditions.push(eq(channels.status, status))
    }

    const [countResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(channels)
      .where(and(...conditions))

    const total = Number(countResult?.count ?? 0)

    const results = await db
      .select()
      .from(channels)
      .where(and(...conditions))
      .orderBy(desc(channels.createdAt))
      .limit(limit)
      .offset(skip)

    return {
      channels: results.map(this.mapToChannel),
      total
    }
  }

  async create(
    data: Omit<Channel, 'id' | 'createdAt' | 'updatedAt' | 'projectCount' | 'totalVideosExported'>
  ): Promise<Channel> {
    const now = new Date()
    const [result] = await db
      .insert(channels)
      .values({
        id: randomUUID(),
        ...data,
        projectCount: 0,
        totalVideosExported: 0,
        createdAt: now,
        updatedAt: now
      })
      .returning()

    return this.mapToChannel(result)
  }

  async update(
    id: string,
    data: Partial<Omit<Channel, 'id' | 'createdAt' | 'updatedAt' | 'userId' | 'projectCount' | 'totalVideosExported'>>
  ): Promise<Channel> {
    const [result] = await db
      .update(channels)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(eq(channels.id, id))
      .returning()

    return this.mapToChannel(result)
  }

  async delete(id: string): Promise<boolean> {
    const result = await db.delete(channels).where(eq(channels.id, id)).returning()

    return result.length > 0
  }

  async archive(id: string): Promise<Channel> {
    const [result] = await db
      .update(channels)
      .set({
        status: 'archived',
        updatedAt: new Date()
      })
      .where(eq(channels.id, id))
      .returning()

    return this.mapToChannel(result)
  }

  async getStats(id: string): Promise<{
    projectCount: number
    totalVideosExported: number
    activeProjects: number
    completedProjects: number
  }> {
    const [projectStats] = await db
      .select({
        total: sql<number>`count(*)::int`,
        active: sql<number>`count(*) filter (where ${projects.status} = 'draft' or ${projects.status} = 'in_progress')::int`,
        completed: sql<number>`count(*) filter (where ${projects.status} = 'completed')::int`
      })
      .from(projects)
      .where(eq(projects.channelId, id))

    const [channel] = await db
      .select({
        projectCount: channels.projectCount,
        totalVideosExported: channels.totalVideosExported
      })
      .from(channels)
      .where(eq(channels.id, id))

    return {
      projectCount: Number(channel?.projectCount ?? 0),
      totalVideosExported: Number(channel?.totalVideosExported ?? 0),
      activeProjects: Number(projectStats?.active ?? 0),
      completedProjects: Number(projectStats?.completed ?? 0)
    }
  }

  async incrementProjectCount(id: string): Promise<void> {
    await db
      .update(channels)
      .set({
        projectCount: sql`${channels.projectCount} + 1`,
        updatedAt: new Date()
      })
      .where(eq(channels.id, id))
  }

  async decrementProjectCount(id: string): Promise<void> {
    await db
      .update(channels)
      .set({
        projectCount: sql`greatest(0, ${channels.projectCount} - 1)`,
        updatedAt: new Date()
      })
      .where(eq(channels.id, id))
  }

  async incrementVideosExported(id: string): Promise<void> {
    await db
      .update(channels)
      .set({
        totalVideosExported: sql`${channels.totalVideosExported} + 1`,
        updatedAt: new Date()
      })
      .where(eq(channels.id, id))
  }

  private mapToChannel(data: any): Channel {
    return {
      id: data.id,
      userId: data.userId,
      name: data.name,
      description: data.description ?? undefined,
      youtubeUrl: data.youtubeUrl ?? undefined,
      brandKit: data.brandKit || {},
      projectCount: data.projectCount,
      totalVideosExported: data.totalVideosExported,
      status: data.status,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt
    }
  }
}
