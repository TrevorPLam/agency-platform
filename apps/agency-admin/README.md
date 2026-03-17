# Agency Admin

<div align="center">

**Internal management dashboard for agency operations**

[![Next.js](https://img.shields.io/badge/Next.js-16.1-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7+-blue)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-v4-38B2AC)](https://tailwindcss.com/)
[![Port](https://img.shields.io/badge/Port-3001-blue)](http://localhost:3001)

</div>

Internal administrative interface for managing agency operations, client metrics, costs, and system monitoring. Provides comprehensive oversight of the multi-tenant platform with role-based access controls.

## 🚀 Features

### 📊 **Dashboard & Analytics**
- **Real-time Metrics** - DORA metrics, system performance, and client KPIs
- **Cost Tracking** - Resource utilization, billing analytics, and cost optimization recommendations
- **Client Overview** - Multi-client status, health monitoring, and performance metrics
- **System Health** - Infrastructure status, error tracking, and alert management

### 🔧 **Administrative Tools**
- **User Management** - Role-based access control and user provisioning
- **Client Configuration** - Tenant setup, branding configuration, and feature flags
- **System Settings** - Platform configuration, integration management, and security settings
- **Audit Logs** - Comprehensive activity tracking and compliance reporting

### 📈 **Monitoring & Alerts**
- **Performance Monitoring** - Response times, error rates, and system bottlenecks
- **Cost Alerts** - Budget tracking, anomaly detection, and optimization suggestions
- **Security Monitoring** - Access patterns, threat detection, and compliance status
- **Automated Reports** - Scheduled reports, executive summaries, and trend analysis

## 🏗️ Architecture

### **Technology Stack**
- **Framework**: Next.js 16.1 with App Router
- **Language**: TypeScript 5.7+ strict mode
- **Styling**: Tailwind CSS v4 with design tokens
- **UI Components**: @agency/ui component library
- **Database**: Supabase (PostgreSQL + Auth + Storage)
- **Background Jobs**: Inngest for async workflows
- **Analytics**: PostHog for user tracking
- **Monitoring**: @agency/monitoring and @agency/metrics packages

### **Key Integrations**
- **@agency/database** - Type-safe database client factories
- **@agency/analytics** - PostHog wrapper for usage analytics
- **@agency/email** - Resend integration for notifications
- **@agency/metrics** - DORA metrics and performance tracking
- **@agency/monitoring** - System health and alerting

## 🚀 Quick Start

### **Prerequisites**
- Node.js 22.x
- pnpm 10.x
- Supabase local instance (for development)

### **Installation & Setup**

```bash
# Navigate to agency admin directory
cd apps/agency-admin

# Install dependencies
pnpm install

# Set up environment variables
cp .env.local.example .env.local
# Edit .env.local with your configuration

# Start development server
pnpm dev
```

### **Environment Variables**

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Analytics
NEXT_PUBLIC_POSTHOG_KEY=your_posthog_key

# Background Jobs
INNGEST_EVENT_KEY=your_inngest_key
INNGEST_SIGNING_KEY=your_inngest_signing_key

# Monitoring
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn # Optional
```

## 📁 Project Structure

```
apps/agency-admin/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (dashboard)/        # Dashboard layout group
│   │   │   ├── costs/         # Cost management pages
│   │   │   ├── metrics/       # Metrics and analytics
│   │   │   └── layout.tsx     # Dashboard layout
│   │   ├── api/               # API routes
│   │   │   ├── costs/         # Cost API endpoints
│   │   │   ├── metrics/       # Metrics API endpoints
│   │   │   └── inngest/       # Inngest webhooks
│   │   ├── login/             # Authentication pages
│   │   └── layout.tsx         # Root layout
│   ├── components/             # Reusable components
│   │   ├── costs/             # Cost management components
│   │   ├── metrics/           # Metrics dashboard components
│   │   └── shared/            # Shared admin components
│   ├── inngest/               # Background job functions
│   │   └── functions/         # Inngest function definitions
│   └── middleware.ts          # Authentication and tenant middleware
├── package.json
├── next.config.ts
├── tailwind.config.ts
└── tsconfig.json
```

## 🔧 Development

### **Available Scripts**

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server on port 3001 |
| `pnpm build` | Build for production |
| `pnpm start` | Start production server |
| `pnpm lint` | Run ESLint with strict warnings |
| `pnpm type-check` | TypeScript type checking |

### **Development Workflow**

```bash
# 1. Start development server
pnpm dev

# 2. Make changes to components/pages
# 3. Test in browser at http://localhost:3001
# 4. Run linting and type checking
pnpm lint
pnpm type-check

# 5. Build to verify production readiness
pnpm build
```

## 🔒 Security & Access Control

### **Role-Based Access Control**
- **Admin** - Full system access and configuration
- **Manager** - Client management and reporting access
- **Analyst** - Read-only access to metrics and reports
- **Viewer** - Limited dashboard access

### **Security Features**
- **Authentication** - Supabase Auth with multi-factor support
- **Authorization** - Row-Level Security (RLS) for data isolation
- **Audit Trails** - Complete activity logging and compliance tracking
- **Session Management** - Secure session handling and automatic timeout

### **Data Protection**
- **Tenant Isolation** - All data scoped to tenant context
- **Input Validation** - Comprehensive validation and sanitization
- **Error Handling** - Secure error responses without information leakage
- **Rate Limiting** - API rate limiting and abuse prevention

## 📊 Metrics & Monitoring

### **DORA Metrics**
- **Deployment Frequency** - Track deployment cadence
- **Lead Time for Changes** - Measure change delivery speed
- **Change Failure Rate** - Monitor deployment success rates
- **Mean Time to Recovery** - Track incident resolution times

### **Performance Metrics**
- **Response Times** - API and page load performance
- **Error Rates** - System error tracking and alerting
- **Resource Utilization** - CPU, memory, and database usage
- **User Experience** - Core Web Vitals and user satisfaction

### **Cost Analytics**
- **Resource Costs** - Compute, storage, and bandwidth expenses
- **Client Billing** - Per-client cost allocation and reporting
- **Optimization Opportunities** - Cost-saving recommendations
- **Budget Tracking** - Spend vs. budget analysis and forecasting

## 🧪 Testing

### **Testing Strategy**
```bash
# Run linting (includes basic type checking)
pnpm lint

# Type checking
pnpm type-check

# Build verification
pnpm build

# E2E tests (when implemented)
pnpm test:e2e
```

### **Test Coverage**
- **Unit Tests** - Component logic and utility functions
- **Integration Tests** - API endpoints and database interactions
- **E2E Tests** - Critical user workflows and admin operations
- **Security Tests** - Authentication and authorization flows

## 🚀 Deployment

### **Production Deployment**
```bash
# Build for production
pnpm build

# Deploy to Vercel (recommended)
vercel --prod

# Or use other hosting platforms
npm start
```

### **Environment Configuration**
- **Development** - Local development with hot reload
- **Staging** - Pre-production testing environment
- **Production** - Live production environment with monitoring

### **Monitoring & Observability**
- **Error Tracking** - Sentry integration for error monitoring
- **Performance Monitoring** - Real-time performance metrics
- **User Analytics** - PostHog for user behavior tracking
- **System Health** - Custom health checks and alerting

## 🔧 Configuration

### **Next.js Configuration**
```typescript
// next.config.ts
const nextConfig = {
  experimental: {
    // Enable experimental features as needed
  },
  images: {
    domains: ['your-cdn-domain.com'],
  },
  env: {
    // Environment-specific configuration
  },
}
```

### **Tailwind CSS Configuration**
```typescript
// tailwind.config.ts
import { type Config } from 'tailwindcss'

export default {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // Custom theme extensions
    },
  },
  plugins: [
    // Tailwind plugins
  ],
} satisfies Config
```

## 🤝 Contributing

1. **Follow Development Guidelines** - See [CONTRIBUTING.md](../../../CONTRIBUTING.md)
2. **Security First** - Follow security best practices in [SECURITY.md](../../../SECURITY.md)
3. **Type Safety** - Use TypeScript strict mode, no `any` types
4. **Testing** - Add tests for new features and functionality
5. **Documentation** - Update documentation for API changes

## 📄 License

Private - All rights reserved to the agency and its clients.

---

<div align="center">

**Part of the @agency monorepo**

[📖 Documentation](../../../docs/) • [🎨 Design System](../../../packages/design-tokens/) • [🔒 Security](../../../SECURITY.md)

</div>
