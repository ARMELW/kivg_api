import { Buffer } from 'node:buffer'
import type {
  AIVoice,
  AIVoiceSynthesis,
  AIVoiceSynthesisParams,
  AIVoiceSynthesisResponse
} from '@/domain/interfaces/ai-service.interface'
import { uploadFile } from '../../config/upload.config'

/**
 * MiniMax Voice Synthesis Implementation
 * Alternative to ElevenLabs with competitive pricing
 */
export class MiniMaxVoiceSynthesis implements AIVoiceSynthesis {
  name = 'minimax'
  private apiKey: string
  private baseUrl = 'https://api.minimax.chat/v1'
  private voiceCache: AIVoice[] = []
  private cacheExpiry: number = 0

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  isAvailable(): boolean {
    return !!this.apiKey
  }

  async generateVoice(params: AIVoiceSynthesisParams): Promise<AIVoiceSynthesisResponse> {
    try {
      const { text, voice, speed = 1, language } = params

      // MiniMax API call for text-to-speech
      const response = await fetch(`${this.baseUrl}/t2a_v2`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'speech-01',
          text,
          voice_id: voice,
          speed,
          format: 'mp3',
          language: this.mapLanguageCode(language)
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'MiniMax API request failed')
      }

      // Get audio data
      const audioBuffer = Buffer.from(await response.arrayBuffer())

      // Upload the audio file
      const uploadResult = await uploadFile(audioBuffer, 'audio', 'audio/mpeg')

      // Estimate duration (rough estimate: ~150 words per minute, ~5 chars per word)
      const estimatedDuration = Math.ceil(((text.length / 5 / 150) * 60) / speed)

      return {
        success: true,
        audioUrl: uploadResult.url,
        duration: estimatedDuration
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to generate voice with MiniMax'
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

      // Fetch voices from MiniMax API
      const response = await fetch(`${this.baseUrl}/voices`, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        console.error('Failed to fetch MiniMax voices')
        return this.getStaticVoices(language)
      }

      const data = await response.json()

      // Map MiniMax voices to our interface
      this.voiceCache =
        data.voices?.map((voice: any) => ({
          id: voice.voice_id,
          name: voice.name,
          language: this.normalizeLanguage(voice.language),
          gender: voice.gender || this.inferGender(voice.name),
          style: voice.style || 'general'
        })) || []

      // Set cache expiry to 1 hour from now
      this.cacheExpiry = now + 3600000

      return language ? this.filterVoicesByLanguage(this.voiceCache, language) : this.voiceCache
    } catch (error: any) {
      console.error('Failed to fetch MiniMax voices:', error)
      return this.getStaticVoices(language)
    }
  }

  private filterVoicesByLanguage(voices: AIVoice[], language: string): AIVoice[] {
    return voices.filter((voice) => voice.language === language)
  }

  private mapLanguageCode(language: string): string {
    const languageMap: Record<string, string> = {
      en: 'en-US',
      es: 'es-ES',
      fr: 'fr-FR',
      de: 'de-DE',
      it: 'it-IT',
      pt: 'pt-PT',
      ru: 'ru-RU',
      ja: 'ja-JP',
      ko: 'ko-KR',
      zh: 'zh-CN'
    }
    return languageMap[language] || language
  }

  private normalizeLanguage(language: string): string {
    const normalized = language.toLowerCase().split('-')[0]
    return normalized
  }

  private inferGender(name: string): 'male' | 'female' | 'neutral' {
    const nameLower = name.toLowerCase()
    const maleIndicators = ['male', 'man', 'boy', 'mr', 'masculine']
    const femaleIndicators = ['female', 'woman', 'girl', 'ms', 'miss', 'mrs', 'feminine']

    if (maleIndicators.some((i) => nameLower.includes(i))) return 'male'
    if (femaleIndicators.some((i) => nameLower.includes(i))) return 'female'
    return 'neutral'
  }

  /**
   * Static fallback voices when API is unavailable
   */
  private getStaticVoices(language?: string): AIVoice[] {
    const staticVoices: AIVoice[] = [
      { id: 'minimax-en-male-1', name: 'Alex', language: 'en', gender: 'male', style: 'professional' },
      { id: 'minimax-en-female-1', name: 'Emma', language: 'en', gender: 'female', style: 'professional' },
      { id: 'minimax-es-male-1', name: 'Carlos', language: 'es', gender: 'male', style: 'professional' },
      { id: 'minimax-es-female-1', name: 'Sofia', language: 'es', gender: 'female', style: 'professional' },
      { id: 'minimax-fr-male-1', name: 'Pierre', language: 'fr', gender: 'male', style: 'professional' },
      { id: 'minimax-fr-female-1', name: 'Marie', language: 'fr', gender: 'female', style: 'professional' },
      { id: 'minimax-de-male-1', name: 'Hans', language: 'de', gender: 'male', style: 'professional' },
      { id: 'minimax-de-female-1', name: 'Anna', language: 'de', gender: 'female', style: 'professional' },
      { id: 'minimax-zh-male-1', name: 'Wei', language: 'zh', gender: 'male', style: 'professional' },
      { id: 'minimax-zh-female-1', name: 'Mei', language: 'zh', gender: 'female', style: 'professional' }
    ]

    return language ? staticVoices.filter((v) => v.language === language) : staticVoices
  }
}
