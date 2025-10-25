import type { Channel } from '../models/channel.model'

export interface ChannelRepositoryInterface {
  findById: (id: string) => Promise<Channel | null>
  findAll: (params: {
    userId: string
    status?: 'active' | 'archived'
    skip?: number
    limit?: number
  }) => Promise<{ channels: Channel[]; total: number }>
  create: (data: Omit<Channel, 'id' | 'createdAt' | 'updatedAt' | 'projectCount' | 'totalVideosExported'>) => Promise<Channel>
  update: (
    id: string,
    data: Partial<Omit<Channel, 'id' | 'createdAt' | 'updatedAt' | 'userId'>>
  ) => Promise<Channel>
  archive: (id: string) => Promise<Channel>
  incrementProjectCount: (id: string) => Promise<void>
  incrementVideosExported: (id: string) => Promise<void>
}
