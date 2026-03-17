-- DORA Metrics Tenant Isolation Correction
-- Migration to fix cross-tenant data leakage in DORA metrics tables

-- This migration addresses the security vulnerability identified in TASK-10D
-- where DORA tables lack tenant isolation and allow cross-tenant data access

begin;

-- Add tenant_id columns to all DORA tables
-- These are UUID to align with the canonical tenant model

-- Add tenant_id to deployments table
alter table public.deployments 
add column if not exists tenant_id uuid not null default '00000000-0000-0000-0000-000000000000'::uuid;

-- Add tenant_id to incidents table  
alter table public.incidents
add column if not exists tenant_id uuid not null default '00000000-0000-0000-0000-000000000000'::uuid;

-- Add tenant_id to pull_requests table
alter table public.pull_requests
add column if not exists tenant_id uuid not null default '00000000-0000-0000-0000-000000000000'::uuid;

-- Add tenant_id to dora_metrics_results table
alter table public.dora_metrics_results
add column if not exists tenant_id uuid not null default '00000000-0000-0000-0000-000000000000'::uuid;

-- Add tenant_id to dora_metric_snapshots table
alter table public.dora_metric_snapshots
add column if not exists tenant_id uuid not null default '00000000-0000-0000-0000-000000000000'::uuid;

-- Add tenant-scoped indexes for performance (following agency platform patterns)
create index if not exists idx_deployments_tenant_id on public.deployments(tenant_id);
create index if not exists idx_deployments_tenant_timestamp on public.deployments(tenant_id, timestamp);
create index if not exists idx_deployments_tenant_environment on public.deployments(tenant_id, environment);

create index if not exists idx_incidents_tenant_id on public.incidents(tenant_id);
create index if not exists idx_incidents_tenant_detected_at on public.incidents(tenant_id, detected_at);
create index if not exists idx_incidents_tenant_severity on public.incidents(tenant_id, severity);

create index if not exists idx_pull_requests_tenant_id on public.pull_requests(tenant_id);
create index if not exists idx_pull_requests_tenant_created_at on public.pull_requests(tenant_id, created_at);
create index if not exists idx_pull_requests_tenant_base_branch on public.pull_requests(tenant_id, base_branch);

create index if not exists idx_dora_metrics_results_tenant_id on public.dora_metrics_results(tenant_id);
create index if not exists idx_dora_metrics_results_tenant_period on public.dora_metrics_results(tenant_id, period_start, period_end);

create index if not exists idx_dora_metric_snapshots_tenant_id on public.dora_metric_snapshots(tenant_id);
create index if not exists idx_dora_snapshots_tenant_timestamp on public.dora_metric_snapshots(tenant_id, timestamp, metric_type);

-- Drop existing insecure RLS policies
drop policy if exists "Users can view deployments" on public.deployments;
drop policy if exists "Service role can manage deployments" on public.deployments;

drop policy if exists "Users can view incidents" on public.incidents;
drop policy if exists "Service role can manage incidents" on public.incidents;

drop policy if exists "Users can view pull requests" on public.pull_requests;
drop policy if exists "Service role can manage pull requests" on public.pull_requests;

drop policy if exists "Users can view metrics results" on public.dora_metrics_results;
drop policy if exists "Service role can manage metrics results" on public.dora_metrics_results;

drop policy if exists "Users can view metric snapshots" on public.dora_metric_snapshots;
drop policy if exists "Service role can manage metric snapshots" on public.dora_metric_snapshots;

-- Create tenant-scoped RLS policies using public.tenant_id() helper
-- This follows the agency platform pattern for tenant isolation

-- Deployments table policies
create policy "Tenants select own deployments" on public.deployments
  for select using (tenant_id = public.tenant_id());

create policy "Tenants insert own deployments" on public.deployments
  for insert with check (tenant_id = public.tenant_id());

create policy "Tenants update own deployments" on public.deployments
  for update using (tenant_id = public.tenant_id())
  with check (tenant_id = public.tenant_id());

create policy "Tenants delete own deployments" on public.deployments
  for delete using (tenant_id = public.tenant_id());

create policy "Service role full access deployments" on public.deployments
  for all using (auth.role() = 'service_role');

-- Incidents table policies
create policy "Tenants select own incidents" on public.incidents
  for select using (tenant_id = public.tenant_id());

create policy "Tenants insert own incidents" on public.incidents
  for insert with check (tenant_id = public.tenant_id());

create policy "Tenants update own incidents" on public.incidents
  for update using (tenant_id = public.tenant_id())
  with check (tenant_id = public.tenant_id());

