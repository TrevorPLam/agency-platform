# Research: Marketing-First Multi-Industry, Multi-Client, Multi-Site Repository

**Date:** March 2026  
**Scope:** Repository that houses the agency’s marketing site, all client websites, standalone landing pages, native applications (e.g. booking), and related tooling — multi-industry, multi-client, multi-site.

---

## 1. Definition: “Marketing-First” Repository

A **marketing-first** repository is a single codebase and repo that:

- Puts **content, branding, and go-to-market** ahead of generic product UI — shared design tokens, component libraries, and CMS-driven content.
- Serves **multiple surfaces** from one source: agency site, client sites, landing pages, and native apps.
- Uses **configuration over code** so new clients/industries/sites are added via config and content, not new codebases.
- Shares **one content foundation** (headless CMS) and one design system so updates propagate everywhere.

It is **not** a single Next.js app with path-based tenants only; it can include multiple deployable apps (per client or per surface) that share packages and content.

---

## 2. What This Repository Should House

| Surface | Description | Typical deployment |
|--------|-------------|---------------------|
| **Agency marketing site** | Your own brand, case studies, pricing, contact | One app, one domain |
| **Client websites** | Full marketing sites per client (healthcare, e‑commerce, hospitality, etc.) | One app per client or one app with tenant routing |
| **Standalone landing pages** | Campaigns, product launches, events — can be client-specific or agency-run | Same app with route segments or separate small app(s) |
| **Native applications** | Booking widget, mobile app (e.g. Expo), kiosk or tablet UI | Shared packages; separate app entries (Next.js, Expo) |
| **Internal tools** | Agency admin, content preview, client dashboards | One or more apps in `apps/` |

All of these can live in one monorepo with:

- **`apps/`** — each deployable surface (agency site, client sites, landing-page app, Expo app, admin).
- **`packages/`** — shared UI, design tokens, database/CMS clients, analytics, booking logic.
- **Single content model** — one CMS (e.g. Sanity) with tenant/dataset/site awareness.

---

## 3. Architectural Patterns (2025–2026)

### 3.1 Multi-Tenant vs Multi-Project

| Approach | Use case | Pros | Cons |
|----------|----------|------|------|
| **Single codebase, single deployment** | One Next.js app; middleware resolves tenant by hostname/path | One deploy, one Vercel project, lowest ops | All tenants on same app; scaling and isolation are shared |
| **Single codebase, multiple deployments** | One repo; each client (or group) is a separate Vercel project / app in `apps/` | Strong isolation, per-client domains and envs | More projects and builds; watch Vercel pricing cliffs |
| **Hybrid** | Agency + “template” client app; new clients = new Vercel project from same app | Clear separation, easy to explain per client | Same as above |

For an agency with many client sites and possible native apps, **single codebase + multiple app entries** (agency site, client app, landing pages, native) is the most flexible: shared packages, clear boundaries, and the option to deploy one app per client or to use middleware for many clients on one deployment.

### 3.2 Tenant / Site Identification

Three common strategies:

1. **Subdomain** — `client.yourdomain.com`  
   - Needs wildcard DNS and middleware that maps subdomain → tenant.  
   - Fits SaaS/agency when you control the domain.

2. **Custom domain** — `client.com`  
   - Middleware or edge logic looks up `host` in a store (DB or Redis) to get tenant/site.  
   - Standard for white-label and “each client has their own domain.”

3. **Path** — `yourdomain.com/client/slug`  
   - Easiest (no DNS).  
   - Often used for internal or MVP; less “white-label” feel.

Vercel’s multi-tenant template and Platforms docs use **middleware that reads hostname** and rewrites or sets headers (e.g. `x-tenant-domain`) so the app can resolve tenant without changing URL structure. Same idea applies to path-based if you use the first segment as tenant/site key.

### 3.3 Configuration Over Code

White-label and multi-industry playbooks stress:

- **Theme/brand:** Design tokens (e.g. Style Dictionary) → CSS variables → Tailwind; per-client or per-site token files, no component branches for “client A vs B.”
- **Features:** Feature flags or tenant config (e.g. `industry`, `features.booking`) so the same components behave differently by tenant.
- **Content:** CMS models and datasets per tenant/site; same schema, different data.
- **Integrations:** API keys and endpoints in env or tenant config, not hardcoded.

So: **one codebase, many configurations** (tokens, CMS, env, DB tenant row) rather than many codebases.

---

## 4. Recommended Repo Structure

