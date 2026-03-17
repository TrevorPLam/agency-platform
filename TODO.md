# Agency Platform TODO (03/2026 Refresh — Renumbered & Enhanced)

This roadmap reflects:

- Up-to-date 03/2026 standards and market direction.
- Verified repository state from `apps/`, `packages/`, `supabase/`, and `docs/`.
- Practical execution order for an agency platform monorepo:
  - agency marketing site,
  - client sites,
  - native tools (booking, analytics, operations).

---

## 1) Research Synthesis (03/2026)

### 1.1 Basics and Fundamentals

- Use a composable monorepo architecture with clear app/package boundaries.
- Keep public websites fast, indexable, and accessible by default.
- Prefer Server Components by default and only add client boundaries where needed.
- Treat tenant isolation and RLS as non-negotiable for all client data paths.
- Track outcomes, not pageviews: conversion events, lead quality, and downstream revenue signals.

### 1.2 Best Practices and Highest Standards

- **Next.js 16 baseline:** Node >= 20.9, Turbopack default, App Router file conventions (`sitemap.ts`, `robots.ts`, metadata APIs).
- **Rendering tier model:** Static (build-time, default) → ISR (`export const revalidate = N`) → Streaming (Suspense boundaries + `loading.tsx`) → Dynamic (`force-dynamic`). Partial Prerendering (PPR, Next.js 15+ opt-in) renders a static shell at build time and streams dynamic Suspense slots per request — best of static and dynamic in one route.
- **Server Components by default:** `'use client'` only at leaf boundaries (event handlers, browser APIs, React hooks). Data fetching belongs in async Server Components, not `useEffect`.
- **`generateStaticParams` for dynamic routes:** Without it, `[slug]` segments render on-demand (not pre-generated). Combine with `revalidate` for ISR, or omit for always-fresh SSR.
- **Font optimization (`next/font`):** `next/font/google` downloads fonts at build time and serves them from the same origin — no external network round-trip per user. CSS variable injection (`variable: '--font-sans'`) integrates cleanly with design tokens. Omitting `next/font` means Inter falls back to whatever system font the device has installed.
- **Image optimization (`next/image`):** Required for LCP. `priority` prop on the above-the-fold image disables lazy loading. `sizes` attribute for responsive sizing. `placeholder="blur"` eliminates CLS. AVIF + WebP via `formats` in `next.config.ts`. Without `next/image`, images are unoptimized `<img>` tags with no format conversion or size negotiation.
- **Mobile-first navigation:** Sheet/drawer (Radix Dialog-based, focus-trapped) is the 2026 standard for mobile nav. 44×44px minimum touch targets (WCAG 2.5.5). `usePathname` to close on route change. `aria-label` on `<nav>` landmark.
- **Design system flexibility:** W3C DTCG token format + semantic token layers enable per-client theming. Organisms layer (Hero, FeatureGrid, PageSection) built from design-token classes — not hardcoded colors — are the reusable units for rapid client site production.
- **Accessibility baseline:** WCAG 2.2 AA target for product quality; legal floor differs by jurisdiction.
- **Security baseline:** security headers + CSP + strict secret handling + validated server actions/routes.
- **Privacy baseline:** consent-aware analytics, first-party event collection, and explicit data minimization.
- **Performance baseline:** Core Web Vitals monitored in field (LCP/INP/CLS), not just local lab checks.

### 1.3 Enterprise Solutions

- Decision gates are required for:
  - CMS (Sanity / Payload / Contentful class),
  - CRM + marketing automation,
  - CMP/consent tooling,
  - warehouse/CDP path for first-party analytics.
- Use feature-flagged rollout for cross-tenant features.
- Standardize operational controls: incident runbooks, observability, deployment checks, and dependency governance.

### 1.4 Novel / Unique / Innovative Techniques

- AI-assisted content operations:
  - assisted brief generation,
  - reusable content blocks,
  - controlled variant generation for tests.
- Experimentation as a platform capability:
  - reusable event taxonomy,
  - server-side assignment where needed,
  - outcome-level reporting in admin.
- Agent-ready operations:
  - deterministic workflows for onboarding, QA, and launch checks,
  - auditable automation for repetitive agency tasks.

---

## 2) True Codebase State (Verified)

### What is already strong

- Multi-app monorepo structure with shared packages and clear domains.
- Supabase tenant model + RLS-oriented data architecture.
- CI/security workflow coverage is broad.
- Shared UI, analytics, booking, database, and operational packages are present.

### What is materially missing or partial

- **Scaffold is broken**: `scaffold-client.ts` copies `layout.tsx` (which imports `SiteHeader`/`SiteFooter`) but never copies those component files — post-scaffold `tsc --noEmit` fails on every run without exception. Port 3002 is hardcoded into every new client `package.json`. riley-day-care bleeds day-care nav links and copy into every scaffolded business.
- **Firm app SEO — partial**: Security headers ✅ implemented in `apps/firm/src/middleware.ts` (CSP nonce, HSTS, X-Frame-Options, Permissions-Policy). `sitemap.ts` ✅ and `robots.ts` ✅ exist. Still missing: `opengraph-image.tsx`, JSON-LD `LocalBusiness`/`WebSite` schema in `layout.tsx`, `generateStaticParams` + `revalidate = 3600` on blog routes.
- **Package build failures**: `packages/security` has `dts: false` — all type exports broken for consumers. `packages/metrics` exports a `./types` subpath that tsup never builds. `packages/database/src/types.ts` is manually hand-written (not auto-generated) — CI drift gate (`diff` against `supabase gen types`) will fail on any fresh Supabase instance. `packages/error-handling/src/` is completely empty.
- **Form hardening — partial**: Contact form Zod validation ✅ implemented in all three apps (firm, riley-day-care, the-barber-cave). Remaining: auth pages in riley-day-care and the-barber-cave still use `<a href>` instead of `next/link` (4 files); message `min(1)` should be `min(10)` per spec.
- **CI failures — partial**: `recovery-test.yml` references 4 shell scripts that do not exist: `scripts/test/cross-region-consistency.sh`, `scripts/test/generate-test-report.sh`, `scripts/communication/send-slack-notification.sh`, `scripts/monitoring/update-metrics.sh`. `governance.yml` runs a `validate-properties` script that requires the governance package to be built first — likely to fail on a clean environment.
- **Platform wiring — partial**: `@agency/analytics/server` ✅ imported in all 4 cost API routes. `@agency/monitoring` ✅ imported in `performance-dashboard.tsx`. `@agency/error-handling` is empty and unreachable end-to-end.
- **Migration defects** (new — source verified): duplicate migration number prefixes and transactional index creation previously made `supabase db reset` unreliable. Prefix collisions have now been renamed to deterministic `006a/006b/006c`, `011a/011b/011c`, `012a/012b`, and `013a/013b` sequences, and `CREATE INDEX CONCURRENTLY` has been removed from the transactional migrations. A clean `supabase db reset` still needs Docker-backed verification.
- **`as any` violations** (new — source verified): 3 confirmed locations break the no-`any` rule: `apps/agency-admin/src/components/performance/performance-dashboard.tsx` (`tenantId as any`), `apps/agency-admin/src/components/security/security-dashboard.tsx` (`e.target.value as any`), `apps/agency-admin/src/app/api/upload/route.ts` (`process.env... as any`).
- **Content stack**: static/hardcoded; no CMS pipeline (intentional deferral per architecture).
- **Mobile navigation absent** (new — source verified): All 3 apps (firm, riley-day-care, the-barber-cave) have desktop-only `SiteHeader`. Nav links render in a flex row with no hamburger button and no Sheet/drawer for mobile viewports. The `Sheet` molecule already exists in `@agency/ui` but is not wired to any navigation component.
- **Firm app dark mode non-functional** (new — source verified): `apps/firm/src/app/globals.css` imports `agency.css` tokens but has no `:root .dark {}` override block. Both riley-day-care and the-barber-cave have correct dark mode token overrides in their `globals.css`. The firm's `ThemeToggle` toggles the `.dark` class but produces no visual change in the firm app.
- **Firm app missing `next/font` optimization** (new — source verified): `apps/firm/src/app/layout.tsx` contains no `next/font` declaration — no font class or variable applied to `<html>/<body>`. Inter is declared only as a CSS variable string in the design token CSS (`--font-primary: Inter, system-ui, sans-serif`), which means Inter only renders correctly on devices where it is pre-installed. Riley-day-care and the-barber-cave both correctly use `next/font/google`.
- **`packages/content` typed schemas unused** (new — source verified): `packages/content/src/content-system.ts` contains complete Zod schemas (BlogPost, ServicePage, CaseStudy) and validation functions. No app consumes them. All blog/service content is inline hardcoded arrays in page files. Dynamic blog slug routes have no `generateStaticParams` in riley-day-care or the-barber-cave. `apps/firm/src/app/sitemap.ts` lists only static routes — all blog post URLs are absent.
- **`@agency/ui` organisms layer empty** (new — source verified): `packages/ui/src/organisms/index.ts` exports nothing. No Hero, FeatureGrid, PageSection, or CTASection components exist — every app builds page sections as duplicated inline JSX.

