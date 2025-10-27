import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ErrorCode } from '@/domain/types/error.type'
import type { StripePlanSyncService } from '@/application/services/stripe-plan-sync.service'
import type { CreatePlanDTO } from '@/domain/models/plan.model'
import type { PlanRepositoryInterface } from '@/domain/repositories/plan.repository.interface'
import { CreatePlanUseCase } from './create-plan.use-case'

describe('CreatePlanUseCase', () => {
  let createPlanUseCase: CreatePlanUseCase
  let mockPlanRepository: PlanRepositoryInterface
  let mockStripePlanSyncService: StripePlanSyncService

  const mockPlanData: CreatePlanDTO = {
    name: 'Test Plan',
    slug: 'test-plan',
    description: 'A test plan',
    isActive: true,
    isPublic: true,
    sortOrder: 0,
    pricing: {
      monthly: 999,
      yearly: 9999
    },
    features: {
      maxScenes: 10,
      maxDuration: 60,
      exportQuality: '720p',
      hasWatermark: false,
      storageType: 'cloud',
      cloudProjectsLimit: 5,
      maxAudioTracks: 2,
      assetsLibrarySize: 100,
      customFonts: 5,
      hasAIVoice: true,
      hasAIScriptGenerator: true,
      hasAIImageGenerator: false,
      hasAIMusic: false,
      aiVideoLimit: 10,
      maxCollaborators: 3,
      supportLevel: 'email_48h',
      hasTemplates: true,
      hasBranding: false,
      hasAPI: false,
      hasSSO: false,
      hasDedicatedSupport: false,
      hasCustomBranding: false,
      hasSLA: false
    }
  }

  const mockCreatedPlan = {
    id: 'plan-123',
    ...mockPlanData,
    createdAt: new Date(),
    updatedAt: new Date()
  }

  beforeEach(() => {
    mockPlanRepository = {
      findById: vi.fn(),
      findBySlug: vi.fn(),
      findAll: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      slugExists: vi.fn(),
      findByStripePriceId: vi.fn()
    }

    mockStripePlanSyncService = {
      syncPlanToStripe: vi.fn(),
      archivePlanInStripe: vi.fn(),
      syncAllPlansToStripe: vi.fn()
    } as any

    vi.clearAllMocks()
  })

  describe('without Stripe sync service', () => {
    beforeEach(() => {
      createPlanUseCase = new CreatePlanUseCase(mockPlanRepository)
    })

    it('should create a plan successfully without syncing to Stripe', async () => {
      vi.mocked(mockPlanRepository.slugExists).mockResolvedValue(false)
      vi.mocked(mockPlanRepository.create).mockResolvedValue(mockCreatedPlan)

      const result = await createPlanUseCase.execute(mockPlanData)

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockCreatedPlan)
      expect(mockPlanRepository.slugExists).toHaveBeenCalledWith(mockPlanData.slug)
      expect(mockPlanRepository.create).toHaveBeenCalledWith(mockPlanData)
    })

    it('should return error when slug already exists', async () => {
      vi.mocked(mockPlanRepository.slugExists).mockResolvedValue(true)

      const result = await createPlanUseCase.execute(mockPlanData)

      expect(result.success).toBe(false)
      expect(result.error).toBe(`Plan with slug '${mockPlanData.slug}' already exists`)
      expect(result.errorCode).toBe(ErrorCode.ALREADY_EXISTS)
      expect(mockPlanRepository.create).not.toHaveBeenCalled()
    })

    it('should return error when creation fails', async () => {
      vi.mocked(mockPlanRepository.slugExists).mockResolvedValue(false)
      vi.mocked(mockPlanRepository.create).mockRejectedValue(new Error('Database error'))

      const result = await createPlanUseCase.execute(mockPlanData)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Database error')
      expect(result.errorCode).toBe(ErrorCode.INTERNAL_ERROR)
    })
  })

  describe('with Stripe sync service', () => {
    beforeEach(() => {
      createPlanUseCase = new CreatePlanUseCase(mockPlanRepository, mockStripePlanSyncService)
    })

    it('should create a plan and automatically sync to Stripe', async () => {
      vi.mocked(mockPlanRepository.slugExists).mockResolvedValue(false)
      vi.mocked(mockPlanRepository.create).mockResolvedValue(mockCreatedPlan)
      vi.mocked(mockStripePlanSyncService.syncPlanToStripe).mockResolvedValue({
        success: true,
        stripeProductId: 'prod_123',
        stripePriceIdMonthly: 'price_monthly_123',
        stripePriceIdYearly: 'price_yearly_123'
      })

      const result = await createPlanUseCase.execute(mockPlanData)

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockCreatedPlan)
      expect(mockStripePlanSyncService.syncPlanToStripe).toHaveBeenCalledWith(mockCreatedPlan)
    })

    it('should not sync to Stripe if plan has no pricing', async () => {
      const freePlanData = { ...mockPlanData, pricing: { monthly: 0, yearly: 0 } }
      const freeCreatedPlan = { ...mockCreatedPlan, pricing: { monthly: 0, yearly: 0 } }

      vi.mocked(mockPlanRepository.slugExists).mockResolvedValue(false)
      vi.mocked(mockPlanRepository.create).mockResolvedValue(freeCreatedPlan)

      const result = await createPlanUseCase.execute(freePlanData)

      expect(result.success).toBe(true)
      expect(result.data).toEqual(freeCreatedPlan)
      expect(mockStripePlanSyncService.syncPlanToStripe).not.toHaveBeenCalled()
    })

    it('should continue successfully even if Stripe sync fails', async () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      vi.mocked(mockPlanRepository.slugExists).mockResolvedValue(false)
      vi.mocked(mockPlanRepository.create).mockResolvedValue(mockCreatedPlan)
      vi.mocked(mockStripePlanSyncService.syncPlanToStripe).mockResolvedValue({
        success: false,
        error: 'Stripe API error'
      })

      const result = await createPlanUseCase.execute(mockPlanData)

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockCreatedPlan)
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        `Failed to sync plan ${mockCreatedPlan.id} to Stripe: Stripe API error`
      )

      consoleWarnSpy.mockRestore()
    })
  })
})
