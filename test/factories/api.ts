import { Factory } from '../utils/factory'

const { each } = Factory.Sync

// API and integration test data factories

// API response factory
export const apiResponseFactory = Factory.Sync.makeFactory({
  success: true,
  data: {},
  message: 'Operation successful',
  timestamp: each(() => new Date().toISOString()),
})

// Error response factory
export const errorResponseFactory = Factory.Sync.makeFactory({
  success: false,
  error: {
    code: 'ERROR_CODE',
    message: each(i => `Error message ${i}`),
    details: {}
  },
  timestamp: each(() => new Date().toISOString()),
})

// Analytics event factory
export const analyticsEventFactory = Factory.Sync.makeFactory({
  event: each(i => `event_${i}`),
  properties: each(i => ({
    user_id: `user-${i}`,
    tenant_id: `tenant-${i}`,
    timestamp: new Date().toISOString(),
    value: i * 10,
  })),
  timestamp: each(() => new Date().toISOString()),
})

// Auth session factory
export const authSessionFactory = Factory.Sync.makeFactory({
  user: {
    id: each(i => `user-${i}`),
    email: each(i => `user${i}@example.com`),
    name: each(i => `User ${i}`),
  },
  session: {
    token: each(i => `token-${i}`),
    expires_at: each(() => new Date(Date.now() + 3600000).toISOString()),
  },
  tenant: {
    id: each(i => `tenant-${i}`),
    slug: each(i => `tenant-${i}`),
    name: each(i => `Tenant ${i}`),
  },
})

// Cost metric factory
export const costMetricFactory = Factory.Sync.makeFactory({
  id: each(i => `metric-${i}`),
  tenant_id: each(i => `tenant-${i}`),
  name: each(i => `Metric ${i}`),
  value: each(i => Math.random() * 1000),
  unit: 'USD' as const,
  period: 'monthly' as const,
  created_at: each(() => new Date().toISOString()),
})

// Budget alert factory
export const budgetAlertFactory = Factory.Sync.makeFactory({
  id: each(i => `alert-${i}`),
  tenant_id: each(i => `tenant-${i}`),
  name: each(i => `Budget Alert ${i}`),
  threshold: each(i => i * 100),
  current_value: each(i => Math.random() * 200),
  severity: each(i => i % 2 === 0 ? 'warning' : 'critical'),
  is_active: true,
  created_at: each(() => new Date().toISOString()),
})

// Optimization recommendation factory
export const recommendationFactory = Factory.Sync.makeFactory({
  id: each(i => `rec-${i}`),
  tenant_id: each(i => `tenant-${i}`),
  title: each(i => `Recommendation ${i}`),
  description: each(i => `Description for recommendation ${i}`),
  impact_level: each(i => (i % 3 === 0 ? 'high' : i % 2 === 0 ? 'medium' : 'low')),
  estimated_savings: each(i => Math.random() * 500),
  status: 'pending' as const,
  created_at: each(() => new Date().toISOString()),
})

// Helper functions
export const createAPIResponseWithData = <T>(data: T) => {
  return apiResponseFactory.build({ data })
}

export const createErrorResponseWithCode = (code: string, message: string) => {
  return errorResponseFactory.build({
    error: { code, message, details: {} }
  })
}

export const createAuthSessionForTenant = (tenantId: string, userId: string) => {
  return authSessionFactory.build({
    user: { id: userId, email: `${userId}@example.com`, name: `User ${userId}` },
    tenant: { id: tenantId, slug: tenantId, name: `Tenant ${tenantId}` },
  })
}

export const createCostMetricsForTenant = (tenantId: string, count: number = 5) => {
  return costMetricFactory.buildList(count, { tenant_id: tenantId })
}

export const resetAPIFactories = () => {
  apiResponseFactory.resetSequenceNumber()
  errorResponseFactory.resetSequenceNumber()
  analyticsEventFactory.resetSequenceNumber()
  authSessionFactory.resetSequenceNumber()
  costMetricFactory.resetSequenceNumber()
  budgetAlertFactory.resetSequenceNumber()
  recommendationFactory.resetSequenceNumber()
}
