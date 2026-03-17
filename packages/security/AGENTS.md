# @agency/security Package

## User Information

- User has no formal software development experience or education
- User develops repositories 100% through agentic coding as a "solo-developer"
- User prefers best practices and highest standards
- User prefers up to date (2026) research conducted before task execution on proper implementation, best practices, and advanced coding patterns

## Purpose

Comprehensive security framework with threat detection, vulnerability scanning, and compliance monitoring. This package provides enterprise-grade security tools for multi-tenant applications.

## Agent Skills (Available Commands)
- `pnpm security:scan` - Run security vulnerability scan
- `pnpm security:audit` - Perform security audit
- `pnpm security:threats` - Analyze threat vectors
- `pnpm security:compliance` - Check compliance status

## Integration Points
- Depends on: `@agency/database` for security logs, external security services
- Used by: Applications for security features
- See also: `@.agents/security.md` - Security guidelines
- Reference: `docs/SECURITY.md` - Complete security implementation guide

## Core Patterns

### Threat Detection
```typescript
// ✅ Correct - Multi-layer threat detection
import { detectThreats, createSecurityAlert } from '@agency/security';

async function analyzeSecurityEvent(
  event: SecurityEvent,
  tenantId: string
) {
  const threats = await detectThreats({
    event,
    tenant_id: tenantId,
    context: {
      ip_address: event.ipAddress,
      user_agent: event.userAgent,
      timestamp: event.timestamp,
      request_path: event.requestPath,
    },
  });
  
  if (threats.length > 0) {
    await createSecurityAlert({
      tenant_id: tenantId,
      severity: 'high',
      threat_type: threats[0].type,
      description: threats[0].description,
      event,
    });
  }
  
  return threats;
}

// ❌ Incorrect - No threat analysis
async function badHandleSecurityEvent(event: SecurityEvent, tenantId: string) {
  return await logEvent(event); // No threat detection!
}
```

### Vulnerability Scanning
```typescript
// ✅ Correct - Comprehensive vulnerability assessment
import { scanVulnerabilities, assessRisk } from '@agency/security';

async function scanApplicationSecurity(tenantId: string) {
  const vulnerabilities = await scanVulnerabilities({
    tenant_id: tenantId,
    scan_types: ['dependency', 'code', 'configuration'],
    depth: 'deep',
  });
  
  const riskAssessment = await assessRisk({
    vulnerabilities,
    tenant_id: tenantId,
    impact_factors: {
      data_sensitivity: 'high',
      user_base_size: 'medium',
      compliance_requirements: ['SOC2', 'GDPR'],
    },
  });
  
  if (riskAssessment.overall_risk > 0.7) {
    await createSecurityAlert({
      tenant_id: tenantId,
      severity: 'critical',
      threat_type: 'vulnerability',
      description: 'High-risk vulnerabilities detected',
      details: riskAssessment,
    });
  }
  
  return riskAssessment;
}

// ❌ Incorrect - Shallow vulnerability scan
async function badScanSecurity(tenantId: string) {
  return await scanVulnerabilities({
    tenant_id: tenantId,
    scan_types: ['dependency'], // Incomplete scanning
  });
}
```

## Package Commands

```bash
# Run security vulnerability scan
pnpm security:scan --scope=all --tenant=tenant-123

# Perform security audit
pnpm security:audit --compliance=SOX2 --tenant=tenant-123

# Analyze threat vectors
pnpm security:threats --model=ml --tenant=tenant-123

# Check compliance status
pnpm security:compliance --framework=GDPR --tenant=tenant-123
```

## File Structure

```
packages/security/
├── src/
│   ├── index.ts              # Main exports
│   ├── threats.ts            # Threat detection
│   ├── vulnerabilities.ts    # Vulnerability scanning
│   ├── compliance.ts         # Compliance monitoring
│   ├── alerts.ts             # Security alerts
│   └── types.ts              # Security types
├── AGENTS.md                 # This file
├── package.json
└── tsconfig.json
```

## Key Exports

