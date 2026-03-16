# Cost Management System

## Overview

The Cost Management System provides comprehensive monitoring and optimization of costs across storage, CI/CD, and bandwidth usage. It implements tenant-isolated cost tracking with automated alerts and AI-driven optimization recommendations.

## Architecture

### Components

- **@agency/monitoring** - Core monitoring package
- **Database Schema** - Cost metrics, alerts, and recommendations tables
- **GitHub Actions** - Automated cost collection workflows
- **Dashboard** - React-based cost management interface
- **API Routes** - RESTful endpoints for cost data

### Data Flow

1. **Collection**: Automated workflows collect cost data from various sources
2. **Storage**: Metrics stored in Supabase with RLS tenant isolation
3. **Analysis**: AI/ML engine generates optimization recommendations
4. **Alerting**: Budget alerts trigger notifications via multiple channels
5. **Visualization**: Dashboard provides real-time cost insights

## Database Schema

### Cost Metrics Table

```sql
CREATE TABLE public.cost_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    storage_usage BIGINT DEFAULT 0,
    cicd_runtime INTEGER DEFAULT 0,
    bandwidth_usage BIGINT DEFAULT 0,
    total_cost DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    period VARCHAR(10) NOT NULL CHECK (period IN ('hourly', 'daily', 'weekly', 'monthly')),
    metadata JSONB DEFAULT '{}'::jsonb
);
```

### Budget Alerts Table

```sql
CREATE TABLE public.budget_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(20) NOT NULL CHECK (category IN ('storage', 'compute', 'bandwidth', 'total')),
    threshold DECIMAL(10,2) NOT NULL,
    threshold_type VARCHAR(20) NOT NULL DEFAULT 'absolute',
    severity VARCHAR(10) NOT NULL DEFAULT 'medium',
    active BOOLEAN NOT NULL DEFAULT true,
    notification_channels JSONB DEFAULT '[]'::jsonb,
    last_triggered TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
```

### Optimization Recommendations Table

```sql
CREATE TABLE public.optimization_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    category VARCHAR(20) NOT NULL CHECK (category IN ('storage', 'compute', 'bandwidth', 'general')),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    estimated_savings DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    difficulty VARCHAR(10) NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
    priority VARCHAR(10) NOT NULL CHECK (priority IN ('low', 'medium', 'high')),
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    review_by TIMESTAMP WITH TIME ZONE
);
```

## Security Model

### Row-Level Security (RLS)

All cost management tables implement RLS policies to ensure tenant isolation:

```sql
-- Example RLS policy for cost metrics
CREATE POLICY "Users can view own tenant cost metrics" ON public.cost_metrics
    FOR SELECT USING (tenant_id = public.tenant_id());
```

### Data Privacy

- No sensitive billing information stored in repository
- Rate limiting on external API calls
- Configurable data retention policies
- Anonymization options for sensitive data

## API Endpoints

### Cost Summary

**GET** `/api/costs/summary?tenant_id={tenantId}`

Returns cost summary for the last 7 days including trends.

```json
{
  "totalCost": 125.50,
  "storageCost": 45.20,
  "cicdCost": 65.30,
  "bandwidthCost": 15.00,
  "averageDailyCost": 17.93,
  "trendDirection": "up",
  "trendPercentage": 12.5
}
```

### Cost Metrics

**GET** `/api/costs/metrics?tenant_id={tenantId}&period={period}&days={days}`

Returns historical cost metrics.

**POST** `/api/costs/metrics`

Creates new cost metric entry.

```json
{
  "tenantId": "uuid",
  "storageUsage": 1073741824,
  "cicdRuntime": 120,
  "bandwidthUsage": 536870912,
  "totalCost": 15.75,
  "currency": "USD",
  "period": "daily",
  "metadata": {}
}
```

### Budget Alerts

**GET** `/api/costs/alerts?tenant_id={tenantId}&active={boolean}`

Returns budget alerts for the tenant.

**POST** `/api/costs/alerts`

Creates new budget alert.

```json
{
  "tenantId": "uuid",
  "name": "Storage Budget Alert",
  "category": "storage",
  "threshold": 100,
  "thresholdType": "absolute",
  "severity": "medium",
  "active": true,
  "notificationChannels": [
    {
      "type": "email",
      "destination": "admin@example.com",
      "enabled": true
    }
  ]
}
```

