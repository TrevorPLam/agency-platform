import { vi } from 'vitest'

/**
 * Creates a mock tenant for testing
 */
export function createMockTenant(overrides: Partial<MockTenant> = {}): MockTenant {
  return {
    id: 'tenant-123',
    name: 'Test Tenant',
    slug: 'test-tenant',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    ...overrides
  }
}

/**
 * Creates a mock user for testing
 */
export function createMockUser(overrides: Partial<MockUser> = {}): MockUser {
  return {
    id: 'user-123',
    email: 'user@example.com',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    ...overrides
  }
}

/**
 * Creates a mock tenant user relationship for testing
 */
export function createMockTenantUser(overrides: Partial<MockTenantUser> = {}): MockTenantUser {
  return {
    id: 'tenant-user-123',
    user_id: 'user-123',
    tenant_id: 'tenant-123',
    role: 'member',
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    ...overrides
  }
}

/**
 * Creates a mock Supabase client for testing
 */
export function createMockSupabaseClient(overrides: Partial<MockSupabaseClient> = {}): MockSupabaseClient {
  const defaultClient: MockSupabaseClient = {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null, error: null })
        })
      }),
      insert: vi.fn().mockResolvedValue({ error: null }),
      update: vi.fn().mockResolvedValue({ error: null }),
      delete: vi.fn().mockResolvedValue({ error: null })
    }),
    auth: {
      admin: {
        createUser: vi.fn().mockResolvedValue({ 
          data: { user: createMockUser() }, 
          error: null 
        }),
        deleteUser: vi.fn().mockResolvedValue({ error: null }),
        updateUser: vi.fn().mockResolvedValue({ 
          data: { user: createMockUser() }, 
          error: null 
        })
      },
      signInWithPassword: vi.fn().mockResolvedValue({ 
        data: { user: createMockUser(), session: null }, 
        error: null 
      }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      getUser: vi.fn().mockResolvedValue({ 
        data: { user: createMockUser() }, 
        error: null 
      })
    },
    storage: {
      from: vi.fn().mockReturnValue({
        upload: vi.fn().mockResolvedValue({ data: null, error: null }),
        download: vi.fn().mockResolvedValue({ data: null, error: null }),
        remove: vi.fn().mockResolvedValue({ data: null, error: null })
      })
    }
  }

  return { ...defaultClient, ...overrides }
}

/**
 * Creates test context with common mock objects
 */
export function createTestContext(overrides: Partial<TestContext> = {}): TestContext {
  const tenant = createMockTenant()
  const user = createMockUser()
  const tenantUser = createMockTenantUser({ user_id: user.id, tenant_id: tenant.id })

  return {
    tenant,
    user,
    tenantUser,
    client: createMockSupabaseClient(),
    ...overrides
  }
}

/**
 * Mock type definitions
 */
export interface MockTenant {
  id: string
  name: string
  slug: string
  created_at: string
  updated_at: string
}

export interface MockUser {
  id: string
  email: string
  created_at: string
  updated_at: string
}

export interface MockTenantUser {
  id: string
  user_id: string
  tenant_id: string
  role: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface MockSupabaseClient {
  from: ReturnType<typeof vi.fn>
  auth: {
    admin: {
      createUser: ReturnType<typeof vi.fn>
      deleteUser: ReturnType<typeof vi.fn>
      updateUser: ReturnType<typeof vi.fn>
    }
    signInWithPassword: ReturnType<typeof vi.fn>
    signOut: ReturnType<typeof vi.fn>
    getUser: ReturnType<typeof vi.fn>
  }
  storage: {
    from: ReturnType<typeof vi.fn>
  }
}

export interface TestContext {
  tenant: MockTenant
  user: MockUser
  tenantUser: MockTenantUser
  client: MockSupabaseClient
}
