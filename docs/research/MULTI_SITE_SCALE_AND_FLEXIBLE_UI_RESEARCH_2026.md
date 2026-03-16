# Multi-Client / Multi-Site Scale & Flexible UI — Research (Mar 2026)

**Purpose:** Up-to-date (03/2026) research on (1) rendering hundreds/thousands of sites with minimal content in site folders and maximum flexibility, (2) the most versatile and flexible UI options and rendering approaches, (3) analysis of existing repo research with enrichment, and (4) information gaps and methodologies with targeted research.  
**Audience:** Architects and developers deciding scaling strategy and UI flexibility; AI agents implementing multi-site or block-based UIs.  
**Complements:** [RESEARCH_MARKETING_MONOREPO_DESIGN_2026.md](./RESEARCH_MARKETING_MONOREPO_DESIGN_2026.md), [ARCHITECTURE.md](../architecture/ARCHITECTURE.md), [MINIMAL_APP_RENDER_FROM_PACKAGES.md](../architecture/MINIMAL_APP_RENDER_FROM_PACKAGES.md), [RENDERING.md](../development/RENDERING.md).

---

## 1. Multi-client, multi-site rendering at scale (hundreds/thousands of sites)

### 1.1 Two architectural choices

| Model | Description | Site folders | Best for |
|-------|-------------|--------------|----------|
| **One app per site (current)** | Each client/site = one Next.js app in `apps/` (e.g. `apps/prospective-clients/[slug]`, `apps/clients/[slug]`). One Vercel project per app; one deployment per site. | **One folder per site** | Strong isolation per client, per-client deploy/rollback, clear billing per client; scale = many app folders. |
| **Single app, multi-tenant** | One Next.js app serves all sites. Tenant identified by subdomain, path, or custom domain in middleware/proxy; routes and data are tenant-scoped. | **Zero site folders** (sites = rows in DB + config) | Hundreds/thousands of sites with **least content in site folders**; one codebase, one deploy; tenant = data + config. |

**To minimize content in site folders and maximize flexibility at scale:** the single-app multi-tenant model is the standard approach. One deployment serves all tenants; “sites” are not folders but **tenant records + configuration + (optionally) CMS content**.

### 1.2 Single-app multi-tenant: how it works (2025–2026)

**Consensus (Next.js, Vercel, SaaS guides):** A **single Next.js application** serving multiple tenants is the preferred architecture for scaling to many customers/sites.

- **Routing strategies:**
  1. **Path-based:** `yourdomain.com/acme/dashboard` — tenant in path; no DNS; good for MVP.
  2. **Subdomain-based:** `acme.yourdomain.com` — tenant from host; wildcard DNS; strong isolation feel.
  3. **Custom domain:** `app.acmecorp.com` — tenant from host; per-domain SSL; enterprise expectation.

- **Tenant resolution:** Done at the **edge** before app code runs:
  - **Next.js 15 and earlier:** `middleware.ts` reads host (and optionally path), looks up tenant (DB or cache), sets headers (e.g. `x-tenant-id`, `x-tenant-slug`), optionally rewrites to a tenant route group (e.g. `/tenant/...`).
  - **Next.js 16 (when adopted):** Some guides reference `proxy.ts` for the same role (edge intercept, rewrite, headers). Our repo uses `middleware.ts`; if Next.js 16 standardizes on `proxy.ts`, migration is a rename and API alignment.

- **Route structure (single app):**
  - Route groups: e.g. `(marketing)` for root domain, `(tenant)` for tenant-scoped pages.
  - Middleware/proxy: if tenant detected → rewrite to `(tenant)` and set tenant headers; else serve `(marketing)`.
  - **No per-tenant folders:** Tenant-specific pages are the same code; tenant comes from headers/layout context.

- **Data isolation:** Shared database with **tenant_id** on every row; RLS (or equivalent) so each tenant sees only their data. Tenant identity from **auth only** (e.g. JWT `app_metadata.tenant_id`), never from client-controlled headers for authorization.

**Outcome:** Hundreds or thousands of “sites” = hundreds/thousands of tenant rows + config (and optional CMS spaces). **Zero** additional site folders; one app folder, one build, one deploy.