### Information gaps closed by this refresh

- Converted external standards into concrete engineering tasks.
- Converted codebase findings into explicit priorities and dependency order.
- Added enterprise decision gates (not just implementation tasks).
- Added innovation lane with guardrails so experimentation does not weaken core quality.

### Additional verified risk findings (03/2026 — confirmed from source code, not documentation)

- ~~`apps/agency-admin/src/app/api/costs/*` trusts client-provided `tenant_id`~~ **RESOLVED** (TASK-001): All 4 cost routes now derive tenant context from `validateTenantAccess()` which reads from authenticated session `app_metadata`.
- ~~`apps/agency-admin/src/components/costs/cost-management-dashboard.tsx` calls cost APIs without tenant_id`~~ **RESOLVED** (TASK-002): Dashboard uses typed error classes; no tenant_id in URL params.
- ~~`packages/database/src/types.ts` is empty`~~ **PARTIALLY RESOLVED** (TASK-003): File is now non-empty but is hand-written, not auto-generated. CI drift gate (`diff` against `supabase gen types typescript --local`) will fail on any fresh Supabase instance until generated output is committed.
- `supabase/migrations/012a_artifact_lifecycle_management.sql` still begins with TEXT tenant identifiers for artifact-domain tables, but the deprecated columns are now documented and guarded so the schema can migrate forward to `013a_artifact_tenant_schema_normalization.sql`.
- `supabase/migrations/014_experiments_framework.sql` and `020_web_vitals_metrics.sql` were repaired to remove transaction-invalid `CREATE INDEX CONCURRENTLY` usage and other source-visible SQL blockers, but a clean `supabase db reset` still needs local Docker verification.
- Duplicate migration prefixes across the `006`, `011`, `012`, and `013` ranges were renamed to deterministic lexicographic sequences to remove ambiguous execution order.
- `.github/workflows/recovery-test.yml` references 4 shell scripts that do not exist: `scripts/test/cross-region-consistency.sh`, `scripts/test/generate-test-report.sh`, `scripts/communication/send-slack-notification.sh`, `scripts/monitoring/update-metrics.sh` → workflow fails on every scheduled and manual run.
- **Corrected from prior pass (source-verified)**: riley-day-care and the-barber-cave callback routes already use `validateRedirectUrl` ✅. Both apps already have HSTS, `interest-cohort=()`, `sitemap.ts`, `robots.ts`, `metadataBase`, `error.tsx`, `loading.tsx`, `not-found.tsx` ✅. `@agency/analytics/server` is imported in all 4 cost routes ✅. `@agency/monitoring` is imported in `performance-dashboard.tsx` ✅. Contact form Zod validation is implemented in all three apps ✅. These were incorrectly flagged as missing in the prior analysis.

---

## 3) Execution Rules

- Follow workspace constraints in `.cursor/rules/base.mdc`.
- No `any`; use `unknown` + narrowing or typed interfaces.
- Use named exports only (except Next.js page defaults).
- No cross-app imports; use `packages/*`.
- Keep tasks small and independently reviewable.

---

## [x] TASK-001: API authorization and tenant isolation hardening (agency-admin costs)

**Why:** Current cost routes trust client-provided `tenant_id` and are vulnerable to cross-tenant access/mutation.

**Anti-Patterns to Avoid:**

- **Trusting client headers for tenant scoping**: Never use `x-tenant-id` headers or query params as authoritative; always derive from cryptographically verified session claims.
- **Middleware-only authorization**: Middleware should sanitize, but handlers must re-validate. Defense in depth prevents bypass via direct internal service calls.
- **Role-based access without attribute checks**: Platform admins need explicit `platform_admin` claim checks, not just absence of `tenant_id` in JWT.

**Definition of Done**

- All `apps/agency-admin/src/app/api/costs/*` handlers derive tenant scope from authenticated session (`app_metadata.tenant_id`) or a validated platform-admin path.
- No route authorizes tenant scope from query params/body alone.
- `recommendations` PATCH includes tenant-scoped update guards (no update by `id` alone).
- API handlers enforce auth directly (not only middleware redirect behavior).
- Validation remains in place, but authorization is the primary gate.

**Implementation Tips:**

```typescript
// Pattern: Context extraction with fallback
const tenantContext = await validateTenantAccess(req)
if (tenantContext.type === 'platform_admin' && !tenantContext.isPlatformAdmin) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}
// Always use parameterized queries with tenant_id in WHERE clause, not just relying on RLS
```

**Target Files**

- `apps/agency-admin/src/app/api/costs/summary/route.ts`
- `apps/agency-admin/src/app/api/costs/metrics/route.ts`
- `apps/agency-admin/src/app/api/costs/alerts/route.ts`
- `apps/agency-admin/src/app/api/costs/recommendations/route.ts`
- `packages/database/src/middleware.ts` (documentation/guard usage notes if needed)

---

## [x] TASK-002: Cost dashboard and API contract alignment

**Why:** Dashboard calls and route contracts are currently inconsistent, creating guaranteed runtime errors.

**Advanced Patterns:**

- **API Contract Versioning**: Even for internal APIs, version the route (`/api/v1/costs/*`) to allow gradual migration when schemas change.
- **Schema-First Validation**: Use `zod-to-json-schema` to generate OpenAPI specs from Zod validators, ensuring client and server share exact contracts.
- **Type-Safe Fetch Wrappers**: Create a `createApiClient<TRequest, TResponse>` utility that binds Zod schemas to fetch calls, catching contract mismatches at build time.

**Definition of Done**

- Cost dashboard requests match route contract for tenant context and optional filters.
- Route contract is documented in code comments or shared schema location.
- Error UX for cost dashboard distinguishes auth/authorization failure vs transient backend failure.

**Implementation Tips:**

- Use discriminated unions for error responses: `{ success: false; error: 'auth' | 'network' | 'validation'; message: string }` to drive specific UI states.
- Implement request deduplication in the dashboard using React Query or a custom `useSWR` hook with appropriate stale-while-revalidate windows for cost data (typically 5 minutes).

**Target Files**

- `apps/agency-admin/src/components/costs/cost-management-dashboard.tsx`
- `apps/agency-admin/src/app/api/costs/summary/route.ts`
- `apps/agency-admin/src/app/api/costs/metrics/route.ts`
- `apps/agency-admin/src/app/api/costs/alerts/route.ts`
- `apps/agency-admin/src/app/api/costs/recommendations/route.ts`

---

## [~] TASK-003: Database type generation and drift gate recovery

