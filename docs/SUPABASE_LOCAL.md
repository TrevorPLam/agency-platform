# Local Supabase Development

Local Supabase runs via Docker. Use it when you need Studio, Auth emulation, or local migrations without touching production.

## Prerequisites

- **Docker Desktop** running (required for `supabase start`).
- Supabase CLI: `npx supabase` (or install globally).

## Start local stack

From repo root:

```bash
npx supabase start
```

First run can take several minutes. When ready, the CLI prints:

- **API URL:** `http://127.0.0.1:54321`
- **Studio URL:** `http://127.0.0.1:54323`
- **Anon key** and **Service role key** for local use

## Use local Supabase in apps

For local development against this stack, set in each app’s `.env.local`:

- `NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY=<local anon key from supabase start output>`
- `SUPABASE_SERVICE_ROLE_KEY=<local service role key from supabase start output>`

To satisfy T-11 Definition of Done when developing locally, set these to the local API URL and keys printed by `supabase start` in both `apps/clients/riverside-hotel/.env.local` and `apps/agency-admin/.env.local`.

When not using local Supabase, point these to the production project (current setup).

## Verify

- **Status:** `npx supabase status` — lists all services and keys.
- **Studio:** open http://localhost:54323 (or http://127.0.0.1:54323) to inspect DB, Auth, etc.
- **Verified:** Local stack runs successfully with Docker Desktop; first `supabase start` may take several minutes while images are pulled.

## CI (T-21)

In GitHub Actions, use `supabase db start` (Postgres only) instead of `supabase start` to save time; full stack is only needed for local Studio/Auth.

## Config notes

- **pgTAP:** Enabled via SQL in test setup (`supabase/tests/database/000-setup-test-hooks.sql`), not in `config.toml`.
- **Auth:** `email_confirm_if_verified` is not in the CLI config schema; configure in Supabase Dashboard for production if needed.
- **Seed:** `supabase/seed.sql` runs after migrations on `supabase db reset`.
