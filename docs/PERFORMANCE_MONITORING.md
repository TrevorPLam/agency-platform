# Performance Monitoring Guide

This guide covers the comprehensive performance monitoring system implemented for the agency platform, including Core Web Vitals tracking, performance budgets, alerting, and dashboard analytics.

## Overview

The performance monitoring system provides:

- **Real User Monitoring (RUM)** of Core Web Vitals (LCP, INP, CLS, FCP, TTFB)
- **Performance Budgets** with build-time enforcement
- **Automated Alerting** for performance regressions
- **Dashboard Analytics** for performance insights
- **Tenant Isolation** for multi-client performance tracking

## Architecture

### Components

1. **@agency/monitoring** - Core monitoring package
2. **Web Vitals Tracking** - Client-side metric collection
3. **Performance Budgets** - Threshold management and enforcement
4. **Alert Engine** - Notification system for regressions
5. **Dashboard** - Performance analytics UI
6. **Database Schema** - Metrics storage with RLS

### Data Flow

```
Client Apps → Web Vitals Library → Monitoring Package → Database → Alert Engine → Dashboard
```

## Implementation Guide

### 1. Web Vitals Tracking

#### Basic Setup

```typescript
import { useWebVitals } from '@agency/monitoring'

function PerformanceMonitor({ tenantId }: { tenantId: string }) {
  const monitor = useWebVitals({
    tenantId,
    enableRealUserMonitoring: true,
    onAlert: (alert) => {
      console.warn('Performance alert:', alert)
    },
  })
  
  return null
}
```

#### Performance Budgets

```typescript
import { usePerformanceBudgets, usePerformanceBudgetPresets } from '@agency/monitoring'

function BudgetManager({ tenantId }: { tenantId: string }) {
  const monitor = useWebVitals({ tenantId })
  const { addBudget } = usePerformanceBudgets(monitor)
  const { getDefaultBudgets } = usePerformanceBudgetPresets()

  useEffect(() => {
    const budgets = getDefaultBudgets(tenantId)
    budgets.forEach(budget => addBudget(budget))
  }, [tenantId])

  return null
}
```

### 2. Performance Budgets

#### Budget Types

- **LCP** (Largest Contentful Paint): Loading performance
- **INP** (Interaction to Next Paint): Responsiveness
- **CLS** (Cumulative Layout Shift): Visual stability
- **FCP** (First Contentful Paint): Initial loading
- **TTFB** (Time to First Byte): Server response
- **Bundle Size**: JavaScript bundle size limits
- **Image Size**: Image optimization limits

#### Budget Presets

```typescript
import { APP_BUDGET_CONFIGS, getAppBudgets } from '@agency/monitoring'

// Get default budgets for an app
const budgets = getAppBudgets('firm')

// Available presets
const presets = {
  DEFAULT_PERFORMANCE_BUDGETS,  // Standard web performance
  MOBILE_PERFORMANCE_BUDGETS,   // Mobile-optimized
  STRICT_PERFORMANCE_BUDGETS,   // Production-critical
}
```

#### Build-Time Enforcement

```typescript
// next.config.js
import { withPerformanceBudget } from '@agency/monitoring'

const nextConfig = {}

export default withPerformanceBudget(nextConfig, {
  appName: 'firm',
  failBuild: true, // Fail build on violations
  outputDir: '.next/performance-reports',
})
```

### 3. Alerting System

#### Alert Engine Setup

```typescript
import { createPerformanceAlertEngine } from '@agency/monitoring'

const alertEngine = createPerformanceAlertEngine({
  notificationWebhook: 'https://your-webhook-url.com',
  emailSettings: {
    smtpHost: 'smtp.gmail.com',
    smtpPort: 587,
    smtpUser: 'your-email@gmail.com',
    smtpPass: 'your-app-password',
    fromEmail: 'alerts@agency.com',
    adminEmails: ['admin@agency.com'],
  },
  slackSettings: {
    webhookUrl: 'https://hooks.slack.com/services/...',
    channel: '#performance-alerts',
  },
})
```

#### Alert Severity Levels

- **Low**: 1 violation, 1-hour cooldown
- **Medium**: 3 violations, 30-minute cooldown
- **High**: 5 violations, 15-minute cooldown
- **Critical**: 1 violation, 5-minute cooldown

#### Notification Channels

- **Webhook**: Custom HTTP endpoints
- **Email**: SMTP-based notifications
- **Slack**: Slack workspace integration
- **SMS**: Critical alerts via SMS

### 4. Dashboard Integration

