# Security — Five Attack Vectors

This document describes the five attack vectors the agency platform hardens against, how to detect them, and the baseline audit record. See GUIDE.md §16 for full context.

---

## Vector 1: JWT Claim Injection (Critical)

**What it is:** A user modifies `user_metadata.tenant_id` to a different tenant's UUID, and the application reads from `user_metadata` instead of `app_metadata` to set the database session context.

**Detection:**
```bash
grep -r "user_metadata" --include="*.ts" --include="*.tsx" packages/database/ apps/
```
Any result that feeds into `set_config` or a database query is a critical vulnerability.

**Fix:** Always extract tenant from `app_metadata`, never `user_metadata`. RLS uses `current_setting('request.jwt.claims', ...) -> 'app_metadata'`.

**Allowed exception:** The only acceptable use of `user_metadata` in this repo is in `packages/database/src/auth.ts` inside the Supabase Auth API call `createUser({ user_metadata: { real_email, ... } })`. That payload is for display/profile data only and does not feed RLS, `set_config`, or any tenant-scoped query. Tenant identity is set via `app_metadata.tenant_id` in the same call.

---

## Vector 2: Redis Cache Key Collision

**What it is:** Two tenants' cached data shares the same Redis key because the key does not include `tenant_id`. Tenant A can receive Tenant B's cached response.

**Detection:** Audit all cache keys. Every key must be prefixed with `tenant:{id}:`.

**Fix:** Always prefix cache keys with the verified tenant ID:
```ts
const cached = await redis.get(`tenant:${tenantId}:posts:${slug}`)
```
Rule is documented in `.cursor/rules/database.mdc`.

---

## Vector 3: Service Role Key Exposure

**What it is:** The `SUPABASE_SERVICE_ROLE_KEY` appears in client-side code or in `NEXT_PUBLIC_` environment variables. The service role key bypasses all RLS.

**Detection:**
```bash
# Zero results in app source (exclude node_modules, .next)
grep -r "SERVICE_ROLE\|service_role" --include="*.tsx" --include="*.ts" apps/

# Must NOT be exposed via NEXT_PUBLIC_
grep -r "NEXT_PUBLIC_.*SERVICE_ROLE\|NEXT_PUBLIC_SUPABASE_SERVICE" --include="*.ts" --include="*.tsx" --include="*.js" apps/ packages/
```

**Fix:** Use `process.env.SUPABASE_SERVICE_ROLE_KEY` only in server-side code. Access the admin client via `import { getAdminClient } from '@agency/database/admin'`; never expose the key to the client.

---

## Vector 4: API Endpoint Authorization Gaps

**What it is:** An API endpoint or Server Action uses the admin (service role) client and fetches data by ID without verifying that the requesting user's `tenant_id` matches the record's `tenant_id`.

**Detection:** Review every Route Handler and Server Action that uses `getAdminClient()`. Each must use a verified tenant (from session, event payload, or env) and apply `.eq('tenant_id', verifiedTenantId)` (or equivalent) where appropriate.

**Fix:** When using the admin client, always scope by tenant: `.eq('tenant_id', verifiedTenantId)`.

**Baseline review (T-22.06):**
- `apps/agency-admin/src/inngest/functions/onboarding.ts` — Uses `event.data.tenantId` (trusted Inngest payload) for tenants upsert; no user-supplied tenant.
- `apps/clients/riley-day-care/src/app/(auth)/signup/actions.ts` — Tenant from `NEXT_PUBLIC_TENANT_SLUG` + `.eq('slug', slug)`; then `tenant.id` for createUserForTenant. Tenant verified before use.
- `apps/clients/riley-day-care/src/app/(auth)/login/actions.ts` — Same tenant resolution; `.eq('tenant_id', tenant.id)` and `.eq('real_email', realEmail)` on `customer_auth_mappings`.
- No Route Handlers use the admin client without tenant scoping. Callback and Inngest routes use anon client or Inngest only.

---

## Vector 5: HIPAA Isolation

**What it is:** A healthcare client with PHI shares a database with other tenants. Connection saturation or misconfiguration can expose PHI or violate BAA requirements.

**Architecture decision:** Any client with a signed Business Associate Agreement (BAA) for HIPAA must be on a **dedicated Supabase project**. The shared RLS model is not appropriate for HIPAA workloads.

**How to identify:** If a client mentions patient records, medical history, appointment scheduling involving health information, or any PHI, they require a dedicated Supabase project and the HIPAA compliance add-on.

**Onboarding:** When `docs/ONBOARDING_CHECKLIST.md` exists (see T-23), it must state: healthcare clients with PHI require a dedicated Supabase project and signed BAA before go-live. Until then, this requirement is documented here.

---

## Baseline Audit

| Date     | Vector | Command / Check | Result |
| -------- | ------ | ----------------- | ------ |
| 2026-03-15 | 1 | `grep -r "user_metadata" ... packages/database/ apps/` | Only `packages/database/src/auth.ts` (allowed createUser payload). Zero in apps/. |
| 2026-03-15 | 2 | Cache key audit | No Redis in use; rule added to `.cursor/rules/database.mdc`. |
| 2026-03-15 | 3 | SERVICE_ROLE in apps/; NEXT_PUBLIC_.*SERVICE_ROLE | Zero in app source (only node_modules). Zero NEXT_PUBLIC_ service role in apps/ packages/. |
| 2026-03-15 | 4 | Admin client review | See Vector 4 baseline review above. All usages tenant- or event-scoped. |
| 2026-03-15 | 5 | HIPAA doc + checklist | Documented in this file; onboarding checklist to reference when created (T-23). |

---

## HTTP Security Headers

All client and admin apps set the following headers (see each app's `next.config.ts`):

- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- `Content-Security-Policy` (default-src 'self'; script/style as configured)

---

## Password Policy (Supabase)

- `minimum_password_length = 12` in `supabase/config.toml` [auth].
- Leaked password protection (HIBP): enable in Supabase Dashboard for production (Pro plan). Not all CLI configs support it in config.toml; document here and in deployment runbook.
