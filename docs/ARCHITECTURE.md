# Agency Platform — Complete Architecture Guide

Comprehensive architectural reference for the monorepo structure, isolation model, component design system, and scaling strategy. For step-by-step setup, contribution rules, and build/deploy, see [CONTRIBUTING.md](../CONTRIBUTING.md).

---

## Strategic decisions (locked in)

| Decision | Choice |
|----------|--------|
| **Folder model** | Option A: `apps/prospective-clients/` (demo/test) and `apps/clients/` (production only). |
| **Firm site** | Broad scope (form, blogs, etc.). |
| **Riley Day Care** | Day Care Template; build out per spec (see [docs/guides/riley-day-care-spec.md](../guides/riley-day-care-spec.md)). |
| **Template** | Riley Day Care app is the scaffold template; production clients go in `apps/clients/` at first go-live. |

Target structure: `apps/firm`, `apps/agency-admin`, `apps/prospective-clients/{riley-day-care,the-barber-cave}`, `apps/clients/` (empty until first production client). Scaffold creates apps under prospective-clients or clients from template `riley-day-care`.

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
2. **Multi-client** — Many clients share infrastructure with strict data isolation. Achieved via Row-Level Security (RLS) and per-client Vercel deployments. A user of one client cannot read another client's data.
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

## Component Design System (Atomic Design)

### The five levels

| Level | What it is | Examples in this repo |
| ----- | ---------- | --------------------- |
| **Atoms** | Smallest primitives; single responsibility; styleable via props | Button, Input, Label, Badge |
| **Molecules** | Groups of atoms as one unit; encapsulate accessibility | Card, Dialog, Sheet, DropdownMenu |
| **Organisms** | Sections of molecules/atoms; loading/empty/error; data contracts | (Shared organisms when pattern repeats; app-specific in apps) |
| **Templates** | Page-level layout with slots; no real content | In apps (e.g. layout.tsx, page wrappers) |
| **Pages** | Concrete routes with real data | In apps (page.tsx) |

Templates and pages live in **apps**, not in `packages/ui`. The design system stops at organisms.

### Component structure

Shared UI lives in `packages/ui` and follows **Atomic Design** (atoms → molecules → organisms). Templates and pages stay in apps.

- **Atoms** (`packages/ui/src/components/atoms/`): Primitives with single responsibility—Button, Input, Label, Badge. Keep dumb and styleable; use design tokens only.
- **Molecules** (`packages/ui/src/components/molecules/`): Groups of atoms—Card, Dialog, Sheet, DropdownMenu. Encapsulate accessibility and sensible defaults; molecules may use atoms.
- **Organisms** (`packages/ui/src/components/organisms/`): Sections combining molecules/atoms; add loading/empty/error here. Shared organisms go here when a pattern repeats across apps; app-specific ones (e.g. SiteHeader, ContactForm) stay in `apps/*/src/components`.

See `packages/ui/src/components/README.md` for rules and when to promote a pattern. Use the hierarchy as a guide, not dogma.

### Best practices (what works)

- **Use as a mental model, not dogma** — Don't force every component into a level; use levels to communicate and to decide where new components go.
- **Build across levels in parallel** — Not a linear pipeline; iterate atoms, molecules, and organisms together as you ship real pages.
- **Atoms: keep dumb and styleable** — Minimal API (variant, size, disabled); use design tokens (`var(--*)`); no business logic.
- **Molecules: encapsulate accessibility** — Label + input + error, aria-*, sensible defaults. Molecules may use atoms (e.g. Dialog uses Button).
- **Organisms: clear data contracts** — Define what data the organism needs; add loading/empty/error here; keep templates presentational.
- **Centralize and version design tokens** — This repo uses `packages/design-tokens` and Style Dictionary; atoms consume tokens only.
- **Single source of truth** — Build the system while shipping real pages; avoid "library first, product later" so components stay used.

### Anti-patterns (what to avoid)

- **Rigid taxonomy** — Arguing "is this a molecule or organism?" instead of shipping. Use the level that helps the team.
- **Over-abstracted atoms** — Super-generic primitives that are hard to use. Promote to molecules only when a pattern repeats.
- **Templates with business logic** — Keep templates presentational (slots/layout); fetch data in pages or thin containers.
- **Design system drift** — Components in Storybook that diverge from production. Keep docs and governance light but real.
- **Shelfware components** — Building the library first without real use cases. Add components when a page needs them.

### Advanced patterns

- **Barrel exports** — `atoms/index.ts`, `molecules/index.ts` re-export so apps keep importing from `@agency/ui`; no change to public API.
- **Molecules using atoms** — Only when it reduces duplication and keeps accessibility in one place (e.g. Dialog close button uses Button).
- **Organisms in apps vs package** — App-specific sections (SiteHeader, ContactForm) stay in `apps/*/src/components`; move to `packages/ui/src/components/organisms/` when the same pattern appears in multiple apps.
- **Storybook** — Optional; organize stories by atoms/molecules/organisms to teach the hierarchy and run visual regression. Not required for Phase 1.

### Where things live in this repo

