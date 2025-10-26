import { Buffer } from 'node:buffer'
import type {
  AIMusicGenerator,
  AIMusicGeneratorParams,
  AIMusicGeneratorResponse
} from '@/domain/interfaces/ai-service.interface'
import { uploadFile } from '../../config/upload.config'

/**
 * Mubert Music Generation Implementation
 * Generates AI-powered background music for videos
 */
export class MubertMusicGenerator implements AIMusicGenerator {
  name = 'mubert'
  private apiKey: string
  private baseUrl = 'https://api-b2b.mubert.com/v2'

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  isAvailable(): boolean {
    return !!this.apiKey
  }

  async generateMusic(params: AIMusicGeneratorParams): Promise<AIMusicGeneratorResponse> {
    try {
      const { duration, mood = 'inspiring', genre = 'cinematic', tempo = 'medium' } = params

      // Build tags for Mubert API
      const tags = this.buildTags(mood, genre, tempo)

      // Step 1: Request track generation
      const generateResponse = await fetch(`${this.baseUrl}/RecordTrack`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          method: 'RecordTrack',
          params: {
            license: this.apiKey,
            mode: 'loop',
            duration: Math.min(duration, 300), // Max 5 minutes
            tags: tags.join(','),
            format: 'mp3'
          }
        })
      })

      if (!generateResponse.ok) {
        throw new Error('Mubert API request failed')
      }

      const generateData = await generateResponse.json()

      if (!generateData.data?.tasks?.[0]?.result?.track_url) {
        throw new Error('No track URL returned from Mubert')
      }

      const trackUrl = generateData.data.tasks[0].result.track_url

      // Step 2: Download the generated audio
      const audioResponse = await fetch(trackUrl)
      if (!audioResponse.ok) {
        throw new Error('Failed to download generated music')
      }

      const audioBuffer = Buffer.from(await audioResponse.arrayBuffer())

      // Step 3: Upload to our storage
      const uploadResult = await uploadFile(audioBuffer, 'audio')

      return {
        success: true,
        audioUrl: uploadResult.url,
        duration
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to generate music with Mubert'
      }
    }
  }

  /**
   * Build Mubert tags based on mood, genre, and tempo
   */
  private buildTags(mood: string, genre: string, tempo: string): string[] {
    const tags: string[] = []

    // Mood tags
    const moodTags: Record<string, string[]> = {
      happy: ['upbeat', 'positive', 'cheerful'],
      sad: ['melancholic', 'emotional', 'reflective'],
      energetic: ['dynamic', 'powerful', 'intense'],
      calm: ['peaceful', 'relaxing', 'gentle'],
      dramatic: ['epic', 'dramatic', 'suspenseful'],
      inspiring: ['inspirational', 'motivational', 'uplifting'],
      mysterious: ['mysterious', 'enigmatic', 'atmospheric'],
      romantic: ['romantic', 'tender', 'intimate']
    }

    // Genre tags
    const genreTags: Record<string, string[]> = {
      electronic: ['electronic', 'synthesizer'],
      acoustic: ['acoustic', 'organic'],
      classical: ['classical', 'orchestral'],
      ambient: ['ambient', 'atmospheric'],
      cinematic: ['cinematic', 'soundtrack'],
      corporate: ['corporate', 'background'],
      pop: ['pop', 'contemporary'],
      rock: ['rock', 'guitar']
    }

    // Tempo tags
    const tempoTags: Record<string, string[]> = {
      slow: ['slow', 'downtempo'],
      medium: ['medium', 'moderate'],
      fast: ['fast', 'uptempo']
    }

    // Add tags
    tags.push(...(moodTags[mood] || ['neutral']))
    tags.push(...(genreTags[genre] || ['background']))
    tags.push(...(tempoTags[tempo] || ['medium']))

    return tags
  }
}
