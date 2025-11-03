import type { AnimationConfig, LayerConfig, SlideConfig } from '@/domain/models/animation.model'

export class AnimationValidationService {
  /**
   * Validate animation configuration
   * Returns validation errors or null if valid
   */
  validate(config: AnimationConfig): string[] {
    const errors: string[] = []

    // Validate slides
    if (config.slides.length === 0) {
      errors.push('Configuration must have at least one slide')
    }

    // Validate each slide
    config.slides.forEach((slide, index) => {
      const slideErrors = this.validateSlide(slide, index)
      errors.push(...slideErrors)
    })

    // Validate transitions
    if (config.transitions) {
      config.transitions.forEach((transition, index) => {
        if (transition.after_slide >= config.slides.length) {
          errors.push(
            `Transition ${index}: after_slide index ${transition.after_slide} is out of bounds (max: ${config.slides.length - 1})`
          )
        }
        if (transition.duration < 0) {
          errors.push(`Transition ${index}: duration must be non-negative`)
        }
        if (transition.duration > 3) {
          errors.push(`Transition ${index}: duration cannot exceed 3 seconds`)
        }
      })
    }

    // Validate scene dimensions
    if (config.scene_width < 640 || config.scene_width > 7680) {
      errors.push('Scene width must be between 640 and 7680 pixels')
    }
    if (config.scene_height < 480 || config.scene_height > 4320) {
      errors.push('Scene height must be between 480 and 4320 pixels')
    }

    // Validate frame rate
    if (config.frame_rate < 24 || config.frame_rate > 60) {
      errors.push('Frame rate must be between 24 and 60 fps')
    }

    return errors
  }

  /**
   * Validate a single slide
   */
  private validateSlide(slide: SlideConfig, slideIndex: number): string[] {
    const errors: string[] = []

    if (slide.layers.length === 0) {
      errors.push(`Slide ${slideIndex}: must have at least one layer`)
    }

    if (slide.duration < 1) {
      errors.push(`Slide ${slideIndex}: duration must be at least 1 second`)
    }

    if (slide.duration > 60) {
      errors.push(`Slide ${slideIndex}: duration cannot exceed 60 seconds`)
    }

    // Validate each layer
    slide.layers.forEach((layer, layerIndex) => {
      const layerErrors = this.validateLayer(layer, slideIndex, layerIndex)
      errors.push(...layerErrors)
    })

    return errors
  }

  /**
   * Validate a single layer
   */
  private validateLayer(layer: LayerConfig, slideIndex: number, layerIndex: number): string[] {
    const errors: string[] = []

    // Validate layer type specific configurations
    switch (layer.type) {
      case 'text':
        if (!layer.text_config) {
          errors.push(`Slide ${slideIndex}, Layer ${layerIndex}: text layer must have text_config`)
        } else if (!layer.text_config.text || layer.text_config.text.length === 0) {
          errors.push(`Slide ${slideIndex}, Layer ${layerIndex}: text_config must have non-empty text`)
        }
        break

      case 'image':
        if (!layer.image_path) {
          errors.push(`Slide ${slideIndex}, Layer ${layerIndex}: image layer must have image_path`)
        }
        break

      case 'shape':
        if (!layer.shape_config) {
          errors.push(`Slide ${slideIndex}, Layer ${layerIndex}: shape layer must have shape_config`)
        }
        break

      case 'svg':
        if (!layer.svg_path) {
          errors.push(`Slide ${slideIndex}, Layer ${layerIndex}: svg layer must have svg_path`)
        }
        break
    }

    // Validate entrance animation if present
    if (layer.entrance_animation) {
      if (layer.entrance_animation.duration < 0) {
        errors.push(`Slide ${slideIndex}, Layer ${layerIndex}: entrance animation duration must be non-negative`)
      }
      if (layer.entrance_animation.duration > 5) {
        errors.push(`Slide ${slideIndex}, Layer ${layerIndex}: entrance animation duration cannot exceed 5 seconds`)
      }
    }

    // Validate exit animation if present
    if (layer.exit_animation) {
      if (layer.exit_animation.duration < 0) {
        errors.push(`Slide ${slideIndex}, Layer ${layerIndex}: exit animation duration must be non-negative`)
      }
      if (layer.exit_animation.duration > 5) {
        errors.push(`Slide ${slideIndex}, Layer ${layerIndex}: exit animation duration cannot exceed 5 seconds`)
      }
    }

    // Validate position is within scene bounds (with some margin for animations)
    if (layer.position.x < -1000 || layer.position.x > 3000) {
      errors.push(
        `Slide ${slideIndex}, Layer ${layerIndex}: x position ${layer.position.x} is out of reasonable bounds`
      )
    }
    if (layer.position.y < -1000 || layer.position.y > 2000) {
      errors.push(
        `Slide ${slideIndex}, Layer ${layerIndex}: y position ${layer.position.y} is out of reasonable bounds`
      )
    }

    return errors
  }

  /**
   * Check if configuration is valid
   */
  isValid(config: AnimationConfig): boolean {
    return this.validate(config).length === 0
  }
}
