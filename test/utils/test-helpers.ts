import { vi, beforeEach, afterEach } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'

// Mock Supabase client for testing
export const createMockSupabaseClient = () => {
  return {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => ({
            data: null,
            error: null
          }))
        })),
        order: vi.fn(() => ({
          data: [],
          error: null
        }))
      }))
    })),
    auth: {
      getUser: vi.fn(() => ({
        data: { user: null },
        error: null
      })),
      signInWithPassword: vi.fn(() => ({
        data: { user: null, session: null },
        error: null
      })),
      signOut: vi.fn(() => ({
        error: null
      }))
    },
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn(() => ({
          data: null,
          error: null
        })),
        getPublicUrl: vi.fn(() => ({
          data: { publicUrl: '' }
        }))
      }))
    }
  } as unknown as SupabaseClient
}

// Mock Next.js router
export const createMockRouter = () => {
  return {
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    pathname: '/',
    query: {},
    asPath: '/'
  }
}

// Mock fetch for API tests
export const createMockFetch = (response: any, options?: { status?: number; delay?: number }) => {
  return vi.fn(() => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          ok: (options?.status || 200) < 400,
          status: options?.status || 200,
          json: () => Promise.resolve(response),
          text: () => Promise.resolve(JSON.stringify(response)),
          headers: new Headers({
            'Content-Type': 'application/json'
          })
        })
      }, options?.delay || 0)
    })
  })
}

// Test context helpers
export const createTestContext = (overrides?: any) => {
  return {
    user: {
      id: 'test-user-id',
      email: 'test@example.com',
      name: 'Test User'
    },
    tenant: {
      id: 'test-tenant-id',
      slug: 'test-tenant',
      name: 'Test Tenant'
    },
    ...overrides
  }
}

// Async test utilities
export const waitFor = (condition: () => boolean, timeout = 5000) => {
  return new Promise((resolve, reject) => {
    const startTime = Date.now()
    
    const check = () => {
      if (condition()) {
        resolve(true)
      } else if (Date.now() - startTime > timeout) {
        reject(new Error('Timeout waiting for condition'))
      } else {
        setTimeout(check, 50)
      }
    }
    
    check()
  })
}

export const flushPromises = () => new Promise(resolve => setTimeout(resolve, 0))

// DOM testing utilities
export const fireEvent = {
  click: (element: HTMLElement) => {
    element.click()
  },
  change: (element: HTMLElement, value: string) => {
    ;(element as HTMLInputElement).value = value
    element.dispatchEvent(new Event('input', { bubbles: true }))
    element.dispatchEvent(new Event('change', { bubbles: true }))
  },
  submit: (form: HTMLFormElement) => {
    form.dispatchEvent(new Event('submit', { bubbles: true }))
  }
}

// Mock environment variables
export const setMockEnvVars = (vars: Record<string, string>) => {
  Object.entries(vars).forEach(([key, value]) => {
    vi.stubEnv(key, value)
  })
}

export const clearMockEnvVars = () => {
  vi.unstubAllEnvs()
}

// Test cleanup utilities
beforeEach(() => {
  vi.clearAllMocks()
})

afterEach(() => {
  vi.restoreAllMocks()
  clearMockEnvVars()
})
