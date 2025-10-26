import type { AIUsage } from '../models/ai-usage.model'

/**
 * AI Usage Repository Interface
 */
export interface AIUsageRepositoryInterface {
  /**
   * Get or create usage record for user and month
   */
  getOrCreate: (userId: string, month: string) => Promise<AIUsage>

  /**
   * Increment video generation count
   */
  incrementVideoGeneration: (userId: string, month: string) => Promise<AIUsage>

  /**
   * Increment script generation count
   */
  incrementScriptGeneration: (userId: string, month: string) => Promise<AIUsage>

  /**
   * Increment image generation count
   */
  incrementImageGeneration: (userId: string, month: string) => Promise<AIUsage>

  /**
   * Increment voice generation count
   */
  incrementVoiceGeneration: (userId: string, month: string) => Promise<AIUsage>

  /**
   * Increment music generation count
   */
  incrementMusicGeneration: (userId: string, month: string) => Promise<AIUsage>

  /**
   * Get current month usage
   */
  getCurrentMonthUsage: (userId: string) => Promise<AIUsage | null>

  /**
   * Get usage history for user
   */
  getUsageHistory: (userId: string, limit?: number) => Promise<AIUsage[]>
}