**Why:** `packages/database/src/types.ts` is non-empty but hand-written — not generated by `supabase gen types`. The CI drift gate diffs against `supabase gen types typescript --local` output; since the hand-written file format differs from generated output, the gate fails on any fresh Supabase instance. Docker is required to regenerate.

**Anti-Patterns:**

- **Manual type maintenance**: Never hand-write database types. Database schemas are the single source of truth; TypeScript should be generated.
- **Generated code in source control without generation docs**: Always include `CONTRIBUTING.md` instructions and a `postinstall` or `prepare` script that warns if generated types are stale.

**Definition of Done**

- `packages/database/src/types.ts` is generated and non-empty.
- Generation command and ownership are documented for contributors.
- CI type drift gate remains green with deterministic regeneration flow.

**Implementation Tips:**

```bash
# Recommended package.json scripts
"db:types": "supabase gen types typescript --local > src/types.ts",
"db:reset": "supabase db reset && pnpm run db:types",
"prebuild": "pnpm run db:types -- --check || (echo 'Run pnpm run db:types' && exit 1)"
```

- Use `supabase start` in CI to spin up a local instance for type generation before the build step, ensuring the drift gate compares against current schema state, not a potentially stale remote database.

**Target Files**

- `packages/database/src/types.ts`
- `packages/database/package.json`
- `.github/workflows/ci.yml`
- `CONTRIBUTING.md`

**Progress Update (03/17/2026)**

- Root and package scripts normalized around deterministic `:local` and `:linked` generation commands.
- CI drift check aligned to `--schema public` so local and CI output targets match.
- Contributor docs updated to reflect the real command surface and the requirement that `supabase db reset` must succeed before generated types can be trusted.
- Remaining blocker: the committed `packages/database/src/types.ts` is still hand-written because local regeneration is currently blocked by missing Docker Desktop in this environment, and known migration integrity defects in TASK-015 still need to be resolved for a clean reset/generation cycle.

---

## [x] TASK-004: Client Scaffold System Overhaul

**Why:** `scaffold-client.ts` copies `layout.tsx` which imports `SiteHeader` and `SiteFooter` from `@/components/` — but those component files are never copied by the script. The post-scaffold `pnpm exec tsc --noEmit` fails on every single run. Additionally: port `3002` is hardcoded into every new client's `package.json` (conflicts with riley-day-care in local dev), and riley-day-care bleeds day-care-specific nav links and copy (`/programs`, "Riley Day Care") into every new client since string replacement only targets the slug, not the display name in component files.

**Advanced Patterns:**

- **Template Inheritance**: Use a `apps/__template__` directory as the single source of truth, with explicit token placeholders (`{{TEMPLATE_SLUG}}`, `{{TEMPLATE_NAME}}`) rather than regex replacements on existing production code.
- **Port Discovery Algorithm**: Scan `apps/*/package.json` for existing dev ports, then assign `Math.max(...existingPorts) + 1` to new clients to prevent collisions.
- **Zero-Copy Scaffold**: Consider using `pnpm create` or `degit`-style cloning rather than selective file copying to avoid partial copy failures.

**Definition of Done**

- `apps/__template__/` created — purpose-built, industry-neutral source with `TEMPLATE_SLUG` and `TEMPLATE_NAME` as explicit replacement tokens throughout all file contents
- Template includes **all** deployable client files: `layout.tsx`, `page.tsx`, `globals.css`, `sitemap.ts`, `robots.ts`, `middleware.ts`, `error.tsx`, `global-error.tsx`, `loading.tsx`, `not-found.tsx`, `about/`, `services/`, `contact/` (Zod + honeypot), `blog/[slug]/`, `dashboard/`, `(auth)/login/signup/callback`, `site-header.tsx`, `site-footer.tsx`, `providers.tsx`, `auth-analytics.tsx`, `api/csp-report/route.ts`
- `scaffold-client.ts` updated: template source → `apps/__template__`, recursive directory copy replaces selective file list, token replacement covers `TEMPLATE_SLUG`/`TEMPLATE_NAME`/`@agency/__template__`, dev port auto-assigned ≥ 3002 scanning existing apps for conflicts
- riley-day-care remains an untouched prospective client demo — no longer the scaffold source
- `packages/design-tokens/tokens/clients/__template__.json` created as placeholder token stub (replaces riley-day-care.json as the copy source)
- Post-scaffold `pnpm exec tsc --noEmit` passes clean

**Implementation Tips:**

- Add a `--dry-run` flag to the scaffold script that logs all file operations and token replacements without executing, allowing pre-flight validation of the template integrity.
- Include a `health-check.ts` in the template that validates all environment variables are present at build time, failing fast with descriptive errors if `.env.local` is incomplete.

**Target Files**

- `apps/__template__/` (new — ~22 files)
- `packages/design-tokens/tokens/clients/__template__.json` (new)
- `scripts/scaffold-client.ts` (rewrite: template path, recursive copy, token strategy, port auto-assign)
- `docs/CLIENT_ONBOARDING.md` (update scaffold source reference)

---

## [x] TASK-005: Package Build & Type Export Repairs

**Why:** Multiple packages export type declarations or subpath entries that their build configurations never actually generate. `packages/error-handling` is completely empty but represents a critical shared pattern that TASK-001 corrections and future API routes will depend on. Two CI workflows reference scripts that do not exist, failing every run.

**Anti-Patterns:**

- **Subpath exports without build artifacts**: Declaring `"./types": "./dist/types.d.ts"` in `package.json` without configuring `tsup` to actually emit that file creates broken imports for consumers.
- **Dual package hazard**: Avoid mixing CommonJS and ESM exports without `exports` field configuration; use `"type": "module"` consistently across the monorepo.

**Definition of Done**

- `packages/security/tsup.config.ts`: `dts: true` — type declarations generated for all exported modules
- `packages/metrics`: `./types` subpath added as a tsup entry point OR removed from `package.json` exports — no broken import paths
- `packages/database/src/types.ts`: generated from local Supabase schema via `supabase gen types typescript --local`; non-empty and committed; generation command documented in `CONTRIBUTING.md`
- `packages/error-handling/src/index.ts`: typed error hierarchy re-exported from `@agency/database` errors + `toHttpResponse(status: number, error: AppError): NextResponse` helper
- `packages/design-tokens/package.json`: `main` and `types` fields removed (build outputs CSS only, not JS)
- `.github/workflows/governance.yml` + `recovery-test.yml`: broken script references fixed (stubs created or dead steps removed)
- `pnpm type-check` passes with zero TypeScript errors across all packages

**Implementation Tips:**

```typescript
// packages/error-handling pattern
export class AppError extends Error {
  constructor(
    public code: string,
    public statusCode: number,
    message: string,
    public cause?: unknown
  ) {
    super(message)
  }
}

export function toHttpResponse(status: number, error: AppError): NextResponse {
  return NextResponse.json(
    {
      type: 'about:blank',
      title: error.code,
      status,
      detail: error.message,
      instance: error.code,
    } satisfies RFC9457ProblemDetail,
    { status }
  )
}
```

**Target Files**

- `packages/security/tsup.config.ts`
- `packages/metrics/package.json` or `packages/metrics/tsup.config.ts`
- `packages/database/src/types.ts`
- `packages/error-handling/src/index.ts` (new implementation)
- `packages/design-tokens/package.json`
- `.github/workflows/governance.yml`
- `.github/workflows/recovery-test.yml`
- `CONTRIBUTING.md`

---

## [x] TASK-006: Comprehensive Testing Strategy Implementation

**Why:** Test coverage was <5% across entire codebase with no integration testing framework, representing critical quality risk for production deployment.

**Advanced Patterns:**

- **Contract Testing**: Use Pact or MSW (Mock Service Worker) to verify API contracts between frontend and backend without spinning up full services.
- **Test Data Factories**: Implement `factory.ts` with type-safe builders using `@faker-js/faker` that respect database constraints and produce deterministic seeds via `faker.seed(12345)`.
- **Visual Regression**: Use Chromatic or Storybook test runner for UI components to catch unintended styling changes in the design system.

