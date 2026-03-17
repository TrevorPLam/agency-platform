# Agency Platform

Multi-client marketing agency monorepo. Each client is isolated by tenant_id at the database layer (Row-Level Security). Shared code lives in packages/. Client-specific code lives in apps/clients/[slug]/.

## User-Information

- User has no formal software development experience or education. 
- User develops repositories 100% through agentic coding as a "solo-developer."
- User prefers best practices and highest standards. 
- User prefers up to date (2026) research conducted before task execution on proper implementation, best practices, and advanced coding patterns. 

## Task-Based Navigation

**For database work**: Read @.agents/database.md  
**For UI components**: Read @packages/ui/AGENTS.md  
**For client applications**: Read specific app AGENTS.md  
**For design tokens**: Read @packages/design-tokens/AGENTS.md  
**For security patterns**: Read @.agents/security.md  
**For testing**: Read @.agents/testing.md  

## Quick Commands

### Development
```bash
pnpm dev                    # Start all apps in watch mode
pnpm turbo run dev --filter=@agency/riley-day-care  # Start one app
```

### Build & Test
```bash
pnpm tokens:build           # Compile design tokens to CSS
supabase test db           # Run pgTAP RLS isolation tests
supabase start             # Start local Supabase (requires Docker)
```

### Code Quality
```bash
pnpm lint                  # ESLint + Prettier
pnpm type-check           # TypeScript strict mode check
```

## Core Architecture Rules

### Multi-Tenant Security
- **Never** use `user_metadata` for tenant_id. Always use `app_metadata`.
- **Never** put SUPABASE_SERVICE_ROLE_KEY in any NEXT_PUBLIC_ variable.
- **Never** connect to Supabase via Port 5432 — always use Port 6543.
- **Never** call Supabase directly from app code — always use @agency/database.

### Code Standards
- **Never** write `any` type. Use `unknown` and narrow, or define the type.
- **Never** add 'use client' unless genuinely needed for browser APIs or interactivity.
- **Never** import from one app into another. Use packages/.
- **Never** use tailwind.config.js — Tailwind v4 uses CSS @theme {} only.
- **Never** use theme() in CSS files — use var(--token-name) instead.

## Permission Boundaries

### ✅ Always do
- Read files, list directories
- Single file linting, type checking, formatting
- Unit tests on specific files
- Follow architecture rules above

### ⚠️ Ask first
- Package installations (pnpm add, npm install)
- Database schema changes
- Git operations (git push, git commit)
- Modifying CI/CD configuration
- Running full build or E2E test suites

### 🚫 Never do
- Commit secrets or API keys
- Edit node_modules/ or vendor/
- Bypass RLS policies
- Connect to Supabase on port 5432
- Import between apps

## File Structure

```
apps/
├── agency-admin/          # Port 3001 - Internal management
├── firm/                  # Port 3000 - Agency website
└── prospective-clients/   # Demo templates

packages/                  # Shared code
├── ui/                    # shadcn/ui components
├── database/              # Supabase client factories
├── design-tokens/         # W3C DTCG tokens
└── [other packages]

.agents/                   # Shared patterns and utilities
├── database.md           # Database-specific patterns
├── security.md           # Security guidelines
├── testing.md            # Testing patterns
└── deployment.md         # Deployment procedures

supabase/
├── migrations/            # Database schema changes
└── tests/                # pgTAP RLS tests
```

## Tech Stack

- **Next.js 16.1** with Turbopack (default, no flags needed)
- **React 19, TypeScript 5** strict mode
- **Tailwind CSS v4** (CSS-first, @import "tailwindcss", @theme {} for tokens)
- **pnpm 10** (catalog: protocol for versions, workspace:* for internal packages)
- **Turborepo 2.7** (turbo.json defines the task pipeline)
- **Supabase** (PostgreSQL + Auth + Storage) — Port 6543 (Supavisor), not 5432

## Progressive Documentation

For detailed conventions, see:
- `docs/TYPESCRIPT.md` - TypeScript patterns and strict mode rules
- `docs/TAILWIND.md` - CSS-first styling and design tokens
- `docs/DATABASE.md` - RLS patterns and multi-tenant security
- `docs/SECURITY.md` - Security guidelines and audit procedures
