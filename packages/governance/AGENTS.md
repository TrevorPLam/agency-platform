# @agency/governance Package

## User Information

- User has no formal software development experience or education
- User develops repositories 100% through agentic coding as a "solo-developer"
- User prefers best practices and highest standards
- User prefers up to date (2026) research conducted before task execution on proper implementation, best practices, and advanced coding patterns

## Purpose

Compliance and governance framework for multi-tenant operations. This package provides audit trails, policy enforcement, and compliance monitoring for enterprise requirements.

## Agent Skills (Available Commands)
- `pnpm audit:run` - Run compliance audit
- `pnpm audit:report` - Generate compliance report
- `pnpm policies:validate` - Validate policy compliance
- `pnpm logs:audit` - Review audit logs

## Integration Points
- Depends on: `@agency/database` for audit storage, `@agency/security` for policy enforcement
- Used by: Applications requiring compliance features
- See also: `@.agents/security.md` - Security guidelines
- Reference: `docs/GOVERNANCE.md` - Complete governance guide

## Core Patterns

### Audit Trail Creation
```typescript
// ✅ Correct - Comprehensive audit logging
import { createAuditLog } from '@agency/governance';

async function auditUserAction(
  action: string,
  userId: string,
  tenantId: string,
  details: Record<string, any>
) {
  return await createAuditLog({
    action,
    user_id: userId,
    tenant_id: tenantId,
    timestamp: new Date().toISOString(),
    ip_address: getClientIP(),
    user_agent: getUserAgent(),
    details,
    compliance_level: 'SOX',
  });
}

// ❌ Incorrect - Incomplete audit trail
async function badAudit(action: string, userId: string) {
  return await createAuditLog({
    action,
    user_id: userId,
    // Missing tenant context, timestamp, IP, etc.
  });
}
```

### Policy Enforcement
```typescript
// ✅ Correct - Policy-based access control
import { checkPolicy, enforcePolicy } from '@agency/governance';

async function enforceDataAccess(
  userId: string,
  resourceType: string,
  tenantId: string
) {
  const policy = await checkPolicy({
    user_id: userId,
    resource_type: resourceType,
    tenant_id: tenantId,
    action: 'read',
  });
  
  if (!policy.allowed) {
    await createAuditLog({
      action: 'access_denied',
      user_id: userId,
      tenant_id: tenantId,
      details: { resource_type: resourceType, reason: policy.reason },
    });
    
    throw new Error('Access denied by policy');
  }
  
  return policy;
}

// ❌ Incorrect - No policy enforcement
async function badDataAccess(userId: string, resourceType: string) {
  return getData(userId, resourceType); // No policy check!
}
```

## Package Commands

```bash
# Run compliance audit
pnpm audit:run --scope=SOX --tenant=tenant-123

# Generate compliance report
pnpm audit:report --format=pdf --output=./compliance-report.pdf

# Validate policies
pnpm policies:validate --environment=production

# Review audit logs
pnpm logs:audit --date-range=2024-01-01,2024-01-31 --user=user-123
```

## File Structure

```
packages/governance/
├── src/
│   ├── index.ts              # Main exports
│   ├── audit.ts              # Audit trail management
│   ├── policies.ts           # Policy enforcement
│   ├── compliance.ts         # Compliance monitoring
│   ├── reporting.ts          # Report generation
│   └── types.ts              # Governance types
├── AGENTS.md                 # This file
├── package.json
└── tsconfig.json
```

## Key Exports

### createAuditLog()
```typescript
import { createAuditLog } from '@agency/governance';

await createAuditLog({
  action: 'user_login',
  user_id: 'user-123',
  tenant_id: 'tenant-456',
  timestamp: new Date().toISOString(),
  ip_address: '192.168.1.1',
  details: { login_method: 'sso' },
  compliance_level: 'SOX',
});
```

### checkPolicy()
```typescript
import { checkPolicy } from '@agency/governance';

const policy = await checkPolicy({
  user_id: 'user-123',
  resource_type: 'customer_data',
  tenant_id: 'tenant-456',
  action: 'read',
});

if (policy.allowed) {
  // Proceed with operation
}
```

## Security Requirements

### Immutable Audit Trails
```typescript
// ✅ Correct - Immutable audit records
import { createAuditLog } from '@agency/governance';

async function createImmutableAudit(entry: AuditEntry) {
  return await createAuditLog({
    ...entry,
    hash: await calculateHash(entry),
    signature: await signEntry(entry),
    immutable: true,
  });
}

// ❌ Incorrect - Mutable audit records
async function badCreateAudit(entry: AuditEntry) {
  return await createAuditLog(entry); // Can be modified later!
}
```

### Tenant Isolation
```typescript
// ✅ Correct - Tenant-scoped audits
async function getTenantAuditLogs(tenantId: string) {
  return await getAuditLogs({
    tenant_id: tenantId,
    date_range: { start: new Date('2024-01-01'), end: new Date() },
  });
}

// ❌ Incorrect - Cross-tenant audit access
async function badGetAllAuditLogs() {
  return await getAuditLogs(); // Cross-tenant data leak!
}
```

## Testing Patterns

### Mock Governance Service
```typescript
// test/setup.ts
import { vi } from 'vitest';
import { createAuditLog, checkPolicy } from '@agency/governance';

vi.mock('@agency/governance', () => ({
  createAuditLog: vi.fn(),
  checkPolicy: vi.fn(),
  enforcePolicy: vi.fn(),
}));
```

### Unit Tests
```typescript
import { createAuditLog, checkPolicy } from '@agency/governance';

describe('Governance', () => {
  it('creates comprehensive audit logs', async () => {
    await createAuditLog({
      action: 'test_action',
      user_id: 'user-123',
      tenant_id: 'tenant-456',
      timestamp: new Date().toISOString(),
      ip_address: '127.0.0.1',
      details: {},
      compliance_level: 'SOX',
    });
    
    expect(createAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'test_action',
        tenant_id: 'tenant-456',
        compliance_level: 'SOX',
      })
    );
  });
});
```

## Dependencies

This package depends on:
- `@agency/database` - Audit storage
- `crypto` - Hashing and signing
- TypeScript - For type safety

## Compliance Frameworks

### SOC 2 Implementation
```typescript
// SOC 2 audit logging
await createAuditLog({
  action: 'data_access',
  user_id: userId,
  tenant_id: tenantId,
  compliance_level: 'SOC2',
  details: {
    principle: 'Security',
    criteria: 'CC6.1',
    evidence: 'User authentication verified',
  },
});
```

### GDPR Compliance
```typescript
// GDPR audit trail
await createAuditLog({
  action: 'data_processing',
  user_id: userId,
  tenant_id: tenantId,
  compliance_level: 'GDPR',
  details: {
    legal_basis: 'consent',
    data_subject: userId,
    processing_purpose: 'service_delivery',
  },
});
```

## Progressive Documentation

For more details:
- `@.agents/security.md` - Security guidelines
- `@packages/database/AGENTS.md` - Database patterns
- `docs/GOVERNANCE.md` - Complete governance framework
