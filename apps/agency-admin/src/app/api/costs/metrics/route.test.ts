import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { GET, POST } from './route'
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

describe('Cost Metrics API Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Set up default mocks
    mockValidateTenantAccess.mockResolvedValue({
      userId: 'user-123',
      tenantId: 'tenant-123',
      isPlatformAdmin: false,
    })

    mockGetAdminClient.mockReturnValue({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              gte: vi.fn(() => ({
                order: vi.fn(() => ({
                  data: [],
                  error: null,
                })),
              })),
            })),
          })),
        })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => ({
            data: null,
            error: null,
          })),
        })),
      })),
    } as any)

    mockCaptureServerEvent.mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  describe('GET /api/costs/metrics', () => {
    it('should return cost metrics for authenticated user', async () => {
      // Arrange
      const mockMetrics = [
        {
          id: 'metric-1',
          storage_usage: 1073741824,
          cicd_runtime: 45,
          bandwidth_usage: 536870912,
          total_cost: '25.50',
          currency: 'USD',
          timestamp: '2026-03-16T12:00:00Z',
          period: 'daily',
          metadata: {},
        },
        {
          id: 'metric-2',
          storage_usage: 2147483648,
          cicd_runtime: 60,
          bandwidth_usage: 1073741824,
          total_cost: '35.75',
          currency: 'USD',
          timestamp: '2026-03-15T12:00:00Z',
          period: 'daily',
          metadata: {},
        },
      ]

      const mockAdminClient = {
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                gte: vi.fn(() => ({
                  order: vi.fn(() => ({
                    data: mockMetrics,
                    error: null,
                  })),
                })),
              })),
            })),
          })),
        })),
      }

      mockGetAdminClient.mockReturnValue(mockAdminClient as any)

      const request = new NextRequest('http://localhost/api/costs/metrics?period=daily&days=7', {
        headers: {
          'x-request-id': 'test-request-id',
        },
      })

      // Act
      const response = await GET(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data).toHaveLength(2)
      expect(data[0]).toMatchObject({
        id: 'metric-1',
        storageUsage: 1073741824,
        cicdRuntime: 45,
        bandwidthUsage: 536870912,
        totalCost: 25.50,
        currency: 'USD',
        timestamp: '2026-03-16T12:00:00Z',
        period: 'daily',
        metadata: {},
      })

      expect(mockValidateTenantAccess).toHaveBeenCalledWith(request)
      expect(mockAdminClient.from).toHaveBeenCalledWith('cost_metrics')
      expect(mockCaptureServerEvent).toHaveBeenCalledWith('system', 'costs:metrics_viewed', {
        tenant: 'test-tenant',
        period: 'daily',
        days: 7,
        metrics_count: 2,
      })
    })

    it('should use default parameters when not provided', async () => {
      // Arrange
      const mockAdminClient = {
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                gte: vi.fn(() => ({
                  order: vi.fn(() => ({
                    data: [],
                    error: null,
                  })),
                })),
              })),
            })),
          })),
        })),
      }

      mockGetAdminClient.mockReturnValue(mockAdminClient as any)

      const request = new NextRequest('http://localhost/api/costs/metrics')

      // Act
      await GET(request)

      // Assert
      expect(mockAdminClient.from).toHaveBeenCalledWith('cost_metrics')
      // Should use default period='daily' and days=30
      expect(mockAdminClient.from().select().eq().eq).toHaveBeenCalledWith('daily')
    })

    it('should allow platform admin to access any tenant data', async () => {
      // Arrange
      mockValidateTenantAccess.mockResolvedValue({
        userId: 'admin-user',
        tenantId: 'admin-tenant',
        isPlatformAdmin: true,
      })

      const mockAdminClient = {
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                gte: vi.fn(() => ({
                  order: vi.fn(() => ({
                    data: [],
                    error: null,
                  })),
                })),
              })),
            })),
          })),
        })),
      }

      mockGetAdminClient.mockReturnValue(mockAdminClient as any)

      const request = new NextRequest('http://localhost/api/costs/metrics?tenant_id=target-tenant-123')

      // Act
      await GET(request)

      // Assert
      expect(mockAdminClient.from().select().eq).toHaveBeenCalledWith('tenant_id', 'target-tenant-123')
    })

    it('should handle database errors gracefully', async () => {
      // Arrange
      const mockAdminClient = {
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                gte: vi.fn(() => ({
                  order: vi.fn(() => ({
                    data: null,
                    error: { message: 'Database error' },
                  })),
                })),
              })),
            })),
          })),
        })),
      }

      mockGetAdminClient.mockReturnValue(mockAdminClient as any)

      const request = new NextRequest('http://localhost/api/costs/metrics')

      // Act & Assert
      await expect(GET(request)).rejects.toThrow('Failed to fetch cost metrics.')
    })

    it('should return empty array when no metrics found', async () => {
      // Arrange
      const mockAdminClient = {
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                gte: vi.fn(() => ({
                  order: vi.fn(() => ({
                    data: [],
                    error: null,
                  })),
                })),
              })),
            })),
          })),
        })),
      }

      mockGetAdminClient.mockReturnValue(mockAdminClient as any)

      const request = new NextRequest('http://localhost/api/costs/metrics')

      // Act
      const response = await GET(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data).toEqual([])
    })
  })

  describe('POST /api/costs/metrics', () => {
    it('should create a new cost metric', async () => {
      // Arrange
      const newMetric = {
        id: 'new-metric-id',
        tenant_id: 'tenant-123',
        storage_usage: 1073741824,
        cicd_runtime: 45,
        bandwidth_usage: 536870912,
        total_cost: '25.50',
        currency: 'USD',
        period: 'daily',
        metadata: {},
        timestamp: '2026-03-16T12:00:00Z',
      }

      const mockAdminClient = {
        from: vi.fn(() => ({
          insert: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn(() => ({
                data: newMetric,
                error: null,
              })),
            })),
          })),
        })),
      }

      mockGetAdminClient.mockReturnValue(mockAdminClient as any)

      const requestBody = {
        storageUsage: 1073741824,
        cicdRuntime: 45,
        bandwidthUsage: 536870912,
        totalCost: 25.50,
        currency: 'USD',
        period: 'daily',
        metadata: {},
      }

      const request = new NextRequest('http://localhost/api/costs/metrics', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
          'x-request-id': 'test-request-id',
        },
      })

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(201)
      expect(data).toMatchObject({
        id: 'new-metric-id',
        storageUsage: 1073741824,
        cicdRuntime: 45,
        bandwidthUsage: 536870912,
        totalCost: 25.50,
        currency: 'USD',
        period: 'daily',
        metadata: {},
      })

      expect(mockAdminClient.from).toHaveBeenCalledWith('cost_metrics')
      expect(mockAdminClient.from().insert).toHaveBeenCalledWith({
        tenant_id: 'tenant-123',
        storage_usage: 1073741824,
        cicd_runtime: 45,
        bandwidth_usage: 536870912,
        total_cost: 25.50,
        currency: 'USD',
        period: 'daily',
        metadata: {},
        timestamp: expect.any(String),
      })

      expect(mockCaptureServerEvent).toHaveBeenCalledWith('system', 'costs:metric_created', {
        tenant: 'test-tenant',
        period: 'daily',
        currency: 'USD',
      })
    })

    it('should allow platform admin to create metrics for any tenant', async () => {
      // Arrange
      mockValidateTenantAccess.mockResolvedValue({
        userId: 'admin-user',
        tenantId: 'admin-tenant',
        isPlatformAdmin: true,
      })

      const newMetric = {
        id: 'new-metric-id',
        tenant_id: 'target-tenant-123',
        storage_usage: 1073741824,
        cicd_runtime: 45,
        bandwidth_usage: 536870912,
        total_cost: '25.50',
        currency: 'USD',
        period: 'daily',
        metadata: {},
        timestamp: '2026-03-16T12:00:00Z',
      }

      const mockAdminClient = {
        from: vi.fn(() => ({
          insert: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn(() => ({
                data: newMetric,
                error: null,
              })),
            })),
          })),
        })),
      }

      mockGetAdminClient.mockReturnValue(mockAdminClient as any)

      const requestBody = {
        tenantId: 'target-tenant-123',
        storageUsage: 1073741824,
        cicdRuntime: 45,
        bandwidthUsage: 536870912,
        totalCost: 25.50,
      }

      const request = new NextRequest('http://localhost/api/costs/metrics', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      // Act
      const response = await POST(request)

      // Assert
      expect(response.status).toBe(201)
      expect(mockAdminClient.from().insert).toHaveBeenCalledWith(
        expect.objectContaining({
          tenant_id: 'target-tenant-123',
        })
      )
    })

    it('should use default values when not provided', async () => {
      // Arrange
      const newMetric = {
        id: 'new-metric-id',
        tenant_id: 'tenant-123',
        storage_usage: 0,
        cicd_runtime: 0,
        bandwidth_usage: 0,
        total_cost: '0',
        currency: 'USD',
        period: 'daily',
        metadata: {},
        timestamp: '2026-03-16T12:00:00Z',
      }

      const mockAdminClient = {
        from: vi.fn(() => ({
          insert: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn(() => ({
                data: newMetric,
                error: null,
              })),
            })),
          })),
        })),
      }

      mockGetAdminClient.mockReturnValue(mockAdminClient as any)

      const requestBody = {} // Empty body

      const request = new NextRequest('http://localhost/api/costs/metrics', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      // Act
      const response = await POST(request)

      // Assert
      expect(response.status).toBe(201)
      expect(mockAdminClient.from().insert).toHaveBeenCalledWith({
        tenant_id: 'tenant-123',
        storage_usage: 0,
        cicd_runtime: 0,
        bandwidth_usage: 0,
        total_cost: 0,
        currency: 'USD',
        period: 'daily',
        metadata: {},
        timestamp: expect.any(String),
      })
    })

    it('should handle database errors during creation', async () => {
      // Arrange
      const mockAdminClient = {
        from: vi.fn(() => ({
          insert: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn(() => ({
                data: null,
                error: { message: 'Database error' },
              })),
            })),
          })),
        })),
      }

      mockGetAdminClient.mockReturnValue(mockAdminClient as any)

      const requestBody = {
        storageUsage: 1073741824,
        cicdRuntime: 45,
        bandwidthUsage: 536870912,
        totalCost: 25.50,
      }

      const request = new NextRequest('http://localhost/api/costs/metrics', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      // Act & Assert
      await expect(POST(request)).rejects.toThrow('Failed to create cost metric.')
    })

    it('should handle invalid JSON body', async () => {
      // Arrange
      const request = new NextRequest('http://localhost/api/costs/metrics', {
        method: 'POST',
        body: 'invalid-json',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      // Act & Assert
      await expect(POST(request)).rejects.toThrow()
    })

    it('should handle analytics errors gracefully', async () => {
      // Arrange
      const newMetric = {
        id: 'new-metric-id',
        tenant_id: 'tenant-123',
        storage_usage: 1073741824,
        cicd_runtime: 45,
        bandwidth_usage: 536870912,
        total_cost: '25.50',
        currency: 'USD',
        period: 'daily',
        metadata: {},
        timestamp: '2026-03-16T12:00:00Z',
      }

      const mockAdminClient = {
        from: vi.fn(() => ({
          insert: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn(() => ({
                data: newMetric,
                error: null,
              })),
            })),
          })),
        })),
      }

      mockGetAdminClient.mockReturnValue(mockAdminClient as any)
      mockCaptureServerEvent.mockRejectedValue(new Error('Analytics failed'))

      const requestBody = {
        storageUsage: 1073741824,
        cicdRuntime: 45,
        bandwidthUsage: 536870912,
        totalCost: 25.50,
      }

      const request = new NextRequest('http://localhost/api/costs/metrics', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert - Should still create metric even if analytics fails
      expect(response.status).toBe(201)
      expect(data.id).toBe('new-metric-id')
      expect(mockCaptureServerEvent).toHaveBeenCalled()
    })
  })
})
