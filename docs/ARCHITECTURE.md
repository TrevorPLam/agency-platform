# Agency Platform — Architectural Overview

Single-page reference for the monorepo structure, isolation model, and scaling decision points. For step-by-step setup and contribution rules, see [CONTRIBUTING.md](../CONTRIBUTING.md). For the full build guide, see [GUIDE.md](../GUIDE.md).

---

## Monorepo structure

- **`apps/`** — Applications. Each app is an independent Next.js 16 deployment.
  - **`apps/firm/`** — Agency marketing site.
  - **`apps/agency-admin/`** — Internal control panel (Inngest host, onboarding UI).
  - **`apps/prospective-clients/[slug]/`** — Demo/test clients (e.g. riley-day-care, the-barber-cave).
  - **`apps/clients/[slug]/`** — Production clients only (empty until first go-live).
- **`packages/`** — Shared code. Apps depend on these; packages never depend on apps.
  - **`ui`** — shadcn/ui components and `cn()`.
  - **`database`** — Supabase client factories, middleware, auth helpers.
  - **`analytics`** — PostHog (tenant-aware).
  - **`design-tokens`** — Style Dictionary v4 → per-client CSS.
  - **`typescript-config`**, **`eslint-config`** — Shared configs.
- **`supabase/`** — Migrations, pgTAP RLS tests, config.
- **`scripts/`** — Scaffolding and utilities (e.g. `scaffold-client.ts`).

Shared code lives in `packages/`; client-specific code lives in `apps/`. The boundary is enforced by pnpm workspace references and ESLint `no-restricted-imports` (packages cannot import from `apps/`).

---

## Three axes of complexity

The platform manages three overlapping concerns without branching by client or industry.

1. **Multi-industry** — One codebase serves healthcare, e-commerce, hospitality, and general sites. Achieved via configuration and content: design tokens, CMS schemas. No code branching; e.g. riley-day-care and the-barber-cave use the same components and different token files.
2. **Multi-client** — Many clients share infrastructure with strict data isolation. Achieved via Row-Level Security (RLS) and per-client Vercel deployments. A user of one client cannot read another client’s data.
3. **Multi-site** — A single client can have multiple properties (marketing site, booking portal, dashboard). Each property is a separate app in the monorepo with its own deployment and domain.

---

## Five isolation layers

When debugging, ask which of these layers the problem lives in:

| Layer             | Mechanism                                                                      |
| ----------------- | ------------------------------------------------------------------------------ |
| **Code boundary** | pnpm workspaces; packages cannot import from apps; shared code in `packages/`. |
| **Database**      | RLS on every tenant-scoped table; `tenant_id` from JWT `app_metadata` only.    |
| **Cache**         | Any cache (e.g. Redis) must use keys prefixed with `tenant:{id}:`.             |
| **CI/CD**         | Affected builds; types drift check; RLS tests; migrations deploy on merge.     |
| **Deployment**    | One Vercel project per app; per-client env vars and domains.                   |

Security is structural: tenant identity comes from `app_metadata`, never `user_metadata`; service role key is server-only and never in `NEXT_PUBLIC_` variables; admin operations use explicit tenant scoping.

---

## Scaling phase triggers

The current build targets **Phase 1** (0–50 clients). Transitions are triggered by measurable signals that persist for **10 consecutive days** (no one-off spikes).

### Phase 1: 0–50 clients (current)

- **Monorepo:** Turborepo. Cold builds stay fast at this package count.
- **Database:** Single Supabase project, shared schema, RLS, Supavisor (port 6543).
- **Tenant resolution:** `NEXT_PUBLIC_TENANT_SLUG` per deployment.

Before considering Phase 2: run `EXPLAIN ANALYZE` on RLS queries; add indexes if any show `Seq Scan` instead of `Index Scan`.

### Phase 1 → 2 triggers

| Signal                    | Threshold               | Try first                                    |
| ------------------------- | ----------------------- | -------------------------------------------- |
| p95 query time            | >500ms for 10 days      | Composite index on `(tenant_id, lookup_col)` |
| Sequential scan rate      | >15% of queries         | Index on RLS policy column                   |
| Turborepo CI cold build   | >8 minutes consistently | Consider Nx                                  |
| Supavisor pool saturation | >80% connections used   | Tune pool_size / connection_timeout          |
| One tenant >20% DB CPU    | Persistent              | Move that tenant to dedicated project        |

### Phase 2: 50–200 clients

- **Monorepo:** Nx when package count exceeds ~30 with cross-domain imports.
- **Database:** Shared schema + RLS + Redis tenant/config cache (e.g. `tenant:{slug}:config`, 300s TTL).
- **Tenant resolution:** Redis lookup with fallback to Supabase.

### Phase 2 → 3 triggers

- p95 query time (with cache warm) >300ms for 10 days.
- Any tenant requires HIPAA/SOC2 → dedicated Supabase project / BAA (do not wait).
- One tenant consistently >20% DB CPU → move that tenant first.

Phase 3 (schema-per-tenant, 200+ clients) requires a second engineer for safe dual-write and migration; see GUIDE.md §19 for the full expand–contract pattern.

---

## Summary

- **Structure:** Monorepo with `apps/` and `packages/`; no app-to-app or app-to-package reverse dependencies.
- **Axes:** Multi-industry (tokens/config), multi-client (RLS + deployments), multi-site (one app per property).
- **Isolation:** Code boundary, database (RLS), cache (tenant-prefixed keys), CI/CD, deployment (per-app Vercel).
- **Scaling:** Stay in Phase 1 until triggers above; then Phase 2 (Redis + Nx), then Phase 3 (schema-per-tenant) with staffing and HIPAA handled explicitly.
