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

To satisfy T-11 Definition of Done when developing locally, set these to the local API URL and keys printed by `supabase start` in both `apps/prospective-clients/riley-day-care/.env.local` and `apps/agency-admin/.env.local`. (Production clients live under `apps/clients/<slug>`.)

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

## Migration Safety & Index Strategy

### Critical: No CREATE INDEX CONCURRENTLY in Transactional Migrations

**Problem**: `CREATE INDEX CONCURRENTLY` cannot run inside transactions and will fail with Supabase CLI.

**Solution**: Use regular `CREATE INDEX` in main migrations, create separate index-only migrations if needed for production.

### Safe Migration Patterns

1. **Regular Index Creation** (safe in transactions):
   ```sql
   CREATE INDEX idx_table_column ON public.table(column);
   ```

2. **With IF NOT EXISTS** (prevents conflicts):
   ```sql
   CREATE INDEX IF NOT EXISTS idx_table_column ON public.table(column);
   ```

3. **Lock Timeout Safeguards** (for large tables):
   ```sql
   SET lock_timeout TO '5s';
   SET statement_timeout TO '5s';
   CREATE INDEX idx_table_column ON public.table(column);
   ```

### Online Index Strategy (Production)

For production environments where index creation might block writes:

1. **Create separate index migrations** with clear naming: `XXX_table_indexes.sql`
2. **Schedule during maintenance windows** for large tables
3. **Monitor with**: `SELECT * FROM pg_stat_progress_create_index;`
4. **Failure recovery**: `DROP INDEX CONCURRENTLY IF EXISTS idx_failed;`

### Migration Ordering

- Use deterministic sequential naming: `010_`, `011_`, `012_`, etc.
- Index-only migrations: `010_bookings_indexes.sql`, `011_cost_monitoring_indexes.sql`
- Document dependencies in migration comments

### Troubleshooting

- **Failed concurrent index**: Check `pg_index` for `NOT indisvalid` entries
- **Recovery**: `DROP INDEX CONCURRENTLY` + rebuild or `REINDEX CONCURRENTLY` (PG 12+)
- **Lock issues**: Reduce timeout values or schedule during low traffic
