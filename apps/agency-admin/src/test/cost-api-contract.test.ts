/**
 * Test file to verify cost API contract alignment
 * This file can be used to validate that the dashboard and API routes work together correctly.
 */

import type {
  CostSummary,
  CostMetrics,
  BudgetAlert,
  OptimizationRecommendation,
  HTTP_STATUS,
  AuthenticationError,
  AuthorizationError,
  NetworkError,
} from '../types/cost-api'

// Test data validation functions
export function validateCostSummary(data: unknown): data is CostSummary {
  if (typeof data !== 'object' || data === null) return false
  
  const summary = data as Record<string, unknown>
  return (
    typeof summary.totalCost === 'number' &&
    typeof summary.storageCost === 'number' &&
    typeof summary.cicdCost === 'number' &&
    typeof summary.bandwidthCost === 'number' &&
    typeof summary.averageDailyCost === 'number' &&
    ['up', 'down', 'stable'].includes(summary.trendDirection as string) &&
    typeof summary.trendPercentage === 'number'
  )
}

export function validateCostMetrics(data: unknown): data is CostMetrics[] {
  if (!Array.isArray(data)) return false
  
  return data.every(item => {
    if (typeof item !== 'object' || item === null) return false
    
    const metric = item as Record<string, unknown>
    return (
      typeof metric.id === 'string' &&
      typeof metric.storageUsage === 'number' &&
      typeof metric.cicdRuntime === 'number' &&
      typeof metric.bandwidthUsage === 'number' &&
      typeof metric.totalCost === 'number' &&
      typeof metric.currency === 'string' &&
      typeof metric.timestamp === 'string' &&
      ['daily', 'weekly', 'monthly'].includes(metric.period as string) &&
      typeof metric.metadata === 'object'
    )
  })
}

export function validateBudgetAlert(data: unknown): data is BudgetAlert[] {
  if (!Array.isArray(data)) return false
  
  return data.every(item => {
    if (typeof item !== 'object' || item === null) return false
    
    const alert = item as Record<string, unknown>
    return (
      typeof alert.id === 'string' &&
      typeof alert.tenantId === 'string' &&
      typeof alert.name === 'string' &&
      ['storage', 'compute', 'bandwidth', 'total'].includes(alert.category as string) &&
      typeof alert.threshold === 'number' &&
      typeof alert.current === 'number' &&
      ['absolute', 'percentage'].includes(alert.thresholdType as string) &&
      ['low', 'medium', 'high', 'critical'].includes(alert.severity as string) &&
      typeof alert.active === 'boolean' &&
      Array.isArray(alert.notificationChannels) &&
      (alert.lastTriggered === undefined || typeof alert.lastTriggered === 'string') &&
      typeof alert.createdAt === 'string' &&
      typeof alert.updatedAt === 'string'
    )
  })
}

export function validateOptimizationRecommendation(data: unknown): data is OptimizationRecommendation[] {
  if (!Array.isArray(data)) return false
  
  return data.every(item => {
    if (typeof item !== 'object' || item === null) return false
    
    const rec = item as Record<string, unknown>
    return (
      typeof rec.id === 'string' &&
      typeof rec.tenantId === 'string' &&
      ['storage', 'compute', 'bandwidth', 'general'].includes(rec.category as string) &&
      typeof rec.title === 'string' &&
      typeof rec.description === 'string' &&
      typeof rec.estimatedSavings === 'number' &&
      ['easy', 'medium', 'hard'].includes(rec.difficulty as string) &&
      ['low', 'medium', 'high'].includes(rec.priority as string) &&
      ['pending', 'in_progress', 'completed', 'dismissed'].includes(rec.status as string) &&
      typeof rec.createdAt === 'string' &&
      (rec.reviewBy === undefined || typeof rec.reviewBy === 'string')
    )
  })
}

// Error handling test utilities
export function createTestAuthenticationError(): AuthenticationError {
  return new AuthenticationError('Test authentication error')
}

export function createTestAuthorizationError(): AuthorizationError {
  return new AuthorizationError('Test authorization error')
}

export function createTestNetworkError(): NetworkError {
  return new NetworkError('Test network error')
}

// Mock API response generators for testing
export function createMockCostSummary(): CostSummary {
  return {
    totalCost: 150.75,
    storageCost: 45.20,
    cicdCost: 85.30,
    bandwidthCost: 20.25,
    averageDailyCost: 21.53,
    trendDirection: 'up',
    trendPercentage: 12.5,
  }
}

export function createMockCostMetrics(): CostMetrics[] {
  return [
    {
      id: 'metric-1',
      storageUsage: 1073741824,
      cicdRuntime: 45,
      bandwidthUsage: 536870912,
      totalCost: 25.50,
      currency: 'USD',
      timestamp: '2026-03-16T12:00:00Z',
      period: 'daily',
      metadata: {},
    },
  ]
}

export function createMockBudgetAlerts(): BudgetAlert[] {
  return [
    {
      id: 'alert-1',
      tenantId: 'tenant-1',
      name: 'Storage Budget Alert',
      category: 'storage',
      threshold: 100,
      current: 85.5,
      thresholdType: 'absolute',
      severity: 'medium',
      active: true,
      notificationChannels: ['email'],
      lastTriggered: '2026-03-15T10:30:00Z',
      createdAt: '2026-03-10T12:00:00Z',
      updatedAt: '2026-03-16T09:15:00Z',
    },
  ]
}

export function createMockOptimizationRecommendations(): OptimizationRecommendation[] {
  return [
    {
      id: 'rec-1',
      tenantId: 'tenant-1',
      category: 'storage',
      title: 'Compress Unused Images',
      description: 'Compress old images to reduce storage costs',
      estimatedSavings: 25.50,
      difficulty: 'easy',
      priority: 'high',
      status: 'pending',
      createdAt: '2026-03-16T10:00:00Z',
      reviewBy: 'admin@example.com',
    },
  ]
}

// Test runner function
export function runContractTests(): boolean {
  try {
    // Test validation functions
    const validSummary = createMockCostSummary()
    const validMetrics = createMockCostMetrics()
    const validAlerts = createMockBudgetAlerts()
    const validRecommendations = createMockOptimizationRecommendations()

    const summaryValid = validateCostSummary(validSummary)
    const metricsValid = validateCostMetrics(validMetrics)
    const alertsValid = validateBudgetAlert(validAlerts)
    const recommendationsValid = validateOptimizationRecommendation(validRecommendations)

    // Test error creation
    const authError = createTestAuthenticationError()
    const authError = createTestAuthorizationError()
    const networkError = createTestNetworkError()

    const errorsValid = 
      authError instanceof AuthenticationError &&
      authError instanceof AuthorizationError &&
      networkError instanceof NetworkError

    // Test HTTP status constants
    const statusValid = 
      HTTP_STATUS.OK === 200 &&
      HTTP_STATUS.UNAUTHORIZED === 401 &&
      HTTP_STATUS.FORBIDDEN === 403 &&
      HTTP_STATUS.INTERNAL_SERVER_ERROR === 500

    return summaryValid && metricsValid && alertsValid && recommendationsValid && errorsValid && statusValid
  } catch (error) {
    console.error('Contract test failed:', error)
    return false
  }
}

// Export test utilities for external testing
export const ContractTests = {
  validateCostSummary,
  validateCostMetrics,
  validateBudgetAlert,
  validateOptimizationRecommendation,
  createMockCostSummary,
  createMockCostMetrics,
  createMockBudgetAlerts,
  createMockOptimizationRecommendations,
  runContractTests,
}