**Definition of Done**

- Unit test coverage >80% across all packages with Vitest setup
- Integration testing framework for API endpoints, database operations, and middleware
- Test data factories and utilities for deterministic test generation
- Coverage reporting and quality gates established in CI/CD
- E2E testing framework for critical user journeys

**Implementation Tips:**

- Configure Vitest workspace mode (`vitest.workspace.ts`) to run package-level tests in parallel while sharing global setup (database migrations, mock server).
- Use `supabase-test-helpers` or equivalent to reset database state between integration test files without dropping the entire schema.
- Implement the "Testing Pyramid" strictly: 70% unit, 20% integration, 10% E2E to maintain velocity while ensuring critical path coverage.

**Target Files**

- `vitest.config.ts`, `vitest.workspace.ts` - Test configuration
- `test/utils/factory.ts` - Test data factory system
- `test/factories/*.ts` - Domain-specific test factories
- `packages/*/src/*.test.ts` - Unit tests across packages
- `apps/*/src/app/api/**/*.test.ts` - API integration tests

---

## P1 — App Quality (Enable Production)

## [ ] TASK-007: Firm App OpenGraph, JSON-LD & ISR

**Why:** Security headers ✅ implemented in `apps/firm/src/middleware.ts`. `sitemap.ts` ✅ and `robots.ts` ✅ exist. Remaining: no `opengraph-image.tsx`, no JSON-LD structured data in `layout.tsx`, and blog routes have no `generateStaticParams` or ISR revalidation (content is currently static hardcoded data — dynamic generation is required once CMS is in place).

**Advanced Patterns:**

- **Dynamic OG Images**: Use `next/og` (Open Graph Image Generation) with Satori for runtime-generated branded images including dynamic titles, avoiding the need to maintain static image assets for every blog post.
- **Schema.org Typing**: Use `schema-dts` package for compile-time validation of JSON-LD structures, ensuring valid structured data that Google can parse correctly.
- **Stale-While-Revalidate Strategy**: Use `revalidate = 3600` with `next.revalidateTag()` for on-demand invalidation when content is updated via CMS webhooks.

**Definition of Done**

- ~~`apps/firm/next.config.ts`: full header block~~ ✅ Done via middleware
- ~~`apps/firm/src/app/sitemap.ts`~~ ✅ Exists
- ~~`apps/firm/src/app/robots.ts`~~ ✅ Exists
- `apps/firm/src/app/opengraph-image.tsx`: `ImageResponse` with brand identity
- `apps/firm/src/app/layout.tsx`: JSON-LD `<script>` block for `LocalBusiness` + `WebSite` schema
- `apps/firm/src/app/blog/[slug]/page.tsx`: `generateStaticParams` + `revalidate = 3600` + JSON-LD `BlogPosting`
- `apps/firm/src/app/blog/page.tsx`: `revalidate = 3600`

**Implementation Tips:**

```typescript
// opengraph-image.tsx pattern
export const runtime = 'edge';
export const alt = 'Agency Platform';
export const size = { width: 1200, height: 630 };

export default async function Image({ params }: { params: { slug?: string } }) {
  const title = params.slug ? await getPostTitle(params.slug) : 'Digital Agency';
  return new ImageResponse(
    (<div style={{...}}>{title}</div>),
    { ...size }
  );
}
```

**Target Files**

- `apps/firm/src/app/opengraph-image.tsx` (new)
- `apps/firm/src/app/layout.tsx`
- `apps/firm/src/app/blog/page.tsx`
- `apps/firm/src/app/blog/[slug]/page.tsx`

---

## [ ] TASK-008: Auth Link Fixes & Message Length Correction

**Why:** Contact form Zod validation ✅ implemented in all three apps. Remaining: auth pages in both prospective-client apps use `<a href>` instead of `next/link` — the only 4 raw internal anchor tags in the codebase, causing full-page navigation and breaking prefetching. Additionally, all three contact form schemas use `message: z.string().min(1)` but the spec requires `min(10)`.

**Anti-Patterns:**

- **Full-page navigation for internal routes**: Using `<a>` instead of `<Link>` destroys SPA benefits, causing unnecessary JavaScript re-download and execution, breaking scroll restoration, and increasing TTFB for subsequent navigations.
- **Inadequate input validation**: `min(1)` accepts single-character messages which are typically spam or low-quality inquiries; `min(10)` with clear error messaging improves lead quality.

**Definition of Done**

- ~~All contact form server actions: Zod schema~~ ✅ Done in all three apps
- All three contact form `actions.ts`: `message` validation updated to `min(10, 'Message must be at least 10 characters')`
- `apps/prospective-clients/riley-day-care/src/app/(auth)/login/page.tsx`: `<a href="/signup">` → `<Link href="/signup">`
- `apps/prospective-clients/riley-day-care/src/app/(auth)/signup/page.tsx`: `<a href="/login">` → `<Link href="/login">`
- Same two fixes in `apps/prospective-clients/the-barber-cave/src/app/(auth)/`
- Zero raw `<a href=` for internal navigation across all apps

**Implementation Tips:**

- Add an ESLint rule `"@next/next/no-html-link-for-pages": "error"` to prevent regression on internal `<a>` tags.
- Consider adding `z.string().trim().min(10)` to prevent whitespace-padding attacks on the minimum length requirement.

**Target Files**

- `apps/firm/src/app/contact/actions.ts` (message min update only)
- `apps/prospective-clients/riley-day-care/src/app/(auth)/login/page.tsx`
- `apps/prospective-clients/riley-day-care/src/app/(auth)/signup/page.tsx`
- `apps/prospective-clients/the-barber-cave/src/app/(auth)/login/page.tsx`
- `apps/prospective-clients/the-barber-cave/src/app/(auth)/signup/page.tsx`
- `apps/prospective-clients/riley-day-care/src/app/contact/actions.ts` (message min update only)
- `apps/prospective-clients/the-barber-cave/src/app/contact/actions.ts` (message min update only)

---

## [ ] TASK-009: Responsive Mobile Navigation

**Why:** All 3 apps (firm, riley-day-care, the-barber-cave) have desktop-only `SiteHeader` navigation. Nav links are in a flex row that overflows or collapses on mobile screens. No hamburger button and no mobile drawer/menu exist in any app. The `Sheet` molecule already lives in `@agency/ui` and provides a focus-trapped, accessible sliding panel that works natively as a mobile nav. This is a production UX failure for all mobile users.

**Advanced Patterns:**

- **Viewport-Aware Hydration**: Use `useMediaQuery` or CSS-only approaches (`hidden md:flex`) to avoid hydration mismatches between server (no viewport) and client (mobile viewport).
- **Focus Management**: Ensure the Sheet traps focus via `react-focus-lock` or Radix primitives, with focus returning to the trigger button on close (essential for screen reader users).
- **Motion Reduced Support**: Respect `prefers-reduced-motion` media query; if user prefers reduced motion, disable slide animation and use instant visibility toggle.

**Definition of Done**

- Each app's `site-header.tsx` gains responsive nav using the `Sheet` component from `@agency/ui`
- Desktop (`md:` breakpoint and above): existing flex row nav links unchanged
- Mobile (below `md:`): hamburger `Button` (`Menu` icon from `lucide-react`) opens a `Sheet` with full nav link list and `ThemeToggle`
- Sheet closes on route change using `usePathname` (in a `useEffect`)
- `<nav aria-label="Main navigation">` wraps both desktop and mobile nav variants
- Active route link has `aria-current="page"` on the matching link
- All nav link touch targets ≥ 44×44px on mobile
- No new shared component needed — all logic lives in each app's `site-header.tsx`

**Implementation Tips:**

