-- T-14: Tenant isolation — tenant A cannot see tenant B data (tenant_users, posts).
-- Uses seed tenant (riverside-hotel); creates second tenant and users, then asserts isolation.

begin;
create extension if not exists pgtap with schema extensions;
set search_path to public, extensions;

select plan(4);

-- Rely on seed: one tenant (riverside-hotel). Create second tenant and two users (one per tenant).
insert into public.tenants (id, slug, domain, name, industry)
values
  ('10000000-0000-0000-0000-000000000001'::uuid, 'tenant-a', 'tenant-a.local', 'Tenant A', 'general'),
  ('20000000-0000-0000-0000-000000000002'::uuid, 'tenant-b', 'tenant-b.local', 'Tenant B', 'general')
on conflict (slug) do nothing;

insert into auth.users (id, email)
values
  ('a0000000-0000-0000-0000-000000000001'::uuid, 'user-a@tenant-a.test'),
  ('b0000000-0000-0000-0000-000000000002'::uuid, 'user-b@tenant-b.test')
on conflict (id) do nothing;

insert into public.tenant_users (user_id, tenant_id, role)
values
  ('a0000000-0000-0000-0000-000000000001'::uuid, '10000000-0000-0000-0000-000000000001'::uuid, 'member'),
  ('b0000000-0000-0000-0000-000000000002'::uuid, '20000000-0000-0000-0000-000000000002'::uuid, 'member')
on conflict (user_id, tenant_id) do nothing;

insert into public.posts (tenant_id, title, slug, content, published)
values
  ('10000000-0000-0000-0000-000000000001'::uuid, 'Post A1', 'post-a1', 'A1', true),
  ('20000000-0000-0000-0000-000000000002'::uuid, 'Post B1', 'post-b1', 'B1', true)
on conflict (tenant_id, slug) do nothing;

-- As tenant A: see only tenant A's tenant_users and posts
select set_config('request.jwt.claims', '{"sub":"a0000000-0000-0000-0000-000000000001","app_metadata":{"tenant_id":"10000000-0000-0000-0000-000000000001"}}', true);
set local role authenticated;

select results_eq(
  'select count(*)::int from public.tenant_users',
  array[1],
  'tenant A sees only one tenant_users row (own tenant)'
);
select results_eq(
  'select count(*)::int from public.posts',
  array[1],
  'tenant A sees only one post (own tenant)'
);

-- As tenant B: see only tenant B's data
select set_config('request.jwt.claims', '{"sub":"b0000000-0000-0000-0000-000000000002","app_metadata":{"tenant_id":"20000000-0000-0000-0000-000000000002"}}', true);
select results_eq(
  'select count(*)::int from public.tenant_users',
  array[1],
  'tenant B sees only one tenant_users row (own tenant)'
);
select results_eq(
  'select count(*)::int from public.posts',
  array[1],
  'tenant B sees only one post (own tenant)'
);

select * from finish();
rollback;
