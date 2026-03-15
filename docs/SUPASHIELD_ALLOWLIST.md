# Supashield Allowlist (T-14)

If you use [Supashield](https://github.com/Rodrigotari1/supashield) or similar RLS audit tools, this document describes the intended RLS design so that expected patterns are not flagged as failures.

## Tables and intended RLS behavior

| Table | RLS | Intentional design |
|-------|-----|---------------------|
| **tenants** | SELECT only (own row: `id = public.tenant_id()`) | No INSERT/UPDATE/DELETE for authenticated; service role only. Allowlist: “tenants has no INSERT/UPDATE/DELETE policy” (by design). |
| **tenant_users** | SELECT, INSERT, UPDATE, DELETE with `tenant_id = public.tenant_id()` | Full CRUD for authenticated in own tenant. |
| **posts** | SELECT, INSERT, UPDATE, DELETE with `tenant_id = public.tenant_id()` | Full CRUD for authenticated in own tenant. |
| **audit_log** | Single policy `USING (false)` | Service-role only; anon and authenticated see no rows. Allowlist: “audit_log has no SELECT policy for authenticated” (by design). |
| **customer_auth_mappings** | SELECT only `user_id = auth.uid()` | Users read own mapping; only service role writes. Allowlist: “customer_auth_mappings has no INSERT/UPDATE/DELETE for authenticated” (by design). |

## What to allowlist in Supashield (if applicable)

- **audit_log**: No read access for anon/authenticated is intentional.
- **tenants**: No write access for anon/authenticated is intentional.
- **customer_auth_mappings**: No write access for anon/authenticated is intentional.

## Verification

RLS is verified by the pgTAP suite in `supabase/tests/database/`. Run:

```bash
supabase test db
```

See `docs/RLS_VERIFICATION.md` for manual index verification.
