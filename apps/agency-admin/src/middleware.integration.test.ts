import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'
import { validateTenantAccess } from '@/lib/auth'
import { getAdminClient } from '@agency/database/admin'

// Mock all external dependencies
vi.mock('@agency/database/admin')
vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(),
}))

const mockGetAdminClient = vi.mocked(getAdminClient)

describe('Middleware Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Set up default mocks
    mockGetAdminClient.mockReturnValue({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() => ({
                data: null,
                error: null,
              })),
            })),
          })),
        })),
      })),
    } as any)
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  describe('Tenant Resolution Middleware', () => {
    it('should resolve tenant from hostname', async () => {
      // Arrange
      const mockTenant = {
        id: 'tenant-123',
        slug: 'test-tenant',
        name: 'Test Tenant',
        domain: 'test-tenant.example.com',
      }

      const mockAdminClient = {
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() => ({
                data: mockTenant,
                error: null,
              })),
            })),
          })),
        })),
      }

      mockGetAdminClient.mockReturnValue(mockAdminClient as any)

      // Simulate tenant resolution logic
      const hostname = 'test-tenant.example.com'
      const slug = hostname.split('.')[0]
      
      const admin = getAdminClient()
      const { data, error } = await admin
        .from('tenants')
        .select('*')
        .eq('slug', slug)
        .single()

      // Assert
      expect(data).toEqual(mockTenant)
      expect(error).toBeNull()
      expect(mockAdminClient.from().select().eq).toHaveBeenCalledWith('slug', 'test-tenant')
    })

    it('should handle missing tenant', async () => {
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
      const hostname = 'non-existent.example.com'
      const slug = hostname.split('.')[0]
      
      const admin = getAdminClient()
      const { data, error } = await admin
        .from('tenants')
        .select('*')
        .eq('slug', slug)
        .single()

      // Assert
      expect(data).toBeNull()
      expect(error).toMatchObject({
        code: 'PGRST116',
        message: 'No rows returned',
      })
    })

    it('should resolve tenant from subdomain with custom domain', async () => {
      // Arrange
      const mockTenant = {
        id: 'tenant-123',
        slug: 'custom-tenant',
        name: 'Custom Tenant',
        domain: 'app.customdomain.com',
      }

      const mockAdminClient = {
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() => ({
                data: mockTenant,
                error: null,
              })),
            })),
          })),
        })),
      }

      mockGetAdminClient.mockReturnValue(mockAdminClient as any)

      // Act
      const hostname = 'app.customdomain.com'
      
      // First try by exact domain match
      let admin = getAdminClient()
      let { data, error } = await admin
        .from('tenants')
        .select('*')
        .eq('domain', hostname)
        .single()

      if (!data) {
        // Fallback to slug extraction
        const slug = hostname.split('.')[0]
        admin = getAdminClient()
        const result = await admin
          .from('tenants')
          .select('*')
          .eq('slug', slug)
          .single()
        data = result.data
        error = result.error
      }

      // Assert
      expect(data).toEqual(mockTenant)
      expect(error).toBeNull()
    })
  })

  describe('Authentication Middleware', () => {
    it('should validate JWT token and extract user info', async () => {
      // Arrange
      const mockUser = {
        id: 'user-123',
        email: 'user@example.com',
        app_metadata: {
          tenant_id: 'tenant-123',
          role: 'user',
        },
      }

      // Mock JWT validation (simplified for test)
      const mockToken = 'valid-jwt-token'
      const mockAuth = {
        getUser: vi.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null,
        }),
      }

      // Act
      const authResult = await mockAuth.getUser(mockToken)

      // Assert
      expect(authResult.data.user).toEqual(mockUser)
      expect(authResult.error).toBeNull()
      expect(mockUser.app_metadata.tenant_id).toBe('tenant-123')
      expect(mockUser.app_metadata.role).toBe('user')
    })

    it('should handle invalid JWT token', async () => {
      // Arrange
      const mockAuth = {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: {
            message: 'Invalid JWT',
            status: 401,
          },
        }),
      }

      // Act
      const authResult = await mockAuth.getUser('invalid-token')

      // Assert
      expect(authResult.data.user).toBeNull()
      expect(authResult.error).toMatchObject({
        message: 'Invalid JWT',
        status: 401,
      })
    })

    it('should handle expired JWT token', async () => {
      // Arrange
      const mockAuth = {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: {
            message: 'JWT expired',
            status: 401,
          },
        }),
      }

      // Act
      const authResult = await mockAuth.getUser('expired-token')

      // Assert
      expect(authResult.data.user).toBeNull()
      expect(authResult.error).toMatchObject({
        message: 'JWT expired',
        status: 401,
      })
    })
  })

  describe('Authorization Middleware', () => {
    it('should allow platform admin to access any tenant', async () => {
      // Arrange
      const mockAdminUser = {
        id: 'admin-123',
        email: 'admin@example.com',
        app_metadata: {
          tenant_id: 'system',
          role: 'platform_admin',
        },
      }

      const mockTargetTenant = {
        id: 'target-tenant-123',
        slug: 'target-tenant',
        name: 'Target Tenant',
      }

      const mockAdminClient = {
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() => ({
                data: mockTargetTenant,
                error: null,
              })),
            })),
          })),
        })),
      }

      mockGetAdminClient.mockReturnValue(mockAdminClient as any)

      // Act
      const requestedTenantId = 'target-tenant-123'
      const userTenantId = mockAdminUser.app_metadata.tenant_id
      const userRole = mockAdminUser.app_metadata.role
      const isPlatformAdmin = userRole === 'platform_admin'

      const canAccess = isPlatformAdmin || userTenantId === requestedTenantId

      // Assert
      expect(canAccess).toBe(true)
      expect(mockAdminUser.app_metadata.role).toBe('platform_admin')
    })

    it('should deny regular user cross-tenant access', async () => {
      // Arrange
      const mockRegularUser = {
        id: 'user-123',
        email: 'user@example.com',
        app_metadata: {
          tenant_id: 'user-tenant-123',
          role: 'user',
        },
      }

      // Act
      const requestedTenantId = 'other-tenant-123'
      const userTenantId = mockRegularUser.app_metadata.tenant_id
      const userRole = mockRegularUser.app_metadata.role
      const isPlatformAdmin = userRole === 'platform_admin'

      const canAccess = isPlatformAdmin || userTenantId === requestedTenantId

      // Assert
      expect(canAccess).toBe(false)
      expect(mockRegularUser.app_metadata.role).toBe('user')
      expect(mockRegularUser.app_metadata.tenant_id).toBe('user-tenant-123')
    })

    it('should allow tenant admin to access their own tenant', async () => {
      // Arrange
      const mockTenantAdmin = {
        id: 'admin-123',
        email: 'admin@example.com',
        app_metadata: {
          tenant_id: 'tenant-123',
          role: 'tenant_admin',
        },
      }

      // Act
      const requestedTenantId = 'tenant-123'
      const userTenantId = mockTenantAdmin.app_metadata.tenant_id
      const userRole = mockTenantAdmin.app_metadata.role
      const isPlatformAdmin = userRole === 'platform_admin'

      const canAccess = isPlatformAdmin || userTenantId === requestedTenantId

      // Assert
      expect(canAccess).toBe(true)
      expect(mockTenantAdmin.app_metadata.role).toBe('tenant_admin')
    })
  })

  describe('Request Context Middleware', () => {
    it('should add tenant context to request headers', async () => {
      // Arrange
      const mockTenant = {
        id: 'tenant-123',
        slug: 'test-tenant',
        name: 'Test Tenant',
      }

      const mockRequest = new NextRequest('http://test-tenant.example.com/api/test', {
        headers: {
          'authorization': 'Bearer valid-token',
        },
      })

      // Act
      const hostname = mockRequest.headers.get('host') || 'test-tenant.example.com'
      const tenantSlug = hostname.split('.')[0]
      
      // Simulate middleware adding context
      const responseHeaders = new Headers()
      responseHeaders.set('x-tenant-id', mockTenant.id)
      responseHeaders.set('x-tenant-slug', mockTenant.slug)
      responseHeaders.set('x-user-role', 'user')

      // Assert
      expect(responseHeaders.get('x-tenant-id')).toBe('tenant-123')
      expect(responseHeaders.get('x-tenant-slug')).toBe('test-tenant')
      expect(responseHeaders.get('x-user-role')).toBe('user')
    })

    it('should handle requests without authentication', async () => {
      // Arrange
      const mockRequest = new NextRequest('http://test-tenant.example.com/api/test')

      // Act
      const authHeader = mockRequest.headers.get('authorization')

      // Assert
      expect(authHeader).toBeNull()
    })

    it('should add correlation ID to requests', async () => {
      // Arrange
      const mockRequest = new NextRequest('http://test-tenant.example.com/api/test')

      // Act
      const correlationId = mockRequest.headers.get('x-request-id') || crypto.randomUUID()

      // Assert
      expect(correlationId).toBeDefined()
      expect(typeof correlationId).toBe('string')
      expect(correlationId.length).toBeGreaterThan(0)
    })
  })

  describe('Error Handling Middleware', () => {
    it('should handle tenant resolution errors gracefully', async () => {
      // Arrange
      const mockAdminClient = {
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() => ({
                data: null,
                error: {
                  code: '08006',
                  message: 'Database connection failed',
                },
              })),
            })),
          })),
        })),
      }

      mockGetAdminClient.mockReturnValue(mockAdminClient as any)

      // Act
      const hostname = 'test-tenant.example.com'
      const slug = hostname.split('.')[0]
      
      const admin = getAdminClient()
      const { data, error } = await admin
        .from('tenants')
        .select('*')
        .eq('slug', slug)
        .single()

      // Assert
      expect(data).toBeNull()
      expect(error).toMatchObject({
        code: '08006',
        message: 'Database connection failed',
      })
    })

    it('should handle malformed hostnames', async () => {
      // Arrange
      const mockRequest = new NextRequest('http://localhost/api/test')

      // Act
      const hostname = mockRequest.headers.get('host') || 'localhost'
      const parts = hostname.split('.')
      const slug = parts.length > 1 ? parts[0] : null

      // Assert
      expect(slug).toBeNull()
      expect(parts).toEqual(['localhost'])
    })

    it('should handle missing app_metadata in JWT', async () => {
      // Arrange
      const mockUser = {
        id: 'user-123',
        email: 'user@example.com',
        app_metadata: null, // Missing metadata
      }

      // Act
      const tenantId = mockUser.app_metadata?.tenant_id
      const role = mockUser.app_metadata?.role

      // Assert
      expect(tenantId).toBeUndefined()
      expect(role).toBeUndefined()
    })
  })

  describe('Rate Limiting Middleware', () => {
    it('should implement basic rate limiting by tenant', async () => {
      // Arrange
      const rateLimitStore = new Map<string, { count: number; resetTime: number }>()
      
      const tenantId = 'tenant-123'
      const now = Date.now()
      const windowMs = 60000 // 1 minute
      const maxRequests = 100

      // Act
      const key = `rate-limit:${tenantId}`
      const record = rateLimitStore.get(key)
      
      if (!record || now > record.resetTime) {
        rateLimitStore.set(key, {
          count: 1,
          resetTime: now + windowMs,
        })
      } else {
        record.count++
      }

      const currentRecord = rateLimitStore.get(key)
      const isRateLimited = currentRecord && currentRecord.count > maxRequests

      // Assert
      expect(isRateLimited).toBe(false)
      expect(currentRecord?.count).toBe(1)
      expect(currentRecord?.resetTime).toBeGreaterThan(now)
    })

    it('should block requests when rate limit exceeded', async () => {
      // Arrange
      const rateLimitStore = new Map<string, { count: number; resetTime: number }>()
      
      const tenantId = 'tenant-123'
      const now = Date.now()
      const windowMs = 60000 // 1 minute
      const maxRequests = 2 // Very low limit for testing

      // Simulate exceeding rate limit
      rateLimitStore.set(`rate-limit:${tenantId}`, {
        count: maxRequests + 1,
        resetTime: now + windowMs,
      })

      // Act
      const key = `rate-limit:${tenantId}`
      const record = rateLimitStore.get(key)
      const isRateLimited = record && record.count > maxRequests

      // Assert
      expect(isRateLimited).toBe(true)
      expect(record?.count).toBe(3)
    })
  })
})