```
marketing-platform/
├── apps/
│   ├── agency-site/              # Your agency marketing site
│   ├── clients/                  # Client-facing sites (or one “client-app” with tenant routing)
│   │   ├── [client-a]/
│   │   └── [client-b]/
│   ├── landing-pages/            # Standalone landing page app (optional; can live under agency or client app)
│   ├── booking/                  # Booking experience (web + optional embed)
│   ├── mobile/                   # Expo app (booking, info, etc.)
│   └── agency-admin/             # Internal dashboard
├── packages/
│   ├── ui/                       # Shared components (e.g. shadcn-based)
│   ├── design-tokens/            # Style Dictionary → Tailwind v4; per-client/site tokens
│   ├── database/                 # Supabase (or other) client, RLS, tenant helpers
│   ├── cms/                      # Sanity (or other) client, queries, types
│   ├── analytics/                # PostHog / analytics, tenant-aware
│   ├── booking-core/             # Shared booking logic, types, validation
│   └── typescript-config/
├── tooling/                      # Optional: shared ESLint, etc.
├── supabase/                     # Migrations, RLS tests
└── docs/
```

- **Agency site** and **client sites** can be separate apps (e.g. `agency-site`, `clients/[slug]`) or one app with middleware-based tenant resolution.
- **Landing pages** can be routes inside agency or client app, or a dedicated app if you need different build/runtime (e.g. static-only).
- **Native** lives in `apps/mobile` (Expo), consuming `packages/ui`, `packages/booking-core`, `packages/cms`, etc.

---

## 5. Technology Stack (Current Best Practice)

### 5.1 Monorepo & Build

- **Turborepo** — Simple, fast for &lt;~30 packages; good for getting started and for CI caching.
- **Nx** — Better when you have many packages, cross-domain imports, or need distributed/CI optimizations; can be adopted later or instead of Turbo.
- **pnpm** (v10+) with **catalog** — Strict dependency versions across apps and packages; avoids React/Next version drift.

### 5.2 Frontend & Routing

- **Next.js 16** (App Router) — Default for web; Turbopack for dev/build; middleware for tenant/site resolution.
- **React 19** — Stable; use Server Components for content-heavy marketing pages.
- **Tailwind v4** — CSS-first; `@theme` and design tokens drive styling; no `tailwind.config.js` in the classic sense.

### 5.3 Design System & Tokens

- **Style Dictionary v4** — W3C DTCG-style tokens; output CSS variables for Tailwind v4 (`@theme` / `:root`).
- **Three-tier tokens:** primitive → semantic → component (and optionally per-client overrides).
- **Single component library** in `packages/ui`; appearance comes from tokens, not from separate “client” component sets.

### 5.4 Content (Multi-Site CMS)

- **Sanity** — Strong fit for multi-site: one project, tenant-aware datasets or document types; single Studio, content reused across web and native; real-time, structured content, good for AI/automation later.
- **Contentful** — Alternative; cloud-only; also supports multi-site with spaces/environments.
- **Multi-site CMS requirements:** one source of truth, reuse across sites, optional localization, clear access control per site/tenant.

### 5.5 Data & Auth

- **Supabase** — Postgres + Auth + RLS; use **Supavisor (port 6543)** for serverless; tenant_id in `app_metadata` and RLS on all tenant tables.
- **Row-Level Security** — Non-negotiable for multi-tenant; index `tenant_id`; keep JWT reading in a subquery for performance.

### 5.6 Deployment & Hosting

- **Vercel** — Native Next.js; middleware at the edge for tenant resolution; either one project (single app, many domains) or one project per app (e.g. per client) with cost awareness.
- **Multi-tenant on Vercel:** hostname-based rewrite in middleware; optional Redis (e.g. Upstash) for tenant lookup; preview URLs with tenant prefix for testing.

### 5.7 Native (Booking, Mobile)

- **Expo (SDK 52+)** — Monorepo support is built-in; works with pnpm workspaces; `apps/mobile` can depend on `packages/ui`, `packages/booking-core`, `packages/cms`.
- **Shared code:** 60–80% shareable (UI, API clients, types, business logic) when using React Native Web and platform-specific files (`.ios.ts`, `.android.ts`, `.web.ts`) where needed.
- **One repo layout:** `apps/web` (Next.js), `apps/mobile` (Expo), `packages/*` shared.

---

## 6. Multi-Industry Without Code Branches

- **Industry as config:** Each tenant/site has an `industry` (e.g. `healthcare`, `ecommerce`, `hospitality`, `general`).
- **Content schema:** Same document types (e.g. Page, Product, BookingConfig); industry-specific validation or required fields in CMS.
- **Features:** Feature flags or tenant config (e.g. `booking`, `shop`, `patient_portal`) drive which routes and components are enabled.
- **Compliance:** HIPAA or other regulated industries get isolated data (e.g. dedicated Supabase project or schema) while still using the same app code and packages.

