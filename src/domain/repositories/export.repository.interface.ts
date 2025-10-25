import type { Export } from '../models/export.model'

export interface ExportRepositoryInterface {
  findById: (id: string) => Promise<Export | null>
  findAll: (params: {
    userId: string
    skip?: number
    limit?: number
    status?: string
  }) => Promise<{ exports: Export[]; total: number }>
  create: (data: Omit<Export, 'id' | 'createdAt' | 'completedAt' | 'progress' | 'status'>) => Promise<Export>
  update: (id: string, data: Partial<Omit<Export, 'id' | 'createdAt' | 'userId'>>) => Promise<Export>
  updateProgress: (id: string, progress: number, currentStep?: string) => Promise<void>
  updateStatus: (id: string, status: string, videoUrl?: string, error?: string) => Promise<void>
  delete: (id: string) => Promise<boolean>
}
