# @agency/monitoring Package

## User Information

- User has no formal software development experience or education
- User develops repositories 100% through agentic coding as a "solo-developer"
- User prefers best practices and highest standards
- User prefers up to date (2026) research conducted before task execution on proper implementation, best practices, and advanced coding patterns

## Purpose

Application monitoring and alerting system with tenant-aware observability. This package provides comprehensive monitoring for production applications with automated alerting and health checks.

## Agent Skills (Available Commands)
- `pnpm monitor:start` - Start monitoring service
- `pnpm monitor:health` - Check system health
- `pnpm monitor:alerts` - View active alerts
- `pnpm monitor:dashboard` - Access monitoring dashboard

## Integration Points
- Depends on: `@agency/database` for monitoring data, external monitoring services
- Used by: Applications for health monitoring
- See also: `@.agents/security.md` - Monitoring security guidelines
- Reference: `docs/MONITORING.md` - Complete monitoring implementation guide

## Core Patterns

### Tenant-Aware Monitoring
```typescript
// ✅ Correct - Tenant-specific monitoring
import { trackMetrics } from '@agency/monitoring';

async function monitorTenantPerformance(tenantId: string) {
  const metrics = await trackMetrics({
    tenant_id: tenantId,
    cpu_usage: await getCPUUsage(tenantId),
    memory_usage: await getMemoryUsage(tenantId),
    response_time: await getAverageResponseTime(tenantId),
    error_rate: await getErrorRate(tenantId),
    timestamp: new Date().toISOString(),
  });
  
  if (metrics.error_rate > 0.05) {
    await createAlert({
      tenant_id: tenantId,
      severity: 'high',
      message: 'Error rate exceeds threshold',
      metrics,
    });
  }
  
  return metrics;
}

// ❌ Incorrect - Cross-tenant monitoring
async function badMonitorAllTenants() {
  const metrics = await trackMetrics({
    cpu_usage: await getCPUUsage(), // No tenant context
    memory_usage: await getMemoryUsage(),
    // Cross-tenant data aggregation without isolation
  });
}
```

### Health Check Implementation
```typescript
// ✅ Correct - Comprehensive health checks
import { healthCheck } from '@agency/monitoring';

async function performHealthCheck(tenantId: string): Promise<HealthStatus> {
  const checks = await Promise.all([
    checkDatabaseHealth(tenantId),
    checkAPIServiceHealth(tenantId),
    checkExternalServiceHealth(tenantId),
    checkResourceUsage(tenantId),
  ]);
  
  const status = {
    tenant_id: tenantId,
    overall: checks.every(check => check.status === 'healthy') ? 'healthy' : 'unhealthy',
    checks,
    timestamp: new Date().toISOString(),
  };
  
  if (status.overall === 'unhealthy') {
    await createAlert({
      tenant_id: tenantId,
      severity: 'critical',
      message: 'Health check failed',
      details: status,
    });
  }
  
  return status;
}

// ❌ Incorrect - Incomplete health checks
async function badHealthCheck(tenantId: string) {
  return {
    status: 'healthy', // No actual checks performed
    tenant_id: tenantId,
  };
}
```

## Package Commands

```bash
# Start monitoring service
pnpm monitor:start --port=3006

# Check system health
pnpm monitor:health --tenant=tenant-123

# View active alerts
pnpm monitor:alerts --severity=high

# Access monitoring dashboard
pnpm monitor:dashboard --url=http://localhost:3006
```

## File Structure

```
packages/monitoring/
├── src/
│   ├── index.ts              # Main exports
│   ├── health.ts             # Health check implementation
│   ├── metrics.ts            # Metrics collection
│   ├── alerts.ts             # Alert management
│   ├── dashboard.ts          # Monitoring dashboard
│   └── types.ts              # Monitoring types
├── AGENTS.md                 # This file
├── package.json
└── tsconfig.json
```

## Key Exports

### trackMetrics()
```typescript
import { trackMetrics } from '@agency/monitoring';

await trackMetrics({
  tenant_id: 'tenant-123',
  cpu_usage: 45.2,
  memory_usage: 67.8,
  response_time: 150,
  error_rate: 0.02,
  timestamp: new Date().toISOString(),
});
```

