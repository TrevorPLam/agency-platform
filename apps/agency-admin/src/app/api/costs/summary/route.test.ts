import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { GET } from './route'
import { getAdminClient } from '@agency/database/admin'
import { captureServerEvent } from '@agency/analytics/server'
import { validateTenantAccess } from '@/lib/auth'

// Mock all external dependencies
vi.mock('@agency/database/admin')
vi.mock('@agency/analytics/server')
vi.mock('@/lib/auth')
vi.mock('@/lib/logger', () => ({
  createRequestLogger: vi.fn(() => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  })),
}))

const mockGetAdminClient = vi.mocked(getAdminClient)
const mockCaptureServerEvent = vi.mocked(captureServerEvent)
const mockValidateTenantAccess = vi.mocked(validateTenantAccess)

describe('Cost Summary API Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Set up default mocks
    mockValidateTenantAccess.mockResolvedValue({
      userId: 'user-123',
      tenantId: 'tenant-123',
      isPlatformAdmin: false,
    })

    mockGetAdminClient.mockReturnValue({
      rpc: vi.fn(),
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(),
          })),
        })),
      })),
    } as any)

    mockCaptureServerEvent.mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  describe('GET /api/costs/summary', () => {
    it('should return cost summary for authenticated user', async () => {
      // Arrange
      const mockSummary = {
        total_cost: '150.75',
        storage_cost: '45.20',
        cicd_cost: '85.30',
        bandwidth_cost: '20.25',
        average_daily_cost: '21.53',
        trend_direction: 'up',
        trend_percentage: '12.5',
      }

      const mockAdminClient = {
        rpc: vi.fn().mockResolvedValue({
          data: [mockSummary],
          error: null,
        }),
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({
                data: { slug: 'test-tenant' },
              }),
            })),
          })),
        })),
      }

      mockGetAdminClient.mockReturnValue(mockAdminClient as any)

      const request = new NextRequest('http://localhost/api/costs/summary', {
        headers: {
          'x-request-id': 'test-request-id',
        },
      })

      // Act
      const response = await GET(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data).toMatchObject({
        totalCost: 150.75,
        storageCost: 45.20,
        cicdCost: 85.30,
        bandwidthCost: 20.25,
        averageDailyCost: 21.53,
        trendDirection: 'up',
        trendPercentage: 12.5,
      })

      expect(mockValidateTenantAccess).toHaveBeenCalledWith(request)
      expect(mockAdminClient.rpc).toHaveBeenCalledWith('get_tenant_cost_summary', {
        p_tenant_id: 'tenant-123',
        p_days: 7,
      })
      expect(mockCaptureServerEvent).toHaveBeenCalledWith('system', 'costs:summary_viewed', {
        tenant: 'test-tenant',
        period_days: 7,
        has_data: true,
        trend_direction: 'up',
      })
    })

    it('should return empty summary when no data exists', async () => {
      // Arrange
      const mockAdminClient = {
        rpc: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({
                data: { slug: 'test-tenant' },
              }),
            })),
          })),
        })),
      }

      mockGetAdminClient.mockReturnValue(mockAdminClient as any)

      const request = new NextRequest('http://localhost/api/costs/summary')

      // Act
      const response = await GET(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data).toMatchObject({
        totalCost: 0,
        storageCost: 0,
        cicdCost: 0,
        bandwidthCost: 0,
        averageDailyCost: 0,
        trendDirection: 'stable',
        trendPercentage: 0,
      })
    })

    it('should allow platform admin to access any tenant data', async () => {
      // Arrange
      mockValidateTenantAccess.mockResolvedValue({
        userId: 'admin-user',
        tenantId: 'admin-tenant',
        isPlatformAdmin: true,
      })

      const mockSummary = {
        total_cost: '200.00',
        storage_cost: '50.00',
        cicd_cost: '100.00',
        bandwidth_cost: '50.00',
        average_daily_cost: '28.57',
        trend_direction: 'down',
        trend_percentage: '5.2',
      }

      const mockAdminClient = {
        rpc: vi.fn().mockResolvedValue({
          data: [mockSummary],
          error: null,
        }),
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({
                data: { slug: 'target-tenant' },
              }),
            })),
          })),
        })),
      }

      mockGetAdminClient.mockReturnValue(mockAdminClient as any)

      const request = new NextRequest('http://localhost/api/costs/summary?tenant_id=target-tenant-123')

      // Act
      const response = await GET(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.totalCost).toBe(200.00)
      expect(mockAdminClient.rpc).toHaveBeenCalledWith('get_tenant_cost_summary', {
        p_tenant_id: 'target-tenant-123',
        p_days: 7,
      })
    })

    it('should handle database authorization errors', async () => {
      // Arrange
      const mockAdminClient = {
        rpc: vi.fn().mockResolvedValue({
          data: null,
          error: { code: '42501', message: 'Permission denied' },
        }),
      }

      mockGetAdminClient.mockReturnValue(mockAdminClient as any)

      const request = new NextRequest('http://localhost/api/costs/summary')

      // Act
      const response = await GET(request)

      // Assert
      expect(response.status).toBe(500)
      const data = await response.json()
      expect(data).toMatchObject({
        code: 'INTERNAL_ERROR',
        status: 500,
        title: 'Internal server error',
        detail: 'An unexpected server error occurred.',
      })
    })

    it('should handle database operation errors', async () => {
      // Arrange
      const mockAdminClient = {
        rpc: vi.fn().mockResolvedValue({
          data: null,
          error: { code: '50001', message: 'Database error' },
        }),
      }

      mockGetAdminClient.mockReturnValue(mockAdminClient as any)

      const request = new NextRequest('http://localhost/api/costs/summary')

      // Act
      const response = await GET(request)

      // Assert
      expect(response.status).toBe(500)
      const data = await response.json()
      expect(data).toMatchObject({
        code: 'DATABASE_OPERATION_FAILED',
        status: 500,
        title: 'Database operation failed',
        detail: 'Failed to fetch cost summary.',
      })
    })

    it('should handle analytics errors gracefully', async () => {
      // Arrange
      const mockSummary = {
        total_cost: '100.00',
        storage_cost: '25.00',
        cicd_cost: '50.00',
        bandwidth_cost: '25.00',
        average_daily_cost: '14.29',
        trend_direction: 'stable',
        trend_percentage: '0',
      }

      const mockAdminClient = {
        rpc: vi.fn().mockResolvedValue({
          data: [mockSummary],
          error: null,
        }),
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({
                data: { slug: 'test-tenant' },
              }),
            })),
          })),
        })),
      }

      mockGetAdminClient.mockReturnValue(mockAdminClient as any)
      mockCaptureServerEvent.mockRejectedValue(new Error('Analytics failed'))

      const request = new NextRequest('http://localhost/api/costs/summary')

      // Act
      const response = await GET(request)
      const data = await response.json()

      // Assert - Should still return data even if analytics fails
      expect(response.status).toBe(200)
      expect(data.totalCost).toBe(100.00)
      expect(mockCaptureServerEvent).toHaveBeenCalled()
    })

    it('should handle missing tenant slug gracefully', async () => {
      // Arrange
      const mockSummary = {
        total_cost: '100.00',
        storage_cost: '25.00',
        cicd_cost: '50.00',
        bandwidth_cost: '25.00',
        average_daily_cost: '14.29',
        trend_direction: 'stable',
        trend_percentage: '0',
      }

      const mockAdminClient = {
        rpc: vi.fn().mockResolvedValue({
          data: [mockSummary],
          error: null,
        }),
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({
                data: null, // No tenant found
              }),
            })),
          })),
        })),
      }

      mockGetAdminClient.mockReturnValue(mockAdminClient as any)

      const request = new NextRequest('http://localhost/api/costs/summary')

      // Act
      const response = await GET(request)
      const data = await response.json()

      // Assert - Should still return data even if tenant slug lookup fails
      expect(response.status).toBe(200)
      expect(data.totalCost).toBe(100.00)
      expect(mockCaptureServerEvent).not.toHaveBeenCalled() // Analytics not called without tenant slug
    })
  })
})
