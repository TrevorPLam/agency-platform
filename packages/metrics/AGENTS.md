# @agency/metrics Package

## User Information

- User has no formal software development experience or education
- User develops repositories 100% through agentic coding as a "solo-developer"
- User prefers best practices and highest standards
- User prefers up to date (2026) research conducted before task execution on proper implementation, best practices, and advanced coding patterns

## Purpose

DORA metrics collection and performance monitoring for development operations. This package provides automated metrics tracking for continuous improvement and compliance reporting.

## Agent Skills (Available Commands)
- `pnpm metrics:collect` - Collect DORA metrics
- `pnpm metrics:report` - Generate performance report
- `pnpm metrics:dashboard` - View metrics dashboard
- `pnpm metrics:export` - Export metrics data

## Integration Points
- Depends on: `@agency/database` for metrics storage, CI/CD for pipeline data
- Used by: Applications for performance tracking
- See also: `@.agents/security.md` - Metrics security guidelines
- Reference: `docs/METRICS.md` - Complete metrics implementation guide

## Core Patterns

### DORA Metrics Collection
```typescript
// ✅ Correct - Automated DORA metrics tracking
import { collectDeploymentMetrics } from '@agency/metrics';

async function trackDeployment(
  deploymentId: string,
  tenantId: string,
  environment: string
) {
  const metrics = await collectDeploymentMetrics({
    deployment_id: deploymentId,
    tenant_id: tenantId,
    environment,
    timestamp: new Date().toISOString(),
    deployment_frequency: calculateDeploymentFrequency(tenantId),
    lead_time_for_changes: await calculateLeadTime(deploymentId),
    change_failure_rate: await calculateFailureRate(tenantId),
    mean_time_to_recovery: await calculateMTTR(tenantId),
  });
  
  return await storeMetrics(metrics);
}

// ❌ Incorrect - Manual metrics tracking
async function badTrackDeployment(deploymentId: string) {
  return await storeMetrics({
    deployment_id: deploymentId,
    // No automated DORA calculations
  });
}
```

### Performance Monitoring
```typescript
// ✅ Correct - Comprehensive performance tracking
import { trackPerformance } from '@agency/metrics';

async function trackApplicationPerformance(
  operation: string,
  tenantId: string,
  metrics: PerformanceData
) {
  return await trackPerformance({
    operation,
    tenant_id: tenantId,
    duration: metrics.duration,
    memory_usage: metrics.memoryUsage,
    cpu_usage: metrics.cpuUsage,
    error_rate: metrics.errorRate,
    throughput: metrics.throughput,
    timestamp: new Date().toISOString(),
  });
}

// ❌ Incorrect - Incomplete performance tracking
async function badTrackPerformance(operation: string, duration: number) {
  return await trackPerformance({
    operation,
    duration,
    // Missing memory, CPU, error rate, etc.
  });
}
```

## Package Commands

```bash
# Collect DORA metrics
pnpm metrics:collect --scope=DORA --tenant=tenant-123

# Generate performance report
pnpm metrics:report --format=pdf --period=30d

# View metrics dashboard
pnpm metrics:dashboard --port=3005

# Export metrics data
pnpm metrics:export --format=json --output=./metrics.json
```

## File Structure

```
packages/metrics/
├── src/
│   ├── index.ts              # Main exports
│   ├── dora.ts               # DORA metrics collection
│   ├── performance.ts        # Performance monitoring
│   ├── reporting.ts          # Report generation
│   ├── dashboard.ts          # Dashboard interface
│   └── types.ts              # Metrics types
├── AGENTS.md                 # This file
├── package.json
└── tsconfig.json
```

## Key Exports

### collectDeploymentMetrics()
```typescript
import { collectDeploymentMetrics } from '@agency/metrics';

const doraMetrics = await collectDeploymentMetrics({
  deployment_id: 'deploy-123',
  tenant_id: 'tenant-456',
  environment: 'production',
  timestamp: new Date().toISOString(),
});
```

