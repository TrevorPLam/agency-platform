-- T-14.04: DORA Metrics Tenant Isolation Tests
-- Tests to ensure DORA metrics tables are properly tenant-scoped and prevent cross-tenant data access

begin;
create extension if not exists pgtap with schema extensions;
set search_path to public, extensions;

select plan(40);

-- Setup test tenants and users
insert into public.tenants (id, slug, domain, name, industry)
values
  ('10000000-0000-0000-0000-000000000001'::uuid, 'dora-tenant-a', 'dora-a.local', 'DORA Tenant A', 'technology'),
  ('20000000-0000-0000-0000-000000000002'::uuid, 'dora-tenant-b', 'dora-b.local', 'DORA Tenant B', 'technology')
on conflict (slug) do nothing;

insert into auth.users (id, email)
values
  ('a0000000-0000-0000-0000-000000000001'::uuid, 'dora-user-a@tenant-a.test'),
  ('b0000000-0000-0000-0000-000000000002'::uuid, 'dora-user-b@tenant-b.test')
on conflict (id) do nothing;

insert into public.tenant_users (user_id, tenant_id, role)
values
  ('a0000000-0000-0000-0000-000000000001'::uuid, '10000000-0000-0000-0000-000000000001'::uuid, 'member'),
  ('b0000000-0000-0000-0000-000000000002'::uuid, '20000000-0000-0000-0000-000000000002'::uuid, 'member')
on conflict (user_id, tenant_id) do nothing;

set local role authenticated;

-- Test 1: Deployments table tenant isolation

-- As tenant A: can insert own deployment
select set_config('request.jwt.claims', '{"sub":"a0000000-0000-0000-0000-000000000001","app_metadata":{"tenant_id":"10000000-0000-0000-0000-000000000001"}}', true);
select lives_ok(
  $$insert into public.deployments (id, tenant_id, timestamp, commit_sha, environment, service, status, metadata) 
    values ('deploy-a-001', '10000000-0000-0000-0000-000000000001'::uuid, now(), 'sha123', 'production', 'webapp', 'success', '{}')$$,
  'tenant A can INSERT own deployment'
);

-- As tenant A: cannot see tenant B's deployments
select is_empty(
  $$select 1 from public.deployments where tenant_id = '20000000-0000-0000-0000-000000000002'::uuid$$,
  'tenant A cannot SELECT cross-tenant deployments'
);

-- As tenant A: UPDATE on B's deployments affects 0 rows
select is_empty(
  $$with u as (update public.deployments set status = 'failure' where tenant_id = '20000000-0000-0000-0000-000000000002'::uuid returning 1) select * from u$$,
  'tenant A cannot UPDATE cross-tenant deployments'
);

-- As tenant A: DELETE on B's deployments affects 0 rows
select is_empty(
  $$with d as (delete from public.deployments where tenant_id = '20000000-0000-0000-0000-000000000002'::uuid returning 1) select * from d$$,
  'tenant A cannot DELETE cross-tenant deployments'
);

-- As tenant A: INSERT deployment with B's tenant_id raises 42501
select throws_ok(
  $$insert into public.deployments (id, tenant_id, timestamp, commit_sha, environment, service, status, metadata) 
    values ('deploy-b-cross', '20000000-0000-0000-0000-000000000002'::uuid, now(), 'sha456', 'staging', 'api', 'success', '{}')$$,
  '42501'
);

-- Test 2: Incidents table tenant isolation

-- As tenant A: can insert own incident
select lives_ok(
  $$insert into public.incidents (id, tenant_id, detected_at, severity, description, service, metadata) 
    values ('incident-a-001', '10000000-0000-0000-0000-000000000001'::uuid, now(), 'high', 'Test incident A', 'webapp', '{}')$$,
  'tenant A can INSERT own incident'
);

-- As tenant A: cannot see tenant B's incidents
select is_empty(
  $$select 1 from public.incidents where tenant_id = '20000000-0000-0000-0000-000000000002'::uuid$$,
  'tenant A cannot SELECT cross-tenant incidents'
);

-- As tenant A: UPDATE on B's incidents affects 0 rows
select is_empty(
  $$with u as (update public.incidents set severity = 'critical' where tenant_id = '20000000-0000-0000-0000-000000000002'::uuid returning 1) select * from u$$,
  'tenant A cannot UPDATE cross-tenant incidents'
);

-- As tenant A: DELETE on B's incidents affects 0 rows
select is_empty(
  $$with d as (delete from public.incidents where tenant_id = '20000000-0000-0000-0000-000000000002'::uuid returning 1) select * from d$$,
  'tenant A cannot DELETE cross-tenant incidents'
);

