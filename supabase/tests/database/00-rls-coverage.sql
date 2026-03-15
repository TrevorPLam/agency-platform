-- T-14: RLS coverage — assert expected policies exist on every table with RLS.
-- Policies are refactored to use public.tenant_id() in migration 007.

begin;
create extension if not exists pgtap with schema extensions;
set search_path to public, extensions;

select plan(5);

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

select * from finish();
rollback;
