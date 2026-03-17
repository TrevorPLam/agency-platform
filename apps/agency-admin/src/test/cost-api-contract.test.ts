import { describe, expect, it } from 'vitest'
import type { BudgetAlert, CostMetrics, CostSummary, OptimizationRecommendation } from '../types/cost-api'
import { AuthenticationError, AuthorizationError, HTTP_STATUS, NetworkError } from '../types/cost-api'

function validateCostSummary(data: unknown): data is CostSummary {
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

function validateCostMetrics(data: unknown): data is CostMetrics[] {
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

function validateBudgetAlert(data: unknown): data is BudgetAlert[] {
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

function validateOptimizationRecommendation(data: unknown): data is OptimizationRecommendation[] {
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

function createTestAuthenticationError(): AuthenticationError {
  return new AuthenticationError('Test authentication error')
}

function createTestAuthorizationError(): AuthorizationError {
  return new AuthorizationError('Test authorization error')
}

function createTestNetworkError(): NetworkError {
  return new NetworkError('Test network error')
}

function createMockCostSummary(): CostSummary {
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

function createMockCostMetrics(): CostMetrics[] {
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

function createMockBudgetAlerts(): BudgetAlert[] {
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

function createMockOptimizationRecommendations(): OptimizationRecommendation[] {
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

describe('cost API contract', () => {
  it('validates representative payloads', () => {
    expect(validateCostSummary(createMockCostSummary())).toBe(true)
    expect(validateCostMetrics(createMockCostMetrics())).toBe(true)
    expect(validateBudgetAlert(createMockBudgetAlerts())).toBe(true)
    expect(validateOptimizationRecommendation(createMockOptimizationRecommendations())).toBe(true)
  })

  it('creates typed API errors', () => {
    expect(createTestAuthenticationError()).toBeInstanceOf(AuthenticationError)
    expect(createTestAuthorizationError()).toBeInstanceOf(AuthorizationError)
    expect(createTestNetworkError()).toBeInstanceOf(NetworkError)
  })

  it('maintains expected HTTP status constants', () => {
    expect(HTTP_STATUS.OK).toBe(200)
    expect(HTTP_STATUS.UNAUTHORIZED).toBe(401)
    expect(HTTP_STATUS.FORBIDDEN).toBe(403)
    expect(HTTP_STATUS.INTERNAL_SERVER_ERROR).toBe(500)
  })
})
