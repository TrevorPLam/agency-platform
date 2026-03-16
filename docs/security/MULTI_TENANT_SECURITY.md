# Multi-Tenant Security Guide

Comprehensive security guide for the agency platform's multi-tenant architecture. Covers authentication flows, Row-Level Security (RLS) implementation, verification procedures, and audit tool integration.

---

## Overview

The agency platform uses a multi-tenant architecture where each client's data is strictly isolated through multiple security layers. This guide covers the complete security model from authentication to database isolation.

### Security Architecture

- **Authentication**: Server-only flows with tenant identity in `app_metadata.tenant_id`
- **Database**: Row-Level Security (RLS) on every tenant-scoped table
- **Cache**: Tenant-prefixed keys to prevent cross-tenant data leakage
- **API**: Tenant resolution middleware and request validation
- **Audit**: Comprehensive logging and verification procedures

---

## Authentication and Authorization

### Multi-Tenant Auth Flow

**Key Principles:**
- Login and signup use **server-only** flows: `auth_email` is never sent to the client
- Tenant identity comes from `app_metadata.tenant_id` only (never `user_metadata`)
- Email aliasing: one real email can exist per tenant via `customer_auth_mappings`

### Authentication Components

#### 1. Tenant Identity Resolution
```typescript
// Always extract from app_metadata, never user_metadata
const tenantId = session.user.app_metadata.tenant_id
```

#### 2. Email Aliasing System
- **Purpose**: Allow users to use the same real email across different tenants
- **Implementation**: `customer_auth_mappings` table maps real emails to internal auth emails
- **Flow**: User enters real email → server resolves to internal auth email for that tenant

#### 3. Session Management
- **JWT Structure**: `app_metadata.tenant_id` contains tenant UUID
- **Middleware**: `resolveTenantFromRequest` extracts tenant from session or hostname
- **Validation**: Every request must have valid tenant context

### Creating Test Users

1. Ensure local Supabase is running: `npx supabase start` (and that `riley-day-care` tenant exists)
2. From repo root, set env vars:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
3. Build the database package if needed: `pnpm turbo run build --filter=@agency/database`
4. Run:
   ```bash
   pnpm db:seed-user
   ```
   Or with custom email/password: `pnpm exec tsx scripts/create-test-user.ts your@email.com YourPassword`

### Verification Checklist

#### T-15.06 — Tenant-scoped posts
- Log in as the test user at the riley-day-care app
- Open `/dashboard`. The "Posts (tenant-scoped)" section shows only rows for the current tenant (RLS)

#### T-15.07 — Cross-tenant query returns empty
- With the test user logged in, any query that would return another tenant's data is blocked by RLS and returns zero rows

#### T-15.08 — Email aliasing: same real email, two tenants
- Create a second tenant and user with the **same** real email
- Both users can log in with the same real email but get different tenant sessions

#### T-15.09 — Login with real email
- On the login page, enter the **real** email and password. Sign-in succeeds without the client ever seeing the internal auth email

---

## Row-Level Security (RLS)

### RLS Implementation Standards

#### 1. Table Structure Requirements
Every tenant-scoped table must include:
```sql
CREATE TABLE public.table_name (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  -- other columns...
  created_at timestamptz NOT NULL DEFAULT now()
);
```

#### 2. RLS Enablement and Indexes
```sql
ALTER TABLE public.table_name ENABLE ROW LEVEL SECURITY;

CREATE INDEX CONCURRENTLY idx_table_name_tenant_id ON public.table_name (tenant_id);
CREATE INDEX CONCURRENTLY idx_table_name_tenant_created ON public.table_name (tenant_id, created_at DESC);
```

#### 3. Standard RLS Policies
```sql
-- SELECT policy
CREATE POLICY "Tenants select own table_name"
  ON public.table_name FOR SELECT
  USING (tenant_id = public.tenant_id());

-- INSERT policy
CREATE POLICY "Tenants insert own table_name"
  ON public.table_name FOR INSERT
  WITH CHECK (tenant_id = public.tenant_id());

-- UPDATE policy
CREATE POLICY "Tenants update own table_name"
  ON public.table_name FOR UPDATE
  USING (tenant_id = public.tenant_id())
  WITH CHECK (tenant_id = public.tenant_id());

-- DELETE policy
CREATE POLICY "Tenants delete own table_name"
  ON public.table_name FOR DELETE
  USING (tenant_id = public.tenant_id());
```

### public.tenant_id() Helper

