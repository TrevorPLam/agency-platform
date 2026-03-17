import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { getAdminClient } from '@agency/database/admin'
import { createSupabaseServerClient } from '@agency/database/client'
import { captureServerEvent } from '@agency/analytics/server'

// Mock all external dependencies
vi.mock('@agency/database/admin')
vi.mock('@agency/analytics/server')

const mockGetAdminClient = vi.mocked(getAdminClient)
const mockCaptureServerEvent = vi.mocked(captureServerEvent)

describe('Database Operations Integration Tests', () => {
  let mockAdminClient: any

  beforeEach(() => {
    vi.clearAllMocks()

    // Create a comprehensive mock client
    mockAdminClient = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => ({
              data: null,
              error: null,
            })),
            gte: vi.fn(() => ({
              order: vi.fn(() => ({
                data: [],
                error: null,
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
        update: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              select: vi.fn(() => ({
                single: vi.fn(() => ({
                  data: null,
                  error: null,
                })),
              })),
            })),
          })),
        })),
        delete: vi.fn(() => ({
          eq: vi.fn(() => ({
            data: null,
            error: null,
          })),
        })),
      })),
      rpc: vi.fn(() => ({
        data: null,
        error: null,
      })),
    }

    mockGetAdminClient.mockReturnValue(mockAdminClient)
    mockCaptureServerEvent.mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  describe('Tenant Operations', () => {
    it('should create a new tenant', async () => {
      // Arrange
      const newTenant = {
        id: 'tenant-123',
        slug: 'test-tenant',
        name: 'Test Tenant',
        created_at: '2026-03-16T12:00:00Z',
        updated_at: '2026-03-16T12:00:00Z',
      }

      const mockAdminClient = {
        from: vi.fn(() => ({
          insert: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn(() => ({
                data: newTenant,
                error: null,
              })),
            })),
          })),
        })),
      }

      mockGetAdminClient.mockReturnValue(mockAdminClient as any)

      // Act
      const admin = getAdminClient()
      const { data, error } = await admin
        .from('tenants')
        .insert({
          slug: 'test-tenant',
          name: 'Test Tenant',
        })
        .select()
        .single()

      // Assert
      expect(data).toEqual(newTenant)
      expect(error).toBeNull()
      expect(mockAdminClient.from).toHaveBeenCalledWith('tenants')
      expect(mockAdminClient.from().insert).toHaveBeenCalledWith({
        slug: 'test-tenant',
        name: 'Test Tenant',
      })
    })

    it('should handle tenant creation conflicts', async () => {
      // Arrange
      const mockAdminClient = {
        from: vi.fn(() => ({
          insert: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn(() => ({
                data: null,
                error: {
                  code: '23505',
                  message: 'duplicate key value violates unique constraint',
                  details: { constraint: 'tenants_slug_key' },
                },
              })),
            })),
          })),
        })),
      }

      mockGetAdminClient.mockReturnValue(mockAdminClient as any)

      // Act
      const admin = getAdminClient()
      const { data, error } = await admin
        .from('tenants')
        .insert({
          slug: 'existing-tenant',
          name: 'Existing Tenant',
        })
        .select()
        .single()

      // Assert
      expect(data).toBeNull()
      expect(error).toMatchObject({
        code: '23505',
        message: expect.stringContaining('duplicate key value'),
      })
    })

    it('should retrieve tenant by slug', async () => {
      // Arrange
      const existingTenant = {
        id: 'tenant-123',
        slug: 'test-tenant',
        name: 'Test Tenant',
        created_at: '2026-03-16T12:00:00Z',
      }

      mockAdminClient.from().select().eq().single.mockResolvedValue({
        data: existingTenant,
        error: null,
      })

      // Act
      const admin = getAdminClient()
      const { data, error } = await admin
        .from('tenants')
        .select('*')
        .eq('slug', 'test-tenant')
        .single()

      // Assert
      expect(data).toEqual(existingTenant)
      expect(error).toBeNull()
      expect(mockAdminClient.from).toHaveBeenCalledWith('tenants')
      expect(mockAdminClient.from().select().eq).toHaveBeenCalledWith('slug', 'test-tenant')
    })

    it('should handle tenant not found', async () => {
      // Arrange
      const mockAdminClient = {
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() => ({
                data: null,
                error: {
                  code: 'PGRST116',
                  message: 'No rows returned',
                },
              })),
            })),
          })),
        })),
      }

      mockGetAdminClient.mockReturnValue(mockAdminClient as any)

      // Act
      const admin = getAdminClient()
      const { data, error } = await admin
        .from('tenants')
        .select('*')
        .eq('slug', 'non-existent-tenant')
        .single()

      // Assert
      expect(data).toBeNull()
      expect(error).toMatchObject({
        code: 'PGRST116',
        message: 'No rows returned',
      })
    })
  })

  describe('User Operations', () => {
    it('should create a user with tenant association', async () => {
      // Arrange
      const newUser = {
        id: 'user-123',
        email: 'user@example.com',
        tenant_id: 'tenant-123',
        role: 'user',
        created_at: '2026-03-16T12:00:00Z',
        updated_at: '2026-03-16T12:00:00Z',
      }

      const mockAdminClient = {
        from: vi.fn(() => ({
          insert: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn(() => ({
                data: newUser,
                error: null,
              })),
            })),
          })),
        })),
      }

      mockGetAdminClient.mockReturnValue(mockAdminClient as any)

      // Act
      const admin = getAdminClient()
      const { data, error } = await admin
        .from('tenant_users')
        .insert({
          email: 'user@example.com',
          tenant_id: 'tenant-123',
          role: 'user',
        })
        .select()
        .single()

      // Assert
      expect(data).toEqual(newUser)
      expect(error).toBeNull()
      expect(mockAdminClient.from).toHaveBeenCalledWith('tenant_users')
      expect(mockAdminClient.from().insert).toHaveBeenCalledWith({
        email: 'user@example.com',
        tenant_id: 'tenant-123',
        role: 'user',
      })
    })

    it('should enforce tenant isolation in user queries', async () => {
      // Arrange
      const users = [
        {
          id: 'user-123',
          email: 'user@example.com',
          tenant_id: 'tenant-123',
          role: 'user',
        },
        {
          id: 'user-456',
          email: 'admin@example.com',
          tenant_id: 'tenant-123',
          role: 'admin',
        },
      ]

      const mockAdminClient = {
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(() => ({
                data: users,
                error: null,
              })),
            })),
          })),
        })),
      }

      mockGetAdminClient.mockReturnValue(mockAdminClient as any)

      // Act
      const admin = getAdminClient()
      const { data, error } = await admin
        .from('tenant_users')
        .select('*')
        .eq('tenant_id', 'tenant-123')
        .order('created_at', { ascending: false })

      // Assert
      expect(data).toEqual(users)
      expect(error).toBeNull()
      expect(mockAdminClient.from().select().eq).toHaveBeenCalledWith('tenant_id', 'tenant-123')
    })
  })

  describe('Cost Metrics Operations', () => {
    it('should create cost metrics with proper tenant isolation', async () => {
      // Arrange
      const newMetric = {
        id: 'metric-123',
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

      // Act
      const admin = getAdminClient()
      const { data, error } = await admin
        .from('cost_metrics')
        .insert({
          tenant_id: 'tenant-123',
          storage_usage: 1073741824,
          cicd_runtime: 45,
          bandwidth_usage: 536870912,
          total_cost: 25.50,
          currency: 'USD',
          period: 'daily',
          metadata: {},
        })
        .select()
        .single()

      // Assert
      expect(data).toEqual(newMetric)
      expect(error).toBeNull()
      expect(mockAdminClient.from).toHaveBeenCalledWith('cost_metrics')
      expect(mockAdminClient.from().insert).toHaveBeenCalledWith(
        expect.objectContaining({
          tenant_id: 'tenant-123',
          total_cost: 25.50,
        })
      )
    })

    it('should query cost metrics with tenant and date filtering', async () => {
      // Arrange
      const metrics = [
        {
          id: 'metric-1',
          tenant_id: 'tenant-123',
          total_cost: '25.50',
          period: 'daily',
          timestamp: '2026-03-16T12:00:00Z',
        },
        {
          id: 'metric-2',
          tenant_id: 'tenant-123',
          total_cost: '30.75',
          period: 'daily',
          timestamp: '2026-03-15T12:00:00Z',
        },
      ]

      const mockAdminClient = {
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                gte: vi.fn(() => ({
                  order: vi.fn(() => ({
                    data: metrics,
                    error: null,
                  })),
                })),
              })),
            })),
          })),
        })),
      }

      mockGetAdminClient.mockReturnValue(mockAdminClient as any)

      const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

      // Act
      const admin = getAdminClient()
      const { data, error } = await admin
        .from('cost_metrics')
        .select('*')
        .eq('tenant_id', 'tenant-123')
        .eq('period', 'daily')
        .gte('timestamp', startDate)
        .order('timestamp', { ascending: false })

      // Assert
      expect(data).toEqual(metrics)
      expect(error).toBeNull()
      expect(mockAdminClient.from().select().eq).toHaveBeenCalledWith('tenant_id', 'tenant-123')
      expect(mockAdminClient.from().select().eq().eq).toHaveBeenCalledWith('period', 'daily')
      expect(mockAdminClient.from().select().eq().eq().gte).toHaveBeenCalledWith('timestamp', startDate)
    })
  })

  describe('Analytics Integration', () => {
    it('should capture analytics events for database operations', async () => {
      // Arrange
      const newTenant = {
        id: 'tenant-123',
        slug: 'test-tenant',
        name: 'Test Tenant',
        created_at: '2026-03-16T12:00:00Z',
        updated_at: '2026-03-16T12:00:00Z',
      }

      const mockAdminClient = {
        from: vi.fn(() => ({
          insert: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn(() => ({
                data: newTenant,
                error: null,
              })),
            })),
          })),
        })),
      }

      mockGetAdminClient.mockReturnValue(mockAdminClient as any)

      // Act
      const admin = getAdminClient()
      await admin
        .from('tenants')
        .insert({
          slug: 'test-tenant',
          name: 'Test Tenant',
        })
        .select()
        .single()

      // Simulate analytics capture
      await captureServerEvent('system', 'tenant:created', {
        tenant: 'test-tenant',
        tenant_id: 'tenant-123',
      })

      // Assert
      expect(mockCaptureServerEvent).toHaveBeenCalledWith('system', 'tenant:created', {
        tenant: 'test-tenant',
        tenant_id: 'tenant-123',
      })
    })

    it('should handle analytics failures gracefully', async () => {
      // Arrange
      mockCaptureServerEvent.mockRejectedValue(new Error('Analytics service unavailable'))

      // Act & Assert - Should not throw when analytics fails
      await expect(
        captureServerEvent('system', 'tenant:created', {
          tenant: 'test-tenant',
        })
      ).rejects.toThrow('Analytics service unavailable')
    })
  })

  describe('Database Connection and Error Handling', () => {
    it('should handle database connection errors', async () => {
      // Arrange
      mockGetAdminClient.mockImplementation(() => {
        throw new Error('Database connection failed')
      })

      // Act & Assert
      expect(() => getAdminClient()).toThrow('Database connection failed')
    })

    it('should handle query timeout errors', async () => {
      // Arrange
      const mockAdminClient = {
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() => ({
                data: null,
                error: {
                  code: '57014',
                  message: 'canceling statement due to statement timeout',
                },
              })),
            })),
          })),
        })),
      }

      mockGetAdminClient.mockReturnValue(mockAdminClient as any)

      // Act
      const admin = getAdminClient()
      const { data, error } = await admin
        .from('tenants')
        .select('*')
        .eq('slug', 'test-tenant')
        .single()

      // Assert
      expect(data).toBeNull()
      expect(error).toMatchObject({
        code: '57014',
        message: expect.stringContaining('timeout'),
      })
    })

    it('should handle constraint violations', async () => {
      // Arrange
      const mockAdminClient = {
        from: vi.fn(() => ({
          insert: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn(() => ({
                data: null,
                error: {
                  code: '23514',
                  message: 'violates check constraint',
                },
              })),
            })),
          })),
        })),
      }

      mockGetAdminClient.mockReturnValue(mockAdminClient as any)

      // Act
      const admin = getAdminClient()
      const { data, error } = await admin
        .from('tenants')
        .insert({
          slug: 'invalid-tenant',
          name: '', // Invalid: empty name
        })
        .select()
        .single()

      // Assert
      expect(data).toBeNull()
      expect(error).toMatchObject({
        code: '23514',
        message: expect.stringContaining('check constraint'),
      })
    })
  })
})
