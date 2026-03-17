# Agency Platform

<div align="center">

![Agency Platform Logo](https://placehold.co/320x120/1e293b/ffffff?text=Agency+Platform)

**Enterprise-grade multi-client marketing agency monorepo**

Built with Next.js 16, Turborepo, and modern tooling for scalable client application development.

[![License](https://img.shields.io/badge/license-Private-red)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D22.0.0-brightgreen)](https://nodejs.org/)
[![pnpm](https://img.shields.io/badge/pnpm-%3E%3D10.0.0-blue)](https://pnpm.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7+-blue)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16.1-black)](https://nextjs.org/)

</div>

## 🏗️ Architecture

This is a **monorepo** using pnpm workspaces and Turborepo for efficient development and deployment across multiple client applications. For directory structure and isolation layers, see [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

### 🎯 Design Principles

- **Security First** - Row-Level Security, tenant isolation, comprehensive threat modeling
- **Scalable Multi-Tenancy** - Database-level isolation with shared codebase
- **Developer Experience** - Hot reload, parallel builds, intelligent caching
- **Enterprise Ready** - Compliance frameworks, audit trails, automated governance
- **AI-Optimized** - Full repository visibility for AI agents and automation

## 🚀 Quick Start

**Prerequisites:** Node.js 22.x, pnpm 10.x, Docker Desktop (for local Supabase). See [TOOLCHAIN.md](TOOLCHAIN.md) for versions and install commands.

> **💡 Tip:** Repeat these steps **on each machine** where you develop. Each environment has its own clone and `.env.local`; the repo is designed for multi-environment use.

1. **Clone and setup**

   ```bash
   git clone <repository-url>
   cd <repository-root>   # e.g. firm or agency-platform — your clone directory name
   nvm use 22
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Environment setup**

   ```bash
   cp .env.local.example .env.local
   # Edit .env.local with your actual values (per machine; file is gitignored)
   ```

4. **Start development**
   ```bash
   pnpm dev
   ```

### Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start all apps in development mode |
| `pnpm build` | Build all packages and apps |
| `pnpm lint` | Run ESLint across the monorepo |
| `pnpm test` | Run tests across all packages |
| `pnpm type-check` | TypeScript type checking |
| `pnpm tokens:build` | Build design token CSS files |
| `pnpm supabase:start` | Start local Supabase instance |
| `pnpm supabase:test` | Run RLS isolation tests |

## 🎨 Design System

This platform uses a **three-tier design token hierarchy** following W3C DTCG standards (primitive, semantic, component tokens). Each client gets custom token compilation for brand consistency while sharing core components.

### Token Hierarchy

1. **Primitive Tokens** - Raw values (colors, spacing, typography)
2. **Semantic Tokens** - Intent-based tokens referencing primitives
3. **Component Tokens** - Per-component specific tokens
4. **Client Tokens** - Per-client brand customizations

> 📖 **See:** [docs/architecture/ARCHITECTURE.md](docs/architecture/ARCHITECTURE.md) and [docs/](docs/) for complete details.

## 🛠️ Technology Stack

| Category | Technology | Version | Purpose |
|-----------|------------|---------|---------|
| **Framework** | Next.js | 16.1 | React framework with App Router |
| **Language** | TypeScript | 5.7+ | Type-safe development |
| **Package Manager** | pnpm | 10.x | Workspace management |
| **Build System** | Turborepo | 2.7 | Monorepo orchestration |
| **Styling** | Tailwind CSS | v4 | Utility-first CSS |
| **Components** | shadcn/ui | Latest | Accessible component library |
| **Database** | Supabase | Latest | PostgreSQL + Auth + Storage |
| **Analytics** | PostHog | Latest | Product analytics |
| **Background Jobs** | Inngest | Latest | Durable workflows |
| **Deployment** | Vercel | Latest | Serverless hosting |

> 📖 **See:** [docs/README.md](docs/README.md) for platform overview and metrics.

## 🏢 Multi-Tenant Architecture

### Tenant Isolation Strategy

- **Database-Level Isolation** - Row-Level Security (RLS) on all tables
- **Tenant Resolution** - Hostname and middleware-based detection
- **Per-Client Branding** - Design token system customization
- **Shared Codebase** - Common components with client-specific configurations

### Security Features

- ✅ RLS policies on all database tables
- ✅ Tenant isolation at database layer
- ✅ Service role keys server-side only
- ✅ Comprehensive audit trails
- ✅ HIPAA-ready architecture for healthcare clients

> 📖 **See:** [docs/architecture/ARCHITECTURE.md](docs/architecture/ARCHITECTURE.md) and [SECURITY.md](SECURITY.md)

## 🔒 Security

### Security-First Approach

| Security Layer | Implementation | Status |
|----------------|----------------|--------|
| **Environment Variables** | Never committed to git | ✅ Enforced |
| **Service Role Keys** | Server-side only, never in NEXT_PUBLIC_* | ✅ Enforced |
| **Database Security** | RLS on all tables, tenant isolation | ✅ Verified |
| **Code Security** | Branch protection, dependency scanning | ✅ Automated |
| **Supply Chain** | SBOM generation, SLSA attestations | ✅ Implemented |
| **Threat Modeling** | 5 attack vectors documented | ✅ Comprehensive |

### Security Automation

- CI scans for service role key exposure
- Automated user_metadata usage detection
- Supashield RLS policy auditing
- pgTAP database isolation tests
- GitHub security vulnerability scanning

> 📖 **See:** [SECURITY.md](SECURITY.md) and [docs/security/SUPPLY_CHAIN_SECURITY.md](docs/security/SUPPLY_CHAIN_SECURITY.md)

## 📚 Documentation

### 🚀 Getting Started
- **[CONTRIBUTING.md](CONTRIBUTING.md)** — Development guidelines, local runbook, and contribution requirements
- **[docs/README.md](docs/README.md)** — Complete platform documentation and guides

### 🏗️ Architecture & Design
- **[docs/architecture/ARCHITECTURE.md](docs/architecture/ARCHITECTURE.md)** — Monorepo structure, isolation layers, and scaling phases
- **[docs/architecture/ATOMIC_DESIGN.md](docs/architecture/ATOMIC_DESIGN.md)** — Component hierarchy and design system

### 🔒 Security & Compliance
- **[SECURITY.md](SECURITY.md)** — Security model, threat vectors, and compliance frameworks
- **[docs/security/](docs/security/)** — Multi-tenant security, supply chain, incident response

### ⚙️ Operations & Tooling
- **[TOOLCHAIN.md](TOOLCHAIN.md)** — Tool versions and setup requirements
- **[docs/operations/](docs/operations/)** — Deployment, monitoring, and operational procedures

### 📋 Governance
- **[docs/governance/](docs/governance/)** — Design system governance and contribution workflows

## 🤝 Contributing

### Contribution Guidelines

We welcome contributions! Please follow these guidelines:

1. **Read First** - Review [CONTRIBUTING.md](CONTRIBUTING.md) for detailed development guidelines
2. **Security First** - Follow security practices in [SECURITY.md](SECURITY.md)
3. **Code Quality** - Use TypeScript strict mode, no `any` types
4. **Testing** - Add tests for new features, ensure existing tests pass
5. **Documentation** - Update relevant documentation for API changes

### Development Workflow

```bash
# 1. Fork and clone
git clone <your-fork-url>
cd agency-platform

# 2. Setup environment
pnpm install
cp .env.local.example .env.local

# 3. Create feature branch
git checkout -b feature/your-feature-name

# 4. Make changes and test
pnpm dev
pnpm lint
pnpm test
pnpm type-check

# 5. Submit pull request
git push origin feature/your-feature-name
```

## 📊 Project Status

### 🎯 Platform Metrics

| Metric | Current | Target |
|--------|---------|--------|
| **Clients** | 3 total (1 production, 2 prospective) | 50+ (Phase 1) |
| **Packages** | 14 shared packages (@agency/*) | 20+ |
| **Apps** | 4 applications | 10+ |
| **Database Tables** | 15 with RLS protection | 50+ |
| **Test Coverage** | 85%+ | 90%+ |
| **Build Performance** | <2min incremental | <1min |

### 🚀 Scaling Phases

- **Phase 1** (0-50 clients): Single Supabase project ✅ **Current**
- **Phase 2** (50-200 clients): Redis cache, Nx if needed 🔄 **Planned**
- **Phase 3** (200+ clients): Schema-per-tenant, dedicated projects 📋 **Future**

## 📄 License

**Private** - All rights reserved to the agency and its clients.

---

<div align="center">

**Built with ❤️ for scalable agency client delivery**

[📖 Documentation](docs/) • [🔒 Security](SECURITY.md) • [🤝 Contributing](CONTRIBUTING.md) • [🛠️ Toolchain](TOOLCHAIN.md)

</div>
