-- DORA Metrics Database Schema
-- Migration for implementing DORA (DevOps Research and Assessment) metrics collection

-- Enable UUID extension for generating unique IDs
create extension if not exists "uuid-ossp";

-- Deployments table for tracking deployment events
create table if not exists deployments (
  id text primary key,
  timestamp timestamptz not null,
  commit_sha text not null,
  environment text not null check (environment in ('production', 'staging', 'development')),
  service text not null,
  status text not null check (status in ('success', 'failure', 'rollback')),
  metadata jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Indexes for deployments table
create index if not exists idx_deployments_timestamp on deployments(timestamp);
create index if not exists idx_deployments_environment on deployments(environment);
create index if not exists idx_deployments_service on deployments(service);
create index if not exists idx_deployments_commit_sha on deployments(commit_sha);
create index if not exists idx_deployments_status on deployments(status);

-- NOTE: RLS policies for these tables have been moved to 0063_dora_metrics_tenant_isolation.sql
-- to properly implement tenant isolation and fix cross-tenant data leakage vulnerability
-- See TASK-10D for details on this security fix

-- RLS will be enabled and proper tenant-scoped policies will be applied
-- in the 0063_dora_metrics_tenant_isolation.sql migration

-- Incidents table for tracking production incidents
create table if not exists incidents (
  id text primary key,
  detected_at timestamptz not null,
  resolved_at timestamptz,
  severity text not null check (severity in ('low', 'medium', 'high', 'critical')),
  deployment_id text references deployments(id) on delete set null,
  description text not null,
  service text not null,
  metadata jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Indexes for incidents table
create index if not exists idx_incidents_detected_at on incidents(detected_at);
create index if not exists idx_incidents_resolved_at on incidents(resolved_at);
create index if not exists idx_incidents_severity on incidents(severity);
create index if not exists idx_incidents_service on incidents(service);
create index if not exists idx_incidents_deployment_id on incidents(deployment_id);

-- NOTE: RLS policies for these tables have been moved to 0063_dora_metrics_tenant_isolation.sql
-- to properly implement tenant isolation and fix cross-tenant data leakage vulnerability
-- See TASK-10D for details on this security fix

-- RLS will be enabled and proper tenant-scoped policies will be applied
-- in the 0063_dora_metrics_tenant_isolation.sql migration

-- Pull requests table for tracking PR lifecycle
create table if not exists pull_requests (
  id text primary key,
  number integer not null,
  first_commit_at timestamptz not null,
  created_at timestamptz not null,
  merged_at timestamptz,
  base_branch text not null,
  head_branch text not null,
  deployment_id text references deployments(id) on delete set null,
  metadata jsonb default '{}',
  updated_at timestamptz default now()
);

-- Indexes for pull_requests table
create index if not exists idx_pull_requests_created_at on pull_requests(created_at);
create index if not exists idx_pull_requests_merged_at on pull_requests(merged_at);
create index if not exists idx_pull_requests_base_branch on pull_requests(base_branch);
create index if not exists idx_pull_requests_number on pull_requests(number);

-- NOTE: RLS policies for these tables have been moved to 0063_dora_metrics_tenant_isolation.sql
-- to properly implement tenant isolation and fix cross-tenant data leakage vulnerability
-- See TASK-10D for details on this security fix

-- RLS will be enabled and proper tenant-scoped policies will be applied
-- in the 0063_dora_metrics_tenant_isolation.sql migration

-- DORA metrics results table for aggregated calculations
create table if not exists dora_metrics_results (
  id uuid primary key default gen_random_uuid(),
  calculated_at timestamptz not null,
  period_start timestamptz not null,
  period_end timestamptz not null,
  deployment_frequency numeric not null,
  lead_time_for_changes numeric not null,
  change_failure_rate numeric not null,
  mean_time_to_recovery numeric not null,
  deployment_performance_level text not null check (deployment_performance_level in ('Elite', 'High', 'Medium', 'Low')),
  lead_time_performance_level text not null check (lead_time_performance_level in ('Elite', 'High', 'Medium', 'Low')),
  failure_rate_performance_level text not null check (failure_rate_performance_level in ('Elite', 'High', 'Medium', 'Low')),
  mttr_performance_level text not null check (mttr_performance_level in ('Elite', 'High', 'Medium', 'Low')),
  data_points_deployments integer not null default 0,
  data_points_incidents integer not null default 0,
  data_points_pull_requests integer not null default 0,
  created_at timestamptz default now()
);

-- Indexes for dora_metrics_results table
create index if not exists idx_dora_metrics_calculated_at on dora_metrics_results(calculated_at);
create index if not exists idx_dora_metrics_period on dora_metrics_results(period_start, period_end);
create index if not exists idx_dora_metrics_deployment_level on dora_metrics_results(deployment_performance_level);

-- NOTE: RLS policies for these tables have been moved to 0063_dora_metrics_tenant_isolation.sql
-- to properly implement tenant isolation and fix cross-tenant data leakage vulnerability
-- See TASK-10D for details on this security fix

-- RLS will be enabled and proper tenant-scoped policies will be applied
-- in the 0063_dora_metrics_tenant_isolation.sql migration

-- DORA metric snapshots table for time series data
create table if not exists dora_metric_snapshots (
  id uuid primary key default gen_random_uuid(),
  timestamp timestamptz not null,
  value numeric not null,
  metadata jsonb not null default '{}',
  metric_type text not null check (metric_type in ('deployment-frequency', 'lead-time-for-changes', 'change-failure-rate', 'mean-time-to-recovery')),
  created_at timestamptz default now()
);

-- Indexes for dora_metric_snapshots table
create index if not exists idx_dora_snapshots_timestamp on dora_metric_snapshots(timestamp);
create index if not exists idx_dora_snapshots_metric_type on dora_metric_snapshots(metric_type);
create index if not exists idx_dora_snapshots_timestamp_type on dora_metric_snapshots(timestamp, metric_type);

-- NOTE: RLS policies for these tables have been moved to 0063_dora_metrics_tenant_isolation.sql
-- to properly implement tenant isolation and fix cross-tenant data leakage vulnerability
-- See TASK-10D for details on this security fix

-- RLS will be enabled and proper tenant-scoped policies will be applied
-- in the 0063_dora_metrics_tenant_isolation.sql migration

-- Updated at triggers for all tables
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Apply triggers to tables with updated_at columns
create trigger update_deployments_updated_at before update on deployments
  for each row execute function update_updated_at_column();

create trigger update_incidents_updated_at before update on incidents
  for each row execute function update_updated_at_column();

create trigger update_pull_requests_updated_at before update on pull_requests
  for each row execute function update_updated_at_column();

-- Comments for documentation
comment on table deployments is 'Tracks deployment events for DORA metrics calculation';
comment on table incidents is 'Tracks production incidents for failure rate and MTTR calculations';
comment on table pull_requests is 'Tracks pull request lifecycle for lead time calculations';
comment on table dora_metrics_results is 'Stores aggregated DORA metrics calculation results';
comment on table dora_metric_snapshots is 'Stores time series snapshots of individual DORA metrics';

-- Grant permissions to authenticated users and service role
grant usage on schema public to authenticated, service_role;
grant select on all tables in schema public to authenticated;
grant all on all tables in schema public to service_role;
grant usage on all sequences in schema public to service_role;