**Definition:** `supabase/migrations/005_auth_tenant_id_helper.sql`
```sql
CREATE OR REPLACE FUNCTION public.tenant_id()
RETURNS uuid
LANGUAGE sql
STABLE PARALLEL SAFE AS $$
  SELECT (request.jwt.claims -> 'app_metadata' ->> 'tenant_id')::uuid;
$$;
```

**Benefits:**
- **STABLE PARALLEL SAFE**: PostgreSQL evaluates once per query, not per row
- **Consistent**: Single source of truth for tenant resolution
- **Secure**: Cannot be tampered with by client code

### RLS Verification Checklist

#### Current Table Status

| Table                      | RLS | Policies                                                 | Uses `public.tenant_id()` | Indexes                                                          |
| -------------------------- | --- | -------------------------------------------------------- | ------------------------- | ---------------------------------------------------------------- |
| **tenants**                | ✅  | SELECT only (own row: `id = public.tenant_id()`)         | ✅                        | PK on `id`                                                       |
| **tenant_users**           | ✅  | SELECT, INSERT, UPDATE, DELETE                           | ✅                        | `idx_tenant_users_tenant_id`, `idx_tenant_users_user_id`         |
| **posts**                  | ✅  | SELECT, INSERT, UPDATE, DELETE                           | ✅                        | `idx_posts_tenant_id`, `idx_posts_tenant_created`                |
| **audit_log**              | ✅  | Service-role only (`USING (false)`)                      | N/A                       | `idx_audit_log_tenant_created`                                   |
| **customer_auth_mappings** | ✅  | SELECT only (`user_id = auth.uid()`); service-role write | N/A (user_id)             | `idx_customer_auth_mappings_tenant_id`, `user_id`, `tenant_real` |
| **bookings**               | ✅  | SELECT, INSERT, UPDATE, DELETE                           | ✅                        | `idx_bookings_tenant_id`, `idx_bookings_tenant_created`           |
| **contact_submissions**   | ✅  | SELECT, UPDATE, DELETE (no INSERT for anon/authenticated) | ✅                        | `idx_contact_submissions_tenant_id`, `idx_contact_submissions_tenant_created` |

#### Special Cases

- **tenants**: Single SELECT policy; no INSERT/UPDATE/DELETE for authenticated (service role only)
- **audit_log**: No read/write for anon/authenticated; index supports service-role queries
- **customer_auth_mappings**: Users read own rows; only service role inserts/updates/deletes
- **contact_submissions**: No INSERT policy for authenticated users (service role only)

### Index Performance Verification

Run the script below with a **real tenant UUID** from your local seed:

```bash
# Replace YOUR_TENANT_UUID with actual UUID from: SELECT id FROM public.tenants WHERE slug = 'riley-day-care';
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -v tenant_id=YOUR_TENANT_UUID -f supabase/verify-rls-indexes.sql
```

**What to confirm:**
- For `tenant_users`: plan should use `Index Scan using idx_tenant_users_tenant_id`
- For `posts`: plan should use `Index Scan using idx_posts_tenant_id`

If you see **Seq Scan**, add or adjust indexes on the columns used in the RLS `USING`/`WITH CHECK` clauses.

---

## Security Audit Tools

### Supashield Allowlist