### trackPerformance()
```typescript
import { trackPerformance } from '@agency/metrics';

await trackPerformance({
  operation: 'database_query',
  tenant_id: 'tenant-456',
  duration: 150,
  memory_usage: 512,
  cpu_usage: 25,
  error_rate: 0.01,
  throughput: 1000,
});
```

## Security Requirements

### Tenant Isolation
```typescript
// ✅ Correct - Tenant-scoped metrics
async function getTenantMetrics(tenantId: string) {
  return await getMetrics({
    tenant_id: tenantId,
    date_range: {
      start: new Date('2024-01-01'),
      end: new Date(),
    },
  });
}

// ❌ Incorrect - Cross-tenant metrics access
async function badGetAllMetrics() {
  return await getMetrics(); // Cross-tenant data leak!
}
```

### Data Privacy
```typescript
// ✅ Correct - Anonymized metrics
import { anonymizeMetrics } from '@agency/metrics';

async function collectSafeMetrics(data: any, tenantId: string) {
  const anonymized = await anonymizeMetrics(data);
  
  return await storeMetrics({
    ...anonymized,
    tenant_id: tenantId,
    privacy_level: 'anonymized',
  });
}

// ❌ Incorrect - Raw data collection
async function badCollectMetrics(data: any, tenantId: string) {
  return await storeMetrics({
    ...data, // Could contain PII!
    tenant_id: tenantId,
  });
}
```

## Testing Patterns

### Mock Metrics Service
```typescript
// test/setup.ts
import { vi } from 'vitest';
import { collectDeploymentMetrics, trackPerformance } from '@agency/metrics';

vi.mock('@agency/metrics', () => ({
  collectDeploymentMetrics: vi.fn(),
  trackPerformance: vi.fn(),
  storeMetrics: vi.fn(),
}));
```

### Unit Tests
```typescript
import { collectDeploymentMetrics } from '@agency/metrics';

describe('Metrics Collection', () => {
  it('collects DORA metrics with all required fields', async () => {
    await collectDeploymentMetrics({
      deployment_id: 'deploy-123',
      tenant_id: 'tenant-456',
      environment: 'production',
      timestamp: new Date().toISOString(),
    });
    
    expect(collectDeploymentMetrics).toHaveBeenCalledWith(
      expect.objectContaining({
        deployment_id: 'deploy-123',
        tenant_id: 'tenant-456',
        environment: 'production',
      })
    );
  });
});
```

## DORA Metrics Implementation

### Deployment Frequency
```typescript
// Calculate deployment frequency per tenant
async function calculateDeploymentFrequency(tenantId: string): Promise<number> {
  const deployments = await getDeployments(tenantId, { days: 30 });
  return deployments.length / 30; // deployments per day
}
```

### Lead Time for Changes
```typescript
// Calculate time from commit to deployment
async function calculateLeadTime(deploymentId: string): Promise<number> {
  const deployment = await getDeployment(deploymentId);
  const commit = await getCommit(deployment.commit_sha);
  
  return deployment.timestamp - commit.timestamp; // in hours
}
```

### Change Failure Rate
```typescript
// Calculate percentage of failed deployments
async function calculateFailureRate(tenantId: string): Promise<number> {
  const deployments = await getDeployments(tenantId, { days: 30 });
  const failedDeployments = deployments.filter(d => d.status === 'failed');
  
  return (failedDeployments.length / deployments.length) * 100; // percentage
}
```

### Mean Time to Recovery
```typescript
// Calculate average time to recover from failures
async function calculateMTTR(tenantId: string): Promise<number> {
  const failures = await getFailures(tenantId, { days: 30 });
  const recoveryTimes = failures.map(f => f.recovery_time - f.failure_time);
  
  return recoveryTimes.reduce((sum, time) => sum + time, 0) / recoveryTimes.length;
}
```

## Dependencies

This package depends on:
- `@agency/database` - Metrics storage
- TypeScript - For type safety

## Progressive Documentation

For more details:
- `@.agents/security.md` - Security guidelines
- `@packages/database/AGENTS.md` - Database patterns
- `docs/METRICS.md` - Complete metrics implementation guide