### healthCheck()
```typescript
import { healthCheck } from '@agency/monitoring';

const status = await healthCheck('tenant-123');
// Returns: { overall: 'healthy', checks: [...], timestamp: '...' }
```

### createAlert()
```typescript
import { createAlert } from '@agency/monitoring';

await createAlert({
  tenant_id: 'tenant-123',
  severity: 'high',
  message: 'Database connection failed',
  details: { error_code: 'DB_CONN_FAILED' },
});
```

## Security Requirements

### Tenant Isolation
```typescript
// ✅ Correct - Tenant-scoped monitoring
async function getTenantMonitoring(tenantId: string) {
  return await getMonitoringData({
    tenant_id: tenantId,
    time_range: { hours: 24 },
  });
}

// ❌ Incorrect - Cross-tenant monitoring access
async function badGetAllMonitoring() {
  return await getMonitoringData(); // Cross-tenant data leak!
}
```

### Alert Privacy
```typescript
// ✅ Correct - Privacy-aware alerts
import { sanitizeAlertData } from '@agency/monitoring';

async function createSafeAlert(alertData: AlertData, tenantId: string) {
  const sanitized = await sanitizeAlertData(alertData);
  
  return await createAlert({
    ...sanitized,
    tenant_id: tenantId,
    privacy_level: 'tenant_only',
  });
}

// ❌ Incorrect - Exposing sensitive data in alerts
async function badCreateAlert(alertData: AlertData, tenantId: string) {
  return await createAlert({
    ...alertData, // Could contain sensitive data!
    tenant_id: tenantId,
  });
}
```

## Testing Patterns

### Mock Monitoring Service
```typescript
// test/setup.ts
import { vi } from 'vitest';
import { trackMetrics, healthCheck, createAlert } from '@agency/monitoring';

vi.mock('@agency/monitoring', () => ({
  trackMetrics: vi.fn(),
  healthCheck: vi.fn(),
  createAlert: vi.fn(),
}));
```

### Unit Tests
```typescript
import { trackMetrics, createAlert } from '@agency/monitoring';

describe('Monitoring System', () => {
  it('tracks metrics with tenant context', async () => {
    await trackMetrics({
      tenant_id: 'tenant-123',
      cpu_usage: 45.2,
      memory_usage: 67.8,
      response_time: 150,
      error_rate: 0.02,
      timestamp: new Date().toISOString(),
    });
    
    expect(trackMetrics).toHaveBeenCalledWith(
      expect.objectContaining({
        tenant_id: 'tenant-123',
        cpu_usage: 45.2,
        error_rate: 0.02,
      })
    );
  });
});
```

## Monitoring Categories

### Application Metrics
```typescript
// Track application-specific metrics
await trackMetrics({
  tenant_id: 'tenant-123',
  category: 'application',
  metrics: {
    active_users: 150,
    requests_per_second: 25.5,
    average_response_time: 120,
    error_rate: 0.01,
  },
});
```

### Infrastructure Metrics
```typescript
// Track infrastructure health
await trackMetrics({
  tenant_id: 'tenant-123',
  category: 'infrastructure',
  metrics: {
    cpu_usage: 45.2,
    memory_usage: 67.8,
    disk_usage: 78.5,
    network_io: 1024,
  },
});
```

### Business Metrics
```typescript
// Track business KPIs
await trackMetrics({
  tenant_id: 'tenant-123',
  category: 'business',
  metrics: {
    daily_active_users: 150,
    conversion_rate: 0.025,
    revenue_per_user: 45.50,
    customer_satisfaction: 4.2,
  },
});
```

## Dependencies

This package depends on:
- `@agency/database` - Monitoring data storage
- External monitoring services - For enhanced observability
- TypeScript - For type safety

## Progressive Documentation

For more details:
- `@.agents/security.md` - Security guidelines
- `@packages/database/AGENTS.md` - Database patterns
- `docs/MONITORING.md` - Complete monitoring implementation guide
