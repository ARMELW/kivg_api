import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import type { Routes } from '@/domain/types'
import {
  getAIProviders,
  getVoices,
  imageGenerator,
  isAIAvailable,
  musicGenerator,
  scriptGenerator,
  voiceSynthesis
} from '../config/ai.config'
import { TrackAIGenerationUseCase } from '@/application/use-cases/ai-usage/track-ai-generation.use-case'
import { AIUsageRepository } from '../repositories/ai-usage.repository'
import { StripeUsageBillingService } from '@/application/services/stripe-usage-billing.service'

export class AIController implements Routes {
  public controller: OpenAPIHono
  private aiUsageRepository: AIUsageRepository
  private trackAIGenerationUseCase: TrackAIGenerationUseCase
  private stripeUsageBillingService: StripeUsageBillingService

  constructor() {
    this.controller = new OpenAPIHono()
    this.aiUsageRepository = new AIUsageRepository()
    this.trackAIGenerationUseCase = new TrackAIGenerationUseCase(this.aiUsageRepository)
    this.stripeUsageBillingService = new StripeUsageBillingService(this.aiUsageRepository)
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
                    voiceSynthesis: z.boolean(),
                    musicGenerator: z.boolean(),
                    providers: z.object({
                      imageGenerators: z.array(z.string()),
                      voiceProviders: z.array(z.string()),
                      scriptProviders: z.array(z.string()),
                      musicProviders: z.array(z.string())
                    })
                  })
                })
              }
            }
          }
        }
      }),
      (c: any) => {
        const status = isAIAvailable()
        const providers = getAIProviders()
        return c.json({
          success: true,
          data: {
            ...status,
            providers
          }
        })
      }
    )

    // Generate image prompt or direct image
    this.controller.openapi(
      createRoute({
        method: 'post',
        path: '/v1/ai/generate-image-prompt',
        tags: ['AI'],
        summary: 'Generate enhanced image prompt or direct image',
        description:
          'Generate an enhanced prompt for image generation (Gemini) or direct image URL (DALL-E). Returns enhanced prompt if using Gemini, or image URL if using DALL-E.',
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
            description: 'Image prompt or URL generated successfully',
            content: {
              'application/json': {
                schema: z.object({
                  success: z.boolean(),
                  data: z.object({
                    enhancedPrompt: z.string(),
                    imageUrl: z.string().optional(),
                    provider: z.string()
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

        const user = c.get('user')
        const { prompt, style } = await c.req.json()
        const result = await imageGenerator.generateImage({ prompt, style })

        if (result.success) {
          // Track usage if user is authenticated
          if (user) {
            await this.trackAIGenerationUseCase.execute({
              userId: user.id,
              type: 'image'
            })
          }

          // DALL-E returns actual image URL, Gemini returns enhanced prompt
          const isDalle = imageGenerator.name === 'dalle'
          return c.json({
            success: true,
            data: {
              enhancedPrompt: isDalle ? prompt : result.imageUrl,
              imageUrl: isDalle ? result.imageUrl : undefined,
              provider: imageGenerator.name
            }
          })
        } else {
          return c.json({ success: false, error: result.error }, 400)
        }
      }
    )

    // Direct image generation endpoint
    this.controller.openapi(
      createRoute({
        method: 'post',
        path: '/v1/ai/generate-image',
        tags: ['AI'],
        summary: 'Generate image with DALL-E',
        description: 'Generate a direct image using DALL-E 3',
        request: {
          body: {
            content: {
              'application/json': {
                schema: z.object({
                  prompt: z.string(),
                  style: z.enum(['realistic', 'cartoon', 'anime', 'artistic', 'minimal']).optional(),
                  size: z.enum(['1024x1024', '1024x1792', '1792x1024']).optional(),
                  quality: z.enum(['standard', 'hd']).optional()
                })
              }
            }
          }
        },
        responses: {
          200: {
            description: 'Image generated successfully',
            content: {
              'application/json': {
                schema: z.object({
                  success: z.boolean(),
                  data: z.object({
                    imageUrl: z.string()
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
          },
          503: {
            description: 'Service unavailable',
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
        if (!imageGenerator || imageGenerator.name !== 'dalle') {
          return c.json(
            {
              success: false,
              error: 'DALL-E image generation not configured. Please set OPENAI_API_KEY in environment variables.'
            },
            503
          )
        }

        const user = c.get('user')
        const params = await c.req.json()
        const result = await imageGenerator.generateImage(params)

        if (result.success) {
          // Track usage if user is authenticated
          if (user) {
            await this.trackAIGenerationUseCase.execute({
              userId: user.id,
              type: 'image'
            })
          }

          return c.json({
            success: true,
            data: {
              imageUrl: result.imageUrl
            }
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

        // Check authentication for usage tracking
        const user = c.get('user')
        
        const params = await c.req.json()
        const result = await scriptGenerator.generateScript(params)

        if (result.success) {
          // Track usage if user is authenticated
          if (user) {
            await this.trackAIGenerationUseCase.execute({
              userId: user.id,
              type: 'script'
            })
          }

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
      async (c: any) => {
        try {
          const { language } = c.req.query()
          const voices = await getVoices(language)

          return c.json({
            success: true,
            data: {
              voices,
              total: voices.length
            }
          })
        } catch (error: any) {
          return c.json(
            {
              success: false,
              error: error.message || 'Failed to fetch voices'
            },
            500
          )
        }
      }
    )

    // Voice synthesis with ElevenLabs
    this.controller.openapi(
      createRoute({
        method: 'post',
        path: '/v1/ai/synthesize-voice',
        tags: ['AI'],
        summary: 'Synthesize voice with ElevenLabs',
        description: 'Generate voice audio from text using ElevenLabs TTS',
        request: {
          body: {
            content: {
              'application/json': {
                schema: z.object({
                  text: z.string().min(1).max(5000),
                  voice: z.string(),
                  language: z.enum(['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh']),
                  speed: z.number().min(0.5).max(2).optional().default(1),
                  pitch: z.number().min(-20).max(20).optional().default(0)
                })
              }
            }
          }
        },
        responses: {
          200: {
            description: 'Voice synthesized successfully',
            content: {
              'application/json': {
                schema: z.object({
                  success: z.boolean(),
                  data: z.object({
                    audioUrl: z.string(),
                    duration: z.number()
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
          },
          503: {
            description: 'Service unavailable',
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
        if (!voiceSynthesis) {
          return c.json(
            {
              success: false,
              error: 'Voice synthesis service not configured. Please set ELEVENLABS_API_KEY in environment variables.'
            },
            503
          )
        }

        const user = c.get('user')

        try {
          const params = await c.req.json()
          const result = await voiceSynthesis.generateVoice(params)

          if (result.success) {
            // Track usage if user is authenticated
            if (user) {
              await this.trackAIGenerationUseCase.execute({
                userId: user.id,
                type: 'voice'
              })
            }

            return c.json({
              success: true,
              data: {
                audioUrl: result.audioUrl,
                duration: result.duration
              }
            })
          } else {
            return c.json({ success: false, error: result.error }, 400)
          }
        } catch (error: any) {
          return c.json(
            {
              success: false,
              error: error.message || 'Failed to synthesize voice'
            },
            400
          )
        }
      }
    )

    // Generate music with Mubert
    this.controller.openapi(
      createRoute({
        method: 'post',
        path: '/v1/ai/generate-music',
        tags: ['AI'],
        summary: 'Generate background music with AI',
        description: 'Generate AI-powered background music using Mubert',
        request: {
          body: {
            content: {
              'application/json': {
                schema: z.object({
                  duration: z.number().min(10).max(300),
                  mood: z
                    .enum(['happy', 'sad', 'energetic', 'calm', 'dramatic', 'inspiring', 'mysterious', 'romantic'])
                    .optional(),
                  genre: z
                    .enum(['electronic', 'acoustic', 'classical', 'ambient', 'cinematic', 'corporate', 'pop', 'rock'])
                    .optional(),
                  tempo: z.enum(['slow', 'medium', 'fast']).optional()
                })
              }
            }
          }
        },
        responses: {
          200: {
            description: 'Music generated successfully',
            content: {
              'application/json': {
                schema: z.object({
                  success: z.boolean(),
                  data: z.object({
                    audioUrl: z.string(),
                    duration: z.number()
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
          },
          503: {
            description: 'Service unavailable',
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
        if (!musicGenerator) {
          return c.json(
            {
              success: false,
              error: 'Music generation service not configured. Please set MUBERT_API_KEY in environment variables.'
            },
            503
          )
        }

        const user = c.get('user')

        try {
          const params = await c.req.json()
          const result = await musicGenerator.generateMusic(params)

          if (result.success) {
            // Track usage if user is authenticated
            if (user) {
              await this.trackAIGenerationUseCase.execute({
                userId: user.id,
                type: 'music'
              })
            }

            return c.json({
              success: true,
              data: {
                audioUrl: result.audioUrl,
                duration: result.duration
              }
            })
          } else {
            return c.json({ success: false, error: result.error }, 400)
          }
        } catch (error: any) {
          return c.json(
            {
              success: false,
              error: error.message || 'Failed to generate music'
            },
            400
          )
        }
      }
    )
  }
}
