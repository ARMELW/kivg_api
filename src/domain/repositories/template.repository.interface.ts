import type { Template } from '../models/template.model'

export interface TemplateRepositoryInterface {
  findById: (id: string) => Promise<Template | null>
  findAll: (params: {
    skip?: number
    limit?: number
    type?: string
    style?: string
    complexity?: 'beginner' | 'intermediate' | 'advanced' | 'expert'
    tags?: string[]
    search?: string
    minRating?: number
    sortByPopularity?: boolean
  }) => Promise<{ templates: Template[]; total: number }>
  create: (data: Omit<Template, 'id' | 'createdAt' | 'updatedAt' | 'rating' | 'popularity'>) => Promise<Template>
  update: (
    id: string,
    data: Partial<Omit<Template, 'id' | 'createdAt' | 'updatedAt'>>
  ) => Promise<Template>
  delete: (id: string) => Promise<boolean>
  incrementPopularity: (id: string) => Promise<void>
}
