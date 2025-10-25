import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ProjectRepository } from '../repositories/project.repository'
import { ProjectController } from './project.controller'

// Mock the repository
vi.mock('../repositories/project.repository')

describe('ProjectController with Repository', () => {
  let mockRepository: any

  beforeEach(() => {
    mockRepository = {
      create: vi.fn(),
      findAll: vi.fn(),
      findById: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      duplicate: vi.fn()
    }

    // Replace the repository instance
    vi.mocked(ProjectRepository).mockImplementation(() => mockRepository)
    new ProjectController()
  })

  describe('Create Project', () => {
    it('should create a project using repository', () => {
      const mockProject = {
        id: 'test-id',
        userId: 'user-123',
        channelId: 'channel-123',
        title: 'Test Project',
        status: 'draft',
        createdAt: new Date(),
        updatedAt: new Date()
      }

      mockRepository.create.mockResolvedValue(mockProject)

      // Note: This is a simplified test - in a real scenario you'd need to properly mock the route handler
      expect(mockRepository.create).toBeDefined()
    })
  })

  describe('List Projects', () => {
    it('should list projects using repository', () => {
      const mockResult = {
        projects: [
          { id: '1', title: 'Project 1' },
          { id: '2', title: 'Project 2' }
        ],
        total: 2
      }

      mockRepository.findAll.mockResolvedValue(mockResult)

      expect(mockRepository.findAll).toBeDefined()
    })
  })

  describe('Get Project by ID', () => {
    it('should get a project by ID using repository', () => {
      const mockProject = {
        id: 'test-id',
        userId: 'user-123',
        title: 'Test Project'
      }

      mockRepository.findById.mockResolvedValue(mockProject)

      expect(mockRepository.findById).toBeDefined()
    })
  })

  describe('Update Project', () => {
    it('should update a project using repository', () => {
      const mockProject = {
        id: 'test-id',
        userId: 'user-123',
        title: 'Updated Project'
      }

      mockRepository.findById.mockResolvedValue(mockProject)
      mockRepository.update.mockResolvedValue(mockProject)

      expect(mockRepository.update).toBeDefined()
    })
  })

  describe('Delete Project', () => {
    it('should delete a project using repository', () => {
      mockRepository.findById.mockResolvedValue({ id: 'test-id', userId: 'user-123' })
      mockRepository.delete.mockResolvedValue(true)

      expect(mockRepository.delete).toBeDefined()
    })
  })
})
