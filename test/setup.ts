import '@testing-library/jest-dom'
import { vi, beforeEach, afterEach } from 'vitest'

// Global test setup for React Testing Library
import { beforeAll, afterEach, afterAll } from 'vitest'

// Mock console methods in tests to reduce noise
const originalConsoleError = console.error
const originalConsoleWarn = console.warn

beforeAll(() => {
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning: ReactDOM.render is deprecated') ||
        args[0].includes('Warning: ReactDOM.unstable_renderSubtreeIntoContainer() is deprecated') ||
        args[0].includes('act(...) is not supported'))
    ) {
      return
    }
    originalConsoleError(...args)
  }

  console.warn = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('componentWillReceiveProps') ||
        args[0].includes('componentWillUpdate'))
    ) {
      return
    }
    originalConsoleWarn(...args)
  }
})

// Mock environment variables for testing
beforeEach(() => {
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'http://localhost:54321')
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'test-anon-key')
  vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'test-service-key')
  vi.stubEnv('NODE_ENV', 'test')
})

afterEach(() => {
  // Clean up DOM after each test
  document.body.innerHTML = ''
  // Clear mocked environment variables
  vi.unstubAllEnvs()
  vi.clearAllMocks()
})

afterAll(() => {
  // Restore original console methods
  console.error = originalConsoleError
  console.warn = originalConsoleWarn
})

// Mock IntersectionObserver for tests that need it
global.IntersectionObserver = class IntersectionObserver {
  constructor() { }
  disconnect() { }
  observe() { }
  unobserve() { }
}

// Mock ResizeObserver for tests that need it
global.ResizeObserver = class ResizeObserver {
  constructor() { }
  disconnect() { }
  observe() { }
  unobserve() { }
}

// Mock matchMedia for responsive tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => { },
    removeListener: () => { },
    addEventListener: () => { },
    removeEventListener: () => { },
    dispatchEvent: () => { },
  }),
})

// Global mocks for common dependencies
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(),
  SupabaseClient: vi.fn()
}))

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn()
  })),
  useSearchParams: vi.fn(() => new URLSearchParams()),
  usePathname: vi.fn(() => '/')
}))

// Mock Next.js headers
vi.mock('next/headers', () => ({
  headers: vi.fn(() => new Headers()),
  cookies: vi.fn(() => ({
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
    getAll: vi.fn(() => [])
  }))
}))