#### Performance Dashboard Component

```typescript
import { PerformanceDashboard } from '@/components/performance/performance-dashboard'

function AdminDashboard() {
  return (
    <div>
      <PerformanceDashboard tenantId="agency-admin" />
    </div>
  )
}
```

#### API Integration

```typescript
// GET /api/performance/metrics?app=firm&period=daily
const response = await fetch('/api/performance/metrics?app=firm&period=daily')
const data = await response.json()
```

## Database Schema

### Web Vitals Metrics Table

```sql
CREATE TABLE public.web_vitals_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  page_url TEXT NOT NULL,
  user_agent TEXT,
  device_category TEXT NOT NULL CHECK (device_category IN ('mobile', 'tablet', 'desktop')),
  connection_type TEXT NOT NULL CHECK (connection_type IN ('slow-2g', '2g', '3g', '4g', '5g', 'unknown')),
  lcp INTEGER NOT NULL CHECK (lcp >= 0),
  inp INTEGER NOT NULL CHECK (inp >= 0),
  cls DECIMAL(4,3) NOT NULL CHECK (cls >= 0),
  fcp INTEGER NOT NULL CHECK (fcp >= 0),
  ttfb INTEGER NOT NULL CHECK (ttfb >= 0),
  rating TEXT NOT NULL CHECK (rating IN ('good', 'needs-improvement', 'poor')),
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  context JSONB DEFAULT '{}'::jsonb,
);
```

### Performance Budgets Table

```sql
CREATE TABLE public.performance_budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('lcp', 'inp', 'cls', 'fcp', 'ttfb', 'bundle-size', 'image-size')),
  threshold INTEGER NOT NULL,
  unit TEXT NOT NULL CHECK (unit IN ('milliseconds', 'bytes', 'score')),
  type TEXT NOT NULL CHECK (type IN ('maximum', 'minimum', 'target')),
  active BOOLEAN NOT NULL DEFAULT true,
  alert_severity TEXT NOT NULL CHECK (alert_severity IN ('low', 'medium', 'high', 'critical')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
);
```

## Performance Thresholds (2026 Standards)

### Core Web Vitals

| Metric | Good | Needs Improvement | Poor |
|--------|------|-------------------|-------|
| LCP | ≤ 2.5s | ≤ 4.0s | > 4.0s |
| INP | ≤ 200ms | ≤ 500ms | > 500ms |
| CLS | ≤ 0.1 | ≤ 0.25 | > 0.25 |
| FCP | ≤ 1.8s | ≤ 3.0s | > 3.0s |
| TTFB | ≤ 800ms | ≤ 1.8s | > 1.8s |

### Bundle Size Budgets

| App Type | JavaScript | CSS | Images |
|----------|------------|-----|--------|
| Desktop | 244KB | 50KB | 500KB |
| Mobile | 150KB | 30KB | 300KB |
| Critical | 100KB | 20KB | 200KB |

## Monitoring Procedures

### Daily Operations

1. **Check Dashboard**: Review performance trends and alerts
2. **Monitor Alerts**: Address critical performance regressions
3. **Review Budgets**: Adjust budgets based on business requirements
4. **Analyze Data**: Identify performance patterns and optimization opportunities

### Weekly Operations

1. **Performance Reports**: Generate weekly performance summaries
2. **Budget Reviews**: Evaluate performance budget effectiveness
3. **Trend Analysis**: Analyze performance trends over time
4. **Optimization Planning**: Plan performance improvements based on data

### Monthly Operations

1. **Executive Reports**: Provide performance insights to stakeholders
2. **Budget Adjustments**: Update performance budgets based on business goals
3. **Tool Updates**: Review and update monitoring tools and configurations
4. **Training**: Team training on performance best practices

## Troubleshooting

### Common Issues

#### High LCP (Loading Performance)

**Symptoms**: Slow page loads, poor user experience

**Causes**:
- Large image files
- Unoptimized JavaScript bundles
- Slow server response times
- Render-blocking resources

**Solutions**:
- Optimize images (WebP, lazy loading)
- Code splitting and tree shaking
- Server-side optimization
- Resource prioritization

#### High INP (Responsiveness)

**Symptoms**: Delayed interactions, unresponsive UI

**Causes**:
- Long-running JavaScript tasks
- Heavy DOM manipulation
- Inefficient event handlers
- Third-party script interference

**Solutions**:
- Break up long tasks
- Optimize event handlers
- Use web workers for heavy processing
- Defer non-critical JavaScript

#### High CLS (Visual Stability)