### detectThreats()
```typescript
import { detectThreats } from '@agency/security';

const threats = await detectThreats({
  event: {
    ip_address: '192.168.1.1',
    user_agent: 'Mozilla/5.0...',
    request_path: '/api/admin/users',
    timestamp: new Date().toISOString(),
  },
  tenant_id: 'tenant-123',
});
```

### scanVulnerabilities()
```typescript
import { scanVulnerabilities } from '@agency/security';

const vulnerabilities = await scanVulnerabilities({
  tenant_id: 'tenant-123',
  scan_types: ['dependency', 'code', 'configuration'],
  depth: 'deep',
});
```

### assessRisk()
```typescript
import { assessRisk } from '@agency/security';

const risk = await assessRisk({
  vulnerabilities,
  tenant_id: 'tenant-123',
  impact_factors: {
    data_sensitivity: 'high',
    user_base_size: 'medium',
  },
});
```

## Security Requirements

### Tenant Isolation
```typescript
// ✅ Correct - Tenant-scoped security
async function getTenantSecurity(tenantId: string) {
  return await getSecurityData({
    tenant_id: tenantId,
    data_types: ['threats', 'vulnerabilities', 'alerts'],
    date_range: { days: 30 },
  });
}

// ❌ Incorrect - Cross-tenant security data access
async function badGetAllSecurity() {
  return await getSecurityData(); // Cross-tenant data leak!
}
```

### Data Protection
```typescript
// ✅ Correct - Secure data handling
import { encryptSecurityData } from '@agency/security';

async function storeSecureEvent(event: SecurityEvent, tenantId: string) {
  const encrypted = await encryptSecurityData(event);
  
  return await storeSecurityEvent({
    data: encrypted,
    tenant_id: tenantId,
    encryption_level: 'high',
  });
}

// ❌ Incorrect - Unencrypted security data
async function badStoreSecurityEvent(event: SecurityEvent, tenantId: string) {
  return await storeSecurityEvent({
    data: event, // Sensitive data exposed!
    tenant_id: tenantId,
  });
}
```

## Testing Patterns

### Mock Security Service
```typescript
// test/setup.ts
import { vi } from 'vitest';
import { detectThreats, scanVulnerabilities, assessRisk } from '@agency/security';

vi.mock('@agency/security', () => ({
  detectThreats: vi.fn(),
  scanVulnerabilities: vi.fn(),
  assessRisk: vi.fn(),
  createSecurityAlert: vi.fn(),
}));
```

### Unit Tests
```typescript
import { detectThreats, createSecurityAlert } from '@agency/security';

describe('Security System', () => {
  it('detects threats and creates alerts', async () => {
    vi.mocked(detectThreats).mockResolvedValue([
      { type: 'sql_injection', severity: 'high', description: 'SQL injection detected' }
    ]);
    
    await analyzeSecurityEvent({
      ip_address: '192.168.1.1',
      request_path: '/api/users',
      timestamp: new Date().toISOString(),
    }, 'tenant-123');
    
    expect(createSecurityAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        tenant_id: 'tenant-123',
        severity: 'high',
        threat_type: 'sql_injection',
      })
    );
  });
});
```

## Security Categories

### Application Security
```typescript
// Application-level security monitoring
await scanVulnerabilities({
  tenant_id: 'tenant-123',
  scan_types: ['code'],
  focus_areas: ['authentication', 'authorization', 'data_validation'],
});
```

### Infrastructure Security
```typescript
// Infrastructure security assessment
await scanVulnerabilities({
  tenant_id: 'tenant-123',
  scan_types: ['configuration'],
  focus_areas: ['network_security', 'access_controls', 'encryption'],
});
```

### Compliance Security
```typescript
// Compliance-focused security checks
await assessRisk({
  tenant_id: 'tenant-123',
  compliance_frameworks: ['SOC2', 'GDPR', 'HIPAA'],
  control_areas: ['access_control', 'data_protection', 'audit_logging'],
});
```

## Dependencies

This package depends on:
- `@agency/database` - Security data storage
- External security services - For advanced threat detection
- TypeScript - For type safety

## Progressive Documentation

For more details:
- `@.agents/security.md` - Security guidelines
- `@packages/database/AGENTS.md` - Database patterns
- `docs/SECURITY.md` - Complete security implementation guide