If you use [Supashield](https://github.com/Rodrigotari1/supashield) or similar RLS audit tools, use this allowlist:

#### Intentional RLS Design Patterns

| Table                      | RLS Policy Pattern                                                                 | Rationale                                                                 |
| -------------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| **tenants**                | SELECT only (own row: `id = public.tenant_id()`)                                 | No INSERT/UPDATE/DELETE for authenticated; service role only              |
| **tenant_users**           | SELECT, INSERT, UPDATE, DELETE with `tenant_id = public.tenant_id()`             | Full CRUD for authenticated in own tenant                                  |
| **posts**                  | SELECT, INSERT, UPDATE, DELETE with `tenant_id = public.tenant_id()`             | Full CRUD for authenticated in own tenant                                  |
| **audit_log**              | Single policy `USING (false)`                                                    | Service-role only; anon and authenticated see no rows                     |
| **customer_auth_mappings** | SELECT only `user_id = auth.uid()`                                               | Users read own mapping; only service role writes                           |

#### Allowlist Items

- **audit_log**: No read access for anon/authenticated is intentional
- **tenants**: No write access for anon/authenticated is intentional  
- **customer_auth_mappings**: No write access for anon/authenticated is intentional

### Automated Security Scans

#### CI Security Steps
The following security checks run automatically in CI:

1. **Service Role Key Exposure**: Scan for `NEXT_PUBLIC_` + `SERVICE_ROLE_KEY` patterns
2. **User Metadata Usage**: Ensure `tenant_id` is never read from `user_metadata`
3. **RLS Coverage**: Verify all tenant-scoped tables have RLS enabled and proper policies
4. **Index Verification**: Confirm `tenant_id` indexes exist and are being used

#### Manual Security Verification

```bash
# Check for service role key exposure
grep -r "NEXT_PUBLIC_.*SERVICE_ROLE" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" apps/ packages/

# Check for user_metadata tenant usage
grep -r "user_metadata.*tenant_id" --include="*.ts" --include="*.tsx" packages/database/

# Verify RLS policies
supabase test db
```

---

## Security Best Practices

### Database Security

1. **Always use `app_metadata.tenant_id`** - Never trust `user_metadata` for tenant identity
2. **Enable RLS on every public table** - No exceptions for tenant-scoped data
3. **Use `public.tenant_id()` helper** - Consistent and performant tenant resolution
4. **Create proper indexes** - `tenant_id` and `(tenant_id, created_at)` indexes are mandatory
5. **Service role only on server** - Never expose service role key to client code

### Application Security

1. **Validate tenant context** - Every data operation must verify tenant membership
2. **Use server-side auth flows** - Never send auth emails to client
3. **Implement proper middleware** - Resolve tenant early in the request lifecycle
4. **Cache with tenant prefixes** - Use `tenant:{id}:` pattern for all cache keys
5. **Log security events** - Audit all tenant switches and permission changes

### Development Security

1. **Never hardcode secrets** - Use environment variables and secret management
2. **Follow least privilege** - Grant minimum required permissions
3. **Test cross-tenant isolation** - Verify tenant A cannot access tenant B's data
4. **Use parameterized queries** - Prevent SQL injection
5. **Regular security audits** - Run automated scans and manual reviews

---

## Common Security Scenarios

### Scenario 1: New Tenant Onboarding

1. Create tenant record in `tenants` table
2. Generate tenant-specific auth mappings
3. Create initial admin user with `app_metadata.tenant_id`
4. Verify RLS policies work with new tenant
5. Test cross-tenant isolation

### Scenario 2: User Login Flow

1. User submits email/password
2. Server resolves email to internal auth email via `customer_auth_mappings`
3. Supabase validates credentials
4. JWT contains `app_metadata.tenant_id`
5. Middleware extracts tenant for request context
6. All subsequent queries are automatically scoped by RLS

### Scenario 3: Data Access Verification

```typescript
// Correct: Server Action with tenant verification
export async function createPost(data: PostData) {
  const supabase = createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user?.app_metadata?.tenant_id) {
    return { success: false, error: 'Unauthorized' }
  }
  
  const { data, error } = await supabase
    .from('posts')
    .insert({ ...data, tenant_id: user.app_metadata.tenant_id })
    
  return { success: !error, data, error }
}
```

---

## Troubleshooting

### Common RLS Issues

#### Problem: Queries return empty results
**Cause:** RLS policy is too restrictive or tenant_id is missing
**Solution:** Verify `public.tenant_id()` returns correct UUID and policies match expected patterns

#### Problem: Slow queries on tenant-scoped tables
**Cause:** Missing or incorrect indexes on tenant_id
**Solution:** Run `EXPLAIN ANALYZE` and ensure `Index Scan` is used, not `Seq Scan`

#### Problem: Cross-tenant data leakage
**Cause:** RLS not enabled or policies missing
**Solution:** Verify `ALTER TABLE ENABLE ROW LEVEL SECURITY` and all four policy types exist

### Debugging Tools

```sql
-- Check if RLS is enabled
SELECT relname, relrowsecurity FROM pg_class WHERE relname = 'your_table';

-- Check current tenant from JWT
SELECT public.tenant_id();

-- Verify policy definitions
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies WHERE tablename = 'your_table';
```

---

## References

- **Migrations**: `supabase/migrations/001_tenants.sql` through `007_refactor_rls_use_tenant_id_helper.sql`
- **Tests**: `supabase/tests/database/` - pgTAP RLS isolation tests
- **Rules**: `.cursor/rules/rls.mdc`, `.cursor/rules/database.mdc`
- **Verification**: `RLS_VERIFICATION.md` (this document replaces previous separate security docs)

---

_This consolidated guide replaces MULTI_TENANT_AUTH.md, RLS_VERIFICATION.md, and SUPASHIELD_ALLOWLIST.md. All content has been combined and organized for comprehensive security coverage._