### 1.3 When to stay with one app per site (current model)

- **Per-client deploy/rollback** — Each client has its own Vercel project and history.
- **Per-client billing and limits** — Isolate usage and cost per client.
- **Regulatory or contractual isolation** — Some clients require separate deployments or infra.
- **Different stacks or major versions** — Rare; one client on Next 14 while others on 16, etc.

**Current repo:** Uses one app per site (`apps/firm`, `apps/prospective-clients/*`, `apps/clients/*`). Scaling to “hundreds” of sites in this model = hundreds of app folders + hundreds of Vercel projects. **To reach “thousands” with “least content in site folders,”** the architecture would need to shift to **single-app multi-tenant** (or a hybrid: one app for “long-tail” tenants, separate apps for enterprise clients that need isolation).

### 1.4 Hybrid and transition

- **Hybrid:** One “platform” app for many small clients (single-app multi-tenant) + a few dedicated apps for high-touch or regulated clients.
- **Transition:** Introduce a new app (e.g. `apps/platform`) that uses middleware + tenant DB/cache and serves `*.yourdomain.com` (and optional custom domains). New clients onboard as tenants (config + token file + tenant row); no new app folder. Migrate existing “long-tail” apps into the platform app over time if desired.

### 1.5 Minimizing content in site folders (both models)

- **Shared code in packages:** All shared UI, data access, and business logic live in `packages/`. Apps (or the single platform app) only contain route tree, tenant/site config, and thin wrappers. See [MINIMAL_APP_RENDER_FROM_PACKAGES.md](../architecture/MINIMAL_APP_RENDER_FROM_PACKAGES.md).
- **Config-driven layout:** One shared layout component (e.g. in `packages/ui`) that accepts nav links, brand name, and footer config; app (or tenant config) supplies data only.
- **Design tokens per tenant:** Per-tenant token file (e.g. `tokens/clients/[slug].json`) → built CSS; no per-site component duplication. Same components, different tokens.
- **Content from CMS:** Page structure and copy from headless CMS (per-tenant or per-site space); app renders from content, so “site folders” don’t hold copy or structure—only routing and config.

**Sources:** Next.js multi-tenant guide, Next.js Launchpad (Next.js Multi-Tenant SaaS 2026), Vercel for Platforms, Supastarter (multi-tenant Next.js), existing RESEARCH_MARKETING_MONOREPO_DESIGN_2026 §8a, §13.

---

## 2. Most versatile, flexible UI options and rendering

### 2.1 Token-driven theming (already in repo)

- **One component set, many brands:** Monolithic component library + semantic/component tokens; per-tenant or per-brand token files produce different CSS. No component duplication.
- **Three-tier tokens:** Primitives → semantic → component. Components use semantic/component tokens only; swapping token set swaps entire look without code changes.
- **Runtime theming:** CSS variables allow theme switch via class or attribute (e.g. `.dark`, `[data-theme="client-a"]`) without rebuild.

**Verdict:** Already aligned with repo; maximizes flexibility for color, spacing, typography, and motion across many brands.

### 2.2 Component variants and composition

- **Variants over many components:** One component with variants (size, style, state) via CVA or similar; reduces library size and keeps APIs consistent. Penpot/Supernova-style “component variants” scale design systems without clutter.
- **Compound components:** Radix-style (e.g. `Dialog.Root`, `Dialog.Trigger`, `Dialog.Content`) and polymorphic `asChild` give composition flexibility without sacrificing accessibility.
- **Avoid over-generalization:** Only abstract patterns that repeat; keep a single source of truth for each pattern.

**Verdict:** Matches current shadcn/Radix + CVA approach; continue using variants and composition for maximum flexibility without duplication.

### 2.3 Block-based / content-driven UI (enrichment)

**Goal:** Pages or sections assembled from a list of “blocks” (hero, features, FAQ, CTA) defined in data (CMS, DB, or config). The app **maps block type → React component** and renders the list. This gives non-developers the ability to compose pages and keeps “structure” out of code.

**Pattern:**

