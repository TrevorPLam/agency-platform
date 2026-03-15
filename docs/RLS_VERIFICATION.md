# RLS Verification (T-13)

This document records the Row-Level Security (RLS) verification for the agency platform. Use it to confirm every tenant-scoped table has RLS enabled, correct policies, and index-backed plans.

## 1. RLS Checklist Summary

| Table | RLS | Policies | Uses `public.tenant_id()` | Indexes |
|-------|-----|----------|---------------------------|---------|
| **tenants** | ✅ | SELECT only (own row: `id = public.tenant_id()`) | ✅ | PK on `id` |
| **tenant_users** | ✅ | SELECT, INSERT, UPDATE, DELETE | ✅ | `idx_tenant_users_tenant_id`, `idx_tenant_users_user_id` |
| **posts** | ✅ | SELECT, INSERT, UPDATE, DELETE | ✅ | `idx_posts_tenant_id`, `idx_posts_tenant_created` |
| **audit_log** | ✅ | Service-role only (`USING (false)`) | N/A | `idx_audit_log_tenant_created` |
| **customer_auth_mappings** | ✅ | SELECT only (`user_id = auth.uid()`); service-role write | N/A (user_id) | `idx_customer_auth_mappings_tenant_id`, `user_id`, `tenant_real` |

**Notes:**

- **tenants:** Single SELECT policy; no INSERT/UPDATE/DELETE for authenticated (service role only). Correct by design.
- **audit_log:** No read/write for anon/authenticated; index supports service-role queries.
- **customer_auth_mappings:** Users read own rows; only service role inserts/updates/deletes.

## 2. `public.tenant_id()` Helper

- **Definition:** `supabase/migrations/005_auth_tenant_id_helper.sql`
- **Semantics:** Returns `(request.jwt.claims -> 'app_metadata' ->> 'tenant_id')::uuid`
- **Marked:** `STABLE PARALLEL SAFE` so PostgreSQL evaluates it once per query (initplan), not per row.
- **Grants:** `EXECUTE` to `authenticated` and `anon`.

All tenant-scoped policies on `tenants`, `tenant_users`, and `posts` use `public.tenant_id()` (see migration `007_refactor_rls_use_tenant_id_helper.sql`).

## 3. Verifying Index Scan (Not Seq Scan)

Run the script below with a **real tenant UUID** from your local seed (e.g. `SELECT id FROM public.tenants WHERE slug = 'riverside-hotel';`). Use that UUID in place of `YOUR_TENANT_UUID`.

**Option A — Run `supabase/verify-rls-indexes.sql`:**

From repo root after `npx supabase start`:

```bash
# Replace YOUR_TENANT_UUID with actual UUID from: SELECT id FROM public.tenants WHERE slug = 'riverside-hotel';
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -v tenant_id=YOUR_TENANT_UUID -f supabase/verify-rls-indexes.sql
```

**Option B — Run in Supabase Studio SQL editor:**

1. Get tenant UUID: `SELECT id FROM public.tenants WHERE slug = 'riverside-hotel';`
2. Copy the contents of `supabase/verify-rls-indexes.sql` and replace `YOUR_TENANT_UUID` with that UUID.
3. Execute. Check the plan output for **Index Scan** (or **Index Only Scan**) on the expected indexes, not **Seq Scan**.

**What to confirm:**

- For `tenant_users`: plan should use `Index Scan using idx_tenant_users_tenant_id` (or similar).
- For `posts`: plan should use `Index Scan using idx_posts_tenant_id` (or similar).

If you see **Seq Scan**, add or adjust indexes on the columns used in the RLS `USING`/`WITH CHECK` clauses (see Supabase [RLS performance](https://supabase.com/docs/guides/database/postgres/row-level-security) and troubleshooting docs).

## 4. References

- Migrations: `supabase/migrations/001_tenants.sql` through `007_refactor_rls_use_tenant_id_helper.sql`
- Cursor rules: `.cursor/rules/rls.mdc`, `.cursor/rules/database.mdc`
- Task: TASKS.md § T-13
