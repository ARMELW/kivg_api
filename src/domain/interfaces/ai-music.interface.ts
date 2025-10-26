/**
 * AI Music Generator Interface
 */
export interface AIMusicGeneratorParams {
  duration: number // Duration in seconds
  mood?: 'happy' | 'sad' | 'energetic' | 'calm' | 'dramatic' | 'inspiring' | 'mysterious' | 'romantic'
  genre?: 'electronic' | 'acoustic' | 'classical' | 'ambient' | 'cinematic' | 'corporate' | 'pop' | 'rock'
  tempo?: 'slow' | 'medium' | 'fast'
}

export interface AIMusicGeneratorResponse {
  success: boolean
  audioUrl?: string
  duration?: number
  error?: string
}

export interface AIMusicGenerator extends AIServiceProvider {
  generateMusic: (params: AIMusicGeneratorParams) => Promise<AIMusicGeneratorResponse>
}
