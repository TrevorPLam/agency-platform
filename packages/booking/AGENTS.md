# @agency/booking Package

## User Information

- User has no formal software development experience or education
- User develops repositories 100% through agentic coding as a "solo-developer"
- User prefers best practices and highest standards
- User prefers up to date (2026) research conducted before task execution on proper implementation, best practices, and advanced coding patterns

## Purpose

Multi-tenant booking system with availability management and conflict resolution. This package provides booking functionality that respects tenant isolation and prevents double-booking.

## Agent Skills (Available Commands)
- `pnpm test` - Run booking tests with coverage
- `pnpm build` - Build booking package
- `pnpm migrate` - Run booking migrations
- `pnpm seed` - Seed booking data

## Integration Points
- Depends on: `@agency/database` for data persistence, `@agency/analytics` for tracking
- Used by: Applications requiring booking functionality
- See also: `@packages/database/AGENTS.md` for database patterns
- Reference: `docs/BOOKING.md` for booking system guide

## Core Patterns

### Tenant-Isolated Bookings
```typescript
// ✅ Correct - Tenant-scoped bookings
import { createBooking } from '@agency/booking';

async function createTenantBooking(bookingData: BookingData, tenantId: string) {
  return await createBooking({
    ...bookingData,
    tenant_id: tenantId,
    created_at: new Date().toISOString(),
  });
}

// ❌ Incorrect - Cross-tenant booking
async function badCreateBooking(bookingData: BookingData) {
  return await createBooking(bookingData); // No tenant context
}
```

### Availability Checking
```typescript
// ✅ Correct - Conflict prevention
import { checkAvailability } from '@agency/booking';

async function bookWithConflictCheck(
  resourceId: string,
  startTime: Date,
  endTime: Date,
  tenantId: string
) {
  const isAvailable = await checkAvailability({
    resource_id: resourceId,
    start_time: startTime,
    end_time: endTime,
    tenant_id: tenantId,
  });
  
  if (!isAvailable) {
    throw new Error('Resource not available for selected time');
  }
  
  return await createBooking({
    resource_id: resourceId,
    start_time: startTime,
    end_time: endTime,
    tenant_id: tenantId,
  });
}

// ❌ Incorrect - No conflict check
async function badBook(resourceId: string, startTime: Date, endTime: Date) {
  return await createBooking({
    resource_id: resourceId,
    start_time: startTime,
    end_time: endTime,
  }); // Could double-book!
}
```

## Package Commands

```bash
# Build package
pnpm build

# Run tests
pnpm test

# Run migrations
pnpm migrate

# Seed test data
pnpm seed

# Type check
pnpm type-check

# Lint
pnpm lint
```

## File Structure

```
packages/booking/
├── src/
│   ├── index.ts              # Main exports
│   ├── booking.ts            # Booking operations
│   ├── availability.ts       # Availability checking
│   ├── conflicts.ts          # Conflict resolution
│   └── types.ts              # Booking types
├── AGENTS.md                 # This file
├── package.json
└── tsconfig.json
```

## Key Exports

### createBooking()
```typescript
import { createBooking } from '@agency/booking';

await createBooking({
  resource_id: 'resource-123',
  user_id: 'user-456',
  start_time: new Date('2024-01-01T10:00:00Z'),
  end_time: new Date('2024-01-01T11:00:00Z'),
  tenant_id: 'tenant-789',
});
```

### checkAvailability()
```typescript
import { checkAvailability } from '@agency/booking';

const isAvailable = await checkAvailability({
  resource_id: 'resource-123',
  start_time: new Date('2024-01-01T10:00:00Z'),
  end_time: new Date('2024-01-01T11:00:00Z'),
  tenant_id: 'tenant-789',
});
```

## Security Requirements

### Tenant Isolation
```typescript
// ✅ Correct - Tenant-scoped queries
async function getTenantBookings(tenantId: string) {
  const client = createClient();
  
  return await client
    .from('bookings')
    .select('*')
    .eq('tenant_id', tenantId);
}

// ❌ Incorrect - Cross-tenant access
async function badGetAllBookings() {
  const client = createClient();
  
  return await client
    .from('bookings')
    .select('*'); // Cross-tenant data leak!
}
```

### Input Validation
```typescript
// ✅ Correct - Comprehensive validation
import { validateBookingData } from '@agency/booking';

async function createValidatedBooking(data: unknown, tenantId: string) {
  const validatedData = await validateBookingData(data);
  
  if (!validatedData.success) {
    throw new Error(`Invalid booking data: ${validatedData.error}`);
  }
  
  return await createBooking({
    ...validatedData.data,
    tenant_id: tenantId,
  });
}

// ❌ Incorrect - No validation
async function badCreateBooking(data: unknown, tenantId: string) {
  return await createBooking({
    ...(data as any), // Unsafe!
    tenant_id: tenantId,
  });
}
```

## Testing Patterns

### Mock Booking Service
```typescript
// test/setup.ts
import { vi } from 'vitest';
import { createBooking, checkAvailability } from '@agency/booking';

vi.mock('@agency/booking', () => ({
  createBooking: vi.fn(),
  checkAvailability: vi.fn(() => Promise.resolve(true)),
}));
```

### Unit Tests
```typescript
import { createBooking, checkAvailability } from '@agency/booking';

describe('Booking System', () => {
  it('prevents double booking', async () => {
    vi.mocked(checkAvailability).mockResolvedValue(false);
    
    await expect(
      createBooking({
        resource_id: 'resource-1',
        start_time: new Date(),
        end_time: new Date(),
        tenant_id: 'tenant-1',
      })
    ).rejects.toThrow('Resource not available');
  });
});
```

## Dependencies

This package depends on:
- `@agency/database` - Database client
- `zod` - Input validation
- TypeScript - For type safety

## Progressive Documentation

For more details:
- `@packages/database/AGENTS.md` - Database patterns
- `@.agents/security.md` - Security guidelines
- `docs/BOOKING.md` - Complete booking system guide
