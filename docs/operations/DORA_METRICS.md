# DORA Metrics Implementation

This document describes the implementation of DORA (DevOps Research and Assessment) metrics for the Agency Platform.

## Overview

DORA metrics are four key metrics that indicate the velocity and stability of software delivery:

1. **Deployment Frequency** - How often an organization successfully releases to production
2. **Lead Time for Changes** - How long it takes for a commit to get into production
3. **Change Failure Rate** - The percentage of deployments causing a failure in production
4. **Mean Time to Recovery** - How long it takes to restore service after a production failure

## Architecture

### Components

- **@agency/metrics** - Core metrics calculation package
- **GitHub Actions Workflow** - Automated data collection and calculation
- **Database Schema** - Storage for deployments, incidents, and metrics
- **Dashboard** - Visualization and monitoring interface
- **API Endpoints** - Real-time metrics access

### Data Flow

```
GitHub Events → GitHub Actions → Database → Metrics Calculator → Dashboard/API
```

## Implementation Details

### Package Structure

```
packages/metrics/
├── src/
│   ├── types.ts              # Type definitions
│   ├── collector.ts          # Main orchestrator
│   ├── storage.ts            # Database operations
│   ├── deployment-frequency.ts
│   ├── lead-time.ts
│   ├── change-failure-rate.ts
│   └── mttr.ts
├── package.json
├── tsconfig.json
└── tsup.config.ts
```

### Database Schema

