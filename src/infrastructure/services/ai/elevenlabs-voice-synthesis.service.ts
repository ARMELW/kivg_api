import { Buffer } from 'node:buffer'
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js'
import type {
  AIVoice,
  AIVoiceSynthesis,
  AIVoiceSynthesisParams,
  AIVoiceSynthesisResponse
} from '@/domain/interfaces/ai-service.interface'
import { uploadFile } from '../../config/upload.config'

/**
 * ElevenLabs Voice Synthesis Implementation
 */
export class ElevenLabsVoiceSynthesis implements AIVoiceSynthesis {
  name = 'elevenlabs'
  private client: ElevenLabsClient
  private voiceCache: AIVoice[] = []
  private cacheExpiry: number = 0

  constructor(apiKey: string) {
    this.client = new ElevenLabsClient({ apiKey })
  }

  isAvailable(): boolean {
    return !!this.client
  }

  async generateVoice(params: AIVoiceSynthesisParams): Promise<AIVoiceSynthesisResponse> {
    try {
      const { text, voice, speed = 1, pitch = 0 } = params

      // ElevenLabs uses stability and similarity_boost instead of pitch
      // We'll map pitch to these parameters
      const stability = Math.max(0, Math.min(1, 0.5 + pitch / 40))
      const similarityBoost = Math.max(0, Math.min(1, 0.75 + pitch / 40))

      // Generate audio with ElevenLabs
      const audioStream = await this.client.textToSpeech.convert(voice, {
        text,
        modelId: 'eleven_multilingual_v2',
        voiceSettings: {
          stability,
          similarityBoost,
          style: 0,
          useSpeakerBoost: true
        }
      })

      // Convert stream to buffer
      const chunks: Uint8Array[] = []
      const reader = audioStream.getReader()

      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          if (value) chunks.push(value)
        }
      } finally {
        reader.releaseLock()
      }

      const audioBuffer = Buffer.concat(chunks.map((chunk) => Buffer.from(chunk)))

      // Upload the audio file
      const uploadResult = await uploadFile(audioBuffer, 'audio')

      // Estimate duration (very rough estimate: ~150 words per minute, ~5 chars per word)
      const estimatedDuration = Math.ceil(((text.length / 5 / 150) * 60) / speed)

      return {
        success: true,
        audioUrl: uploadResult.url,
        duration: estimatedDuration
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to generate voice'
      }
    }
  }

  async listVoices(language?: string): Promise<AIVoice[]> {
    try {
      // Check cache (1 hour expiry)
      const now = Date.now()
      if (this.voiceCache.length > 0 && now < this.cacheExpiry) {
        return language ? this.filterVoicesByLanguage(this.voiceCache, language) : this.voiceCache
      }

      // Fetch voices from ElevenLabs
      const response = await this.client.voices.getAll()

      if (!response.voices) {
        return []
      }

      // Map ElevenLabs voices to our interface
      this.voiceCache = response.voices.map((voice: any) => {
        // Infer gender from voice name if not provided
        const gender = this.inferGender(voice.name)
        // Infer language from labels or default to 'en'
        const voiceLanguage = this.inferLanguage(voice.labels)

        return {
          id: voice.voice_id,
          name: voice.name,
          language: voiceLanguage,
          gender,
          style: voice.labels?.accent || voice.labels?.description || 'general'
        }
      })

      // Set cache expiry to 1 hour from now
      this.cacheExpiry = now + 3600000

      return language ? this.filterVoicesByLanguage(this.voiceCache, language) : this.voiceCache
    } catch (error: any) {
      console.error('Failed to fetch ElevenLabs voices:', error)
      return []
    }
  }

  private filterVoicesByLanguage(voices: AIVoice[], language: string): AIVoice[] {
    return voices.filter((voice) => voice.language === language)
  }

  private inferGender(name: string): 'male' | 'female' | 'neutral' {
    const nameLower = name.toLowerCase()
    const maleNames = [
      'adam',
      'antoni',
      'arnold',
      'callum',
      'charlie',
      'clyde',
      'daniel',
      'dave',
      'drew',
      'ethan',
      'fin',
      'george',
      'giovanni',
      'harry',
      'james',
      'jeremy',
      'joseph',
      'josh',
      'liam',
      'marcus',
      'michael',
      'patrick',
      'paul',
      'sam',
      'thomas',
      'william'
    ]
    const femaleNames = [
      'alice',
      'bella',
      'charlotte',
      'domi',
      'dorothy',
      'emily',
      'elli',
      'freya',
      'gigi',
      'glinda',
      'grace',
      'jessica',
      'lily',
      'matilda',
      'mimi',
      'natasha',
      'nicole',
      'rachel',
      'sarah',
      'serena'
    ]

    if (maleNames.some((n) => nameLower.includes(n))) return 'male'
    if (femaleNames.some((n) => nameLower.includes(n))) return 'female'
    return 'neutral'
  }

  private inferLanguage(labels?: Record<string, string>): string {
    if (!labels) return 'en'

    // Check for language in labels
    const languageMap: Record<string, string> = {
      english: 'en',
      spanish: 'es',
      french: 'fr',
      german: 'de',
      italian: 'it',
      portuguese: 'pt',
      russian: 'ru',
      japanese: 'ja',
      korean: 'ko',
      chinese: 'zh',
      american: 'en',
      british: 'en',
      australian: 'en'
    }

    for (const value of Object.values(labels)) {
      const valueLower = value.toLowerCase()
      for (const [lang, code] of Object.entries(languageMap)) {
        if (valueLower.includes(lang)) {
          return code
        }
      }
    }

    return 'en'
  }
}
