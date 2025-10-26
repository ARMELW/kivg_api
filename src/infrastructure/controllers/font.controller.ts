import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import type { Routes } from '@/domain/types'

// Predefined font library (would normally be in database)
const FONT_LIBRARY = [
  // Sans-serif fonts
  {
    id: 'roboto',
    name: 'Roboto',
    family: 'Roboto',
    category: 'sans-serif',
    variants: ['regular', 'bold', 'italic'],
    weights: [400, 700],
    isPremium: false,
    isPopular: true
  },
  {
    id: 'open-sans',
    name: 'Open Sans',
    family: 'Open Sans',
    category: 'sans-serif',
    variants: ['regular', 'bold', 'italic'],
    weights: [400, 700],
    isPremium: false,
    isPopular: true
  },
  {
    id: 'lato',
    name: 'Lato',
    family: 'Lato',
    category: 'sans-serif',
    variants: ['regular', 'bold', 'italic'],
    weights: [400, 700],
    isPremium: false,
    isPopular: true
  },
  {
    id: 'montserrat',
    name: 'Montserrat',
    family: 'Montserrat',
    category: 'sans-serif',
    variants: ['regular', 'bold'],
    weights: [400, 700],
    isPremium: false,
    isPopular: true
  },
  {
    id: 'poppins',
    name: 'Poppins',
    family: 'Poppins',
    category: 'sans-serif',
    variants: ['regular', 'bold'],
    weights: [400, 700],
    isPremium: false,
    isPopular: true
  },
  {
    id: 'inter',
    name: 'Inter',
    family: 'Inter',
    category: 'sans-serif',
    variants: ['regular', 'bold'],
    weights: [400, 700],
    isPremium: false,
    isPopular: true
  },
  {
    id: 'nunito',
    name: 'Nunito',
    family: 'Nunito',
    category: 'sans-serif',
    variants: ['regular', 'bold'],
    weights: [400, 700],
    isPremium: false,
    isPopular: false
  },
  {
    id: 'raleway',
    name: 'Raleway',
    family: 'Raleway',
    category: 'sans-serif',
    variants: ['regular', 'bold'],
    weights: [400, 700],
    isPremium: false,
    isPopular: false
  },
  {
    id: 'work-sans',
    name: 'Work Sans',
    family: 'Work Sans',
    category: 'sans-serif',
    variants: ['regular', 'bold'],
    weights: [400, 700],
    isPremium: true,
    isPopular: false
  },
  {
    id: 'source-sans',
    name: 'Source Sans Pro',
    family: 'Source Sans Pro',
    category: 'sans-serif',
    variants: ['regular', 'bold'],
    weights: [400, 700],
    isPremium: true,
    isPopular: false
  },

  // Serif fonts
  {
    id: 'playfair',
    name: 'Playfair Display',
    family: 'Playfair Display',
    category: 'serif',
    variants: ['regular', 'bold'],
    weights: [400, 700],
    isPremium: false,
    isPopular: true
  },
  {
    id: 'merriweather',
    name: 'Merriweather',
    family: 'Merriweather',
    category: 'serif',
    variants: ['regular', 'bold', 'italic'],
    weights: [400, 700],
    isPremium: false,
    isPopular: false
  },
  {
    id: 'lora',
    name: 'Lora',
    family: 'Lora',
    category: 'serif',
    variants: ['regular', 'bold', 'italic'],
    weights: [400, 700],
    isPremium: false,
    isPopular: false
  },
  {
    id: 'crimson-text',
    name: 'Crimson Text',
    family: 'Crimson Text',
    category: 'serif',
    variants: ['regular', 'bold'],
    weights: [400, 700],
    isPremium: true,
    isPopular: false
  },
  {
    id: 'libre-baskerville',
    name: 'Libre Baskerville',
    family: 'Libre Baskerville',
    category: 'serif',
    variants: ['regular', 'bold'],
    weights: [400, 700],
    isPremium: true,
    isPopular: false
  },

  // Display fonts
  {
    id: 'bebas-neue',
    name: 'Bebas Neue',
    family: 'Bebas Neue',
    category: 'display',
    variants: ['regular', 'bold'],
    weights: [400, 700],
    isPremium: false,
    isPopular: true
  },
  {
    id: 'oswald',
    name: 'Oswald',
    family: 'Oswald',
    category: 'display',
    variants: ['regular', 'bold'],
    weights: [400, 700],
    isPremium: false,
    isPopular: false
  },
  {
    id: 'anton',
    name: 'Anton',
    family: 'Anton',
    category: 'display',
    variants: ['regular'],
    weights: [400],
    isPremium: false,
    isPopular: false
  },
  {
    id: 'bangers',
    name: 'Bangers',
    family: 'Bangers',
    category: 'display',
    variants: ['regular'],
    weights: [400],
    isPremium: true,
    isPopular: false
  },
  {
    id: 'righteous',
    name: 'Righteous',
    family: 'Righteous',
    category: 'display',
    variants: ['regular'],
    weights: [400],
    isPremium: true,
    isPopular: false
  },

  // Handwriting fonts
  {
    id: 'pacifico',
    name: 'Pacifico',
    family: 'Pacifico',
    category: 'handwriting',
    variants: ['regular'],
    weights: [400],
    isPremium: false,
    isPopular: true
  },
  {
    id: 'dancing-script',
    name: 'Dancing Script',
    family: 'Dancing Script',
    category: 'handwriting',
    variants: ['regular', 'bold'],
    weights: [400, 700],
    isPremium: false,
    isPopular: false
  },
  {
    id: 'satisfy',
    name: 'Satisfy',
    family: 'Satisfy',
    category: 'handwriting',
    variants: ['regular'],
    weights: [400],
    isPremium: true,
    isPopular: false
  },
  {
    id: 'caveat',
    name: 'Caveat',
    family: 'Caveat',
    category: 'handwriting',
    variants: ['regular', 'bold'],
    weights: [400, 700],
    isPremium: true,
    isPopular: false
  },

  // Monospace fonts
  {
    id: 'roboto-mono',
    name: 'Roboto Mono',
    family: 'Roboto Mono',
    category: 'monospace',
    variants: ['regular', 'bold'],
    weights: [400, 700],
    isPremium: false,
    isPopular: true
  },
  {
    id: 'source-code-pro',
    name: 'Source Code Pro',
    family: 'Source Code Pro',
    category: 'monospace',
    variants: ['regular', 'bold'],
    weights: [400, 700],
    isPremium: false,
    isPopular: false
  },
  {
    id: 'fira-code',
    name: 'Fira Code',
    family: 'Fira Code',
    category: 'monospace',
    variants: ['regular', 'bold'],
    weights: [400, 700],
    isPremium: true,
    isPopular: false
  },
  {
    id: 'jetbrains-mono',
    name: 'JetBrains Mono',
    family: 'JetBrains Mono',
    category: 'monospace',
    variants: ['regular', 'bold'],
    weights: [400, 700],
    isPremium: true,
    isPopular: false
  }
]

