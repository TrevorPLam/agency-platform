-- T-14.02: RLS coverage — RLS enabled on all public tables, expected table count, and policy names.
-- Policies use public.tenant_id() (migration 007). Requires 000-setup (Basejump test helpers).

begin;
create extension if not exists pgtap with schema extensions;
set search_path to public, extensions;

select plan(9);

-- Schema-wide: RLS enabled on every table in public (no Basejump dependency)
select is(
  (select count(*)::int from pg_class c
   join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relkind = 'r' and c.relrowsecurity = true),
  (select count(*)::int from pg_tables where schemaname = 'public'),
  'RLS is enabled on all public tables'
);

-- Guardrail: exact table count (update when adding migrations)
select is(
  (select count(*)::int from pg_tables where schemaname = 'public'),
  7,
  'Expected exactly 7 tables in public schema'
);

-- tenants: single SELECT policy (own row only)
select policies_are(
  'public',
  'tenants',
  array['Tenants can read their own row'],
  'tenants has one SELECT policy'
);

-- tenant_users: all four operations
select policies_are(
  'public',
  'tenant_users',
  array[
    'Tenants select own tenant_users',
    'Tenants insert own tenant_users',
    'Tenants update own tenant_users',
    'Tenants delete own tenant_users'
  ],
  'tenant_users has SELECT, INSERT, UPDATE, DELETE policies'
);

-- posts: all four operations
select policies_are(
  'public',
  'posts',
  array[
    'Tenants select own posts',
    'Tenants insert own posts',
    'Tenants update own posts',
    'Tenants delete own posts'
  ],
  'posts has SELECT, INSERT, UPDATE, DELETE policies'
);

-- audit_log: service-role only (USING false)
select policies_are(
  'public',
  'audit_log',
  array['Service role only'],
  'audit_log has service-role-only policy'
);

-- customer_auth_mappings: users read own; no INSERT/UPDATE/DELETE for anon/authenticated
select policies_are(
  'public',
  'customer_auth_mappings',
  array['Users read own customer_auth_mappings'],
  'customer_auth_mappings has own-read SELECT policy'
);

-- bookings: all four operations (tenant-scoped)
select policies_are(
  'public',
  'bookings',
  array[
    'Tenants select own bookings',
    'Tenants insert own bookings',
    'Tenants update own bookings',
    'Tenants delete own bookings'
  ],
  'bookings has SELECT, INSERT, UPDATE, DELETE policies'
);

-- contact_submissions: SELECT, UPDATE, DELETE (no INSERT for anon/authenticated; service-role only)
select policies_are(
  'public',
  'contact_submissions',
  array[
    'Tenants select own contact submissions',
    'Tenants update own contact submissions',
    'Tenants delete own contact submissions'
  ],
  'contact_submissions has SELECT, UPDATE, DELETE policies'
);

select * from finish();
rollback;