1. **Content model:** Each page (or section) is an ordered list of blocks. Each block has a **type** (e.g. `hero`, `featureGrid`, `contactForm`) and **props** (title, items, layout, etc.).
2. **Component registry:** A map `Record<string, React.ComponentType<BlockProps>>` (or similar) in a package (e.g. `packages/ui` or `packages/blocks`). Only registered block types can be rendered.
3. **Renderer:** A single component (e.g. `BlockRenderer`) that takes `blocks: Block[]`, looks up each block’s component by type, and renders it with the block’s props. No giant switch or if/else; adding a block type = add to registry + implement component.
4. **Validation:** Block props validated with Zod (or equivalent) from a shared schema so CMS or config cannot inject invalid props.

**Headless CMS alignment:** Storyblok, Prepr, Sanity, Agility, MakeIt Composer, and similar support block-based or component-based content. They deliver JSON that matches your block schema; your app runs it through the registry and renders. Multi-site CMS (e.g. Prepr) supports shared schemas and per-site content, so one codebase can serve many sites with different content.

**Benefits:**

- **Flexible UI:** Marketing can reorder, add, or remove sections without code.
- **Consistent design:** Only approved block types (from the design system) are allowed.
- **Minimal “site” logic:** Page component is “fetch content → pass to BlockRenderer”; no per-page JSX for structure.

**Verdict:** Add a **block registry + BlockRenderer** pattern (in a package) when you need content-driven or CMS-driven pages. This is the main “versatile UI” enrichment beyond current atoms/molecules/organisms.

### 2.4 Slot-based and layout primitives

- **Slots:** Layout components that accept `header`, `sidebar`, `children`, `footer` (or similar) so the same layout can be used with different compositions. Reduces layout duplication.
- **Layout primitives:** Shared `Stack`, `Grid`, `Container` in `packages/ui` so every app (or every tenant) uses the same spacing and breakpoints. Combined with tokens, this keeps layout flexible and consistent.

**Verdict:** Already partially present (e.g. layout with header/footer); formalize slot-based layout in shared package if you want maximum composition flexibility.

### 2.5 Server Components and client boundaries

- **Default Server Components:** Most UI can be server-rendered; no JS sent for static or ISR content. Keeps bundles small and INP good.
- **Client only where needed:** Forms, modals, interactive widgets use `'use client'` at the boundary; pass data from Server Components as props. This preserves “flexible” rendering (static shell + dynamic islands) without sacrificing performance.

**Verdict:** Already in place; keep Server Components by default and thin client boundaries for maximum flexibility (static/dynamic/PPR/ISR) per route.

**Sources:** RESEARCH_MARKETING_MONOREPO_DESIGN_2026 §3, §4; Design Tokens & Theming (MaterialUI 2025); Supernova multi-brand; Penpot component variants; Storyblok, Prepr, headless CMS block modeling (ElmapiCMS, MakeIt Composer); existing ARCHITECTURE component structure.

---

## 3. Analysis of existing research and enrichment performed

### 3.1 Existing research reviewed

| Document | Strengths | Gaps identified |
|----------|-----------|------------------|
| **RESEARCH_MARKETING_MONOREPO_DESIGN_2026** | Tokens (DTCG, Style Dictionary v4), components, §8a rendering (static/dynamic/ISR/PPR/cache), governance, testing, security, i18n, onboarding. | No explicit “hundreds/thousands of sites” or one-app-vs-many-apps tradeoffs; no block-based/registry UI pattern. |
| **ARCHITECTURE** | Multi-industry, multi-client, multi-site; Phase 1/2/3; RLS; one app per property. | Scaling described as “more apps” and Phase 2/3 DB/cache; no single-app multi-tenant as an option. |
| **MINIMAL_APP_RENDER_FROM_PACKAGES** | Config-driven layout, shared Providers, shared form view, route = data + package component; checklist. | Assumes “one app per site”; doesn’t cover “zero site folders” (single app). |
| **CODEBASE_ANALYSIS** | Implementation gaps (CI, RLS tests, agency-admin, scaffold). | Not an architecture doc; doesn’t address scale or UI flexibility. |
| **RENDERING.md** | Per-route strategy, tenant in middleware, ISR/PPR/cache. | Short; defers to research §8a; no scale or block-based content. |
| **RESEARCH_TOPICS_2026** | Per-topic basics, best practices, enterprise, novel; multi-tenant, tokens, testing. | No “single app vs many apps at scale”; no block/registry pattern. |

