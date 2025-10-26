/**
 * AI Service Provider Interface
 * This abstraction allows swapping AI providers without changing business logic
 */

export interface AIServiceProvider {
  /**
   * Provider name (e.g., 'gemini', 'openai', 'anthropic')
   */
  name: string

  /**
   * Check if the provider is available and configured
   */
  isAvailable: () => boolean
}

/**
 * AI Image Generator Interface
 */
export interface AIImageGeneratorParams {
  prompt: string
  style?: 'realistic' | 'cartoon' | 'anime' | 'artistic' | 'minimal'
  size?: '256x256' | '512x512' | '1024x1024' | '1792x1024' | '1024x1792'
  quality?: 'standard' | 'hd'
}

export interface AIImageGeneratorResponse {
  success: boolean
  imageUrl?: string
  error?: string
}

export interface AIImageGenerator extends AIServiceProvider {
  generateImage: (params: AIImageGeneratorParams) => Promise<AIImageGeneratorResponse>
}

/**
 * AI Voice Synthesis Interface
 */
export interface AIVoiceSynthesisParams {
  text: string
  language: 'en' | 'es' | 'fr' | 'de' | 'it' | 'pt' | 'ru' | 'ja' | 'ko' | 'zh'
  voice: string // Voice ID from available voices
  speed?: number // 0.5 to 2.0
  pitch?: number // -20 to 20
}

export interface AIVoiceSynthesisResponse {
  success: boolean
  audioUrl?: string
  duration?: number
  error?: string
}

export interface AIVoiceSynthesis extends AIServiceProvider {
  generateVoice: (params: AIVoiceSynthesisParams) => Promise<AIVoiceSynthesisResponse>
  listVoices: (language?: string) => Promise<AIVoice[]>
}

export interface AIVoice {
  id: string
  name: string
  language: string
  gender: 'male' | 'female' | 'neutral'
  style: string
}

/**
 * AI Script Generator Interface
 */
export interface AIScriptGeneratorParams {
  topic: string
  tone?: 'professional' | 'casual' | 'educational' | 'entertaining' | 'inspiring'
  length?: 'short' | 'medium' | 'long' // 30s, 1-2min, 3-5min
  style?: 'narrative' | 'conversational' | 'instructional'
  targetAudience?: string
}

export interface AIScriptGeneratorResponse {
  success: boolean
  script?: string
  scenes?: ScriptScene[]
  error?: string
}

export interface ScriptScene {
  id: string
  text: string
  duration: number
  imagePrompt?: string
  notes?: string
}

export interface AIScriptGenerator extends AIServiceProvider {
  generateScript: (params: AIScriptGeneratorParams) => Promise<AIScriptGeneratorResponse>
}