```typescript
// Pattern for route-change closing
const pathname = usePathname()
const [isOpen, setIsOpen] = useState(false)

useEffect(() => {
  setIsOpen(false)
}, [pathname])
```

- Use `slot` pattern for the Sheet trigger to maintain separation of concerns: the `SiteHeader` controls state, the `Sheet` molecule provides the container.

**Target Files**

- `apps/firm/src/components/site-header.tsx`
- `apps/prospective-clients/riley-day-care/src/components/site-header.tsx`
- `apps/prospective-clients/the-barber-cave/src/components/site-header.tsx`

---

## [ ] TASK-010: Font Optimization — Firm `next/font` Integration

**Why:** `apps/firm/src/app/layout.tsx` has no `next/font` declaration. The design token CSS declares `--font-primary: Inter, system-ui, sans-serif` but this is a CSS fallback string — if Inter is not already installed on the user's device, the browser renders system-ui. `next/font/google` downloads the font at build time and serves it from the same origin, eliminating the Google Fonts network round-trip and ensuring Inter always renders. This is a measurable performance and brand consistency gap vs the two client apps, which already correctly use `next/font/google`.

**Advanced Patterns:**

- **Font Subsetting Strategy**: Use `subsets: ['latin']` for initial render, then dynamically load extended character sets (Cyrillic, etc.) via `next/font/google` `preload: false` for secondary routes if internationalization is planned.
- **CSS Variable Injection**: Use the `variable` property to inject CSS custom properties that cascade through the design token system, rather than applying className directly to body (allows dynamic font changes via CSS variables at runtime).

**Definition of Done**

- `apps/firm/src/app/layout.tsx`: add `Inter` from `next/font/google` with `subsets: ['latin']` and `variable: '--font-sans'`; apply `inter.variable` to the `<html>` element (not `inter.className` on `<body>`, to preserve design token CSS variable integration)
- `apps/firm/src/app/globals.css` or `apps/firm/tokens/agency.css`: `--font-primary` value updated to `var(--font-sans)` so the token-to-font chain is complete
- Both riley-day-care and the-barber-cave already apply `inter.className` to `<body>` — these remain unchanged but are noted as candidates for the variable approach in a future token alignment pass
- `pnpm tsc --noEmit apps/firm/src/app/layout.tsx` passes clean

**Implementation Tips:**

```typescript
// layout.tsx
import { Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap', // Prevents FOIT (Flash of Invisible Text)
});

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}
```

- Verify font loading in Network tab: you should see Inter served from `/_next/static/media/` (self-hosted), not `fonts.googleapis.com`.

**Target Files**

- `apps/firm/src/app/layout.tsx`
- `apps/firm/src/app/globals.css` (or `apps/firm/tokens/agency.css` — whichever defines `--font-primary`)

---

## [ ] TASK-011: Firm Dark Mode Token Completion

**Why:** `apps/firm/src/app/globals.css` imports `agency.css` (design tokens) but contains no `:root .dark {}` CSS variable override block. The `ThemeToggle` molecule is wired in the firm `SiteHeader` and correctly applies/removes the `.dark` class on `<html>`, but with no dark mode token overrides defined, toggling dark mode produces no visual change in the firm app. Both riley-day-care and the-barber-cave have correct `:root .dark` blocks in their `globals.css`. This is a broken shipped feature.

**Anti-Patterns:**

- **Hardcoded dark values**: Avoid `dark:bg-slate-900` in components; always map through design tokens (`bg-background-primary` which resolves to different values in light/dark).
- **Color inversion logic**: Don't simply invert hex values; use perceptually uniform color spaces (OKLCH) to maintain contrast ratios and avoid hue shifts in dark mode.

**Definition of Done**

- `packages/design-tokens/tokens/clients/agency.json`: dark mode palette added as a parallel set of semantic token values (background inverted, text inverted, border adjusted, interactive states for dark)
- Style Dictionary build (`packages/design-tokens`) generates `apps/firm/tokens/agency.css` with a `:root .dark {}` block alongside the existing `:root {}` block
- `apps/firm/src/app/globals.css` already imports `agency.css` — no change needed once token build output includes the dark block
- ThemeToggle in firm app visually changes colors when toggled (verified by inspecting CSS variable values on `<html>` in both light and dark states)
- Dark mode palette uses the same oklch color space as existing client tokens; background and text values are inverted from the light palette with sufficient contrast (≥ 4.5:1 for body text)

**Implementation Tips:**

```json
// agency.json token structure
{
  "color": {
    "background": {
      "primary": { "value": "{color.base.white}" },
      "primary-dark": { "value": "{color.base.slate.900}" }
    }
  }
}
```

- Or use Style Dictionary transforms to automatically generate dark variants using OKLCH lightness inversion: `lightness: 100 - originalLightness`.

**Target Files**

- `packages/design-tokens/tokens/clients/agency.json`
- `packages/design-tokens/sd.config.ts` or `scripts/build-clients.ts` (if dark mode block requires build config change)
- `apps/firm/tokens/agency.css` (output — regenerated by build)

---

## P2 — Platform Wiring

## [ ] TASK-012: Platform Package Wiring Completion

**Why:** `@agency/analytics/server` ✅ already imported in all 4 cost API routes. `@agency/monitoring` ✅ already imported in `performance-dashboard.tsx`. Remaining: `@agency/error-handling` is empty (blocked by TASK-005) and therefore unreachable end-to-end; ISR revalidation is missing on prospective-client content pages.

**Advanced Patterns:**

- **Graceful Degradation**: When error-handling package is unavailable, wrap imports in `try/catch` with fallback to console.error in development, but ensure production builds fail fast (fail closed on missing critical dependencies).
- **Revalidation Tags**: Use Next.js 15's `revalidateTag` with granular tags (`blog-posts`, `programs`, `services`) rather than time-based revalidation alone, allowing CMS webhooks to trigger specific cache purges.

**Definition of Done**

- ~~`@agency/analytics` server client initialized in agency-admin~~ ✅ Done
- ~~`@agency/monitoring` wired to agency-admin~~ ✅ Done via `performance-dashboard.tsx`
- `@agency/error-handling` (implemented in TASK-005) imported and used in at least one API route, confirming the package is reachable end-to-end
- ISR `revalidate` constants added to riley-day-care and the-barber-cave content pages (blog list, programs, services)

**Implementation Tips:**

- Create a `cache-config.ts` in each app exporting `export const REVALIDATE_CONTENT = 3600;` to standardize ISR windows across routes and make cache strategy changes maintainable in one location.

**Target Files**

- `apps/agency-admin/src/app/api/costs/summary/route.ts` (import `@agency/error-handling` once available)
- `apps/prospective-clients/riley-day-care/src/app/blog/page.tsx`
- `apps/prospective-clients/riley-day-care/src/app/programs/page.tsx`
- `apps/prospective-clients/the-barber-cave/src/app/services/page.tsx`

---

## [ ] TASK-013: Typed Content Data Layer

**Why:** `packages/content/src/content-system.ts` contains complete Zod schemas (`BlogPostSchema`, `ServicePageSchema`, `CaseStudySchema`) and a `validateContent()` function, but no app in the monorepo consumes them. All blog and service content is inline hardcoded in page files. Consequences: (1) no type safety for content authors — typos in data are silent; (2) `generateStaticParams` in blog routes cannot derive slugs from a shared registry; (3) `apps/firm/src/app/sitemap.ts` lists only static routes — all blog post URLs are absent from the firm sitemap; (4) the scaffold template (TASK-004) has no content entry point pattern to follow.

**Advanced Patterns:**

- **Content as Code**: Treat content changes as code changes with PR reviews, using the type system as a linter for content structure.
- **Static Site Generation (SSG) Optimization**: Separate content fetching from rendering; use `cache()` from React to dedupe content fetches across `generateStaticParams`, page render, and sitemap generation in the same build process.

**Definition of Done**

