# Agency Admin Application

## Purpose

Internal management interface for agency operations, client management, and administrative functions. Port 3001.

## Application-Specific Patterns

### Admin Authentication
```typescript
// ✅ Correct - Admin-specific auth
import { createClient } from '@agency/database';
import { requireAdminRole } from '@/lib/admin-auth';

export async function getAdminSession() {
  const client = createClient();
  const { data: { user } } = await client.auth.getUser();
  
  if (!user || !requireAdminRole(user)) {
    throw new Error('Admin access required');
  }
  
  return user;
}

// ❌ Incorrect - No admin validation
export async function getSession() {
  const client = createClient();
  const { data: { user } } = await client.auth.getUser();
  return user; // No role check
}
```

### Admin Data Access
```typescript
// ✅ Correct - Cross-tenant admin access
async function getAllClients() {
  const client = createClient();
  
  // Admin can see all tenants
  const { data, error } = await client
    .from('tenants')
    .select('*');
    
  if (error) throw error;
  return data;
}

// ✅ Correct - Tenant-specific admin actions
async function updateTenantSettings(tenantId: string, settings: any) {
  const client = createClient();
  
  const { data, error } = await client
    .from('tenant_settings')
    .update(settings)
    .eq('tenant_id', tenantId);
    
  if (error) throw error;
  return data;
}

// ❌ Incorrect - No admin validation
async function badGetAllClients() {
  const client = createClient();
  
  return await client
    .from('tenants')
    .select('*'); // No admin role check
}
```

### Admin UI Components
```typescript
// ✅ Correct - Admin-specific components
import { DataTable } from '@/components/admin/data-table';
import { AdminLayout } from '@/components/admin/layout';

export default function ClientsPage() {
  return (
    <AdminLayout>
      <DataTable
        data={clients}
        columns={clientColumns}
        actions={['edit', 'delete', 'suspend']}
      />
    </AdminLayout>
  );
}

// ❌ Incorrect - Using regular components
import { UserTable } from '@agency/ui'; // Not admin-specific

export default function BadClientsPage() {
  return (
    <div>
      <UserTable data={clients} /> {/* Missing admin features */}
    </div>
  );
}
```

## Application Commands

```bash
# Development
pnpm dev

# Build
pnpm build

# Type check
pnpm type-check

# Lint
pnpm lint

# Run tests
pnpm test

# E2E tests
pnpm test:e2e
```

## File Structure

```
apps/agency-admin/
├── src/
│   ├── app/
│   │   ├── (admin)/          # Admin routes
│   │   ├── api/              # API routes
│   │   ├── globals.css
│   │   ├── layout.tsx        # Admin layout
│   │   └── page.tsx          # Dashboard
│   ├── components/
│   │   ├── admin/            # Admin-specific components
│   │   │   ├── layout.tsx
│   │   │   ├── data-table.tsx
│   │   │   └── navigation.tsx
│   │   └── ui/               # Reusable UI
│   ├── lib/
│   │   ├── admin-auth.ts     # Admin authentication
│   │   ├── admin-client.ts   # Admin database client
│   │   └── permissions.ts    # Permission checks
│   └── types/
│       ├── admin.ts          # Admin-specific types
│       └── api.ts            # API types
├── AGENTS.md                 # This file
├── package.json
└── next.config.js
```

## Key Features

### Client Management
- View all tenants and their status
- Edit tenant settings and configurations
- Suspend/activate client accounts
- Monitor tenant resource usage

### User Administration
- Manage user accounts across all tenants
- Reset passwords and handle authentication
- Assign roles and permissions
- Audit user activity

### System Monitoring
- Database performance metrics
- Application health status
- Error tracking and logs
- Resource utilization

## Security Requirements

### Admin Authentication
```typescript
// ✅ Correct - Multi-factor admin auth
export async function requireAdminAuth(request: Request) {
  const session = await getAdminSession();
  
  if (!session.user.email_verified) {
    throw new Error('Email verification required');
  }
  
  if (!session.user.app_metadata?.admin_role) {
    throw new Error('Admin role required');
  }
  
  return session;
}

// ❌ Incorrect - Basic auth only
export async function badAdminAuth(request: Request) {
  const session = await getSession();
  return session; // No admin validation
}
```