#### Deployments Table
```sql
create table deployments (
  id text primary key,
  timestamp timestamptz not null,
  commit_sha text not null,
  environment text not null check (environment in ('production', 'staging', 'development')),
  service text not null,
  status text not null check (status in ('success', 'failure', 'rollback')),
  metadata jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

#### Incidents Table
```sql
create table incidents (
  id text primary key,
  detected_at timestamptz not null,
  resolved_at timestamptz,
  severity text not null check (severity in ('low', 'medium', 'high', 'critical')),
  deployment_id text references deployments(id),
  description text not null,
  service text not null,
  metadata jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

#### Pull Requests Table
```sql
create table pull_requests (
  id text primary key,
  number integer not null,
  first_commit_at timestamptz not null,
  created_at timestamptz not null,
  merged_at timestamptz,
  base_branch text not null,
  head_branch text not null,
  deployment_id text references deployments(id),
  metadata jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

#### Metrics Results Tables
```sql
create table dora_metrics_results (
  id uuid primary key default gen_random_uuid(),
  calculated_at timestamptz not null,
  period_start timestamptz not null,
  period_end timestamptz not null,
  deployment_frequency numeric not null,
  lead_time_for_changes numeric not null,
  change_failure_rate numeric not null,
  mean_time_to_recovery numeric not null,
  deployment_performance_level text not null,
  lead_time_performance_level text not null,
  failure_rate_performance_level text not null,
  mttr_performance_level text not null,
  data_points_deployments integer not null,
  data_points_incidents integer not null,
  data_points_pull_requests integer not null,
  created_at timestamptz default now()
);

create table dora_metric_snapshots (
  id uuid primary key default gen_random_uuid(),
  timestamp timestamptz not null,
  value numeric not null,
  metadata jsonb not null,
  metric_type text not null check (metric_type in ('deployment-frequency', 'lead-time-for-changes', 'change-failure-rate', 'mean-time-to-recovery')),
  created_at timestamptz default now()
);
```

## Performance Benchmarks

Based on DORA research, performance levels are defined as:

### Deployment Frequency
- **Elite**: Multiple deployments per day (≥7/week)
- **High**: Daily to weekly deployments (1-6/week)
- **Medium**: Weekly to monthly deployments (0.25-0.99/week)
- **Low**: Monthly to less frequent (<0.25/week)

### Lead Time for Changes
- **Elite**: Less than one day (<24 hours)
- **High**: One day to one week (24-168 hours)
- **Medium**: One week to one month (168-720 hours)
- **Low**: More than one month (>720 hours)

### Change Failure Rate
- **Elite**: 0-15% failure rate
- **High**: 16-30% failure rate
- **Medium**: 31-46% failure rate
- **Low**: More than 46% failure rate

### Mean Time to Recovery
- **Elite**: Less than one hour (<1 hour)
- **High**: Less than one day (<24 hours)
- **Medium**: One day to one week (24-168 hours)
- **Low**: More than one week (>168 hours)

## Usage

### Automated Collection

The system automatically collects metrics daily via GitHub Actions:

```yaml
# .github/workflows/metrics.yml
name: DORA Metrics Collection
on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM UTC
  workflow_dispatch:
    inputs:
      time_window_days:
        description: 'Time window in days'
        default: '30'
```

### Manual Calculation

```typescript
import { DORAMetricsCollector } from '@agency/metrics'

const collector = new DORAMetricsCollector({
  timeWindowDays: 30,
  environments: ['production'],
  services: [], // All services
  alertThresholds: {
    deploymentFrequency: 7,
    leadTimeForChanges: 24,
    changeFailureRate: 15,
    meanTimeToRecovery: 1
  }
})

const metrics = await collector.calculateMetrics()
```

### API Access

```typescript
// Get current metrics
const response = await fetch('/api/metrics/dora')
const metrics = await response.json()

// Get metrics with custom parameters
const response = await fetch('/api/metrics/dora?timeWindowDays=60&environments=production,staging')
```

### Dashboard Access

Navigate to `/metrics` in the agency-admin application to view the interactive dashboard.

## Configuration

### Environment Variables

Required environment variables:

```bash
# Supabase configuration
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# GitHub token for API access (in GitHub Actions)
GITHUB_TOKEN=ghp_***
```

### Metrics Configuration

Default configuration can be customized:

```typescript
interface MetricsConfig {
  timeWindowDays: number        // Analysis period (default: 30)
  environments: string[]         // Environments to include
  services: string[]            // Services to track (empty = all)
  alertThresholds: {
    deploymentFrequency: number    // deployments per week
    leadTimeForChanges: number     // hours
    changeFailureRate: number       // percentage
    meanTimeToRecovery: number     // hours
  }
}
```

## Data Sources

### Deployment Events

Collected from:
- GitHub Actions workflow runs
- Merge to main branch events
- Manual deployment triggers

### Pull Request Events

Collected from:
- GitHub API pull request data
- Commit timestamps
- Merge timestamps

### Incident Events

Collected from:
- Manual incident reporting
- Automated failure detection
- Rollback events

## Monitoring and Alerting

### Alert Thresholds

Configure alert thresholds in the metrics configuration:

```typescript
alertThresholds: {
  deploymentFrequency: 7,      // Alert if < 7 deployments/week
  leadTimeForChanges: 24,      // Alert if > 24 hours
  changeFailureRate: 15,       // Alert if > 15%
  meanTimeToRecovery: 1         // Alert if > 1 hour
}
```

### Performance Monitoring

Monitor:
- Workflow execution success/failure
- Database query performance
- API response times
- Data quality and completeness

## Troubleshooting

### Common Issues

1. **Missing Deployment Data**
   - Check GitHub token permissions
   - Verify workflow triggers
   - Review deployment event collection

2. **Incorrect Lead Time Calculations**
   - Verify commit timestamps
   - Check PR merge timestamps
   - Review deployment linking

3. **High Change Failure Rate**
   - Review deployment failure criteria
   - Check incident correlation logic
   - Verify time window settings

4. **Dashboard Not Loading**
   - Check API endpoint health
   - Verify database connectivity
   - Review browser console errors

### Debug Mode

Enable debug logging:

```typescript
const collector = new DORAMetricsCollector(config)
collector.setDebugMode(true) // Enable detailed logging
```

## Maintenance

### Data Retention

- Metrics snapshots: 365 days (configurable)
- Raw events: 90 days (configurable)
- Aggregated results: Indefinite

### Performance Optimization

- Database indexes on timestamp fields
- Parallel metric calculations
- Cached API responses
- Incremental data processing

### Regular Tasks

- Weekly: Review metric accuracy
- Monthly: Clean up old data
- Quarterly: Review and update benchmarks
- Annually: Architecture review and optimization

## Security Considerations

- Service role key restricted to server-side use
- No sensitive data in client-side responses
- Row-level security for multi-tenant data
- Audit trail for all metric calculations

## Future Enhancements

Planned improvements:

1. **Advanced Analytics**
   - Predictive analytics
   - Anomaly detection
   - Correlation analysis

2. **Integrations**
   - Slack notifications
   - PagerDuty alerts
   - Grafana dashboards

3. **Automation**
   - Automated incident correlation
   - Self-healing deployments
   - Performance recommendations

4. **Visualization**
   - Interactive charts
   - Trend analysis
   - Comparative analytics

## References

- [DORA Research](https://dora.dev/)
- [Accelerate: The Science of Lean Software and DevOps](https://itrevolution.com/books/accelerate/)
- [Google Cloud DORA Metrics](https://cloud.google.com/architecture/devops/dora-metrics)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