So: **one codebase, one design system, one content model** — differentiation by configuration and content, not by forking the repo.

---

## 7. Landing Pages in the Same Repo

Options:

- **Same app, dynamic routes** — e.g. `app/[site]/landing/[slug]/page.tsx` with content from CMS; good for many landing pages with the same layout and components.
- **Dedicated app** — e.g. `apps/landing-pages` for a static or edge-only build if you want to optimize purely for landing pages (speed, edge).
- **Component library** — Reusable sections (hero, CTA, pricing, FAQ, testimonials) in `packages/ui` or `packages/landing-sections`; used by agency site, client sites, and landing routes. Tools like ConvertFast UI and page-ui (React + Tailwind) align with this: sections + design tokens.

Landing pages should use the **same design tokens and CMS** so they stay on-brand and content-updatable without code deploys.

---

## 8. Native Applications (e.g. Booking)

- **Booking “app”** can be:
  - **Web:** Next.js app or route(s) under client/agency app (e.g. `apps/booking` or `apps/clients/[slug]/booking`).
  - **Embeddable widget:** Package in `packages/booking-core` or `packages/booking-widget` consumed by web apps.
  - **Native:** Expo app in `apps/mobile` that uses the same `packages/booking-core` (types, API, validation) and shared UI where possible.
- **Expo monorepo:** Use workspace deps (`"@platform/ui": "workspace:*"`); Expo 52+ detects the monorepo and configures Metro; no custom `watchFolders` needed in typical setups.
- **Shared layers:** API client, auth, analytics, and booking logic in packages; only presentation and platform APIs differ (web vs native).

---

## 9. Security & Isolation

- **RLS** on every tenant-scoped table; `tenant_id` from JWT `app_metadata`; index on `tenant_id` and use a single subquery for JWT in policies.
- **No cross-tenant imports:** Linting rules to prevent `apps/client-a` importing from `apps/client-b`.
- **Service role** only in server-only code and never exposed to the client.
- **CMS:** Per-tenant datasets or access rules so content is isolated by tenant/site.
- **Env:** Per deployment (per app or per client); no shared secrets between tenants.

---

## 10. Cost and Scaling Considerations

- **Vercel:** One project per app (e.g. one for “all clients” with middleware) avoids per-client project cost; multiple projects (e.g. per client) can hit higher tiers sooner.
- **Supabase:** Single project + RLS scales to many tenants; HIPAA or high isolation may require a project per tenant or per industry.
- **CMS:** Sanity/Contentful document limits and seats; multi-site and multi-dataset usage should be planned.
- **Build time:** Affected builds (`turbo run build --affected` or Nx) keep CI fast as the repo grows; consider Nx when package count and dependency graph grow.

---

## 11. Summary: What “Marketing-First” Means Here

| Principle | Implementation |
|-----------|----------------|
| **One repo** | Monorepo with `apps/` (agency, clients, landing, booking, mobile, admin) and `packages/` (ui, tokens, db, cms, analytics, booking-core). |
| **Multi-industry** | Industry as config + optional compliance (e.g. dedicated DB for HIPAA); same code and content model. |
| **Multi-client** | Tenant/site in DB and CMS; RLS and middleware; one app per client or one app with tenant routing. |
| **Multi-site** | Agency site + client sites + landing pages as different apps or routes; same design system and CMS. |
| **Native apps** | Expo app in `apps/mobile` sharing packages with web; booking and content shared. |
| **Marketing-first** | Design tokens + shared UI + headless CMS as the backbone; new sites and campaigns are config and content, not new repos. |

This aligns with your existing GUIDE.md (Turborepo, pnpm, Supabase RLS, Style Dictionary, Tailwind v4, Sanity) and extends it to explicitly include agency site, standalone landing pages, and native apps in one marketing-first repository.

---

## 12. References (2025–2026)

- Vercel Platforms: Multi-tenant template, hostname rewrites, preview URLs.  
- Sanity: Multi-site CMS (single source of truth, omnichannel, tenant-aware).  
- Medium / posts: React monorepo for multiple tenant apps; Next.js 15 enterprise patterns; white-label playbook (30+ brands).  
- Expo: Monorepo guide (SDK 52+), shared code with Next.js.  
- Nx: Turborepo vs Nx; adding Nx to existing workspace.  
- White-label: Configuration over code; runtime vs build-time config; micro-frontends as an option.  
- Crystallize: Multi-tenant headless agency playbook.  
- Next.js 16: App Router, dynamic segments, “use cache”, middleware/proxy.

---

*Research synthesized for the agency-platform repository. Use with GUIDE.md for implementation details (tokens, RLS, Supabase, scaffolding).*