export class FontController implements Routes {
  public controller: OpenAPIHono

  constructor() {
    this.controller = new OpenAPIHono()
  }

  public initRoutes() {
    // List all fonts
    this.controller.openapi(
      createRoute({
        method: 'get',
        path: '/v1/fonts',
        tags: ['Fonts'],
        summary: 'List all fonts',
        description: 'Get list of all available fonts with filtering options',
        request: {
          query: z.object({
            category: z.enum(['serif', 'sans-serif', 'display', 'handwriting', 'monospace']).optional(),
            isPremium: z.string().optional(), // 'true' or 'false'
            isPopular: z.string().optional(),
            search: z.string().optional()
          })
        },
        responses: {
          200: {
            description: 'Fonts retrieved successfully',
            content: {
              'application/json': {
                schema: z.object({
                  success: z.boolean(),
                  data: z.object({
                    fonts: z.array(
                      z.object({
                        id: z.string(),
                        name: z.string(),
                        family: z.string(),
                        category: z.string(),
                        variants: z.array(z.string()),
                        weights: z.array(z.number()),
                        isPremium: z.boolean(),
                        isPopular: z.boolean()
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
        const { category, isPremium, isPopular, search } = c.req.query()

        let fonts = [...FONT_LIBRARY]

        if (category) {
          fonts = fonts.filter((f) => f.category === category)
        }

        if (isPremium !== undefined) {
          const premium = isPremium === 'true'
          fonts = fonts.filter((f) => f.isPremium === premium)
        }

        if (isPopular !== undefined) {
          const popular = isPopular === 'true'
          fonts = fonts.filter((f) => f.isPopular === popular)
        }

        if (search) {
          const searchLower = search.toLowerCase()
          fonts = fonts.filter(
            (f) => f.name.toLowerCase().includes(searchLower) || f.family.toLowerCase().includes(searchLower)
          )
        }

        return c.json({
          success: true,
          data: {
            fonts,
            total: fonts.length
          }
        })
      }
    )

    // Get font by ID
    this.controller.openapi(
      createRoute({
        method: 'get',
        path: '/v1/fonts/{id}',
        tags: ['Fonts'],
        summary: 'Get font by ID',
        description: 'Retrieve details of a specific font',
        request: {
          params: z.object({
            id: z.string()
          })
        },
        responses: {
          200: {
            description: 'Font retrieved successfully',
            content: {
              'application/json': {
                schema: z.object({
                  success: z.boolean(),
                  data: z.object({
                    id: z.string(),
                    name: z.string(),
                    family: z.string(),
                    category: z.string(),
                    variants: z.array(z.string()),
                    weights: z.array(z.number()),
                    isPremium: z.boolean(),
                    isPopular: z.boolean()
                  })
                })
              }
            }
          },
          404: {
            description: 'Font not found',
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
        const { id } = c.req.param()
        const font = FONT_LIBRARY.find((f) => f.id === id)

        if (!font) {
          return c.json({ success: false, error: 'Font not found' }, 404)
        }

        return c.json({
          success: true,
          data: font
        })
      }
    )

    // Get font categories
    this.controller.openapi(
      createRoute({
        method: 'get',
        path: '/v1/fonts/categories',
        tags: ['Fonts'],
        summary: 'Get font categories',
        description: 'Get list of available font categories with counts',
        responses: {
          200: {
            description: 'Categories retrieved successfully',
            content: {
              'application/json': {
                schema: z.object({
                  success: z.boolean(),
                  data: z.object({
                    categories: z.array(
                      z.object({
                        name: z.string(),
                        count: z.number()
                      })
                    )
                  })
                })
              }
            }
          }
        }
      }),
      (c: any) => {
        const categories = ['serif', 'sans-serif', 'display', 'handwriting', 'monospace']
        const categoryCounts = categories.map((cat) => ({
          name: cat,
          count: FONT_LIBRARY.filter((f) => f.category === cat).length
        }))

        return c.json({
          success: true,
          data: {
            categories: categoryCounts
          }
        })
      }
    )
  }
}
