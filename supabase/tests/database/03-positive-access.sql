-- T-14: Positive access — authenticated user with correct tenant_id can SELECT/INSERT/UPDATE/DELETE own tenant data.

begin;
create extension if not exists pgtap with schema extensions;
set search_path to public, extensions;

select plan(5);

-- One tenant, one user
insert into public.tenants (id, slug, domain, name, industry)
values ('10000000-0000-0000-0000-000000000001'::uuid, 'tenant-a', 'tenant-a.local', 'Tenant A', 'general')
on conflict (slug) do nothing;
insert into auth.users (id, email) values ('a0000000-0000-0000-0000-000000000001'::uuid, 'user-a@tenant-a.test')
on conflict (id) do nothing;
insert into public.tenant_users (user_id, tenant_id, role)
values ('a0000000-0000-0000-0000-000000000001'::uuid, '10000000-0000-0000-0000-000000000001'::uuid, 'member')
on conflict (user_id, tenant_id) do nothing;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"a0000000-0000-0000-0000-000000000001","app_metadata":{"tenant_id":"10000000-0000-0000-0000-000000000001"}}', true);

-- SELECT: can read own tenant's posts
select lives_ok(
  $$select * from public.posts where tenant_id = '10000000-0000-0000-0000-000000000001'::uuid$$,
  'authenticated can SELECT own tenant posts'
);

-- INSERT: can insert post for own tenant
select lives_ok(
  $$insert into public.posts (tenant_id, title, slug, content, published) values ('10000000-0000-0000-0000-000000000001'::uuid, 'T', 'slug-pos', 'C', false)$$,
  'authenticated can INSERT post for own tenant'
);

-- UPDATE: can update own tenant's post
select lives_ok(
  $$update public.posts set title = 'Updated' where tenant_id = '10000000-0000-0000-0000-000000000001'::uuid and slug = 'slug-pos'$$,
  'authenticated can UPDATE own tenant post'
);

-- DELETE: can delete own tenant's post
select lives_ok(
  $$delete from public.posts where tenant_id = '10000000-0000-0000-0000-000000000001'::uuid and slug = 'slug-pos'$$,
  'authenticated can DELETE own tenant post'
);

-- tenants: can read own row (SELECT only)
select results_eq(
  'select count(*)::int from public.tenants where id = ''10000000-0000-0000-0000-000000000001''::uuid',
  array[1],
  'authenticated can SELECT own tenant row'
);

select * from finish();
rollback;
