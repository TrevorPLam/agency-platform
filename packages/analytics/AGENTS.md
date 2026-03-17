# @agency/analytics Package

## User Information

- User has no formal software development experience or education
- User develops repositories 100% through agentic coding as a "solo-developer"
- User prefers best practices and highest standards
- User prefers up to date (2026) research conducted before task execution on proper implementation, best practices, and advanced coding patterns

## Purpose

PostHog wrapper with tenant-aware analytics tracking. This package provides a centralized analytics system that respects multi-tenant isolation and privacy requirements.

## Agent Skills (Available Commands)
- `pnpm test` - Run analytics tests with coverage
- `pnpm build` - Build analytics package
- `pnpm dev` - Start development mode

## Integration Points
- Depends on: `posthog-js` for analytics tracking, `@agency/database` for tenant context
- Used by: All applications for event tracking
- See also: `@.agents/security.md` for privacy guidelines
- Reference: PostHog documentation for event tracking patterns

## Core Patterns

### Tenant-Aware Analytics
```typescript
// ✅ Correct - Tenant-specific tracking
import { trackEvent } from '@agency/analytics';

function trackUserAction(action: string, tenantId: string) {
  return trackEvent(action, {
    tenant_id: tenantId,
    timestamp: new Date().toISOString(),
  });
}

// ❌ Incorrect - Cross-tenant tracking
function badTrack(action: string) {
  return trackEvent(action); // No tenant context
}
```

### Privacy-Compliant Tracking
```typescript
// ✅ Correct - Privacy-first approach
import { identifyUser } from '@agency/analytics';

function identifyTenantUser(userId: string, tenantId: string) {
  return identifyUser(userId, {
    tenant_id: tenantId,
    // Never include PII in analytics
    user_type: 'tenant_user',
  });
}

// ❌ Incorrect - PII exposure
function badIdentify(userId: string, email: string) {
  return identifyUser(userId, { email }); // PII exposed!
}
```

## Package Commands

```bash
# Build package
pnpm build

# Run tests
pnpm test

# Type check
pnpm type-check

# Lint
pnpm lint
```

## File Structure

```
packages/analytics/
├── src/
│   ├── index.ts              # Main exports
│   ├── client.ts             # PostHog client factory
│   ├── events.ts             # Event definitions
│   └── types.ts              # Analytics types
├── AGENTS.md                 # This file
├── package.json
└── tsconfig.json
```

## Key Exports

### trackEvent()
```typescript
import { trackEvent } from '@agency/analytics';

// Track user actions with tenant context
trackEvent('button_clicked', {
  button_id: 'submit',
  tenant_id: 'tenant-123',
});
```

### identifyUser()
```typescript
import { identifyUser } from '@agency/analytics';

// Identify users without PII
identifyUser('user-123', {
  tenant_id: 'tenant-123',
  role: 'admin',
});
```

## Security Requirements

### Never Track PII
```typescript
// ✅ Correct - Anonymous tracking
trackEvent('form_submitted', {
  form_type: 'contact',
  tenant_id: tenantId,
});

// ❌ Incorrect - PII tracking
trackEvent('form_submitted', {
  email: 'user@example.com', // Never track PII
  name: 'John Doe',
});
```

### Tenant Isolation
```typescript
// ✅ Correct - Tenant-scoped data
function getTenantAnalytics(tenantId: string) {
  return {
    events: getEventsForTenant(tenantId),
    users: getUsersForTenant(tenantId),
  };
}

// ❌ Incorrect - Cross-tenant access
function getAllAnalytics() {
  return getAllEvents(); // Cross-tenant data leak!
}
```

## Testing Patterns

### Mock Analytics
```typescript
// test/setup.ts
import { vi } from 'vitest';
import { trackEvent, identifyUser } from '@agency/analytics';

vi.mock('@agency/analytics', () => ({
  trackEvent: vi.fn(),
  identifyUser: vi.fn(),
}));
```

### Unit Tests
```typescript
import { trackEvent } from '@agency/analytics';

describe('Analytics', () => {
  it('tracks events with tenant context', () => {
    trackEvent('test_event', { tenant_id: 'test-tenant' });
    
    expect(trackEvent).toHaveBeenCalledWith('test_event', {
      tenant_id: 'test-tenant',
    });
  });
});
```

## Dependencies

This package depends on:
- `posthog-js` - Analytics tracking library
- TypeScript - For type safety

## Progressive Documentation

For more details:
- `@.agents/security.md` - Privacy and security guidelines
- `docs/ANALYTICS.md` - Analytics implementation guide
- PostHog documentation - Advanced tracking patterns