### Optimization Recommendations

**GET** `/api/costs/recommendations?tenant_id={tenantId}&status={status}`

Returns optimization recommendations.

**POST** `/api/costs/recommendations`

Creates new optimization recommendation.

**PATCH** `/api/costs/recommendations`

Updates recommendation status.

```json
{
  "tenantId": "uuid",
  "category": "storage",
  "title": "Optimize Large Files",
  "description": "Found 25 files larger than 5MB. Consider compression.",
  "estimatedSavings": 12.50,
  "difficulty": "medium",
  "priority": "high",
  "status": "pending"
}
```

## Monitoring Components

### Storage Monitor

Monitors Supabase storage usage across buckets:

```typescript
import { StorageMonitor } from '@agency/monitoring'

const monitor = new StorageMonitor({
  collectionInterval: 1, // hours
  largeFileThreshold: 5 * 1024 * 1024, // 5MB
  enableDetailedTracking: true,
})

const usage = await monitor.collectStorageUsage()
const recommendations = await monitor.generateOptimizationRecommendations()
```

### CI/CD Cost Monitor

Tracks GitHub Actions usage and costs:

```typescript
import { CicdCostMonitor } from '@agency/monitoring'

const monitor = new CicdCostMonitor({
  organization: 'my-org',
  githubToken: process.env.GITHUB_TOKEN,
  pricing: {
    ubuntuPerMinute: 0.008,
    windowsPerMinute: 0.016,
    macosPerMinute: 0.08,
    freeMinutesPerMonth: 2000,
  },
})

const usage = await monitor.collectCicdUsage()
const recommendations = await monitor.generateOptimizationRecommendations(usage)
```

### Cost Alert Engine

Manages budget alerts and notifications:

```typescript
import { CostAlertEngine } from '@agency/monitoring'

const engine = new CostAlertEngine({
  checkInterval: 1, // hours
  notificationRateLimit: 10, // per hour
  alertCooldown: 4, // hours
})

const triggeredAlerts = await engine.checkAlerts(metrics)
await engine.createAlert({
  tenantId: 'uuid',
  name: 'Monthly Budget Alert',
  category: 'total',
  threshold: 500,
  thresholdType: 'absolute',
  severity: 'high',
  active: true,
  notificationChannels: [
    { type: 'email', destination: 'admin@example.com', enabled: true }
  ],
})
```

### Optimization Engine

Generates AI/ML-driven recommendations:

```typescript
import { CostOptimizationEngine } from '@agency/monitoring'

const engine = new CostOptimizationEngine({
  analysisPeriod: 30, // days
  minimumSavingsThreshold: 5, // dollars
  confidenceThreshold: 0.7, // 70%
  enableAutomatedOptimizations: false,
})

const recommendations = await engine.generateRecommendations({
  costMetrics: metrics,
  storageUsage: storageData,
  cicdUsage: cicdData,
  tenantId: 'uuid',
})
```

## Automated Workflows

### Cost Collection Workflow

Runs hourly to collect and process cost data:

```yaml
name: Cost Monitoring
on:
  schedule:
    - cron: '0 * * * *'  # Every hour
  workflow_dispatch:
    inputs:
      tenant_id:
        description: 'Specific tenant ID to monitor'
        required: false

jobs:
  collect-metrics:
    runs-on: ubuntu-latest
    steps:
      - name: Collect Storage Metrics
      - name: Collect CI/CD Metrics
      - name: Generate Recommendations
      - name: Check Budget Alerts
      - name: Generate Cost Report
```

### Data Cleanup Workflow

Runs daily to clean up old data:

```yaml
- name: Cleanup Old Metrics (90 days)
  run: |
    # Delete old cost metrics
    DELETE FROM cost_metrics WHERE timestamp < NOW() - INTERVAL '90 days'
    
    # Delete old recommendations
    DELETE FROM optimization_recommendations 
    WHERE status IN ('completed', 'dismissed') 
    AND created_at < NOW() - INTERVAL '30 days'
```

## Configuration

### Environment Variables

```bash
# GitHub API access
GITHUB_TOKEN=ghp_xxxxxxxxxxxx
GITHUB_ORGANIZATION=my-org

# Supabase configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Notification channels
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
TEAMS_WEBHOOK_URL=https://outlook.office.com/webhook/...
ADMIN_EMAIL=admin@example.com
```

