# Agency Platform Documentation

Welcome to the agency platform documentation. This guide provides comprehensive information about the multi-tenant agency monorepo architecture, development workflows, and operational procedures.

---

## 📚 Documentation Structure

### **🚀 Guides** ([guides/](guides/))
User-facing guides and workflows for common tasks.

- **[AI Development Guide](guides/AI_DEVELOPMENT_GUIDE.md)** - Complete guide for AI coding agents working in the monorepo
- **[Client Onboarding](guides/CLIENT_ONBOARDING.md)** - End-to-end process for onboarding new clients
- **[Riley Day Care Spec](guides/riley-day-care-spec.md)** - Specific client requirements and implementation checklist

### **🏗️ Architecture** ([architecture/](architecture/))
System design, structure, and implementation status.

- **[Architecture Overview](architecture/ARCHITECTURE.md)** - High-level monorepo architecture and isolation layers
- **[Atomic Design](architecture/ATOMIC_DESIGN.md)** - Component design principles and organization
- **[Codebase Analysis](architecture/CODEBASE_ANALYSIS.md)** - Current implementation status and identified gaps

### **🔒 Security** ([security/](security/))
Multi-tenant security implementation and verification.

- **[Multi-Tenant Security](security/MULTI_TENANT_SECURITY.md)** - Complete security model, RLS, and authentication
- **[Supabase Keys](security/SUPABASE_KEYS.md)** - Production credentials and security notes

### **⚙️ Operations** ([operations/](operations/))
Deployment, infrastructure, and operational procedures.

- **[Deployment Guide](operations/DEPLOYMENT.md)** - Vercel deployment strategies and cost considerations
- **[Background Jobs](operations/BACKGROUND_JOBS.md)** - Inngest workflows and durable background processing
- **[PostHog Deployment](operations/POSTHOG_DEPLOYMENT.md)** - Analytics setup and GDPR compliance
- **[Local Supabase](operations/SUPABASE_LOCAL.md)** - Local development environment setup

### **🛠️ Development** ([development/](development/))
Development workflows, tools, and best practices.

- **[Tailwind v4 Notes](development/TAILWIND_V4_NOTES.md)** - CSS framework migration guide and production blockers
- **[pnpm Notes](development/PNPM_NOTES.md)** - Package management workspace issues and workarounds
- **[Rendering Strategies](development/RENDERING.md)** - Next.js 16 rendering options and use cases
- **[Versioning](development/VERSIONING.md)** - Semantic versioning and release procedures

### **📋 Governance** ([governance/](governance/))
Design system governance and strategic direction.

- **[Governance Model](governance/GOVERNANCE.md)** - Design system roles and contribution workflow
- **[Agency Direction](governance/PLAN_AGENCY_DIRECTION.md)** - Strategic decisions and implementation phases

### **🔬 Research** ([research/](research/))
Research documentation and reference materials.

- **[Marketing Monorepo Design](research/RESEARCH_MARKETING_MONOREPO_DESIGN_2026.md)** - Comprehensive research on agency monorepo architecture
- **[Research Topics](research/RESEARCH_TOPICS_2026.md)** - Additional research on security, testing, and AI workflows

---

## 🎯 Quick Start Guides

### **For New Developers**
1. Read **[Architecture Overview](architecture/ARCHITECTURE.md)** to understand the system
2. Review **[Multi-Tenant Security](security/MULTI_TENANT_SECURITY.md)** for security principles
3. Set up **[Local Supabase](operations/SUPABASE_LOCAL.md)** for development
4. Use **[AI Development Guide](guides/AI_DEVELOPMENT_GUIDE.md)** for AI-assisted development

### **For Client Onboarding**
1. Follow the **[Client Onboarding](guides/CLIENT_ONBOARDING.md)** guide
2. Configure **[Deployment](operations/DEPLOYMENT.md)** for the new client
3. Set up **[PostHog Analytics](operations/POSTHOG_DEPLOYMENT.md)** if needed
4. Verify **[Security](security/MULTI_TENANT_SECURITY.md)** implementation

### **For Operations Team**
1. Review **[Deployment Guide](operations/DEPLOYMENT.md)** for production setup
2. Configure **[Background Jobs](operations/BACKGROUND_JOBS.md)** for workflows
3. Monitor **[Versioning](development/VERSIONING.md)** for releases
4. Follow **[Governance](governance/GOVERNANCE.md)** for design system changes

---

## 🏗️ Platform Overview

The agency platform is a **multi-tenant monorepo** that serves multiple clients with isolated data and configurations while sharing common components and infrastructure.

### **Key Features**
- **Multi-tenant isolation** via Row-Level Security (RLS)
- **Shared design system** with client-specific tokens
- **Automated scaffolding** for rapid client onboarding
- **CI/CD integration** with comprehensive testing
- **Scalable architecture** supporting growth phases

### **Technology Stack**
- **Framework**: Next.js 16 with App Router
- **Database**: Supabase (PostgreSQL + Auth + Storage)
- **Styling**: Tailwind CSS v4 with design tokens
- **Package Manager**: pnpm with workspace management
- **Build System**: Turborepo for monorepo builds
- **Analytics**: PostHog for client tracking
- **Background Jobs**: Inngest for durable workflows

---

## 🔧 Common Tasks

### **Adding a New Client**
```bash
# Scaffold new client
pnpm scaffold

# Build design tokens
pnpm tokens:build

# Run RLS tests
supabase test db
```

### **Development Setup**
```bash
# Start all apps
pnpm dev

# Start specific app
pnpm turbo run dev --filter=@agency/[client-slug]

# Start local Supabase
npx supabase start
```

### **Security Verification**
```bash
# Check RLS policies
supabase test db

# Verify index usage
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -f supabase/verify-rls-indexes.sql
```

---

## 📞 Getting Help

### **Documentation Issues**
- Found outdated information? Check the **[Codebase Analysis](architecture/CODEBASE_ANALYSIS.md)** for known issues
- Need clarification? Start with the relevant guide in the **[Guides](guides/)** section

### **Technical Support**
- Security questions: Review **[Multi-Tenant Security](security/MULTI_TENANT_SECURITY.md)**
- Deployment issues: Check **[Deployment Guide](operations/DEPLOYMENT.md)**
- Development problems: Consult **[AI Development Guide](guides/AI_DEVELOPMENT_GUIDE.md)**

### **Contributing**
- Design system changes: Follow **[Governance](governance/GOVERNANCE.md)**
- Architecture decisions: Review **[Agency Direction](governance/PLAN_AGENCY_DIRECTION.md)**
- Research contributions: See **[Research](research/)** section

---

## 📈 Platform Metrics

### **Current Status**
- **Clients**: 2 prospective (riley-day-care, the-barber-cave)
- **Packages**: 7 shared packages (@agency/*)
- **Apps**: 4 applications (firm, agency-admin, 2 prospective clients)
- **Tables**: 7 database tables with RLS protection

### **Scaling Phases**
- **Phase 1** (0-50 clients): Single Supabase project
- **Phase 2** (50-200 clients): Redis cache, Nx if needed  
- **Phase 3** (200+ clients): Schema-per-tenant, dedicated projects

---

*This documentation is actively maintained. Last updated: March 2026*