-- As tenant A: INSERT incident with B's tenant_id raises 42501
select throws_ok(
  $$insert into public.incidents (id, tenant_id, detected_at, severity, description, service, metadata) 
    values ('incident-b-cross', '20000000-0000-0000-0000-000000000002'::uuid, now(), 'medium', 'Cross tenant incident', 'api', '{}')$$,
  '42501'
);

-- Test 3: Pull requests table tenant isolation

-- As tenant A: can insert own pull request
select lives_ok(
  $$insert into public.pull_requests (id, tenant_id, number, first_commit_at, created_at, base_branch, head_branch, metadata) 
    values ('pr-a-001', '10000000-0000-0000-0000-000000000001'::uuid, 123, now(), now(), 'main', 'feature-a', '{}')$$,
  'tenant A can INSERT own pull request'
);

-- As tenant A: cannot see tenant B's pull requests
select is_empty(
  $$select 1 from public.pull_requests where tenant_id = '20000000-0000-0000-0000-000000000002'::uuid$$,
  'tenant A cannot SELECT cross-tenant pull requests'
);

-- As tenant A: UPDATE on B's pull requests affects 0 rows
select is_empty(
  $$with u as (update public.pull_requests set base_branch = 'develop' where tenant_id = '20000000-0000-0000-0000-000000000002'::uuid returning 1) select * from u$$,
  'tenant A cannot UPDATE cross-tenant pull requests'
);

-- As tenant A: DELETE on B's pull requests affects 0 rows
select is_empty(
  $$with d as (delete from public.pull_requests where tenant_id = '20000000-0000-0000-0000-000000000002'::uuid returning 1) select * from d$$,
  'tenant A cannot DELETE cross-tenant pull requests'
);

-- As tenant A: INSERT pull request with B's tenant_id raises 42501
select throws_ok(
  $$insert into public.pull_requests (id, tenant_id, number, first_commit_at, created_at, base_branch, head_branch, metadata) 
    values ('pr-b-cross', '20000000-0000-0000-0000-000000000002'::uuid, 456, now(), now(), 'main', 'feature-b', '{}')$$,
  '42501'
);

-- Test 4: DORA metrics results table tenant isolation

-- As tenant A: can insert own metrics results
select lives_ok(
  $$insert into public.dora_metrics_results (tenant_id, calculated_at, period_start, period_end, deployment_frequency, lead_time_for_changes, change_failure_rate, mean_time_to_recovery, deployment_performance_level, lead_time_performance_level, failure_rate_performance_level, mttr_performance_level, data_points_deployments, data_points_incidents, data_points_pull_requests) 
    values ('10000000-0000-0000-0000-000000000001'::uuid, now(), now() - interval '30 days', now(), 5.2, 2.1, 0.15, 45.5, 'Elite', 'Elite', 'Elite', 'Elite', 25, 3, 20)$$,
  'tenant A can INSERT own metrics results'
);

-- As tenant A: cannot see tenant B's metrics results
select is_empty(
  $$select 1 from public.dora_metrics_results where tenant_id = '20000000-0000-0000-0000-000000000002'::uuid$$,
  'tenant A cannot SELECT cross-tenant metrics results'
);

-- As tenant A: UPDATE on B's metrics results affects 0 rows
select is_empty(
  $$with u as (update public.dora_metrics_results set deployment_frequency = 10.0 where tenant_id = '20000000-0000-0000-0000-000000000002'::uuid returning 1) select * from u$$,
  'tenant A cannot UPDATE cross-tenant metrics results'
);

-- As tenant A: DELETE on B's metrics results affects 0 rows
select is_empty(
  $$with d as (delete from public.dora_metrics_results where tenant_id = '20000000-0000-0000-0000-000000000002'::uuid returning 1) select * from d$$,
  'tenant A cannot DELETE cross-tenant metrics results'
);

-- As tenant A: INSERT metrics results with B's tenant_id raises 42501
select throws_ok(
  $$insert into public.dora_metrics_results (tenant_id, calculated_at, period_start, period_end, deployment_frequency, lead_time_for_changes, change_failure_rate, mean_time_to_recovery, deployment_performance_level, lead_time_performance_level, failure_rate_performance_level, mttr_performance_level, data_points_deployments, data_points_incidents, data_points_pull_requests) 
    values ('20000000-0000-0000-0000-000000000002'::uuid, now(), now() - interval '30 days', now(), 3.1, 4.2, 0.25, 120.0, 'Medium', 'Medium', 'Low', 'Medium', 15, 8, 12)$$,
  '42501'
);

-- Test 5: DORA metric snapshots table tenant isolation

