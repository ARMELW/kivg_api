import { randomUUID } from 'node:crypto'
import { and, desc, eq, sql } from 'drizzle-orm'
import type { AudioFile } from '@/domain/models/audio.model'
import type { AudioFileRepositoryInterface } from '@/domain/repositories/audio.repository.interface'
import { db } from '../database/db'
import { audioFiles } from '../database/schema'

export class AudioRepository implements AudioFileRepositoryInterface {
  async findById(id: string): Promise<AudioFile | null> {
    const result = await db.query.audioFiles.findFirst({
      where: eq(audioFiles.id, id)
    })

    if (!result) return null

    return this.mapToAudioFile(result)
  }

  async findAll(params: {
    userId: string
    skip?: number
    limit?: number
    category?: string
    tags?: string[]
    isFavorite?: boolean
    sortBy?: 'uploadDate' | 'fileName' | 'duration' | 'size'
    sortOrder?: 'asc' | 'desc'
  }): Promise<{ audioFiles: AudioFile[]; total: number }> {
    const {
      userId,
      skip = 0,
      limit = 20,
      category,
      tags,
      isFavorite,
      sortBy = 'uploadDate',
      sortOrder = 'desc'
    } = params

    const conditions = [eq(audioFiles.userId, userId)]

    if (category) {
      conditions.push(eq(audioFiles.category, category))
    }

    if (isFavorite !== undefined) {
      conditions.push(eq(audioFiles.isFavorite, isFavorite))
    }

    if (tags && tags.length > 0) {
      conditions.push(sql`${audioFiles.tags} @> ${JSON.stringify(tags)}::jsonb`)
    }

    const orderColumn = {
      uploadDate: audioFiles.uploadedAt,
      fileName: audioFiles.fileName,
      duration: audioFiles.duration,
      size: audioFiles.size
    }[sortBy]

    const [countResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(audioFiles)
      .where(and(...conditions))

    const total = Number(countResult?.count ?? 0)

    const results = await db
      .select()
      .from(audioFiles)
      .where(and(...conditions))
      .orderBy(sortOrder === 'asc' ? orderColumn : desc(orderColumn))
      .limit(limit)
      .offset(skip)

    return {
      audioFiles: results.map(this.mapToAudioFile),
      total
    }
  }

  async create(data: Omit<AudioFile, 'id' | 'uploadedAt' | 'updatedAt'>): Promise<AudioFile> {
    const now = new Date()
    const [result] = await db
      .insert(audioFiles)
      .values({
        id: randomUUID(),
        ...data,
        uploadedAt: now,
        updatedAt: now
      })
      .returning()

    return this.mapToAudioFile(result)
  }

  async update(
    id: string,
    data: Partial<Omit<AudioFile, 'id' | 'uploadedAt' | 'updatedAt' | 'userId'>>
  ): Promise<AudioFile> {
    const [result] = await db
      .update(audioFiles)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(eq(audioFiles.id, id))
      .returning()

    return this.mapToAudioFile(result)
  }

  async delete(id: string): Promise<boolean> {
    const result = await db.delete(audioFiles).where(eq(audioFiles.id, id)).returning()

    return result.length > 0
  }

  async toggleFavorite(id: string, isFavorite: boolean): Promise<AudioFile> {
    const [result] = await db
      .update(audioFiles)
      .set({
        isFavorite,
        updatedAt: new Date()
      })
      .where(eq(audioFiles.id, id))
      .returning()

    return this.mapToAudioFile(result)
  }

  async getStats(userId: string): Promise<{
    totalAudioFiles: number
    totalDuration: number
    totalSize: number
    audioFilesByCategory: Record<string, number>
  }> {
    const [totals] = await db
      .select({
        count: sql<number>`count(*)::int`,
        duration: sql<number>`coalesce(sum(${audioFiles.duration}), 0)::real`,
        size: sql<number>`coalesce(sum(${audioFiles.size}), 0)::int`
      })
      .from(audioFiles)
      .where(eq(audioFiles.userId, userId))

    const categoryResults = await db
      .select({
        category: audioFiles.category,
        count: sql<number>`count(*)::int`
      })
      .from(audioFiles)
      .where(eq(audioFiles.userId, userId))
      .groupBy(audioFiles.category)

    const audioFilesByCategory: Record<string, number> = {}
    for (const row of categoryResults) {
      audioFilesByCategory[row.category] = Number(row.count)
    }

    return {
      totalAudioFiles: Number(totals?.count ?? 0),
      totalDuration: Number(totals?.duration ?? 0),
      totalSize: Number(totals?.size ?? 0),
      audioFilesByCategory
    }
  }

  private mapToAudioFile(data: any): AudioFile {
    return {
      id: data.id,
      userId: data.userId,
      fileName: data.fileName,
      fileUrl: data.fileUrl,
      duration: data.duration,
      size: data.size,
      category: data.category,
      tags: data.tags || [],
      isFavorite: data.isFavorite,
      trimConfig: data.trimConfig ?? undefined,
      fadeConfig: data.fadeConfig ?? undefined,
      uploadedAt: data.uploadedAt,
      updatedAt: data.updatedAt
    }
  }
}
