import { createRoute, OpenAPIHono } from '@hono/zod-openapi'
import { z } from 'zod'
import { AnimationGenerationService } from '@/application/services/animation-generation.service'
import { AnimationValidationService } from '@/application/services/animation-validation.service'
import {
  AnimationConfigSchema,
  EntranceAnimationTypeSchema,
  LayerModeSchema,
  TransitionTypeSchema
} from '@/domain/models/animation.model'
import type { Routes } from '@/domain/types'

export class AnimationController implements Routes {
  public controller: OpenAPIHono
  private generationService: AnimationGenerationService
  private validationService: AnimationValidationService

  constructor() {
    this.controller = new OpenAPIHono()
    this.generationService = new AnimationGenerationService()
    this.validationService = new AnimationValidationService()
    this.initRoutes()
  }

  public initRoutes() {
    // Get supported animation types
    this.controller.openapi(
      createRoute({
        method: 'get',
        path: '/v1/animations/types',
        tags: ['Animations'],
        summary: 'Get all supported animation types',
        description: 'Returns lists of supported entrance animations, transitions, and layer modes',
        responses: {
          200: {
            description: 'Animation types retrieved successfully',
            content: {
              'application/json': {
                schema: z.object({
                  success: z.boolean(),
                  data: z.object({
                    entranceAnimations: z.array(z.string()),
                    transitions: z.array(z.string()),
                    layerModes: z.array(z.string())
                  })
                })
              }
            }
          }
        }
      }),
      (c: any) => {
        return c.json({
          success: true,
          data: {
            entranceAnimations: EntranceAnimationTypeSchema.options,
            transitions: TransitionTypeSchema.options,
            layerModes: LayerModeSchema.options
          }
        })
      }
    )

    // Validate animation configuration
    this.controller.openapi(
      createRoute({
        method: 'post',
        path: '/v1/animations/validate',
        tags: ['Animations'],
        summary: 'Validate animation configuration',
        description: 'Validates an animation configuration without generating video',
        request: {
          body: {
            content: {
              'application/json': {
                schema: AnimationConfigSchema
              }
            }
          }
        },
        responses: {
          200: {
            description: 'Validation completed',
            content: {
              'application/json': {
                schema: z.object({
                  success: z.boolean(),
                  valid: z.boolean(),
                  errors: z.array(z.string()).optional()
                })
              }
            }
          },
          400: {
            description: 'Invalid request body',
            content: {
              'application/json': {
                schema: z.object({
                  success: z.boolean(),
                  error: z.string()
                })
              }
            }
          }
        }
      }),
      async (c: any) => {
        try {
          const config = await c.req.json()

          // Validate with Zod schema first
          const parseResult = AnimationConfigSchema.safeParse(config)
          if (!parseResult.success) {
            return c.json(
              {
                success: false,
                valid: false,
                errors: parseResult.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`)
              },
              200
            )
          }

          // Validate with validation service
          const errors = this.validationService.validate(parseResult.data)

          return c.json({
            success: true,
            valid: errors.length === 0,
            errors: errors.length > 0 ? errors : undefined
          })
        } catch {
          return c.json({ success: false, error: 'Invalid configuration format' }, 400)
        }
      }
    )

    // Generate video from animation configuration
    this.controller.openapi(
      createRoute({
        method: 'post',
        path: '/v1/animations/generate',
        security: [{ Bearer: [] }],
        tags: ['Animations'],
        summary: 'Generate video from animation configuration',
        description: 'Generates a whiteboard animation video based on the provided configuration',
        request: {
          body: {
            content: {
              'application/json': {
                schema: z.object({
                  config: AnimationConfigSchema,
                  options: z
                    .object({
                      quality: z.enum(['preview', 'draft', 'standard', 'high']).optional().default('standard'),
                      aspectRatio: z.enum(['1:1', '16:9', '9:16']).optional().default('16:9'),
                      skipAudio: z.boolean().optional().default(false)
                    })
                    .optional()
                })
              }
            }
          }
        },
        responses: {
          200: {
            description: 'Video generation initiated',
            content: {
              'application/json': {
                schema: z.object({
                  success: z.boolean(),
                  videoUrl: z.string().optional(),
                  errors: z.array(z.string()).optional()
                })
              }
            }
          },
          401: {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: z.object({
                  success: z.boolean(),
                  error: z.string()
                })
              }
            }
          }
        }
      }),
      async (c: any) => {
        try {
          const user = c.get('user')
          if (!user) {
            return c.json({ success: false, error: 'Unauthorized' }, 401)
          }

          const body = await c.req.json()

          // Validate configuration with Zod
          const configParseResult = AnimationConfigSchema.safeParse(body.config)
          if (!configParseResult.success) {
            return c.json({
              success: false,
              errors: configParseResult.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`)
            })
          }

          // Generate video
          const result = await this.generationService.generateVideo(configParseResult.data, body.options || {})

          if (result.success) {
            return c.json({
              success: true,
              videoUrl: result.videoUrl
            })
          } else {
            return c.json({
              success: false,
              errors: result.errors
            })
          }
        } catch (error: any) {
          console.error('[AnimationController] Error generating video:', error)
          return c.json({ success: false, errors: [`Failed to generate video: ${error.message}`] }, 500)
        }
      }
    )

