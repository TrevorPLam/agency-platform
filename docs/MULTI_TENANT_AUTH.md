# Multi-Tenant Auth (T-15)

## Overview

- Login and signup use **server-only** flows: `auth_email` is never sent to the client.
- Tenant identity comes from `app_metadata.tenant_id` only (never `user_metadata`).
- Email aliasing: one real email can exist per tenant via `customer_auth_mappings`; login form accepts real email and the server resolves to the internal auth email.

## Creating a test user (T-15.05)

1. Ensure local Supabase is running: `npx supabase start` (and that `riley-day-care` tenant exists, e.g. from seed).
2. From repo root, set env vars (e.g. copy from `apps/prospective-clients/riley-day-care/.env.local`):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
3. Build the database package if needed: `pnpm turbo run build --filter=@agency/database`
4. Run:
   ```bash
   pnpm db:seed-user
   ```
   Or with custom email/password: `pnpm exec tsx scripts/create-test-user.ts your@email.com YourPassword`
5. Confirm in Supabase Studio (Auth → Users) that the user has `app_metadata.tenant_id` set to the riley-day-care tenant UUID.

## Verification checklist (T-15.06 – T-15.09)

### T-15.06 — Tenant-scoped posts

- Log in as the test user at the riley-day-care app.
- Open `/dashboard`. The "Posts (tenant-scoped)" section shows only rows for the current tenant (RLS). If no posts exist, it shows "No posts yet."

### T-15.07 — Cross-tenant query returns empty

- With the test user logged in, any query that would return another tenant’s data is blocked by RLS and returns zero rows (not an error). The dashboard posts query does not pass `tenant_id`; RLS uses the JWT `app_metadata.tenant_id` and filters automatically.

### T-15.08 — Email aliasing: same real email, two tenants

- Create a second tenant (e.g. in Supabase or seed).
- Create a second user with the **same** real email for that tenant (e.g. run `create-test-user.ts` for another tenant or use `createUserForTenant` in a one-off script).
- In `customer_auth_mappings` there should be two rows (one per tenant).
- Log in at riley-day-care with the first user; then log in at the second tenant’s app with the second user. Both work; each session has the correct `app_metadata.tenant_id`.

### T-15.09 — Login with real email

- On the login page, enter the **real** email (e.g. `admin@riley-day-care.example`) and password. Sign-in succeeds without the client ever seeing or using the internal auth email.
