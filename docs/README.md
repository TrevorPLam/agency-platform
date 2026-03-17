# Agency Platform Documentation

Welcome to the agency platform documentation. This guide provides comprehensive information about the multi-tenant agency monorepo architecture, development workflows, and operational procedures.

---

## 📚 Documentation Structure

### **🚀 Guides**
User-facing guides and workflows for common tasks.

- **[AI Development Guide](AI_DEVELOPMENT_GUIDE.md)** - Complete guide for AI coding agents working in the monorepo
- **[Client Onboarding](CLIENT_ONBOARDING.md)** - End-to-end process for onboarding new clients
- **[Riley Day Care Spec](riley-day-care-spec.md)** - Specific client requirements and implementation checklist
- **[Guide](GUIDE.md)** - Long-form agency technical guide (glossary, operations, DNS, tooling)

### **🏗️ Architecture**
System design, structure, and implementation status.

- **[Architecture Overview](ARCHITECTURE.md)** - High-level monorepo architecture and isolation layers
- **[Frontend Architecture](FRONTEND_ARCHITECTURE.md)** - Frontend-specific architecture patterns and implementation
- **[Documentation Confidence Assessment](DOCUMENTATION_CONFIDENCE_ASSESSMENT.md)** - Documentation quality and completeness metrics

### **🔒 Security**
Multi-tenant security implementation and verification.

- **[Multi-Tenant Security](MULTI_TENANT_SECURITY.md)** - Complete security model, RLS, and authentication
- **[Supabase Keys](SUPABASE_KEYS.md)** - Where to get keys (local and production); never commit keys
- **[Supply Chain Security](SUPPLY_CHAIN_SECURITY.md)** - SBOM, SLSA, artifact integrity
- **[Incident Response](INCIDENT_RESPONSE.md)** - Incident classification, response lifecycle, escalation

### **⚙️ Operations**
Deployment, infrastructure, and operational procedures.

- **[Deployment Guide](DEPLOYMENT.md)** - Vercel deployment strategies and cost considerations
- **[Background Jobs](BACKGROUND_JOBS.md)** - Inngest workflows and durable background processing
- **[PostHog Deployment](POSTHOG_DEPLOYMENT.md)** - Analytics setup and GDPR compliance
- **[Local Supabase](SUPABASE_LOCAL.md)** - Local development environment setup
- **[Operations Runbook](OPERATIONS_RUNBOOK.md)** - Backup, cost, communication, DORA, geo, benchmarks, artifacts
- **[Developer Operations](DEVELOPER_OPERATIONS.md)** - Development environment setup and workflows

### **🛠️ Development**
Development workflows, tools, and best practices.

- **[Versioning](VERSIONING.md)** - Semantic versioning and release procedures
- **[Task Template](TASK_TEMPLATE.md)** - Standardized task documentation template

### **📋 Governance**
Design system governance and strategic direction.

- **[Governance Model](GOVERNANCE.md)** - Design system roles and contribution workflow

### **🔬 Research**
Research documentation and reference materials.

- **[Research](RESEARCH.md)** - Research findings and reference materials

---

## 🎯 Quick Start Guides

### **For New Developers**
1. Read **[Architecture Overview](ARCHITECTURE.md)** to understand the system
2. Review **[Multi-Tenant Security](MULTI_TENANT_SECURITY.md)** for security principles
3. Set up **[Local Supabase](SUPABASE_LOCAL.md)** for development
4. Use **[AI Development Guide](AI_DEVELOPMENT_GUIDE.md)** for AI-assisted development

### **For Client Onboarding**
1. Follow the **[Client Onboarding](CLIENT_ONBOARDING.md)** guide
2. Configure **[Deployment](DEPLOYMENT.md)** for the new client
3. Set up **[PostHog Analytics](POSTHOG_DEPLOYMENT.md)** if needed
4. Verify **[Security](MULTI_TENANT_SECURITY.md)** implementation

### **For Operations Team**
1. Review **[Deployment Guide](DEPLOYMENT.md)** for production setup
2. Configure **[Background Jobs](BACKGROUND_JOBS.md)** for workflows
3. Monitor **[Versioning](VERSIONING.md)** for releases
4. Follow **[Governance](GOVERNANCE.md)** for design system changes

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

## Common Tasks

- **Day-to-day workflow:** See [CONTRIBUTING.md](../CONTRIBUTING.md) for local runbook, ports, and commands.
- **Adding a new client:** See [Client Onboarding](CLIENT_ONBOARDING.md).
- **Security verification:** See [Multi-Tenant Security](MULTI_TENANT_SECURITY.md) for RLS tests and verification steps.

---

## 📞 Getting Help

### **Documentation Issues**
- Found outdated information? Check **[Architecture](ARCHITECTURE.md)** and **[Frontend Architecture](FRONTEND_ARCHITECTURE.md)** for current structure
- Need clarification? Start with the relevant guide in the **[Guides](#-guides)** section

### **Technical Support**
- Security questions: Review **[Multi-Tenant Security](MULTI_TENANT_SECURITY.md)**
- Deployment issues: Check **[Deployment Guide](DEPLOYMENT.md)**
- Development problems: Consult **[AI Development Guide](AI_DEVELOPMENT_GUIDE.md)**

### **Contributing**
- Design system changes: Follow **[Governance](GOVERNANCE.md)**
- Architecture decisions: Review **[Architecture](ARCHITECTURE.md)** (§Strategic decisions)
- Research contributions: See **[Research](RESEARCH.md)**

---

## Platform Metrics

### Current Status

Update these numbers when adding apps, packages, or public tables.

- **Clients**: 3 total (1 production: riverside-hotel, 2 prospective: riley-day-care, the-barber-cave)
- **Packages**: 14 shared packages (@agency/*)
- **Apps**: 4 applications (firm, agency-admin, riverside-hotel, prospective-clients)
- **Tables**: 15 database migrations with RLS protection

### **Scaling Phases**
- **Phase 1** (0-50 clients): Single Supabase project
- **Phase 2** (50-200 clients): Redis cache, Nx if needed  
- **Phase 3** (200+ clients): Schema-per-tenant, dedicated projects

---

*This documentation is actively maintained. Last updated: March 2026*