    // Get animation examples
    this.controller.openapi(
      createRoute({
        method: 'get',
        path: '/v1/animations/examples',
        tags: ['Animations'],
        summary: 'Get animation configuration examples',
        description: 'Returns example animation configurations for common use cases',
        responses: {
          200: {
            description: 'Examples retrieved successfully',
            content: {
              'application/json': {
                schema: z.object({
                  success: z.boolean(),
                  data: z.object({
                    simple: z.any(),
                    dynamic: z.any(),
                    textFocused: z.any()
                  })
                })
              }
            }
          }
        }
      }),
      (c: any) => {
        return c.json({
          success: true,
          data: {
            simple: {
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
                        size: 80,
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
            },
            dynamic: {
              scene_width: 1920,
              scene_height: 1080,
              background: '#FFFFFF',
              frame_rate: 30,
              slides: [
                {
                  index: 0,
                  duration: 3,
                  layers: [
                    {
                      type: 'text',
                      text_config: {
                        text: 'Main Title',
                        font: 'Arial',
                        size: 70,
                        color: [0, 0, 0]
                      },
                      position: { x: 960, y: 300 },
                      z_index: 1,
                      entrance_animation: {
                        type: 'zoom_in',
                        duration: 1
                      }
                    },
                    {
                      type: 'shape',
                      shape_config: {
                        shape: 'circle',
                        radius: 100,
                        fill_color: [255, 0, 0]
                      },
                      position: { x: 400, y: 600 },
                      z_index: 1,
                      entrance_animation: {
                        type: 'circleopen',
                        duration: 0.8
                      }
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
                        text: 'Thank You!',
                        font: 'Arial',
                        size: 100,
                        color: [255, 0, 0]
                      },
                      position: { x: 960, y: 540 },
                      z_index: 1,
                      entrance_animation: {
                        type: 'distance',
                        duration: 1.5
                      }
                    }
                  ]
                }
              ],
              transitions: [
                {
                  after_slide: 0,
                  type: 'zoom_out_in',
                  duration: 1
                }
              ]
            },
            textFocused: {
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
                        text: 'Introduction',
                        font: 'Arial',
                        size: 80,
                        color: [0, 0, 0],
                        style: 'bold'
                      },
                      position: { x: 960, y: 540 },
                      z_index: 1,
                      entrance_animation: {
                        type: 'fade_in',
                        duration: 1
                      }
                    }
                  ]
                },
                {
                  index: 1,
                  duration: 5,
                  layers: [
                    {
                      type: 'text',
                      text_config: {
                        text: 'Point 1',
                        font: 'Arial',
                        size: 60,
                        color: [0, 0, 0]
                      },
                      position: { x: 960, y: 400 },
                      z_index: 1,
                      entrance_animation: {
                        type: 'slide_in_left',
                        duration: 0.8
                      }
                    },
                    {
                      type: 'text',
                      text_config: {
                        text: 'Description of point 1',
                        font: 'Arial',
                        size: 40,
                        color: [100, 100, 100]
                      },
                      position: { x: 960, y: 600 },
                      z_index: 1,
                      entrance_animation: {
                        type: 'fade_in',
                        duration: 0.5
                      }
                    }
                  ]
                }
              ],
              transitions: [
                {
                  after_slide: 0,
                  type: 'push_left',
                  duration: 0.5
                }
              ]
            }
          }
        })
      }
    )
  }
}