### Monitoring Configuration

```typescript
const config: MonitoringConfig = {
  dataRetentionDays: 90,
  defaultCurrency: 'USD',
  collectionIntervalHours: 1,
  alertCheckIntervalHours: 1,
  autoOptimizationEnabled: false,
  apiRateLimitPerHour: 100,
  privacySettings: {
    storeDetailedBilling: false,
    anonymizeData: true,
  },
}
```

## Dashboard Features

### Overview Tab

- Cost summary cards with trends
- Recent alerts display
- Top recommendations
- Cost breakdown visualization

### Alerts Tab

- Active budget alerts
- Alert history and trends
- Severity-based filtering
- Alert configuration

### Recommendations Tab

- AI-driven optimization suggestions
- Priority-based sorting
- Implementation difficulty indicators
- Estimated savings calculations

### Detailed Metrics Tab

- Historical cost data
- Trend analysis
- Category breakdowns
- Export capabilities

## Best Practices

### Cost Monitoring

1. **Set appropriate alert thresholds** based on historical usage
2. **Review recommendations regularly** for maximum savings
3. **Monitor trends** to identify cost anomalies early
4. **Optimize storage** by removing unused files
5. **Use efficient CI/CD runners** (Ubuntu when possible)

### Security

1. **Never expose service role keys** in client-side code
2. **Use tenant isolation** for all cost data
3. **Implement rate limiting** on external API calls
4. **Regular cleanup** of old cost data
5. **Audit access** to cost management features

### Performance

1. **Use database indexes** for cost metric queries
2. **Implement caching** for dashboard data
3. **Optimize API responses** with pagination
4. **Background processing** for heavy calculations
5. **Monitor database performance** regularly

## Troubleshooting

### Common Issues

**Cost data not appearing**
- Check GitHub Actions workflow runs
- Verify API credentials and permissions
- Ensure tenant isolation is working correctly

**Alerts not triggering**
- Verify alert configuration
- Check notification channel settings
- Review alert cooldown periods

**High API costs**
- Implement rate limiting
- Optimize data collection frequency
- Use caching for repeated requests

**Dashboard performance issues**
- Check database query performance
- Implement data pagination
- Optimize React component rendering

### Debug Commands

```bash
# Check workflow runs
gh run list --repo agency-platform/cost-monitoring

# Verify database connections
supabase db shell --command "SELECT COUNT(*) FROM cost_metrics"

# Test API endpoints
curl "http://localhost:3000/api/costs/summary?tenant_id=your-tenant-id"

# Check RLS policies
supabase db shell --command "SELECT * FROM pg_policies WHERE tablename = 'cost_metrics'"
```

## Migration Guide

### From Manual Cost Tracking

1. **Export existing cost data** to CSV format
2. **Create tenant mappings** for multi-tenant setup
3. **Import historical data** using migration scripts
4. **Configure alerts** based on existing thresholds
5. **Train team** on new dashboard and workflows

### Data Import Script

```sql
-- Import historical cost data
INSERT INTO cost_metrics (
  tenant_id,
  storage_usage,
  cicd_runtime,
  bandwidth_usage,
  total_cost,
  currency,
  timestamp,
  period,
  metadata
)
SELECT 
  tenant_mapping.tenant_id,
  storage_bytes,
  cicd_minutes,
  bandwidth_bytes,
  total_cost,
  'USD',
  date,
  'daily',
  '{}'::jsonb
FROM legacy_cost_data
JOIN tenant_mapping ON legacy_cost_data.account = tenant_mapping.account;
```

## Future Enhancements

### Planned Features

- **Real-time cost monitoring** with WebSocket updates
- **Predictive cost forecasting** using ML models
- **Multi-cloud provider support** (AWS, GCP, Azure)
- **Advanced anomaly detection** with statistical analysis
- **Cost allocation tagging** for project-level tracking

### Integration Opportunities

- **Accounting systems** for financial reporting
- **Project management tools** for budget tracking
- **DevOps platforms** for enhanced CI/CD insights
- **Monitoring systems** for unified observability

## Support

For questions or issues with the Cost Management System:

1. **Check documentation** for common solutions
2. **Review GitHub Issues** for known problems
3. **Contact the platform team** for technical support
4. **Join the community** for best practices and tips

---

*Last updated: March 2026*
