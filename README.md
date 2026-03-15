# Agency Platform

A multi-client marketing agency monorepo built with Next.js 16, Turborepo, and modern tooling for scalable client application development.

## 🏗️ Architecture

This is a **monorepo** using pnpm workspaces and Turborepo for efficient development and deployment across multiple client applications.

### Directory Structure

```
agency-platform/
├── apps/
│   ├── clients/           # Client-specific applications
│   │   └── riverside-hotel/  # First client app
│   └── agency-admin/      # Internal agency management
├── packages/              # Shared packages
│   ├── ui/               # Shared UI components (shadcn/ui)
│   ├── database/         # Supabase client factories
│   ├── analytics/        # PostHog analytics wrapper
│   ├── design-tokens/    # W3C DTCG token system
│   ├── typescript-config/ # Shared TypeScript configs
│   └── eslint-config/    # Shared ESLint configs
├── supabase/
│   ├── migrations/       # Database schema migrations
│   └── tests/database/   # Database tests
├── scripts/              # Build and utility scripts
├── docs/                 # Architecture documentation
└── .github/             # GitHub workflows and CODEOWNERS
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** 22.x LTS (use `nvm use 22`)
- **pnpm** 10.x (`npm install -g pnpm@latest`)
- **Docker Desktop** (for local Supabase)

### First Run

Repeat these steps **on each machine** where you develop (e.g. PC, laptop). Each environment has its own clone and `.env.local`; the repo is designed for multi-environment use.

1. **Clone and setup**
   ```bash
   git clone <repository-url>
   cd agency-platform
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

- `pnpm dev` - Start all apps in development mode
- `pnpm build` - Build all packages and apps
- `pnpm lint` - Run ESLint across the monorepo
- `pnpm test` - Run tests across all packages
- `pnpm type-check` - TypeScript type checking
- `pnpm tokens:build` - Build design token CSS files

## 🎨 Design System

This platform uses a **three-tier design token hierarchy** following W3C DTCG standards:

1. **Primitive tokens** - Raw values (colors, spacing)
2. **Semantic tokens** - Design intent (brand-primary, text-primary)
3. **Component tokens** - Component-specific overrides

Each client gets custom token compilation for brand consistency while sharing core components.

## 🔧 Technology Stack

- **Framework**: Next.js 16.1 with App Router
- **Monorepo**: Turborepo 2.7 + pnpm 10
- **Styling**: Tailwind CSS v4 with CSS variables
- **UI Components**: shadcn/ui (New York style)
- **Database**: Supabase (PostgreSQL + Auth + Storage)
- **Analytics**: PostHog
- **Background Jobs**: Inngest
- **Deployment**: Vercel

## 🏢 Multi-Tenant Architecture

- **Row-Level Security** ensures data isolation between clients
- **Tenant resolution** via hostname and middleware
- **Per-client branding** through design token system
- **Shared codebase** with client-specific customizations

## 📊 Development Workflow

1. **Feature development** in feature branches
2. **Code review** with automatic CODEOWNERS assignment
3. **Automated testing** and type checking
4. **Design token updates** automatically propagate to all apps
5. **Deployment** through Vercel with preview environments

## 🔐 Security

- **Environment variables** never committed to git
- **Service role keys** server-side only
- **Row-Level Security** on all database tables
- **Branch protection** on main branch
- **Dependency scanning** through GitHub security

## 📚 Documentation

- [CONTRIBUTING.md](./CONTRIBUTING.md) - Development guidelines
- [TOOLCHAIN.md](./TOOLCHAIN.md) - Tool versions and setup
- [docs/](./docs/) - Architecture decisions and guides

## 🤝 Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for detailed development guidelines, coding standards, and PR process.

## 📄 License

Private - All rights reserved to the agency and its clients.

---

**Built with ❤️ for scalable agency client delivery**
