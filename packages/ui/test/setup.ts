import '@testing-library/jest-dom'
import { expect } from 'vitest'
import { axe, toHaveNoViolations } from 'jest-axe'

// Extend Jest matchers for accessibility testing
expect.extend(toHaveNoViolations)

// Mock window object for node environment
if (typeof window === 'undefined') {
  (global as any).window = {
    matchMedia: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => {},
    }),
  }
}

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
}