-- As tenant A: can insert own metric snapshot
select lives_ok(
  $$insert into public.dora_metric_snapshots (tenant_id, timestamp, value, metric_type, metadata) 
    values ('10000000-0000-0000-0000-000000000001'::uuid, now(), 5.2, 'deployment-frequency', '{"environment": "production"}')$$,
  'tenant A can INSERT own metric snapshot'
);

-- As tenant A: cannot see tenant B's metric snapshots
select is_empty(
  $$select 1 from public.dora_metric_snapshots where tenant_id = '20000000-0000-0000-0000-000000000002'::uuid$$,
  'tenant A cannot SELECT cross-tenant metric snapshots'
);

-- As tenant A: UPDATE on B's metric snapshots affects 0 rows
select is_empty(
  $$with u as (update public.dora_metric_snapshots set value = 10.0 where tenant_id = '20000000-0000-0000-0000-000000000002'::uuid returning 1) select * from u$$,
  'tenant A cannot UPDATE cross-tenant metric snapshots'
);

-- As tenant A: DELETE on B's metric snapshots affects 0 rows
select is_empty(
  $$with d as (delete from public.dora_metric_snapshots where tenant_id = '20000000-0000-0000-0000-000000000002'::uuid returning 1) select * from d$$,
  'tenant A cannot DELETE cross-tenant metric snapshots'
);

-- As tenant A: INSERT metric snapshot with B's tenant_id raises 42501
select throws_ok(
  $$insert into public.dora_metric_snapshots (tenant_id, timestamp, value, metric_type, metadata) 
    values ('20000000-0000-0000-0000-000000000002'::uuid, now(), 3.1, 'lead-time-for-changes', '{"environment": "staging"}')$$,
  '42501'
);

-- Test 6: Cross-tenant verification from tenant B perspective

-- Switch to tenant B context
select set_config('request.jwt.claims', '{"sub":"b0000000-0000-0000-0000-000000000002","app_metadata":{"tenant_id":"20000000-0000-0000-0000-000000000002"}}', true);

-- Insert tenant B data
select lives_ok(
  $$insert into public.deployments (id, tenant_id, timestamp, commit_sha, environment, service, status, metadata) 
    values ('deploy-b-001', '20000000-0000-0000-0000-000000000002'::uuid, now(), 'sha789', 'production', 'webapp', 'success', '{}')$$,
  'tenant B can INSERT own deployment'
);

-- Verify tenant B cannot see tenant A's data
select is_empty(
  $$select 1 from public.deployments where tenant_id = '10000000-0000-0000-0000-000000000001'::uuid$$,
  'tenant B cannot SELECT tenant A deployments'
);

select is_empty(
  $$select 1 from public.incidents where tenant_id = '10000000-0000-0000-0000-000000000001'::uuid$$,
  'tenant B cannot SELECT tenant A incidents'
);

select is_empty(
  $$select 1 from public.pull_requests where tenant_id = '10000000-0000-0000-0000-000000000001'::uuid$$,
  'tenant B cannot SELECT tenant A pull requests'
);

select is_empty(
  $$select 1 from public.dora_metrics_results where tenant_id = '10000000-0000-0000-0000-000000000001'::uuid$$,
  'tenant B cannot SELECT tenant A metrics results'
);

select is_empty(
  $$select 1 from public.dora_metric_snapshots where tenant_id = '10000000-0000-0000-0000-000000000001'::uuid$$,
  'tenant B cannot SELECT tenant A metric snapshots'
);

-- Test 7: Verify tenant can see their own data (positive test)
select results_eq(
  'select count(*)::int from public.deployments where tenant_id = ''20000000-0000-0000-0000-000000000002''::uuid',
  array[1],
  'tenant B can SELECT own deployments'
);

select results_eq(
  'select count(*)::int from public.incidents where tenant_id = ''20000000-0000-0000-0000-000000000002''::uuid',
  array[0],
  'tenant B can SELECT own incidents (0 expected)'
);

select results_eq(
  'select count(*)::int from public.pull_requests where tenant_id = ''20000000-0000-0000-0000-000000000002''::uuid',
  array[0],
  'tenant B can SELECT own pull requests (0 expected)'
);

select results_eq(
  'select count(*)::int from public.dora_metrics_results where tenant_id = ''20000000-0000-0000-0000-000000000002''::uuid',
  array[0],
  'tenant B can SELECT own metrics results (0 expected)'
);

select results_eq(
  'select count(*)::int from public.dora_metric_snapshots where tenant_id = ''20000000-0000-0000-0000-000000000002''::uuid',
  array[0],
  'tenant B can SELECT own metric snapshots (0 expected)'
);

select * from finish();
rollback;
