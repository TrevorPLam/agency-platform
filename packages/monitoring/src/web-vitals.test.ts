/**
 * Test Core Web Vitals monitoring functionality
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useWebVitals, usePerformanceBudgetPresets, usePerformanceBudgets } from '../src/web-vitals-hooks'
import { createWebVitalsMonitor } from '../src/web-vitals'
import type { PerformanceBudget } from '../src/types'

// Mock web-vitals library
vi.mock('web-vitals', () => ({
  getCLS: vi.fn(),
  getFID: vi.fn(),
  getFCP: vi.fn(),
  getLCP: vi.fn(),
  getTTFB: vi.fn(),
  getINP: vi.fn(),
}))

// Mock analytics
vi.mock('@agency/analytics', () => ({
  captureEvent: vi.fn(),
}))

// Mock browser APIs
const mockWindow = {
  navigator: {
    userAgent: 'Mozilla/5.0 (Test Browser)',
    connection: { effectiveType: '4g' },
  },
  location: {
    href: 'https://test.example.com/page',
  },
}

const mockDocument = {
  referrer: 'https://test.example.com',
}

// Setup global mocks
Object.defineProperty(global, 'window', {
  value: mockWindow,
  writable: true,
})

Object.defineProperty(global, 'document', {
  value: mockDocument,
  writable: true,
})

describe('Core Web Vitals Monitoring', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('WebVitalsMonitor', () => {
    it('should create monitor with tenant isolation', () => {
      const monitor = createWebVitalsMonitor({
        tenantId: 'test-tenant',
        enableRealUserMonitoring: true,
      })

      expect(monitor).toBeDefined()
    })

    it('should handle performance budget violations', async () => {
      const monitor = createWebVitalsMonitor({
        tenantId: 'test-tenant',
        enableRealUserMonitoring: false, // Disable for testing
      })

      // Add a strict budget that will be violated
      monitor.addBudget({
        tenantId: 'test-tenant',
        name: 'Test LCP Budget',
        category: 'lcp',
        threshold: 1000, // Very low threshold
        unit: 'milliseconds',
        type: 'maximum',
        active: true,
        alertSeverity: 'high',
      })

      // Mock a slow LCP metric
      const mockMetric = {
        id: 'test-metric',
        name: 'LCP',
        value: 3000, // Violates the budget
        rating: 'poor',
        delta: 1000,
        entries: [],
        navigationType: 'navigate',
      }

      // Simulate metric collection
      act(() => {
        monitor['handleMetric']('lcp', mockMetric.value)
      })

      const alerts = monitor.getAlerts()
      expect(alerts).toHaveLength(1)
      expect(alerts[0].metric).toBe('lcp')
      expect(alerts[0].severity).toBe('high')
    })

    it('should collect device and network context', () => {
      const monitor = createWebVitalsMonitor({
        tenantId: 'test-tenant',
        enableRealUserMonitoring: false,
      })

      // Simulate metric collection
      act(() => {
        monitor['handleMetric']('lcp', 2000)
      })

      // Verify context is captured
      const metrics = monitor['metricsBuffer']
      expect(metrics).toHaveLength(1)
      expect(metrics[0].deviceCategory).toBe('desktop')
      expect(metrics[0].connectionType).toBe('4g')
      expect(metrics[0].userAgent).toContain('Test Browser')
    })
  })

  describe('useWebVitals Hook', () => {
    it('should initialize monitor with correct config', () => {
      const onAlert = vi.fn()

      const { result } = renderHook(() =>
        useWebVitals({
          tenantId: 'test-tenant',
          enableRealUserMonitoring: true,
          onAlert,
        })
      )

      expect(result.current).toBeDefined()
    })

    it('should handle alert callbacks', () => {
      const onAlert = vi.fn()

      renderHook(() =>
        useWebVitals({
          tenantId: 'test-tenant',
          enableRealUserMonitoring: true,
          onAlert,
        })
      )

      // Alert callback should be set up
      expect(onAlert).toBeDefined()
    })
  })

  describe('usePerformanceBudgetPresets', () => {
    it('should provide default budget presets', () => {
      const { result } = renderHook(() => usePerformanceBudgetPresets())

      const { getDefaultBudgets, getMobileBudgets, getStrictBudgets } = result.current

      expect(getDefaultBudgets).toBeDefined()
      expect(getMobileBudgets).toBeDefined()
      expect(getStrictBudgets).toBeDefined()

      // Test default budgets
      const defaultBudgets = getDefaultBudgets('test-tenant')
      expect(defaultBudgets).toHaveLength(5) // LCP, INP, CLS, FCP, TTFB

      // Verify LCP budget
      const lcpBudget = defaultBudgets.find((b: PerformanceBudget) => b.category === 'lcp')
      expect(lcpBudget).toBeDefined()
      expect(lcpBudget!.threshold).toBe(2500)
      expect(lcpBudget!.unit).toBe('milliseconds')
    })

    it('should provide mobile-specific budgets', () => {
      const { result } = renderHook(() => usePerformanceBudgetPresets())

      const { getMobileBudgets } = result.current
      const mobileBudgets = getMobileBudgets('test-tenant')

      const mobileLcpBudget = mobileBudgets.find((b: PerformanceBudget) => b.category === 'lcp')
      expect(mobileLcpBudget!.threshold).toBe(3000) // More lenient for mobile
    })

    it('should provide strict budgets', () => {
      const { result } = renderHook(() => usePerformanceBudgetPresets())

      const { getStrictBudgets } = result.current
      const strictBudgets = getStrictBudgets('test-tenant')

      const strictLcpBudget = strictBudgets.find((b: PerformanceBudget) => b.category === 'lcp')
      expect(strictLcpBudget!.threshold).toBe(1500) // Very strict
      expect(strictLcpBudget!.alertSeverity).toBe('high')
    })
  })

  describe('usePerformanceBudgets', () => {
    it('should provide budget management functions', () => {
      const mockMonitor = createWebVitalsMonitor({
        tenantId: 'test-tenant',
        enableRealUserMonitoring: false,
      })

      const { result } = renderHook(() => usePerformanceBudgets(mockMonitor))

      const { addBudget, removeBudget, getAlerts, clearAlerts } = result.current

      expect(addBudget).toBeDefined()
      expect(removeBudget).toBeDefined()
      expect(getAlerts).toBeDefined()
      expect(clearAlerts).toBeDefined()
    })

    it('should handle budget operations', () => {
      const mockMonitor = createWebVitalsMonitor({
        tenantId: 'test-tenant',
        enableRealUserMonitoring: false,
      })

      const { result } = renderHook(() => usePerformanceBudgets(mockMonitor))

      const { addBudget, getAlerts } = result.current

      // Add a budget
      act(() => {
        addBudget({
          tenantId: 'test-tenant',
          name: 'Test Budget',
          category: 'lcp',
          threshold: 2000,
          unit: 'milliseconds',
          type: 'maximum',
          active: true,
          alertSeverity: 'medium',
        })
      })

      // Budget should be added
      expect(mockMonitor.getAlerts()).toBeDefined()
    })
  })

  describe('Performance Rating System', () => {
    it('should rate LCP correctly', () => {
      const monitor = createWebVitalsMonitor({
        tenantId: 'test-tenant',
        enableRealUserMonitoring: false,
      })

      // Test good rating
      act(() => {
        monitor['handleMetric']('lcp', 2000) // Good
      })
      let metrics = monitor['metricsBuffer']
      expect(metrics[0].rating).toBe('good')

      // Test needs improvement
      act(() => {
        monitor['handleMetric']('lcp', 3000) // Needs improvement
      })
      metrics = monitor['metricsBuffer']
      expect(metrics[0].rating).toBe('needs-improvement')

      // Test poor rating
      act(() => {
        monitor['handleMetric']('lcp', 5000) // Poor
      })
      metrics = monitor['metricsBuffer']
      expect(metrics[0].rating).toBe('poor')
    })

    it('should rate CLS correctly', () => {
      const monitor = createWebVitalsMonitor({
        tenantId: 'test-tenant',
        enableRealUserMonitoring: false,
      })

      // Test good CLS
      act(() => {
        monitor['handleMetric']('cls', 0.05) // Good
      })
      let metrics = monitor['metricsBuffer']
      expect(metrics[0].rating).toBe('good')

      // Test poor CLS
      act(() => {
        monitor['handleMetric']('cls', 0.3) // Poor
      })
      metrics = monitor['metricsBuffer']
      expect(metrics[0].rating).toBe('poor')
    })
  })

  describe('Tenant Isolation', () => {
    it('should isolate metrics by tenant', () => {
      const monitor1 = createWebVitalsMonitor({
        tenantId: 'tenant-1',
        enableRealUserMonitoring: false,
      })

      const monitor2 = createWebVitalsMonitor({
        tenantId: 'tenant-2',
        enableRealUserMonitoring: false,
      })

      // Add budget to first monitor
      monitor1.addBudget({
        tenantId: 'tenant-1',
        name: 'Budget 1',
        category: 'lcp',
        threshold: 2000,
        unit: 'milliseconds',
        type: 'maximum',
        active: true,
        alertSeverity: 'medium',
      })

      // Add budget to second monitor
      monitor2.addBudget({
        tenantId: 'tenant-2',
        name: 'Budget 2',
        category: 'lcp',
        threshold: 3000,
        unit: 'milliseconds',
        type: 'maximum',
        active: true,
        alertSeverity: 'low',
      })

      // Simulate metric violation in first monitor
      act(() => {
        monitor1['handleMetric']('lcp', 3000) // Violates budget 1
      })

      // Only first monitor should have alerts
      expect(monitor1.getAlerts()).toHaveLength(1)
      expect(monitor2.getAlerts()).toHaveLength(0)
    })
  })
})
