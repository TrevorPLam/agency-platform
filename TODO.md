# Agency Platform TODO

Based on direct codebase assessment of `apps/` and `packages/` (including deep analysis of all 7+ supporting packages, 22 migrations, 23 CI workflows, and 70+ scripts), March 2026 research on rendering optimization, design flexibility, enterprise site-factory patterns, Vercel multi-tenant deployment, Supabase RLS security, and MDX processing, plus comparative analysis against `docs/1.md` and `docs/official/nextjs.md`, this document tracks implementation priorities to elevate the repository from an infrastructure-heavy monorepo to a package-first site factory where client apps are thin configuration shells with maximum design flexibility.

---

## Current State Assessment

### Codebase Reality

The repository is a real, functioning monorepo with substantial infrastructure. It is not a skeleton or placeholder project. However, its maturity is lopsided: infrastructure packages (security, monitoring, governance, metrics, cost, artifacts, knowledge, AI-automation) are far more developed than the rendering and design surface that actually ships client websites. The primary business goal -- website design -- requires the rendering architecture to be the strongest part of the codebase, and it is currently the weakest.

#### What the repo currently does well

- `apps/firm` renders a real marketing site with services, blog, booking, contact, CSP headers via middleware, sitemap, robots, OG images, and E2E coverage.
- `apps/prospective-clients/riley-day-care` and `apps/prospective-clients/the-barber-cave` are working demo sites with real tenant-specific content and branding.
- `packages/ui` has ~15 real shadcn-based components (Button with CVA variants, Card, Dialog, Sheet, Tabs, Badge, Progress, DropdownMenu, Alert, ThemeToggle) organized into atoms/molecules/organisms.
- `packages/design-tokens` has a full W3C DTCG token pipeline with Style Dictionary v4, client token JSON for `agency`, `riley-day-care`, `the-barber-cave`, and `__template__`, with outputs to per-app CSS.
- `packages/database` has Supabase client factories (server, browser, admin), auth utilities, RLS helpers, rate limiting, CORS, resilience, and typed error hierarchy.
- Supabase has 22 migrations (PostgreSQL 17), RLS policies, pgTAP tests (7 test files: coverage, isolation, role hierarchy, positive access, DORA, cost), seed data for three tenants, and Supashield RLS audit.
- CI/CD has **23 GitHub Actions workflows** covering build, lint, type-check, test, security scanning, supply chain (SBOM/SLSA), RLS testing, dependency updates, docs validation, flaky test management, DORA metrics, cost monitoring, mutation testing, recovery testing, governance, and artifact lifecycle.
- Root tooling is solid: pnpm 10 with strict catalogs, Turborepo 2.7 with task pipeline, TypeScript 5 strict mode, ESLint 9 flat config (per-package), Prettier with `prettier-plugin-tailwindcss`, Vitest with 80% coverage thresholds, Stryker mutation testing, Changesets.
- `scripts/scaffold-client.ts` (244 lines) automates client scaffolding from `apps/__template__` with token replacement, port assignment (from 3002), and post-scaffold build.
- 20 packages exist and are structurally implemented. **Package-level deep dive**:
  - `analytics`: Real PostHog integration with consent UI (`ConsentProvider`, `SimpleConsentBanner`, `useAnalyticsConsent`), server-side events, security event logging. Builds via tsup.
  - `content`: Complete content system with Zod schemas (`BlogPostSchema`, `ServicePageSchema`, `CaseStudySchema`), validation, SEO utils, repository interface — but **unused by any app**.
  - `email`: Resend-based `sendEmail` and `sendContactNotification` only — AGENTS.md overstates features.
  - `booking`: `BookingWidget` component with Zod config schema — but has conflicting entry points (`index.ts`/`index.tsx`) and missing subpath export.
  - `monitoring`: Real web vitals hooks (`useWebVitals`, `usePerformanceBudgets`), performance budgets, cost monitoring, alert engine. Builds via tsup.
  - `storage`: File validation, virus scanning (VirusTotal integration), storage service. Builds via tsup.
  - `error-handling`: RFC 9457 Problem Details error hierarchy. Builds via tsup.

#### How rendering currently works

- Each app root layout imports its own local `Providers`, `SiteHeader`, and `SiteFooter`.
- Each app page manually composes cards, buttons, and layout containers inside the app itself.
- `packages/ui` exports both primitive UI components and page-level marketing organisms (`HeroSection`, `FeatureGrid`, `CTASection`, `PageSection`).
- Per-app `globals.css` files import Tailwind and an app-local token CSS file from a `tokens/` directory.
- Each app owns its own navigation structure, shell logic, and provider tree, even when the behavior is nearly identical across apps.
- Pages use ISR `revalidate` for caching, not the stable `"use cache"` + `cacheLife` API.
- No app has `cacheComponents: true` (PPR) enabled.
- No app uses route groups like `(marketing)` or `(legal)`.
- Components use viewport-based responsive design (`md:`, `lg:`), not container queries (except Card which uses `@container/card-header`).

#### Critical styling inconsistency

- **The firm app uses hardcoded Tailwind slate palette** (`text-slate-900`, `bg-slate-50`, `bg-gradient-to-br from-slate-50 to-slate-100`, `border-slate-200`, `text-slate-600`) on every page and in its header/footer. This means the firm site cannot be restyled via design tokens.
- **Prospective client apps correctly use semantic token classes** (`text-brand-primary`, `text-text-secondary`, `bg-background-primary`, `border-border-primary`). These apps demonstrate the token system works.
- The firm site is the most feature-rich app but the hardest to retheme because it bypasses the token system entirely.

#### Design token pipeline state

