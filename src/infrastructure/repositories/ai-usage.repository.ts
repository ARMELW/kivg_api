import { randomUUID } from 'node:crypto'
import { desc, eq, sql } from 'drizzle-orm'
import type { AIUsage } from '@/domain/models/ai-usage.model'
import type { AIUsageRepositoryInterface } from '@/domain/repositories/ai-usage.repository.interface'
import { db } from '../database/db'
import { aiUsage } from '../database/schema/schema'

/**
 * AI Usage Repository Implementation
 */
export class AIUsageRepository implements AIUsageRepositoryInterface {
  /**
   * Get current month in YYYY-MM format
   */
  private getCurrentMonth(): string {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    return `${year}-${month}`
  }

  async getOrCreate(userId: string, month: string): Promise<AIUsage> {
    // Try to get existing record
    const existing = await db.query.aiUsage.findFirst({
      where: (table, { and, eq }) => and(eq(table.userId, userId), eq(table.month, month))
    })

    if (existing) {
      return {
        id: existing.id,
        userId: existing.userId,
        month: existing.month,
        videoGenerationCount: existing.videoGenerationCount,
        scriptGenerationCount: existing.scriptGenerationCount,
        imageGenerationCount: existing.imageGenerationCount,
        voiceGenerationCount: existing.voiceGenerationCount,
        musicGenerationCount: existing.musicGenerationCount,
        createdAt: existing.createdAt,
        updatedAt: existing.updatedAt
      }
    }

    // Create new record
    const id = randomUUID()
    const now = new Date()

    const [newUsage] = await db
      .insert(aiUsage)
      .values({
        id,
        userId,
        month,
        videoGenerationCount: 0,
        scriptGenerationCount: 0,
        imageGenerationCount: 0,
        voiceGenerationCount: 0,
        musicGenerationCount: 0,
        createdAt: now,
        updatedAt: now
      })
      .returning()

    return {
      id: newUsage.id,
      userId: newUsage.userId,
      month: newUsage.month,
      videoGenerationCount: newUsage.videoGenerationCount,
      scriptGenerationCount: newUsage.scriptGenerationCount,
      imageGenerationCount: newUsage.imageGenerationCount,
      voiceGenerationCount: newUsage.voiceGenerationCount,
      musicGenerationCount: newUsage.musicGenerationCount,
      createdAt: newUsage.createdAt,
      updatedAt: newUsage.updatedAt
    }
  }

  async incrementVideoGeneration(userId: string, month: string): Promise<AIUsage> {
    // Ensure record exists
    await this.getOrCreate(userId, month)

    // Increment count
    const [updated] = await db
      .update(aiUsage)
      .set({
        videoGenerationCount: sql`${aiUsage.videoGenerationCount} + 1`,
        updatedAt: new Date()
      })
      .where(sql`${aiUsage.userId} = ${userId} AND ${aiUsage.month} = ${month}`)
      .returning()

    return {
      id: updated.id,
      userId: updated.userId,
      month: updated.month,
      videoGenerationCount: updated.videoGenerationCount,
      scriptGenerationCount: updated.scriptGenerationCount,
      imageGenerationCount: updated.imageGenerationCount,
      voiceGenerationCount: updated.voiceGenerationCount,
      musicGenerationCount: updated.musicGenerationCount,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt
    }
  }

  async incrementScriptGeneration(userId: string, month: string): Promise<AIUsage> {
    await this.getOrCreate(userId, month)

    const [updated] = await db
      .update(aiUsage)
      .set({
        scriptGenerationCount: sql`${aiUsage.scriptGenerationCount} + 1`,
        updatedAt: new Date()
      })
      .where(sql`${aiUsage.userId} = ${userId} AND ${aiUsage.month} = ${month}`)
      .returning()

    return {
      id: updated.id,
      userId: updated.userId,
      month: updated.month,
      videoGenerationCount: updated.videoGenerationCount,
      scriptGenerationCount: updated.scriptGenerationCount,
      imageGenerationCount: updated.imageGenerationCount,
      voiceGenerationCount: updated.voiceGenerationCount,
      musicGenerationCount: updated.musicGenerationCount,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt
    }
  }

