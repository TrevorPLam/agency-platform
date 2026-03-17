# @agency/database Package

## User Information

- User has no formal software development experience or education
- User develops repositories 100% through agentic coding as a "solo-developer"
- User prefers best practices and highest standards
- User prefers up to date (2026) research conducted before task execution on proper implementation, best practices, and advanced coding patterns

## Purpose

Supabase client factories with TypeScript types and tenant-aware utilities. This package provides a secure, typed interface to the multi-tenant database.

## Agent Skills (Available Commands)
- `supabase gen types typescript --local > src/types.ts` - Generate types from database
- `supabase test db` - Run pgTAP RLS isolation tests
- `pnpm test` - Run package tests with coverage

## Integration Points
- Depends on: `@supabase/supabase-js` for Supabase client
- Used by: All applications for database access
- See also: `@.agents/database.md` for database patterns
- Reference: `@.agents/security.md` for security guidelines

## Core Patterns

### Database Client Creation
```typescript
// ✅ Correct - Use factory function
import { createClient } from '@agency/database';

const client = createClient(); // Uses environment variables

// ✅ Correct - With options
const client = createClient({
  auth: {
    persistSession: true
  }
});

// ❌ Incorrect - Direct Supabase client
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
```

### Tenant-Aware Queries
```typescript
// ✅ Correct - Always include tenant context
import { createClient } from '@agency/database';
import { Database } from '@agency/database/types';

async function getProfiles(tenantId: string) {
  const client = createClient();
  
  const { data, error } = await client
    .from('profiles')
    .select('*')
    .eq('tenant_id', tenantId);
    
  if (error) throw error;
  return data;
}

// ❌ Incorrect - No tenant filtering
async function getAllProfiles() {
  const client = createClient();
  
  return await client
    .from('profiles')
    .select('*'); // Cross-tenant data leak!
}
```

### Type Safety
```typescript
// ✅ Correct - Use generated types
import { Database } from '@agency/database/types';

type Profile = Database['public']['Tables']['profiles']['Row'];
type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];

async function createProfile(profile: ProfileInsert) {
  const client = createClient();
  
  const { data, error } = await client
    .from('profiles')
    .insert(profile)
    .select()
    .single();
    
  return data;
}

// ❌ Incorrect - Manual type definitions
interface Profile {
  id: string;
  name: string;
  // Missing tenant_id and other required fields
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

# Generate types from database
supabase gen types typescript --local > src/types.ts

# Lint
pnpm lint
```

## File Structure

```
packages/database/
├── src/
│   ├── index.ts              # Main exports
│   ├── client.ts             # Client factory
│   ├── types.ts              # Generated database types
│   └── auth.ts               # Auth utilities
├── AGENTS.md                 # This file
├── package.json
└── tsconfig.json
```

## Key Exports

### createClient()
```typescript
// Default client with environment variables
const client = createClient();

// Client with custom options
const client = createClient({
  auth: { persistSession: true },
  db: { schema: 'public' }
});
```

### Database Types
```typescript
import type { Database } from '@agency/database/types';

// Table types
type User = Database['public']['Tables']['users']['Row'];
type UserInsert = Database['public']['Tables']['users']['Insert'];

// Function types
type FunctionResponse = Database['public']['Functions']['my_function']['Returns'];
```

### Auth Utilities
```typescript
import { getCurrentUser, getTenantId } from '@agency/database';

// Get current user with tenant context
const user = await getCurrentUser();

// Get tenant ID from user metadata
const tenantId = await getTenantId();
```

## Security Requirements

### Never Expose Service Role Key
```typescript
// ✅ Correct - Server-side only
import { createClient } from '@agency/database'; // Uses service role internally

// ❌ Incorrect - Client exposure
// NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY=xxx // Never do this!
```

### Always Use App Metadata
```typescript
// ✅ Correct - Use app_metadata for tenant_id
const tenantId = user.app_metadata?.tenant_id;

// ❌ Incorrect - Never use user_metadata for tenant data
const tenantId = user.user_metadata?.tenant_id; // Wrong!
```