### 3.2 Enrichment research conducted

- **Multi-tenant at scale:** Single Next.js app serving many tenants is the recommended pattern (Next.js, Vercel, SaaS guides); subdomain/path/custom domain; tenant resolution in middleware/proxy; one deploy, zero site folders for tenant identity. When to stay one-app-per-site: isolation, billing, compliance.
- **Flexible UI:** Block-based page composition (block type → component registry → renderer); headless CMS multi-site and block modeling (Storyblok, Prepr, etc.); component variants and token-driven theming; slot-based layout.
- **Next.js 16:** References to `proxy.ts` for edge intercept (Next.js Launchpad); official Next.js multi-tenant guide points to Vercel platforms starter kit. Repo continues to use `middleware.ts` until proxy is standard.

### 3.3 What still needs enrichment (recommended)

- **Operational limits:** At what tenant count does a single Next.js app hit limits (e.g. build time, cold start, middleware latency) and what mitigations exist (caching tenant lookup, edge config, split by region).
- **Component registry implementation:** Concrete TypeScript types and safety (discriminated union for block types, Zod schemas per block) and where the registry lives (e.g. `packages/blocks` vs `packages/ui`).
- **CMS choice for block-based:** Short comparison (Storyblok vs Prepr vs Sanity vs Agility) for multi-site + block delivery and how they integrate with Next.js App Router and ISR.

---

## 4. Information gaps and methodologies — research and recommendations

### 4.1 Gap: “Thousands of sites” with “least content in site folders”

**Finding:** To minimize content in site folders at scale, **single-app multi-tenant** is the standard approach. “Sites” become tenant records + config + optional CMS content; no new folder per site. The current “one app per site” model maximizes isolation and per-client deploy but does not minimize folder count.

**Methodology:** Treat “least content in site folders” as an explicit goal; then:
- **Option A (single app):** One platform app + tenant resolution + config/tokens/CMS per tenant; zero site folders.
- **Option B (current):** Keep one app per site; minimize **per-app** content by pushing everything to packages and config (already documented in MINIMAL_APP_RENDER_FROM_PACKAGES).
- **Option C (hybrid):** Platform app for long-tail; dedicated apps for clients that need isolation.

**Recommendation:** Document both Option A and B in ARCHITECTURE or a new “Scaling strategies” section; choose based on product (e.g. “we will have 500+ small clients” → lean toward A; “we have 20 enterprise clients with strict isolation” → stay with B or C).

### 4.2 Gap: Flexible UI beyond tokens and variants

**Finding:** The main missing pattern is **block-based / content-driven** rendering: a component registry that maps block type → component and a renderer that iterates over blocks from CMS or config. This gives the “most versatile” page composition without hard-coded page layouts.

**Methodology:** When a page is “list of sections” and sections are known types (hero, features, FAQ, CTA):
- Define a block schema (type + props per type) and Zod schemas.
- Implement one React component per block type in a shared package.
- Registry: `BLOCK_REGISTRY: Record<BlockType, ComponentType>`.
- `BlockRenderer({ blocks })` maps each block to its component and renders with validated props.
- CMS or config produces `blocks`; app fetches and passes to `BlockRenderer`.

**Recommendation:** Add a small “Block-based pages” subsection to RESEARCH_MARKETING_MONOREPO_DESIGN_2026 or to ARCHITECTURE; implement registry + BlockRenderer when the first CMS-driven or config-driven marketing page is required.

### 4.3 Gap: Single app vs many apps (tradeoff table)

**Finding:** Existing docs describe “multi-site = separate app per property” but do not compare “one app, many tenants” vs “many apps” in one place.

**Methodology:** Add a decision table:

| Criterion | Single app, multi-tenant | One app per site |
|-----------|---------------------------|-------------------|
| Number of site folders | 0 (sites = data) | N (one per site) |
| Deploys | 1 | N |
| Per-client rollback | Config/feature flag or tenant-specific release | Per-app deploy |
| Per-client billing | Custom (usage tagging) | Native (Vercel project) |
| Tenant isolation | RLS + auth; shared runtime | Process + project isolation |
| Build time | One build for all | N builds (can be parallelized) |
| Cold start | One app; can be optimized | Per-app |

