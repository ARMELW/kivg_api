import OpenAI from 'openai'
import type {
  AIImageGenerator,
  AIImageGeneratorParams,
  AIImageGeneratorResponse
} from '@/domain/interfaces/ai-service.interface'

/**
 * DALL-E Image Generator Implementation
 * Uses OpenAI's DALL-E 3 for direct image generation
 */
export class DalleImageGenerator implements AIImageGenerator {
  name = 'dalle'
  private client: OpenAI

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey })
  }

  isAvailable(): boolean {
    return !!this.client
  }

  async generateImage(params: AIImageGeneratorParams): Promise<AIImageGeneratorResponse> {
    try {
      const { prompt, size = '1024x1024', quality = 'standard' } = params

      // Generate enhanced prompt based on style
      const enhancedPrompt = this.enhancePrompt(prompt, params.style)

      // Generate image with DALL-E 3
      const response = await this.client.images.generate({
        model: 'dall-e-3',
        prompt: enhancedPrompt,
        n: 1,
        size: size as '1024x1024' | '1024x1792' | '1792x1024',
        quality: quality as 'standard' | 'hd',
        response_format: 'url'
      })

      const imageUrl = response.data[0]?.url

      if (!imageUrl) {
        return {
          success: false,
          error: 'No image URL returned from DALL-E'
        }
      }

      return {
        success: true,
        imageUrl
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to generate image with DALL-E'
      }
    }
  }

  /**
   * Enhance prompt based on style preference
   */
  private enhancePrompt(prompt: string, style?: string): string {
    const styleModifiers: Record<string, string> = {
      realistic: 'Photorealistic, highly detailed, professional photography, 8k resolution',
      cartoon: 'Cartoon style, vibrant colors, playful, animated, vector art',
      anime: 'Anime art style, manga inspired, Japanese animation aesthetic',
      artistic: 'Artistic painting, expressive brushstrokes, creative interpretation, fine art',
      minimal: 'Minimalist design, clean lines, simple shapes, modern aesthetic'
    }

    const modifier = style ? styleModifiers[style] || '' : ''
    return modifier ? `${prompt}. ${modifier}` : prompt
  }
}
