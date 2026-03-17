# @agency/analytics

<div align="center">

**PostHog analytics wrapper with multi-tenant support**

[![npm version](https://img.shields.io/npm/v/@agency/analytics)](https://www.npmjs.com/package/@agency/analytics)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7+-blue)](https://www.typescriptlang.org/)
[![PostHog](https://img.shields.io/badge/PostHog-latest-purple)](https://posthog.com/)

</div>

Type-safe analytics wrapper around PostHog with tenant isolation, automatic event enrichment, and comprehensive tracking capabilities for the agency platform.

## 🚀 Features

### 📊 **Multi-Tenant Analytics**
- **Tenant Isolation** - Separate analytics data per client/tenant
- **Automatic Enrichment** - Tenant context added to all events
- **Privacy Compliance** - GDPR and data protection compliance
- **Data Governance** - Granular control over data collection

### 🎯 **Event Tracking**
- **Custom Events** - Flexible event tracking with type safety
- **Page Views** - Automatic page view tracking
- **User Properties** - Rich user context and properties
- **Group Analytics** - Organization and account-level tracking

### 🔧 **Developer Experience**
- **Type Safety** - Full TypeScript support with strict typing
- **React Hooks** - Easy integration with React applications
- **Server-Side** - Node.js support for server-side tracking
- **Auto-Capture** - Automatic event capture with configuration

### 📈 **Advanced Features**
- **Feature Flags** - Remote feature flag management
- **A/B Testing** - Experiment and rollout management
- **Surveys** - In-app survey and feedback collection
- **Heatmaps** - User interaction and click tracking

## 📦 Installation

```bash
pnpm add @agency/analytics
```

## 🔧 Configuration

### **Environment Variables**

```bash
# PostHog Configuration
NEXT_PUBLIC_POSTHOG_KEY=your_posthog_api_key
NEXT_PUBLIC_POSTHOG_HOST=your_posthog_host  # Optional
POSTHOG_PROJECT_API_KEY=your_server_api_key   # For server-side

# Privacy Settings
NEXT_PUBLIC_POSTHOG_DISABLE_COOKIE=false    # Disable cookie usage
NEXT_PUBLIC_POSTHOG_DISABLE_PERSISTENCE=false # Disable persistence
```

### **PostHog Setup**

1. **Create PostHog Project**
   - Sign up at [PostHog](https://posthog.com/)
   - Create a new project for your agency
   - Get your API key from project settings

2. **Configure Domain** (Optional)
   - Set custom domain for better privacy
   - Configure CORS settings
   - Set up data residency if needed

## 🚀 Quick Start

### **Client-Side Usage**

```tsx
// app/layout.tsx
import { PostHogProvider } from '@agency/analytics/client'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html>
      <body>
        <PostHogProvider>
          {children}
        </PostHogProvider>
      </body>
    </html>
  )
}
```

```tsx
// app/page.tsx
import { usePostHog } from '@agency/analytics/client'

export default function HomePage() {
  const posthog = usePostHog()
  
  const handleButtonClick = () => {
    // Track custom event
    posthog.capture('button_clicked', {
      button_name: 'cta_button',
      page: 'homepage',
      tenant_id: 'riverside-hotel'
    })
  }
  
  return (
    <div>
      <h1>Welcome to our app</h1>
      <button onClick={handleButtonClick}>
        Get Started
      </button>
    </div>
  )
}
```

### **Server-Side Usage**

```ts
// app/api/track/route.ts
import { posthogServer } from '@agency/analytics/server'

export async function POST(request: Request) {
  const { event, properties } = await request.json()
  
  // Track event server-side
  await posthogServer.capture({
    event,
    properties: {
      ...properties,
      tenant_id: 'riverside-hotel',
      source: 'server'
    }
  })
  
  return Response.json({ success: true })
}
```

## 📚 API Reference

### **Client API**

#### **usePostHog Hook**

```tsx
import { usePostHog } from '@agency/analytics/client'

const posthog = usePostHog()
```

#### **Methods**

| Method | Description | Parameters |
|--------|-------------|------------|
| `capture(event, properties?)` | Track custom event | `event: string`, `properties?: Record<string, any>` |
| `identify(distinctId, properties?)` | Identify user | `distinctId: string`, `properties?: Record<string, any>` |
| `group(groupType, groupKey, properties?)` | Group users | `groupType: string`, `groupKey: string`, `properties?: Record<string, any>` |
| `page(properties?)` | Track page view | `properties?: Record<string, any>` |
| `reset()` | Reset user identity | - |

### **Server API**

#### **posthogServer Instance**

```ts
import { posthogServer } from '@agency/analytics/server'
```

#### **Methods**

| Method | Description | Parameters |
|--------|-------------|------------|
| `capture(options)` | Track event server-side | `options: { event: string, properties?: Record<string, any>, distinctId?: string }` |
| `identify(distinctId, properties?)` | Identify user | `distinctId: string`, `properties?: Record<string, any>` |
| `group(groupType, groupKey, properties?)` | Group users | `groupType: string`, `groupKey: string`, `properties?: Record<string, any>` |

## 🔒 Privacy & Compliance

### **GDPR Compliance**

```tsx
// Respect user consent
import { usePostHog } from '@agency/analytics/client'

export default function CookieConsent() {
  const posthog = usePostHog()
  
  const handleAccept = () => {
    // Opt in to analytics
    posthog.set_config({ cookie_same_site: 'Lax' })
  }
  
  const handleReject = () => {
    // Opt out of analytics
    posthog.opt_out_capturing()
  }
}
```

### **Data Controls**

```tsx
// User data management
import { usePostHog } from '@agency/analytics/client'

export default function UserDataControls() {
  const posthog = usePostHog()
  
  const handleDeleteData = () => {
    // Delete user data
    posthog.people.delete_user()
  }
  
  const handleExportData = () => {
    // Export user data
    posthog.people.get_property('$initial_referrer')
  }
}
```

## 🎯 Advanced Features

### **Feature Flags**

```tsx
import { usePostHog } from '@agency/analytics/client'

export default function FeatureFlaggedComponent() {
  const posthog = usePostHog()
  
  const isNewFeatureEnabled = posthog.isFeatureEnabled('new-feature', 'user-123')
  
  if (isNewFeatureEnabled) {
    return <NewFeature />
  }
  
  return <OldFeature />
}
```

### **A/B Testing**

```tsx
import { usePostHog } from '@agency/analytics/client'

export default function ABTestedButton() {
  const posthog = usePostHog()
  
  const variant = posthog.getFeatureFlag('button-test', 'user-123')
  
  return (
    <button className={`btn-${variant}`}>
      Click Me
    </button>
  )
}
```

### **Surveys**

```tsx
import { usePostHog } from '@agency/analytics/client'

export default function FeedbackSurvey() {
  const posthog = usePostHog()
  
  const showSurvey = () => {
    posthog.capture('survey_shown', {
      survey_id: 'user-satisfaction'
    })
  }
  
  return (
    <button onClick={showSurvey}>
      Give Feedback
    </button>
  )
}
```

## 🔧 Configuration

### **Custom Configuration**

```tsx
// app/providers/analytics.tsx
'use client'

import { PostHogProvider } from '@agency/analytics/client'

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  return (
    <PostHogProvider
      options={{
        api_host: 'https://your-posthog-instance.com',
        autocapture: {
          capture_pageview: false, // Disable automatic pageview
          capture_pageleave: true,
          capture_dead_clicks: true,
        },
        debug: process.env.NODE_ENV === 'development',
        disable_persistence: false,
        disable_cookie: false,
        enable_recording_console_log: false,
        person_profiles: 'identified', // or 'always'
        property_blacklist: ['password', 'ssn', 'credit_card'],
        session_recording: {
          maskAllInputs: true,
          maskTextSelector: '[data-sensitive]',
        }
      }}
    >
      {children}
    </PostHogProvider>
  )
}
```

### **Tenant Configuration**

```ts
// lib/analytics-config.ts
export interface TenantAnalyticsConfig {
  tenant_id: string
  posthog_project_id?: string
  custom_properties?: Record<string, any>
  disabled_events?: string[]
}

export const tenantConfigs: Record<string, TenantAnalyticsConfig> = {
  'riverside-hotel': {
    tenant_id: 'riverside-hotel',
    custom_properties: {
      industry: 'hospitality',
      client_type: 'production'
    }
  },
  'riley-day-care': {
    tenant_id: 'riley-day-care',
    custom_properties: {
      industry: 'childcare',
      client_type: 'demo'
    },
    disabled_events: ['test_event']
  }
}
```

## 📊 Event Tracking Best Practices

### **Event Naming Conventions**

```ts
// Good event names
'button_clicked'
'form_submitted'
'page_viewed'
'user_registered'
'feature_used'

// Bad event names
'click'
'submit'
'view'
'register'
'use'
```

### **Property Guidelines**

```ts
// Good properties
{
  button_name: 'cta_button',
  form_type: 'contact',
  page_section: 'hero',
  feature_name: 'advanced_search',
  tenant_id: 'riverside-hotel'
}

// Bad properties
{
  button: 'cta', // Too generic
  type: 'contact', // Too generic
  section: 'hero', // Too generic
  name: 'search', // Too generic
  id: 'hotel' // Too generic
}
```

### **Event Structure**

```ts
// Recommended event structure
posthog.capture('user_action', {
  action: 'button_clicked',
  object: 'cta_button',
  location: 'homepage_hero',
  properties: {
    variant: 'blue',
    text: 'Get Started',
    tenant_id: 'riverside-hotel',
    user_type: 'visitor'
  }
})
```

## 🧪 Testing

### **Unit Testing**

```ts
// __tests__/analytics.test.ts
import { renderHook } from '@testing-library/react'
import { usePostHog } from '@agency/analytics/client'

// Mock PostHog
jest.mock('@agency/analytics/client', () => ({
  usePostHog: () => ({
    capture: jest.fn(),
    identify: jest.fn(),
    isFeatureEnabled: jest.fn(() => false)
  })
}))

test('should track button click', () => {
  const { result } = renderHook(() => usePostHog())
  
  result.current.capture('button_clicked', { button_name: 'test' })
  
  expect(result.current.capture).toHaveBeenCalledWith('button_clicked', {
    button_name: 'test'
  })
})
```

### **Integration Testing**

```ts
// __tests__/integration.test.ts
import { posthogServer } from '@agency/analytics/server'

test('should track server-side event', async () => {
  await posthogServer.capture({
    event: 'server_event',
    properties: { tenant_id: 'test' }
  })
  
  // Verify event was sent to PostHog
  expect(true).toBe(true) // Implementation depends on your test setup
})
```

## 🚀 Deployment

### **Environment Configuration**

```bash
# Development
NEXT_PUBLIC_POSTHOG_KEY=dev_key
POSTHOG_PROJECT_API_KEY=dev_server_key

# Staging
NEXT_PUBLIC_POSTHOG_KEY=staging_key
POSTHOG_PROJECT_API_KEY=staging_server_key

# Production
NEXT_PUBLIC_POSTHOG_KEY=prod_key
POSTHOG_PROJECT_API_KEY=prod_server_key
```

### **Build Configuration**

```json
// package.json
{
  "scripts": {
    "build": "tsup",
    "dev": "tsup --watch",
    "type-check": "tsc --noEmit"
  }
}
```

## 🔍 Debugging

### **Development Debugging**

```tsx
// Enable debug mode
const posthog = usePostHog()
posthog.debug() // Enable console logging
```

### **🆘 Troubleshooting Guide**

#### **Common Issues & Solutions**

**1. Events Not Appearing in PostHog**

**Symptoms**: Events tracked in code but not showing in dashboard

**Solutions**:
- ✅ Verify API key: `console.log(process.env.NEXT_PUBLIC_POSTHOG_KEY)`
- ✅ Check network tab for failed requests
- ✅ Ensure PostHog provider wraps your app
- ✅ Verify tenant_id is properly set

```tsx
// Debug event tracking
const posthog = usePostHog()

const debugCapture = (event: string, properties?: any) => {
  console.log('Tracking event:', event, properties)
  posthog.capture(event, properties)
}
```

**2. Tenant Data Mixing**

**Symptoms**: Seeing data from other tenants in reports

**Solutions**:
- ✅ Verify tenant context middleware is working
- ✅ Check group configuration: `posthog.group('tenant', tenantId)`
- ✅ Review data isolation settings in PostHog
- ✅ Ensure proper tenant_id in all events

```ts
// Debug tenant isolation
export function debugTenantContext(tenantId: string) {
  console.log('Current tenant:', tenantId)
  console.log('Group properties:', { tenant_type: 'client' })
}
```

**3. Performance Issues**

**Symptoms**: Slow page loads, high bundle size

**Solutions**:
- ✅ Debounce rapid events with `lodash.debounce`
- ✅ Use batch processing for multiple events
- ✅ Monitor bundle size with `webpack-bundle-analyzer`
- ✅ Disable autocapture for unused features

```tsx
// Optimized event tracking
import { debounce } from 'lodash-es'

const debouncedCapture = debounce((event: string, properties?: any) => {
  posthog.capture(event, properties)
}, 300)
```

**4. Feature Flags Not Working**

**Symptoms**: Feature flags always returning false

**Solutions**:
- ✅ Check user identification: `posthog.identify(userId)`
- ✅ Verify feature flag exists in PostHog
- ✅ Ensure proper rollout percentage
- ✅ Check for override conditions

```tsx
// Debug feature flags
const debugFeatureFlag = (flag: string, userId: string) => {
  const isEnabled = posthog.isFeatureEnabled(flag, userId)
  console.log(`Feature flag ${flag} for ${userId}:`, isEnabled)
  console.log('All feature flags:', posthog.getFeatureFlagPayload())
}
```

**5. Server-Side Tracking Failures**

**Symptoms**: Server events not being recorded

**Solutions**:
- ✅ Verify server API key: `POSTHOG_PROJECT_API_KEY`
- ✅ Check PostHog instance URL
- ✅ Ensure proper async/await usage
- ✅ Verify request payload format

```ts
// Debug server-side tracking
export async function debugServerCapture(event: string, properties: any) {
  try {
    console.log('Server tracking:', { event, properties })
    await posthogServer.capture({ event, properties })
    console.log('Server tracking successful')
  } catch (error) {
    console.error('Server tracking failed:', error)
  }
}
```

#### **🔧 Advanced Debugging Tools**

**PostHog Debug Toolbar**
```tsx
// Add debug toolbar in development
if (process.env.NODE_ENV === 'development') {
  posthog.debug()
  // Shows PostHog debug toolbar
}
```

**Event Validation**
```ts
// Validate event structure
export function validateEvent(event: string, properties: any) {
  const errors: string[] = []
  
  if (!event || typeof event !== 'string') {
    errors.push('Event name must be a non-empty string')
  }
  
  if (!event.match(/^[a-z0-9_]+$/)) {
    errors.push('Event name must contain only lowercase letters, numbers, and underscores')
  }
  
  if (properties && typeof properties !== 'object') {
    errors.push('Properties must be an object')
  }
  
  return errors
}
```

**Network Monitoring**
```tsx
// Monitor PostHog requests
const originalFetch = window.fetch
window.fetch = (...args) => {
  const [url, options] = args
  if (url.includes('posthog') || url.includes('analytics')) {
    console.log('PostHog request:', url, options)
  }
  return originalFetch(...args)
}
```

#### **📞 Getting Help**

**Self-Service Debugging**:
1. Check browser console for errors
2. Verify environment variables are set
3. Test with a simple capture event
4. Check PostHog network requests
5. Review PostHog project settings

**Community Support**:
- **PostHog Documentation**: [https://posthog.com/docs](https://posthog.com/docs)
- **GitHub Issues**: [Agency Platform Issues](https://github.com/agency/platform/issues)
- **Discord Community**: [Join our Discord](https://discord.gg/agency)
- **Email Support**: analytics@agency.com

**Common Debug Commands**:
```bash
# Check environment variables
pnpm run env:check

# Validate analytics setup
pnpm run analytics:validate

# Test PostHog connection
pnpm run analytics:test
```

## 🤝 Contributing

1. **Type Safety** - Maintain strict TypeScript types
2. **Testing** - Add tests for new features
3. **Documentation** - Update API documentation
4. **Privacy** - Consider privacy implications
5. **Performance** - Optimize for production use

## 📄 License

ISC License - see LICENSE file for details.

---

<div align="center">

**Part of the @agency monorepo**

[📖 Documentation](../../docs/) • [🎨 Design System](../design-tokens/) • [🔒 Security](../../SECURITY.md)

</div>
