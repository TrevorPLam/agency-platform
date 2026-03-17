# Testing Patterns & Guidelines

## Testing Philosophy

### Multi-Tenant Testing
- **RLS Isolation**: Every test must validate tenant data isolation
- **Tenant Context**: Tests must run with proper tenant context
- **Cross-Tenant Prevention**: Tests must verify no cross-tenant data access
- **Security Boundaries**: Test all permission boundaries

### Testing Commands

```bash
# File-scoped testing (fast feedback)
pnpm vitest run src/components/Button.test.tsx
pnpm vitest run packages/database/auth.test.ts

# Package-specific testing
pnpm turbo run test --filter=@agency/database
pnpm turbo run test --filter=@agency/ui

# Database testing
supabase test db
supabase test db --test-path tests/test_profiles.sql

# Full test suite (only when needed)
pnpm test
```

### Database Testing (pgTAP)

#### RLS Policy Tests
```sql
-- Test tenant isolation
BEGIN;
SELECT plan(4);

-- Test 1: Users can only see their own tenant data
SELECT lives(
  'SELECT * FROM profiles WHERE tenant_id = ''tenant-1''',
  ARRAY['user-1', 'user-2']
) AS tenant_isolation_works;

-- Test 2: Users cannot see other tenant data
SELECT lives(
  'SELECT * FROM profiles WHERE tenant_id = ''tenant-2''',
  ARRAY['user-1']
) AS cross_tenant_blocked;

-- Test 3: Insert respects tenant_id
SELECT throws_ok(
  'INSERT INTO profiles (id, tenant_id, name) VALUES (''user-3'', ''other-tenant'', ''Test'')',
  '42501', -- RLS violation
  'Insert blocked for wrong tenant'
);

-- Test 4: Update respects tenant boundaries
SELECT throws_ok(
  'UPDATE profiles SET name = ''Hacked'' WHERE tenant_id = ''tenant-2''',
  '42501',
  'Update blocked across tenant boundaries'
);

SELECT * FROM finish();
ROLLBACK;
```

#### Test Structure
```
supabase/tests/database/
├── test_tenants.sql
├── test_profiles.sql
├── test_posts.sql
└── test_rls_isolation.sql
```

### Unit Testing Patterns

#### React Component Testing
```typescript
// ✅ Correct - Component with tenant context
import { render, screen } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('renders with correct tenant styling', () => {
    const mockTenant = {
      id: 'tenant-1',
      name: 'Test Tenant',
      theme: 'light'
    };

    render(<Button tenant={mockTenant}>Click me</Button>);
    
    expect(screen.getByRole('button')).toBeInTheDocument();
    expect(screen.getByRole('button')).toHaveClass('tenant-tenant-1');
  });

  it('handles cross-tenant data correctly', () => {
    const mockTenant = { id: 'tenant-1' };
    const otherTenantData = { tenantId: 'tenant-2' };
    
    render(<Button tenant={mockTenant} data={otherTenantData} />);
    
    // Should not render data from other tenant
    expect(screen.queryByText('tenant-2')).not.toBeInTheDocument();
  });
});
```

#### Database Client Testing
```typescript
// ✅ Correct - Mock database with tenant context
import { createClient } from '@agency/database';

vi.mock('@agency/database', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          data: [{ id: '1', tenant_id: 'tenant-1', name: 'Test' }],
          error: null
        }))
      }))
    }))
  }))
}));

describe('Database Operations', () => {
  it('queries with tenant context', async () => {
    const client = createClient();
    const result = await client
      .from('profiles')
      .select('*')
      .eq('tenant_id', 'tenant-1');
    
    expect(client.from).toHaveBeenCalledWith('profiles');
    expect(result.data).toHaveLength(1);
    expect(result.data[0].tenant_id).toBe('tenant-1');
  });
});
```

### Integration Testing

#### API Endpoint Testing
```typescript
// ✅ Correct - API with tenant authentication
import { createApp } from '../app';

describe('API Endpoints', () => {
  it('requires tenant authentication', async () => {
    const app = createApp();
    const response = await app.request('/api/profiles');
    
    expect(response.status).toBe(401);
  });

  it('returns only tenant data', async () => {
    const app = createApp();
    const headers = {
      'Authorization': 'Bearer valid-token',
      'X-Tenant-ID': 'tenant-1'
    };
    
    const response = await app.request('/api/profiles', { headers });
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ tenant_id: 'tenant-1' })
      ])
    );
    expect(data).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ tenant_id: 'tenant-2' })
      ])
    );
  });
});
```

### E2E Testing Patterns

#### Playwright with Tenant Context
```typescript
// ✅ Correct - E2E test with tenant isolation
import { test, expect } from '@playwright/test';

test.describe('Tenant Isolation', () => {
  test('tenant-1 cannot see tenant-2 data', async ({ page }) => {
    // Login as tenant-1 user
    await page.goto('/login');
    await page.fill('[data-testid=email]', 'user1@tenant1.com');
    await page.fill('[data-testid=password]', 'password');
    await page.click('[data-testid=login-button]');
    
    // Navigate to data page
    await page.goto('/data');
    
    // Should only see tenant-1 data
    await expect(page.locator('[data-tenant="tenant-1"]')).toHaveCount(3);
    await expect(page.locator('[data-tenant="tenant-2"]')).toHaveCount(0);
    
    // Try to access tenant-2 data directly
    const response = await page.goto('/data/tenant-2-item');
    await expect(response.status()).toBe(404);
  });
});
```

### Performance Testing

#### Database Query Performance
```typescript
// ✅ Correct - Performance test with tenant queries
import { createClient } from '@agency/database';

describe('Database Performance', () => {
  it('tenant queries use indexes efficiently', async () => {
    const client = createClient();
    const start = performance.now();
    
    const result = await client
      .from('profiles')
      .select('*')
      .eq('tenant_id', 'tenant-1')
      .order('created_at', { ascending: false })
      .limit(100);
    
    const duration = performance.now() - start;
    
    expect(duration).toBeLessThan(100); // Should be under 100ms
    expect(result.error).toBeNull();
  });
});
```

### Testing Configuration

#### Vitest Configuration
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
    coverage: {
      reporter: ['text', 'html'],
      exclude: [
        'node_modules/',
        'test/',
        '**/*.d.ts',
        '**/*.config.*'
      ]
    }
  }
});
```

#### Test Setup
```typescript
// test/setup.ts
import { vi } from 'vitest';

// Mock tenant context
global.mockTenant = {
  id: 'test-tenant',
  name: 'Test Tenant',
  theme: 'light'
};

// Mock database client
vi.mock('@agency/database', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn(() => ({
        data: {
          user: {
            app_metadata: { tenant_id: 'test-tenant' }
          }
        }
      }))
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          data: [],
          error: null
        }))
      }))
    }))
  }))
}));
```

### Testing Best Practices

1. **Always** test tenant isolation in database tests
2. **Never** test with real production data
3. **Always** mock external dependencies in unit tests
4. **Always** include tenant context in API tests
5. **Always** test permission boundaries
6. **Never** skip RLS policy testing
7. **Always** test error handling and edge cases

### Coverage Requirements

- **Database Tests**: 100% RLS policy coverage
- **Unit Tests**: 80%+ code coverage for new code
- **Integration Tests**: All API endpoints covered
- **E2E Tests**: Critical user paths covered

## Progressive Documentation

For more details:
- `docs/TESTING.md` - Complete testing strategy
- `docs/DATABASE.md` - Database testing patterns
- `supabase/tests/` - Database test examples