- `packages/design-tokens/dist/` **is empty** — the token build has never been run or the output is gitignored. The Storybook preview CSS in `packages/ui/.storybook/preview.css` imports `../../design-tokens/dist/primitives.css`, `dist/semantic.css`, and `dist/component.css` from this empty directory, meaning Storybook is broken without a prior `pnpm tokens:build`.
- Token source files (primitives, semantic, component, clients) are well-structured W3C DTCG JSON. The build pipeline (`sd.config.ts` + `scripts/build-clients.ts`) is real and correct.
- **`build-clients.ts` only outputs `brand`, `font`, and `color.semantic` tokens** to app CSS — it filters out primitives, semantic spacing, semantic motion, and component tokens. Apps never receive the full token set.
- **Dark mode is duplicated and incorrect**: `agency.css` has a proper `:root .dark` block built from agency tokens. But `riley-day-care/globals.css` and `the-barber-cave/globals.css` have hardcoded `:root .dark` blocks using **agency dark-mode values** (hue 198, agency's palette) instead of their own brand's dark values.
- **Font token inconsistency**: `agency.css` uses `var(--font-sans), Inter, system-ui, sans-serif` (references Tailwind's font variable). Demo app token CSS files use raw `Inter, system-ui, sans-serif` (no `var(--font-sans)` reference).
- **`riley-day-care.json` is missing `color.semantic.border`** — falls back to base semantic border which may not match the green brand.
- **Template's `TEMPLATE_SLUG.css`** is a literal placeholder import that won't resolve until the scaffold script processes it.

#### Exact component state in `packages/ui`

- 16 components total: 5 atoms (Badge, Button, Input, Label, Progress), 7 molecules (Alert, Card, Dialog, DropdownMenu, Sheet, Tabs, ThemeToggle), 4 organisms (PageSection, FeatureGrid, CTASection, HeroSection).
- 5 components use `"use client"`: Label (Radix Label), Dialog (Radix Dialog), DropdownMenu (Radix DropdownMenu), Sheet (Radix Dialog), ThemeToggle (uses state).
- 11 components are server-compatible (no `"use client"` directive).
- 3 instances of hardcoded colors: Button `text-white` in destructive variant, Dialog overlay `bg-black/50`, Sheet overlay `bg-black/50`.
- Card already uses `@container/card-header` — the only component using container queries.
- All organisms use `@radix-ui/react-slot` for `asChild` prop support.
- CVA variants exist but are single-purpose: HeroSection has `size`, `alignment`, `background`; CTASection has `background`, `size`, `alignment`; FeatureGrid has `columns`, `gap`. No compound variants or compose patterns.
- Storybook config exists with 5 story files but depends on `dist/` CSS that doesn't exist.
- Test files exist for Button (accessibility, WCAG 2.2) and `cn()` utility. Test harness has a type mismatch: `test/utils/accessibility.ts` expects `html: string` but `button.test.tsx` passes React elements.

#### Exact rendering code duplication

- **SiteHeader**: firm (90 lines, slate colors, mobile nav), riley-day-care (89 lines, token colors, mobile nav), the-barber-cave (90 lines, token colors, mobile nav), template (38 lines, token colors, **no mobile nav** — server component only). All four are functionally identical except styling tokens and nav link arrays.
- **SiteFooter**: firm (27 lines, slate colors), riley-day-care (37 lines, token colors), the-barber-cave (41 lines, token colors + address), template (28 lines, token colors). Same pattern, different content.
- **Providers**: firm (56 lines, `tenantSlug="firm"`, no AuthAnalytics), riley-day-care (58 lines, `tenantSlug="riley-day-care"`, includes AuthAnalytics), template (53 lines, `tenantSlug="TEMPLATE_SLUG"`, includes AuthAnalytics). All import from `@agency/analytics` and `@agency/monitoring` with identical structure.
- **next.config.ts**: all four are byte-for-byte identical (7 lines, same `transpilePackages` array).
- **Font setup differs**: firm uses `inter.variable` on `<html>` element; riley-day-care uses `inter.className` on `<body>`; template uses `inter.variable` on `<html>`. Inconsistent approach.
- **Import paths differ**: firm uses relative `../components/`; demo apps and template use alias `@/components/`.

#### Why this is not yet the target architecture

- Client apps are too heavy. They are not configuration-first shells.
- Rendering responsibilities are split at the wrong boundaries: packages own some page-level presentation, but apps still own the marketing shell and page composition.
- There is no shared page renderer or block registry, so every site requires manual page implementation.
- There is no dedicated `packages/brand` semantic theme contract, even though the underlying token data exists.
- There is no dedicated `packages/marketing` package for nav/footer/hero/section/page-composition logic.
- Next.js 16.1 rendering capabilities (PPR, `"use cache"`, streaming metadata) are not used.
- Modern CSS capabilities (container queries, `color-mix()`, `@starting-style`, CSS Anchor Positioning, subgrid) are not used.
- The component library offers limited design flexibility: single-variant blocks, no compound component patterns, no multi-variant hero/CTA/feature systems.
- Blog content renders as raw text (`whitespace-pre-wrap`) with no markdown/MDX processing, no syntax highlighting, no custom components.
- `packages/content` has a complete content system (Zod schemas, validation, SEO utils, repository interface) but no app uses it — all apps have local content modules duplicating this logic.
- `packages/email` is missing documented features (templates, rate limiting, booking validation) — only `sendEmail` and `sendContactNotification` exist.
- `packages/booking` has conflicting entry points (`index.ts` and `index.tsx`) and a documented subpath (`./widget`) that doesn't exist in `package.json` exports.
- **Two RLS policies reference a role value that can never exist** (`platform_admin`), effectively creating dead admin access for storage and web vitals tables.
- RLS test suite asserts a hardcoded table count (7) that is outdated — will fail CI.
- 23 CI/CD workflows exist but several are fragile (deprecated install methods, missing binaries, hardcoded filter names).

### Known Bugs and Inconsistencies

These are confirmed issues found during codebase analysis, not speculative concerns. **22 issues total across 4 categories.**

#### Runtime Errors

1. **Missing dependency**: `apps/firm/src/components/providers.tsx` imports `@agency/monitoring` (useWebVitals, usePerformanceBudgetPresets, usePerformanceBudgets) but `@agency/monitoring` is not listed in `apps/firm/package.json`.
2. **Nonexistent import**: `apps/agency-admin/src/app/ai-content/page.tsx` imports `getServerSession` from `@/lib/auth`, but `apps/agency-admin/src/lib/auth.ts` only exports `verifySession`, `validateTenantAccess`, and `getValidatedTenantId`.
3. **Empty `dist/` directory**: `packages/design-tokens/dist/` contains no files. `packages/ui/.storybook/preview.css` imports `../../design-tokens/dist/primitives.css`, `dist/semantic.css`, and `dist/component.css` from this empty directory. Storybook cannot run without a prior `pnpm tokens:build`.

#### Data Bugs

4. **OG image slug mismatch**: `apps/firm/src/app/blog/[slug]/opengraph-image.tsx` hardcodes slugs `getting-started` and `design-tips`, but actual blog posts use `getting-started-with-digital-marketing` and `design-tips-that-convert`.

#### Structural Inconsistencies

5. **Missing hooks directory**: `packages/ui/components.json` references `@agency/ui/hooks` as the hooks alias, but no `hooks/` directory exists in `packages/ui/src/`.
6. **Firm uses hardcoded slate colors**: The entire firm app uses `text-slate-900`, `bg-slate-50`, `bg-gradient-to-br from-slate-50 to-slate-100`, `border-slate-200`, `text-slate-600` instead of semantic token classes. Demo apps correctly use `text-brand-primary`, `bg-background-primary`, etc. The agency's own site bypasses its own design token system.
7. **Dark mode values are wrong in demo apps**: `riley-day-care/src/app/globals.css` and `the-barber-cave/src/app/globals.css` have `:root .dark` blocks with hardcoded values using **agency's hue (198)**, not their own brand hues (riley: 145, barber: 30). Dark mode renders with the wrong brand colors.
8. **Font token inconsistency**: `agency.css` uses `var(--font-sans), Inter, system-ui, sans-serif` (correct, references Tailwind variable). Demo app token CSS files use raw `Inter, system-ui, sans-serif` without the `var(--font-sans)` reference.
9. **Token naming scheme mismatch**: `packages/ui` atoms/molecules use shadcn convention (`bg-primary`, `text-primary-foreground`, `bg-card`, `ring-ring`). Organisms use custom convention (`bg-background-primary`, `text-text-primary`, `text-brand-primary`). Two incompatible naming schemes in the same package.
10. **Template SiteHeader missing mobile nav**: `apps/__template__/src/components/site-header.tsx` is a server component (38 lines, no `"use client"`) with no Sheet-based mobile navigation, unlike all production apps. Scaffolded sites ship without mobile navigation.
11. **Font setup inconsistency**: firm uses `inter.variable` on `<html>` element; riley-day-care uses `inter.className` on `<body>`; template uses `inter.variable` on `<html>`. Inconsistent approach to font application.
12. **Import path inconsistency**: firm uses relative imports (`../components/site-header`); demo apps and template use alias imports (`@/components/site-header`).
13. **Test type mismatch**: `packages/ui/test/utils/accessibility.ts` functions expect `html: string` parameters, but `packages/ui/src/components/atoms/button.test.tsx` passes React elements from `@testing-library/react`.
14. **Hardcoded overlay colors**: Dialog and Sheet overlays use `bg-black/50` instead of a semantic token. Button destructive variant uses `text-white` instead of `text-destructive-foreground`.

#### Database and RLS

15. **Migration numbering**: Two migrations share the `020_` prefix (`web_vitals_metrics` and `lifecycle_events`). Supabase uses the timestamp as PK — duplicate prefix = potential `db push` failure. Remaining numbering: 001-010, 014, 061-063, 111-113, 121-122, 131-132.
16. **`riley-day-care.json` missing border tokens**: Client token file has no `color.semantic.border` definition — falls back to base semantic border which uses blue hue, not the brand's green hue.
17. **CRITICAL: Dead `platform_admin` RLS policies**: `tenant_users.role` is constrained to `('admin', 'member')` in migration `002_tenant_users.sql`. But `0132_storage_security.sql` and `020_web_vitals_metrics.sql` create policies referencing `tenant_users.role = 'platform_admin'` — this condition can NEVER match. Platform admin is actually implemented via `raw_user_meta_data->>'is_platform_admin'` elsewhere. These policies silently fail, leaving storage and web vitals tables with broken admin access.
18. **RLS test table count outdated**: `supabase/tests/00-rls-coverage.sql` asserts exactly 7 tables in `public` schema, but the schema has grown to include `files`, `file_access_logs`, `artifacts`, `artifact_versions`, `promotion_steps`, `experiments`, `experiment_events`, etc. This test will fail on any CI run.

#### Package Issues

19. **Booking dual entry point**: `packages/booking/src/` has both `index.ts` and `index.tsx`. `index.ts` documents a `./widget` subpath that doesn't exist in `package.json` exports. The conflicting entry points may cause unpredictable resolution.
20. **Email package docs/reality mismatch**: `packages/email/AGENTS.md` documents `getTemplate`, `checkRateLimit`, `validateBookingData` — none exist. Only `sendEmail` and `sendContactNotification` are implemented.
21. **Content package unused by apps**: `packages/content` has a full content system (Zod schemas, validation, repository) but all apps use local content modules that duplicate this functionality.

#### CI/CD Workflows

22. **`security-compliance.yml` fragile**: uses `test:e2e --grep "Security Headers"` (tests may not exist), `bc` (not on `ubuntu-latest`), and filter names that may not match packages.
23. **`sbom.yml` deprecated install**: uses `apt-key` for Trivy — deprecated since Ubuntu 22.04.
24. **No app deployment workflow**: Only `deploy.yml` for database migrations exists. No automated app deployment pipeline.

### Rendering Responsibility Map

| Layer                   | Current State                                                                                                      | Target State                                                                                                      |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| Routing and metadata    | App-owned                                                                                                          | App-owned (unchanged)                                                                                             |
| Fonts                   | App-owned (inconsistent: `inter.variable` on `<html>` vs `inter.className` on `<body>`)                            | App-owned, standardized: `inter.variable` on `<html>`                                                             |
| Rendering engine        | `cacheComponents` off, ISR `revalidate`                                                                            | PPR via `cacheComponents: true` (top-level, stable), `"use cache"` (async required) + `cacheLife` presets         |
| Request interception    | `middleware.ts` with `middleware()` export (Edge runtime)                                                          | `proxy.ts` with `proxy()` export (Node.js runtime default)                                                        |
| Theme contract          | App-local token CSS files, fragmented naming (shadcn in atoms, custom in organisms)                                | Shared `packages/brand` contract, shadcn-aligned variable names, `data-theme` attribute, thin app override        |
| Token naming            | Split: atoms use `bg-primary`/`text-primary-foreground`, organisms use `bg-background-primary`/`text-text-primary` | Unified shadcn convention: `--background`, `--foreground`, `--primary`, `--card`, `--muted`, etc.                 |
| Styling approach        | Firm: hardcoded slate. Demos: semantic tokens.                                                                     | All apps: semantic tokens exclusively                                                                             |
| Dark mode               | Firm: proper agency dark. Demos: wrong (agency hue hardcoded)                                                      | Per-brand dark values via `[data-theme] .dark` or `@custom-variant`                                               |
| UI primitives           | `packages/ui` (mixed with organisms)                                                                               | `packages/ui` (primitives only, container-query responsive)                                                       |
| Marketing blocks        | Split between apps and `packages/ui`                                                                               | `packages/marketing` with multi-variant blocks (3+ variants per category)                                         |
| Header/footer/nav       | App-owned duplicates (38-90 lines each, 4 copies)                                                                  | Shared package exports with variant selection                                                                     |
| Page composition        | App-owned JSX                                                                                                      | Config-driven block registry with `RenderPage`                                                                    |
| Content and site config | Partially app-owned                                                                                                | App-owned typed config + content modules                                                                          |
| Providers               | App-owned duplicates (53-58 lines, inconsistent AuthAnalytics inclusion)                                           | Shared `SiteProviders` with app-specific inputs                                                                   |
| SEO / JSON-LD           | App-owned, partial (LocalBusiness, WebSite only)                                                                   | Shared builders for metadata, JSON-LD (Organization, LocalBusiness, Service, FAQPage, BlogPosting)                |
| Responsiveness          | Viewport media queries (except Card's `@container/card-header`)                                                    | Container queries (`@container` + `@sm:`–`@7xl:` Tailwind variants) for components, viewport only for page layout |
| Entry animations        | None                                                                                                               | Tailwind `starting:` variant for dialog/sheet/popover entry                                                       |
| Card grid alignment     | No subgrid                                                                                                         | `grid-rows-subgrid` / `grid-cols-subgrid` Tailwind utilities                                                      |
| Page transitions        | None                                                                                                               | `next-view-transitions` package (not experimental native flag)                                                    |
| Blog rendering          | Raw text with `whitespace-pre-wrap`                                                                                | MDX via `next-mdx-remote` `compileMDX()` in RSC with `rehype-pretty-code`                                         |
| Content validation      | None — local TypeScript objects                                                                                    | Zod schemas from `packages/content` (`BlogPostSchema`, `ServicePageSchema`)                                       |
| Platform admin RLS      | Dead policies (role value never matches)                                                                           | Auth Hook injecting role into JWT, `auth.jwt() ->> 'user_role'` in policies                                       |
| Multi-tenant deploy     | No deployment pipeline                                                                                             | Vercel per-app projects with `turbo build --filter=@agency/<app>`                                                 |
| Token build bridge      | Style Dictionary → custom CSS variable names                                                                       | SD v4 custom `name/shadcn` transform + `css/shadcn-theme` format → shadcn vars                                    |
| Content system          | Local per-app content modules (duplicated logic)                                                                   | `packages/content` Zod schemas + `next-mdx-remote` for rendering                                                  |
| RLS test coverage       | Hardcoded 7-table assertion (outdated)                                                                             | Dynamic `tests.rls_enabled('public')` from `basejump-supabase_test_helpers`                                       |

### Deep UI/UX Findings

#### `packages/ui`

- Strong primitive base: Button (6 variants via CVA: `default`, `destructive`, `outline`, `secondary`, `ghost`, `link`; 8 sizes: `default`, `xs`, `sm`, `lg`, `icon`, `icon-xs`, `icon-sm`, `icon-lg`; `asChild` via Radix Slot), Card (7 subcomponents including CardAction), Dialog (custom `showCloseButton` prop), Sheet (4 sides), DropdownMenu (14 sub-components, `inset` prop, `variant` on MenuItem), Tabs, Alert (2 variants), Badge (4 variants), Progress, ThemeToggle, Input, Label.
- Mixes abstraction levels: atoms and molecules belong here, but marketing organisms (`HeroSection`, `FeatureGrid`, `CTASection`, `PageSection`) do not.
- **Semantic class usage is split**: organisms correctly use custom semantic tokens (`bg-background-primary`, `text-text-primary`, `text-brand-primary`). But atoms/molecules use **shadcn convention** tokens (`bg-primary`, `text-primary-foreground`, `bg-secondary`, `bg-card`, `text-muted-foreground`, `bg-popover`, `ring-ring`). These are two incompatible naming schemes in the same package.
- No server/client split -- components are not organized by rendering boundary.
- Card already uses `@container/card-header` — the only container query in the package. All other responsive behavior is viewport-based (`md:`, `sm:`).
- No compound component patterns beyond what Radix provides. CVA `compoundVariants` and `compose()` are unused.
- `components.json` references a `hooks` alias (`@agency/ui/hooks`) that does not exist — no `hooks/` directory.
- Storybook has 5 story files but is broken because it imports from `packages/design-tokens/dist/` which is empty.
- Test harness has a type mismatch: `test/utils/accessibility.ts` functions expect `html: string` but `button.test.tsx` passes rendered React elements.

#### `apps/firm`

- The agency's public site with the richest content: 3 service pages, 2 blog posts, contact form with Zod validation and honeypot, booking page with `@agency/booking` widget (database-backed with admin client).
- Real metadata: sitemap.ts, robots.ts, opengraph-image.tsx for root and blog posts, JSON-LD (LocalBusiness with full OfferCatalog, WebSite with SearchAction).
- Middleware with CSP nonce generation and comprehensive security headers (X-Frame-Options: DENY, HSTS, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, CSP report-uri).
- **Critical problem**: uses hardcoded Tailwind slate colors throughout every page (`text-slate-900`, `bg-gradient-to-br from-slate-50 to-slate-100`, `border-slate-200`), meaning the token system is bypassed entirely. This is the agency's own site and the most feature-rich app, yet it is the least themeable.
- Skip-to-content link is correctly implemented.
- Blog content is rendered as raw text with `whitespace-pre-wrap` — no markdown processing.
- Uses `cache()` from React for deduplicating content function calls within a render.
- Services page has ISR with `revalidate = 60`; blog page has `revalidate = 3600`.
- Header is interactive (client component, 90 lines) with mobile Sheet nav and ThemeToggle.
- Best candidate to become the first thin-shell reference implementation, but requires migrating from slate to semantic tokens.

#### `apps/prospective-clients/*`

- Working demo sites that prove the token approach works — these correctly use semantic token classes.
- Both have auth flows (login, signup, callback) and tenant-scoped dashboards.
- UX is simpler than the firm app: card-driven layouts with basic service/program pages.
- `riley-day-care` has blog functionality; `the-barber-cave` does not.
- Both duplicate the same shell pattern: local `SiteHeader`, `SiteFooter`, `Providers`.
- Both have dark-mode CSS that uses **agency's hue values** instead of their own brand hues.
- Font setup uses `inter.className` on `<body>` (differs from firm which uses `inter.variable` on `<html>`).
- Highest value as migration targets for the package-first rendering system.

#### `apps/__template__`

- Scaffolds new client sites via placeholder tokens (`TEMPLATE_SLUG`, `TEMPLATE_PORT`, `TEMPLATE_NAME`).
- **SiteHeader is a server component** (38 lines, no `"use client"`) with no mobile Sheet navigation — unlike the production apps which all have mobile nav. This means scaffolded sites ship without mobile navigation.
- Structurally usable but generates an app that owns page shell, header, footer, and manual content rendering.
- `TEMPLATE_SLUG.css` import in globals.css is a literal string that won't resolve until the scaffold script renames it.
- Not aligned with the thin-shell goal.
- Highest-leverage app to fix after shared packages are in place.

#### `apps/agency-admin`

- Internal admin dashboard: cost management, DORA metrics, security compliance, AI content, experiments.
- Separate rendering concern from client sites -- should not be forced into the same shell model.
- Has its own auth layer, API routes, Inngest background jobs.
- Not in scope for the site-factory rendering architecture.

---

## Research Conclusions (March 2026)

### Rendering: Next.js 16.1

- **PPR is stable and production-ready.** Enable via `cacheComponents: true` (top-level, NOT inside `experimental`) in `next.config.ts`. This single flag replaces the old `experimental.ppr` and `experimental.dynamicIO` flags. At build time, a static HTML shell is generated; at request time, dynamic sections stream in via Suspense boundaries. All dynamic code executes at request time by default (no caching unless explicitly opted in).
- **`"use cache"` directive** is the new caching primitive, replacing `unstable_cache` and implicit ISR `revalidate`. The function/component **must be `async`**. Three usage levels:
  - **File level**: `'use cache'` at top of file — caches all exports (all exported functions must be async).
  - **Component level**: `'use cache'` inside async component body.
  - **Function level**: `'use cache'` inside any async function.
- **`cacheLife` presets** control TTL. Seven built-in presets (no custom config needed):

  | Preset    | Stale  | Revalidate | Expire  |
  | --------- | ------ | ---------- | ------- |
  | `default` | 5 min  | 15 min     | never   |
  | `seconds` | 30 sec | 1 sec      | 1 min   |
  | `minutes` | 5 min  | 1 min      | 1 hour  |
  | `hours`   | 5 min  | 1 hour     | 1 day   |
  | `days`    | 5 min  | 1 day      | 1 week  |
  | `weeks`   | 5 min  | 1 week     | 30 days |
  | `max`     | 5 min  | 30 days    | 1 year  |

  Custom presets can be defined in `next.config.ts` under `cacheLife: { customName: { stale, revalidate, expire } }`. One-off inline profiles: `cacheLife({ stale: 60, revalidate: 300, expire: 3600 })`.

- **`cacheTag` / `revalidateTag` / `updateTag`**: `cacheTag('tag-one', 'tag-two')` labels cache entries (max 128 tags, 256 chars each). The **single-argument `revalidateTag(tag)` is deprecated**; use `revalidateTag(tag, profile)` for stale-while-revalidate semantics. New **`updateTag(tag)`** function (Server Actions only) immediately expires the cache for read-your-own-writes consistency.
- **Route segment config** (`dynamic`, `revalidate`, `fetchCache`) is **disabled** (not just deprecated) when `cacheComponents` is enabled. Existing `export const revalidate = N` will be ignored or error.
- **`middleware.ts` renamed to `proxy.ts`** in Next.js 16. Export name changes from `middleware()` to `proxy()`. Runtime default changed from Edge to **Node.js**. No response bodies allowed — only redirect, rewrite, or modify headers. Automated codemod: `npx @next/codemod@canary middleware-to-proxy .`.
- **Streaming metadata** now loads in parallel with page content instead of blocking the stream (Next.js 16.1).
- **Server Components should remain the default.** Push `"use client"` to leaf-level interactive elements only. Measured impact: 50-70% reduction in First Load JS.
- **Turbopack file system caching** is stable and default: 5-14x faster cold starts.
- **`transpilePackages`** is unchanged — still required for monorepo packages and external dependencies shipping untranspiled code.
- **ISR and `"use cache"` compatibility caveat**: `"use cache"` caches at the data/component layer but does NOT yet produce CDN-level full-route caching like ISR. You lose the "serve stale HTML from edge, revalidate in background" behavior if you replace ISR wholesale. Recommended migration: keep ISR for route-level CDN caching of marketing pages; add `"use cache"` incrementally for component-level data fetching. Known Vercel-specific issues: OOM during builds with many static paths, `"use cache"` directives silently dropped in some dynamic routes.
- **`"use cache: remote"`** — a variant that shares cache entries across all serverless instances. Valuable for multi-tenant config lookups: one cache entry per tenant slug shared globally.

### Design Flexibility: Tailwind v4 + Modern CSS

- **Container Queries** are built into Tailwind v4 core (no plugin): `@container` class on parent, `@`-prefixed variants on children. Sizes are **different from viewport breakpoints**:

  | Variant                 | Min width     |
  | ----------------------- | ------------- |
  | `@3xs:`                 | 16rem (256px) |
  | `@2xs:`                 | 18rem (288px) |
  | `@xs:`                  | 20rem (320px) |
  | `@sm:`                  | 24rem (384px) |
  | `@md:`                  | 28rem (448px) |
  | `@lg:`                  | 32rem (512px) |
  | `@xl:`                  | 36rem (576px) |
  | `@2xl:`                 | 42rem (672px) |
  | `@3xl:` through `@7xl:` | 48rem–80rem   |

  Additional syntax: max-width (`@max-sm:`), ranges (`@sm:@max-md:`), named containers (`@container/main` on parent, `@sm/main:` on children), arbitrary values (`@min-[475px]:`). Custom sizes via `@theme { --container-8xl: 96rem; }`.

- **`@theme` vs `@theme inline` vs `@theme static`**: `@theme` generates a CSS custom property on `:root` and a utility class referencing it — use for runtime-overridable values. `@theme inline` inlines the value directly — use when referencing another variable (prevents resolution issues). `@theme static` always generates all variables regardless of utility usage. They can be mixed.

- **OKLCH color space** is the correct standard for perceptually uniform color scales. Tailwind v4 uses `color-mix(in oklab, ...)` internally for opacity modifiers: `bg-blue-500/50` generates `color-mix(in oklab, var(--color-blue-500) 50%, transparent)`.

- **`color-mix()`** enables generating hover, active, and disabled states from a single brand color without defining every shade: `color-mix(in oklch, var(--brand) 80%, white)`. Can be used directly in `@theme` definitions. Arbitrary values work: `bg-[color-mix(in_oklch,var(--color-brand)_80%,black)]`.

- **CSS `@layer`** — Tailwind v4 uses **real native CSS cascade layers**. When `@import "tailwindcss"` is used, it expands to four layers in precedence order:
  1. `theme` — `@theme` design token variables
  2. `base` — Preflight / reset styles
  3. `components` — available for custom styles
  4. `utilities` — all utility classes

  Custom utilities that need variant support must use the `@utility` directive (not `@layer utilities`):

  ```css
  @utility tab-4 {
    tab-size: 4;
  }
  ```

- **CSS Subgrid** — Tailwind v4 has built-in utilities: `grid-rows-subgrid` (`grid-template-rows: subgrid`) and `grid-cols-subgrid` (`grid-template-columns: subgrid`). No plugin or arbitrary value needed. Enables perfectly aligned card grids.

- **`@starting-style`** — Tailwind v4 has a built-in `starting:` variant that maps directly to `@starting-style` in CSS. Stackable with other variants: `starting:open:opacity-0 transition-discrete`. No raw CSS needed. Browser support is approaching production readiness.

- **`@custom-variant`** for dark mode and custom states. Shorthand: `@custom-variant dark (&:where(.dark, .dark *));`. Block syntax with `@slot` for complex selectors. Also for data attributes: `@custom-variant theme-midnight (&:where([data-theme="midnight"] *));`. Default Tailwind v4 dark mode uses `prefers-color-scheme`; override with `@custom-variant` for class-based or attribute-based dark mode.

- **CSS Anchor Positioning** now supported in Chrome, Edge, Safari 26, Firefox 147. Eliminates Floating UI for many tooltip/popover cases. Native `position-try-fallbacks` for automatic repositioning.

- **Popover API** with native HTML `popover` attribute: declarative open/close, integrates with Anchor Positioning and `@starting-style` / `starting:` variant.

- **View Transitions API** for page transitions. Next.js 16 has **experimental** native support via `experimental: { viewTransition: true }` (not production-recommended). For production, use `next-view-transitions` package by Shu Ding/Vercel with `<ViewTransitions>` wrapper, custom `<Link>`, and `useTransitionRouter()`.

- **CSS Nesting** is native across all major browsers. Tailwind v4 embraces it.

### Component Library: shadcn CLI v4

- **Namespaced registries** allow building an internal `@agency/` registry for distributing blocks: `npx shadcn@latest add @agency/hero-block`. Configuration in `components.json` under `registries`:

  ```json
  { "registries": { "@agency": "https://registry.agency.com/r/{name}.json" } }
  ```

  Private registries support auth headers with `${ENV_VAR}` expansion. Build with `npx shadcn@latest build` which generates JSON files to `public/r/`.

- **Presets** (CLI v4, March 2026) pack entire design system config (colors, fonts, radius, icon library) into a short shareable code string. Initialize or switch: `npx shadcn@latest init --preset a1Dg5eFl`. Build and preview on `ui.shadcn.com/create`.

- **`--dry-run`, `--diff`, `--view`** on `add` command for safe component inspection before writing:
  - `npx shadcn@latest add button --dry-run` — preview changes without writing files
  - `npx shadcn@latest add button --diff` — show diff against existing files
  - `npx shadcn@latest add button --view` — show file contents from registry

- **Monorepo setup**: `npx shadcn@latest init --monorepo`. Both `packages/ui/components.json` and app-level `components.json` must exist with matching `style`, `iconLibrary`, and `baseColor`. For Tailwind v4, `tailwind.config` must be an empty string `""`. Aliases use `@workspace/ui/` prefix: `"ui": "@workspace/ui/components"`, `"utils": "@workspace/ui/lib/utils"`.

- **Server/client split**: shadcn does not maintain a formal list. Principle: `"use client"` only where React hooks or event handlers are needed. After Radix UI added RSC support, ~50 components had unnecessary `"use client"` removed. Currently server-safe: Card, Badge, Table, Separator, Skeleton, Alert. Currently need `"use client"`: Dialog, DropdownMenu, Tooltip, Popover, Sheet, Command, Tabs, Label (uses Radix Label).

- **CSS variable theming** — shadcn/ui uses OKLCH and expects these variables (full list):

  | Variable                                     | Purpose                    |
  | -------------------------------------------- | -------------------------- |
  | `--background` / `--foreground`              | Page background / text     |
  | `--card` / `--card-foreground`               | Card background / text     |
  | `--popover` / `--popover-foreground`         | Popover background / text  |
  | `--primary` / `--primary-foreground`         | Primary actions / text     |
  | `--secondary` / `--secondary-foreground`     | Secondary actions / text   |
  | `--muted` / `--muted-foreground`             | Muted background / text    |
  | `--accent` / `--accent-foreground`           | Accent background / text   |
  | `--destructive` / `--destructive-foreground` | Destructive actions / text |
  | `--border`                                   | Borders                    |
  | `--input`                                    | Input borders              |
  | `--ring`                                     | Focus rings                |
  | `--radius`                                   | Border radius              |
  | `--chart-1` through `--chart-5`              | Chart colors               |
  | `--sidebar-*` variants                       | Sidebar-specific colors    |

  To add custom colors: define the variable in `:root`, then register with `@theme inline { --color-brand: var(--brand); }`.

- **CVA compound variants** and `compose()` for managing variant combinations across a library.

### Design Tokens: DTCG 2025.10

- **DTCG 2025.10** is a stable Candidate Recommendation with support from Figma, Sketch, Framer, Penpot, and Tokens Studio. The format the repo already uses is production-safe.
- **Style Dictionary v4** multi-brand pattern: create separate SD instances per theme permutation using different source file combinations. ESM-only, async API. `preprocessors` for dictionary-wide modifications before per-platform transforms.
- **Three-layer token hierarchy** is the enterprise standard: Primitives (raw values) -> Semantic (purpose-driven aliases) -> Component (scoped to individual components). For agencies, add a brand layer between primitives and semantics.
- **`@tokens-studio/sd-transforms`** bridges Tokens Studio output to Style Dictionary.

### Content Processing: MDX

- **Blog content is currently raw text** rendered with `whitespace-pre-wrap` — no markdown processing, no syntax highlighting, no custom components.
- **`next-mdx-remote`** (v6+) is the recommended approach for MDX stored as strings (database, CMS, or local content modules). `compileMDX()` runs entirely on the server in RSC — zero client JS for the MDX runtime. Returns `{ content, frontmatter }` where `content` is a React element.
- **Velite** is the modern Contentlayer replacement for filesystem MDX with typed Zod-like schema validation. Use if migrating to `.mdx` files on disk.
- **`@next/mdx`** is built-in for `.mdx` files treated as route pages. Use only if MDX files live alongside route segments.
- **Syntax highlighting**: `rehype-pretty-code` powered by Shiki 3 provides VS Code-grade highlighting with line numbers, highlighting ranges, and inline code context. Works with all MDX approaches.
- **Custom components** can be both Server and Client Components but cannot be passed via React Context (RSC limitation — pass as `components` prop to `compileMDX`).
- **`packages/content`** already has a real content system with Zod schemas (`BlogPostSchema`, `ServicePageSchema`, `CaseStudySchema`) and validation utilities, but apps use local content modules instead of it. The migration path is to use `packages/content` schemas for validation and `next-mdx-remote` for rendering.

### Design Tokens: Style Dictionary to shadcn Bridge

- **No off-the-shelf Style Dictionary plugin exists for shadcn/ui.** A custom SD v4 name transform and format must be built.
- The bridge requires: (1) a **custom `name` transform** that strips the DTCG hierarchy prefix and outputs flat shadcn variable names (`background`, `foreground`, `primary`, etc.); (2) a **custom `css/shadcn-theme` format** that generates both a `:root` block with concrete values and a `@theme inline` block mapping to Tailwind's `--color-*` namespace.
- The existing `build-clients.ts` script already outputs `@theme inline` CSS — it needs to be adapted to emit shadcn-compatible variable names instead of the current custom naming scheme.
- Dark mode tokens should be structured as separate source files or groups in the DTCG JSON, generating separate `:root` and `.dark` CSS selectors.
- `@tokens-studio/sd-transforms` v1.0+ bridges Tokens Studio output to SD v4 if Figma-to-code workflows are added later.

### Zod Discriminated Union Patterns for Block Registries

- **Zod v4** (stable since 2025) has significantly improved `z.discriminatedUnion()`: support for union and pipe discriminators, composable nesting, and 7-14x faster parsing.
- **Block schema pattern**: Define each block as `z.object({ type: z.literal('hero'), ... })`, compose into `z.discriminatedUnion('type', [...])`. Zod checks the `type` discriminator first for fast validation.
- **Type-safe registry**: Map each `BlockType` to its lazy-loaded component via `dynamic(() => import('./hero-block'))`. TypeScript infers correct props per block type from the discriminated union.
- **Build-time validation**: Run `PageSchema.safeParse(json)` on all content JSON files as a CI step. Zod v4's error messages include path and issue details for precise debugging.
- **Code splitting**: `next/dynamic` in the registry provides automatic per-block code splitting. Only blocks used on a page are loaded.
- **Zod v4 + Next.js caveat**: Complex recursive `discriminatedUnion` types can trigger webpack "Cannot access before initialization" errors. Mitigation: keep schemas in a shared package that compiles separately via tsup.

### Supabase RLS Platform Admin Patterns

- **Recommended pattern**: Auth Hook + `user_roles` table. A `custom_access_token_hook()` function injects the role into the JWT at auth time. RLS policies then read from `auth.jwt() ->> 'user_role'` — no direct table joins in policies.
- **Role type safety**: Define `app_role` as a Postgres `enum` type. Cast JWT claim: `(auth.jwt() ->> 'user_role')::public.app_role`. Invalid values fail the cast instead of silently comparing.
- **Never use `user_metadata`** for authorization — it's client-modifiable via `supabase.auth.update()`.
- **`app_metadata` is acceptable** for static roles (requires admin API to change) but `user_roles` table is more flexible and auditable.
- **pgTAP testing for Auth Hook**: `tests.authenticate_as()` sets `auth.uid()` and the `authenticated` role but does NOT populate custom JWT claims. For testing policies that read custom claims, manually set: `set local request.jwt.claims = json_build_object('sub', uid, 'role', 'authenticated', 'user_role', 'admin')::text;`
- **Dynamic RLS coverage**: Use `tests.rls_enabled('public')` from `basejump-supabase_test_helpers` instead of hardcoded table count assertions.

### Site Factory Architecture

- **`data-theme` attribute** on root element for runtime theme switching. Combined with CSS custom properties, theme changes require zero component re-renders. Flash prevention: synchronous inline script in `<head>` reads `localStorage` and sets `data-theme` before CSS parses.
- **Block-based pages** with Zod discriminated unions for runtime-validated block schemas + dynamic import registry for code-splitting. Pages become ordered arrays of typed blocks rendered by a generic `<PageRenderer>`.
- **Middleware tenant detection** from subdomain or custom domain, rewriting to `[tenant]/*` route segments.
- **Draft mode** integration for CMS preview via Route Handler that validates a secret, enables draft mode, and redirects.

### Accessibility and SEO

- **INP** (Interaction to Next Paint) is the critical interaction metric. Optimization: `scheduler.yield()` to break long tasks, defer non-critical JS, minimize DOM size, use Server Components to reduce client JS.
- **WCAG 2.2 AA** requires 24x24 CSS pixel minimum target size for pointer targets. Focus indicators need minimum 2px solid outline.
- **JSON-LD** is now a semantic contract with AI answer engines, not just a rich-snippet tactic. Required schema stack for service businesses: Organization, LocalBusiness, Service, FAQPage, Review/AggregateRating.
- **`fetchPriority="high"`** on LCP image can reduce LCP from 3.2s to 0.9s on mobile. Never use `loading="lazy"` on above-the-fold images.
- **Reduced motion**: respect `prefers-reduced-motion` in both CSS and JavaScript. Use 150-250ms for small UI transitions. Never autoplay animations.

### Multi-Tenant Vercel Deployment

- **Each app becomes a separate Vercel project** linked to the same Git repository. Set Root Directory to the app path (e.g., `apps/firm`), Build Command to `cd ../.. && turbo build --filter=@agency/firm`.
- **Vercel automatically skips builds** for unaffected projects in a monorepo — if only `apps/firm` changed, `apps/agency-admin` won't rebuild. Free on all plans.
- **Custom domains per tenant**: subdomain (`riley-day-care.agency.com`) via wildcard `*.agency.com` DNS, or custom domain (`www.rileydaycare.com`) via per-tenant CNAME. Vercel handles automatic SSL. Unlimited subdomains on all plans; unlimited custom domains on Pro.
- **`proxy.ts` for tenant detection** from subdomain or custom domain: rewrite to `/_tenant/[slug]/*` route segments. Auth logic must move to Layout Guards (proxy cannot return response bodies).
- **`turbo.json` must declare all env vars** that affect builds in the `env` array for correct cache invalidation.
- **CI/CD**: Use `pnpm turbo <task> --filter='...[origin/main]'` for affected-only execution. Always `fetch-depth: 0` in checkout. Gate production migrations behind manual approval with GitHub Actions `environment: production`.
- **Database migration safety**: Use expand-contract pattern (add nullable column → dual-write → backfill → cut-over → drop old column). Never deploy app code and destructive schema changes simultaneously.

### What must stay in the app folder

- App Router route entrypoints: `layout.tsx`, `page.tsx`, `loading.tsx`, `error.tsx`, `not-found.tsx`, `route.ts`.
- Metadata files: `favicon`, `icon`, `apple-icon`, `opengraph-image`, `twitter-image`, `robots`, `sitemap`, `manifest`.
- App-level font binding via `next/font` in the root layout.
- The root global CSS entrypoint and its import order.
- Request interception file (`proxy.ts`, formerly `middleware.ts`) only when actually needed. Exports `proxy()` (not `middleware()`), runs on Node.js runtime by default.
- App-specific content, config, and theme override files.
- One-off bespoke components in `_components/` private folders.

### What can safely move into packages

- Semantic theme contract CSS and theme presets.
- Primitive UI components (with server/client split).
- Marketing blocks (hero, features, CTA, FAQ, testimonials, service grid, pricing).
- Navigation and footer rendering with multi-variant support.
- Page schema types, block registry, and `RenderPage` helper.
- SEO metadata builders and JSON-LD builders.
- Shared provider composition helpers.
- Contact form and other shared interactive blocks.
- Shared test utilities and factories.

### Hard constraints from Next.js

The client app cannot become a single config file. The irreducible minimum is:

- Route entry files (`layout.tsx`, `page.tsx`)
- Metadata files (`favicon`, `robots`, `sitemap`, `manifest`, `icon`, `opengraph-image`)
- App root layout with font binding
- App CSS entrypoint with correct import order
- App-specific config, content, and theme overrides

The correct goal is not "no app code." The correct goal is **"no app-owned rendering system."**

---

## Comparative Analysis

### Where the repo already aligns with the guide and research

- Root workspace, pnpm 10 catalogs, Turborepo 2.7, TypeScript strict, ESLint 9, CI, RLS, and testing infrastructure are strong and current.
- Shared package usage is normalized with `workspace:*` dependencies.
- `transpilePackages` is already enabled in app configs (still required in Next.js 16, unchanged API).
- Design token data exists in W3C DTCG format with Style Dictionary v4 -- the correct format per the now-stable DTCG 2025.10 spec.
- OKLCH color space is already used in token definitions.
- Tailwind v4 CSS-first config is correctly wired with `@theme inline` and `@source` directives.
- `@custom-variant dark (&:is(.dark *));` is already declared in globals.css files.
- `tw-animate-css` is already the animation baseline.
- Supabase auth uses `app_metadata` for tenant_id (correct pattern per security guidelines).
- Card component already uses `@container/card-header` (container query).
- Demo apps already use semantic token classes correctly (proves the approach works).
- Firm app has comprehensive security middleware (CSP with nonce, HSTS, X-Frame-Options DENY, report-uri).
- Skip-to-content links are correctly implemented in all site layouts.
- `prefers-reduced-motion: reduce` media query exists in all app globals.css files.

### Where the repo diverges from the guide and research

#### Architecture Gaps

- **Missing `packages/brand`**: no semantic theme contract, no theme presets, no `data-theme` system.
- **Missing `packages/marketing`**: no shared block library, no page renderer, no block registry.
- **Missing `packages/env`**: no validated environment variable layer.
- **Marketing organisms in `packages/ui`**: HeroSection, FeatureGrid, CTASection belong in a marketing package.
- **Client apps still own rendering shell logic**: every app duplicates SiteHeader (38-90 lines each), SiteFooter (27-41 lines each), Providers (53-58 lines each), and `next.config.ts` (identical across all four apps).
- **Template app scaffolds hardcoded sites**, not configuration-driven sites. Template SiteHeader also lacks mobile navigation.
- **No server/client split in `packages/ui`**: components are not organized by rendering boundary.
- **No shadcn registry**: no internal `@agency/` registry for block distribution.

#### Rendering Gaps

- **No PPR**: `cacheComponents: true` is not set in any `next.config.ts`. This is a top-level stable flag in Next.js 16 (not experimental).
- **No `"use cache"`**: all caching uses old ISR `revalidate` pattern. Note: ISR and `"use cache"` serve different levels — ISR is route-level CDN caching, `"use cache"` is component/data-level caching. They should coexist, not replace each other (see AP-001-4 for migration strategy).
- **Request interception files use `middleware.ts`**: Next.js 16 renamed to `proxy.ts` with `proxy()` export and Node.js runtime default. Automated codemod is available.
- **No block-level Suspense**: no streaming boundaries around independently-loading sections.
- **No route groups**: pages are not organized into `(marketing)` and `(legal)` groups.
- **No MDX processing**: blog content renders as raw text. `next-mdx-remote` `compileMDX()` in RSC is the recommended approach (zero client JS).
- **Content package unused**: `packages/content` has Zod schemas, validation, and utilities but all apps use local modules.

#### Styling Gaps

- **Firm site bypasses token system entirely**: uses hardcoded `text-slate-*`, `bg-slate-*`, `border-slate-*` instead of semantic tokens. This is the most content-rich app and cannot be restyled via tokens.
- **Token naming scheme is fragmented**: UI atoms/molecules use shadcn convention (`bg-primary`, `text-primary-foreground`), UI organisms use custom convention (`bg-background-primary`, `text-text-primary`), and neither aligns with the full shadcn variable list (`--background`, `--foreground`, `--card`, `--popover`, `--muted`, `--accent`, `--destructive`, `--border`, `--input`, `--ring`).
- **No container queries** beyond Card's `@container/card-header`. Tailwind v4 provides `@container` class with `@3xs:` through `@7xl:` variants (different sizes than viewport breakpoints). All component-internal responsive behavior uses viewport queries (`md:`, `lg:`).
- **No `color-mix()`**: hover/active states require full color definitions instead of dynamic derivation. Tailwind v4 uses `color-mix(in oklab, ...)` internally for opacity modifiers; the repo should leverage this for derived states.
- **No CSS Subgrid**: card grids do not align content across rows. Tailwind v4 provides built-in `grid-rows-subgrid` and `grid-cols-subgrid` utilities.
- **No `@starting-style` / `starting:` variant**: Tailwind v4 has a built-in `starting:` variant for CSS entry animations on dialogs and popovers. Not used.
- **Dark mode values are wrong**: demo app globals.css files contain hardcoded agency-hue dark mode values instead of per-brand dark values.

#### Design Flexibility Gaps

- **No multi-variant blocks**: hero has one variant, features has one variant, CTA has one variant. The guide and research call for `hero-centered`, `hero-split`, `hero-minimal`, etc. A site factory with single-variant blocks is a template, not a design tool.
- **No View Transitions**: no page transition animations. Next.js 16 native support is experimental; `next-view-transitions` package is production-ready.
- **No CSS Anchor Positioning**: JavaScript-based positioning (Radix/Floating UI) used exclusively.
- **CVA patterns are underutilized**: no `compoundVariants` or `compose()` usage anywhere in the component library.

#### Production Gaps

- **App-level legal routes are missing**: no privacy or terms pages in any site.
- **Metadata file coverage is partial**: no `manifest.ts`, no `twitter-image`, incomplete app icons.
- **No JSON-LD for Service schema**: firm has LocalBusiness and WebSite but not Service or FAQPage.
- **Blog content is raw text**: `whitespace-pre-wrap` rendering in `blog/[slug]/page.tsx` instead of markdown processing.
- **Design tokens `dist/` is empty**: Storybook and any consumer of built token CSS is broken.
- **No app deployment pipeline**: only database migration deployment exists (`deploy.yml`). No GitHub Actions workflow for deploying apps to Vercel (may be handled by Vercel's Git integration, but this should be documented).
- **CI workflows fragile**: `security-compliance.yml` references tests and binaries that may not exist; `sbom.yml` uses deprecated `apt-key`.

#### Database/RLS Gaps

- **Dead `platform_admin` policies**: two migrations reference a role value (`platform_admin`) not in the enum constraint — policies can never match.
- **RLS test outdated**: coverage test asserts hardcoded table count that no longer reflects the schema.
- **No Auth Hook for role injection**: platform admin status is checked via different patterns across migrations (metadata vs. role column). Supabase recommends Auth Hook + `user_roles` table for unified role management.

### Strategic conclusion

The repository is operationally mature but rendering-architecture incomplete. The infrastructure packages (security, monitoring, governance, cost, metrics, AI) are well ahead of what is needed for the first revenue milestone. The critical path to revenue is the rendering pipeline: `packages/brand` + `packages/ui` (cleaned) + `packages/marketing` + thin client apps.

The gap is not just structural. The research reveals that Next.js 16.1, Tailwind v4, and modern CSS provide significant rendering and design capabilities that the repo does not yet use: PPR, `"use cache"` + `cacheLife`/`cacheTag`/`updateTag`, container queries (`@container` + `@sm:`–`@7xl:`), `color-mix()`, CSS subgrid (`grid-rows-subgrid`), `@starting-style` (Tailwind `starting:` variant), View Transitions, and CSS Anchor Positioning. Adopting these is not optional polish — they directly enable the "maximum design flexibility" goal.

There is also a critical consistency problem: the firm app (the agency's own site, and the most feature-rich) uses hardcoded slate colors, bypassing the design token system that the demo apps correctly use. Additionally, the token naming scheme is fragmented between shadcn convention in UI primitives and a custom convention in organisms. The brand contract must unify around the shadcn variable convention (`--background`, `--foreground`, `--primary`, etc.) since that is what the component library's atoms and molecules already reference.

**New critical findings (Round 2 Analysis):**

1. **Database security gap**: Two RLS policies reference `platform_admin` role that cannot exist given the enum constraint. This means admin access to storage files and web vitals is broken at the database level.
2. **ISR/`"use cache"` migration must be incremental**: `"use cache"` does NOT replace ISR for CDN-level route caching. Keep ISR for full-page caching; add `"use cache"` for component-level caching. This changes the AP-001-4 migration strategy significantly.
3. **Sleeping assets**: `packages/content` has a complete, unused content system. `packages/email` is missing documented features. `packages/booking` has conflicting entry points. These packages need alignment with reality before the platform can be considered production-ready.
4. **MDX processing missing**: Blog content renders as raw text — `next-mdx-remote` `compileMDX()` in RSC provides zero-client-JS MDX rendering.
5. **No Style Dictionary → shadcn bridge**: A custom SD v4 transform and format must be built to bridge DTCG tokens to shadcn CSS variable names.
6. **CI/CD fragility**: 23 workflows exist but several reference tests, binaries, or package names that don't exist. No app deployment workflow (may rely on Vercel Git integration).
7. **RLS test coverage assertion is stale**: will fail CI due to hardcoded table count not matching current schema.

---

## [~] AP-001: Establish Package-First Rendering Boundaries

**Progress Update (2026-03-18)**

- Created `packages/marketing` and moved the existing shared marketing blocks (`HeroSection`, `FeatureGrid`, `CTASection`, `PageSection`) out of the `@agency/ui` root surface.
- Added `@agency/ui` boundary barrels for `client`, `components`, `server`, and `hooks`, with `server-only` applied to the new server barrel.
- Introduced shared `SiteShell`, `SiteHeader`, `SiteFooter`, `SiteProviders`, and typed `SiteConfig` in `packages/marketing`, then rewired `apps/firm`, `apps/prospective-clients/riley-day-care`, `apps/prospective-clients/the-barber-cave`, and `apps/__template__` layouts to use them.
- Added per-app `src/config/site.ts` files and standardized public app layouts on `inter.variable` + `data-theme={siteConfig.slug}`.
- Enabled `cacheComponents: true` in `apps/firm` and converted the firm content access layer (`src/content/services.ts`, `src/content/blog.ts`) to async `"use cache"` functions using `cacheLife` and `cacheTag`.
- Added route-level `"use cache"` + `cacheLife`/`cacheTag` to the firm marketing layout and public pages so Cache Components now has an explicit page-output caching strategy instead of relying on removed route-segment `revalidate` exports.
- Renamed the public-site request interception files from `middleware.ts` to `proxy.ts` in `apps/firm`, `apps/prospective-clients/riley-day-care`, `apps/prospective-clients/the-barber-cave`, and `apps/__template__`.
- Added `server-only` guards to `packages/database/src/admin.ts`, `packages/analytics/src/server.ts`, and the firm server content modules, plus `client-only` to `packages/marketing/src/providers/site-providers.tsx`.
- Replaced stale public-app shell/provider compatibility files with thin adapters over `@agency/marketing` and normalized client-safe analytics/monitoring imports so legacy files no longer drag incorrect boundaries into builds.
- Completed a production-like `pnpm --filter @agency/firm build` validation pass, including workspace package export cleanup (`@agency/content`, `@agency/database`, `@agency/monitoring/client`), strict-type fixes in shared packages, and graceful prerender fallback for `/book` when admin credentials are absent at build time.
- Remaining work in this task: finish the UI boundary cleanup beyond the new barrels, decide whether to delete the now-redundant public-app compatibility components, regenerate real Supabase database types to replace the permissive recovery stub in `packages/database/src/types.ts`, and roll the rendering changes into the remaining public apps/content routes.

### Definition of Done

- [ ] `packages/ui` contains only primitives, shared utilities, and narrowly scoped interactive controls.
- [ ] Marketing-level rendering concerns are removed from `packages/ui` and relocated.
- [ ] All site apps use the same shared shell contract instead of app-local duplicated shell components.
- [ ] Server/client boundaries are explicit and minimal across shared rendering code.
- [ ] The app folder is reduced to routing, metadata, config, content, theme override, and truly app-specific glue.
- [ ] PPR is enabled in `apps/firm` via `cacheComponents: true` (then rolled out to other apps after stability verification).
- [ ] ISR (`export const revalidate`) retained for route-level CDN caching of marketing pages.
- [ ] `"use cache"` + `cacheLife` added incrementally for component-level data fetching within Suspense boundaries. All cached functions/components are `async`.
- [ ] Content-fetching functions that use `"use cache"` are async and return Promises.
- [ ] `server-only` and `client-only` guards are applied to packages that must not cross environment boundaries.

### Out of Scope

- Replacing Tailwind CSS with another styling system.
- Rewriting the admin app into the same shell model as public sites.
- Designing a CMS in this task.
- Introducing a mobile rendering strategy.
- Publishing packages externally.

### Strict Rules to Follow

- Keep pages and layouts as Server Components by default.
- Do not leave navigation, footer, or hero rendering duplicated in multiple apps.
- Do not keep page-level marketing organisms in the primitive UI package.
- Do not move App Router file conventions out of the app layer.
- Do not introduce `any`; use existing strict typing patterns.
- Push `"use client"` to leaf-level interactive elements only.
- Use `cacheTag` for content that needs on-demand invalidation. Use `revalidateTag(tag, profile)` (two-arg form). Use `updateTag(tag)` in Server Actions for read-your-own-writes.
- Any function/component using `"use cache"` must be `async`. Content-fetching functions must return Promises.
- Rename `middleware.ts` to `proxy.ts`, export `proxy()` instead of `middleware()`. Note the runtime is now Node.js by default (not Edge).

### Existing Code Patterns

```tsx
// apps/firm/src/app/layout.tsx (129 lines, JSON-LD, skip link, slate colors)
import { Providers } from '../components/providers'
import { SiteHeader } from '../components/site-header'
import { SiteFooter } from '../components/site-footer'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <head>{/* JSON-LD LocalBusiness + WebSite */}</head>
      <body className="flex min-h-screen flex-col">
        <Providers>
          <a href="#main-content" className="sr-only focus:not-sr-only ...">
            Skip to main content
          </a>
          <SiteHeader />
          <main id="main-content" className="flex-1">
            {children}
          </main>
          <SiteFooter />
        </Providers>
      </body>
    </html>
  )
}

// apps/firm/src/app/services/page.tsx -- uses deprecated ISR revalidate
export const revalidate = 60
const getServices = cache(() => getAllServices()) // synchronous

// packages/ui/src/index.ts -- mixes primitives and marketing organisms
export {
  PageSection,
  HeroSection,
  FeatureGrid,
  FeatureItem,
  CTASection,
} from './components/organisms'
export { Button, buttonVariants } from './components/atoms/button'
export { Card, CardHeader, CardContent /* ... */ } from './components/molecules/card'
```

### Target Code Patterns

```tsx
// apps/client-acme-site/src/app/layout.tsx -- thin shell
import './globals.css'
import { SiteProviders } from '@agency/marketing/providers'
import { SiteShell } from '@agency/marketing/shell'
import { siteConfig } from '../config/site'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme={siteConfig.slug} className={inter.variable}>
      <body className="flex min-h-screen flex-col">
        <SiteProviders config={siteConfig}>
          <SiteShell config={siteConfig}>{children}</SiteShell>
        </SiteProviders>
      </body>
    </html>
  )
}

// apps/client-acme-site/src/app/(marketing)/services/page.tsx -- "use cache" (async required)
import { cacheLife, cacheTag } from 'next/cache'
import { RenderPage } from '@agency/marketing/page'
import { servicesPage } from '../../../content/pages/services'

export default async function ServicesPage() {
  'use cache'
  cacheLife('hours')
  cacheTag('services')
  return <RenderPage page={servicesPage} />
}

// packages/ui/src/index.ts -- primitives only
export {
  Button,
  buttonVariants,
  Input,
  Label,
  Card,
  CardHeader,
  CardContent,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  Dialog,
  DialogContent,
  DialogTrigger,
  Sheet,
  SheetContent,
  SheetTrigger,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Badge,
  badgeVariants,
  Progress,
  Alert,
  AlertTitle,
  AlertDescription,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  ThemeToggle,
} from './components'
export { cn } from './lib/utils'

// next.config.ts -- enable PPR (top-level, not experimental)
const nextConfig: NextConfig = {
  cacheComponents: true,
  transpilePackages: ['@agency/ui', '@agency/brand', '@agency/marketing'],
}
```

### Anti-Patterns

- Leaving `SiteHeader` and `SiteFooter` implemented separately inside every client app.
- Keeping hero/CTA/feature sections in the primitive UI package.
- Marking large layout trees as `"use client"` when only one child needs it.
- Making apps responsible for both rendering system design and content.
- Coupling shared packages to one tenant's wording or branding.
- Using ISR `revalidate` instead of `"use cache"` + `cacheLife` when `cacheComponents` is on.

### Subtasks

#### [x] AP-001-1: Move Marketing Organisms Out of `packages/ui`

**Target Files**: `packages/ui/src/components/organisms/`, `packages/ui/src/index.ts`
**Related Files**: `apps/firm/src/app/page.tsx`, `apps/prospective-clients/*/src/app/page.tsx`
**Action**: Remove `HeroSection`, `FeatureGrid`, `CTASection`, `PageSection` exports from `packages/ui`. These will be reimplemented as multi-variant blocks in `packages/marketing`.

#### [~] AP-001-2: Define Primitive UI Boundary and Server/Client Split

**Target Files**: `packages/ui/src/`, `packages/ui/package.json`
**Related Files**: `packages/ui/components.json`, `packages/ui/src/styles/globals.css`
**Action**: Reorganize into `server/` (Container, Section, Heading, Prose), `client/` (Button, Input, Dialog, Sheet, DropdownMenu, Tabs, ThemeToggle), and `components/` (Card, Badge, Progress, Alert, Separator). Add `server-only` guard to server exports.

#### [x] AP-001-3: Introduce Shared Shell Contract

**Target Files**: `packages/marketing/src/shell/`, `packages/marketing/src/providers/`
**Related Files**: `apps/firm/src/components/`, `apps/prospective-clients/*/src/components/`
**Action**: Create `SiteShell` (header + main + footer) and `SiteProviders` (analytics, consent, monitoring) in `packages/marketing`. Accept `SiteConfig` as input.

#### [~] AP-001-4: Enable PPR and Introduce `"use cache"` Incrementally

**Target Files**: all site app `next.config.ts`, pages with `revalidate` config
**Related Files**: content-fetching functions (`apps/firm/src/content/services.ts`, `blog.ts`), blog/service pages
**Action**:

1. Add `cacheComponents: true` (top-level, not inside `experimental`) to each site app's `next.config.ts`. **Start with `apps/firm` only** — monitor build memory (known Vercel OOM risk with many static paths under cacheComponents).
2. **Critical nuance**: `"use cache"` and ISR are not yet fully compatible. `"use cache"` caches at the **data/component layer** (function results) but does NOT yet produce CDN-level full-route HTML caching like ISR does. The recommended migration strategy is:
   - **Keep ISR (`export const revalidate`)** for full-page CDN caching of marketing pages (route-level cache).
   - **Add `"use cache"`** incrementally for expensive **component-level** data fetching (blog posts, testimonials, service data) within Suspense boundaries.
   - Use `"use cache"` for content-fetching functions that are called from multiple pages.
   - Do NOT replace ISR with `"use cache"` wholesale — you lose the "serve stale HTML from edge, revalidate in background" behavior.
3. Content-fetching functions (`getAllServices()`, `getAllPosts()`, etc.) that are currently synchronous must become `async` to be compatible with `"use cache"`.
4. Add `cacheTag('blog', slug)` to blog data fetching and `cacheTag('services')` to service data fetching for on-demand invalidation.
5. Use `revalidateTag(tag, 'hours')` (two-arg form, single-arg is deprecated) for background revalidation and `updateTag(tag)` in Server Actions for immediate invalidation.
6. Wrap dynamic sections (booking availability, user session) in `<Suspense>` boundaries so they stream in while the static shell loads instantly from the CDN.
7. Roll out to demo apps and template only after firm is stable.

**Current status note**: The first slice is implemented and production-build validated in `apps/firm`. `cacheComponents` is enabled, the shared content helpers use async `"use cache"` + `cacheLife`/`cacheTag`, the firm marketing layout/public pages now opt into explicit route-level output caching with `"use cache"`, and the shared/public compatibility layer was tightened so stale app-local shell files no longer pull incorrect package boundaries into the build. Remaining rollout work is applying the same pattern to the remaining public apps and completing the final cleanup of compatibility files.

#### [~] AP-001-5: Add `server-only` / `client-only` Guards

**Target Files**: `packages/database/src/admin.ts`, `packages/analytics/src/server.ts`, `packages/marketing/src/seo/`
**Related Files**: any module that must not cross the server/client boundary
**Action**: Add `import 'server-only'` to modules that use secrets, database access, or server-only APIs. Add `import 'client-only'` to modules that use browser APIs.

---

## [ ] AP-002: Create Shared Brand Contract and Theme System

### Definition of Done

- [ ] `packages/brand` exists and exports the semantic theme contract as shared CSS.
- [ ] The contract uses `@theme inline` for override points and `@theme` for stable tokens.
- [ ] At least four theme presets exist (neutral, tech, luxury, editorial).
- [ ] Apps use `data-theme` attribute on `<html>` for tenant scoping.
- [ ] Shared UI and marketing packages style against semantic tokens, never tenant-specific values.
- [ ] Theme switching and per-client branding can change the full site look without rewriting components.
- [ ] OKLCH is enforced for all color definitions.
- [ ] `color-mix()` is used for dynamic hover/active/disabled state derivation.
- [ ] CSS `@layer` ordering is standardized across all site apps.
- [ ] Container query classes are available for component-level responsive design.

### Out of Scope

- Building a full design toolchain for external designers.
- Replacing existing Style Dictionary token source files.
- Supporting native mobile tokens in this task.
- Rewriting every UI component visual treatment from scratch.

### Strict Rules to Follow

- Use semantic tokens, not tenant-specific color names, in shared packages.
- Keep theme variables shareable through CSS imports.
- Preserve Tailwind v4 compatibility; use `@theme` and `@theme inline` correctly.
- Prefer package-owned theme contract plus app-level overrides over app-owned token systems.
- Do not force all tenants into a single visual style.
- Use OKLCH for all color values.
- Use `color-mix(in oklch, ...)` for derived states instead of defining every shade.

### Existing Code Patterns

```css
/* apps/firm/src/app/globals.css */
@import 'tailwindcss';
@import 'tw-animate-css';
@import '../../tokens/agency.css';

@source '../../../../packages/ui/src/**/*.{js,ts,jsx,tsx}';

/* apps/firm/tokens/agency.css */
@theme inline {
  --color-semantic-background-primary: oklch(0.15 0.02 198.41);
  --brand-primary: oklch(0.65 0.22 198.41);
  --font-primary: var(--font-sans), Inter, system-ui, sans-serif;
}
```

### Target Code Patterns

```css
/* packages/brand/src/theme/contract.css
   Uses @theme inline because values reference --site-* variables defined by presets.
   @theme inline prevents CSS variable resolution issues in nested DOM trees.
   Variable names follow shadcn/ui convention exactly. */
@theme inline {
  /* Colors (shadcn convention: --color-name for Tailwind, sourced from --site-name CSS var) */
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  /* Agency extensions beyond shadcn base */
  --color-brand: var(--brand);
  --color-brand-foreground: var(--brand-foreground);
  /* Typography */
  --font-sans: var(--site-font-sans);
  --font-heading: var(--site-font-heading);
  --font-mono: var(--site-font-mono);
  /* Radius */
  --radius-sm: var(--site-radius-sm);
  --radius-md: var(--site-radius-md);
  --radius-lg: var(--site-radius-lg);
}

/* packages/brand/src/theme/preset-tech.css
   Defines concrete OKLCH values for all shadcn + agency variables.
   Uses color-mix() for interactive state derivatives. */
:root,
[data-theme='preset-tech'] {
  --background: oklch(0.98 0.005 260);
  --foreground: oklch(0.15 0.02 260);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.15 0.02 260);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.15 0.02 260);
  --primary: oklch(0.59 0.24 255);
  --primary-foreground: oklch(0.99 0 0);
  --secondary: oklch(0.97 0 0);
  --secondary-foreground: oklch(0.205 0 0);
  --muted: oklch(0.97 0 0);
  --muted-foreground: oklch(0.556 0 0);
  --accent: oklch(0.97 0 0);
  --accent-foreground: oklch(0.205 0 0);
  --destructive: oklch(0.577 0.245 27.325);
  --destructive-foreground: oklch(0.985 0 0);
  --border: oklch(0.922 0 0);
  --input: oklch(0.922 0 0);
  --ring: oklch(0.59 0.24 255);
  --brand: oklch(0.59 0.24 255);
  --brand-foreground: oklch(0.99 0 0);
  --site-radius-sm: 0.375rem;
  --site-radius-md: 0.5rem;
  --site-radius-lg: 0.75rem;
  --site-font-sans: var(--font-inter), system-ui, sans-serif;
  --site-font-heading: var(--font-inter), system-ui, sans-serif;
  --site-font-mono: ui-monospace, monospace;
}

/* Dark mode variant for preset-tech */
[data-theme='preset-tech'][data-mode='dark'],
[data-theme='preset-tech'] .dark {
  --background: oklch(0.145 0.02 260);
  --foreground: oklch(0.985 0 0);
  --card: oklch(0.18 0.02 260);
  --card-foreground: oklch(0.985 0 0);
  --primary: oklch(0.65 0.24 255);
  --primary-foreground: oklch(0.12 0.02 260);
  --muted: oklch(0.22 0.02 260);
  --muted-foreground: oklch(0.65 0 0);
  --border: oklch(0.3 0.02 260);
  --input: oklch(0.3 0.02 260);
  --ring: oklch(0.65 0.24 255);
}

/* apps/client-acme-site/src/theme/client-theme.css
   Client overrides only the variables that differ from the preset.
   color-mix() derives interactive states from the primary color. */
[data-theme='client-acme'] {
  --primary: oklch(0.62 0.19 145);
  --primary-foreground: oklch(0.99 0 0);
  --brand: oklch(0.62 0.19 145);
  --ring: oklch(0.62 0.19 145);
  --site-font-heading: var(--font-serif), Georgia, serif;
  --site-radius-md: 0.75rem;
}

/* apps/client-acme-site/src/app/globals.css
   Tailwind v4 automatically creates 4 layers: theme, base, components, utilities.
   Do NOT manually declare @layer — Tailwind handles it.
   @custom-variant for class-based dark mode. */
@import 'tailwindcss';
@import 'tw-animate-css';
@import '@agency/brand/theme/contract.css';
@import '@agency/brand/theme/preset-neutral.css';
@import '../../theme/client-theme.css';

@source '../../packages/ui/src/**/*.{js,ts,jsx,tsx}';
@source '../../packages/marketing/src/**/*.{js,ts,jsx,tsx}';

@custom-variant dark (&:where(.dark, .dark *));
```

### Anti-Patterns

- Importing tenant token files directly into every app forever.
- Hardcoding brand colors into shared components.
- Treating Tailwind theme variables and semantic CSS variables as unrelated systems.
- Making typography and spacing impossible to override per tenant.
- Forcing one preset to serve every brand category.
- Defining every hover/active/disabled shade manually instead of using `color-mix()`.
- Using HSL instead of OKLCH for new color definitions.

### Subtasks

#### [ ] AP-002-1: Create `packages/brand`

**Target Files**: `packages/brand/package.json`, `packages/brand/tsconfig.json`, `packages/brand/src/`
**Related Files**: `pnpm-workspace.yaml`, root `tsconfig.json`

#### [ ] AP-002-2: Define Semantic Theme Contract (shadcn-Aligned) with SD Bridge

**Target Files**: `packages/brand/src/theme/contract.css`, `packages/design-tokens/sd.config.ts`
**Related Files**: `packages/ui/src/**/*.tsx`, future `packages/marketing/src/**/*.tsx`, `packages/design-tokens/scripts/build-clients.ts`
**Action**:

1. Define the full semantic variable surface using `@theme inline` (because values reference other variables). Variable names **must** follow shadcn/ui convention: `--background`/`--foreground`, `--card`/`--card-foreground`, `--popover`/`--popover-foreground`, `--primary`/`--primary-foreground`, `--secondary`/`--secondary-foreground`, `--muted`/`--muted-foreground`, `--accent`/`--accent-foreground`, `--destructive`/`--destructive-foreground`, `--border`, `--input`, `--ring`, `--radius`, `--chart-1` through `--chart-5`. Add agency extensions: `--brand`/`--brand-foreground`, `--site-font-sans`, `--site-font-heading`, `--site-font-mono`, `--site-radius-sm/md/lg`. This unifies the currently fragmented naming between UI primitives (shadcn convention) and organisms (custom convention).
2. **Build the Style Dictionary → shadcn bridge** (no existing plugin exists): Add a custom SD v4 `name/shadcn` transform that strips the DTCG hierarchy prefix and outputs flat shadcn variable names. Add a custom `css/shadcn-theme` format that generates both a `:root` block with concrete OKLCH values and a `@theme inline` block mapping to Tailwind's `--color-*` namespace.
3. Structure DTCG token source JSON with a `shadcn` group mapping to the exact shadcn variable names. Each client's token JSON should override these values per brand.
4. Update `build-clients.ts` to use the new SD bridge — it already outputs `@theme inline` CSS, but needs to emit shadcn-compatible variable names instead of the current custom naming scheme.
5. Generate separate `:root` and `.dark` selectors from separate light/dark token source files per client.

#### [ ] AP-002-3: Build Theme Presets with `color-mix()` Derivatives

**Target Files**: `packages/brand/src/theme/preset-neutral.css`, `preset-tech.css`, `preset-luxury.css`, `preset-editorial.css`
**Related Files**: `packages/design-tokens/tokens/clients/*.json`
**Action**: Each preset defines `:root` values for all `--site-*` variables using OKLCH. Derive hover/active/disabled states via `color-mix()`. Include dark mode variants using `[data-mode="dark"]` or `@media (prefers-color-scheme: dark)`.

#### [ ] AP-002-4: Implement `data-theme` Attribute System

**Target Files**: each site app root layout, `packages/marketing/src/shell/`
**Related Files**: `packages/brand/src/theme/contract.css`
**Action**: Set `data-theme={siteConfig.slug}` on `<html>`. Add synchronous inline script in `<head>` to read stored theme preference and set `data-theme` before CSS parses to prevent FOUC.

#### [ ] AP-002-5: Standardize CSS Import Order

**Target Files**: each site app `src/app/globals.css`
**Related Files**: `packages/brand/src/theme/contract.css`, `packages/ui/src/styles/globals.css`
**Action**: Tailwind v4 automatically creates 4 native CSS layers (`theme`, `base`, `components`, `utilities`) when `@import "tailwindcss"` is used — do NOT manually declare `@layer`. Standardize import order: `tailwindcss` -> `tw-animate-css` -> brand contract -> preset -> client override -> `@source` directives -> `@custom-variant dark`. Add `@source` for both `packages/ui` and `packages/marketing`. Remove redundant or incorrect `@layer` declarations from existing files. Custom utilities that need variant support must use `@utility` directive (not `@layer utilities`).

#### [ ] AP-002-6: Expose Brand Metadata to TypeScript

**Target Files**: `packages/brand/src/themes.ts`, `packages/brand/src/tokens.ts`
**Related Files**: scaffold/template logic
**Action**: Export preset names, metadata, and token type definitions so the scaffold script and app config can reference them with type safety.

---

## [ ] AP-003: Build Config-Driven Marketing Renderer

### Definition of Done

- [ ] `packages/marketing` exists and owns shared site shell rendering.
- [ ] Multi-variant blocks exist for hero (centered, split, minimal), features (grid, icon-list), CTA (banner, inline), FAQ (accordion), testimonials, pricing, service grid, and forms.
- [ ] A Zod-validated page schema and typed block registry exist using discriminated unions.
- [ ] `RenderPage` component renders pages from configuration with per-block Suspense boundaries.
- [ ] At least one site app renders from configuration instead of manual page JSX.
- [ ] Shared SEO helpers generate metadata and JSON-LD (Organization, LocalBusiness, Service, FAQPage) from typed config.
- [ ] Nav and footer support multi-variant layouts.
- [ ] All marketing blocks use container queries for component-level responsive design.

### Out of Scope

- Creating a full visual page builder UI.
- WYSIWYG editing.
- CMS integration (but block schema should be CMS-compatible).
- Personalization logic.
- A/B testing infrastructure beyond block schema readiness.

### Strict Rules to Follow

- Keep rendering blocks generic and reusable across industries.
- Separate block schema, rendering registry, and block implementation.
- Keep block props serializable where they cross server/client boundaries.
- Use Zod discriminated unions for runtime validation of block data.
- Use `next/dynamic` for code-splitting blocks in the registry.
- Wrap each block in a `<Suspense>` boundary when using PPR.
- Keep forms and analytics hooks isolated to specific interactive blocks.
- Do not duplicate block implementations in apps once package versions exist.
- Use container queries (`@container`), not viewport queries, for block-internal responsive behavior.

### Existing Code Patterns

```tsx
// apps/prospective-clients/riley-day-care/src/app/page.tsx
;<section className="grid gap-6 md:grid-cols-2">
  <Card>
    <CardHeader>
      <CardTitle className="text-brand-primary">Programs</CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-text-secondary">Age-appropriate programs for infants through pre-K</p>
      <Button asChild>
        <Link href="/programs">Learn More</Link>
      </Button>
    </CardContent>
  </Card>
</section>

// packages/ui/src/components/organisms/hero-section.tsx -- single variant
export interface HeroSectionProps {
  headline?: React.ReactNode
  subheadline?: React.ReactNode
  primaryAction?: React.ReactNode
  secondaryAction?: React.ReactNode
}
```

### Target Code Patterns

```tsx
// packages/marketing/src/page/types.ts -- Zod discriminated unions
import { z } from 'zod'

const LinkActionSchema = z.object({ label: z.string(), href: z.string() })

const HeroBlockSchema = z.object({
  type: z.literal('hero'),
  variant: z.enum(['centered', 'split', 'minimal', 'video']),
  headline: z.string(),
  subheadline: z.string().optional(),
  ctaPrimary: LinkActionSchema.optional(),
  ctaSecondary: LinkActionSchema.optional(),
  backgroundImage: z.string().optional(),
})

const FeatureBlockSchema = z.object({
  type: z.literal('features'),
  variant: z.enum(['grid', 'icon-list', 'alternating', 'bento']),
  heading: z.string().optional(),
  items: z.array(
    z.object({
      title: z.string(),
      description: z.string(),
      icon: z.string().optional(),
      href: z.string().optional(),
    })
  ),
})

const CTABlockSchema = z.object({
  type: z.literal('cta'),
  variant: z.enum(['banner', 'inline', 'split', 'floating']),
  headline: z.string(),
  body: z.string().optional(),
  ctaPrimary: LinkActionSchema.optional(),
})

export const BlockSchema = z.discriminatedUnion('type', [
  HeroBlockSchema,
  FeatureBlockSchema,
  CTABlockSchema,
  // ... more block schemas
])

export type PageBlock = z.infer<typeof BlockSchema>

export const PageDefinitionSchema = z.object({
  slug: z.string(),
  metadata: z.object({ title: z.string(), description: z.string() }),
  blocks: z.array(BlockSchema),
})

export type SitePageDefinition = z.infer<typeof PageDefinitionSchema>

// packages/marketing/src/page/render-page.tsx
import { Suspense } from 'react'
import { blockRegistry } from './block-registry'
import type { SitePageDefinition } from './types'

export async function RenderPage({ page }: { page: SitePageDefinition }) {
  // async because "use cache" requires it at the page level
  return (
    <>
      {page.blocks.map((block, index) => {
        const BlockComponent = blockRegistry[block.type]
        return BlockComponent ? (
          <Suspense key={`${block.type}-${index}`} fallback={null}>
            <BlockComponent {...block} />
          </Suspense>
        ) : null
      })}
    </>
  )
}

// packages/marketing/src/seo/jsonld.ts
import type { SiteConfig } from '../types'

export function buildOrganizationJsonLd(config: SiteConfig) {
  /* ... */
}
export function buildLocalBusinessJsonLd(config: SiteConfig) {
  /* ... */
}
export function buildServiceJsonLd(service: ServiceData) {
  /* ... */
}
export function buildFAQPageJsonLd(items: FAQItem[]) {
  /* ... */
}
```

### Anti-Patterns

- Rewriting the same card grid, CTA, or nav logic in each tenant app.
- Building single-variant blocks that force every client into the same layout.
- Making block definitions so generic they lose design control.
- Embedding tenant text directly inside shared block implementations.
- Mixing block schema types into app route files.
- Putting SEO generation logic in every page component.
- Using viewport queries inside reusable block components.

### Subtasks

#### [ ] AP-003-1: Create `packages/marketing`

**Target Files**: `packages/marketing/package.json`, `packages/marketing/tsconfig.json`, `packages/marketing/src/`
**Related Files**: `pnpm-workspace.yaml`, root `tsconfig.json`

#### [ ] AP-003-2: Implement Multi-Variant Marketing Blocks

**Target Files**: `packages/marketing/src/blocks/hero/` (centered, split, minimal), `features/` (grid, icon-list, alternating), `cta/` (banner, inline, split), `faq/` (accordion), `social-proof/` (testimonials, logo-strip), `services/` (grid, list), `pricing/` (table, cards)
**Related Files**: existing organisms in `packages/ui/src/components/organisms/`
**Action**: Each block category gets multiple variant implementations. All variants use container queries for responsive behavior. Each variant is a Server Component unless it needs interactivity.

#### [ ] AP-003-3: Implement Zod Page Schema and Block Registry

**Target Files**: `packages/marketing/src/page/types.ts`, `block-registry.ts`, `render-page.tsx`
**Related Files**: `packages/content/src/content-system.ts`
**Action**: Define `BlockSchema` as Zod discriminated union. Build `blockRegistry` mapping block types to components. Build `RenderPage` with per-block Suspense boundaries.

#### [ ] AP-003-4: Implement SEO Helpers

**Target Files**: `packages/marketing/src/seo/metadata.ts`, `jsonld.ts`
**Related Files**: `apps/firm/src/app/layout.tsx`, app metadata files
**Action**: Build `generateSiteMetadata`, `buildOrganizationJsonLd`, `buildLocalBusinessJsonLd`, `buildServiceJsonLd`, `buildFAQPageJsonLd`. Accept typed site config and page config as inputs.

#### [ ] AP-003-5: Move Shared Nav/Footer Into Package with Variants

**Target Files**: `packages/marketing/src/blocks/nav/site-header.tsx`, `mobile-nav.tsx`, `packages/marketing/src/blocks/footer/site-footer.tsx`
**Related Files**: `apps/firm/src/components/site-header.tsx`, `site-footer.tsx`, demo app equivalents
**Action**: Create nav variants (centered, left-aligned, mega-menu) and footer variants (simple, multi-column, minimal). Accept `SiteConfig` with nav items, social links, and contact info.

#### [ ] AP-003-6: Add Shared Contact Form Block

**Target Files**: `packages/marketing/src/blocks/forms/contact-form.tsx`
**Related Files**: `packages/email/src/index.ts`, `apps/firm/src/components/contact/contact-form.tsx`
**Action**: Extract and generalize the firm's contact form. Use Zod validation, honeypot, `useActionState`. Accept form config (fields, action endpoint, success message) as props.

#### [ ] AP-003-7: Add MDX Rendering for Blog Content

**Target Files**: `packages/marketing/src/blocks/blog/`, `apps/firm/src/app/blog/[slug]/page.tsx`
**Related Files**: `packages/content/src/content-system.ts`, blog content files
**Action**:

1. Add `next-mdx-remote` (v6+) as a dependency of `packages/marketing`.
2. Create a `BlogContent` server component that uses `compileMDX()` with custom `mdxComponents` (headings, code blocks, callouts, images) and rehype/remark plugins (`rehype-pretty-code` with Shiki 3, `remark-gfm`, `rehype-slug`).
3. Add `rehype-pretty-code` for VS Code-grade syntax highlighting (theme: `github-dark-default`, `keepBackground: false`).
4. Validate blog content against `packages/content`'s `BlogPostSchema` before rendering.
5. Update firm's `blog/[slug]/page.tsx` to use the new `BlogContent` component instead of `whitespace-pre-wrap` raw text rendering.
6. Wire `generateSEOMetadata` from `packages/content` into blog page metadata generation.

#### [ ] AP-003-8: Wire `packages/content` to Apps

**Target Files**: `apps/firm/src/content/`, `packages/marketing/src/page/`
**Related Files**: `packages/content/src/content-system.ts`
**Action**: Migrate app-local content modules to import schemas from `packages/content`. Use `ContentRepository` interface for content access. Use `validateContent`/`validateContentArray` for build-time validation. Use `generateSEOMetadata`, `calculateReadingTime`, `generateSlug` utilities instead of app-local duplicates. Add a build-time content validation script to `turbo.json` tasks.

#### [ ] AP-003-9: Add Storybook Coverage for Marketing Blocks

**Target Files**: `packages/marketing/src/**/*.stories.tsx`, `.storybook/`
**Related Files**: `packages/ui` Storybook setup
**Action**: Each block variant gets a Storybook story. Configure `packages/marketing` Storybook or extend `packages/ui` Storybook to include marketing blocks.

---

## [ ] AP-004: Convert Client Apps and Template Into Thin Configuration Shells

### Definition of Done

- [ ] `apps/__template__` generates a config-first site shell instead of a hardcoded site.
- [ ] The firm app becomes the first migrated reference implementation.
- [ ] Demo client apps consume shared shell and blocks from packages.
- [ ] Each client app owns only routing, metadata, config, content, theme override, and one-off bespoke code.
- [ ] New client scaffolding produces a working site without manually authoring page shell JSX.
- [ ] All site apps use route groups: `(marketing)/` for public pages, `(legal)/` for privacy and terms.
- [ ] All page route files are thin: import content, call shared renderer or compose shared blocks.
- [ ] Each app's `next.config.ts` has `cacheComponents: true` and `transpilePackages` for all agency packages.

### Out of Scope

- Moving agency-admin into the same shell pattern.
- Converting every existing route to a block-driven format in one pass.
- Multi-language routing.
- CMS-backed content.
- Dashboard product experiences like booking or analytics.

### Strict Rules to Follow

- Keep app route files extremely thin.
- Preserve real app-level metadata ownership.
- Preserve route-specific one-off components only when they are truly tenant-specific.
- Use typed app config and content modules instead of inline data in pages.
- Maintain existing ports, package names, and tenant separation.
- Use `(marketing)/` and `(legal)/` route groups for organizational clarity.
- Use `_components/` private folders for app-specific one-offs.

### Existing Code Patterns

```tsx
// apps/__template__/src/app/page.tsx
export default function HomePage() {
  return (
    <main>
      <header>
        <h1>Welcome to TEMPLATE_NAME</h1>
      </header>
      <section className="grid gap-6 md:grid-cols-2">
        <Card>{/* hardcoded service teaser */}</Card>
        <Card>{/* hardcoded contact teaser */}</Card>
      </section>
    </main>
  )
}

// apps/firm/src/content/services.ts
export const services = [
  { slug: 'digital-strategy', title: 'Digital Strategy', pricing: { startingAt: '$5,000' } },
]
```

### Target Code Patterns

```tsx
// apps/client-acme-site/src/app/(marketing)/page.tsx
import { RenderPage } from '@agency/marketing/page'
import { homePage } from '../../content/pages/home'

export default function HomePage() {
  return <RenderPage page={homePage} />
}

// apps/client-acme-site/src/config/site.ts
import type { SiteConfig } from '@agency/marketing/types'

export const siteConfig = {
  slug: 'client-acme-site',
  name: 'Acme Dental',
  url: 'https://acme.example',
  themePreset: 'editorial',
  nav: [
    { href: '/', label: 'Home' },
    { href: '/services', label: 'Services' },
    { href: '/about', label: 'About' },
    { href: '/contact', label: 'Contact' },
  ],
  footer: {
    variant: 'multi-column',
    sections: [
      /* ... */
    ],
  },
  contact: {
    email: 'hello@acme.example',
    phone: '(555) 123-4567',
    address: '123 Main St, Dallas, TX',
  },
} as const satisfies SiteConfig

// apps/client-acme-site/src/content/pages/home.ts
import type { SitePageDefinition } from '@agency/marketing/page'

export const homePage: SitePageDefinition = {
  slug: 'home',
  metadata: { title: 'Acme Dental - Family Dentistry', description: '...' },
  blocks: [
    {
      type: 'hero',
      variant: 'split',
      headline: 'Healthy Smiles Start Here',
      subheadline: '...',
      ctaPrimary: { label: 'Book Now', href: '/contact' },
    },
    {
      type: 'features',
      variant: 'grid',
      items: [
        /* ... */
      ],
    },
    {
      type: 'cta',
      variant: 'banner',
      headline: 'Ready to Schedule?',
      ctaPrimary: { label: 'Contact Us', href: '/contact' },
    },
  ],
}
```

### Anti-Patterns

- Treating the template app as a one-off demo instead of a productized scaffold.
- Keeping content inline inside route files.
- Building new client sites by copying and editing JSX blocks manually.
- Letting each client app define its own shell conventions.
- Using the app folder as the primary UI development surface.

### Subtasks

#### [ ] AP-004-1: Add App Config Layer

**Target Files**: `apps/firm/src/config/site.ts`, `navigation.ts`, `social.ts`; equivalent in demo apps and template
**Related Files**: app layouts and marketing routes

#### [ ] AP-004-2: Add App Content Layer

**Target Files**: `apps/firm/src/content/pages/home.ts`, `about.ts`, `services.ts`, `contact.ts`; equivalent in demo apps and template
**Related Files**: `packages/marketing/src/page/types.ts`
**Action**: Convert existing inline page content to typed `SitePageDefinition` objects.

#### [ ] AP-004-3: Restructure Routes with Route Groups

**Target Files**: each site app `src/app/` directory
**Related Files**: page route files
**Action**: Move marketing pages into `(marketing)/` route group. Add `(legal)/` route group with `privacy/page.tsx` and `terms/page.tsx`.

#### [ ] AP-004-4: Reduce App Root Layouts to Thin Adapters

**Target Files**: each site app `src/app/layout.tsx`
**Related Files**: `packages/marketing/src/shell/`, `packages/marketing/src/providers/`
**Action**: Replace local Providers/SiteHeader/SiteFooter with `SiteProviders` and `SiteShell` from `@agency/marketing`. Set `data-theme` on `<html>`.

#### [ ] AP-004-5: Migrate Home Pages to Config-Driven Rendering

**Target Files**: each site app home page route
**Related Files**: `packages/marketing/src/page/render-page.tsx`
**Action**: Replace manual JSX with `<RenderPage page={homePage} />` using typed content.

#### [ ] AP-004-6: Update `apps/__template__`

**Target Files**: `apps/__template__/src/`, `apps/__template__/AGENTS.md`
**Related Files**: `scripts/scaffold-client.ts`
**Action**: Rewrite template to use shared shell, route groups, config layer, content layer, and thin theme override. Template should produce a working site that renders from config.

#### [ ] AP-004-7: Update Client Scaffold Workflow

**Target Files**: `scripts/scaffold-client.ts`
**Related Files**: `apps/__template__/`
**Action**: Update scaffold script to generate config files, content files, theme override, and metadata files. Prompt for client name, slug, port, and theme preset.

---

## [ ] AP-005: Close Production UX, Metadata, and Runtime Gaps

### Definition of Done

- [ ] Public site apps include legal pages (privacy, terms) and complete metadata coverage (manifest, app icons, twitter-image, full OG images).
- [ ] Request interception files use `proxy.ts` naming per Next.js 16.
- [ ] The environment and runtime posture are documented and standardized.
- [ ] Database migration numbering is consistent and test state is reconciled.
- [ ] Critical untested rendering-adjacent packages have baseline coverage.
- [ ] JSON-LD includes Service and FAQPage schemas, not just Organization and LocalBusiness.
- [ ] `fetchPriority="high"` is set on LCP hero images.
- [ ] No `loading="lazy"` on above-the-fold images.

### Out of Scope

- Replatforming hosting.
- Replacing Supabase.
- Full CMS adoption.
- Mobile app work.
- Platform API extraction.

### Strict Rules to Follow

- Only create `proxy.ts` where request interception is already needed.
- Keep legal and metadata additions aligned with real app purposes.
- Treat Node 24 as preferred, but validate compatibility before switching.
- Keep database/RLS corrections synchronized with tests.
- Prefer focused single-file validation over repo-wide brute-force changes.
- Use `fetchPriority="high"` on exactly one image per page -- the LCP candidate.
- Sanitize JSON-LD strings by replacing `<` with `\u003c` to prevent XSS.

### Subtasks

#### [ ] AP-005-1: Add Legal Pages to Public Sites

**Target Files**: each public site app `src/app/(legal)/privacy/page.tsx`, `terms/page.tsx`
**Related Files**: `packages/marketing` (legal page renderer or block)

#### [ ] AP-005-2: Complete App Metadata Files

**Target Files**: `manifest.ts`, app icons (`icon.tsx`, `apple-icon.tsx`), `twitter-image.tsx`, missing OG files
**Related Files**: each site app `src/app/`

#### [ ] AP-005-3: Rename App `middleware.ts` to `proxy.ts`

**Target Files**: `apps/firm/src/middleware.ts`, `apps/agency-admin/src/middleware.ts`, `apps/prospective-clients/*/src/middleware.ts`, `apps/__template__/src/middleware.ts`
**Related Files**: Next.js build config, CI checks, tests
**Action**:

1. Rename `middleware.ts` to `proxy.ts` in each app that has one.
2. Rename `export function middleware()` to `export function proxy()`.
3. Note: runtime default is now Node.js (was Edge). This is a benefit for the firm's CSP middleware which uses `Buffer.from()` and `crypto.randomUUID()` — both available natively in Node.js runtime.
4. Verify no response bodies are returned (only redirect, rewrite, header modification). Current firm middleware only modifies headers — compliant.
5. Update any CI grep patterns that reference `middleware.ts`.
6. Automated codemod available: `npx @next/codemod@canary middleware-to-proxy .`.

#### [ ] AP-005-4: Expand JSON-LD Coverage

**Target Files**: site app layouts and service pages
**Related Files**: `packages/marketing/src/seo/jsonld.ts`
**Action**: Add Service schema per service page. Add FAQPage schema where FAQ blocks are used. Add AggregateRating when reviews are available. Use consistent `@id` references across layered schemas.

#### [ ] AP-005-5: Optimize LCP and Image Loading

**Target Files**: hero sections, above-the-fold image elements
**Related Files**: `packages/marketing/src/blocks/hero/`
**Action**: Add `fetchPriority="high"` to the LCP hero image. Remove any `loading="lazy"` from above-the-fold images. Add `sizes` prop to responsive images.

#### [ ] AP-005-6: Reconcile Database Migration/Test State

**Target Files**: `supabase/migrations/`, `supabase/tests/`
**Related Files**: package database types and scripts
**Action**:

1. **Fix duplicated `020_` prefix**: Rename `020_web_vitals_metrics.sql` to `021_web_vitals_metrics.sql` (or another unique number). If already applied remotely, use `supabase migration repair <old> --status reverted && supabase migration repair <new> --status applied`.
2. **Fix `00-rls-coverage.sql`**: Replace hardcoded `SELECT plan(7)` and table name assertions with `tests.rls_enabled('public')` from `basejump-supabase_test_helpers` which dynamically checks ALL public tables.
3. **Fix dead `platform_admin` policies** (AP-007-17): This is the highest-priority database fix. Create a new migration replacing `tenant_users.role = 'platform_admin'` checks in `0132_storage_security.sql` and `020_web_vitals_metrics.sql` with the correct `raw_user_meta_data->>'is_platform_admin' = 'true'` pattern used elsewhere. Long-term: evaluate Auth Hook + `user_roles` table pattern.
4. **Audit `supabase/config.toml`**: PostgreSQL 17 is confirmed. Verify OrioleDB/S3 experimental settings are commented out for production.
5. Consider using `supabase migration squash` to consolidate the 22 migration files if the numbering becomes unmanageable (note: squash omits DML — re-add inserts for cron jobs, storage buckets, vault secrets manually).

#### [ ] AP-005-7: Add Tests for Weakly Covered Packages

**Target Files**: `packages/cost`, `packages/ai-automation`, `packages/ai-content-ops`, `packages/content`, `packages/error-handling`
**Related Files**: package vitest configs

#### [ ] AP-005-8: Standardize Runtime and Env Posture

**Target Files**: `.nvmrc`, root workflow files, future `packages/env`
**Related Files**: `.env.local.example`, package/app env usage
**Action**: Evaluate Node 24 (Active LTS) vs current Node 22. Create `packages/env` with Zod-validated `client.ts`, `server.ts`, `core.ts` for type-safe env access.

#### [ ] AP-005-9: Add Missing Root Quality Files

**Target Files**: `.gitattributes`, `.env.example`, `.cursorignore`, `.codeiumignore`
**Related Files**: root config and AI tooling directories

---

## [ ] AP-006: Advanced Design Capabilities

### Definition of Done

- [ ] Container queries are used in all reusable UI and marketing block components for component-level responsive design.
- [ ] An animation system is established using `tw-animate-css` for utility animations and optionally Motion (Framer Motion v12) for complex orchestration.
- [ ] View Transitions are integrated for page navigation animations.
- [ ] CSS Subgrid is used for aligned card/grid layouts.
- [ ] `@starting-style` is used for entry animations on dialogs, popovers, and sheet components.
- [ ] CSS Anchor Positioning replaces JavaScript positioning where applicable.
- [ ] Reduced motion preferences are respected in both CSS and JavaScript across all animation patterns.
- [ ] Block variants provide genuine design diversity: each block category has at least 3 visually distinct variants.
- [ ] Component compound patterns (CVA `compoundVariants`, Radix `asChild`) are documented and consistently applied.

### Out of Scope

- Building a visual animation editor.
- Full motion design system with spring physics for every component.
- Native mobile animations.
- WebGL or Canvas-based effects.

### Strict Rules to Follow

- Use container queries (`@container` class on parent, `@sm:` through `@7xl:` variants on children) for all component-internal responsive behavior. Note: container query sizes differ from viewport sizes (`@sm:` = 24rem/384px for containers vs `sm:` = 40rem/640px for viewport). Reserve viewport queries for page-level layout only.
- Use `tw-animate-css` classes for standard enter/exit animations. Only add Motion when orchestration, spring physics, or exit animations with `AnimatePresence` are needed.
- Always respect `prefers-reduced-motion: reduce` in CSS and via `useReducedMotion()` in JavaScript.
- Keep animations short: 150-250ms for small UI transitions.
- Never autoplay animations or use infinite loops without user controls.
- Use `template.tsx` (not `layout.tsx`) for View Transition wrappers since layouts persist across navigations.
- Use WCAG 2.2 minimum target size (24x24 CSS pixels) for all interactive elements.
- Use Tailwind v4 built-in utilities and variants — not raw CSS — for container queries, subgrid, and `@starting-style`.

### Target Code Patterns

```tsx
// Container query responsive component using Tailwind v4 built-in syntax
// Parent: @container class. Children: @sm:, @md:, @lg: variants.
// Named container: @container/feature. Children: @sm/feature:
function FeatureCard({ title, description, icon }: FeatureCardProps) {
  return (
    <div className="@container/feature">
      <div className="flex flex-col @md/feature:flex-row @md/feature:gap-4">
        {icon && <div className="text-primary @lg/feature:text-2xl">{icon}</div>}
        <div>
          <h3 className="text-base font-semibold @md/feature:text-lg">{title}</h3>
          <p className="text-muted-foreground text-sm @md/feature:text-base">{description}</p>
        </div>
      </div>
    </div>
  )
}

// Subgrid for aligned card layouts using Tailwind v4 built-in utilities
// grid-rows-subgrid / grid-cols-subgrid are first-class utilities (no plugin needed)
function CardGrid({ items }: { items: CardItem[] }) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <div key={item.id} className="row-span-3 grid grid-rows-subgrid">
          <CardHeader>{item.title}</CardHeader>
          <CardContent>{item.description}</CardContent>
          <CardFooter>{item.action}</CardFooter>
        </div>
      ))}
    </div>
  )
}
```

```tsx
// @starting-style for dialog/popover entry using Tailwind v4's starting: variant
// The starting: variant maps to @starting-style in CSS. Stackable with open: variant.
// transition-discrete enables animating display property.
<div
  popover
  id="my-popover"
  className="opacity-100 scale-100 transition-all duration-200
             starting:open:opacity-0 starting:open:scale-95
             transition-discrete"
>
  {/* popover content */}
</div>

// Dialog with starting: variant for entry animation
<DialogContent className="opacity-100 scale-100 transition-all duration-200
                          starting:opacity-0 starting:scale-95">
  {/* dialog content */}
</DialogContent>
```

```css
/* Reduced motion — already present in all app globals.css files */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

```tsx
// View Transitions in template.tsx
// Native Next.js 16 support is EXPERIMENTAL (not production-recommended).
// Use next-view-transitions package for production.
import { ViewTransitions } from 'next-view-transitions'

export default function Template({ children }: { children: React.ReactNode }) {
  return <ViewTransitions>{children}</ViewTransitions>
}
```

### Subtasks

#### [ ] AP-006-1: Add Container Queries to UI Components

**Target Files**: `packages/ui/src/components/`, `packages/marketing/src/blocks/`
**Action**: Add `@container` class (or `@container/name` for named containers) to reusable component wrappers. Replace `md:`, `lg:`, `sm:` viewport variants with `@sm:`, `@md:`, `@lg:` container variants for internal layout changes. Note: container query sizes are different from viewport — `@sm` = 24rem (384px) not 40rem (640px). Use `@max-sm:` for max-width queries, `@min-[475px]:` for arbitrary values. Card already uses `@container/card-header` — extend this pattern to all reusable components. Custom container sizes can be added: `@theme { --container-card: 20rem; }`.

#### [ ] AP-006-2: Implement CSS Subgrid for Card Layouts

**Target Files**: `packages/marketing/src/blocks/features/`, `services/`, `pricing/`
**Action**: Use Tailwind v4's built-in `grid-rows-subgrid` utility (first-class, no plugin) on card children within grid parents. Pattern: parent grid defines rows, child cards use `grid-rows-subgrid` with `row-span-3` (header, body, footer) so content aligns across rows regardless of content length. Also consider `grid-cols-subgrid` for horizontal alignment patterns.

#### [ ] AP-006-3: Add Entry Animations with `starting:` Variant

**Target Files**: `packages/ui/src/components/molecules/dialog.tsx`, `sheet.tsx`, popover components
**Action**: Use Tailwind v4's built-in `starting:` variant (maps to `@starting-style`) for CSS-only entry animations. Stack with `open:` variant for popovers: `starting:open:opacity-0 starting:open:scale-95`. Add `transition-discrete` class for animating `display` property. Respect reduced motion — the existing `@media (prefers-reduced-motion: reduce)` block in globals.css will handle this. Replace Dialog/Sheet overlay hardcoded `bg-black/50` with `bg-foreground/50` (semantic).

#### [ ] AP-006-4: Integrate View Transitions

**Target Files**: site app `template.tsx` files
**Related Files**: `packages/marketing/src/shell/`
**Action**: Add `next-view-transitions` package (production-ready). Do NOT use Next.js 16's native `experimental: { viewTransition: true }` — it is explicitly marked "not recommended for production" in the docs. Create `template.tsx` in site apps wrapping children with `<ViewTransitions>`. Style with `::view-transition-old(root)` and `::view-transition-new(root)`. Use `useTransitionRouter()` hook for programmatic navigation transitions.

#### [ ] AP-006-5: Establish Animation Conventions

**Target Files**: `packages/brand/src/theme/`, `packages/ui/`, `packages/marketing/`
**Action**: Document which animations use `tw-animate-css` classes (accordion, fade, slide) vs Motion (complex orchestration, exit animations, layout animations). Add `prefers-reduced-motion` media query to brand contract CSS.

#### [ ] AP-006-6: Expand Block Variant Library

**Target Files**: `packages/marketing/src/blocks/`
**Action**: Each block category should have at least 3 visually distinct variants. Hero: centered, split, minimal, video-background. Features: grid, icon-list, alternating, bento. CTA: banner, inline, split, floating. Footer: simple, multi-column, minimal, mega. Nav: centered, left-aligned, transparent, mega-menu.

#### [ ] AP-006-7: WCAG 2.2 Target Size and Focus Audit

**Target Files**: all interactive components in `packages/ui/` and `packages/marketing/`
**Action**: Ensure all clickable/tappable elements meet 24x24 CSS pixel minimum. Verify visible focus indicators with minimum 2px solid outline. Test with `prefers-contrast: more` and `forced-colors: active`.

---

## [ ] AP-007: Fix Known Codebase Bugs

### Definition of Done

- [ ] All 22+ confirmed bugs (security/RLS, runtime errors, data bugs, structural inconsistencies, package issues, CI/CD) are resolved.
- [ ] No new bugs are introduced by the fixes.
- [ ] Fixes are verified with existing test suites or new targeted tests.
- [ ] Token build pipeline runs successfully and produces output in `dist/`.
- [ ] Storybook can start without errors.
- [ ] `supabase test db` passes (RLS coverage dynamic, platform_admin policies fixed).
- [ ] All package entry points resolve correctly (no dual-entry conflicts).

### Subtasks

#### Security/RLS Fixes (Priority: Critical — Wave 0)

#### [ ] AP-007-17: **CRITICAL** — Fix Dead `platform_admin` RLS Policies

_(Defined below in Database and RLS section)_

#### [ ] AP-007-18: Fix Outdated RLS Test Table Count Assertion

_(Defined below in Database and RLS section)_

#### Runtime Error Fixes (Priority: Immediate — Wave 1)

#### [ ] AP-007-1: Add `@agency/monitoring` to Firm Package Dependencies

**Target Files**: `apps/firm/package.json`
**Action**: Add `"@agency/monitoring": "workspace:*"` to dependencies. Run `pnpm install` from root to update lockfile.

#### [ ] AP-007-2: Fix Admin AI Content Import

**Target Files**: `apps/agency-admin/src/app/ai-content/page.tsx`, `apps/agency-admin/src/lib/auth.ts`
**Action**: Either export `getServerSession` from `apps/agency-admin/src/lib/auth.ts`, or update the import in `ai-content/page.tsx` to use `verifySession` which does exist.

#### [ ] AP-007-3: Fix Empty `dist/` Directory and Token Build

**Target Files**: `packages/design-tokens/dist/`, `packages/ui/.storybook/preview.css`
**Action**: Run the token build to populate `dist/` with `primitives.css`, `semantic.css`, and `component.css`. Verify Storybook can import these files. Either add `dist/` to `.gitignore` and ensure the build runs as part of CI/Storybook setup, or commit the generated files. Add a `postinstall` or `prepare` script to ensure tokens are built when the project is freshly cloned.

#### Data Bug Fixes

#### [ ] AP-007-4: Fix Blog OG Image Slug Mismatch

**Target Files**: `apps/firm/src/app/blog/[slug]/opengraph-image.tsx`
**Action**: Update hardcoded slugs from `getting-started` and `design-tips` to match actual blog post slugs `getting-started-with-digital-marketing` and `design-tips-that-convert`. Better: make OG image generation fully dynamic based on the slug parameter by using `getPostBySlug(slug)` instead of hardcoded lookups.

#### Structural Inconsistency Fixes

#### [ ] AP-007-5: Create Missing UI Hooks Directory

**Target Files**: `packages/ui/src/hooks/`, `packages/ui/components.json`
**Action**: Create `packages/ui/src/hooks/index.ts` with at minimum a `useMediaQuery` utility hook (follows shadcn monorepo convention), or update `components.json` to remove the hooks alias if hooks are not yet needed. The shadcn monorepo guide expects a `hooks/` directory at the package level.

#### [ ] AP-007-6: Migrate Firm App from Hardcoded Slate to Semantic Tokens

**Target Files**: `apps/firm/src/app/page.tsx`, `about/page.tsx`, `services/page.tsx`, `contact/page.tsx`, `blog/page.tsx`, `blog/[slug]/page.tsx`, `book/page.tsx`, `src/components/site-header.tsx`, `src/components/site-footer.tsx`
**Action**: Replace all hardcoded Tailwind slate classes (`text-slate-900`, `bg-slate-50`, `bg-gradient-to-br from-slate-50 to-slate-100`, `border-slate-200`, `text-slate-600`, `text-slate-500`, `text-slate-700`, `bg-slate-100`) with semantic token classes matching the pattern used by demo apps (`text-foreground`, `bg-background`, `text-muted-foreground`, `border-border`, `bg-muted`). This is a prerequisite for the firm site to be themeable. Approximately 100+ class replacements across 8+ files.

#### [ ] AP-007-7: Fix Dark Mode Values in Demo Apps

**Target Files**: `apps/prospective-clients/riley-day-care/src/app/globals.css`, `apps/prospective-clients/the-barber-cave/src/app/globals.css`
**Action**: The `:root .dark` blocks in these files use hardcoded agency hue (198) values instead of the brand-specific hues (riley: 145, barber: 30). Replace with values derived from each client's brand palette. Ideally, update `build-clients.ts` to generate dark-mode values per client, or define them in the client token JSON files.

#### [ ] AP-007-8: Fix Font Token Inconsistency

**Target Files**: `apps/prospective-clients/riley-day-care/tokens/riley-day-care.css`, `apps/prospective-clients/the-barber-cave/tokens/the-barber-cave.css`
**Action**: Change font values from raw `Inter, system-ui, sans-serif` to `var(--font-sans), Inter, system-ui, sans-serif` to match the pattern in `agency.css`. This ensures fonts compose correctly with Tailwind's `--font-sans` variable.

#### [ ] AP-007-9: Fix Token Naming Scheme Mismatch in `packages/ui`

**Target Files**: `packages/ui/src/components/organisms/hero-section.tsx`, `cta-section.tsx`, `feature-grid.tsx`, `page-section.tsx`
**Action**: Organisms use custom token names (`bg-background-primary`, `text-text-primary`, `text-brand-primary`, `border-border-primary`, `text-text-secondary`, `bg-background-secondary`, `bg-background-accent`) while atoms/molecules use shadcn convention (`bg-primary`, `text-primary-foreground`, `bg-card`, `ring-ring`). These organisms will move to `packages/marketing` in AP-001, so align naming there. For now, document the planned migration so no new code uses the custom convention.

#### [ ] AP-007-10: Fix Template SiteHeader Missing Mobile Nav

**Target Files**: `apps/__template__/src/components/site-header.tsx`
**Action**: The template's SiteHeader is a server component (38 lines) with no `"use client"` directive and no Sheet-based mobile navigation. Production apps all have mobile nav (89-90 lines). Add `"use client"`, Sheet-based mobile nav, and ThemeToggle to match the production pattern. Scaffolded sites must ship with mobile navigation.

#### [ ] AP-007-11: Fix Hardcoded Overlay Colors

**Target Files**: `packages/ui/src/components/molecules/dialog.tsx`, `packages/ui/src/components/molecules/sheet.tsx`, `packages/ui/src/components/atoms/button.tsx`
**Action**: Replace Dialog/Sheet overlay `bg-black/50` with `bg-foreground/50` (semantic — adapts to dark mode). Replace Button destructive variant's `text-white` with `text-destructive-foreground` (already defined in shadcn variable set).

#### [ ] AP-007-12: Fix Test Type Mismatch in `packages/ui`

**Target Files**: `packages/ui/src/components/atoms/button.test.tsx`, `packages/ui/test/utils/accessibility.ts`
**Action**: `test/utils/accessibility.ts` exports functions expecting `html: string` parameters. `button.test.tsx` passes React elements from `@testing-library/react`. Either update `button.test.tsx` to render to HTML string first, or update `accessibility.ts` to accept React elements. A simple `button.accessibility.simple.test.ts` already exists that uses HTML strings correctly — use it as the reference pattern.

#### [ ] AP-007-13: Add Missing Border Tokens to riley-day-care

**Target Files**: `packages/design-tokens/tokens/clients/riley-day-care.json`
**Action**: Add `color.semantic.border` tokens using the green brand hue (145). Currently falls back to base semantic border which uses blue hue — visually incorrect for a green-branded site.

#### Database and RLS

#### [ ] AP-007-14: Audit Migration Numbering

**Target Files**: `supabase/migrations/`
**Action**: Two migrations share the `020_` prefix: `020_lifecycle_events.sql` and `020_web_vitals_metrics.sql`. Supabase orders migrations **lexicographically** by full filename and uses the timestamp portion as the primary key in `supabase_migrations.schema_migrations`. If these share a timestamp, `db push` will fail with a duplicate key violation. Fix by renumbering one to `021_`. Use `supabase migration repair` if already applied remotely: `supabase migration repair <old_timestamp> --status reverted` then `supabase migration repair <new_timestamp> --status applied`.

#### [ ] AP-007-15: Fix Import Path Inconsistency

**Target Files**: `apps/firm/src/components/`, `apps/firm/src/app/`
**Action**: Firm uses relative imports (`../components/site-header`) while demo apps and template use alias imports (`@/components/site-header`). Standardize on `@/` alias imports across all apps for consistency.

#### [ ] AP-007-16: Fix Font Setup Inconsistency

**Target Files**: `apps/prospective-clients/riley-day-care/src/app/layout.tsx`
**Action**: Uses `inter.className` on `<body>` while firm and template use `inter.variable` on `<html>`. Standardize on `inter.variable` on `<html>` (the correct pattern for Tailwind v4 where font is referenced via `var(--font-sans)`).

#### [ ] AP-007-17: **CRITICAL** — Fix Dead `platform_admin` RLS Policies

**Target Files**: `supabase/migrations/0132_storage_security.sql`, `supabase/migrations/020_web_vitals_metrics.sql`
**Action**: The `tenant_users.role` column is constrained to `('admin', 'member')` (see `002_tenant_users.sql`). Two later migrations reference `tenant_users.role = 'platform_admin'` which can **never match** — these policies are effectively dead code and no user can satisfy them. Platform admin status is actually represented via `raw_user_meta_data->>'is_platform_admin' = 'true'` (as in `0113_cost_monitoring_security_fix.sql`). Fix: create a new migration that replaces the `platform_admin` role check with the `is_platform_admin` metadata check. Recommended long-term: adopt the **Supabase Auth Hook + `user_roles` table** pattern where roles are injected into the JWT via `custom_access_token_hook` and RLS policies read from `auth.jwt() ->> 'user_role'` with enum-typed values.

#### [ ] AP-007-18: Fix Outdated RLS Test Table Count Assertion

**Target Files**: `supabase/tests/00-rls-coverage.sql`
**Action**: This test asserts exactly **7 tables** in the `public` schema, but the schema has grown (e.g., `files`, `file_access_logs`, `artifacts`, `artifact_versions`, `promotion_steps`, `experiments`, `experiment_events`). The test will fail on any CI run. Fix: use a **dynamic count assertion** — instead of `SELECT plan(7)` with hardcoded table names, use `tests.rls_enabled('public')` from the `basejump-supabase_test_helpers` package which automatically checks that ALL tables in the public schema have RLS enabled, regardless of count.

#### [ ] AP-007-19: Fix Booking Package Dual Entry Point Conflict

**Target Files**: `packages/booking/src/index.ts`, `packages/booking/src/index.tsx`, `packages/booking/package.json`
**Action**: Both `index.ts` and `index.tsx` exist. `index.ts` says to import BookingWidget from `@agency/booking/widget` but the `./widget` subpath export does not exist in `package.json`. Fix: remove `index.ts` (keep `index.tsx` as the single entry), and add `"./widget": { "types": "./dist/widget/booking-widget.d.ts", "default": "./dist/widget/booking-widget.js" }` to `package.json` exports if the subpath pattern is desired.

#### [ ] AP-007-20: Fix Email Package Missing Documented Features

**Target Files**: `packages/email/src/index.ts`, `packages/email/AGENTS.md`
**Action**: `AGENTS.md` documents `getTemplate`, `checkRateLimit`, `validateBookingData` but none exist in `index.ts`. Either implement these functions or update `AGENTS.md` to match reality (`sendEmail`, `sendContactNotification` only). Also add `tenant_id` to `SendEmailOptions` for multi-tenant audit trails.

#### [ ] AP-007-21: Wire `packages/content` to Apps

**Target Files**: `apps/firm/src/content/`, `apps/prospective-clients/*/src/content/`, `packages/content/`
**Action**: `packages/content` has a real content system with Zod schemas (`BlogPostSchema`, `ServicePageSchema`, `CaseStudySchema`), validation (`validateContent`), utilities (`generateSEOMetadata`, `calculateReadingTime`, `generateSlug`), and a `ContentRepository` interface. But all apps use local content modules that duplicate this logic. Plan: apps should import schemas from `packages/content` for validation and type safety, then use `next-mdx-remote` for rendering MDX content. This is a migration task, not a bug fix — track as part of AP-003.

#### CI/CD Workflow Issues

#### [ ] AP-007-22: Fix CI Workflow Issues

**Target Files**: `.github/workflows/security-compliance.yml`, `.github/workflows/sbom.yml`, `.github/workflows/ci.yml`
**Action**:

1. `security-compliance.yml` uses `test:e2e --grep "Security Headers"` but those tests may not exist. Uses `bc` for float comparison but `bc` is not installed on `ubuntu-latest` by default. Filter names `@agency/riley-day-care` may not match actual package names.
2. `sbom.yml` uses deprecated `apt-key` for Trivy install — replace with `gpg --dearmor` pattern.
3. `ci.yml`'s `rls-supashield` job needs `SUPABASE_LOCAL_SERVICE_ROLE` secret — document that local Supabase uses the fixed test key `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (from `supabase start` output).
4. No app deployment workflow exists — only `deploy.yml` for database migrations. Add Vercel deployment or document that Vercel's Git integration handles app deployment automatically.

---

## Implementation Priority

1. **AP-007**: Fix Known Codebase Bugs — 22+ confirmed issues. Split into four waves:
   - **Wave 0 (security/data integrity)**: AP-007-17 (dead `platform_admin` RLS policies — broken admin access), AP-007-18 (RLS test count assertion will fail CI).
   - **Wave 1 (runtime errors)**: AP-007-1 (monitoring dependency), AP-007-2 (admin import), AP-007-3 (empty dist/).
   - **Wave 2 (functional bugs)**: AP-007-4 (OG slugs), AP-007-6 (firm slate→tokens), AP-007-7 (dark mode values), AP-007-8 (font tokens), AP-007-10 (template mobile nav), AP-007-11 (hardcoded overlay colors), AP-007-13 (riley border tokens), AP-007-14 (migration numbering), AP-007-19 (booking dual entry), AP-007-20 (email docs mismatch).
   - **Wave 3 (consistency/CI)**: AP-007-5 (hooks dir), AP-007-9 (token naming docs), AP-007-12 (test types), AP-007-15 (import paths), AP-007-16 (font setup), AP-007-22 (CI workflow fixes).
2. **AP-001**: Establish Package-First Rendering Boundaries — current rendering responsibilities are split at the wrong layer, which blocks thin-app architecture. Includes PPR (`cacheComponents: true` is a stable top-level flag, not experimental) and `"use cache"` adoption (all cached functions must be `async`).
3. **AP-002**: Create Shared Brand Contract and Theme System — the design-token foundation exists but there is no package-owned semantic contract. The brand contract **must** align with shadcn/ui variable naming (`--background`, `--foreground`, `--primary`, etc.) to unify the currently fragmented naming scheme. Includes `data-theme`, `color-mix()`, `@custom-variant` dark mode.
4. **AP-003**: Build Config-Driven Marketing Renderer — the site-factory engine that turns apps into configuration shells. Includes multi-variant blocks, Zod schemas, block registry, SEO helpers.
5. **AP-004**: Convert Client Apps and Template Into Thin Configuration Shells — productizes the architecture into a repeatable onboarding workflow.
6. **AP-006**: Advanced Design Capabilities — Tailwind v4 provides built-in container query variants (`@sm:` through `@7xl:`), `starting:` variant for `@starting-style`, `grid-rows-subgrid` / `grid-cols-subgrid` utilities, and `@custom-variant` for theme switching. These are first-class, zero-config features that directly serve the "maximum design flexibility" goal.
7. **AP-005**: Close Production UX, Metadata, and Runtime Gaps — important for public launch quality: legal pages, metadata coverage, LCP optimization, env validation. Note: `proxy.ts` rename exports `proxy()` (not `middleware()`) and defaults to Node.js runtime.

## Notes

- The repo is much closer to "operationally mature" than it is to "rendering-architecture complete." The infrastructure packages (security, monitoring, governance, cost, metrics, AI) are well ahead of what the first revenue milestone requires.
- The most important shift is not adding more infrastructure packages. It is moving site rendering into packages and reducing app ownership to configuration and routing.
- **The firm app styling is the most urgent fix after runtime errors.** The agency's own website uses hardcoded `text-slate-*` classes, bypassing the design token system that the demo apps correctly use. This must be fixed before the firm can serve as the reference thin-shell implementation.
- `packages/design-tokens` is not wasted work. It is the correct raw material for `packages/brand`. The existing DTCG token files and Style Dictionary pipeline should be preserved and connected to the new brand contract. However, the build must be run to populate `dist/` — currently empty.
- **Token naming must converge on shadcn convention.** The codebase currently has two incompatible naming schemes: atoms/molecules use shadcn names (`bg-primary`, `text-primary-foreground`), organisms use custom names (`bg-background-primary`, `text-text-primary`). The brand contract should define variables matching the full shadcn variable list, and the organisms should migrate when they move to `packages/marketing`.
- `apps/firm` should become the first migrated reference implementation because it already has the richest real content (3 services, 2 blog posts, booking, contact form, JSON-LD, security middleware). But it must migrate from slate to semantic tokens first (AP-007-6).
- `apps/__template__` and `scripts/scaffold-client.ts` (244 lines, uses `SCAFFOLD_*` env vars, copies template with token replacement, assigns next port from 3002, updates root tsconfig, runs `pnpm install && pnpm tokens:build`) are the leverage points that turn this architecture into revenue speed. A properly configured scaffold should produce a working site in under an hour of content entry. The template currently ships without mobile navigation (AP-007-10).
- PPR (`cacheComponents: true`) should be treated as a baseline, not an optimization. It is a **top-level stable flag** in Next.js 16 (not inside `experimental`). It fundamentally changes how pages render: static shell immediately, dynamic content streamed in.
- **Critical: ISR and `"use cache"` migration must be incremental.** `"use cache"` caches data/component results but does NOT produce CDN-level route caching. You lose the "serve stale from edge" behavior if you replace ISR wholesale. Keep `export const revalidate` for full-page CDN caching; add `"use cache"` for component-level caching within Suspense boundaries. `"use cache: remote"` is valuable for tenant config lookups shared across serverless instances.
- `"use cache"` requires **all** functions and components using it to be `async`. Content-fetching functions currently using React `cache()` with synchronous calls must be converted to `async` functions returning Promises.
- **Known Vercel caveats with `cacheComponents`**: OOM during builds with many static paths (SIGKILL on build instances), `"use cache"` directives silently dropped in some dynamic routes (tracked issue), `Date.now()`/`new Date()` non-deterministic between build and request time. Start with `apps/firm` (fewest static paths) and monitor.
- **`platform_admin` RLS policies are a security gap**, not just a consistency issue. Two tables (`files`, `web_vitals_metrics`) have admin-access policies that can never match because `platform_admin` is not a valid role value. Recommended long-term fix: adopt Supabase's **Auth Hook + `user_roles` table** pattern where roles are injected into JWT via `custom_access_token_hook()` and RLS policies read from `auth.jwt() ->> 'user_role'`.
- **Blog content needs MDX processing.** Current rendering is `whitespace-pre-wrap` raw text with no markdown, no custom components, no syntax highlighting. `next-mdx-remote` v6+ `compileMDX()` in RSC is the recommended approach (zero client JS). `rehype-pretty-code` + Shiki 3 for syntax highlighting. `packages/content` already has Zod schemas that should validate content.
- **No off-the-shelf Style Dictionary → shadcn bridge exists.** AP-002 requires building a custom SD v4 `name` transform and `css/shadcn-theme` format. The existing `build-clients.ts` already outputs `@theme inline` CSS — it needs adaptation to emit shadcn-compatible variable names.
- **23 CI/CD workflows exist** but several are fragile or broken. Priority fixes in AP-007-22. However, Vercel's Git integration handles app deployment automatically for monorepos — no custom deploy workflow needed if using Vercel's built-in monorepo detection.
- **`packages/content` is a sleeping asset.** It has complete Zod schemas, validation utilities, SEO generation, and a repository interface. Wiring it to apps (AP-007-21/AP-003) would eliminate duplicate content logic and add type-safe validation to all content.
- The new `updateTag(tag)` function (Server Actions only) provides immediate cache expiration for read-your-own-writes consistency — important for admin-triggered content updates. `revalidateTag(tag, profile)` (two-arg required, single-arg deprecated) provides stale-while-revalidate background refresh.
- Container queries are not optional for a component library that targets "maximum design flexibility." Tailwind v4 provides 13 built-in container query breakpoints (`@3xs:` through `@7xl:`) with different sizes than viewport breakpoints. Components that use viewport breakpoints cannot be reliably reused across different layout contexts (sidebar vs full-width vs card grid).
- The `data-theme` attribute system combined with `@custom-variant dark (&:where([data-theme="dark"] *));` enables runtime theme switching without page reloads or component re-renders. Combined with `color-mix()`, it enables a single brand color to derive an entire interactive state palette.
- Each block category should have at least 3 visually distinct variants. A site factory with single-variant blocks is not a design tool; it is a template.
- **View Transitions**: Next.js 16's native `experimental: { viewTransition: true }` is explicitly "not recommended for production" per official docs. Use the `next-view-transitions` package for production page transitions.
- **`@starting-style`**: Tailwind v4's `starting:` variant is a zero-config built-in that eliminates the need for raw CSS `@starting-style` blocks. Stack with other variants: `starting:open:opacity-0`.

## Verification Checklist

### Bugs Resolved (AP-007)

- [ ] `pnpm install && pnpm build` succeeds from a clean clone (no missing dependencies, no empty dist/).
- [ ] Storybook starts without import errors (`packages/design-tokens/dist/` is populated).
- [ ] `supabase test db` passes (RLS coverage test uses dynamic count, not hardcoded 7).
- [ ] Platform admin can access storage and web vitals tables via correct metadata check (not dead `platform_admin` role policy).
- [ ] `packages/booking/package.json` has single entry point — no dual `index.ts`/`index.tsx` conflict.
- [ ] `apps/firm` uses semantic token classes exclusively — no `text-slate-*`, `bg-slate-*`, `border-slate-*` anywhere.
- [ ] Demo app dark mode uses brand-correct hues (riley: green hue 145, barber: warm hue 30), not agency hue 198.
- [ ] Blog OG images resolve correctly for actual blog post slugs.
- [ ] `apps/agency-admin` AI content page imports compile without error.
- [ ] Template SiteHeader includes mobile Sheet navigation.
- [ ] All apps use consistent `inter.variable` on `<html>` and `@/` import aliases.

### Architecture (AP-001, AP-002, AP-003, AP-004)

- [ ] A newly scaffolded client site can be created without manually editing shell JSX.
- [ ] The scaffolded site uses package exports for nav, footer, sections, and page rendering.
- [ ] The app folder contains only routing, metadata, config, content, theme override, and small bespoke code.
- [ ] `packages/ui` exports only primitives and utilities — no marketing organisms.
- [ ] `packages/brand` exports a semantic theme contract with shadcn-aligned variable names.
- [ ] `packages/marketing` exports multi-variant blocks, page renderer, and SEO helpers.
- [ ] Swapping the theme preset and changing `data-theme` attribute produces a visibly different site without component rewrites.
- [ ] `apps/firm` and the two prospective-client demos still build and pass their site-level tests after the refactor.
- [ ] Shared rendering packages build cleanly and type-check cleanly.
- [ ] Token naming is unified: all components reference `bg-primary`, `text-muted-foreground`, `bg-card`, etc. — not `bg-background-primary`, `text-text-primary`.

### Rendering (AP-001)

- [ ] PPR is enabled via `cacheComponents: true` (top-level in `next.config.ts`) in `apps/firm` and pages show a static shell with streamed dynamic content.
- [ ] ISR (`export const revalidate`) retained for route-level CDN caching of marketing pages.
- [ ] `"use cache"` + `cacheLife` added for component-level data fetching within Suspense boundaries (all cached functions are `async`).
- [ ] `cacheTag` labels are applied to content data fetching. `revalidateTag` uses two-argument form.
- [ ] `middleware.ts` is renamed to `proxy.ts` with `proxy()` export.
- [ ] Blog content renders via `next-mdx-remote` `compileMDX()` with syntax highlighting — not raw `whitespace-pre-wrap` text.

### Design Flexibility (AP-006)

- [ ] All marketing blocks render correctly with container queries at multiple container widths. Tailwind `@container` class + `@sm:` through `@7xl:` variants used.
- [ ] Card grids use `grid-rows-subgrid` (Tailwind utility) for aligned headers/bodies/footers.
- [ ] Dialog and Sheet use `starting:` variant (Tailwind built-in) for entry animations.
- [ ] Hero, features, CTA, and nav blocks each offer at least 3 visually distinct variants.
- [ ] `prefers-reduced-motion: reduce` disables all animations across the entire site.
- [ ] All interactive elements meet WCAG 2.2 AA minimum target size (24x24 CSS pixels).
- [ ] View Transitions use `next-view-transitions` package (not experimental native flag).

### Production Quality (AP-005)

- [ ] Public sites include legal routes and complete metadata coverage.
- [ ] Database migration counts, naming, and RLS tests are internally consistent.
- [ ] JSON-LD includes Organization, LocalBusiness, Service, and FAQPage schemas on appropriate pages.
- [ ] LCP hero images use `fetchPriority="high"` and do not use `loading="lazy"`.
