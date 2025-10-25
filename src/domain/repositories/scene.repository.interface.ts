import type { Scene } from '../models/scene.model'

export interface SceneRepositoryInterface {
  findById: (id: string) => Promise<Scene | null>
  findAll: (params: {
    projectId?: string
    skip?: number
    limit?: number
    filter?: string
  }) => Promise<{ scenes: Scene[]; total: number }>
  create: (data: Omit<Scene, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Scene>
  update: (
    id: string,
    data: Partial<Omit<Scene, 'id' | 'createdAt' | 'updatedAt' | 'projectId'>>
  ) => Promise<Scene>
  delete: (id: string) => Promise<boolean>
  duplicate: (id: string) => Promise<Scene>
  reorder: (projectId: string, sceneIds: string[]) => Promise<boolean>
}
