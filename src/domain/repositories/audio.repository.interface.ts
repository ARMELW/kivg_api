import type { AudioFile } from '../models/audio.model'

export interface AudioFileRepositoryInterface {
  findById: (id: string) => Promise<AudioFile | null>
  findAll: (params: {
    userId: string
    skip?: number
    limit?: number
    category?: string
    tags?: string[]
    search?: string
    favoritesOnly?: boolean
  }) => Promise<{ audioFiles: AudioFile[]; total: number }>
  create: (data: Omit<AudioFile, 'id' | 'uploadedAt' | 'updatedAt'>) => Promise<AudioFile>
  update: (
    id: string,
    data: Partial<Omit<AudioFile, 'id' | 'uploadedAt' | 'updatedAt' | 'userId'>>
  ) => Promise<AudioFile>
  delete: (id: string) => Promise<boolean>
}