create policy "Tenants delete own incidents" on public.incidents
  for delete using (tenant_id = public.tenant_id());

create policy "Service role full access incidents" on public.incidents
  for all using (auth.role() = 'service_role');

-- Pull requests table policies
create policy "Tenants select own pull requests" on public.pull_requests
  for select using (tenant_id = public.tenant_id());

create policy "Tenants insert own pull requests" on public.pull_requests
  for insert with check (tenant_id = public.tenant_id());

create policy "Tenants update own pull requests" on public.pull_requests
  for update using (tenant_id = public.tenant_id())
  with check (tenant_id = public.tenant_id());

create policy "Tenants delete own pull requests" on public.pull_requests
  for delete using (tenant_id = public.tenant_id());

create policy "Service role full access pull requests" on public.pull_requests
  for all using (auth.role() = 'service_role');

-- DORA metrics results table policies
create policy "Tenants select own metrics results" on public.dora_metrics_results
  for select using (tenant_id = public.tenant_id());

create policy "Tenants insert own metrics results" on public.dora_metrics_results
  for insert with check (tenant_id = public.tenant_id());

create policy "Tenants update own metrics results" on public.dora_metrics_results
  for update using (tenant_id = public.tenant_id())
  with check (tenant_id = public.tenant_id());

create policy "Tenants delete own metrics results" on public.dora_metrics_results
  for delete using (tenant_id = public.tenant_id());

create policy "Service role full access metrics results" on public.dora_metrics_results
  for all using (auth.role() = 'service_role');

-- DORA metric snapshots table policies
create policy "Tenants select own metric snapshots" on public.dora_metric_snapshots
  for select using (tenant_id = public.tenant_id());

create policy "Tenants insert own metric snapshots" on public.dora_metric_snapshots
  for insert with check (tenant_id = public.tenant_id());

create policy "Tenants update own metric snapshots" on public.dora_metric_snapshots
  for update using (tenant_id = public.tenant_id())
  with check (tenant_id = public.tenant_id());

create policy "Tenants delete own metric snapshots" on public.dora_metric_snapshots
  for delete using (tenant_id = public.tenant_id());

create policy "Service role full access metric snapshots" on public.dora_metric_snapshots
  for all using (auth.role() = 'service_role');

-- Add foreign key constraints to ensure data integrity
-- These reference the canonical tenants table

alter table public.deployments 
add constraint fk_deployments_tenant 
  foreign key (tenant_id) references public.tenants(id) on delete restrict;

alter table public.incidents
add constraint fk_incidents_tenant
  foreign key (tenant_id) references public.tenants(id) on delete restrict;

alter table public.pull_requests
add constraint fk_pull_requests_tenant
  foreign key (tenant_id) references public.tenants(id) on delete restrict;

alter table public.dora_metrics_results
add constraint fk_dora_metrics_results_tenant
  foreign key (tenant_id) references public.tenants(id) on delete restrict;

alter table public.dora_metric_snapshots
add constraint fk_dora_metric_snapshots_tenant
  foreign key (tenant_id) references public.tenants(id) on delete restrict;

-- Add comments for documentation
comment on column public.deployments.tenant_id is 'Tenant identifier for multi-tenant isolation. References tenants(id).';
comment on column public.incidents.tenant_id is 'Tenant identifier for multi-tenant isolation. References tenants(id).';
comment on column public.pull_requests.tenant_id is 'Tenant identifier for multi-tenant isolation. References tenants(id).';
comment on column public.dora_metrics_results.tenant_id is 'Tenant identifier for multi-tenant isolation. References tenants(id).';
comment on column public.dora_metric_snapshots.tenant_id is 'Tenant identifier for multi-tenant isolation. References tenants(id).';

-- Update table comments to reflect tenant isolation
comment on table public.deployments is 'Tracks deployment events for DORA metrics calculation. Tenant-scoped via RLS.';
comment on table public.incidents is 'Tracks production incidents for failure rate and MTTR calculations. Tenant-scoped via RLS.';
comment on table public.pull_requests is 'Tracks pull request lifecycle for lead time calculations. Tenant-scoped via RLS.';
comment on table public.dora_metrics_results is 'Stores aggregated DORA metrics calculation results. Tenant-scoped via RLS.';
comment on table public.dora_metric_snapshots is 'Stores time series snapshots of individual DORA metrics. Tenant-scoped via RLS.';

commit;

-- Migration completed successfully
-- All DORA metrics tables now have proper tenant isolation
-- RLS policies enforce tenant-scoped access using public.tenant_id()
-- Performance indexes added for tenant-scoped queries
-- Foreign key constraints ensure data integrity
