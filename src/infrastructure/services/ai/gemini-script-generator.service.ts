import { GoogleGenerativeAI } from '@google/generative-ai'
import type {
  AIScriptGenerator,
  AIScriptGeneratorParams,
  AIScriptGeneratorResponse
} from '@/domain/interfaces/ai-service.interface'

/**
 * Gemini Script Generator Implementation
 */
export class GeminiScriptGenerator implements AIScriptGenerator {
  name = 'gemini'
  private genAI: GoogleGenerativeAI
  private model: any

  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey)
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-pro' })
  }

  isAvailable(): boolean {
    return !!this.genAI
  }

  async generateScript(params: AIScriptGeneratorParams): Promise<AIScriptGeneratorResponse> {
    try {
      const lengthGuide = {
        short: '30 seconds (approximately 75-90 words)',
        medium: '1-2 minutes (approximately 150-300 words)',
        long: '3-5 minutes (approximately 450-750 words)'
      }

      const length = params.length || 'medium'
      const tone = params.tone || 'professional'
      const style = params.style || 'narrative'

      const prompt = `Generate a video script about: "${params.topic}"

Requirements:
- Length: ${lengthGuide[length]}
- Tone: ${tone}
- Style: ${style}
${params.targetAudience ? `- Target Audience: ${params.targetAudience}` : ''}

Format the response as JSON with this structure:
{
  "script": "full script text",
  "scenes": [
    {
      "id": "scene-1",
      "text": "scene narration text",
      "duration": estimated_seconds,
      "imagePrompt": "description for visual",
      "notes": "any additional notes"
    }
  ]
}

Make it engaging, clear, and suitable for a video presentation. Break it into logical scenes.`

      const result = await this.model.generateContent(prompt)
      const response = await result.response
      const text = response.text()

      // Parse JSON response
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        return {
          success: false,
          error: 'Failed to parse script response'
        }
      }

      const parsed = JSON.parse(jsonMatch[0])

      return {
        success: true,
        script: parsed.script,
        scenes: parsed.scenes
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to generate script'
      }
    }
  }
}
