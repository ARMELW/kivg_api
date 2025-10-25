import type { Project } from '../models/project.model'

export interface ProjectRepositoryInterface {
  findById: (id: string) => Promise<Project | null>
  findAll: (params: {
    channelId: string
    status?: 'draft' | 'in_progress' | 'completed'
    skip?: number
    limit?: number
    sortBy?: 'created_at' | 'updated_at' | 'title'
    sortOrder?: 'asc' | 'desc'
    search?: string
  }) => Promise<{ projects: Project[]; total: number }>
  create: (data: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt' | 'duration'>) => Promise<Project>
  update: (
    id: string,
    data: Partial<Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'userId' | 'channelId'>>
  ) => Promise<Project>
  delete: (id: string) => Promise<boolean>
  duplicate: (id: string, newTitle: string) => Promise<Project>
}
