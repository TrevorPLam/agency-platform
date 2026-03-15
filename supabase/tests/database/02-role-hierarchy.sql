-- T-14: Role hierarchy — anon sees no tenant-scoped rows; authenticated with tenant sees own.

begin;
create extension if not exists pgtap with schema extensions;
set search_path to public, extensions;

select plan(3);

-- Seed may have one tenant; ensure we have at least one tenant_users row for authenticated test
insert into public.tenants (id, slug, domain, name, industry)
values ('10000000-0000-0000-0000-000000000001'::uuid, 'tenant-a', 'tenant-a.local', 'Tenant A', 'general')
on conflict (slug) do nothing;
insert into auth.users (id, email) values ('a0000000-0000-0000-0000-000000000001'::uuid, 'user-a@tenant-a.test')
on conflict (id) do nothing;
insert into public.tenant_users (user_id, tenant_id, role)
values ('a0000000-0000-0000-0000-000000000001'::uuid, '10000000-0000-0000-0000-000000000001'::uuid, 'member')
on conflict (user_id, tenant_id) do nothing;

-- As anon: no access to tenant_users or posts (RLS returns 0 rows; empty JWT => tenant_id is null)
set local role anon;
select set_config('request.jwt.claims', '{}', true);

select results_eq(
  'select count(*)::int from public.tenant_users',
  array[0],
  'anon sees zero tenant_users'
);
select results_eq(
  'select count(*)::int from public.posts',
  array[0],
  'anon sees zero posts'
);

-- As authenticated with tenant_id: sees own tenant's data
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"a0000000-0000-0000-0000-000000000001","app_metadata":{"tenant_id":"10000000-0000-0000-0000-000000000001"}}', true);
select cmp_ok(
  (select count(*)::int from public.tenant_users),
  '>=',
  1,
  'authenticated with tenant_id sees at least one tenant_users row'
);

select * from finish();
rollback;