  async incrementImageGeneration(userId: string, month: string): Promise<AIUsage> {
    await this.getOrCreate(userId, month)

    const [updated] = await db
      .update(aiUsage)
      .set({
        imageGenerationCount: sql`${aiUsage.imageGenerationCount} + 1`,
        updatedAt: new Date()
      })
      .where(sql`${aiUsage.userId} = ${userId} AND ${aiUsage.month} = ${month}`)
      .returning()

    return {
      id: updated.id,
      userId: updated.userId,
      month: updated.month,
      videoGenerationCount: updated.videoGenerationCount,
      scriptGenerationCount: updated.scriptGenerationCount,
      imageGenerationCount: updated.imageGenerationCount,
      voiceGenerationCount: updated.voiceGenerationCount,
      musicGenerationCount: updated.musicGenerationCount,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt
    }
  }

  async incrementVoiceGeneration(userId: string, month: string): Promise<AIUsage> {
    await this.getOrCreate(userId, month)

    const [updated] = await db
      .update(aiUsage)
      .set({
        voiceGenerationCount: sql`${aiUsage.voiceGenerationCount} + 1`,
        updatedAt: new Date()
      })
      .where(sql`${aiUsage.userId} = ${userId} AND ${aiUsage.month} = ${month}`)
      .returning()

    return {
      id: updated.id,
      userId: updated.userId,
      month: updated.month,
      videoGenerationCount: updated.videoGenerationCount,
      scriptGenerationCount: updated.scriptGenerationCount,
      imageGenerationCount: updated.imageGenerationCount,
      voiceGenerationCount: updated.voiceGenerationCount,
      musicGenerationCount: updated.musicGenerationCount,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt
    }
  }

  async incrementMusicGeneration(userId: string, month: string): Promise<AIUsage> {
    await this.getOrCreate(userId, month)

    const [updated] = await db
      .update(aiUsage)
      .set({
        musicGenerationCount: sql`${aiUsage.musicGenerationCount} + 1`,
        updatedAt: new Date()
      })
      .where(sql`${aiUsage.userId} = ${userId} AND ${aiUsage.month} = ${month}`)
      .returning()

    return {
      id: updated.id,
      userId: updated.userId,
      month: updated.month,
      videoGenerationCount: updated.videoGenerationCount,
      scriptGenerationCount: updated.scriptGenerationCount,
      imageGenerationCount: updated.imageGenerationCount,
      voiceGenerationCount: updated.voiceGenerationCount,
      musicGenerationCount: updated.musicGenerationCount,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt
    }
  }

  async getCurrentMonthUsage(userId: string): Promise<AIUsage | null> {
    const currentMonth = this.getCurrentMonth()
    const usage = await db.query.aiUsage.findFirst({
      where: (table, { and, eq }) => and(eq(table.userId, userId), eq(table.month, currentMonth))
    })

    if (!usage) {
      return null
    }

    return {
      id: usage.id,
      userId: usage.userId,
      month: usage.month,
      videoGenerationCount: usage.videoGenerationCount,
      scriptGenerationCount: usage.scriptGenerationCount,
      imageGenerationCount: usage.imageGenerationCount,
      voiceGenerationCount: usage.voiceGenerationCount,
      musicGenerationCount: usage.musicGenerationCount,
      createdAt: usage.createdAt,
      updatedAt: usage.updatedAt
    }
  }

  async getUsageHistory(userId: string, limit: number = 12): Promise<AIUsage[]> {
    const results = await db.query.aiUsage.findMany({
      where: eq(aiUsage.userId, userId),
      orderBy: [desc(aiUsage.month)],
      limit
    })

    return results.map((usage) => ({
      id: usage.id,
      userId: usage.userId,
      month: usage.month,
      videoGenerationCount: usage.videoGenerationCount,
      scriptGenerationCount: usage.scriptGenerationCount,
      imageGenerationCount: usage.imageGenerationCount,
      voiceGenerationCount: usage.voiceGenerationCount,
      musicGenerationCount: usage.musicGenerationCount,
      createdAt: usage.createdAt,
      updatedAt: usage.updatedAt
    }))
  }
}
