-- T-14.03: Tenant isolation — all four attack types per tenant-scoped table.
-- Cross-tenant SELECT (is_empty), UPDATE (is_empty), DELETE (is_empty), INSERT wrong tenant_id (throws_ok 42501).

begin;
create extension if not exists pgtap with schema extensions;
set search_path to public, extensions;

select plan(20);

-- Tenants and users (reuse existing UUIDs from 02/03)
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

insert into public.bookings (tenant_id, email)
values
  ('10000000-0000-0000-0000-000000000001'::uuid, 'a@tenant-a.test'),
  ('20000000-0000-0000-0000-000000000002'::uuid, 'b@tenant-b.test');

insert into public.contact_submissions (tenant_id, source, name, email, message)
values
  ('10000000-0000-0000-0000-000000000001'::uuid, 'tenant-a', 'User A', 'a@tenant-a.test', 'Message A'),
  ('20000000-0000-0000-0000-000000000002'::uuid, 'tenant-b', 'User B', 'b@tenant-b.test', 'Message B');

set local role authenticated;

-- As tenant A: cannot read tenant B's row in tenants
select set_config('request.jwt.claims', '{"sub":"a0000000-0000-0000-0000-000000000001","app_metadata":{"tenant_id":"10000000-0000-0000-0000-000000000001"}}', true);
select is_empty(
  $$select 1 from public.tenants where id = '20000000-0000-0000-0000-000000000002'::uuid$$,
  'tenant A cannot SELECT other tenant row'
);

-- As tenant A: cannot see tenant B's tenant_users
select is_empty(
  $$select 1 from public.tenant_users where tenant_id = '20000000-0000-0000-0000-000000000002'::uuid$$,
  'tenant A cannot SELECT cross-tenant tenant_users'
);

-- As tenant A: cannot see tenant B's posts
select is_empty(
  $$select 1 from public.posts where tenant_id = '20000000-0000-0000-0000-000000000002'::uuid$$,
  'tenant A cannot SELECT cross-tenant posts'
);

-- As tenant A: UPDATE on B's tenant_users affects 0 rows
select is_empty(
  $$with u as (update public.tenant_users set role = 'admin' where tenant_id = '20000000-0000-0000-0000-000000000002'::uuid returning 1) select * from u$$,
  'tenant A cannot UPDATE cross-tenant tenant_users'
);

-- As tenant A: DELETE on B's tenant_users affects 0 rows
select is_empty(
  $$with d as (delete from public.tenant_users where tenant_id = '20000000-0000-0000-0000-000000000002'::uuid returning 1) select * from d$$,
  'tenant A cannot DELETE cross-tenant tenant_users'
);

-- As tenant A: INSERT with B's tenant_id raises 42501
select throws_ok(
  $$insert into public.tenant_users (user_id, tenant_id, role) values ('a0000000-0000-0000-0000-000000000001'::uuid, '20000000-0000-0000-0000-000000000002'::uuid, 'member')$$,
  '42501'
);

-- As tenant A: UPDATE on B's posts affects 0 rows
select is_empty(
  $$with u as (update public.posts set title = 'x' where tenant_id = '20000000-0000-0000-0000-000000000002'::uuid returning 1) select * from u$$,
  'tenant A cannot UPDATE cross-tenant posts'
);

-- As tenant A: DELETE on B's posts affects 0 rows
select is_empty(
  $$with d as (delete from public.posts where tenant_id = '20000000-0000-0000-0000-000000000002'::uuid returning 1) select * from d$$,
  'tenant A cannot DELETE cross-tenant posts'
);

-- As tenant A: INSERT posts with B's tenant_id raises 42501
select throws_ok(
  $$insert into public.posts (tenant_id, title, slug, content, published) values ('20000000-0000-0000-0000-000000000002'::uuid, 'x', 'x', 'x', false)$$,
  '42501'
);

-- As tenant B: cannot see tenant A's tenant_users
select set_config('request.jwt.claims', '{"sub":"b0000000-0000-0000-0000-000000000002","app_metadata":{"tenant_id":"20000000-0000-0000-0000-000000000002"}}', true);
select is_empty(
  $$select 1 from public.tenant_users where tenant_id = '10000000-0000-0000-0000-000000000001'::uuid$$,
  'tenant B cannot SELECT cross-tenant tenant_users'
);

-- As tenant B: cannot see tenant A's posts
select is_empty(
  $$select 1 from public.posts where tenant_id = '10000000-0000-0000-0000-000000000001'::uuid$$,
  'tenant B cannot SELECT cross-tenant posts'
);

-- As tenant B: cannot read tenant A's row in tenants
select is_empty(
  $$select 1 from public.tenants where id = '10000000-0000-0000-0000-000000000001'::uuid$$,
  'tenant B cannot SELECT other tenant row'
);

-- bookings: tenant A cannot see/update/delete/insert cross-tenant
select set_config('request.jwt.claims', '{"sub":"a0000000-0000-0000-0000-000000000001","app_metadata":{"tenant_id":"10000000-0000-0000-0000-000000000001"}}', true);
select is_empty(
  $$select 1 from public.bookings where tenant_id = '20000000-0000-0000-0000-000000000002'::uuid$$,
  'tenant A cannot SELECT cross-tenant bookings'
);
select is_empty(
  $$with u as (update public.bookings set email = 'x' where tenant_id = '20000000-0000-0000-0000-000000000002'::uuid returning 1) select * from u$$,
  'tenant A cannot UPDATE cross-tenant bookings'
);
select is_empty(
  $$with d as (delete from public.bookings where tenant_id = '20000000-0000-0000-0000-000000000002'::uuid returning 1) select * from d$$,
  'tenant A cannot DELETE cross-tenant bookings'
);
select throws_ok(
  $$insert into public.bookings (tenant_id, email) values ('20000000-0000-0000-0000-000000000002'::uuid, 'a@test.com')$$,
  '42501'
);

-- contact_submissions: tenant A cannot see/update/delete B's; INSERT as authenticated not allowed (service-role only)
select is_empty(
  $$select 1 from public.contact_submissions where tenant_id = '20000000-0000-0000-0000-000000000002'::uuid$$,
  'tenant A cannot SELECT cross-tenant contact_submissions'
);
select is_empty(
  $$with u as (update public.contact_submissions set status = 'closed' where tenant_id = '20000000-0000-0000-0000-000000000002'::uuid returning 1) select * from u$$,
  'tenant A cannot UPDATE cross-tenant contact_submissions'
);
select is_empty(
  $$with d as (delete from public.contact_submissions where tenant_id = '20000000-0000-0000-0000-000000000002'::uuid returning 1) select * from d$$,
  'tenant A cannot DELETE cross-tenant contact_submissions'
);
select throws_ok(
  $$insert into public.contact_submissions (tenant_id, source, name, email, message) values ('20000000-0000-0000-0000-000000000002'::uuid, 'test', 'X', 'x@test.com', 'msg')$$,
  '42501'
);

select * from finish();
rollback;