**Symptoms**: Layout shifts, content jumping

**Causes**:
- Images without dimensions
- Dynamic content insertion
- Web font loading
- Ads and embeds

**Solutions**:
- Set image dimensions
- Reserve space for dynamic content
- Optimize font loading
- Use stable ad placements

### Debugging Tools

#### Chrome DevTools

1. **Performance Tab**: Record and analyze runtime performance
2. **Lighthouse**: Comprehensive performance audits
3. **Network Tab**: Analyze resource loading
4. **Coverage Tab**: Identify unused JavaScript/CSS

#### Web Vitals Extension

```bash
# Install Chrome Web Vitals extension
# Search for "Web Vitals" in Chrome Web Store
```

#### Custom Monitoring

```typescript
// Debug performance monitoring
const monitor = useWebVitals({
  tenantId: 'debug',
  enableRealUserMonitoring: true,
  onAlert: (alert) => {
    console.group('Performance Alert')
    console.log('Alert:', alert)
    console.log('Context:', navigator.userAgent, performance.memory)
    console.groupEnd()
  },
})
```

## Best Practices

### Performance Optimization

1. **Image Optimization**
   - Use modern formats (WebP, AVIF)
   - Implement responsive images
   - Lazy load below-fold images
   - Optimize image compression

2. **JavaScript Optimization**
   - Code splitting by routes
   - Tree shaking unused code
   - Minify and compress bundles
   - Use dynamic imports for heavy components

3. **CSS Optimization**
   - Minify CSS files
   - Remove unused CSS
   - Critical CSS inlining
   - CSS containment for layout

4. **Server Optimization**
   - Enable compression (gzip/brotli)
   - Implement caching headers
   - Use CDN for static assets
   - Optimize database queries

### Monitoring Best Practices

1. **Set Realistic Budgets**: Base budgets on user needs and business goals
2. **Monitor Trends**: Focus on trends over individual measurements
3. **Segment Data**: Analyze performance by device, connection, and location
4. **Automate Alerts**: Set up appropriate alert thresholds and escalation
5. **Regular Reviews**: Schedule regular performance reviews and optimizations

## Integration Examples

### Next.js App Router

```typescript
// app/layout.tsx
import { PerformanceMonitor } from '@/components/performance-monitor'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        <PerformanceMonitor tenantId="firm" />
        {children}
      </body>
    </html>
  )
}
```

### Custom Analytics Integration

```typescript
// Custom analytics integration
function sendToCustomAnalytics(metrics: WebVitalsMetrics) {
  fetch('/api/analytics/performance', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(metrics),
  })
}

// Use with Web Vitals monitor
const monitor = useWebVitals({
  tenantId: 'firm',
  onAlert: (alert) => sendToCustomAnalytics(alert),
})
```

## Security Considerations

### Data Privacy

- **User Consent**: Honor user privacy preferences
- **Data Anonymization**: Remove personally identifiable information
- **Retention Policies**: Implement data retention schedules
- **Compliance**: Follow GDPR/CCPA requirements

### Access Control

- **Tenant Isolation**: Ensure data isolation between tenants
- **Role-Based Access**: Limit access to performance data
- **API Security**: Secure API endpoints with authentication
- **Audit Trails**: Log access to performance data

## Migration Guide

### From Basic Analytics

1. **Install Package**: `pnpm add @agency/monitoring`
2. **Add Provider**: Wrap app with performance monitoring provider
3. **Configure Budgets**: Set up performance budgets for your apps
4. **Set Up Alerts**: Configure notification channels
5. **Add Dashboard**: Integrate performance dashboard

### From Third-Party Solutions

1. **Export Data**: Migrate existing performance data
2. **Update Configuration**: Replace third-party configuration
3. **Update Code**: Replace monitoring calls with new API
4. **Validate Migration**: Compare data accuracy
5. **Decommission**: Remove old monitoring solution

## Support and Resources

### Documentation

- [API Reference](./api-reference.md)
- [Configuration Guide](./configuration.md)
- [Troubleshooting Guide](./troubleshooting.md)
- [Best Practices](./best-practices.md)

### Community

- GitHub Issues: Report bugs and request features
- Discord Channel: Real-time support and discussions
- Blog: Performance tips and case studies
- Newsletter: Monthly performance insights

### Training

- [Performance Monitoring 101](./training/basics.md)
- [Advanced Performance Optimization](./training/advanced.md)
- [Dashboard Administration](./training/dashboard.md)
- [Alert Configuration](./training/alerts.md)

---

*Last updated: March 17, 2026*
