-- T-15: Cost Summary Function Authorization Tests
-- Tests SECURITY DEFINER function with proper caller authorization enforcement
-- Verifies tenant isolation and cross-tenant access prevention

begin;
create extension if not exists pgtap with schema extensions;
set search_path to public, extensions;

select plan(12);

-- Setup test data: two tenants, two users
insert into public.tenants (id, slug, domain, name, industry)
values 
    ('30000000-0000-0000-0000-000000000001'::uuid, 'tenant-alpha', 'alpha.local', 'Tenant Alpha', 'general'),
    ('30000000-0000-0000-0000-000000000002'::uuid, 'tenant-beta', 'beta.local', 'Tenant Beta', 'general')
on conflict (slug) do nothing;

insert into auth.users (id, email, raw_user_meta_data)
values 
    ('c0000000-0000-0000-0000-000000000001'::uuid, 'user-alpha@tenant-alpha.test', '{"is_platform_admin": false}'::jsonb),
    ('c0000000-0000-0000-0000-000000000002'::uuid, 'user-beta@tenant-beta.test', '{"is_platform_admin": false}'::jsonb),
    ('c0000000-0000-0000-0000-000000000003'::uuid, 'admin@agency.com', '{"is_platform_admin": true}'::jsonb)
on conflict (id) do nothing;

insert into public.tenant_users (user_id, tenant_id, role)
values 
    ('c0000000-0000-0000-0000-000000000001'::uuid, '30000000-0000-0000-0000-000000000001'::uuid, 'member'),
    ('c0000000-0000-0000-0000-000000000002'::uuid, '30000000-0000-0000-0000-000000000002'::uuid, 'member')
on conflict (user_id, tenant_id) do nothing;

-- Insert cost data for both tenants
insert into public.cost_metrics (tenant_id, storage_usage, cicd_runtime, bandwidth_usage, total_cost, currency, timestamp, period)
values 
    ('30000000-0000-0000-0000-000000000001'::uuid, 1000000000, 60, 500000000, 100.00, 'USD', NOW() - INTERVAL '1 day', 'daily'),
    ('30000000-0000-0000-0000-000000000001'::uuid, 1100000000, 65, 550000000, 110.00, 'USD', NOW() - INTERVAL '2 days', 'daily'),
    ('30000000-0000-0000-0000-000000000002'::uuid, 2000000000, 120, 1000000000, 200.00, 'USD', NOW() - INTERVAL '1 day', 'daily'),
    ('30000000-0000-0000-0000-000000000002'::uuid, 2100000000, 125, 1050000000, 210.00, 'USD', NOW() - INTERVAL '2 days', 'daily')
on conflict do nothing;

-- Test 1: Regular user can access own tenant cost summary
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"c0000000-0000-0000-0000-000000000001","app_metadata":{"tenant_id":"30000000-0000-0000-0000-000000000001"}}', true);

select lives_ok(
    $$select * from public.get_tenant_cost_summary('30000000-0000-0000-0000-000000000001'::uuid, 7)$$,
    'user-alpha can access own tenant cost summary'
);

-- Test 2: Regular user gets correct data for own tenant
select results_eq(
    $$select total_cost::decimal from public.get_tenant_cost_summary('30000000-0000-0000-0000-000000000001'::uuid, 7) limit 1$$,
    array[210.00::decimal],
    'user-alpha gets correct total cost for own tenant'
);

-- Test 3: Regular user CANNOT access other tenant cost summary (cross-tenant prevention)
select throws_like(
    $$select * from public.get_tenant_cost_summary('30000000-0000-0000-0000-000000000002'::uuid, 7)$$,
    '42501',
    'Access denied: Cannot access other tenant data',
    'user-alpha cannot access tenant-beta cost summary'
);

-- Test 4: Second user can access their own tenant
select set_config('request.jwt.claims', '{"sub":"c0000000-0000-0000-0000-000000000002","app_metadata":{"tenant_id":"30000000-0000-0000-0000-000000000002"}}', true);

select lives_ok(
    $$select * from public.get_tenant_cost_summary('30000000-0000-0000-0000-000000000002'::uuid, 7)$$,
    'user-beta can access own tenant cost summary'
);

-- Test 5: Second user gets correct data for their own tenant
select results_eq(
    $$select total_cost::decimal from public.get_tenant_cost_summary('30000000-0000-0000-0000-000000000002'::uuid, 7) limit 1$$,
    array[410.00::decimal],
    'user-beta gets correct total cost for own tenant'
);

-- Test 6: Second user CANNOT access first tenant's data
select throws_like(
    $$select * from public.get_tenant_cost_summary('30000000-0000-0000-0000-000000000001'::uuid, 7)$$,
    '42501',
    'Access denied: Cannot access other tenant data',
    'user-beta cannot access tenant-alpha cost summary'
);

-- Test 7: Platform admin can access any tenant cost summary
select set_config('request.jwt.claims', '{"sub":"c0000000-0000-0000-0000-000000000003","app_metadata":{"tenant_id":"30000000-0000-0000-0000-000000000001"}}', true);

select lives_ok(
    $$select * from public.get_tenant_cost_summary('30000000-0000-0000-0000-000000000001'::uuid, 7)$$,
    'platform admin can access tenant-alpha cost summary'
);

-- Test 8: Platform admin can access any tenant cost summary (second tenant)
select lives_ok(
    $$select * from public.get_tenant_cost_summary('30000000-0000-0000-0000-000000000002'::uuid, 7)$$,
    'platform admin can access tenant-beta cost summary'
);

-- Test 9: Platform admin gets correct data for first tenant
select results_eq(
    $$select total_cost::decimal from public.get_tenant_cost_summary('30000000-0000-0000-0000-000000000001'::uuid, 7) limit 1$$,
    array[210.00::decimal],
    'platform admin gets correct data for tenant-alpha'
);

-- Test 10: Platform admin gets correct data for second tenant
select results_eq(
    $$select total_cost::decimal from public.get_tenant_cost_summary('30000000-0000-0000-0000-000000000002'::uuid, 7) limit 1$$,
    array[410.00::decimal],
    'platform admin gets correct data for tenant-beta'
);

-- Test 11: Function rejects calls without proper JWT context
select set_config('request.jwt.claims', '', true);
select throws_like(
    $$select * from public.get_tenant_cost_summary('30000000-0000-0000-0000-000000000001'::uuid, 7)$$,
    '42501',
    'Unauthorized: Valid tenant context required',
    'function rejects calls without JWT context'
);

-- Test 12: Function rejects calls with malformed JWT claims
select set_config('request.jwt.claims', '{"invalid": "json"}', true);
select throws_like(
    $$select * from public.get_tenant_cost_summary('30000000-0000-0000-0000-000000000001'::uuid, 7)$$,
    '42501',
    'Unauthorized: Valid tenant context required',
    'function rejects calls with malformed JWT'
);

select * from finish();
rollback;
