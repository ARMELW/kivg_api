import type {
  AIScriptGenerator,
  AIScriptGeneratorParams,
  AIScriptGeneratorResponse
} from '@/domain/interfaces/ai-service.interface'

/**
 * AutoContentAPI Script Generator Implementation
 * Uses AutoContentAPI for AI-powered script generation as an alternative to NotebookLM
 */
export class AutoContentScriptGenerator implements AIScriptGenerator {
  name = 'autocontent'
  private apiKey: string
  private baseUrl = 'https://api.autocontentapi.com/v1'

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  isAvailable(): boolean {
    return !!this.apiKey
  }

  async generateScript(params: AIScriptGeneratorParams): Promise<AIScriptGeneratorResponse> {
    try {
      const lengthGuide = {
        short: 90, // ~30 seconds of speech
        medium: 225, // ~1-2 minutes of speech
        long: 600 // ~3-5 minutes of speech
      }

      const wordCount = lengthGuide[params.length || 'medium']
      const tone = params.tone || 'professional'
      const style = params.style || 'narrative'

      // Prepare request payload for AutoContentAPI
      const requestPayload = {
        content: params.topic,
        instructions: `Generate a ${params.length || 'medium'} video script with a ${tone} tone in ${style} style. ${params.targetAudience ? `Target audience: ${params.targetAudience}.` : ''} The script should be approximately ${wordCount} words. Break it into logical scenes with descriptions for visuals.`,
        format: 'script',
        voice_settings: {
          tone: tone,
          style: style
        }
      }

      // Call AutoContentAPI
      const response = await fetch(`${this.baseUrl}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(requestPayload)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `AutoContentAPI request failed with status ${response.status}`)
      }

      const data = await response.json()

      // Parse and structure the response
      const script = data.script || data.content || ''
      const scenes = this.parseScenes(script, params)

      return {
        success: true,
        script,
        scenes
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to generate script with AutoContentAPI'
      }
    }
  }

  /**
   * Parse script text into structured scenes
   */
  private parseScenes(
    script: string,
    params: AIScriptGeneratorParams
  ): Array<{
    id: string
    text: string
    duration: number
    imagePrompt?: string
    notes?: string
  }> {
    // Split script by paragraphs or scene markers
    const paragraphs = script
      .split(/\n\n+/)
      .filter((p) => p.trim().length > 0)
      .map((p) => p.trim())

    if (paragraphs.length === 0) {
      return [
        {
          id: 'scene-1',
          text: script,
          duration: this.estimateDuration(script),
          imagePrompt: `Visual for: ${params.topic}`,
          notes: 'Generated with AutoContentAPI'
        }
      ]
    }

    // Create scenes from paragraphs
    return paragraphs.map((text, index) => ({
      id: `scene-${index + 1}`,
      text,
      duration: this.estimateDuration(text),
      imagePrompt: this.generateImagePrompt(text, params.topic),
      notes: index === 0 ? 'Opening scene' : index === paragraphs.length - 1 ? 'Closing scene' : undefined
    }))
  }

  /**
   * Estimate duration based on word count (average speaking pace: 150 words/minute)
   */
  private estimateDuration(text: string): number {
    const wordCount = text.split(/\s+/).length
    const wordsPerSecond = 2.5 // 150 words per minute
    return Math.ceil(wordCount / wordsPerSecond)
  }

  /**
   * Generate image prompt for a scene
   */
  private generateImagePrompt(sceneText: string, topic: string): string {
    // Extract key nouns and concepts from the scene
    const words = sceneText.split(/\s+/).slice(0, 20).join(' ')
    return `Visual representation for: ${words}... (Topic: ${topic})`
  }
}