- **packages/ui/src/components/atoms/** — Button, Input, Label, Badge.
- **packages/ui/src/components/molecules/** — Card, Dialog, Sheet, DropdownMenu.
- **packages/ui/src/components/organisms/** — Placeholder; add shared organisms when needed.
- **packages/ui/src/components/README.md** — Short pointer to this doc and "adding components" reminder.
- **.cursor/rules/frontend.mdc** — Structure and Tailwind/design token rules.

---

## Keeping app folders minimal

**Rule (from `.cursor/rules/base.mdc`):** Never import from another app. Shared code goes in `packages/`.

- **Packages** hold all reusable UI, data access, analytics, email, booking, and design-tokens output. Apps **only** hold: route tree (pages/layouts), app-specific config (nav links, brand name, tenant slug), and thin wrappers that **import from packages**.
- **Dependency direction:** apps → packages only; packages never import from apps.

**What to use from packages:** `@agency/ui` (components, `cn()`), `@agency/database` (Supabase clients, `resolveTenantFromRequest`, auth), `@agency/analytics` (`initAnalytics`), `@agency/email`, `@agency/booking`, design-tokens CSS. Prefer config-driven layout and shared form views in packages; app supplies slug, nav config, and server actions.

**Checklist when adding or changing an app:** (1) Shared UI in `packages/ui`; use `@agency/ui`, not a duplicate `components/ui/` in the app. (2) Shared behavior via `@agency/database`, `@agency/email`, `@agency/analytics`; app only wires config and route/action entry points. (3) Layout: prefer config-driven layout from a package; app provides config and `{children}`. (4) Forms: shared form view in package; app provides the server action. (5) Tailwind: use `@source` in app globals so Tailwind scans `packages/ui`. (6) No app-to-app imports.

The scaffold (`pnpm scaffold`) already creates a minimal client app from the template; add new shared behavior in packages and import from apps.

---

## Content strategy / Headless CMS

Client content (copy, blog posts, landing sections) is today managed in code or in-app. For multi-client scale and non-developer edits, a **headless CMS** is the recommended single source of truth: one platform, project or tenant per client, content delivered via API to each app.

**When to introduce:** When client content grows beyond static pages or when marketing needs to update copy without code deploys. Not required for Phase 1; consider before or at Phase 2 (50+ clients) or when onboarding content-heavy clients.

**Options:** Multi-tenant or project-per-client offerings (e.g. Caisy, Crystallize, Webiny, BCMS) support tenant/project isolation, shared infrastructure, and duplicate-from-template onboarding. Choose based on self-hosted vs SaaS, pricing, and framework integrations. The monorepo stays the consumer: each app fetches content by tenant/slug; no CMS-specific code in shared packages until a shared client is added.

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

**Future: tenant config cache.** When approaching Phase 2, add a small placeholder for tenant config (e.g. in `packages/database` or a dedicated package) so Redis (or similar) can be wired without re-architecting. The cache key pattern `tenant:{slug}:config` with a short TTL keeps tenant metadata and feature flags off the critical path while RLS remains the source of truth for data access.

**Smoke / E2E tests.** Only `@agency/database` has unit tests today. As client count grows, consider one Playwright (or similar) smoke test per app type (e.g. firm home, agency-admin dashboard, one client login + dashboard) run in CI to guard regressions. Not required for Phase 1; add when you want higher confidence before releases.

### Phase 2 → 3 triggers

- p95 query time (with cache warm) >300ms for 10 days.
- Any tenant requires HIPAA/SOC2 → dedicated Supabase project / BAA (do not wait).
- One tenant consistently >20% DB CPU → move that tenant first.

Phase 3 (schema-per-tenant, 200+ clients) requires a second engineer for safe dual-write and migration; see [CONTRIBUTING.md](../CONTRIBUTING.md) and [docs/development/RENDERING.md](../development/RENDERING.md) for build and rendering options.

---

## Rendering

Apps use the Next.js App Router. By default, routes are static where no dynamic APIs (`cookies()`, `headers()`, `searchParams`) are used; routes that need per-request data are dynamic. Tenant identity is resolved in middleware or layout (e.g. `NEXT_PUBLIC_TENANT_SLUG` per deployment). For per-route control (static, ISR, dynamic, or Partial Prerendering), see [docs/development/RENDERING.md](../development/RENDERING.md) and [docs/research/RESEARCH_MARKETING_MONOREPO_DESIGN_2026.md](../research/RESEARCH_MARKETING_MONOREPO_DESIGN_2026.md) §8a.

---

## Summary

- **Structure:** Monorepo with `apps/` and `packages/`; no app-to-app or app-to-package reverse dependencies.
- **Axes:** Multi-industry (tokens/config), multi-client (RLS + deployments), multi-site (one app per property).
- **Isolation:** Code boundary, database (RLS), cache (tenant-prefixed keys), CI/CD, deployment (per-app Vercel).
- **Component System:** Atomic Design with atoms/molecules/organisms in packages, templates/pages in apps.
- **Scaling:** Stay in Phase 1 until triggers above; then Phase 2 (Redis + Nx), then Phase 3 (schema-per-tenant) with staffing and HIPAA handled explicitly.

---

## References

- Brad Frost, [Atomic Design](https://atomicdesign.bradfrost.com/) (methodology).
- Mykola Aleksandrov, [Atomic Design in Practice (2025)](https://mykolaaleksandrov.dev/posts/2025/11/atomic-design-in-practice/) — What works, pitfalls, rollout.
- Wunderman Thompson / Vercel — Monorepo + Turborepo + headless CMS + Atomic Design (10x/25x gains).