- `apps/firm/src/content/blog.ts`: typed `BlogPost[]` array using `@agency/content` types (replaces inline `posts` in page files)
- `apps/firm/src/content/services.ts`: typed `ServicePage[]` array (replaces inline `services` in `services/page.tsx`)
- `apps/firm/src/app/blog/page.tsx` and `blog/[slug]/page.tsx`: import from `@/content/blog` instead of defining inline data
- `apps/firm/src/app/blog/[slug]/page.tsx`: `generateStaticParams` added, derived from `blog.ts` slug list
- `apps/firm/src/app/services/page.tsx`: import from `@/content/services`
- `apps/firm/src/app/sitemap.ts`: dynamically includes blog post URLs derived from `blog.ts` (each slug → `${baseUrl}/blog/${slug}`)
- riley-day-care: `apps/prospective-clients/riley-day-care/src/content/blog.ts` and `programs.ts` created; blog and programs pages consume them; `blog/[slug]/page.tsx` gains `generateStaticParams`
- the-barber-cave: `apps/prospective-clients/the-barber-cave/src/content/blog.ts` and `services.ts` created; pages consume them
- `packages/content/src/index.ts` exports confirmed correct (no broken imports)
- `pnpm tsc --noEmit` clean across all three apps after changes

**Implementation Tips:**

```typescript
// content/blog.ts pattern
import { BlogPostSchema, type BlogPost } from '@agency/content'

export const posts: BlogPost[] = [
  {
    slug: 'welcome',
    title: 'Welcome Post',
    publishedAt: '2026-03-18',
    content: '...',
  },
].map((post) => BlogPostSchema.parse(post)) // Runtime validation at import time
```

- Use `import { cache } from 'react'` to wrap content loading so multiple calls in the same render (e.g., in `generateStaticParams` and page component) hit the same cached data.

**Target Files**

- `apps/firm/src/content/blog.ts` (new)
- `apps/firm/src/content/services.ts` (new)
- `apps/firm/src/app/blog/page.tsx`
- `apps/firm/src/app/blog/[slug]/page.tsx`
- `apps/firm/src/app/services/page.tsx`
- `apps/firm/src/app/sitemap.ts`
- `apps/prospective-clients/riley-day-care/src/content/blog.ts` (new)
- `apps/prospective-clients/riley-day-care/src/content/programs.ts` (new)
- `apps/prospective-clients/riley-day-care/src/app/blog/page.tsx`
- `apps/prospective-clients/riley-day-care/src/app/blog/[slug]/page.tsx`
- `apps/prospective-clients/riley-day-care/src/app/programs/page.tsx`
- `apps/prospective-clients/the-barber-cave/src/content/blog.ts` (new)
- `apps/prospective-clients/the-barber-cave/src/content/services.ts` (new)
- `apps/prospective-clients/the-barber-cave/src/app/services/page.tsx`

---

## [ ] TASK-014: `@agency/ui` Organisms Layer

**Why:** `packages/ui/src/organisms/index.ts` exports nothing. The atoms and molecules layers have quality foundational components, but organisms — the page-composable units that combine tokens and primitives into meaningful sections — do not exist. Every app currently builds page sections as duplicated inline JSX with hardcoded Tailwind classes (not design-token classes). This creates: (1) duplicated layout boilerplate across apps; (2) hardcoded slate/gray colors that bypass the client token system; (3) the scaffold template (TASK-004) will produce low-quality starting sites without a Hero or feature section. Organisms must consume design-token classes exclusively (no `slate-*`, `gray-*` hardcoded colors) so client brand tokens compose through automatically.

**Component Design Principles:**

- **Composition over Configuration**: Prefer `children` props and slots over configuration objects for maximum flexibility while maintaining structure.
- **Design Token Adherence**: All background colors use `bg-background-*`, text uses `text-text-*`, accents use `text-brand-*` or `bg-brand-*`. No raw Tailwind colors.
- **Responsive by Default**: All organisms must specify responsive behavior (stack on mobile, grid on desktop) internally, not relying on parent layout.

**Definition of Done**

- `HeroSection`: full-width section with headline, subheadline (optional), primary CTA (`Button`), optional secondary CTA. Uses `bg-background-primary`, `text-text-primary`, `text-brand-primary` token classes. Accepts `className` for layout overrides.
- `FeatureGrid`: responsive 1→2→3 column grid of feature items (icon slot, title, description). Token-styled card surface. Extracted from the inline `features` pattern in `apps/firm/src/app/page.tsx`.
- `PageSection`: wrapper with consistent vertical padding (`py-16 md:py-24`), optional `title`, `subtitle`, `action` slots, `background` variant prop (`'default' | 'muted' | 'brand'`) mapped to token classes.
- `CTASection`: call-to-action banner (headline + body + primary + outline Button pair). Full-width, token-styled.
- All organisms: zero hardcoded color classes (`slate-*`, `gray-*`, `zinc-*`); all color via design-token classes or `bg-background-*`, `text-text-*`, `text-brand-*`.
- All organisms: exported from `packages/ui/src/organisms/index.ts` and re-exported from `packages/ui/src/index.ts`.
- `apps/firm/src/app/page.tsx`: inline feature grid JSX replaced with `FeatureGrid` from `@agency/ui`.
- No breaking changes to existing atoms or molecules exports.

**Implementation Tips:**

- Use `cva` (class-variance-authority) for variant management in organisms to ensure type-safe prop combinations.
- Implement `as` prop pattern using `React.ElementType` for polymorphic headings (h1 vs h2) in HeroSection without losing type safety.

**Target Files**

- `packages/ui/src/organisms/hero-section.tsx` (new)
- `packages/ui/src/organisms/feature-grid.tsx` (new)
- `packages/ui/src/organisms/page-section.tsx` (new)
- `packages/ui/src/organisms/cta-section.tsx` (new)
- `packages/ui/src/organisms/index.ts`
- `packages/ui/src/index.ts`
- `apps/firm/src/app/page.tsx`

---

## [~] TASK-015: Migration Integrity Fixes

**Why:** Two categories of database migration defects will cause failures on any fresh `supabase db reset` or new environment deploy: (1) `CREATE INDEX CONCURRENTLY` inside transactional migration files, which PostgreSQL forbids in a transaction block; (2) duplicate migration number prefixes that create ambiguous alphabetic sort order for Supabase's sequential migration execution.

**Anti-Patterns:**

- **CONCURRENTLY in transactions**: PostgreSQL cannot create indexes concurrently (without locking tables) inside a transaction block. These migrations will hard-fail on reset.
- **Timestamp prefixes without uniqueness**: Supabase migrations rely on lexicographical ordering; duplicate prefixes cause non-deterministic execution order and potential foreign key failures.

**Definition of Done**

- `supabase/migrations/014_experiments_framework.sql`: all `CREATE INDEX CONCURRENTLY` replaced with `CREATE INDEX` (no `CONCURRENTLY`)
- `supabase/migrations/020_web_vitals_metrics.sql`: same replacement
- Duplicate `006_`, `011_`, `012_`, and `013_` migrations renamed to deterministic non-conflicting sequences (`006a/006b/006c`, `011a/011b/011c`, `012a/012b`, `013a/013b`)
- Cost/performance migrations no longer grant usage on non-existent UUID sequences
- Artifact lifecycle migrations document deprecated TEXT tenant identifiers and include the missing `promotion_steps.artifact_id` column expected by the normalization path
- `supabase db reset` completes without errors on a clean local environment
- `supabase/migrations/012a_artifact_lifecycle_management.sql` `tenant_id TEXT` column documented as deprecated; migration `013a_artifact_tenant_schema_normalization.sql` reviewed for completeness

**Implementation Tips:**

- Use `supabase migration repair` command if you need to mark a broken migration as resolved after fixing it in development environments.
- For production safety, create a `scripts/verify-migrations.sh` that runs `supabase db reset` in a throwaway CI container to catch these issues before they reach main.

