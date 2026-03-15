# The Solo Developer's Agency Monorepo Guide (2026 Edition)

**For:** Solo developers using Cursor and Windsurf, learning by doing  
**Stack:** Next.js 16.1 · Turborepo 2.7 · pnpm 10.x · Supabase · Tailwind CSS v4 · Style Dictionary v4 · shadcn/ui · TypeScript 5.x  
**Goal:** A multi-client marketing agency codebase that is secure, scalable, AI-assisted, and financially disciplined from day one

---

## Quick Reference: What This Builds

A single GitHub repository that hosts every client site your agency manages. Each client gets their own isolated branding, content, data, and deployment — but you maintain everything from one place. When you fix a bug in a shared component, it fixes it for every client simultaneously. When you onboard a new client, you run one command. When a security vulnerability is patched in a UI component, every client gets the fix automatically on the next deployment.

The architecture handles three client industries out of the box: healthcare (HIPAA-aware), e-commerce, and hospitality. Adding a fourth industry requires only configuration and content — no code branching.

---

## Table of Contents

1. [The Mental Model: Why a Monorepo](#1-the-mental-model-why-a-monorepo)
2. [2026 Stack Reference](#2-2026-stack-reference)
3. [Cost Map: Starting at Zero](#3-cost-map-starting-at-zero)
4. [Complete Directory Structure](#4-complete-directory-structure)
5. [Phase 1: Repository Foundation](#5-phase-1-repository-foundation)
6. [Phase 2: Shared Packages](#6-phase-2-shared-packages)
7. [Phase 3: Your First Client App](#7-phase-3-your-first-client-app)
8. [Phase 4: Design Tokens and Tailwind v4](#8-phase-4-design-tokens-and-tailwind-v4)
9. [Phase 5: Database and Multi-Tenant Auth](#9-phase-5-database-and-multi-tenant-auth)
10. [Phase 6: Row-Level Security (Concretely)](#10-phase-6-row-level-security-concretely)
11. [Phase 7: Background Jobs with Inngest](#11-phase-7-background-jobs-with-inngest)
12. [Phase 8: Analytics with PostHog](#12-phase-8-analytics-with-posthog)
13. [Phase 9: AI Tool Configuration](#13-phase-9-ai-tool-configuration)
14. [Phase 10: Vercel Deployment](#14-phase-10-vercel-deployment)
15. [Phase 11: CI/CD with GitHub Actions](#15-phase-11-cicd-with-github-actions)
16. [Security: Five Attack Vectors to Harden Against](#16-security-five-attack-vectors-to-harden-against)
17. [RLS Performance at Scale](#17-rls-performance-at-scale)
18. [Supabase Email Uniqueness Constraint](#18-supabase-email-uniqueness-constraint)
19. [Scaling Triggers and Decision Points](#19-scaling-triggers-and-decision-points)
20. [Client Onboarding Checklist](#20-client-onboarding-checklist)
21. [Quick Reference Appendix](#21-quick-reference-appendix)

---

## 1. The Mental Model: Why a Monorepo

### What you actually own

Before writing a line of code, understand what you are building. You are building a **platform**, not a collection of websites. The distinction matters because platforms have economies of scale that portfolios of separate sites do not.

When a client asks for a change to their booking form, you change it in a shared package. When a security vulnerability is patched in a UI component, every client gets the fix automatically on the next deployment. When you want to add an analytics feature to all hospitality clients simultaneously, you do it in one place.

A **monorepo** is a single Git repository containing multiple independent applications and shared packages. Turborepo is the tool that orchestrates it: it figures out what changed, only rebuilds what is affected, and caches the results so the same work is never done twice.

### The three axes of complexity

Your platform simultaneously manages three overlapping concerns.

**Multi-industry** means one codebase serves healthcare intake forms, day-care sites, and other verticals without treating each as a custom project. You achieve this through configuration and content — design tokens, CMS schemas — rather than code branching. The prospective (demo) `acme-health` app and the real client `riley-day-care` app consume identical shared components; they look completely different because they load different token files.

**Multi-client** means dozens of clients share infrastructure while remaining completely isolated from each other's data, branding, and domains. You achieve this through Row-Level Security (RLS) at the database layer and per-client deployment stamps at the Vercel layer. A user of one client's portal cannot — even in principle — read data belonging to another client, regardless of how they manipulate their session.

**Multi-site** means each client may have several properties: a marketing site, a landing page generator, a booking portal, a client dashboard. You achieve this through the workspace model — each property is an independent `app` in the monorepo, with its own Vercel deployment, its own domain, and its own environment variables.

### What fails without discipline

The most common failure mode in agency codebases is **shared-everything spaghetti**. It starts when you copy-paste one client's code to start a new client, then make local modifications to both. Three months later you have two completely different codebases masquerading as a shared platform. Fixing a bug requires touching both. Onboarding a third client means copying from whichever version looks cleaner.

The monorepo architecture makes this structurally impossible: shared code lives in `packages/`, client-specific code lives in `apps/clients/[slug]/`, and the boundary between them is enforced by pnpm workspace references. If you try to import from one client app into another, your linter stops the build.

### A note on learning by trial and error

This guide is written for someone who learns by doing, not by reading theory. Every section is structured as: here is what to do, here is the exact configuration, here is why it matters. When something breaks — and it will — the most useful debugging approach is to ask which of the five isolation layers the problem lives in: code boundary, database, cache, CI/CD, or deployment.

---

## 2. 2026 Stack Reference

These are the verified, production-stable versions as of March 2026. Do not use versions older than these; several have critical security patches.

| Layer | Tool | Version | Notes |
|---|---|---|---|
| **Monorepo Build** | Turborepo | 2.7.x | Composable config in `turbo.json` (December 2025) |
| **Package Manager** | pnpm | 10.x | `catalogMode: strict` requires v10.12.1+ |
| **Frontend Framework** | Next.js | 16.1.x | Turbopack stable for dev and build by default |
| **UI Library** | React | 19.x | Stable since December 2024 |
| **Language** | TypeScript | 5.x (strict) | Always use strict mode |
| **Styling** | Tailwind CSS | v4.x | CSS-first config; no `tailwind.config.js` |
| **Design Tokens** | Style Dictionary | v4.x | ESM-only; async API; W3C DTCG format |
| **Components** | shadcn/ui | Latest | Installed into `packages/ui` |
| **Database** | Supabase (PostgreSQL) | Latest | RLS-first; use Port 6543 (Supavisor) |
| **Auth** | Supabase Auth | Latest | `app_metadata` for tenant_id only |
| **CMS** | Sanity v3 | Latest | Shared project, tenant-aware datasets |
| **Background Jobs** | Inngest | v3.51+ | Checkpointing released December 2025 |
| **Analytics** | PostHog (self-hosted) | Latest | Hetzner CCX23 for GDPR compliance |
| **Error Tracking** | Sentry | Latest | Tagged per tenant |
| **Deployment** | Vercel | — | One project per client app (or single project with middleware — see §14) |
| **Node.js** | 22.x LTS | 22.x | Required for Next.js 16 and Turborepo 2.7 |

### What changed from 2025 documentation

**Next.js 16** (October 2025) made Turbopack the default for both `next dev` and `next build`. You no longer need `--turbopack` or `--turbo` flags. Custom webpack configurations will cause build failures — migrate them or add `--webpack` to opt out explicitly.

The `"use cache"` directive is stable in Next.js 16 and replaces the implicit caching model from earlier versions. All dynamic code executes at request time by default; you opt into caching explicitly with `"use cache"` on pages, components, or functions. This is a significant mental model shift from Next.js 15.

**Turborepo 2.7** (December 2025) introduced Composable Configuration, allowing `turbo.json` files to extend reusable base configurations. This eliminates significant duplication in multi-app monorepos.

**Tailwind CSS v4** replaced JavaScript config entirely with a CSS-first approach. Design tokens live inside `@theme {}` blocks in CSS. The old `tailwind.config.js` is incompatible — remove it completely.

**Style Dictionary v4** is now ESM-only (add `"type": "module"` to package.json), all build methods are async, and all reference utilities moved to `'style-dictionary/utils'`. The W3C Design Token Community Group (DTCG) format is auto-detected when you set `usesDtcg: true`.

**Inngest v3.51+** introduced Checkpointing (December 2025), which achieves near-zero inter-step latency for AI agent workflows by executing steps eagerly and sending checkpoint messages asynchronously.

**Supabase replaced PgBouncer with Supavisor.** Always connect via Port `6543` (transaction pooler) from serverless Next.js functions. Port `5432` (direct connection) will exhaust Postgres connection limits under concurrent Lambda execution.

---

## 3. Cost Map: Starting at Zero

Understanding the cost structure before you deploy your first client prevents surprises. The model below is accurate as of March 2026.

### Development phase ($0/month)

While building and testing without real users, you pay nothing. Two Supabase free projects cover production and staging databases. Vercel's free tier covers all preview deployments. GitHub's free tier covers private repositories. pnpm, Turborepo, and all npm packages are free.

The Supabase free tier pauses projects after 7 days of inactivity. For staging this is acceptable — resume it before testing. For anything client-facing, you need the paid plan.

### First client live (approximately $45/month)

| Service | Monthly Cost | When You Need It |
|---|---|---|
| Supabase Pro (1 project) | $25 | First client live |
| Vercel Pro | $20 | Custom domains, analytics, team access |
| Sentry Developer | $0 | Error monitoring (free tier) |
| GitHub Free | $0 | Source control |
| **Total: first client** | **~$45/month** | |

### Five to ten clients (approximately $60–100/month)

| Service | Monthly Cost | Notes |
|---|---|---|
| Supabase Pro | $25 | Still one project; all clients on shared RLS |
| Vercel Pro | $20 | Shared across all client projects |
| PostHog (self-hosted Hetzner CCX23) | ~$34 | Post-April 2026 pricing; EU data residency |
| Sentry Team | $0–$26 | Upgrade when free tier is insufficient |
| **Total: 5–10 clients** | **~$60–$105/month** | |

### HIPAA healthcare clients (additional $100+/month per client)

Any HIPAA-covered healthcare client requires a dedicated Supabase project. Each Supabase Pro project at minimum is $25/month, plus the compute add-on needed for HIPAA workloads ($75–100/month for dedicated compute). Budget $100–125/month per HIPAA client in infrastructure cost before adding your margin.

### The $25/month ceiling

The shared RLS architecture means your database cost does not scale linearly with client count. Ten clients on a shared Supabase Pro project costs the same as one client: $25/month. You only add cost when you add HIPAA clients, exceed 8 GB of database storage, or exceed 100,000 monthly active users.

### Critical pricing cliff events

These are the specific thresholds where costs jump non-linearly. Understanding them now prevents expensive surprises later.

**Cliff 1 — Vercel Pro → Enterprise at 9 clients.** The Pro plan charges $250/month per project above 2. At 8 clients: $60 seats + $1,500 projects = $1,560. At 9 clients: $60 + $1,750 = $1,810 — which exceeds Vercel's Enterprise minimum of $1,667/month. Every agency running one Vercel project per client is effectively on Enterprise pricing from client #9 onward, whether they sign an Enterprise contract or not. See §14 for the middleware optimization that eliminates this cliff entirely.

**Cliff 2 — GitHub Actions free quota at 5–25 clients.** Full monorepo builds (≈18 min) exhaust the 3,000 free minutes at 5 clients. Affected-only CI (≈4 min per run using `--affected`) pushes that to 25 clients — a 5× runway extension for free.

**Cliff 3 — Sanity document limit at ~125 clients.** The Growth plan includes 25,000 documents. At 200 docs/client, the limit hits at 125 clients, triggering a $299/50K document add-on. Plan for this well in advance.

**Cliff 4 — Supabase MAU overflow.** The shared Pro project includes 100,000 monthly active users. At 1,000 MAU/client, overflow begins at 100 clients and escalates at $0.00325/MAU. At 200 high-traffic clients: +$325/month in MAU overages alone.

**Cliff 5 — Inngest free → Pro at ~20 clients.** At 5,000 workflow steps/client/month, the 100,000 free-tier threshold exhausts at 20 clients, forcing a hard jump to the Pro tier at $75/month.

### Per-client marginal cost at scale

| Scenario | 1 client | 10 clients | 50 clients | 200 clients |
|---|---|---|---|---|
| 1K page views/client — Total/month | $141 | $1,760 | $1,940 | $2,686 |
| 1K page views/client — per-client cost | $141 | $176 | **$39** | **$13** |
| 100K page views/client — Total/month | $141 | $1,764 | $2,477 | $6,057 |
| 100K page views/client — per-client cost | $141 | $176 | **$50** | **$30** |

The dramatic per-client cost drop from $176 → $39 (1K PV, 10→50 clients) happens because fixed Vercel and Sanity seat costs amortize across more clients. At high traffic, Supabase MAU overages dominate beyond 50 clients and re-inflate the per-client cost.

---

## 4. Complete Directory Structure

Build toward this incrementally. You do not create everything on day one, but knowing the destination prevents structural mistakes early.

```
agency-platform/
├── .cursor/
│   └── rules/                          # Cursor AI rules (one .mdc file per concern)
│       ├── base.mdc                    # Always applied — stack, conventions
│       ├── database.mdc                # Auto-attached to **/supabase/**
│       ├── rls.mdc                     # Auto-attached to **/migrations/**
│       ├── frontend.mdc                # Auto-attached to apps/**
│       └── tokens.mdc                  # Auto-attached to packages/design-tokens/**
├── .windsurf/
│   └── rules/
│       └── monorepo.md                 # Windsurf Cascade rules
├── .windsurfrules                      # Windsurf root-level rules
├── .github/
│   ├── CODEOWNERS                      # Ownership rules for protected packages
│   └── workflows/
│       ├── ci.yml                      # Build, lint, type-check, RLS tests on PRs
│       └── deploy.yml                  # Database migrations on merge to main
├── apps/
│   ├── agency-admin/                   # Internal dashboard (your control panel)
│   │   ├── app/
│   │   ├── package.json
│   │   └── next.config.ts
│   ├── firm/                            # Agency marketing site (broad: form, blogs, etc.)
│   ├── prospective-clients/             # Demo/test only
│   │   └── acme-health/                # Prospective (demo) client (slug: acme-health)
│   │       ├── app/
│   │       ├── tokens/
│   │       ├── package.json
│   │       └── next.config.ts
│   └── clients/                        # Real clients only
│       ├── riley-day-care/             # First real client (Day Care Template)
│       │   ├── app/
│       │   ├── tokens/
│       │   ├── package.json
│       │   └── next.config.ts
│       └── [slug]/                     # Pattern for every new real client
├── packages/
│   ├── ui/                             # Shared shadcn/ui component library
│   │   ├── src/
│   │   │   ├── components/             # shadcn primitives + custom composites
│   │   │   └── index.ts
│   │   └── package.json
│   ├── design-tokens/                  # Style Dictionary v4 token source + compiler
│   │   ├── tokens/
│   │   │   ├── primitive/
│   │   │   │   ├── color.json          # Raw hex/oklch palette
│   │   │   │   └── spacing.json        # Raw spacing primitives
│   │   │   ├── semantic/
│   │   │   │   ├── color.json          # Semantic aliases (→ primitives)
│   │   │   │   └── spacing.json
│   │   │   ├── component/
│   │   │   │   └── button.json         # Component-level tokens (→ semantic)
│   │   │   ├── clients/
│   │   │   │   ├── acme-health.json    # Prospective client (apps/prospective-clients/)
│   │   │   │   └── riley-day-care.json # Real client (apps/clients/)
│   │   │   └── _base.json              # Primitive palette (shared)
│   │   ├── sd.config.ts                # Style Dictionary v4 config
│   │   └── package.json
│   ├── database/                       # Supabase client, types, RLS helpers
│   │   ├── src/
│   │   │   ├── client.ts               # Typed Supabase client factory
│   │   │   ├── middleware.ts           # Tenant context injection for middleware.ts
│   │   │   ├── auth.ts                 # Email aliasing + user creation helpers
│   │   │   └── types.ts                # Generated database types (supabase gen)
│   │   └── package.json
│   ├── analytics/                      # PostHog abstraction (tenant-aware)
│   │   ├── src/
│   │   │   ├── client.ts               # Browser PostHog client
│   │   │   ├── server.ts               # Server-side event capture
│   │   │   └── index.ts
│   │   └── package.json
│   ├── booking/                        # Embeddable booking widget
│   │   ├── src/
│   │   │   ├── types/config.ts
│   │   │   ├── schema/config.schema.ts
│   │   │   ├── widget/
│   │   │   └── index.tsx
│   │   └── package.json
│   ├── typescript-config/              # Shared tsconfig.json presets
│   │   ├── base.json
│   │   ├── nextjs.json
│   │   └── package.json
│   └── eslint-config/                  # Shared ESLint config
│       ├── index.js
│       └── package.json
├── supabase/
│   ├── migrations/                     # All database migrations (version-controlled)
│   │   ├── 001_tenants.sql
│   │   ├── 002_rls_policies.sql
│   │   └── 003_audit_log.sql
│   ├── tests/
│   │   └── database/
│   │       ├── 000-setup-test-hooks.sql
│   │       ├── 00-rls-coverage.sql
│   │       ├── 01-tenant-isolation.sql
│   │       ├── 02-role-hierarchy.sql
│   │       └── 03-plan-limits.sql
│   └── config.toml
├── scripts/
│   └── scaffold-client.ts              # New client scaffolding script
├── turbo.json                          # Task pipeline configuration
├── pnpm-workspace.yaml                 # Workspace + catalog definition
├── package.json                        # Root package (private, scripts only)
├── tsconfig.json                       # Root TypeScript config (references only)
├── .gitignore
├── .env.local.example                  # Template for local environment variables
└── .github/CODEOWNERS
```

### Template and client layout (Option A)

- **Real clients** live under `apps/clients/` (e.g. `riley-day-care`). **Prospective (demo) clients** live under `apps/prospective-clients/` (e.g. `acme-health`). The scaffold script (`pnpm scaffold`) asks whether the new app is prospective or real and creates the app in the correct directory.
- The **first real client** is Riley Day Care (`apps/clients/riley-day-care`). It serves as the **Day Care Template**: the scaffold uses it as the source when creating new client apps. Future day-care-style clients are created by running `pnpm scaffold` and choosing "real" client; the script copies from `riley-day-care` and substitutes slug/name. A dedicated "day care" scaffold variant can be added later if needed.
- See `docs/DAY_CARE_TEMPLATE.md` for how to create new day-care-style clients.

---

## 5. Phase 1: Repository Foundation

### Prerequisites

Install these before starting. Exact versions matter.

```bash
# Node.js 22 LTS via nvm
nvm install 22
nvm use 22
node --version   # should be 22.x.x

# pnpm 10
npm install -g pnpm@latest
pnpm --version   # should be 10.x.x

# Turborepo
pnpm add -g turbo
turbo --version  # should be 2.7.x

# Supabase CLI
npm install -g supabase
supabase --version
```

### Initialise the repository

```bash
mkdir agency-platform
cd agency-platform
git init
pnpm init
```

### `pnpm-workspace.yaml`

This is the most important configuration file in the repository. It defines which folders are workspaces and centralises all dependency versions in a catalog so no two packages can accidentally use different React versions.

```yaml
# pnpm-workspace.yaml
packages:
  - 'apps/**'
  - 'packages/**'

# The catalog centralises all shared dependency versions.
# Every workspace references these as "catalog:" instead of writing a version.
# catalogMode: strict means pnpm add will ERROR if you try to install
# something not in the catalog — preventing accidental version drift.
catalog:
  # Core framework
  next: ^16.1.0
  react: ^19.0.0
  react-dom: ^19.0.0

  # TypeScript
  typescript: ^5.7.0
  '@types/react': ^19.0.0
  '@types/react-dom': ^19.0.0
  '@types/node': ^22.0.0

  # Styling
  tailwindcss: ^4.1.0
  '@tailwindcss/postcss': ^4.1.0

  # Design tokens
  'style-dictionary': ^4.0.0

  # Database
  '@supabase/supabase-js': ^2.49.0
  '@supabase/ssr': ^0.6.0

  # Background jobs
  inngest: ^3.51.0

  # Validation
  zod: ^3.25.0

  # Utilities
  clsx: ^2.1.1
  'tailwind-merge': ^3.0.0

  # Dev tooling
  eslint: ^9.0.0
  prettier: ^3.4.0
  vitest: ^3.0.0

catalogMode: strict
cleanupUnusedCatalogs: true
```

### Root `package.json`

The root package is private — it is never published. It only defines scripts and dev dependencies that apply to the entire repository.

```json
{
  "name": "agency-platform",
  "version": "0.0.0",
  "private": true,
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "lint": "turbo run lint",
    "test": "turbo run test",
    "type-check": "turbo run type-check",
    "tokens:build": "turbo run tokens:build --filter=@agency/design-tokens",
    "scaffold": "tsx scripts/scaffold-client.ts"
  },
  "devDependencies": {
    "turbo": "catalog:",
    "typescript": "catalog:",
    "tsx": "^4.19.0"
  },
  "packageManager": "pnpm@10.12.1"
}
```

### `turbo.json`

Turborepo's task pipeline. A `build` task depends on all upstream `build` tasks completing first (`"dependsOn": ["^build"]`). The `dev` task has no dependencies and runs in watch mode.

```json
{
  "$schema": "https://turbo.build/schema.json",
  "ui": "tui",
  "tasks": {
    "build": {
      "dependsOn": ["^build", "tokens:build"],
      "inputs": ["$TURBO_DEFAULT$", ".env*"],
      "outputs": [".next/**", "!.next/cache/**", "dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "dependsOn": ["^build"]
    },
    "type-check": {
      "dependsOn": ["^build"]
    },
    "test": {
      "dependsOn": ["^build"],
      "outputs": ["coverage/**"]
    },
    "tokens:build": {
      "inputs": ["tokens/**/*.json"],
      "outputs": ["dist/**/*.css"]
    }
  }
}
```

### Root `tsconfig.json`

The root TypeScript config uses project references — it is a coordination file, not a compilation file.

```json
{
  "compilerOptions": {
    "composite": false,
    "skipLibCheck": true
  },
  "files": [],
  "references": [
    { "path": "packages/ui" },
    { "path": "packages/database" },
    { "path": "packages/design-tokens" },
    { "path": "packages/analytics" },
    { "path": "packages/booking" }
  ]
}
```

### `.gitignore`

```
# Dependencies
node_modules/
.pnpm-store/

# Build outputs
.next/
dist/
out/

# Environment variables — NEVER commit these
.env.local
.env*.local

# Turborepo cache
.turbo/

# Generated token CSS files
apps/clients/*/tokens/*.css

# Supabase
supabase/.branches/
supabase/.temp/

# Misc
.DS_Store
*.tgz
```

### `.env.local.example`

Commit this file — it is a template. Never commit the actual `.env.local`.

```bash
# Copy this file to .env.local and fill in your values.
# NEXT_PUBLIC_ variables are safe to expose to the browser.
# All other variables are server-side secrets.

NEXT_PUBLIC_SUPABASE_URL=https://[your-project].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[anon key from Supabase dashboard]
SUPABASE_SERVICE_ROLE_KEY=[service role key — NEVER public, NEVER NEXT_PUBLIC_]

NEXT_PUBLIC_POSTHOG_KEY=[PostHog project key for this client]
NEXT_PUBLIC_POSTHOG_HOST=https://posthog.yourdomain.com

NEXT_PUBLIC_TENANT_SLUG=riley-day-care

# For Inngest background jobs
INNGEST_SIGNING_KEY=[from Inngest dashboard]
INNGEST_EVENT_KEY=[from Inngest dashboard]
```

### `.github/CODEOWNERS`

```
# Shared packages require review from the platform owner (you)
/packages/database/   @your-github-username
/packages/ui/         @your-github-username
/supabase/migrations/ @your-github-username

# Client apps — you own all of them as a solo developer
/apps/ @your-github-username
```

### `scripts/scaffold-client.ts`

Run with `pnpm scaffold`. This creates a new client app from template with all the correct wiring.

```typescript
import { mkdirSync, writeFileSync, copyFileSync } from 'fs'
import { join } from 'path'
import { createInterface } from 'readline'

const rl = createInterface({ input: process.stdin, output: process.stdout })

const ask = (question: string) =>
  new Promise<string>((resolve) => rl.question(question, resolve))

async function main() {
  console.log('\n🏗  Agency Platform — Client Scaffolder\n')

  const name = await ask('Client display name (e.g. Riley Day Care): ')
  const slug = await ask('Client slug (e.g. riley-day-care): ')
  const industry = await ask('Industry (healthcare/ecommerce/hospitality/general): ')
  const domain = await ask('Production domain (e.g. rileydaycare.com): ')

  rl.close()

  const appDir = join(__dirname, '../apps/clients', slug)
  const tokenDir = join(__dirname, '../packages/design-tokens/tokens/clients')

  // Create app directory
  mkdirSync(join(appDir, 'app'), { recursive: true })
  mkdirSync(join(appDir, 'tokens'), { recursive: true })

  // package.json
  writeFileSync(join(appDir, 'package.json'), JSON.stringify({
    name: `@agency/${slug}`,
    version: '0.0.0',
    private: true,
    scripts: {
      dev: 'next dev --turbopack',
      build: 'next build',
      start: 'next start',
      lint: 'next lint',
      'type-check': 'tsc --noEmit',
    },
    dependencies: {
      '@agency/ui': 'workspace:*',
      '@agency/database': 'workspace:*',
      '@agency/analytics': 'workspace:*',
      next: 'catalog:',
      react: 'catalog:',
      'react-dom': 'catalog:',
    },
    devDependencies: {
      '@agency/typescript-config': 'workspace:*',
      '@agency/eslint-config': 'workspace:*',
      typescript: 'catalog:',
      '@types/react': 'catalog:',
      '@types/node': 'catalog:',
      tailwindcss: 'catalog:',
      '@tailwindcss/postcss': 'catalog:',
    },
  }, null, 2))

  // tsconfig.json
  writeFileSync(join(appDir, 'tsconfig.json'), JSON.stringify({
    extends: '@agency/typescript-config/nextjs.json',
    compilerOptions: {
      baseUrl: '.',
      paths: { '@/*': ['./src/*'] },
    },
    include: ['next-env.d.ts', '**/*.ts', '**/*.tsx', '.next/types/**/*.ts'],
    exclude: ['node_modules'],
  }, null, 2))

  // next.config.ts
  writeFileSync(join(appDir, 'next.config.ts'), `import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: ['@agency/ui', '@agency/database', '@agency/analytics'],
}

export default nextConfig
`)

  // Token file
  writeFileSync(join(tokenDir, `${slug}.json`), JSON.stringify({
    client: slug,
    name,
    domain,
    industry,
    color: {
      'brand-primary': '#000000',
      'brand-secondary': '#666666',
      'text-default': '#1a1a1a',
      'text-muted': '#6b7280',
      background: '#ffffff',
      surface: '#f9fafb',
    },
    font: {
      sans: '"Inter", sans-serif',
      display: '"Inter", sans-serif',
    },
  }, null, 2))

  console.log(`\n✅ Scaffolded @agency/${slug}`)
  console.log(`\nNext steps:`)
  console.log(`  1. Edit packages/design-tokens/tokens/clients/${slug}.json with brand colours`)
  console.log(`  2. Run: pnpm tokens:build`)
  console.log(`  3. Add row to Supabase tenants table with slug "${slug}"`)
  console.log(`  4. Create Vercel project pointing to apps/clients/${slug}`)
}

main().catch(console.error)
```

---

## 6. Phase 2: Shared Packages

### `packages/typescript-config`

Every other package extends one of these configs. Create this first; everything else depends on it.

**`packages/typescript-config/package.json`**
```json
{
  "name": "@agency/typescript-config",
  "version": "0.0.0",
  "private": true,
  "license": "MIT"
}
```

**`packages/typescript-config/base.json`**
```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "compilerOptions": {
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "moduleResolution": "bundler",
    "target": "ES2022",
    "lib": ["ES2022"],
    "resolveJsonModule": true,
    "isolatedModules": true
  }
}
```

**`packages/typescript-config/nextjs.json`**
```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "extends": "./base.json",
  "compilerOptions": {
    "plugins": [{ "name": "next" }],
    "module": "ESNext",
    "jsx": "preserve",
    "lib": ["ES2022", "dom", "dom.iterable"],
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

### `packages/eslint-config`

**`packages/eslint-config/index.js`**
```js
module.exports = {
  extends: [
    'next/core-web-vitals',
    'plugin:@typescript-eslint/recommended',
  ],
  rules: {
    // Prevents accidental imports from the wrong package boundary.
    // Packages must never import from apps — it reverses the dependency graph.
    'no-restricted-imports': ['error', {
      patterns: [
        {
          group: ['../apps/**'],
          message: 'Packages must not import from apps. Invert the dependency.'
        }
      ]
    }]
  }
}
```

### `packages/ui` (shadcn/ui component library)

This package is where all shared UI components live. shadcn/ui components are copied — not installed as a dependency — into this package, not into individual apps. Every client app gets the same component code; appearance is customised via design tokens.

**`packages/ui/package.json`**
```json
{
  "name": "@agency/ui",
  "version": "0.0.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "build": "tsc",
    "lint": "eslint src/"
  },
  "dependencies": {
    "clsx": "catalog:",
    "tailwind-merge": "catalog:"
  },
  "devDependencies": {
    "@agency/typescript-config": "workspace:*",
    "@agency/eslint-config": "workspace:*",
    "typescript": "catalog:",
    "react": "catalog:",
    "react-dom": "catalog:"
  },
  "peerDependencies": {
    "react": "catalog:",
    "react-dom": "catalog:"
  }
}
```

**`packages/ui/src/lib/utils.ts`**
```ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

// cn() is the standard shadcn utility for merging Tailwind classes safely.
// Use it on every component's className prop.
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

To initialise shadcn components into this package:
```bash
cd packages/ui
pnpm dlx shadcn@latest init
# When prompted, confirm components go into src/components
```

### `packages/database`

This package wraps Supabase and makes it type-safe. Nothing outside this package ever calls Supabase directly. This makes testing and migration significantly easier.

**`packages/database/src/client.ts`**
```ts
import { createServerClient } from '@supabase/ssr'
import type { Database } from './types'

// The tenant context must always come from app_metadata — never from
// user_metadata (which the user can modify themselves).
export function createSupabaseServerClient(cookieStore: {
  get: (name: string) => { value: string } | undefined
}) {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          // Returns cookies for the server-side session
          return Object.keys(cookieStore).map(name => ({
            name,
            value: cookieStore.get(name)?.value ?? '',
          }))
        },
        setAll() {
          // Cookie mutations happen in middleware
        },
      },
    }
  )
}

export function createSupabaseBrowserClient() {
  const { createBrowserClient } = require('@supabase/ssr')
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// NEVER export a service role client from this package.
// The service role key belongs only in server-side environment variables
// and only in specific admin functions that explicitly need it.
```

**`packages/database/src/middleware.ts`**

This module handles tenant resolution in your Next.js `middleware.ts` file. It matches the incoming request's hostname against the tenants table to identify which client this request is for.

```ts
import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

export async function resolveTenantFromRequest(
  request: NextRequest
): Promise<string | null> {
  // In production: resolve by domain
  // In development: resolve by NEXT_PUBLIC_TENANT_SLUG env var
  if (process.env.NODE_ENV === 'development') {
    return process.env.NEXT_PUBLIC_TENANT_SLUG ?? null
  }

  const hostname = request.headers.get('host')?.split(':')[0] ?? ''

  // Use service role for tenant lookup — this is infrastructure code,
  // not user data access, so RLS bypass is appropriate here.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  )

  const { data } = await supabase
    .from('tenants')
    .select('slug')
    .eq('domain', hostname)
    .single()

  return data?.slug ?? null
}
```

**`packages/database/src/auth.ts`**
```ts
import { createClient } from '@supabase/supabase-js'

// Creates the admin (service role) client.
// This bypasses RLS entirely — only use server-side for admin operations.
function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function assignUserToTenant(userId: string, tenantId: string) {
  const supabaseAdmin = getAdminClient()

  const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
    app_metadata: { tenant_id: tenantId }
  })

  if (error) {
    throw new Error(`Failed to assign tenant: ${error.message}`)
  }
}

// For the email uniqueness constraint workaround — see §18 for full explanation.
export async function createUserForTenant({
  realEmail,
  password,
  tenantId,
  tenantSlug,
}: {
  realEmail: string
  password: string
  tenantId: string
  tenantSlug: string
}) {
  const supabaseAdmin = getAdminClient()
  const [localPart, domain] = realEmail.split('@')
  const aliasEmail = `${localPart}+${tenantSlug}@${domain}`

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email: aliasEmail,
    password,
    app_metadata: {
      tenant_id: tenantId,
      real_email: realEmail,
    },
    email_confirm: true,
  })

  if (error) throw error

  await supabaseAdmin.from('customer_auth_mappings').insert({
    real_email: realEmail,
    auth_email: aliasEmail,
    tenant_id: tenantId,
    user_id: data.user.id,
  })

  return data.user
}
```

### `packages/analytics`

A tenant-aware PostHog abstraction. Every event is automatically tagged with the tenant identifier, preventing cross-tenant data pollution in your analytics.

**`packages/analytics/src/client.ts`**
```ts
'use client'

import posthog from 'posthog-js'

let initialised = false

export function initAnalytics(tenantSlug: string) {
  if (initialised || typeof window === 'undefined') return
  initialised = true

  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://app.posthog.com',
    // Tag every event with the tenant identifier.
    // This lets you filter analytics per client in PostHog.
    loaded: (ph) => {
      ph.register({ tenant: tenantSlug })
      if (process.env.NODE_ENV === 'development') {
        ph.debug()
      }
    },
    capture_pageview: true,
    capture_pageleave: true,
    // GDPR: Disable IP capture if required for EU clients
    // persistence: 'localStorage+cookie',
  })
}

export function captureEvent(
  event: string,
  properties?: Record<string, unknown>
) {
  if (typeof window !== 'undefined') {
    posthog.capture(event, properties)
  }
}

export function identifyUser(userId: string, traits?: Record<string, unknown>) {
  if (typeof window !== 'undefined') {
    posthog.identify(userId, traits)
  }
}
```

**`packages/analytics/src/server.ts`**
```ts
// Server-side PostHog event capture for Server Actions and Route Handlers.
// Uses PostHog's Node.js client to capture events without a browser.
import { PostHog } from 'posthog-node'

let serverClient: PostHog | null = null

function getServerClient(): PostHog {
  if (!serverClient) {
    serverClient = new PostHog(
      process.env.NEXT_PUBLIC_POSTHOG_KEY!,
      {
        host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://app.posthog.com',
        flushAt: 20,
        flushInterval: 10000,
      }
    )
  }
  return serverClient
}

export function captureServerEvent(
  distinctId: string,
  event: string,
  properties: Record<string, unknown> & { tenant: string }
) {
  getServerClient().capture({ distinctId, event, properties })
}
```

---

## 7. Phase 3: Your First Client App

### Creating a client app

From the repository root, use the scaffold script (recommended) or create manually:

```bash
pnpm scaffold
# Choose real client → template is apps/clients/riley-day-care
# Or for a demo: choose prospective → creates under apps/prospective-clients/[slug]
```

To create a client app manually (or run `pnpm scaffold` which does this automatically):

**`apps/clients/riley-day-care/next.config.ts`** (or `apps/clients/[slug]/` for a new real client)
```ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Turbopack is the default in Next.js 16 — no flags needed.
  // The React Compiler is opt-in. Enable when ready.
  // reactCompiler: true,

  // transpilePackages tells Next.js to process these workspace packages
  // through its bundler rather than treating them as pre-compiled externals.
  transpilePackages: ['@agency/ui', '@agency/database', '@agency/analytics'],
}

export default nextConfig
```

**`apps/clients/riley-day-care/src/app/globals.css`** (or `[slug].css` for a new client)
```css
/* 1. Import Tailwind v4 — this replaces the three @tailwind directives from v3 */
@import "tailwindcss";

/* 2. Import the compiled token file for this client.
      This file is generated by `pnpm tokens:build` from the JSON source in
      packages/design-tokens/tokens/clients/riley-day-care.json
      It defines @theme {} blocks that Tailwind uses to generate utility classes. */
@import "../../tokens/riley-day-care.css";
```

**`apps/clients/riley-day-care/src/middleware.ts`** (or `apps/clients/[slug]/` for a new client)
```ts
import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Refresh the Supabase session for every request.
  // This is required for Server Components to access auth state.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  await supabase.auth.getUser()

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
```

---

## 8. Phase 4: Design Tokens and Tailwind v4

### The mental model shift in Tailwind v4

Tailwind v4 eliminated the JavaScript configuration file entirely. Your design decisions now live in CSS using `@theme {}` blocks. This is a significant change from v3.

In v3: `tailwind.config.js` → JavaScript object → Tailwind utilities  
In v4: `@theme {}` in CSS → CSS custom properties → Tailwind utilities

When you write `--color-brand-primary: #2d6a4f` inside `@theme {}`, Tailwind automatically generates `bg-brand-primary`, `text-brand-primary`, `border-brand-primary`, and every other colour utility class. Your design tokens *are* your Tailwind customisation — there is nothing else to configure.

### Three @theme modes and when to use each

`@theme {}` (default) defines CSS custom properties at `:root`. Tailwind generates utilities that reference the variable, meaning you can override the variable in `.dark {}` and the utility class responds to the change.

`@theme inline {}` embeds the resolved value directly into the utility at usage site. This is slightly more efficient but is not cascade-overridable. Use it for semantic tokens that alias primitives.

`@theme static {}` forces all variables into the compiled output even if no utility class uses them. Use this for tokens consumed by non-Tailwind code (native mobile apps, vanilla CSS in third-party embeds).

### Token architecture: three tiers

Tokens follow a three-tier hierarchy. This prevents accidental coupling between low-level colour decisions and component-level usage.

**Tier 1 — Primitives:** Raw values. `--color-navy-500: oklch(0.45 0.12 240)`. These live in `:root`, not `@theme`, so Tailwind generates no utility classes for them. They are the foundation that semantic tokens reference.

**Tier 2 — Semantic tokens:** Named roles. `--color-brand-primary: var(--color-navy-500)`. These go in `@theme inline {}` so Tailwind generates utilities and they remain cascade-overridable for dark mode.

**Tier 3 — Component tokens:** Specific overrides. `--component-button-color-background: var(--color-brand-primary)`. These go in `:root` — Tailwind generates no utilities for them; components consume them via `var()` directly.

### W3C DTCG token source structure

Style Dictionary v4 auto-detects the W3C Design Token Community Group format (using `$value` and `$type` prefixes). Always set `usesDtcg: true` in your config.

**`packages/design-tokens/tokens/primitive/color.json`**
```json
{
  "color": {
    "primitive": {
      "navy": {
        "500": { "$type": "color", "$value": "#0A2540" },
        "300": { "$type": "color", "$value": "#2E5FA3" },
        "200": { "$type": "color", "$value": "#5B8DC9" }
      },
      "neutral": {
        "0":   { "$type": "color", "$value": "#FFFFFF" },
        "100": { "$type": "color", "$value": "#F5F7FA" },
        "900": { "$type": "color", "$value": "#111827" }
      }
    }
  }
}
```

**`packages/design-tokens/tokens/semantic/color.json`**
```json
{
  "color": {
    "semantic": {
      "action": {
        "primary":   { "$type": "color", "$value": "{color.primitive.navy.500}" },
        "secondary": { "$type": "color", "$value": "{color.primitive.navy.300}" }
      },
      "text": {
        "default": { "$type": "color", "$value": "{color.primitive.neutral.900}" },
        "muted":   { "$type": "color", "$value": "{color.primitive.neutral.100}" }
      },
      "background": {
        "surface": { "$type": "color", "$value": "{color.primitive.neutral.0}" }
      }
    }
  }
}
```

**`packages/design-tokens/tokens/clients/riley-day-care.json`**
```json
{
  "client": "riley-day-care",
  "color": {
    "brand-primary": "#2d6a4f",
    "brand-secondary": "#b7e4c7",
    "text-default": "#1a1a1a",
    "text-muted": "#6b7280",
    "background": "#ffffff",
    "surface": "#f9fafb"
  },
  "font": {
    "sans": "\"Inter\", sans-serif",
    "display": "\"Playfair Display\", serif"
  }
}
```

### Style Dictionary v4 configuration

**`packages/design-tokens/sd.config.ts`**
```typescript
import StyleDictionary from 'style-dictionary'
import type { Config, FormatFnArguments } from 'style-dictionary/types'
import {
  usesReferences,
  getReferences,
  outputReferencesTransformed,
} from 'style-dictionary/utils'

// ─────────────────────────────────────────────────────────────────────────────
// Custom format: outputs three CSS blocks as Tailwind v4 expects them
// ─────────────────────────────────────────────────────────────────────────────
StyleDictionary.registerFormat({
  name: 'css/tw-v4-theme',
  format: async ({ dictionary, options }: FormatFnArguments): Promise<string> => {
    const { blockType = '@theme' } = options

    const vars = dictionary.allTokens
      .map((token) => {
        const value = usesReferences(token.original.$value ?? token.original.value)
          ? outputReferencesTransformed({ token, dictionary })
          : token.$value ?? token.value
        return `  --${token.name}: ${value};`
      })
      .join('\n')

    return `/* Auto-generated by Style Dictionary v4. Do not edit manually.
 * Source: ${options.source ?? 'tokens'}
 */\n\n${blockType} {\n${vars}\n}\n`
  },
})

const config: Config = {
  usesDtcg: true,
  // Primitives are included (resolved) but not run through the full pipeline
  include: ['tokens/primitive/**/*.json'],
  source: ['tokens/semantic/**/*.json', 'tokens/component/**/*.json'],
  platforms: {
    'css/primitives': {
      // Primitives go into :root — Tailwind generates NO utility classes for these
      transformGroup: 'css',
      buildPath: 'dist/css/',
      files: [{
        destination: 'primitives.css',
        format: 'css/tw-v4-theme',
        options: { blockType: ':root' },
        filter: (token) => token.path[0] === 'color' && token.path[1] === 'primitive',
      }],
    },
    'css/semantic': {
      // Semantic tokens go into @theme inline — generates cascade-overridable utilities
      transformGroup: 'css',
      buildPath: 'dist/css/',
      files: [{
        destination: 'semantic.css',
        format: 'css/tw-v4-theme',
        options: { blockType: '@theme inline', outputReferences: outputReferencesTransformed },
        filter: (token) => token.path[0] === 'color' && token.path[1] === 'semantic',
      }],
    },
    'css/component': {
      // Component tokens go into :root — consumed via var() in components
      transformGroup: 'css',
      buildPath: 'dist/css/',
      files: [{
        destination: 'component-vars.css',
        format: 'css/tw-v4-theme',
        options: { blockType: ':root' },
        filter: (token) => token.path[0] === 'component',
      }],
    },
  },
}

const sd = new StyleDictionary(config)
await sd.hasInitialized  // v4: must await before accessing tokens

// Parallel builds — ~60% faster than sequential on 3+ platforms
await Promise.all([
  sd.buildPlatform('css/primitives'),
  sd.buildPlatform('css/semantic'),
  sd.buildPlatform('css/component'),
])

console.log('✅ Design tokens built')
```

### Per-client token compiler

The `tokens/clients/*.json` files contain simple per-client overrides. The build script compiles them directly to CSS without going through the full Style Dictionary pipeline — they are brand-level overrides, not a complex token graph.

**`packages/design-tokens/scripts/build-clients.ts`**
```typescript
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'fs'
import { join } from 'path'

const tokensDir = join(__dirname, '../tokens/clients')
const outputBase = join(__dirname, '../../../apps/clients')

interface ClientTokenFile {
  client: string
  color: Record<string, string>
  font?: Record<string, string>
}

function buildClientTokenFile(tokens: ClientTokenFile): string {
  const colorVars = Object.entries(tokens.color)
    .map(([key, value]) => `  --color-${key}: ${value};`)
    .join('\n')

  const fontVars = tokens.font
    ? Object.entries(tokens.font)
        .map(([key, value]) => `  --font-${key}: ${value};`)
        .join('\n')
    : ''

  return `/* Auto-generated. Do not edit. Run pnpm tokens:build to regenerate. */
@import "tailwindcss";

/* Global shared token imports */
@import "../../../../packages/design-tokens/dist/css/primitives.css";
@import "../../../../packages/design-tokens/dist/css/semantic.css";

/* Per-client brand overrides — these replace semantic token values */
@theme inline {
${colorVars}
${fontVars}
}
`
}

const files = readdirSync(tokensDir).filter(f => f.endsWith('.json'))

for (const file of files) {
  const tokens: ClientTokenFile = JSON.parse(
    readFileSync(join(tokensDir, file), 'utf-8')
  )
  const slug = tokens.client
  const outputDir = join(outputBase, slug, 'tokens')

  mkdirSync(outputDir, { recursive: true })
  writeFileSync(join(outputDir, `${slug}.css`), buildClientTokenFile(tokens))
  console.log(`✅ Built tokens for ${slug}`)
}
```

### `turbo.json` tokens pipeline

Add `tokens:build` to your `packages/design-tokens/package.json`:

```json
{
  "name": "@agency/design-tokens",
  "scripts": {
    "tokens:build": "node --experimental-strip-types scripts/build-clients.ts && node --experimental-strip-types sd.config.ts"
  }
}
```

### Dark mode pattern

```css
/* apps/clients/riley-day-care/src/app/globals.css */
@import "tailwindcss";
@import "../../tokens/riley-day-care.css";

/* Dark mode: override semantic tokens with dark-appropriate values.
   Because semantic tokens use @theme inline, overriding the CSS variable
   at the element level causes all utility classes to respond automatically. */
@custom-variant dark (&:where(.dark, .dark *));

@layer base {
  .dark {
    --color-brand-primary: var(--color-navy-200);
    --color-background: #111827;
    --color-surface: #1f2937;
    --color-text-default: #f9fafb;
  }
}
```

### v3 → v4 production blockers

There are five common ways the Tailwind v4 migration breaks silently:

The `theme()` function in CSS files does not work in v4. The official codemod rewrites class names in JSX/TSX templates but ignores `theme('colors.brand.primary')` calls in `.css` files. These produce empty values at runtime with no error. Find and replace them manually: `theme('colors.navy.500')` becomes `var(--color-navy-500)`.

Running `@tailwindcss/upgrade --compat` keeps a `tailwind.config.js` file. The JS config's `theme.extend.colors` does not merge with `@theme` blocks — the JS config wins and all CSS-defined tokens are silently ignored. Complete removal of `tailwind.config.js` is required.

Style Dictionary's built-in `css/variables` format outputs variables in `:root {}` blocks. Tailwind v4 only generates utility classes from variables declared inside `@theme {}`. Always use the custom `css/tw-v4-theme` format described above.

Storybook's Webpack 5 config does not invoke the Tailwind v4 PostCSS plugin. Fix by adding `@tailwindcss/postcss` to `.storybook/postcss.config.cjs`, or migrate Storybook to Vite.

Specifying both `transforms` and `transformGroup` in the same Style Dictionary v4 platform config silently drops the group's transforms. Register a custom transform group instead.

---

## 9. Phase 5: Database and Multi-Tenant Auth

### The tenant model

Every client in your system is a **tenant**. A tenant has a unique UUID, a slug (human-readable identifier), a domain, and an industry type. Every row of user-specific data in your database includes a `tenant_id` column that references this table. Row-Level Security policies use this column to ensure clients can only see their own data.

### Critical: Supabase connection via Supavisor

Supabase replaced PgBouncer with Supavisor as its connection pooler. This matters immediately for Next.js on Vercel, where serverless functions can create dozens of parallel database connections.

Always use the **transaction pooler** connection string (Port `6543`) — never the direct session connection (Port `5432`) — for all Next.js server-side operations. The direct connection bypasses Supavisor and will exhaust Postgres's connection limit under concurrent serverless execution.

The connection string difference: `db.xxxx.supabase.co:5432/postgres` (direct — avoid) versus `aws-0-region.pooler.supabase.com:6543/postgres` (transaction pooler — use this).

### Database migrations

Always use migrations. Never edit the database directly through the Supabase dashboard. Migrations are version-controlled in `supabase/migrations/` and can be replayed on any environment.

**`supabase/migrations/001_tenants.sql`**
```sql
-- Create the tenants table. This is the source of truth for all tenant metadata.
CREATE TABLE public.tenants (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        text NOT NULL UNIQUE,
  domain      text NOT NULL UNIQUE,
  name        text NOT NULL,
  industry    text NOT NULL CHECK (industry IN ('healthcare', 'ecommerce', 'hospitality', 'general')),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on the tenants table itself.
-- Tenants can read their own row; only service role can write.
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenants can read their own row"
  ON public.tenants
  FOR SELECT
  USING (id = (
    (current_setting('request.jwt.claims', true)::jsonb
      -> 'app_metadata' ->> 'tenant_id')::uuid
  ));
```

**`supabase/migrations/002_rls_policies.sql`**
```sql
-- Example: a posts table for marketing content.
-- Every content table follows this exact pattern.

CREATE TABLE public.posts (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  title       text NOT NULL,
  slug        text NOT NULL,
  content     text,
  published   boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, slug)    -- slugs are unique per tenant, not globally
);

-- Step 1: Enable RLS. Without this, all policies are ignored.
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- Step 2: Create the tenant_id index. Without this index, every query
-- performs a full sequential scan once rows exceed ~10k.
-- CONCURRENTLY means the index builds without locking writes.
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_posts_tenant_id
  ON public.posts (tenant_id);

-- Step 3: Composite index for common access patterns (tenant + time ordering).
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_posts_tenant_created
  ON public.posts (tenant_id, created_at DESC);

-- Step 4: SELECT policy.
-- The outer (select ...) wrapper is critical for performance — it tells
-- PostgreSQL to evaluate the JWT extraction once per query (an "initplan")
-- rather than once per row. The difference at scale is 10–100×.
CREATE POLICY "Tenants select own posts"
  ON public.posts FOR SELECT
  USING (
    tenant_id = (
      select (
        current_setting('request.jwt.claims', true)::jsonb
          -> 'app_metadata' ->> 'tenant_id'
      )::uuid
    )
  );

-- Step 5: INSERT policy. WITH CHECK prevents inserting rows with a
-- tenant_id that doesn't match the authenticated user's tenant.
CREATE POLICY "Tenants insert own posts"
  ON public.posts FOR INSERT
  WITH CHECK (
    tenant_id = (
      select (
        current_setting('request.jwt.claims', true)::jsonb
          -> 'app_metadata' ->> 'tenant_id'
      )::uuid
    )
  );

-- Step 6: UPDATE policy. Both USING (which rows can be targeted) and
-- WITH CHECK (what values can be written) must be present.
CREATE POLICY "Tenants update own posts"
  ON public.posts FOR UPDATE
  USING (
    tenant_id = (
      select (
        current_setting('request.jwt.claims', true)::jsonb
          -> 'app_metadata' ->> 'tenant_id'
      )::uuid
    )
  )
  WITH CHECK (
    tenant_id = (
      select (
        current_setting('request.jwt.claims', true)::jsonb
          -> 'app_metadata' ->> 'tenant_id'
      )::uuid
    )
  );

-- Step 7: DELETE policy.
CREATE POLICY "Tenants delete own posts"
  ON public.posts FOR DELETE
  USING (
    tenant_id = (
      select (
        current_setting('request.jwt.claims', true)::jsonb
          -> 'app_metadata' ->> 'tenant_id'
      )::uuid
    )
  );
```

**`supabase/migrations/003_audit_log.sql`**
```sql
-- Audit log: records every data modification with tenant context.
-- Essential for debugging data issues and HIPAA compliance.
CREATE TABLE public.audit_log (
  id          bigserial PRIMARY KEY,
  tenant_id   uuid NOT NULL REFERENCES public.tenants(id),
  table_name  text NOT NULL,
  record_id   uuid NOT NULL,
  action      text NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  old_data    jsonb,
  new_data    jsonb,
  user_id     uuid,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
CREATE INDEX ON public.audit_log (tenant_id, created_at DESC);

-- Service role only — audit logs are never writable by end users
CREATE POLICY "Service role only"
  ON public.audit_log
  USING (false); -- No user access; only service role can read/write
```

### RLS policy checklist (copy above every table)

```sql
-- RLS CHECKLIST for table: [table_name]
-- [ ] RLS enabled (ALTER TABLE ... ENABLE ROW LEVEL SECURITY)
-- [ ] tenant_id column: uuid NOT NULL REFERENCES tenants(id)
-- [ ] Index on tenant_id (CREATE INDEX CONCURRENTLY)
-- [ ] Composite index on (tenant_id, created_at) for time-ordered queries
-- [ ] SELECT policy with outer (select ...) JWT wrapper
-- [ ] INSERT policy with WITH CHECK
-- [ ] UPDATE policy with both USING and WITH CHECK
-- [ ] DELETE policy
-- [ ] pgTAP cross-tenant isolation test covers this table
```

---

## 10. Phase 6: Row-Level Security (Concretely)

### The performance checklist

RLS is either fast or catastrophically slow depending entirely on whether you follow these rules on every table.

**Rule 1: Every `tenant_id` column must have an index.** The numbers are unambiguous. With RLS and no index on a 100,000-row table: 171ms query time. With the index: 0.046ms. That is a 3,713× difference from a single missing index. At 1,000,000 rows without an index: queries time out entirely.

**Rule 2: Wrap JWT extraction in a `(select ...)` subquery.** Without the wrapper, PostgreSQL evaluates the JWT extraction once per row. With the wrapper, it evaluates it once per query. The difference in a join across large tables is 10–100× in execution speed.

**Rule 3: Never put complex logic in RLS policies.** Policies run on every row evaluation. Keep them as simple constant comparisons: `tenant_id = (select constant)`.

**Rule 4: Use `CREATE INDEX CONCURRENTLY` on production tables.** Standard `CREATE INDEX` locks writes for the duration of the build. `CONCURRENTLY` takes longer but keeps the database live.

**Rule 5: Audit non-IMMUTABLE function calls.** If a function referenced in an RLS policy is not declared `IMMUTABLE`, PostgreSQL cannot cache its result. Wrapping `auth.uid()` in a non-`IMMUTABLE` helper function degrades query time from <1ms to 200ms+ per query.

### pgTAP testing with Basejump helpers

pgTAP is PostgreSQL's native TAP-compliant unit testing framework. Supabase ships it as a first-class feature accessible via `supabase test db`. These tests must pass before any migration touches production.

**`supabase/tests/database/000-setup-test-hooks.sql`**
```sql
-- Installs pgTAP and the Basejump test helpers.
-- Runs first (alphabetical ordering).

CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS http WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_tle;

-- Install Basejump test helpers
DROP EXTENSION IF EXISTS "supabase-dbdev";
SELECT pgtle.uninstall_extension_if_exists('supabase-dbdev');

SELECT pgtle.install_extension(
  'supabase-dbdev',
  resp.contents ->> 'version',
  'PostgreSQL package manager',
  resp.contents ->> 'sql'
)
FROM extensions.http((
  'GET',
  'https://api.database.dev/rest/v1/'
    || 'package_versions?select=sql,version'
    || '&package_name=eq.supabase-dbdev'
    || '&order=version.desc'
    || '&limit=1',
  ARRAY[('apiKey', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhtdXB0cHBsZnZpaWZyYndtbXR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE2ODAxMDczNzIsImV4cCI6MTk5NTY4MzM3Mn0.z2CN0mvO2No8wSi46Gw59DFGCTJrzM0AQKsu_5k134s')::extensions.http_header],
  NULL, NULL
)) x,
LATERAL (
  SELECT ((row_to_json(x) -> 'content') #>> '{}')::json -> 0
) resp(contents);

CREATE EXTENSION "supabase-dbdev";
SELECT dbdev.install('supabase-dbdev');
DROP EXTENSION IF EXISTS "supabase-dbdev";
CREATE EXTENSION "supabase-dbdev";

SELECT dbdev.install('basejump-supabase_test_helpers');
CREATE EXTENSION IF NOT EXISTS "basejump-supabase_test_helpers" VERSION '0.0.6';

BEGIN;
  SELECT plan(1);
  SELECT ok(true, 'Pre-test hook: extensions installed');
  SELECT * FROM finish();
ROLLBACK;
```

**`supabase/tests/database/00-rls-coverage.sql`**
```sql
-- Asserts that EVERY table in the public schema has RLS enabled.
-- Any new migration that adds a table without ENABLE ROW LEVEL SECURITY
-- will fail this test and block the PR merge.

BEGIN;
SELECT plan(2);

SELECT tests.rls_enabled('public');            -- all tables
SELECT tests.rls_enabled('public', 'posts');   -- spot-check critical tables

SELECT * FROM finish();
ROLLBACK;
```

**`supabase/tests/database/01-tenant-isolation.sql`**
```sql
-- Cross-tenant attack simulation.
-- Every attack scenario must be blocked for the test to pass.
-- ANY "not ok" in the TAP output causes supabase test db to exit non-zero.

BEGIN;
SELECT plan(12);

-- ── FIXTURE SETUP ────────────────────────────────────────────────────────────
SELECT tests.create_supabase_user('tenant_a_owner',   'tenant-a@test.com');
SELECT tests.create_supabase_user('tenant_b_attacker', 'tenant-b@test.com');

SELECT tests.authenticate_as_service_role();

INSERT INTO public.organizations (name, slug) VALUES ('Tenant A', 'tenant-a');
INSERT INTO public.organizations (name, slug) VALUES ('Tenant B', 'tenant-b');

INSERT INTO public.org_members (org_id, user_id, role) VALUES (
  (SELECT id FROM public.organizations WHERE slug = 'tenant-a'),
  tests.get_supabase_uid('tenant_a_owner'),
  'owner'
);

INSERT INTO public.posts (title, content, author_id, org_id)
VALUES (
  'Tenant A Confidential',
  'This must never be readable by Tenant B',
  tests.get_supabase_uid('tenant_a_owner'),
  (SELECT id FROM public.organizations WHERE slug = 'tenant-a')
);

-- ── ATTACK SIMULATION: Tenant B tries every CRUD on Tenant A data ────────────
SELECT tests.authenticate_as('tenant_b_attacker');

-- SELECT: Tenant B cannot read Tenant A posts
SELECT is_empty(
  $$ SELECT * FROM public.posts WHERE org_id = (SELECT id FROM public.organizations WHERE slug = 'tenant-a') $$,
  'Tenant B cannot SELECT Tenant A posts'
);

-- UPDATE: Tenant B cannot update Tenant A posts
SELECT is_empty(
  $$ UPDATE public.posts SET title = 'HACKED' WHERE org_id = (SELECT id FROM public.organizations WHERE slug = 'tenant-a') RETURNING 1 $$,
  'Tenant B cannot UPDATE Tenant A posts'
);

-- DELETE: Tenant B cannot delete Tenant A posts
SELECT is_empty(
  $$ DELETE FROM public.posts WHERE org_id = (SELECT id FROM public.organizations WHERE slug = 'tenant-a') RETURNING 1 $$,
  'Tenant B cannot DELETE Tenant A posts'
);

-- INSERT: Tenant B cannot insert with Tenant A org_id
SELECT throws_ok(
  $$ INSERT INTO public.posts (title, content, author_id, org_id) VALUES ('Attack', 'body', tests.get_supabase_uid('tenant_b_attacker'), (SELECT id FROM public.organizations WHERE slug = 'tenant-a')) $$,
  '42501',
  NULL,
  'Tenant B cannot INSERT with Tenant A org_id'
);

SELECT * FROM finish();
ROLLBACK;
```

Run tests:
```bash
supabase test db           # run all tests
supabase test db supabase/tests/database/01-tenant-isolation.sql  # run one file
```

### Supashield audit (complementary layer)

Supashield is an MIT-licensed RLS audit tool (early 2026) that generates a full CRUD test matrix against every table for every role. Treat it as a complement to pgTAP — it catches permission gaps that manual test cases miss.

```bash
npm install -g supashield
supashield test                    # audit all tables
supashield test --table posts      # target one table
supashield test --output json > supashield-report.json
```

---

## 11. Phase 7: Background Jobs with Inngest

### Why not `after()` or BullMQ

Next.js 16's `after()` function shares the same 300-second Vercel timeout as the main request. If the Vercel instance spins down or an API call times out mid-execution, the task is permanently lost. `after()` provides no durability, no retries, and no observability. It is appropriate for fire-and-forget notifications, not for workflows.

BullMQ requires a persistent Node.js `Worker` class polling Redis via a long-lived TCP connection. Vercel's serverless model spins down functions after each request, killing this polling loop. BullMQ is appropriate for VPS/container deployments where you control a persistent process — not for Vercel.

Inngest was designed for serverless from day one. Your functions live at an `/api/inngest` HTTP endpoint in your Next.js app. Inngest's cloud acts as the orchestrator and calls your Vercel function via signed HTTP when a step needs to execute. Each `step.run()` is executed independently — Vercel's 300-second timeout covers one step, not the entire multi-day workflow.

### Setup

Install and configure the Inngest client. The Vercel Marketplace integration auto-injects `INNGEST_SIGNING_KEY` and `INNGEST_EVENT_KEY` environment variables.

**`apps/clients/riley-day-care/src/inngest/client.ts`**
```typescript
import { Inngest } from 'inngest'

export const inngest = new Inngest({
  id: 'riley-day-care',
  // Checkpointing (December 2025): near-zero inter-step latency for AI workflows.
  // maxRuntime must be ~20% below your Vercel maxDuration to avoid mid-checkpoint timeouts.
  checkpointing: {
    maxRuntime: '260s',  // below Vercel's 300s maxDuration
    bufferedSteps: 2,
    maxInterval: '10s',
  },
})
```

**`apps/clients/riley-day-care/src/app/api/inngest/route.ts`**
```typescript
import { serve } from 'inngest/next'
import { inngest } from '../../../inngest/client'
import { onboardingWorkflow } from '../../../inngest/functions/onboarding'
import { emailSequence } from '../../../inngest/functions/email-sequence'

// This endpoint is called by Inngest's cloud to execute your functions.
// The serve() handler exports GET, POST, and PUT — all three are required.
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [onboardingWorkflow, emailSequence],
  // streaming: "allow" extends effective execution beyond Vercel's maxDuration
  // when running on Vercel Fluid Compute or Edge Functions.
  streaming: 'allow',
})
```

### Example: client onboarding workflow

This workflow fires when a new client is added to the platform. It runs across multiple days with a human-approval step in between.

**`apps/agency-admin/src/inngest/functions/onboarding.ts`**
```typescript
import { inngest } from '../client'

export const onboardingWorkflow = inngest.createFunction(
  {
    id: 'client-onboarding',
    // Retry each step independently — the workflow itself never retries from scratch
    retries: 3,
  },
  { event: 'agency/client.created' },
  async ({ event, step }) => {
    const { tenantId, clientName, clientEmail } = event.data

    // Step 1: Provision database tenant
    // Each step.run() executes as an independent Vercel function invocation.
    // If this step succeeds, Inngest will not re-run it even if later steps fail.
    await step.run('provision-database', async () => {
      const response = await fetch('/api/admin/provision-tenant', {
        method: 'POST',
        body: JSON.stringify({ tenantId, clientName }),
        headers: { 'Content-Type': 'application/json' },
      })
      if (!response.ok) throw new Error('Database provisioning failed')
    })

    // Step 2: Send welcome email
    await step.run('send-welcome-email', async () => {
      await sendEmail({
        to: clientEmail,
        subject: `Welcome to the platform, ${clientName}!`,
        template: 'client-welcome',
        data: { clientName, dashboardUrl: `https://admin.agency.com/clients/${tenantId}` },
      })
    })

    // Step 3: Wait for the client to complete their profile — up to 7 days
    // If they complete it early, the workflow resumes immediately.
    // If the 7-day window expires, the workflow continues with the timeout branch.
    const profileEvent = await step.waitForEvent('await-profile-completion', {
      event: 'agency/client.profile-completed',
      match: 'data.tenantId',  // only matches events with the same tenantId
      timeout: '7d',
    })

    if (!profileEvent) {
      // 7-day timeout: send a follow-up nudge
      await step.run('send-followup', async () => {
        await sendEmail({
          to: clientEmail,
          subject: 'Complete your agency profile',
          template: 'profile-nudge',
        })
      })
    }

    return { status: 'onboarded', tenantId }
  }
)
```

### Local development

```bash
# Start the Inngest dev server alongside your Next.js app
npx inngest-cli@latest dev -u http://localhost:3000/api/inngest
```

This opens `http://localhost:8288` where you can inspect workflow runs, manually trigger events, and replay failed steps.

### Pricing context

The Inngest Hobby tier covers 50,000 steps/month free. The cliff to the Pro tier ($75/month) occurs at approximately 20 clients if each client generates ~5,000 steps/month. Plan for this transition at around 15 clients.

---

## 12. Phase 8: Analytics with PostHog

### Self-hosted vs PostHog Cloud: the break-even decision

PostHog publishes a candid statement in their documentation: for most teams below ~5M events/month, the math on self-hosting never works out. Here is the accurate break-even analysis as of March 2026:

| Monthly Event Volume | Cloud Cost | Hetzner CCX23 Infra | Ops Cost (@$50/hr, 2hr/mo) | Net Self-Hosted Cost | Net Saving |
|---|---|---|---|---|---|
| 1M | **$0** | ~$34 | ~$100 | ~$134 | Cloud wins by $134 |
| 3M | ~$84 | ~$34 | ~$100 | ~$134 | Cloud wins by $50 |
| **~4–5M** | ~$130–150 | ~$34 | ~$100 | ~$134 | **Break-even** |
| 10M | ~$324 | ~$34 | ~$100 | ~$134 | Self-hosted saves ~$190 |

If most of your clients use identified-user tracking (logged-in users rather than anonymous), Cloud's identified-event pricing is 5× more expensive, pushing the break-even down to ~2–3M events/month.

**Recommendation:** Start with PostHog Cloud's generous free tier. Self-host on Hetzner when your event volume or GDPR requirements justify it.

### Hardware: CCX23, not CPX31 or CPX41

PostHog requires a minimum of 4 vCPU and 16 GB RAM. The Hetzner CPX31 has only 8 GB RAM and fails this requirement. The CPX41 has 16 GB RAM but uses shared AMD vCPUs — problematic for ClickHouse's CPU-intensive merge operations, which experience CPU steal under load.

The correct Hetzner instance is the **CCX23** (4 dedicated AMD vCPUs, 16 GB RAM, 230 GB NVMe, ~€31.49/month post-April 2026). Deploy in FSN1 or NBG1 (Falkenstein or Nuremberg, Germany) for EU data residency.

### Critical ClickHouse tuning

ClickHouse's default `background_pool_size` is 16. On a 4-vCPU node, this alone causes 300%+ CPU saturation even at modest event volumes. Setting it to 2 before first launch is mandatory.

**`clickhouse/config.d/memory.xml`**
```xml
<?xml version="1.0"?>
<clickhouse>
    <!-- Cap at 12 GB of 16 GB host RAM -->
    <max_server_memory_usage>12884901888</max_server_memory_usage>
    <!-- Aggregate cap for concurrent queries: 9.6 GB -->
    <max_memory_usage_for_all_queries>9663676416</max_memory_usage_for_all_queries>

    <!-- CRITICAL: Default background_pool_size=16 causes 300%+ CPU on 4-vCPU nodes -->
    <background_pool_size>2</background_pool_size>
    <background_merges_mutations_concurrency_ratio>1</background_merges_mutations_concurrency_ratio>
    <background_move_pool_size>1</background_move_pool_size>

    <!-- Limit max threads per query to avoid starving other containers -->
    <max_threads>2</max_threads>

    <logger>
        <level>warning</level>
        <size>100M</size>
        <count>3</count>
    </logger>
</clickhouse>
```

### Per-tenant analytics isolation

Each client gets their own PostHog project — not just a team. This ensures their analytics data is completely isolated. Use `NEXT_PUBLIC_POSTHOG_KEY` as a per-client environment variable in Vercel, pointing to that client's PostHog project key.

In `packages/analytics/src/client.ts` (shown in §6), the `initAnalytics(tenantSlug)` call registers `{ tenant: tenantSlug }` as a super property on every event. This lets you filter by tenant within a shared PostHog project if you choose not to use separate projects per client.

### GDPR compliance

For EU clients, configure the PostHog SDK to disable raw IP capture:
```typescript
posthog.init(key, {
  api_host: host,
  loaded: (ph) => {
    ph.set_config({ capture_ip: false })  // disable IP capture
  },
})
```

On the server side, enable the `beforeStorage` anonymization plugin in PostHog's plugin server to strip PII fields before they reach ClickHouse.

---

## 13. Phase 9: AI Tool Configuration

Getting consistent, useful output from Cursor and Windsurf requires explicit rules files. Without them, AI assistants will forget your stack, suggest the wrong patterns, and generate code that violates your architecture.

### Cursor: `.cursor/rules/base.mdc`

```yaml
---
description: Core project conventions and stack. Applied to every request.
alwaysApply: true
---

# Agency Platform — Core Conventions

## Stack
- Next.js 16.1 (Turbopack is default for dev and build — no flags needed)
- React 19 with TypeScript 5 strict mode
- Tailwind CSS v4 (CSS-first config — no tailwind.config.js exists)
- Style Dictionary v4 (ESM-only, async API, W3C DTCG format)
- pnpm 10 with catalog: protocol for all dependencies
- Turborepo 2.7

## Critical rules
- NEVER use `user_metadata` for tenant_id. Always use `app_metadata`.
- NEVER write `any` type. Use `unknown` and narrow, or define the type.
- NEVER import from another app. Shared code goes in packages/.
- NEVER use the service role key in client-side code or NEXT_PUBLIC_ variables.
- NEVER use tailwind.config.js — Tailwind v4 uses CSS @theme {} only.
- NEVER use theme() in CSS files — use var(--token-name) instead.
- ALWAYS use named exports. No default exports except Next.js page components.
- ALWAYS use `cn()` from @agency/ui for merging Tailwind classes.
- ALWAYS use Server Components by default. Add 'use client' only when needed.
- ALWAYS use Port 6543 (Supavisor) for Supabase connections, never Port 5432.

## File naming
- kebab-case for all files: user-profile.tsx, not UserProfile.tsx
- Exceptions: Next.js reserved files (page.tsx, layout.tsx, middleware.ts)

## Package manager
- All dependencies use "catalog:" protocol, not version strings
- Internal packages use "workspace:*" protocol
- Run `pnpm install` from the repository root, not from individual packages
```

### Cursor: `.cursor/rules/database.mdc`

```yaml
---
description: Supabase and database patterns
globs:
  - "packages/database/**"
  - "supabase/**"
  - "**/actions/**"
  - "**/api/**"
alwaysApply: false
---

# Database Patterns

## Tenant isolation — non-negotiable
- tenant_id ALWAYS comes from app_metadata, never from user_metadata or request headers
- Every table with tenant-scoped data MUST have: RLS enabled, tenant_id index, all four policy types
- Always use the outer (select ...) wrapper in RLS predicates for performance
- Connect via Port 6543 (Supavisor transaction pooler), never Port 5432

## Supabase client usage
- createSupabaseServerClient from @agency/database for Server Components and Server Actions
- createSupabaseBrowserClient from @agency/database for Client Components
- NEVER instantiate Supabase directly in app code — always use the package factory
- NEVER expose the service role key to the client or in NEXT_PUBLIC_ variables

## Migrations
- All schema changes go in supabase/migrations/ with sequential numbering
- Never use the Supabase dashboard to modify schema in production
- Always run supabase test db before deploying a migration

## RLS policy template (copy for every new table)
- ALTER TABLE public.[name] ENABLE ROW LEVEL SECURITY;
- CREATE INDEX CONCURRENTLY idx_[name]_tenant_id ON public.[name] (tenant_id);
- All four policies (SELECT, INSERT WITH CHECK, UPDATE USING+WITH CHECK, DELETE)
- JWT extraction pattern: (select (current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'tenant_id')::uuid)
```

### Cursor: `.cursor/rules/frontend.mdc`

```yaml
---
description: Next.js 16 and React 19 frontend patterns
globs:
  - "apps/**/*.tsx"
  - "apps/**/*.ts"
  - "packages/ui/**"
alwaysApply: false
---

# Frontend Patterns (Next.js 16 + React 19)

## App Router conventions
- Server Components by default — do NOT add 'use client' unless you need:
  - onClick, onChange, or other event handlers
  - useState, useEffect, or other hooks
  - browser-only APIs (window, localStorage)
- 'use cache' for any data that can be cached (Next.js 16 feature)
- All async Dynamic APIs (cookies, headers, params) must be awaited

## Tailwind v4
- @import "tailwindcss" (NOT the three @tailwind directives from v3)
- Design tokens are CSS custom properties in @theme {} blocks
- No tailwind.config.js — customisation goes in CSS
- Never use theme() function in CSS — use var(--token-name)

## Data fetching
- Fetch in Server Components — never in useEffect
- Use Supabase server client in Server Components
- Pass fetched data down as props to Client Components

## Components
- All shared components live in packages/ui, not in apps
- Use cn() for all className merging
- shadcn/ui components are in packages/ui/src/components
```

### Windsurf: `.windsurfrules`

Keep this file under 6,000 tokens (approximately 4,500 words) to stay within Cascade's local context limit.

```
# Agency Platform — Windsurf Rules

## Project purpose
Multi-client marketing agency monorepo. Each client is isolated by tenant_id at the
database layer (Row-Level Security). Shared code lives in packages/. Client-specific
code lives in apps/clients/[slug]/.

## Stack
- Next.js 16.1 with Turbopack (default, no flags needed)
- React 19, TypeScript 5 strict mode
- Tailwind CSS v4 (CSS-first, @import "tailwindcss", @theme {} for tokens)
- Style Dictionary v4 (ESM-only, async, W3C DTCG format, sd.config.ts)
- pnpm 10 (catalog: protocol for versions, workspace:* for internal packages)
- Turborepo 2.7 (turbo.json defines the task pipeline)
- Supabase (PostgreSQL + Auth + Storage) — Port 6543 (Supavisor), not 5432
- shadcn/ui components in packages/ui
- Inngest for background jobs (not BullMQ, not after())

## Absolute prohibitions
1. Do NOT write `any` type. Use `unknown` and narrow, or define the type.
2. Do NOT use `user_metadata` for tenant_id. Always use `app_metadata`.
3. Do NOT import from one app into another. Use packages/.
4. Do NOT put SUPABASE_SERVICE_ROLE_KEY in any NEXT_PUBLIC_ variable.
5. Do NOT use tailwind.config.js — Tailwind v4 uses CSS @theme {} only.
6. Do NOT use theme() in CSS files — use var(--token-name) instead.
7. Do NOT add 'use client' unless genuinely needed for browser APIs or interactivity.
8. Do NOT call Supabase directly from app code — always use @agency/database.
9. Do NOT connect to Supabase via Port 5432 — always use Port 6543.

## When generating RLS migrations
- Always: ENABLE ROW LEVEL SECURITY
- Always: CREATE INDEX CONCURRENTLY on tenant_id
- Always: CREATE INDEX CONCURRENTLY on (tenant_id, created_at)
- Always: all four policies (SELECT, INSERT WITH CHECK, UPDATE USING+WITH CHECK, DELETE)
- JWT pattern: (select (current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'tenant_id')::uuid)

## When generating design token CSS
- Primitives go in :root {} — NO utility classes
- Semantic tokens go in @theme inline {} — generates cascade-overridable utilities
- Component tokens go in :root {} — consumed via var() not utility classes
- Never put primitives in @theme — it generates redundant utilities for every scale step

## Running tasks
- pnpm dev — starts all apps in watch mode
- pnpm turbo run dev --filter=@agency/riley-day-care — starts one app
- pnpm tokens:build — compiles design tokens to CSS
- supabase test db — runs pgTAP RLS isolation tests
- supabase start — starts local Supabase (requires Docker)
```

---

## 14. Phase 10: Vercel Deployment

### Deployment model: understand the trade-off before committing

There are two strategies for deploying multiple client apps on Vercel, and the right choice depends on how many clients you have.

**Project-per-client** gives each client its own Vercel project, its own environment variables, its own deployment history, and isolated rollback points. This is the safest model for client data and the easiest to explain to clients. However, Vercel's Pro plan charges $250/month per project above 2, meaning your monthly Vercel bill hits $1,810 at 9 clients — above the Enterprise plan minimum of $1,667/month. Contact Vercel about an Enterprise agreement before reaching 9 clients.

**Single project with middleware routing** uses a single Vercel project with `middleware.ts` handling hostname-based routing to serve all tenants. Cost collapses to 3 seats × $20 = $60/month regardless of client count. This saves $1,607/month at 50 clients ($19,284/year). The trade-off is shared serverless function limits and no per-client deployment isolation. You deploy all clients simultaneously on every push to `main`.

For a solo developer starting out, use project-per-client. Switch to middleware routing when you reach 8–9 clients or when you negotiate an Enterprise contract.

### Connecting a client app to Vercel (project-per-client)

In the Vercel dashboard, create a new project, connect it to your GitHub repository, and configure:

```
Root Directory: apps/clients/riley-day-care
Build Command:  cd ../../../ && pnpm turbo run build --filter=@agency/riley-day-care
Output Directory: apps/clients/riley-day-care/.next
Install Command: pnpm install
```

The build command runs Turborepo from the repository root, which ensures all package dependencies are built before the client app.

### Environment variables per client

In each Vercel project's Settings → Environment Variables:

```
NEXT_PUBLIC_SUPABASE_URL=https://[your-project].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[anon key]
SUPABASE_SERVICE_ROLE_KEY=[service role key — never public]
NEXT_PUBLIC_POSTHOG_KEY=[this client's PostHog project key]
NEXT_PUBLIC_POSTHOG_HOST=https://posthog.yourdomain.com
NEXT_PUBLIC_TENANT_SLUG=riley-day-care
INNGEST_SIGNING_KEY=[from Inngest dashboard]
INNGEST_EVENT_KEY=[from Inngest dashboard]
```

Never share environment variables between Vercel projects. Each client must have its own Supabase anon key scope and its own PostHog key.

### Turborepo remote cache (free, dramatically faster builds)

Remote cache stores build artefacts on Vercel's infrastructure. When nothing has changed, builds complete in seconds instead of minutes.

```bash
# From repository root, link to Vercel remote cache
turbo login
turbo link
```

After linking, set these environment variables in GitHub Actions:
```
TURBO_TOKEN: (from Vercel → Settings → Tokens)
TURBO_TEAM:  (your Vercel team slug)
```

With remote caching enabled, a PR that only changes one client app will have every other app's build served from cache. Combined with `--affected` CI filtering, most PRs complete in under 2 minutes.

### Middleware routing (optimisation for 9+ clients)

If you choose the single-project model, this middleware routes all tenants through one deployment:

**`apps/agency-platform/src/middleware.ts`**
```ts
import { NextRequest, NextResponse } from 'next/server'

// Tenant manifest — at 50 clients, replace with Redis lookup (see §19)
const TENANT_ROUTES: Record<string, string> = {
  'rileydaycare.com':    '/tenants/riley-day-care',
  'acme-health.com':     '/tenants/acme-health',
  // Add each client's domain here
}

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host')?.split(':')[0] ?? ''
  const tenantPath = TENANT_ROUTES[hostname]

  if (tenantPath) {
    // Rewrite the URL to the tenant's sub-path without changing the visible URL
    return NextResponse.rewrite(
      new URL(`${tenantPath}${request.nextUrl.pathname}`, request.url)
    )
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
```

---

## 15. Phase 11: CI/CD with GitHub Actions

### `.github/workflows/ci.yml`

This pipeline runs on every pull request. It only builds and tests packages affected by the changes in the PR, using Turborepo's `--affected` flag. The remote cache makes repeated runs near-instant.

```yaml
name: CI

on:
  pull_request:
    branches: [main]

env:
  TURBO_TOKEN: ${{ secrets.TURBO_TOKEN }}
  TURBO_TEAM: ${{ secrets.TURBO_TEAM }}

jobs:
  ci:
    name: Build, Lint, Type-check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0   # Required for --affected to compare against base branch

      - uses: pnpm/action-setup@v4
        with:
          version: 10

      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build affected packages
        run: pnpm turbo run build --affected

      - name: Lint affected packages
        run: pnpm turbo run lint --affected

      - name: Type-check affected packages
        run: pnpm turbo run type-check --affected

  rls-tests:
    name: RLS Isolation Tests (pgTAP)
    runs-on: ubuntu-latest
    timeout-minutes: 15

    steps:
      - uses: actions/checkout@v4

      - uses: supabase/setup-cli@v1
        with:
          version: latest

      - name: Start Supabase local environment
        run: supabase start

      - name: Run pgTAP RLS tests
        # Non-zero exit on ANY assertion failure — fails the build
        run: supabase test db

      - name: Upload TAP results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: pgtap-tap-results
          path: "**/*.tap"
          retention-days: 14

      - name: Stop Supabase
        if: always()
        run: supabase stop --no-backup

  rls-supashield:
    name: Supashield RLS Audit
    runs-on: ubuntu-latest
    needs: rls-tests    # runs after pgTAP confirms DB is healthy

    steps:
      - uses: actions/checkout@v4
      - uses: supabase/setup-cli@v1
      - uses: actions/setup-node@v4
        with:
          node-version: 22

      - name: Start Supabase
        run: supabase start

      - name: Install Supashield
        run: npm install -g supashield

      - name: Run RLS audit and fail on unexpected ALLOW
        env:
          SUPABASE_URL: http://localhost:54321
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_LOCAL_SERVICE_ROLE }}
        run: |
          supashield test --output json > supashield-report.json
          node -e "
            const r = require('./supashield-report.json');
            const fails = (r.results || []).filter(t => t.status === 'FAIL');
            if (fails.length > 0) {
              console.error('RLS GAPS DETECTED:', JSON.stringify(fails, null, 2));
              process.exit(1);
            }
            console.log('All RLS policies verified.');
          "

      - name: Upload audit report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: supashield-rls-audit
          path: supashield-report.json
```

### `.github/workflows/deploy.yml`

Deployment to Vercel is handled by the Vercel GitHub integration — you do not need to trigger it manually. This workflow handles database migrations after merges to `main`.

```yaml
name: Database Migrations

on:
  push:
    branches: [main]
    paths:
      - 'supabase/migrations/**'

jobs:
  migrate:
    name: Apply migrations to production
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: supabase/setup-cli@v1

      - name: Link to production project
        run: supabase link --project-ref ${{ secrets.SUPABASE_PROJECT_REF }}
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}

      - name: Push migrations
        run: supabase db push
```

### GitHub Actions cost optimisation

Full monorepo builds (~18 minutes) exhaust the 3,000 free minutes/month at 5 clients. Using `--affected` reduces average build time to ~4 minutes, extending the free quota to ~25 clients. Adding Turborepo remote cache reduces it further to ~2 minutes, extending the free quota to ~50 clients before any billing begins.

---

## 16. Security: Five Attack Vectors to Harden Against

These are documented, real-world attack patterns against multi-tenant Supabase applications. Each is exploitable even when RLS policies are correctly written, if you have the anti-pattern in your application code.

### Vector 1: JWT Claim Injection (Critical)

**What it is:** A user modifies `user_metadata.tenant_id` to a different tenant's UUID, and your application reads from `user_metadata` instead of `app_metadata` to set the database session context.

**How to detect:**
```bash
# Search your codebase for any code reading from user_metadata for tenant context
grep -r "user_metadata" --include="*.ts" --include="*.tsx" packages/database/ apps/
```

Any result that feeds into `set_config` or a database query is a critical vulnerability.

**The fix:** Your RLS policies already use `current_setting('request.jwt.claims', ...) -> 'app_metadata'`. The `supabase-js` client handles this correctly when using the anon key. The risk comes if you manually construct SQL with a tenant identifier from the user's JWT. Always extract from `app_metadata`, never `user_metadata`.

### Vector 2: Redis Cache Key Collision

**What it is:** Two tenants' cached data shares the same Redis key because the cache key does not include the `tenant_id`. Tenant A receives Tenant B's cached response.

**The fix:**
```ts
// WRONG — no tenant scoping
const cached = await redis.get(`posts:${slug}`)

// CORRECT — always prefix with tenant_id
const tenantId = getTenantIdFromRequest(request)
const cached = await redis.get(`tenant:${tenantId}:posts:${slug}`)
```

Every cache key in your system must begin with `tenant:{id}:`. This is the cache layer equivalent of RLS.

### Vector 3: Service Role Key Exposure (affects ~11% of Supabase apps)

**What it is:** The `SUPABASE_SERVICE_ROLE_KEY` appears in client-side code, browser network requests, or frontend build artefacts. The service role key bypasses all RLS policies completely.

**How to detect:**
```bash
# Should return zero results in app code
grep -r "service_role\|SERVICE_ROLE" --include="*.tsx" --include="*.ts" apps/

# Must NOT start with NEXT_PUBLIC_
grep "SUPABASE_SERVICE_ROLE_KEY" .env.local
```

**The fix:** The service role key must only appear in server-side operations (Server Actions, Route Handlers) and accessed via `process.env.SUPABASE_SERVICE_ROLE_KEY` — never `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY`.

### Vector 4: API Endpoint Authorization Gaps

**What it is:** An API endpoint fetches data by ID without verifying that the requesting user's `tenant_id` matches the record's `tenant_id`. RLS in Supabase protects against this when you use the user's JWT, but the risk arises when you use the service role client in an API endpoint.

**The fix:** Only use the anon key client for user-facing data operations. If you must use the service role client for a legitimate admin operation, add explicit tenant scoping:
```ts
const post = await adminClient
  .from('posts')
  .select('*')
  .eq('id', postId)
  .eq('tenant_id', verifiedTenantId)  // explicit tenant scope when using admin client
  .single()
```

### Vector 5: HIPAA Isolation Failures

**What it is:** A healthcare client requiring HIPAA compliance shares a database with a high-traffic hospitality client. The hospitality client's flash sale saturates connection pools at the moment clinical staff need access to patient records.

**The architecture decision:** Any client with a signed Business Associate Agreement (BAA) for HIPAA must be on a dedicated Supabase project. The shared RLS model is not appropriate for HIPAA workloads, regardless of how well-written your policies are.

**How to identify HIPAA requirement:** If a client mentions patient records, medical history, appointment scheduling involving health information, or any PHI (Protected Health Information), they require a dedicated database project and the HIPAA compliance add-on on Supabase's paid plan.

---

## 17. RLS Performance at Scale

### The performance failure mode

RLS policies are implicit WHERE clauses appended to every query. Without an index on the column being filtered, PostgreSQL must scan every row in the table. The performance numbers are unambiguous:

| Condition | Table Size | Execution Time |
|---|---|---|
| No index on policy column | 100,000 rows | **171ms** |
| With index on policy column | 100,000 rows | **0.046ms** |
| No index | 1,000,000 rows | **Timeout** |

The index is not optional. It is the difference between a working application and a broken one.

### JWT extraction cost

```sql
-- Without (select) wrapper — evaluated once PER ROW (slow)
USING (tenant_id = (
  current_setting('request.jwt.claims', true)::jsonb
    -> 'app_metadata' ->> 'tenant_id'
)::uuid)

-- With (select) wrapper — evaluated once PER QUERY (fast)
-- The (select ...) causes PostgreSQL to compute the JWT value once and treat
-- it as a constant for the rest of the query plan. The difference at scale is 10–100×.
USING (tenant_id = (
  select (
    current_setting('request.jwt.claims', true)::jsonb
      -> 'app_metadata' ->> 'tenant_id'
  )::uuid
))
```

### Diagnostic queries

Run these in the Supabase SQL Editor when a client reports slow queries:

```sql
-- Verify RLS is enabled and policies exist
SELECT schemaname, tablename, policyname, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, cmd;

-- Verify indexes exist on tenant_id columns
SELECT
  t.relname AS table_name,
  i.relname AS index_name,
  a.attname AS column_name
FROM pg_index x
JOIN pg_class t ON t.oid = x.indrelid
JOIN pg_class i ON i.oid = x.indexrelid
JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(x.indkey)
WHERE t.relnamespace = 'public'::regnamespace
  AND a.attname = 'tenant_id'
ORDER BY t.relname;

-- Check scan type on a slow query — look for "Index Scan" (good) not "Seq Scan" (bad)
EXPLAIN ANALYZE
SELECT * FROM posts WHERE tenant_id = '[test-tenant-uuid]' LIMIT 100;
```

### When to add partitioning

Consider table partitioning when a single table exceeds 100 million total rows, the data is time-series with predictable access patterns, or `EXPLAIN ANALYZE` shows index scans still taking hundreds of milliseconds despite correct indexing.

Partitioning by `tenant_id` combined with time period (monthly or quarterly) allows PostgreSQL to exclude entire partitions from the query plan, dramatically reducing scanned rows.

---

## 18. Supabase Email Uniqueness Constraint

### The constraint

Supabase Auth enforces that each email address can appear only once per project through the `users_email_partial_key` partial unique index. For a standard agency use case — where each user belongs to exactly one client — this is not a problem.

### When it becomes a problem

If you build a portal where your agency's own employees need to log in to multiple client dashboards using the same email, you need a workaround.

### The verified workaround: email aliasing

```ts
// packages/database/src/auth.ts — already shown above in §6

// The aliasEmail approach:
// alice@example.com at Riley Day Care → alice+riley-day-care@example.com in auth
// alice@example.com at Acme Health   → alice+acme-health@example.com in auth
// Both auth records store real_email: 'alice@example.com' in app_metadata
// Your login flow looks up the auth_email from customer_auth_mappings before signing in
```

Do not attempt SHA-256 hashing of emails as a workaround — this pattern has no official documentation or production validation in Supabase.

---

## 19. Scaling Triggers and Decision Points

The architecture in this guide handles the 0–50 client range without modification. Transitions are triggered by specific, measurable degradation signals that must persist for **10 consecutive days** before committing to migration. Do not migrate based on isolated spikes.

### Phase 1: 0–50 clients (Turborepo + shared RLS)

**Monorepo tool:** Turborepo. At fewer than 15 packages, Turborepo achieves cold builds in ~2.8 seconds versus Nx's ~8.3 seconds. The configuration overhead difference is significant: ~20 lines versus 200+.

**Database:** Single Supabase project, shared schema, RLS, shared connection pool.

**Tenant resolution:** Static environment variable (`NEXT_PUBLIC_TENANT_SLUG`) per Vercel deployment.

**Before assuming Phase 2 is needed:** Run `EXPLAIN ANALYZE` on all RLS-protected tables. If any show `Seq Scan` instead of `Index Scan`, add the missing index. A single `CREATE INDEX CONCURRENTLY` can defer Phase 2 migration by months.

### Phase 1 → 2 transition triggers

| Signal | Threshold | Try This First |
|---|---|---|
| p95 query time | >500ms for 10 consecutive days | Add `(tenant_id, lookup_col)` composite index |
| Sequential scan rate | >15% of queries via `pg_stat_statements` | Add missing index on RLS policy column |
| Turborepo CI cold build | >8 minutes consistently | Migrate to Nx independently of DB changes |
| Supavisor pool saturation | >80% client connections used | Tune `pool_size` and `connection_timeout` first |
| One tenant consuming >20% DB CPU | Persistent | Move that specific tenant to a dedicated project |

### Phase 2: 50–200 clients (Nx + Redis caching)

**Monorepo tool:** Nx. Migrate when package count exceeds 30 with cross-domain imports. Nx provides import-graph analysis (rather than package.json dependency analysis), which eliminates false-positive rebuilds. At 100+ packages, Nx is 7.47× faster than Turborepo for full builds because it distributes tasks across remote machines.

**Database:** Shared schema + RLS, plus Redis tenant configuration cache.

**Tenant resolution:** Redis real-time lookup with 300-second TTL. Cache key: `tenant:{slug}:config`.

```ts
// Tenant resolution with Redis cache — replace static manifest at 50+ clients
async function getTenantByDomain(domain: string): Promise<Tenant | null> {
  const cacheKey = `tenant:domain:${domain}`

  // Check Redis first (300s TTL)
  const cached = await redis.get(cacheKey)
  if (cached) return JSON.parse(cached)

  // Fall through to Supabase
  const { data } = await supabaseAdmin
    .from('tenants')
    .select('*')
    .eq('domain', domain)
    .single()

  if (data) {
    await redis.setex(cacheKey, 300, JSON.stringify(data))
  }

  return data
}
```

**Redis cost (Upstash):** Fewer than 10,000 requests/day is free. At 50 tenants with 300-second TTL, cost is approximately $5–15/month.

### Phase 2 → 3 transition triggers

| Signal | Threshold | Note |
|---|---|---|
| p95 query time post-Redis | >300ms for 10 days (after cache is warm) | Systemic bottleneck confirmed |
| Any tenant requires HIPAA/SOC2 | Immediately | Do not wait; begin Phase 3 now |
| One tenant >20% DB CPU | Persistent | Move that tenant first; full migration may not be needed |

**Staffing gate:** Schema-per-tenant migration without a second engineer is high-risk. During the dual-write phase, you need one person monitoring replication fidelity while another handles application routing changes. Block Phase 3 migration until a second engineer is available (full-time or contract).

### Phase 3: 200+ clients (schema-per-tenant)

**Database:** Each tenant's tables live in a dedicated PostgreSQL schema (e.g. `riley_day_care.*` instead of `public.*` with a `tenant_id` filter). Stronger isolation guarantees without the cost of separate Supabase projects.

**Migration path (zero-downtime, expand-contract pattern):**

Migration 1 (Expand): Create tenant schemas without moving data. Application continues using `public.*`. This migration is safe to deploy immediately.

Application V2 (Dual-write): Application writes to both `public.[table]` and `[tenant_schema].[table]`. Run for 48 hours minimum to verify replication fidelity.

Migration 2 (Backfill): Move existing data from `public.*` to tenant schemas in batches of 10,000 rows using `pg_repack`. Set `lock_timeout = '3s'` on the migration session to prevent long table locks.

Application V3 (Read from tenant schema): Switch reads to use `search_path` injection (`SET search_path = [tenant_schema], public`). Deploy and monitor for 48 hours.

Migration 3 (Contract): Remove data from `public.*` tables. Run during a scheduled maintenance window with monitoring.

### At 200+ clients: industry-based Supabase organisations

When you have enough healthcare clients that HIPAA compliance costs justify dedicated infrastructure, consider per-industry Supabase organisations: `agency-healthcare`, `agency-ecommerce`, `agency-standard`. This provides connection pool isolation between industries and prevents a hospitality flash sale from affecting healthcare database performance.

---

## 20. Client Onboarding Checklist

Run this checklist for every new client. It takes approximately 2 hours for a standard (non-HIPAA) industry.

**Phase 1: Scaffold**

- [ ] Run `pnpm scaffold` and provide: name, slug, industry, domain
- [ ] Verify `apps/clients/[slug]/` was created with correct `package.json`
- [ ] Edit `packages/design-tokens/tokens/clients/[slug].json` with client brand colours and fonts
- [ ] Run `pnpm tokens:build` and verify `apps/clients/[slug]/tokens/[slug].css` compiles without errors

**Phase 2: Database**

- [ ] Decide isolation model: shared RLS (standard) or dedicated project (HIPAA)
- [ ] If HIPAA: create a new Supabase project; set environment variables accordingly; obtain BAA from Supabase
- [ ] If standard: insert new row into `tenants` table with `slug`, `domain`, `industry`, `name`
- [ ] Note the new `tenant_id` UUID

**Phase 3: First user**

- [ ] Create initial admin user with `supabaseAdmin.auth.admin.createUser`
- [ ] Set `app_metadata: { tenant_id: '[uuid]', role: 'admin' }` immediately
- [ ] Verify the user can log in and only sees their own tenant's data
- [ ] Run RLS isolation test to confirm cross-tenant protection: `supabase test db`

**Phase 4: Deployment**

- [ ] Create new Vercel project connected to monorepo GitHub repo
- [ ] Set root directory to `apps/clients/[slug]`
- [ ] Set all required environment variables (see §14)
- [ ] Configure custom domain in Vercel
- [ ] Add CNAME in DNS pointing to Vercel

**Phase 5: Quality gates**

- [ ] Run `pnpm turbo run build --filter=@agency/[slug]` — must succeed with zero errors
- [ ] Run Lighthouse CI — all scores ≥ 90
- [ ] Verify RLS tests pass: `supabase test db`
- [ ] Confirm PostHog events collect under correct tenant property
- [ ] Test client's first user login end-to-end

---

## 21. Quick Reference Appendix

### Key commands

```bash
# Development
pnpm dev                                         # Start all apps in watch mode
pnpm turbo run dev --filter=@agency/[slug]       # Start one client app

# Building
pnpm build                                       # Build all apps
pnpm turbo run build --filter=@agency/[slug]     # Build one client app
pnpm turbo run build --affected                  # Build only what changed

# Testing
supabase test db                                 # Run RLS pgTAP tests
supabase test db supabase/tests/database/01-tenant-isolation.sql  # Run one file
pnpm turbo run test --affected                   # Run unit tests for changed packages

# Design tokens
pnpm tokens:build                                # Compile all token files to CSS

# Scaffolding
pnpm scaffold                                    # Create new client from template

# Type checking
pnpm turbo run type-check                        # Full TypeScript check across all packages

# Database
supabase db reset                                # Reset local database and replay migrations
supabase db push                                 # Push migrations to linked remote project
supabase start                                   # Start local Supabase (Docker required)
supabase db start                                # Start Postgres-only (faster, no Auth/Storage)

# Inngest local development
npx inngest-cli@latest dev -u http://localhost:3000/api/inngest
```

### Environment variable reference

| Variable | Scope | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Public | Safe to expose to browser |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public | Safe to expose; RLS protects data |
| `SUPABASE_SERVICE_ROLE_KEY` | **Server only** | Bypasses all RLS — never public |
| `NEXT_PUBLIC_POSTHOG_KEY` | Public | Per-client PostHog project key |
| `NEXT_PUBLIC_POSTHOG_HOST` | Public | Self-hosted PostHog URL |
| `NEXT_PUBLIC_TENANT_SLUG` | Public | Identifies this deployment's client |
| `INNGEST_SIGNING_KEY` | Server only | Signs webhook requests from Inngest |
| `INNGEST_EVENT_KEY` | Server only | Sends events to Inngest |
| `SUPABASE_ACCESS_TOKEN` | CI/CD only | For Supabase CLI operations in GitHub Actions |
| `SUPABASE_PROJECT_REF` | CI/CD only | Project reference for `supabase link` |
| `TURBO_TOKEN` | CI/CD only | Remote cache authentication |
| `TURBO_TEAM` | CI/CD only | Remote cache team identifier |

### Design token naming conventions

| Tier | Pattern | Example |
|---|---|---|
| Primitive | `--color-{palette}-{scale}` | `--color-navy-500` |
| Semantic | `--color-{role}` | `--color-brand-primary` |
| Component | `--component-{name}-{property}` | `--component-button-color-background` |
| Typography | `--font-{role}` | `--font-sans`, `--font-display` |
| Font size | `--text-{name}` | `--text-2xl` |
| Line height | `--text-{name}--line-height` | `--text-2xl--line-height` |
| Spacing | `--spacing-{name}` | `--spacing-18` |
| Radius | `--radius-{scale}` | `--radius-xl` |

### Monthly cost by stage

| Stage | Supabase | Vercel | Other | Total |
|---|---|---|---|---|
| Development | $0 | $0 | $0 | **$0** |
| First client live | $25 | $20 | $0 | **~$45** |
| 5–10 clients | $25 | $20 | $34 (PostHog) | **~$80** |
| Per HIPAA client | +$100 | +$0 | — | **+$100** |
| 9 clients (cliff) | $25 | **$1,667** (Enterprise) | — | **~$1,700** |
| 50 clients (middleware) | $25 | $60 | $100 | **~$185** |
| 50 clients (per-project) | $25 | $1,667 | $100 | **~$1,800** |

### Supabase free tier limits (2026)

| Resource | Free Limit | Pro Limit |
|---|---|---|
| Active projects | 2 | Unlimited |
| Database storage | 500 MB | 8 GB included |
| Monthly active users | 50,000 | 100,000 included |
| Bandwidth | 2 GB | 250 GB included |
| Backups | None | Daily, 7-day retention |
| Project pausing | After 7 days inactive | Never |
| Monthly cost | $0 | $25/project |

### pgTAP assertion reference

| Function | Use Case |
|---|---|
| `ok(boolean, description)` | Generic pass/fail assertion |
| `is(actual, expected, description)` | Equality check |
| `is_empty(query, description)` | Assert query returns zero rows — RLS blocks work |
| `isnt_empty(query, description)` | Assert query returns at least one row — user can see their own data |
| `throws_ok(query, errcode, errmsg, description)` | Assert query raises `42501` — INSERT was blocked |
| `lives_ok(query, description)` | Assert query executes without error — catches false negatives |
| `results_eq(query, array, description)` | Assert query results match exactly |
| `plan(n)` | Declare the number of assertions in this test block |
| `finish()` | Close the test plan; raises error if count mismatches |

### Inngest pricing thresholds

| Scale | Plan | Monthly Cost |
|---|---|---|
| 0 → 50,000 steps | Hobby | $0 |
| 50,000 → 1M steps | Pro | $75 |
| 1M → 10M steps | Pro + add-ons | $200+ |
| 10M+ steps | Temporal (graduate) | $100 min + infra |

### Turborepo → Nx migration threshold

| Repo Size | Tool | Key Reason |
|---|---|---|
| <15 packages | **Turborepo** | 2.8s cold build vs Nx's 8.3s |
| 15–30 packages | Either | Turborepo simpler; Nx better with cross-domain imports |
| 30+ packages (cross-domain) | **Nx** | Import-graph eliminates false-positive rebuilds |
| 50+ packages (multi-team) | **Nx** | `enforce-module-boundaries` shrinks CI graph 20–30% |
| 100+ packages | **Nx** | 7.47× faster than Turborepo (distributed execution) |

---

*Version 4.0 — Synthesised from nine source documents: Agency Platform Guide v3.0, Background Jobs Reference, Automated RLS Testing Reference, Style Dictionary v4 + Tailwind v4 Reference, Self-Hosted PostHog on Hetzner Reference, Scaling Architecture Reference, BookingWidget Architecture Reference, Platform Pricing Reference, and Tailwind v3→v4 Migration Guide. Enriched with targeted research on Turborepo/Nx selection, Supabase multi-tenancy, Vercel multi-site deployment, Sanity CMS architecture, and Inngest Next.js 16 compatibility. Verified against Next.js 16.1, Turborepo 2.7, Tailwind CSS v4, Style Dictionary v4, Supabase Supavisor, Inngest v3.51+, and platform pricing as of March 2026.*

*Written for a solo developer using Cursor and Windsurf, learning by trial and error.*