### Port Configuration
```typescript
// ✅ Correct - Use Supavisor port (6543)
const supabaseUrl = 'https://your-project.supabase.co'; // Uses port 6543

// ❌ Incorrect - Never use port 5432
const supabaseUrl = 'postgresql://localhost:5432/postgres'; // Wrong!
```

## Testing Patterns

### Mock Database Client
```typescript
// test/setup.ts
import { vi } from 'vitest';
import { createClient } from '@agency/database';

vi.mock('@agency/database', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          data: [],
          error: null
        }))
      }))
    })),
    auth: {
      getUser: vi.fn(() => ({
        data: {
          user: {
            app_metadata: { tenant_id: 'test-tenant' }
          }
        }
      }))
    }
  })),
  getCurrentUser: vi.fn(),
  getTenantId: vi.fn(() => Promise.resolve('test-tenant'))
}));
```

### Unit Tests
```typescript
import { createClient } from '@agency/database';

describe('Database Operations', () => {
  it('queries with tenant context', async () => {
    const client = createClient();
    const result = await client
      .from('profiles')
      .select('*')
      .eq('tenant_id', 'test-tenant');
    
    expect(client.from).toHaveBeenCalledWith('profiles');
    expect(result.data).toBeDefined();
  });
});
```

## Common Patterns

### Error Handling
```typescript
// ✅ Correct - Proper error handling
async function getProfile(id: string, tenantId: string) {
  const client = createClient();
  
  const { data, error } = await client
    .from('profiles')
    .select('*')
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .single();
    
  if (error) {
    console.error('Database error:', error);
    throw new Error(`Failed to fetch profile: ${error.message}`);
  }
  
  return data;
}

// ❌ Incorrect - No error handling
async function getProfile(id: string, tenantId: string) {
  const client = createClient();
  
  const { data } = await client
    .from('profiles')
    .select('*')
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .single();
    
  return data; // Could be null or error
}
```

### Transaction Patterns
```typescript
// ✅ Correct - Use RPC functions for complex operations
async function updateUserProfile(userId: string, profileData: any, tenantId: string) {
  const client = createClient();
  
  const { data, error } = await client.rpc('update_user_profile', {
    p_user_id: userId,
    p_profile_data: profileData,
    p_tenant_id: tenantId
  });
  
  if (error) throw error;
  return data;
}

// ❌ Incorrect - Multiple separate calls
async function updateUserProfile(userId: string, profileData: any, tenantId: string) {
  const client = createClient();
  
  // Multiple separate calls - not atomic
  await client.from('profiles').update(profileData).eq('user_id', userId);
  await client.from('users').update({ updated_at: new Date() }).eq('id', userId);
}
```

## Performance Considerations

### Efficient Queries
```typescript
// ✅ Correct - Use indexes
const profiles = await client
  .from('profiles')
  .select('*')
  .eq('tenant_id', tenantId) // Uses tenant_id index
  .order('created_at', { ascending: false }) // Uses composite index
  .limit(50);

// ❌ Incorrect - Inefficient queries
const profiles = await client
  .from('profiles')
  .select('*')
  .like('name', `%search%`) // Full table scan
  .eq('tenant_id', tenantId);
```

### Connection Management
```typescript
// ✅ Correct - Single client instance
const client = createClient(); // Create once, reuse

// ❌ Incorrect - Multiple clients
function getData() {
  const client = createClient(); // New connection each time
  return client.from('data').select('*');
}
```

## Dependencies

This package depends on:
- `@supabase/supabase-js` - Supabase client library
- TypeScript - For type safety

## Progressive Documentation

For more details:
- `@.agents/database.md` - Database patterns and RLS guidelines
- `docs/DATABASE.md` - Complete database architecture
- `supabase/migrations/` - Database schema definitions