**Target Files**

- `supabase/migrations/006a_customer_auth_mappings.sql`
- `supabase/migrations/006b_dora_metrics.sql`
- `supabase/migrations/006c_dora_metrics_tenant_isolation.sql`
- `supabase/migrations/011a_contact_submissions.sql`
- `supabase/migrations/011b_cost_monitoring.sql`
- `supabase/migrations/011c_cost_monitoring_security_fix.sql`
- `supabase/migrations/012a_artifact_lifecycle_management.sql`
- `supabase/migrations/012b_bookings_extend.sql`
- `supabase/migrations/013a_artifact_tenant_schema_normalization.sql`
- `supabase/migrations/013b_storage_security.sql`
- `supabase/migrations/014_experiments_framework.sql`
- `supabase/migrations/020_web_vitals_metrics.sql`

**Progress Update (03/17/2026)**

- Source-visible reset blockers in the migration files were repaired: duplicate prefixes renamed, transaction-invalid concurrent indexes removed, non-existent UUID sequence grants removed, invalid SQL constraints corrected, and artifact normalization aligned with the actual table shape.
- Workflow and documentation references were updated to the renamed artifact and cost-monitoring migration files.
- Remaining blocker: `supabase db reset` has not been re-run in this environment because Docker Desktop is still unavailable, so TASK-015 remains partial until runtime verification succeeds.

- `supabase/migrations/014_experiments_framework.sql`
- `supabase/migrations/020_web_vitals_metrics.sql`
- Duplicate-numbered migration files (rename as needed)

---

## [ ] TASK-016: Type Safety — `as any` Violations

**Why:** Three confirmed `as any` casts in `apps/agency-admin` break the no-`any` codebase rule and suppress type errors that could hide real bugs. Two are in client components (selector `onChange` handlers) and one is in an API route environment variable cast.

**Advanced Patterns:**

- **Strict Environment Validation**: Use `envalid` or a custom Zod schema to validate `process.env` at startup, creating a typed `Env` object rather than casting individual accesses.
- **Discriminated Union Handlers**: For event handlers, type the union of possible values explicitly rather than casting the target value.

**Definition of Done**

- `apps/agency-admin/src/components/performance/performance-dashboard.tsx`: `tenantId: tenantId as any` → proper type (e.g., cast to the enum type accepted by `useWebVitals`, or fix the type signature upstream)
- `apps/agency-admin/src/components/security/security-dashboard.tsx`: `e.target.value as any` → typed as the union of valid `timeRange` values
- `apps/agency-admin/src/app/api/upload/route.ts`: `process.env.VIRUS_SCAN_PROVIDER as any` → typed as the accepted union of provider strings with a fallback
- `pnpm tsc --noEmit` passes on all three files with no `any`-related suppressions

**Implementation Tips:**

```typescript
// Environment variable pattern
import { z } from 'zod'

const EnvSchema = z.object({
  VIRUS_SCAN_PROVIDER: z.enum(['clamav', 'virustotal', 'none']).default('none'),
})

const env = EnvSchema.parse(process.env)
// Now env.VIRUS_SCAN_PROVIDER is typed as the enum
```

**Target Files**

- `apps/agency-admin/src/components/performance/performance-dashboard.tsx`
- `apps/agency-admin/src/components/security/security-dashboard.tsx`
- `apps/agency-admin/src/app/api/upload/route.ts`

---

## P3 - Innovation Lane (Guardrailed)

## [ ] TASK-017: DORA Metrics Implementation & Automation

**Why:** No automated collection of key engineering metrics for organizational improvement.

**Advanced Patterns:**

- **Four Keys Pipeline**: Implement the Google Cloud Four Keys methodology (Deployment Frequency, Lead Time for Changes, Change Failure Rate, MTTR) using GitHub webhooks and commit parsing rather than manual entry.
- **Causal Analysis**: Correlate DORA metrics with deployment events (e.g., "Did the addition of Vitest testing correlate with reduced change failure rate?").

**Definition of Done**

- Automated DORA metrics collection pipeline implemented
- Deployment frequency, lead time, change failure rate, MTTR tracked
- Metrics dashboard in agency-admin with historical trends
- Integration with existing CI/CD pipeline for automatic data capture
- Alerting for metric regressions and improvements

**Target Files**

- `scripts/metrics/dora-collector.ts`
- `scripts/metrics/metrics-dashboard.ts`
- `apps/agency-admin/src/app/(dashboard)/metrics/*`
- `.github/workflows/metrics.yml`
- `packages/metrics/src/dora.ts`

---

## [ ] TASK-018: Advanced Supply Chain Security (SLSA & SBOM)

**Why:** Current supply chain security is basic GitHub scanning; industry leaders implement SLSA and comprehensive SBOM.

**Advanced Patterns:**

- **Provenance Attestation**: Use Sigstore/Cosign to sign build artifacts and generate SLSA Level 3 provenance attestations, allowing consumers to verify that the artifact they deploy is exactly what was built in CI.
- **SBOM Lifecycle Tracking**: Generate CycloneDX SBOMs at build time and compare against vulnerability databases (OSV) in the deployment pipeline.

**Definition of Done**

- SBOM generation automation for all builds and releases
- SLSA attestation implementation (Levels 1-3)
- Build provenance tracking and verification
- Cryptographic artifact integrity verification
- Supply chain monitoring and vulnerability correlation
- Integration with existing security workflows

**Target Files**

- `scripts/security/generate-sbom.ts`
- `scripts/security/generate-attestation.ts`
- `scripts/security/verify-integrity.ts`
- `scripts/security/track-provenance.ts`
- `packages/security/src/slsa.ts`
- `packages/security/src/sbom.ts`
- `.github/workflows/supply-chain.yml`

---

## [ ] TASK-019: Repository Metadata & Classification System

**Why:** Manual repository management doesn't scale; enterprise requires dynamic policy targeting.

**Advanced Patterns:**

- **GitHub Repository Rulesets**: Programmatically manage rulesets (not legacy branch protection) based on repository classification tags, allowing different policies for `client-sites` vs `platform-infrastructure`.
- **Auto-Labeling**: Use semantic analysis of file paths and commit messages to auto-classify repositories (e.g., detects `/supabase/migrations` → labels as `database-heavy` → applies stricter review requirements).

**Definition of Done**

- Custom repository properties implementation
- Repository classification schema (risk-based categorization)
- Dynamic policy targeting based on repository metadata
- Automated compliance checks and policy enforcement
- Repository metadata-driven automation
- Integration with GitHub Enterprise governance features

**Target Files**

- `scripts/governance/manage-properties.ts`
- `scripts/governance/metadata-workflows.ts`
- `scripts/governance/dynamic-policies.ts`
- `scripts/governance/compliance-automation.ts`
- `packages/governance/src/metadata.ts`
- `packages/governance/src/classification.ts`

---

## [ ] TASK-020: Artifact Lifecycle Management

**Why:** No centralized artifact registry or automated promotion pipelines.

**Advanced Patterns:**

- **Immutable Tags**: Enforce that docker images and npm packages published to the registry use content-addressable SHA tags, never mutable `latest`, ensuring reproducible deployments.
- **Promotion Gates**: Implement automated quality gates (security scan pass, integration test pass) that must clear before an artifact can move from `staging` to `production` registry repositories.

**Definition of Done**

- Centralized artifact registry (JFrog Artifactory/Nexus integration)
- Automated version tagging and semantic versioning
- Environment promotion pipelines (dev → staging → prod)
- Automated auditing for artifact lifecycle
- Policy-driven artifact management
- Artifact integrity verification across environments

**Target Files**

- `scripts/artifacts/register-artifact.ts`
- `scripts/artifacts/promote-artifact.ts`
- `scripts/artifacts/cleanup-artifacts.ts`
- `packages/artifacts/src/registry.ts`
- `packages/artifacts/src/lifecycle.ts`
- `packages/artifacts/src/promotion.ts`

