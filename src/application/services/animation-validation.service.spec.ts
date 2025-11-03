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
                  duration: 1.0
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
                  duration: 0.05 // Too short
                }
              }
            ]
          }
        ]
      }

      const errors = service.validate(config)
      expect(errors.some((e) => e.includes('entrance animation duration must be at least 0.1 seconds'))).toBe(true)
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
