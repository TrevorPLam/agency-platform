# Database Patterns & RLS Guidelines

## Core Database Principles

### Multi-Tenant Architecture
- **Tenant Isolation**: All tables must have tenant_id column with RLS policies
- **Row-Level Security**: Every table requires RLS to be enabled
- **Tenant Context**: Use `public.tenant_id()` function in all RLS policies
- **Never Cross-Tenant**: Queries must never span tenant boundaries

### RLS Policy Requirements

When creating new tables or modifying existing ones:

```sql
-- 1. Always enable RLS
ALTER TABLE your_table ENABLE ROW LEVEL SECURITY;

-- 2. Always create tenant_id index
CREATE INDEX CONCURRENTLY idx_your_table_tenant_id ON your_table(tenant_id);

-- 3. Always create composite index for performance
CREATE INDEX CONCURRENTLY idx_your_table_tenant_created ON your_table(tenant_id, created_at);

-- 4. Always create all four policies
-- SELECT policy
CREATE POLICY "Users can view own tenant data" ON your_table
    FOR SELECT USING (tenant_id = public.tenant_id());

-- INSERT policy  
CREATE POLICY "Users can insert own tenant data" ON your_table
    FOR INSERT WITH CHECK (tenant_id = public.tenant_id());

-- UPDATE policy
CREATE POLICY "Users can update own tenant data" ON your_table
    FOR UPDATE USING (tenant_id = public.tenant_id())
    WITH CHECK (tenant_id = public.tenant_id());

-- DELETE policy
CREATE POLICY "Users can delete own tenant data" ON your_table
    FOR DELETE USING (tenant_id = public.tenant_id());
```

### Database Commands

```bash
# Test RLS policies
supabase test db

# Start local Supabase
supabase start

# Create new migration
supabase migration new migration_name

# Apply migrations
supabase db push

# Generate types
supabase gen types typescript --local > types.ts
```

### Code Patterns

#### Database Client Usage
```typescript
// ✅ Correct - Use @agency/database
import { createClient } from '@agency/database';
import { Database } from '@agency/database/types';

const client = createClient();

// ✅ Correct - Always include tenant_id
const { data, error } = await client
  .from('profiles')
  .select('*')
  .eq('tenant_id', tenantId);

// ❌ Incorrect - Never call Supabase directly
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
```

#### Type Safety
```typescript
// ✅ Correct - Use generated types
import { Database } from '@agency/database/types';

type Profile = Database['public']['Tables']['profiles']['Row'];

// ❌ Incorrect - Don't define types manually
interface Profile {
  id: string;
  // ... manual type definition
}
```

### Migration Best Practices

1. **Always test RLS**: Run `supabase test db` after schema changes
2. **Use CONCURRENTLY**: For index creation in production
3. **Backward Compatible**: Never break existing migrations
4. **Tenant-First**: Always consider multi-tenant implications

### Security Considerations

- **Service Role**: Never expose SUPABASE_SERVICE_ROLE_KEY to clients
- **App Metadata**: Use `app_metadata.tenant_id`, never `user_metadata`
- **Port 6543**: Always use Supavisor port, never 5432
- **Connection Pooling**: Use @agency/database for proper connection management

### Testing Database Changes

```bash
# Run specific test file
supabase test db --test-path tests/test_profiles.sql

# Run all tests
supabase test db

# Test with specific tenant context
# Tests automatically handle tenant context via test helpers
```

### Common Patterns

#### Tenant-Aware Queries
```typescript
// ✅ Correct - Tenant-aware
async function getProfiles(tenantId: string) {
  return await client
    .from('profiles')
    .select('*')
    .eq('tenant_id', tenantId);
}

// ❌ Incorrect - Not tenant-aware
async function getProfiles() {
  return await client
    .from('profiles')
    .select('*');
}
```

#### Error Handling
```typescript
// ✅ Correct - Proper error handling
try {
  const { data, error } = await client
    .from('profiles')
    .insert(profile);
  
  if (error) throw error;
  return data;
} catch (error) {
  console.error('Database error:', error);
  throw error;
}
```

## File Structure Reference

```
supabase/
├── migrations/
│   ├── 001_tenants.sql
│   ├── 002_tenant_users.sql
│   └── [your_new_migration].sql
├── tests/
│   ├── database/
│   └── test_[your_table].sql
└── config.toml
```

## Progressive Documentation

For more details:
- `docs/DATABASE.md` - Complete database architecture guide
- `docs/SECURITY.md` - Security implementation details
- `supabase/migrations/005_auth_tenant_id_helper.sql` - Tenant helper functions
