import { beforeEach, describe, expect, it } from 'vitest'
import type { AnimationConfig } from '@/domain/models/animation.model'
import { AnimationValidationService } from './animation-validation.service'

describe('AnimationValidationService', () => {
  let service: AnimationValidationService

  beforeEach(() => {
    service = new AnimationValidationService()
  })

  describe('validate', () => {
    it('should validate a correct animation configuration', () => {
      const config: AnimationConfig = {
        scene_width: 1920,
        scene_height: 1080,
        background: '#FFFFFF',
        frame_rate: 30,
        slides: [
          {
            index: 0,
            duration: 4,
            layers: [
              {
                type: 'text',
                text_config: {
                  text: 'Hello World',
                  font: 'Arial',
                  size: 60,
                  color: [0, 0, 0],
                  style: 'bold',
                  align: 'center'
                },
                position: { x: 960, y: 540 },
                z_index: 1,
                entrance_animation: {
                  type: 'fade_in',
                  duration: 1
                }
              }
            ]
          }
        ]
      }

      const errors = service.validate(config)
      expect(errors).toHaveLength(0)
    })

    it('should reject configuration with no slides', () => {
      const config: any = {
        scene_width: 1920,
        scene_height: 1080,
        background: '#FFFFFF',
        frame_rate: 30,
        slides: []
      }

      const errors = service.validate(config)
      expect(errors).toContain('Configuration must have at least one slide')
    })

    it('should reject slide with no layers', () => {
      const config: any = {
        scene_width: 1920,
        scene_height: 1080,
        background: '#FFFFFF',
        frame_rate: 30,
        slides: [
          {
            index: 0,
            duration: 4,
            layers: []
          }
        ]
      }

      const errors = service.validate(config)
      expect(errors.some((e) => e.includes('must have at least one layer'))).toBe(true)
    })

    it('should reject text layer without text_config', () => {
      const config: any = {
        scene_width: 1920,
        scene_height: 1080,
        background: '#FFFFFF',
        frame_rate: 30,
        slides: [
          {
            index: 0,
            duration: 4,
            layers: [
              {
                type: 'text',
                position: { x: 960, y: 540 },
                z_index: 1
              }
            ]
          }
        ]
      }

      const errors = service.validate(config)
      expect(errors.some((e) => e.includes('must have text_config'))).toBe(true)
    })

    it('should reject image layer without image_path', () => {
      const config: any = {
        scene_width: 1920,
        scene_height: 1080,
        background: '#FFFFFF',
        frame_rate: 30,
        slides: [
          {
            index: 0,
            duration: 4,
            layers: [
              {
                type: 'image',
                position: { x: 960, y: 540 },
                z_index: 1
              }
            ]
          }
        ]
      }

      const errors = service.validate(config)
      expect(errors.some((e) => e.includes('must have image_path'))).toBe(true)
    })

    it('should reject invalid entrance animation duration', () => {
      const config: AnimationConfig = {
        scene_width: 1920,
        scene_height: 1080,
        background: '#FFFFFF',
        frame_rate: 30,
        slides: [
          {
            index: 0,
            duration: 4,
            layers: [
              {
                type: 'text',
                text_config: {
                  text: 'Hello World',
                  font: 'Arial',
                  size: 60,
                  color: [0, 0, 0]
                },
                position: { x: 960, y: 540 },
                z_index: 1,
                entrance_animation: {
                  type: 'fade_in',
                  duration: -1 // Negative
                }
              }
            ]
          }
        ]
      }

      const errors = service.validate(config)
      expect(errors.some((e) => e.includes('entrance animation duration must be non-negative'))).toBe(true)
    })

    it('should validate new entrance animations', () => {
      const animationTypes = [
        'bounce_in',
        'rotate_in',
        'spin_in',
        'flip_in_x',
        'flip_in_horizontal',
        'flip_in_y',
        'flip_in_vertical',
        'blur_in',
        'focus_in',
        'back_in',
        'elastic_in',
        'scale_pulse'
      ]

      animationTypes.forEach((type) => {
        const config: AnimationConfig = {
          scene_width: 1920,
          scene_height: 1080,
          background: '#FFFFFF',
          frame_rate: 30,
          slides: [
            {
              index: 0,
              duration: 4,
              layers: [
                {
                  type: 'text',
                  text_config: {
                    text: 'Test',
                    font: 'Arial',
                    size: 60,
                    color: [0, 0, 0]
                  },
                  position: { x: 960, y: 540 },
                  z_index: 1,
                  entrance_animation: {
                    type: type as any,
                    duration: 1
                  }
                }
              ]
            }
          ]
        }

        const errors = service.validate(config)
        expect(errors).toHaveLength(0)
      })
    })

    it('should validate exit animations', () => {
      const config: AnimationConfig = {
        scene_width: 1920,
        scene_height: 1080,
        background: '#FFFFFF',
        frame_rate: 30,
        slides: [
          {
            index: 0,
            duration: 4,
            layers: [
              {
                type: 'text',
                text_config: {
                  text: 'Hello World',
                  font: 'Arial',
                  size: 60,
                  color: [0, 0, 0]
                },
                position: { x: 960, y: 540 },
                z_index: 1,
                entrance_animation: {
                  type: 'fade_in',
                  duration: 1
                },
                exit_animation: {
                  type: 'fade_out',
                  duration: 0.8
                }
              }
            ]
          }
        ]
      }

      const errors = service.validate(config)
      expect(errors).toHaveLength(0)
    })

    it('should validate all exit animation types', () => {
      const exitTypes = [
        'fade_out',
        'slide_out_left',
        'slide_out_right',
        'slide_out_top',
        'slide_out_bottom',
        'zoom_out',
        'bounce_out',
        'rotate_out',
        'spin_out',
        'flip_out_x',
        'flip_out_horizontal',
        'flip_out_y',
        'flip_out_vertical',
        'scale_out',
        'blur_out',
        'focus_out',
        'elastic_out'
      ]

      exitTypes.forEach((type) => {
        const config: AnimationConfig = {
          scene_width: 1920,
          scene_height: 1080,
          background: '#FFFFFF',
          frame_rate: 30,
          slides: [
            {
              index: 0,
              duration: 4,
              layers: [
                {
                  type: 'text',
                  text_config: {
                    text: 'Test',
                    font: 'Arial',
                    size: 60,
                    color: [0, 0, 0]
                  },
                  position: { x: 960, y: 540 },
                  z_index: 1,
                  exit_animation: {
                    type: type as any,
                    duration: 0.8
                  }
                }
              ]
            }
          ]
        }

        const errors = service.validate(config)
        expect(errors).toHaveLength(0)
      })
    })

    it('should validate easing functions on entrance animations', () => {
      const easingFunctions = [
        'linear',
        'ease_in',
        'ease_out',
        'ease_in_out',
        'ease_in_cubic',
        'ease_out_cubic',
        'bounce_in',
        'bounce_out',
        'bounce_in_out',
        'elastic_in',
        'elastic_out',
        'elastic_in_out',
        'back_in',
        'back_out',
        'back_in_out'
      ]

      easingFunctions.forEach((easing) => {
        const config: AnimationConfig = {
          scene_width: 1920,
          scene_height: 1080,
          background: '#FFFFFF',
          frame_rate: 30,
          slides: [
            {
              index: 0,
              duration: 4,
              layers: [
                {
                  type: 'text',
                  text_config: {
                    text: 'Test',
                    font: 'Arial',
                    size: 60,
                    color: [0, 0, 0]
                  },
                  position: { x: 960, y: 540 },
                  z_index: 1,
                  entrance_animation: {
                    type: 'slide_in_left',
                    duration: 1,
                    easing: easing as any
                  }
                }
              ]
            }
          ]
        }

        const errors = service.validate(config)
        expect(errors).toHaveLength(0)
      })
    })

    it('should validate new transition types', () => {
      const newTransitions = [
        'crossfade_blur',
        'diagonal_wipe',
        'dissolve',
        'morph',
        'box_in',
        'box_out',
        'clock_wipe',
        'radial_wipe',
        'rotate_transition',
        'spin_transition',
        'none'
      ]

      newTransitions.forEach((type) => {
        const config: AnimationConfig = {
          scene_width: 1920,
          scene_height: 1080,
          background: '#FFFFFF',
          frame_rate: 30,
          slides: [
            {
              index: 0,
              duration: 4,
              layers: [
                {
                  type: 'text',
                  text_config: {
                    text: 'Slide 1',
                    font: 'Arial',
                    size: 60,
                    color: [0, 0, 0]
                  },
                  position: { x: 960, y: 540 },
                  z_index: 1
                }
              ]
            },
            {
              index: 1,
              duration: 4,
              layers: [
                {
                  type: 'text',
                  text_config: {
                    text: 'Slide 2',
                    font: 'Arial',
                    size: 60,
                    color: [0, 0, 0]
                  },
                  position: { x: 960, y: 540 },
                  z_index: 1
                }
              ]
            }
          ],
          transitions: [
            {
              after_slide: 0,
              type: type as any,
              duration: 0.5
            }
          ]
        }

        const errors = service.validate(config)
        expect(errors).toHaveLength(0)
      })
    })

    it('should validate easing on transitions', () => {
      const config: AnimationConfig = {
        scene_width: 1920,
        scene_height: 1080,
        background: '#FFFFFF',
        frame_rate: 30,
        slides: [
          {
            index: 0,
            duration: 4,
            layers: [
              {
                type: 'text',
                text_config: {
                  text: 'Slide 1',
                  font: 'Arial',
                  size: 60,
                  color: [0, 0, 0]
                },
                position: { x: 960, y: 540 },
                z_index: 1
              }
            ]
          },
          {
            index: 1,
            duration: 4,
            layers: [
              {
                type: 'text',
                text_config: {
                  text: 'Slide 2',
                  font: 'Arial',
                  size: 60,
                  color: [0, 0, 0]
                },
                position: { x: 960, y: 540 },
                z_index: 1
              }
            ]
          }
        ],
        transitions: [
          {
            after_slide: 0,
            type: 'fade',
            duration: 0.5,
            easing: 'ease_in_out'
          }
        ]
      }

      const errors = service.validate(config)
      expect(errors).toHaveLength(0)
    })

    it('should reject invalid transition after_slide index', () => {
      const config: AnimationConfig = {
        scene_width: 1920,
        scene_height: 1080,
        background: '#FFFFFF',
        frame_rate: 30,
        slides: [
          {
            index: 0,
            duration: 4,
            layers: [
              {
                type: 'text',
                text_config: {
                  text: 'Hello World',
                  font: 'Arial',
                  size: 60,
                  color: [0, 0, 0]
                },
                position: { x: 960, y: 540 },
                z_index: 1
              }
            ]
          }
        ],
        transitions: [
          {
            after_slide: 5, // Out of bounds
            type: 'fade',
            duration: 0.5
          }
        ]
      }

      const errors = service.validate(config)
      expect(errors.some((e) => e.includes('is out of bounds'))).toBe(true)
    })
  })

  describe('isValid', () => {
    it('should return true for valid configuration', () => {
      const config: AnimationConfig = {
        scene_width: 1920,
        scene_height: 1080,
        background: '#FFFFFF',
        frame_rate: 30,
        slides: [
          {
            index: 0,
            duration: 4,
            layers: [
              {
                type: 'text',
                text_config: {
                  text: 'Hello World',
                  font: 'Arial',
                  size: 60,
                  color: [0, 0, 0]
                },
                position: { x: 960, y: 540 },
                z_index: 1
              }
            ]
          }
        ]
      }

      expect(service.isValid(config)).toBe(true)
    })

    it('should return false for invalid configuration', () => {
      const config: any = {
        scene_width: 1920,
        scene_height: 1080,
        background: '#FFFFFF',
        frame_rate: 30,
        slides: []
      }

      expect(service.isValid(config)).toBe(false)
    })
  })
})
