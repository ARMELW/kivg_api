import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import type { Routes } from '@/domain/types'
import { imageGenerator, scriptGenerator, VOICE_LIBRARY, getVoicesByLanguage, isAIAvailable } from '../config/ai.config'

export class AIController implements Routes {
  public controller: OpenAPIHono

  constructor() {
    this.controller = new OpenAPIHono()
  }

  public initRoutes() {
    // Health check endpoint
    this.controller.openapi(
      createRoute({
        method: 'get',
        path: '/v1/ai/status',
        tags: ['AI'],
        summary: 'Check AI services availability',
        description: 'Check which AI services are available and configured',
        responses: {
          200: {
            description: 'AI services status',
            content: {
              'application/json': {
                schema: z.object({
                  success: z.boolean(),
                  data: z.object({
                    imageGenerator: z.boolean(),
                    scriptGenerator: z.boolean(),
                    voiceSynthesis: z.boolean()
                  })
                })
              }
            }
          }
        }
      }),
      (c: any) => {
        const status = isAIAvailable()
        return c.json({
          success: true,
          data: {
            ...status,
            voiceSynthesis: true // Always available as it's configured
          }
        })
      }
    )

    // Generate image prompt
    this.controller.openapi(
      createRoute({
        method: 'post',
        path: '/v1/ai/generate-image-prompt',
        tags: ['AI'],
        summary: 'Generate enhanced image prompt',
        description: 'Generate an enhanced prompt for image generation',
        request: {
          body: {
            content: {
              'application/json': {
                schema: z.object({
                  prompt: z.string(),
                  style: z.enum(['realistic', 'cartoon', 'anime', 'artistic', 'minimal']).optional()
                })
              }
            }
          }
        },
        responses: {
          200: {
            description: 'Image prompt generated successfully',
            content: {
              'application/json': {
                schema: z.object({
                  success: z.boolean(),
                  data: z.object({
                    enhancedPrompt: z.string()
                  })
                })
              }
            }
          },
          400: {
            description: 'Bad request',
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
        if (!imageGenerator) {
          return c.json({ success: false, error: 'Image generator not configured' }, 400)
        }

        const { prompt, style } = await c.req.json()
        const result = await imageGenerator.generateImage({ prompt, style })

        if (result.success) {
          return c.json({
            success: true,
            data: { enhancedPrompt: result.imageUrl }
          })
        } else {
          return c.json({ success: false, error: result.error }, 400)
        }
      }
    )

    // Generate script
    this.controller.openapi(
      createRoute({
        method: 'post',
        path: '/v1/ai/generate-script',
        tags: ['AI'],
        summary: 'Generate video script',
        description: 'Generate a video script using AI',
        request: {
          body: {
            content: {
              'application/json': {
                schema: z.object({
                  topic: z.string(),
                  tone: z.enum(['professional', 'casual', 'educational', 'entertaining', 'inspiring']).optional(),
                  length: z.enum(['short', 'medium', 'long']).optional(),
                  style: z.enum(['narrative', 'conversational', 'instructional']).optional(),
                  targetAudience: z.string().optional()
                })
              }
            }
          }
        },
        responses: {
          200: {
            description: 'Script generated successfully',
            content: {
              'application/json': {
                schema: z.object({
                  success: z.boolean(),
                  data: z.object({
                    script: z.string(),
                    scenes: z.array(
                      z.object({
                        id: z.string(),
                        text: z.string(),
                        duration: z.number(),
                        imagePrompt: z.string().optional(),
                        notes: z.string().optional()
                      })
                    )
                  })
                })
              }
            }
          },
          400: {
            description: 'Bad request',
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
        if (!scriptGenerator) {
          return c.json({ success: false, error: 'Script generator not configured' }, 400)
        }

        const params = await c.req.json()
        const result = await scriptGenerator.generateScript(params)

        if (result.success) {
          return c.json({
            success: true,
            data: {
              script: result.script,
              scenes: result.scenes
            }
          })
        } else {
          return c.json({ success: false, error: result.error }, 400)
        }
      }
    )

    // List available voices
    this.controller.openapi(
      createRoute({
        method: 'get',
        path: '/v1/ai/voices',
        tags: ['AI'],
        summary: 'List available voices',
        description: 'Get list of all available voices for voice synthesis',
        request: {
          query: z.object({
            language: z.string().optional()
          })
        },
        responses: {
          200: {
            description: 'Voices retrieved successfully',
            content: {
              'application/json': {
                schema: z.object({
                  success: z.boolean(),
                  data: z.object({
                    voices: z.array(
                      z.object({
                        id: z.string(),
                        name: z.string(),
                        language: z.string(),
                        gender: z.enum(['male', 'female', 'neutral']),
                        style: z.string()
                      })
                    ),
                    total: z.number()
                  })
                })
              }
            }
          }
        }
      }),
      (c: any) => {
        const { language } = c.req.query()
        const voices = language ? getVoicesByLanguage(language) : VOICE_LIBRARY

        return c.json({
          success: true,
          data: {
            voices,
            total: voices.length
          }
        })
      }
    )

    // Placeholder for voice synthesis
    this.controller.openapi(
      createRoute({
        method: 'post',
        path: '/v1/ai/synthesize-voice',
        tags: ['AI'],
        summary: 'Synthesize voice (placeholder)',
        description: 'Generate voice audio from text (requires TTS service integration)',
        request: {
          body: {
            content: {
              'application/json': {
                schema: z.object({
                  text: z.string(),
                  voice: z.string(),
                  language: z.string(),
                  speed: z.number().optional(),
                  pitch: z.number().optional()
                })
              }
            }
          }
        },
        responses: {
          501: {
            description: 'Not implemented',
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
      (c: any) => {
        return c.json({
          success: false,
          error: 'Voice synthesis requires integration with a TTS service (e.g., Google Cloud TTS, Azure TTS, ElevenLabs)'
        }, 501)
      }
    )
  }
}
