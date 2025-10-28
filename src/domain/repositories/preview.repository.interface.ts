import type { Preview } from '../models/preview.model'

export interface PreviewRepositoryInterface {
  findById: (id: string) => Promise<Preview | null>
  findAll: (params: {
    userId: string
    skip?: number
    limit?: number
    status?: string
    sceneId?: string
  }) => Promise<{ previews: Preview[]; total: number }>
  create: (data: Omit<Preview, 'id' | 'createdAt' | 'completedAt' | 'progress' | 'status'>) => Promise<Preview>
  update: (
    id: string,
    data: Partial<Omit<Preview, 'id' | 'createdAt' | 'completedAt' | 'userId' | 'sceneId'>>
  ) => Promise<Preview>
  delete: (id: string) => Promise<boolean>
  updateProgress: (id: string, progress: number, currentStep?: string) => Promise<void>
  updateStatus: (id: string, status: string, previewUrl?: string, error?: string) => Promise<void>
}
