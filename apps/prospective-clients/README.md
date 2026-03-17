# Prospective Clients

<div align="center">

**Demo and prototype applications for prospective client engagement**

[![Next.js](https://img.shields.io/badge/Next.js-16.1-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7+-blue)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-v4-38B2AC)](https://tailwindcss.com/)

</div>

Collection of demo applications showcasing agency capabilities and serving as proof-of-concept implementations for prospective clients. Each demo demonstrates specific features, integrations, and design patterns available in the agency platform.

## 🎯 Purpose & Strategy

### **Client Acquisition**
- **Live Demos** - Interactive demonstrations of platform capabilities
- **Use Case Showcases** - Industry-specific implementations
- **Technical Validation** - Proof of technical feasibility
- **Design System Preview** - Visual design and UX capabilities

### **Development Sandbox**
- **Feature Testing** - Safe environment for experimental features
- **Integration Validation** - Third-party service integration testing
- **Performance Benchmarking** - Platform performance demonstrations
- **Security Demonstrations** - Multi-tenant security validation

## 🚀 Current Demo Applications

### **Riley Day Care**
**Childcare management platform demo**

- **Features**: Parent portal, staff scheduling, activity tracking
- **Technologies**: Booking system, notifications, multi-user workflows
- **Use Case**: Service-based business with appointment scheduling
- **Port**: 3002 (when running locally)

### **The Barber Cave**
**Barbershop booking and management demo**

- **Features**: Service booking, staff management, customer profiles
- **Technologies**: Real-time scheduling, payment integration, inventory
- **Use Case**: Local service business with complex scheduling needs
- **Port**: 3003 (when running locally)

## 🏗️ Architecture

### **Shared Infrastructure**
- **Framework**: Next.js 16.1 with App Router
- **Language**: TypeScript 5.7+ strict mode
- **Styling**: Tailwind CSS v4 with client-specific design tokens
- **UI Components**: @agency/ui component library
- **Database**: Supabase with tenant isolation
- **Analytics**: PostHog for demo usage tracking

### **Demo-Specific Features**
- **Tenant Isolation** - Each demo runs as isolated tenant
- **Data Seeding** - Pre-populated demo data for realistic experience
- **Feature Flags** - Controlled feature exposure per demo
- **Branding** - Client-specific theming and customization

## 📁 Directory Structure

```
apps/prospective-clients/
├── riley-day-care/           # Childcare management demo
│   ├── src/
│   │   ├── app/             # Next.js App Router
│   │   ├── components/      # Demo-specific components
│   │   └── lib/            # Utilities and helpers
│   ├── tokens/              # Design token overrides
│   ├── package.json
│   └── README.md            # Demo-specific documentation
├── the-barber-cave/         # Barbershop management demo
│   ├── src/
│   │   ├── app/             # Next.js App Router
│   │   ├── components/      # Demo-specific components
│   │   └── lib/            # Utilities and helpers
│   ├── tokens/              # Design token overrides
│   ├── package.json
│   └── README.md            # Demo-specific documentation
└── README.md                # This file
```

## 🚀 Quick Start

### **Running Individual Demos**

```bash
# Navigate to specific demo
cd apps/prospective-clients/riley-day-care

# Install dependencies
pnpm install

# Set up environment variables
cp .env.local.example .env.local

# Start development server
pnpm dev

# Access demo at http://localhost:3002
```

### **Running All Demos**

```bash
# From repository root
pnpm dev

# This starts all apps including demos:
# - Firm: http://localhost:3000
# - Agency Admin: http://localhost:3001
# - Riley Day Care: http://localhost:3002
# - The Barber Cave: http://localhost:3003
```

### **Environment Variables**

Each demo requires its own environment configuration:

```bash
# Supabase Configuration (shared)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Demo-specific Configuration
NEXT_PUBLIC_TENANT_SLUG=riley-day-care  # or the-barber-cave
NEXT_PUBLIC_DEMO_MODE=true

# Analytics
NEXT_PUBLIC_POSTHOG_KEY=your_posthog_key
```

## 🎨 Design & Branding

### **Client-Specific Theming**
Each demo can have custom design tokens:

```json
// tokens/riley-day-care.json
{
  "color": {
    "semantic": {
      "brand-primary": "#3b82f6",
      "brand-secondary": "#1e40af",
      "accent": "#f59e0b"
    }
  },
  "typography": {
    "semantic": {
      "font-family-brand": "\"Inter\", sans-serif"
    }
  }
}
```

### **Design Token Compilation**
```bash
# Build design tokens for all demos
pnpm tokens:build

# Build tokens for specific demo
pnpm tokens:build --client riley-day-care
```

## 🧪 Testing & Validation

### **Demo Testing Strategy**
- **Smoke Tests** - Basic functionality validation
- **Integration Tests** - Third-party service validation
- **Performance Tests** - Load and stress testing
- **Security Tests** - Multi-tenant isolation validation

### **Test Execution**
```bash
# Run tests for specific demo
cd apps/prospective-clients/riley-day-care
pnpm test

# Run E2E tests
pnpm test:e2e

# Run accessibility tests
pnpm test:a11y
```

## 📊 Analytics & Monitoring

### **Demo Usage Tracking**
- **User Interactions** - Feature usage and navigation patterns
- **Performance Metrics** - Page load times and user experience
- **Error Tracking** - Issues and bugs in demo functionality
- **Conversion Events** - Demo-to-client conversion tracking

### **Monitoring Setup**
```tsx
import { usePostHog } from '@agency/analytics'

export default function DemoPage() {
  const posthog = usePostHog()
  
  const handleFeatureUse = (feature: string) => {
    posthog.capture('demo_feature_used', {
      demo: 'riley-day-care',
      feature,
      timestamp: new Date().toISOString()
    })
  }
}
```

## 🔧 Development Guidelines

### **Creating New Demos**

1. **Directory Setup**
```bash
mkdir apps/prospective-clients/new-demo
cd apps/prospective-clients/new-demo
```

2. **Initialize Project**
```bash
# Copy template from existing demo
cp -r ../riley-day-care/* .

# Update package.json
npm init -y
```

3. **Configure Environment**
```bash
# Create environment files
cp .env.local.example .env.local

# Update tenant configuration
echo "NEXT_PUBLIC_TENANT_SLUG=new-demo" >> .env.local
```

4. **Customize Design**
```bash
# Create design tokens
mkdir tokens
echo '{"color":{"semantic":{"brand-primary":"#your-color"}}}' > tokens/new-demo.json
```

### **Demo Best Practices**

- **Realistic Data** - Use plausible demo data, not placeholder text
- **Complete Workflows** - Implement end-to-end user journeys
- **Error Handling** - Graceful error states and recovery
- **Performance** - Optimize for demo environment constraints
- **Documentation** - Clear README with setup instructions

### **Code Sharing Guidelines**

- **Shared Components** - Use @agency/ui for reusable elements
- **Business Logic** - Keep demo-specific logic in demo directory
- **Database Schema** - Use shared tables with tenant isolation
- **Integration Code** - Abstract third-party integrations for reuse

## 🚀 Deployment

### **Demo Deployment Strategy**
- **Staging Environment** - Pre-production demo testing
- **Production Demos** - Live demos for client presentations
- **Feature Flags** - Controlled feature exposure
- **A/B Testing** - Feature validation and optimization

### **Deployment Configuration**
```bash
# Build for production
pnpm build

# Deploy to Vercel with custom domain
vercel --prod --domain demo.riley-day-care.agency.com

# Or use subdomains
vercel --prod --domain riley-day-care.demo.agency.com
```

### **Environment Management**
- **Development** - Local development with hot reload
- **Staging** - Internal testing and validation
- **Production** - Client-facing live demos
- **Archive** - Retired demos for reference

## 🔒 Security Considerations

### **Multi-Tenant Isolation**
- **Data Separation** - Complete tenant data isolation
- **Access Controls** - Demo-specific user permissions
- **API Security** - Tenant-scoped API endpoints
- **Resource Limits** - Per-demo resource constraints

### **Demo-Specific Security**
- **Public Access** - Controlled access to demo environments
- **Data Sanitization** - Remove sensitive production data
- **Rate Limiting** - Prevent abuse of demo systems
- **Monitoring** - Security event tracking and alerting

## 📈 Success Metrics

### **Demo Performance Indicators**
- **Engagement Time** - Average time spent in demos
- **Feature Adoption** - Most-used demo features
- **Conversion Rate** - Demo-to-client conversion percentage
- **Support Requests** - Questions and issues from demo users

### **Technical Metrics**
- **Uptime** - Demo availability and reliability
- **Performance** - Page load times and user experience
- **Error Rate** - Bugs and issues in demo functionality
- **Resource Usage** - Server and database utilization

## 🤝 Contributing

### **Adding New Demos**
1. **Requirements Analysis** - Define target industry and use case
2. **Design Planning** - Create mockups and user flows
3. **Implementation** - Build demo following established patterns
4. **Testing** - Comprehensive testing and validation
5. **Documentation** - Complete README and setup instructions

### **Demo Maintenance**
- **Regular Updates** - Keep demos current with platform features
- **Data Refresh** - Update demo data periodically
- **Performance Optimization** - Monitor and improve demo performance
- **Security Audits** - Regular security reviews and updates

## 📄 License

Private - All rights reserved to the agency and its clients.

---

<div align="center">

**Part of the @agency monorepo**

[📖 Documentation](../../../docs/) • [🎨 Design System](../../../packages/design-tokens/) • [🔒 Security](../../../SECURITY.md)

</div>
