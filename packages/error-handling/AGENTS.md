# @agency/error-handling Package

## User Information

- User has no formal software development experience or education
- User develops repositories 100% through agentic coding as a "solo-developer"
- User prefers best practices and highest standards
- User prefers up to date (2026) research conducted before task execution on proper implementation, best practices, and advanced coding patterns

## Purpose

Centralized error handling and logging utilities for the agency platform. This package provides consistent error patterns, logging, and monitoring across all applications.

## Agent Skills (Available Commands)
- `pnpm build` - Build package
- `pnpm test` - Run error handling tests
- `pnpm lint` - Lint error handling code

## Integration Points
- Depends on: External logging services, monitoring systems
- Used by: All applications for consistent error handling
- See also: `@.agents/security.md` - Error handling security guidelines
- Reference: `docs/ERROR_HANDLING.md` - Complete error handling guide

## Core Patterns

### Error Handling Structure
```typescript
// ✅ Correct - Consistent error handling
import { createError, logError } from '@agency/error-handling';

export class AgencyError extends Error {
  constructor(
    message: string,
    public code: string,
    public tenantId?: string,
    public context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AgencyError';
  }
}

// ✅ Correct - Error logging
async function handleError(error: Error, tenantId?: string) {
  await logError({
    message: error.message,
    stack: error.stack,
    code: error instanceof AgencyError ? error.code : 'UNKNOWN',
    tenant_id: tenantId,
    timestamp: new Date().toISOString(),
  });
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
packages/error-handling/
├── src/
│   ├── index.ts              # Main exports
│   ├── errors.ts             # Error classes
│   ├── logging.ts            # Logging utilities
│   └── monitoring.ts         # Error monitoring
├── AGENTS.md                 # This file
├── package.json
└── tsconfig.json
```

## Key Exports

### Error Classes
```typescript
import { AgencyError, ValidationError, DatabaseError } from '@agency/error-handling';
```

### Logging Utilities
```typescript
import { logError, logWarning, logInfo } from '@agency/error-handling';
```

## Security Requirements

### Never Expose Sensitive Information
```typescript
// ✅ Correct - Sanitize errors for clients
function sanitizeError(error: Error): Omit<AgencyError, 'stack' | 'context'> {
  return {
    name: error.name,
    message: error.message,
    code: error instanceof AgencyError ? error.code : 'UNKNOWN',
  };
}

// ❌ Incorrect - Expose internal details
res.json({ error: error.stack }); // Security risk!
```

## Testing Patterns

### Error Testing
```typescript
import { AgencyError } from '@agency/error-handling';

describe('Error Handling', () => {
  it('should create consistent error structure', () => {
    const error = new AgencyError('Test error', 'TEST_CODE', 'tenant-123');
    
    expect(error.name).toBe('AgencyError');
    expect(error.code).toBe('TEST_CODE');
    expect(error.tenantId).toBe('tenant-123');
  });
});
```

## Dependencies

This package depends on:
- TypeScript - For type safety
- Logging service integration (to be implemented)

## Progressive Documentation

For more details:
- `@.agents/security.md` - Security guidelines
- `docs/ERROR_HANDLING.md` - Complete error handling implementation
- `@packages/monitoring/AGENTS.md` - Error monitoring integration