---

## [ ] TASK-021: Large Monorepo Performance Optimization

**Why:** Current monorepo lacks performance optimizations needed at scale.

**Advanced Patterns:**

- **Sparse Checkout**: Configure `.git/info/sparse-checkout` to allow developers to work on single apps without downloading the full history of all binary assets.
- **Merge Queue**: Implement GitHub Merge Queue to ensure main branch stays green by testing the exact result of merge commits before they land, eliminating "semantic merge conflicts" where two PRs pass individually but break when combined.

**Definition of Done**

- Sparse checkout implementation for specific directories
- Merge queue system for sequential validation
- IDE performance optimization (custom IntelliJ/VSCode plugin)
- Flaky test identification and quarantining
- Git performance tuning and optimization
- Automated repository maintenance (garbage collection, cleanup)

**Target Files**

- `scripts/performance/ide-optimization.ts`
- `scripts/performance/merge-queue.ts`
- `scripts/performance/flaky-test-detector.ts`
- `scripts/maintenance/cleanup-branches.ts`
- `scripts/maintenance/git-performance.ts`
- `.gitattributes` (sparse checkout config)
- `docs/DEVELOPER_EXPERIENCE.md`

---

## [ ] TASK-022: Integrated Knowledge Management

**Why:** Knowledge is siloed in documentation; not embedded in daily workflows.

**Advanced Patterns:**

- **Semantic Code Search**: Implement vector embeddings of code and documentation using `unstructured.io` or similar, allowing natural language queries like "How do we handle tenant isolation?" to surface relevant code and ADRs.
- **Expertise Graph**: Build a graph database (Neo4j/memgraph) mapping who last touched which packages and their confidence levels, routing questions to the right maintainers automatically.

**Definition of Done**

- Automated knowledge capture from development activities
- Workflow-integrated knowledge systems
- AI-powered search across code, docs, and conversations
- Expertise mapping and knowledge graphs
- Systematic knowledge audits and updates
- Knowledge-driven development assistance

**Target Files**

- `scripts/knowledge/capture.ts`
- `scripts/knowledge/expertise-map.ts`
- `scripts/knowledge/search.ts`
- `packages/knowledge/src/graph.ts`
- `packages/knowledge/src/search.ts`
- `packages/knowledge/src/automation.ts`

---

## [ ] TASK-023: Cost Management & Resource Optimization

**Why:** No monitoring of storage costs, CI/CD resource usage, or optimization budgeting.

**Advanced Patterns:**

- **FinOps Tagging Strategy**: Enforce that all cloud resources (Supabase projects, Vercel deployments) are tagged with `cost-center`, `environment`, and `tenant-id` for chargeback accounting.
- **Predictive Scaling**: Use historical traffic patterns to scale down preview deployments during off-hours (nights/weekends) automatically, reducing compute costs by ~60%.

**Definition of Done**

- Storage optimization monitoring and alerts
- CI/CD resource usage tracking and optimization
- Telemetry budgeting and cost allocation
- Automated cost recommendations and optimization
- Resource usage dashboards and reporting
- Cost-aware development workflows

**Target Files**

- `scripts/cost/cost-monitor.ts`
- `scripts/cost/resource-optimizer.ts`
- `scripts/cost/budget-manager.ts`
- `packages/cost/src/monitoring.ts`
- `packages/cost/src/optimization.ts`
- `apps/agency-admin/src/app/(dashboard)/costs/*`

---

## [ ] TASK-024: Disaster Recovery & Business Continuity

**Why:** Relies only on GitHub; no documented recovery procedures or geographic distribution.

**Advanced Patterns:**

- **Git Multi-Remote Strategy**: Configure mirrors to both GitHub and GitLab (or AWS CodeCommit) with automated sync hooks, ensuring version control availability even during provider outages.
- **Infrastructure as Code (IaC) State Backup**: Terraform/Supabase state files should be backed up to geographically separated object storage (multi-region S3) with versioning enabled, as these are often single points of failure harder to recreate than application code.

**Definition of Done**

- Automated repository backup procedures
- Geographic distribution strategy
- Recovery testing and validation procedures
- Incident response plans and communication protocols
- Business continuity documentation and runbooks
- Regular recovery drills and validation

**Target Files**

- `scripts/backup/backup-repository.ts`
- `scripts/incident/response-automation.ts`
- `scripts/incident/communication-protocols.ts`
- `docs/DISASTER_RECOVERY.md`
- `docs/BUSINESS_CONTINUITY.md`
- `docs/INCIDENT_RESPONSE.md`

---

## [ ] TASK-025: Advanced AI Agent Operations

**Why:** Basic Copilot integration exists; no advanced AI-driven repository automation.

**Advanced Patterns:**

- **Deterministic Agent Workflows**: Use LangChain or OpenAI Functions with structured output schemas to ensure AI agents produce parseable, verifiable results (e.g., "Generate a migration file" must output valid SQL in a specific JSON format).
- **Self-Healing CI**: Implement agents that can analyze failed build logs, search the codebase for similar past fixes, and generate a patch PR automatically for common failure modes (dependency updates, lint fixes).

**Definition of Done**

- AI-driven repository automation and assistance
- Autonomous CI/CD agents for self-healing pipelines
- Multimodal code analysis (text, image, sound processing)
- AI-assisted code review and quality checks
- Predictive maintenance and issue detection
- Agent orchestration and governance integration

**Target Files**

- `scripts/ai/repository-automation.ts`
- `scripts/ai/autonomous-cicd.ts`
- `scripts/ai/code-review-assistant.ts`
- `scripts/ai/predictive-maintenance.ts`
- `packages/ai/src/automation.ts`
- `packages/ai/src/orchestration.ts`
- `docs/AI_OPERATIONS.md`

---

## 5) Task Dependencies (Critical Path)

1. `TASK-015` (migration integrity) is a **deploy blocker** — `supabase db reset` fails without it. Run first.
2. `TASK-005` (package builds) must precede `TASK-003` (DB types), `TASK-012` (error-handling wiring), and all type-check gates.
3. `TASK-004` (scaffold) is independent of package work — complete before any new client deliveries. `TASK-013` (typed content) and `TASK-014` (organisms) should complete before TASK-004 so the template starts with quality foundations.
4. `TASK-003` (DB type regeneration) requires Docker + `TASK-005` (clean build environment).
5. `TASK-007` (OpenGraph/JSON-LD/ISR) and `TASK-008` (auth links + message min) are independent and can run in parallel.
6. `TASK-016` (`as any` violations) is independent — can be done any time.
7. `TASK-012` (platform wiring completion) depends on `TASK-005` (error-handling package implementation).
8. `TASK-009` (mobile nav), `TASK-010` (font optimization), and `TASK-011` (dark mode) are independent of each other and can run in parallel. All three are P1 app quality.
9. `TASK-013` (typed content layer) is a prerequisite for `TASK-007`'s `generateStaticParams` implementation on riley-day-care and the-barber-cave; firm blog can proceed independently with existing hardcoded data.
10. `TASK-014` (organisms) is independent — no upstream dependencies. Provides foundations for `TASK-004` (scaffold template).
11. `TASK-017` → `TASK-018` → `TASK-019` for advanced repository management foundation.
12. `TASK-020` → `TASK-021` → `TASK-022` for scale optimization workflow.
13. `TASK-023` → `TASK-024` → `TASK-025` for enterprise operations maturity.

---

## 7) Source Anchors (Research Basis)

- [OWASP Multi-Tenant Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Multi_Tenant_Security_Cheat_Sheet.html)
- [OWASP ASVS](https://github.com/OWASP/ASVS)
- [RFC 9457: Problem Details for HTTP APIs](https://www.rfc-editor.org/rfc/rfc9457.html)
