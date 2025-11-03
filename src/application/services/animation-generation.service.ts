import { randomUUID } from 'node:crypto'
import { unlink, writeFile } from 'node:fs/promises'
import type { AnimationConfig } from '@/domain/models/animation.model'
import { AnimationValidationService } from './animation-validation.service'
import { StorageService } from './storage.service'
import { WhiteboardCliService, type WhiteboardOptions } from './whiteboard-cli.service'

export interface AnimationGenerationOptions {
  quality?: 'preview' | 'draft' | 'standard' | 'high'
  aspectRatio?: '1:1' | '16:9' | '9:16'
  skipAudio?: boolean
}

export interface AnimationGenerationProgress {
  progress: number
  currentStep: string
}

export class AnimationGenerationService {
  private validationService: AnimationValidationService
  private whiteboardService: WhiteboardCliService
  private storageService: StorageService

  constructor(storageService?: StorageService) {
    this.validationService = new AnimationValidationService()
    this.storageService = storageService || new StorageService()
    this.whiteboardService = new WhiteboardCliService(this.storageService)
  }

  /**
   * Generate video from animation configuration
   */
  async generateVideo(
    config: AnimationConfig,
    options: AnimationGenerationOptions = {},
    onProgress?: (progress: AnimationGenerationProgress) => void
  ): Promise<{ success: boolean; videoUrl?: string; errors?: string[] }> {
    // Validate configuration
    const validationErrors = this.validationService.validate(config)
    if (validationErrors.length > 0) {
      return {
        success: false,
        errors: validationErrors
      }
    }

    try {
      // Convert animation config to whiteboard config
      const whiteboardConfig = this.convertToWhiteboardConfig(config)

      // Set default options
      const whiteboardOptions: WhiteboardOptions = {
        quality: options.quality || 'standard',
        aspectRatio: options.aspectRatio || '16:9',
        skipAudio: options.skipAudio || false
      }

      // Generate video
      const videoUrl = await this.whiteboardService.execute(whiteboardConfig, whiteboardOptions, onProgress)

      return {
        success: true,
        videoUrl
      }
    } catch (error: any) {
      console.error('[AnimationGeneration] Video generation failed:', error)
      return {
        success: false,
        errors: [error.message || 'Failed to generate video']
      }
    }
  }

  /**
   * Convert animation config to whiteboard config format
   */
  private convertToWhiteboardConfig(config: AnimationConfig): any {
    return {
      slides: config.slides.map((slide) => ({
        index: slide.index,
        duration: slide.duration,
        layers: slide.layers.map((layer) => this.convertLayer(layer))
      })),
      transitions: config.transitions?.map((transition) => ({
        after_slide: transition.after_slide,
        type: transition.type,
        duration: transition.duration
      }))
    }
  }

  /**
   * Convert layer config to whiteboard layer format
   */
  private convertLayer(layer: any): any {
    const baseConfig = {
      type: layer.type,
      position: layer.position,
      z_index: layer.z_index,
      mode: layer.mode || 'draw',
      skip_rate: layer.skip_rate,
      scale: layer.scale,
      opacity: layer.opacity,
      entrance_animation: layer.entrance_animation
        ? {
            type: layer.entrance_animation.type,
            duration: layer.entrance_animation.duration
          }
        : undefined
    }

    switch (layer.type) {
      case 'text':
        return {
          ...baseConfig,
          text_config: {
            text: layer.text_config.text,
            font: layer.text_config.font || 'Arial',
            size: layer.text_config.size || 60,
            color: this.convertColor(layer.text_config.color),
            style: layer.text_config.style || 'normal',
            align: layer.text_config.align || 'center'
          }
        }

      case 'shape':
        return {
          ...baseConfig,
          shape_config: {
            shape: layer.shape_config.shape,
            color: this.convertColor(layer.shape_config.color),
            fill_color: this.convertColor(layer.shape_config.fill_color),
            stroke_width: layer.shape_config.stroke_width || 2,
            width: layer.shape_config.width || 100,
            height: layer.shape_config.height || 100,
            radius: layer.shape_config.radius
          }
        }

      case 'image':
        return {
          ...baseConfig,
          image_path: layer.image_path
        }

      case 'svg':
        return {
          ...baseConfig,
          svg_path: layer.svg_path
        }

      default:
        return baseConfig
    }
  }

  /**
   * Convert color from various formats to array format
   */
  private convertColor(color: any): number[] | string {
    if (Array.isArray(color)) {
      return color
    }
    if (typeof color === 'string') {
      return color
    }
    return [0, 0, 0]
  }

  /**
   * Validate and save animation configuration for later use
   */
  async validateAndSaveConfig(
    config: AnimationConfig
  ): Promise<{ success: boolean; configId?: string; errors?: string[] }> {
    // Validate configuration
    const validationErrors = this.validationService.validate(config)
    if (validationErrors.length > 0) {
      return {
        success: false,
        errors: validationErrors
      }
    }

    try {
      // Save configuration to temporary file
      const configId = randomUUID()
      const configPath = `/tmp/animation_config_${configId}.json`
      await writeFile(configPath, JSON.stringify(config, null, 2))

      return {
        success: true,
        configId
      }
    } catch (error: any) {
      console.error('[AnimationGeneration] Failed to save config:', error)
      return {
        success: false,
        errors: ['Failed to save configuration']
      }
    }
  }

  /**
   * Load saved animation configuration
   */
  async loadConfig(configId: string): Promise<{ success: boolean; config?: AnimationConfig; error?: string }> {
    try {
      const configPath = `/tmp/animation_config_${configId}.json`
      const { readFile } = await import('node:fs/promises')
      const configData = await readFile(configPath, 'utf-8')
      const config = JSON.parse(configData)

      // Clean up the file
      await unlink(configPath).catch(() => {})

      return {
        success: true,
        config
      }
    } catch (error: any) {
      console.error('[AnimationGeneration] Failed to load config:', error)
      return {
        success: false,
        error: 'Configuration not found or invalid'
      }
    }
  }
}