### Permission Checks
```typescript
// ✅ Correct - Granular permissions
export const adminPermissions = {
  canViewAllTenants: 'admin:tenants:view',
  canEditTenant: 'admin:tenants:edit',
  canDeleteTenant: 'admin:tenants:delete',
  canManageUsers: 'admin:users:manage',
  canViewSystemMetrics: 'admin:system:view',
};

export function hasPermission(user: User, permission: string): boolean {
  return user.app_metadata?.permissions?.includes(permission) || false;
}

// ❌ Incorrect - No permission system
export function badHasPermission(user: User, permission: string): boolean {
  return true; // Always returns true
}
```

### Audit Logging
```typescript
// ✅ Correct - Admin action logging
export async function logAdminAction(action: {
  type: string;
  target: string;
  userId: string;
  details: Record<string, any>;
}) {
  const client = createClient();
  
  await client.from('admin_audit_log').insert({
    ...action,
    timestamp: new Date().toISOString(),
    ip_address: getClientIP(),
  });
}

// Usage example
await logAdminAction({
  type: 'tenant_update',
  target: tenantId,
  userId: adminUser.id,
  details: { changes: updatedFields },
});
```

## API Patterns

### Admin API Routes
```typescript
// ✅ Correct - Protected admin API
import { requireAdminAuth } from '@/lib/admin-auth';

export async function GET(request: Request) {
  const admin = await requireAdminAuth(request);
  
  const clients = await getAllClients();
  
  return Response.json({
    data: clients,
    meta: {
      requested_by: admin.email,
      timestamp: new Date().toISOString(),
    },
  });
}

// ❌ Incorrect - Unprotected API
export async function GET(request: Request) {
  const clients = await getAllClients();
  return Response.json(clients); // No auth check
}
```

### Error Handling
```typescript
// ✅ Correct - Admin-specific error handling
export class AdminError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'AdminError';
  }
}

export function handleAdminError(error: unknown) {
  if (error instanceof AdminError) {
    return Response.json(
      { error: error.message, code: error.code },
      { status: error.statusCode }
    );
  }
  
  // Log unexpected errors
  console.error('Unexpected admin error:', error);
  
  return Response.json(
    { error: 'Internal server error' },
    { status: 500 }
  );
}
```

## Testing Patterns

### Admin Function Testing
```typescript
import { requireAdminRole, hasPermission } from '@/lib/admin-auth';

describe('Admin Authentication', () => {
  it('should allow admin users', () => {
    const adminUser = {
      app_metadata: { admin_role: 'admin' },
      email_verified: true,
    };
    
    expect(() => requireAdminRole(adminUser)).not.toThrow();
  });

  it('should reject non-admin users', () => {
    const regularUser = {
      app_metadata: {},
      email_verified: true,
    };
    
    expect(() => requireAdminRole(regularUser)).toThrow('Admin access required');
  });
});
```

### Integration Testing
```typescript
import { render, screen } from '@testing-library/react';
import { ClientsPage } from '@/app/clients/page';

describe('Clients Page', () => {
  it('should render client data for admin users', async () => {
    const mockAdmin = createMockAdminUser();
    
    render(<ClientsPage />, {
      session: mockAdmin,
    });
    
    expect(screen.getByText('Client Management')).toBeInTheDocument();
    expect(screen.getByRole('table')).toBeInTheDocument();
  });
});
```

## Performance Considerations

### Data Loading
```typescript
// ✅ Correct - Efficient data loading
async function getClientsWithStats() {
  const client = createClient();
  
  const [clients, stats] = await Promise.all([
    client.from('tenants').select('*'),
    client.from('tenant_stats').select('*'),
  ]);
  
  return { clients: clients.data, stats: stats.data };
}

// ❌ Incorrect - Sequential loading
async function badGetClientsWithStats() {
  const clients = await getClients();
  const stats = await getStats(); // Waits for clients first
  return { clients, stats };
}
```

### Caching
```typescript
// ✅ Correct - Cache admin data
import { unstable_cache } from 'next/cache';

export const getClients = unstable_cache(
  async () => {
    const client = createClient();
    const { data } = await client.from('tenants').select('*');
    return data;
  },
  ['admin-clients'],
  { revalidate: 300 } // 5 minutes
);
```

## Progressive Documentation

For more details:
- `@.agents/security.md` - Security guidelines
- `@.agents/database.md` - Database patterns
- `docs/ADMIN.md` - Admin-specific documentation
- `@packages/database/AGENTS.md` - Database client usage