**Recommendation:** Add this table to ARCHITECTURE or to this document’s §1 and reference it from MINIMAL_APP_RENDER_FROM_PACKAGES so “minimal site folders” is explicitly tied to the single-app model.

### 4.4 Gap: Edge tenant resolution at scale

**Finding:** Middleware runs on every request; tenant lookup (e.g. hostname → tenant slug) must be fast. At hundreds/thousands of tenants, in-middleware DB calls can be slow; caching (e.g. edge config, Redis, or in-memory with TTL) is recommended.

**Methodology:** Resolve tenant in middleware from: (1) in-memory map (small N), (2) edge config (Vercel Edge Config) or KV, or (3) DB with short TTL cache. Never block middleware on a slow DB round-trip for every request.

**Recommendation:** In Phase 2 (50–200 clients), ARCHITECTURE already mentions “tenant config cache (e.g. Redis, `tenant:{slug}:config`)”; extend to “tenant resolution cache” so middleware reads from cache first, then DB on miss. Document in RENDERING or ARCHITECTURE.

---

## 5. Summary and checklist

### 5.1 Multi-client / multi-site at scale

- **For “least content in site folders” and “hundreds/thousands of sites”:** Prefer **single Next.js app, multi-tenant**. Tenant = subdomain/path/custom domain; resolved in middleware/proxy; sites = tenant rows + config + optional CMS. Zero site folders.
- **For per-client isolation and deploy:** Keep **one app per site**; minimize per-app content via packages and config (see MINIMAL_APP_RENDER_FROM_PACKAGES).
- **Hybrid:** One platform app for long-tail tenants + dedicated apps for clients that need isolation.

### 5.2 Flexible UI

- **Tokens + variants + composition:** Already in place; keep monolithic component set and token-driven theming.
- **Block-based rendering:** Add **component registry + BlockRenderer** when pages are content- or CMS-driven; register one component per block type; validate props with Zod.
- **Slots and layout primitives:** Use shared layout components with slots and token-based Stack/Grid/Container for maximum composition flexibility.

### 5.3 Enrichment and gaps closed by this research

- Single-app vs one-app-per-site tradeoffs and when to use each.
- Block-based / content-driven UI pattern (registry + renderer) and alignment with headless CMS.
- Explicit “zero site folders” model (single app) and “minimal site folders” (packages + config in current model).
- Edge tenant resolution and caching at scale (reference to Phase 2 cache).

### 5.4 Recommended next steps

- [ ] Document “Scaling strategies: single app vs one app per site” in ARCHITECTURE (or link to this doc) with the tradeoff table.
- [ ] When adding CMS-driven or config-driven pages: introduce `packages/blocks` (or block registry in `packages/ui`) with BlockRenderer and Zod schemas; document in RESEARCH_MARKETING_MONOREPO_DESIGN_2026 or ARCHITECTURE.
- [ ] In Phase 2, add tenant resolution cache (e.g. Edge Config or Redis) for middleware; document in ARCHITECTURE Phase 2 and RENDERING.
- [ ] Optionally: add a “Platform app” (single-app multi-tenant) as a new app and migrate or onboard long-tail clients as tenants if the product direction is “hundreds/thousands of sites with minimal site folders.”

---

**Sources (all §1–§4):** Next.js multi-tenant guide, Next.js Launchpad (Next.js Multi-Tenant SaaS 2026), Vercel for Platforms / multi-tenant template, Supastarter (multi-tenant Next.js), RESEARCH_MARKETING_MONOREPO_DESIGN_2026, ARCHITECTURE, MINIMAL_APP_RENDER_FROM_PACKAGES, CODEBASE_ANALYSIS, RENDERING.md, RESEARCH_TOPICS_2026; Storyblok, Prepr, ElmapiCMS (block modeling), MakeIt Composer; MaterialUI design tokens & theming 2025, Supernova multi-brand, Penpot component variants.
