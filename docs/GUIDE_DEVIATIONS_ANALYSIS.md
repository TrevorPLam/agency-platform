# Deep Codebase Analysis: Deviations from docs/GUIDE.md

This document catalogs **every identified deviation** between the repository and the agency technical guide (`docs/GUIDE.md`). It does not create new documentation; it only records gaps and differences.

**Scope:** All four apps (firm, agency-admin, riley-day-care, the-barber-cave), all packages, shared config (TypeScript, ESLint, Prettier), CI, next.config, middleware, forms, SEO, security headers, GUIDE Part 27 appendix and pre-launch checklist (Parts 26, 24), prompts and decision trees, and stack/convention differences. Cross-referenced against GUIDE sections 1–27 and the Sources list. **Reassessment:** Section 29 — unscoped areas (monorepo layout, ESLint format, Tailwind plugins, metadata shape, Windsurf/AGENTS.md, conventional commits, engines, API validation, A/B testing, env naming). Section 30 — further assessment second pass (revalidation strategy, Playwright location/content/data-testid, schema components, preconnect/useTransition, opengraph-image, thank-you/booking routes).

**Research (03/2026):** The section **"Research and recommendations (03/2026)"** below summarizes up-to-date research for each deviation and gives verdicts (Follow GUIDE / Repo better / Hybrid / Context-dependent) with recommended actions.

---

## 1. CRITICAL / FORBIDDEN PATTERNS

### 1.1 TypeScript `any` (GUIDE: "NEVER use the `any` type"; ESLint "no-explicit-any": "error")

**Repository:** ESLint uses `no-explicit-any: "warn"` (not "error"). Widespread `any` usage outside apps:

| Location | Count / Notes |
|----------|----------------|
| `packages/monitoring/src/cost-alerts.ts` | 4× `message: any` |
| `packages/analytics/src/server.ts` | `[key: string]: any` |
| `packages/database/src/admin.ts` | `metadata?: Record<string, any>` |
| `packages/database/src/auth.ts` | 1× with `eslint-disable-next-line` (documented exception) |
| `packages/design-tokens/scripts/build-clients.ts` | 3× |
| `packages/governance/src/properties.ts` | 10× `as any` / `Record<string, any>` |
| `packages/governance/src/types.ts` | `custom_properties?: Record<string, any>` |
| `packages/security/src/*` | sbom, monitoring, security-manager — multiple `any` |
| `packages/artifacts/src/*` | retention, promotion, policies, registry — `record: any`, `as any` |
| `packages/knowledge/src/*` | expertise, workflows, audit, incentives — many `any` |
| `packages/metrics/src/collector.ts` | 1× `{} as any` |
| `packages/monitoring/src/cicd-costs.ts` | 5× |
| `packages/monitoring/src/index.ts` | 4× `tenantId as any` |
| `scripts/**` | knowledge, security, dependencies, governance, communication, performance — dozens of `any` |

**Apps:** No `any` in app source (only packages and scripts).

---

### 1.2 Internal links: `<a>` vs `next/link` (GUIDE: "NEVER use <a> tags for internal links. Always use next/link.")

**Deviations:**

- `apps/prospective-clients/riley-day-care/src/app/(auth)/login/page.tsx`: `<a href="/signup" className="...">`
- `apps/prospective-clients/riley-day-care/src/app/(auth)/signup/page.tsx`: `<a href="/login" className="...">`
- `apps/prospective-clients/the-barber-cave/src/app/(auth)/login/page.tsx`: `<a href="/signup" className="...">`
- `apps/prospective-clients/the-barber-cave/src/app/(auth)/signup/page.tsx`: `<a href="/login" className="...">`

All other internal links in apps use `<Link>` from `next/link`.

---

### 1.3 Raw `<img>` (GUIDE: "NEVER use <img> tags. Always use next/image.")

**Repository:** No raw `<img>` in app or package source. **Compliant.** No use of `next/image` in app pages either (no content images in scanned pages); when images are added, GUIDE requires `next/image` with dimensions and `priority` for above-the-fold.

---

### 1.4 moment.js (GUIDE: "NEVER install moment.js. Use date-fns instead.")

**Repository:** No `moment` dependency or import. **Compliant.**

---

### 1.5 CSS-in-JS (GUIDE: "NEVER use CSS-in-JS (styled-components, emotion).")

**Repository:** No app or package source imports styled-components or emotion. Storybook build output (`packages/ui/storybook-static/`) contains bundled emotion from Storybook/Radix tooling — not direct app usage. **Compliant in source.**

---

## 2. TYPESCRIPT & BUILD CONFIG

### 2.1 tsconfig (GUIDE: strict + noUncheckedIndexedAccess + exactOptionalPropertyTypes)

**Repository:** `packages/typescript-config/base.json` has `strict: true` only. Missing:

- `noUncheckedIndexedAccess`
- `exactOptionalPropertyTypes`

GUIDE also shows `lib: ["ES2022", "DOM"]`; repo nextjs extends base and adds `lib: ["dom", "dom.iterable", "ES2022"]`. Acceptable.

---

### 2.2 ESLint

| Rule / config | GUIDE | Repository |
|---------------|--------|------------|
| `no-explicit-any` | `"error"` | `"warn"` in `packages/eslint-config` |
| `no-console` | `"warn"` | Not present in shared config |
| `no-unused-vars` | `"error"` (TypeScript version) | `@typescript-eslint/no-unused-vars`: `"error"` ✅ |

---

### 2.3 Prettier

| Option | GUIDE | Repository (`prettier.config.mjs`) |
|--------|--------|------------------------------------|
| `semi` | `true` | `false` |
| `singleQuote` | `true` | `true` ✅ |
| `trailingComma` | `es5` | `es5` ✅ |
| `plugins` | `prettier-plugin-tailwindcss` | Same ✅ |

---

## 3. REPOSITORY & APP STRUCTURE

### 3.1 GUIDE-prescribed app layout vs actual

| GUIDE | firm | agency-admin | riley-day-care | the-barber-cave |
|-------|------|--------------|----------------|-----------------|
| `app/api/contact/route.ts` | ❌ | N/A | ❌ | ❌ |
| `app/api/revalidate/route.ts` | ❌ | ❌ | ❌ | ❌ |
| `app/sitemap.ts` | ❌ | ❌ | ❌ | ❌ |
| `app/robots.ts` | ❌ | ❌ | ❌ | ❌ |
| `app/opengraph-image.tsx` | ❌ | ❌ | ❌ | ❌ |
| `components/ui/` | ❌ (shared in packages/ui) | ❌ | ❌ | ❌ |
| `components/sections/` | ❌ | ❌ | ❌ | ❌ |
| `components/layout/` | ❌ | ❌ | ❌ | ❌ |
| `lib/cms.ts` | ❌ | ❌ | ❌ | ❌ |
| `lib/metadata.ts` | ❌ | ❌ | ❌ | ❌ |
| `lib/validations.ts` | ❌ | ❌ | ❌ | ❌ |
| `lib/analytics.ts` | ❌ | ❌ | ❌ | ❌ |

Contact handling: Server Actions + Supabase + `@agency/email`, not API route + Zod. No CMS webhook; no Sanity.

---

### 3.2 metadataBase (GUIDE: "metadataBase is always set in the root layout.tsx.")

**Repository:** No app sets `metadataBase` in root layout. All four apps export `metadata` (title, description, etc.) but omit `metadataBase`.

---

### 3.3 generateStaticParams (GUIDE: "Every dynamic route has generateStaticParams for SSG.")

**Repository:** No `generateStaticParams` in any app. Dynamic routes (e.g. `blog/[slug]/page.tsx`) use in-memory or fetched data without exporting `generateStaticParams`.

---

### 3.4 JSON-LD (GUIDE: "Blog and service pages include relevant JSON-LD schema.")

**Repository:** No `application/ld+json` or schema.org JSON-LD in app pages.

---

## 4. FORMS & VALIDATION

### 4.1 React Hook Form + Zod (GUIDE: forms use RHF + Zod; schemas in lib/validations.ts)

**Repository:**

- No `react-hook-form` or `@hookform/resolvers` in app dependencies.
- No Zod usage in apps (no `lib/validations.ts`).
- Contact forms use native form + `useActionState` + Server Action; validation is ad-hoc in the action (trim, presence).

---

### 4.2 Form submission target (GUIDE: POST /api/contact with Zod + GHL or Resend)

**Repository:** Server Action → Supabase `contact_submissions` + `@agency/email` `sendContactNotification`. No API route, no GHL integration.

---

## 5. SEO & PERFORMANCE

### 5.1 Sitemap, robots, OG image

- No `sitemap.ts`, `robots.ts`, or `opengraph-image.tsx` in any app.

### 5.2 next/image and priority (GUIDE: all images via next/image; hero with priority={true})

- No `next/image` or hero images in the app pages scanned. When images are added, GUIDE requires next/image and priority for above-the-fold.

### 5.3 next/script (GUIDE: third-party scripts via next/script, e.g. afterInteractive)

- No `next/script` usage in apps. Analytics is PostHog via `@agency/analytics`, not GTM.

---

## 6. SECURITY & HEADERS

### 6.1 Security headers in next.config (GUIDE: X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, Strict-Transport-Security)

| App | Headers present |
|-----|-----------------|
| **firm** | ❌ None. `next.config.ts` only has `transpilePackages`. |
| agency-admin | Partial: X-Frame-Options (DENY), X-Content-Type-Options, Referrer-Policy, Permissions-Policy, CSP. **Missing: Strict-Transport-Security.** |
| riley-day-care | Same as agency-admin — **no HSTS**. |
| the-barber-cave | Same as agency-admin — **no HSTS**. |

- GUIDE shows `X-Frame-Options: SAMEORIGIN`; repo uses `DENY` (stricter). No deviation in intent.
- GUIDE includes `Permissions-Policy: ..., interest-cohort=()` (FLoC); repo omits `interest-cohort=()`.

---

## 7. CONVENTIONS & STYLE

### 7.1 Agent rules: .cursorrules vs .cursor/rules

- **GUIDE:** Single `.cursorrules` at repo root with stack, rules, and forbidden patterns.
- **Repository:** No `.cursorrules`. Uses `.cursor/rules/*.mdc` (base, frontend, database, rls, tokens). Content overlaps; mechanism differs.

### 7.2 Path alias and component imports

- **GUIDE:** `cn()` from `@/lib/utils`; components from `@/components/...`.
- **Repository:** `cn()` from `@agency/ui`. Apps use `@/` for app and components where used (prospective-clients, some agency-admin); **firm** and **agency-admin** root layouts use relative imports (`../components/...`). Inconsistent.

### 7.3 Component naming (GUIDE: "Props interfaces named ComponentNameProps"; "one named component matching the filename")

- No `*Props` interfaces found in app components. Filenames are kebab-case (e.g. `site-header.tsx`), exports PascalCase (e.g. `SiteHeader`) — consistent with base.mdc.

### 7.4 Sections and layout folders (GUIDE: "New page sections go in /components/sections/"; layout in /components/layout/)

- No `components/sections/` or `components/layout/` in any app. Section-like components live flat under `components/` (e.g. site-header, site-footer).

---

## 8. TOOLING & CI

### 8.1 .nvmrc (GUIDE: "Create .nvmrc in every repo root" with "22")

**Repository:** No `.nvmrc` file. CI uses `node-version: "22"` directly.

### 8.2 Husky + lint-staged (GUIDE: pre-commit runs lint-staged for ESLint + Prettier)

**Repository:** No Husky or lint-staged. Root has `format` and `format:check` only; no git hooks.

### 8.3 Lighthouse CI (GUIDE: lighthouse-ci-action + lighthouse-budget.json)

**Repository:** No Lighthouse job in GitHub Actions and no `lighthouse-budget.json`.

### 8.4 CI pnpm version (GUIDE example: version 9; .nvmrc)

**Repository:** pnpm `10.12.1` in CI; Node `"22"`; no .nvmrc.

---

## 9. STACK CHOICES (INTENTIONAL DIFFERENCES)

These are architectural choices that differ from the GUIDE; they are consistent within the repo and with base.mdc.

| Area | GUIDE | Repository |
|------|--------|------------|
| Next.js | 15 | 16.1 |
| Tailwind | v3 (tailwind.config.ts, theme) | v4 (CSS @theme, @source; no tailwind.config) |
| Animations | Framer Motion | tw-animate-css |
| CMS | Sanity + GROQ + revalidate webhook | None (Supabase for data; in-memory content where used) |
| Analytics | GTM + dataLayer | PostHog (@agency/analytics) |
| Auth | Clerk for portals | Supabase Auth |
| Forms | RHF + Zod + API route | Server Actions + Supabase + @agency/email |

---

## 10. CONSOLE USAGE (GUIDE: "no-console": "warn")

**Repository:** No `no-console` in shared ESLint config. Apps use `console.error` in error paths (contact actions, API routes, error boundaries) and one `console.log` in agency-admin API (metrics). GUIDE recommends warning on console.

---

## 11. EMAIL (GUIDE: Resend + React Email templates in packages/email)

**Repository:** Resend used in `@agency/email`. Contact notification is inline HTML string in `sendContactNotification`, not React Email templates.

---

## 12. TESTING (GUIDE: four Playwright tests per site; Vitest for unit)

**Repository:**

- **firm:** One Playwright smoke test (home loads, title, h1). No contact submit, nav links, or mobile menu tests.
- No Vitest in firm app (catalog has vitest; used in other packages if at all).

---

## 13. ENV & DOCS

- Repo has **.env.local.example** (GUIDE appendix uses .env.example). Env var naming differs: GUIDE uses CLIENT_NOTIFICATION_EMAIL, EMAIL_FROM, NEXT_PUBLIC_BASE_URL, NEXT_PUBLIC_SITE_NAME; repo uses CONTACT_TO_EMAIL, FROM_EMAIL and omits BASE_URL/SITE_NAME in the example (uses NEXT_PUBLIC_TENANT_SLUG, PostHog, etc.).
- GUIDE’s handoff checklist references Sanity, GTM, GA4, GHL — not used in this repo; checklist items are GUIDE-specific.

---

## 14. next.config (GUIDE Part 27 template)

None of the apps set: `compress: true`, `poweredByHeader: false`, `images.remotePatterns`/`images.formats`, `async redirects()`, `experimental.ppr`, or `experimental.reactCompiler`.

---

## 15. Forms — honeypot

No honeypot field in any contact form. GUIDE: "Honeypot bot trap present in all forms".

---

## 16. Pre-launch checklist gaps

No `test:e2e` script (firm uses `test`); no broken-link-checker in scripts; apps use console.error/console.log in server code.

---

## 17–18. Prompts folder; lib/client-config and lib/data

No `prompts/` folder. No `lib/client-config.ts` or `lib/data/`; static data inline in pages.

---

## 19–22. Compliance and integrations

No CMP/cookie consent; no Sentry; no Drizzle; no Crisp or next/script for live chat.

---

## 23–24. Route groups; canonical and www

No `(marketing)` route group; firm has no root loading/error. No canonical in metadata; no www/non-www redirects.

---

## 25–27. Testing; Zod/React Email; accessibility

No `test:e2e` name; no Chromatic pipeline. Zod in @agency/booking only; no React Email templates. No automated a11y testing in CI.

---

## 29. UNSCOPED / FURTHER ANALYSIS (reassessment)

The following were not fully covered in earlier sections or emerged from re-scanning the GUIDE and codebase.

### 29.1 Monorepo folder layout (GUIDE Part 6)

GUIDE shows **tooling/** for shared config: `tooling/eslint-config/`, `tooling/tsconfig/`. Repo uses **packages/eslint-config**, **packages/typescript-config** — same role, different folder name (packages vs tooling).

### 29.2 ESLint config format

GUIDE shows **.eslintrc.js** (legacy `module.exports`). Repo uses **eslint.config.mjs** and **flat config** (e.g. `import agencyFlat from '@agency/eslint-config/flat'`). ESLint 9+ flat config is the current standard; GUIDE example is legacy.

### 29.3 Tailwind plugins (GUIDE Part 10)

GUIDE recommends `require('@tailwindcss/typography')` and `require('@tailwindcss/forms')` in tailwind.config. Repo uses Tailwind v4 (no tailwind.config); no equivalent plugin usage in app CSS. Blog/forms styling may differ from GUIDE’s plugin-based approach.

### 29.4 Metadata shape (GUIDE Part 12)

GUIDE layout example includes: **metadataBase**, **openGraph.type**, **openGraph.siteName**, **openGraph.locale**, **openGraph.images**, **twitter.card**, **robots**, **verification.google**. App layouts set title, description, and some openGraph (title/description only); none set **openGraph.type**, **siteName**, **locale**, **images**, **twitter**, **robots**, or **verification** in root metadata.

### 29.5 Windsurf / AGENTS.md (GUIDE Part 22)

GUIDE: “The .cursorrules file (or **AGENTS.md** for Windsurf and other agents) lives at the root.” Repo has **.windsurf/rules/monorepo.md** and **.windsurfrules** that point to .cursor/rules; no **AGENTS.md** at root. Windsurf is supported via different filenames.

### 29.6 Conventional commits and PRs

GUIDE shows conventional commit types (feat, fix, chore, refactor, docs, style, perf). Repo PR template uses checkboxes (bug fix, new feature, etc.) and does not require conventional commit message format in the template text.

### 29.7 Node engines

GUIDE implies Node 22 via .nvmrc. Repo has **engines** with `"node": ">=22.0.0"` only in **packages/artifacts** and **packages/security**; root and apps do not declare engines. No .nvmrc.

### 29.8 Supabase / port 6543 (GUIDE and base.mdc)

base.mdc and database.mdc require Port **6543** (Supavisor) for Supabase connections. **packages/database/src/client.ts** documents Supavisor (port 6543). CI and .env.local.example use **localhost:54321** for local Supabase (standard local dev). No use of port 5432 in code — compliant with “never 5432” rule.

### 29.9 API route validation (GUIDE: Zod in API routes)

GUIDE: “Validate with Zod server-side (never trust client data)” in app/api/contact/route.ts. **agency-admin** API routes (e.g. costs/summary, costs/metrics) do not use Zod; they validate tenant_id presence and use RPC/data directly. No shared API request schema validation pattern.

### 29.10 A/B testing and CRO (GUIDE Part 16)

GUIDE describes edge middleware for A/B variant routing (cookie + rewrite) and dataLayer/header for GTM. No A/B middleware, no variant cookies, no x-ab-bucket or GTM integration in apps. PostHog could support experiments; no such usage found.

### 29.11 notFound and error boundaries

**notFound()** is used correctly in blog [slug] when post is missing (firm, riley-day-care). **error.tsx** in agency-admin is a client component with error + reset props and useEffect(console.error) — aligns with Next.js and GUIDE error-boundary pattern. No deviation.

### 29.12 vercel.json and deployment config

GUIDE does not mandate vercel.json. None found in repo; deployment is via Vercel project settings / next.config only. No deviation.

### 29.13 Summary of unscoped findings

| Area | GUIDE | Repository |
|------|--------|------------|
| Tooling folder | tooling/eslint-config, tooling/tsconfig | packages/eslint-config, packages/typescript-config |
| ESLint | .eslintrc.js | eslint.config.mjs (flat) |
| Tailwind plugins | typography, forms in config | Tailwind v4; no plugin usage in apps |
| Root metadata | metadataBase, openGraph full shape, twitter, robots, verification | Partial (title, description, openGraph title/desc only) |
| Windsurf | .cursorrules or AGENTS.md | .windsurf/rules, .windsurfrules; no AGENTS.md |
| Commits | feat/fix/chore etc. | PR template does not enforce conventional commits |
| engines | — | Only in 2 packages; no root/app engines |
| API validation | Zod in API routes | agency-admin API routes do not use Zod |
| A/B / CRO | Edge middleware + GTM | None |
| notFound / error | — | Compliant |

---

## 30. FURTHER ASSESSMENT (second pass)

Additional items from re-reading the GUIDE and scanning previously unchecked patterns.

### 30.1 Rendering and revalidation (GUIDE Part 8 table)

GUIDE recommends: Homepage/About/Services SSG (deploy or CMS webhook); Blog posts ISR `revalidate = 3600`; Testimonials/Team ISR `revalidate = 86400`; Pricing ISR `revalidate = 60`. Repo: only **firm/services** sets `revalidate = 60`. Homepage, about, blog listing, and blog [slug] do not set `revalidate` (default SSG). No ISR on blog; no revalidateTag or webhook-driven invalidation.

### 30.2 Playwright test location and content (GUIDE Part 20)

GUIDE shows **tests/e2e/critical-flows.test.ts** with four tests: (1) homepage loads, title, **no console errors**; (2) contact form submit and **data-testid="success-message"** visible; (3) nav links (Services, About); (4) **mobile menu** open/close with **data-testid="mobile-menu-button"**, **data-testid="mobile-nav"**, **data-testid="mobile-menu-close"**. Repo: **apps/firm/e2e/smoke.spec.ts** — single test (homepage, title, h1). No tests/e2e path; no console-error assertion; no contact-form test; no nav test; no mobile menu test. No **data-testid** attributes in app components (no success-message, mobile-menu-button, mobile-nav, mobile-menu-close), so GUIDE’s test selectors could not be used as-is.

### 30.3 Schema components (GUIDE Part 12)

GUIDE provides **components/schema/LocalBusinessSchema.tsx** (JSON-LD script tag for LocalBusiness) and lists schema types (Organization, BlogPosting, FAQPage, Person, AggregateRating, BreadcrumbList). Repo: no **components/schema/** folder; no JSON-LD or schema.org components in apps.

### 30.4 Performance: preconnect / dns-prefetch (GUIDE Part 17)

GUIDE: “Preconnect to external origins if you fetch images from a CMS CDN” — e.g. `<link rel="preconnect" href="https://cdn.sanity.io" />` and dns-prefetch in layout head. No preconnect or dns-prefetch in any app layout (no CMS CDN in use).

### 30.5 Performance: useTransition for INP (GUIDE Part 17)

GUIDE recommends `useTransition` for expensive state updates (e.g. filterable lists) to avoid long tasks and improve INP. No `useTransition` or `startTransition` usage in apps.

### 30.6 Dynamic OG image (GUIDE Part 12)

GUIDE shows **app/opengraph-image.tsx** using `ImageResponse` from `next/og` with `runtime = 'edge'`. No opengraph-image.tsx or ImageResponse usage in apps.

### 30.7 Thank-you / booking success (GUIDE references)

GUIDE mentions “/thank-you page” for conversion tracking and Stripe success_url “/booking/success”. No `/thank-you` or `/booking/success` route in firm app (booking exists at /book; success URL is referenced in GUIDE Stripe example only).

### 30.8 Summary of further assessment (Section 30)

| Area | GUIDE | Repository |
|------|--------|------------|
| Revalidation | ISR revalidate = 3600 (blog), 86400 (team), 60 (pricing); SSG for home/about/services | Only services has revalidate = 60; blog/home/about have no revalidate |
| Playwright | tests/e2e/critical-flows.test.ts; 4 tests; console errors; data-testid selectors | e2e/smoke.spec.ts; 1 test; no console check; no data-testid in UI |
| Schema | components/schema/LocalBusinessSchema etc.; JSON-LD | No schema components or JSON-LD |
| Preconnect | preconnect/dns-prefetch for CMS CDN in layout | None |
| useTransition | For filterable lists / INP | Not used |
| OG image | opengraph-image.tsx + ImageResponse | None |
| Thank-you / booking success | /thank-you, /booking/success | /book exists; no thank-you or booking/success route in firm |

---

## Research and recommendations (03/2026)

Up-to-date research (March 2026) was used to decide, per deviation category, whether to **follow the GUIDE** or keep/align with the **repository** implementation. Verdicts below.

### TypeScript (strict options, no-explicit-any)

**Research:** `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes` are widely recommended beyond `strict: true` to catch indexed access and optional-property bugs (TypeScript best practices 2025–2026). For `no-explicit-any`, "error" is the strict option; "warn" still allows builds and is less strict.

**Verdict:** **Follow the GUIDE.** Add `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes` to tsconfig. Set `no-explicit-any` to `"error"` in ESLint and fix or narrow `any` in packages/scripts (or use `unknown` and narrow).

### ESLint config format (.eslintrc vs flat)

**Research:** As of ESLint 9 (April 2024), **flat config** is the default; `.eslintrc` is deprecated. Flat config uses `eslint.config.js` (or `.mjs`); extends and defineConfig are supported in 2025.

**Verdict:** **Repository is better.** Keep flat config (eslint.config.mjs). Update the GUIDE to show flat config, not .eslintrc.js.

### Next.js version (15 vs 16)

**Research:** Next.js 16 is stable (2025), with Turbopack default, "use cache", improved caching APIs, and React 19.2 support.

**Verdict:** **Repository is better.** Use Next.js 16. Update the GUIDE to recommend 16 for new projects.

### Tailwind (v3 config vs v4 CSS-first)

**Research:** Tailwind v4 (2025) uses **CSS-first configuration**: `@import "tailwindcss"`, `@theme` in CSS, no tailwind.config.js. Official docs and migration guides describe this as the current approach; builds are faster and DX is improved.

**Verdict:** **Repository is better.** Keep Tailwind v4 and CSS-first setup. Update the GUIDE to v4 and CSS @theme; drop tailwind.config.js for new work.

### Animations (Framer Motion vs tw-animate-css)

**Research:** No strong 2026 consensus that one approach is universally “best.” Framer Motion is popular for React; CSS-based animation (e.g. tw-animate-css) avoids JS and can help INP. Depends on need for orchestration vs simple utilities.

**Verdict:** **Either is acceptable.** Repository’s tw-animate-css is valid for utility-based animation and can be lighter. GUIDE’s Framer Motion is valid for richer motion. Align with team preference; no change required unless the GUIDE is being updated for Tailwind v4 (then CSS animation fits better).

### Forms (RHF + Zod + API route vs Server Actions + Supabase)

**Research:** Server Actions are recommended for app-internal forms (e.g. Next.js 15/16 guides, 2025 surveys). Zod validation **in** Server Actions is best practice for type safety and security; no need for a separate API route when the only consumer is the app.

**Verdict:** **Hybrid.** Keep **Server Actions** (repository approach). Add **Zod** validation inside Server Actions (GUIDE’s validation idea). API route is optional and better for external or multi-method APIs. So: follow the GUIDE on “validate with Zod,” implement it in Server Actions rather than a separate route.

### CMS (Sanity vs Supabase / no CMS)

**Research:** Sanity fits content-heavy marketing sites with non-technical editors. Supabase fits app data, auth, and custom backends. Choice is use-case driven.

**Verdict:** **Context-dependent.** For content-edited marketing sites, GUIDE’s Sanity approach is appropriate. For app-first or data/auth-first products, repository’s Supabase-without-Sanity is appropriate. No single “correct” choice; align GUIDE and repo to the product type.

### Analytics (GTM + GA4 vs PostHog)

**Research:** GTM is a tag manager; PostHog is a product analytics platform. GA4 faces GDPR/legal issues in several EU countries (2025). PostHog offers product analytics, session replay, feature flags, and can be self-hosted.

**Verdict:** **Context-dependent.** For classic marketing/attribution and third-party tags, GUIDE’s GTM + GA4 is standard. For product analytics and dev-focused metrics, repository’s PostHog is a better fit. Choose by primary use case; both can coexist (e.g. GTM for ads, PostHog for product).

### Auth (Clerk vs Supabase Auth)

**Research:** Clerk offers quick, polished auth UI; Supabase Auth fits when already using Supabase and need tight DB/RLS integration. Both are valid.

**Verdict:** **Repository is acceptable.** Supabase Auth is a good choice with Supabase backend and RLS. GUIDE’s Clerk recommendation is valid for “fastest time to portal.” No change required unless the GUIDE is explicitly scoped to “no Supabase” stacks.

### Security headers (HSTS, interest-cohort)

**Research:** HSTS is a standard best practice (OWASP, MDN, 2025). Recommended form: `max-age=31536000` or `63072000`; `includeSubDomains`; `preload` when HTTPS is permanent. Permissions-Policy `interest-cohort=()` disables FLoC.

**Verdict:** **Follow the GUIDE.** Add **Strict-Transport-Security** to all apps (including firm). Add **interest-cohort=()** to Permissions-Policy where the GUIDE specifies it. Repository should add these; GUIDE’s header set is correct.

### metadataBase, sitemap, robots

**Research:** Next.js metadata docs and SEO guides (2025): **metadataBase** is required for correct absolute URLs for OG/Twitter images and other URL-based metadata. **sitemap.ts** and **robots.ts** in the App Router are standard and improve crawlability and indexing.

**Verdict:** **Follow the GUIDE.** Add metadataBase in root layout, and add sitemap.ts and robots.ts (and opengraph-image if using dynamic OG). Repository should implement these for any public marketing or SEO-sensitive app.

### Pre-commit (Husky + lint-staged)

**Research:** Husky + lint-staged remains the common approach for pre-commit lint/format in JS/TS (2025–2026); used by many large projects. lint-staged keeps runs fast by only checking staged files.

**Verdict:** **Follow the GUIDE.** Add Husky and lint-staged so lint and format run on commit. Repository benefits from this; GUIDE is aligned with current practice.

### Error monitoring (Sentry)

**Research:** Sentry is the standard choice for Next.js error monitoring; official SDK and wizard, client/server/edge configs, replay, and production usage are well documented (2025).

**Verdict:** **Follow the GUIDE.** Add Sentry (or equivalent) for production error monitoring. Repository should adopt this for production apps; GUIDE is correct to recommend it.

### Email (React Email vs inline HTML)

**Research:** React Email is recommended for modern transactional email in React apps: components, TypeScript, preview, and integration with Resend/SendGrid. Inline HTML is legacy; React Email compiles to HTML and improves maintainability.

**Verdict:** **Follow the GUIDE.** Prefer React Email for Resend-backed templates. Repository can keep simple inline HTML for minimal cases but should use React Email for any non-trivial or branded templates.

### Honeypot and form spam

**Research:** Honeypots are a recommended, free, and quick anti-bot measure (2025). Best practice: hidden field (e.g. off-screen, tabindex -1), neutral name, return 200 when triggered. Often combined with timing or other checks.

**Verdict:** **Follow the GUIDE.** Add a honeypot to contact (and other public) forms. Repository should implement this; GUIDE is correct.

### Node version (.nvmrc, engines)

**Research:** Best practice is to pin Node: **.nvmrc** for nvm/fnm users and CI; **engines** in package.json for range and (with engine-strict) enforcement. Both can be used together.

**Verdict:** **Follow the GUIDE.** Add .nvmrc at repo root (e.g. `22`). Optionally add `engines` in root package.json and use CI/node-version-file. Repository should add at least .nvmrc; GUIDE is right.

### Monorepo layout (tooling/ vs packages/)

**Research:** No strong standard that shared config must live under `tooling/` vs `packages/`. Many monorepos use `packages/` for all shared code including config.

**Verdict:** **Either is acceptable.** Repository’s `packages/eslint-config` and `packages/typescript-config` are fine. GUIDE’s `tooling/` is a naming preference. No change required unless the GUIDE is being normalized to a single convention.

### Prettier (semi: true vs false)

**Research:** Prettier defaults to `semi: true`. Both `true` and `false` are supported; consistency within the project matters most.

**Verdict:** **Stylistic.** Repository’s `semi: false` is valid. GUIDE’s `semi: true` is also valid. Prefer matching existing repo style; no need to change unless aligning docs to repo.

### Summary of verdicts

| Category | Verdict | Action |
|----------|--------|--------|
| TypeScript strict + no-explicit-any | Follow GUIDE | Add noUncheckedIndexedAccess, exactOptionalPropertyTypes; set no-explicit-any to error; reduce any in packages/scripts |
| ESLint format | **Repo better** | Keep flat config; update GUIDE to flat |
| Next.js version | **Repo better** | Keep 16; update GUIDE to 16 |
| Tailwind | **Repo better** | Keep v4 CSS-first; update GUIDE to v4 |
| Animations | Either | No change required |
| Forms | Hybrid | Keep Server Actions; add Zod in actions (GUIDE’s validation idea) |
| CMS / Analytics / Auth | Context-dependent | No single “correct”; align GUIDE to product type |
| Security headers | Follow GUIDE | Add HSTS, interest-cohort to all apps |
| metadataBase, sitemap, robots | Follow GUIDE | Add to apps that need SEO |
| Husky + lint-staged | Follow GUIDE | Add pre-commit hooks |
| Sentry | Follow GUIDE | Add for production |
| React Email | Follow GUIDE | Use for non-trivial email templates |
| Honeypot | Follow GUIDE | Add to public forms |
| .nvmrc / engines | Follow GUIDE | Add .nvmrc; optionally engines |
| tooling vs packages | Either | No change required |
| Prettier semi | Stylistic | Match repo or GUIDE as desired |

---

## Summary table (by category)

| Category | Deviations |
|----------|------------|
| **Forbidden patterns** | `any` in packages/scripts (many); internal `<a>` in 4 auth pages |
| **TypeScript** | noUncheckedIndexedAccess, exactOptionalPropertyTypes missing; no-explicit-any is warn |
| **ESLint / Prettier** | no-console not in config; semi: false |
| **Structure** | No api/, sitemap, robots, opengraph; no lib/, sections/, layout/; no metadataBase, generateStaticParams, JSON-LD |
| **Forms** | Server Actions + Supabase, no RHF/Zod/API route; no honeypot |
| **SEO / perf** | No sitemap, robots, OG image; no next/image/next/script; no canonical; no www redirect |
| **Security** | firm: no headers; others: no HSTS, no interest-cohort in Permissions-Policy |
| **next.config** | No compress, poweredByHeader, images, redirects, experimental |
| **Conventions** | .cursor/rules instead of .cursorrules; relative vs @/ imports mixed; no ComponentNameProps; no prompts/ |
| **Tooling** | No .nvmrc, Husky, lint-staged, Lighthouse CI; test vs test:e2e; no broken-link-checker |
| **Stack** | Next 16, Tailwind v4, tw-animate, Supabase, PostHog (intentional); no Drizzle |
| **Email / tests** | No React Email; minimal Playwright; no Chromatic pipeline |
| **Compliance / monitoring** | No CMP/cookie consent; no Sentry; no lib/client-config or lib/data |
| **App coverage** | No (marketing) route group; firm missing root loading/error; no Crisp/live chat |
| **Unscoped (29)** | tooling/ vs packages/; ESLint flat vs .eslintrc; no Tailwind typography/forms; metadata shape partial; no AGENTS.md; API routes without Zod; no A/B middleware; .env naming vs GUIDE |
| **Further (30)** | Revalidation only on services; Playwright path/content/data-testid; no schema components; no preconnect/useTransition/opengraph-image; no thank-you or booking/success route |

---

## Additional verification and path to perfection

This section summarizes **spot verification** of the repository (March 2026), **verdicts for Section 30 items** not covered in the main research block, and a **prioritized checklist** to bring the repo and GUIDE to a “perfection” baseline.

### Verification summary

| Check | Result |
|-------|--------|
| **metadataBase** in apps | Not set in firm layout or other app root layouts |
| **sitemap.ts / robots.ts** | Not present in any app |
| **revalidate** | Only `apps/firm/src/app/services/page.tsx` sets `revalidate = 60`; no revalidate on blog, about, home |
| **Security headers** | firm: none in next.config. agency-admin, riley-day-care, the-barber-cave: Permissions-Policy (camera, microphone, geolocation only); no HSTS; no interest-cohort |
| **.nvmrc** | Not present at repo root |
| **Root package.json** | No `engines`; no `prepare` / Husky / lint-staged scripts |
| **CI Node version** | All workflows use `node-version: "22"` (hardcoded); no `node-version-file: '.nvmrc'` |
| **firm root layout** | metadata: title, description, openGraph title/description only; no metadataBase, robots, or full OG |
| **E2E** | `apps/firm/e2e/smoke.spec.ts`: one test (home, title, h1); no console-error check; no contact/nav/mobile tests |
| **data-testid** | No `data-testid` or `testId` in app components |
| **firm middleware** | No `middleware.ts` in apps/firm |

### Section 30: research and verdicts

- **Revalidation:** ISR with `revalidate` is the standard Next.js approach for dynamic-but-cacheable pages (blog, listings). GUIDE’s guidance (e.g. blog 3600, team 86400, pricing 60) is reasonable. **Verdict: Follow GUIDE.** Add revalidate to blog (and other dynamic) pages where freshness matters; keep SSG where full static is desired.
- **Playwright and data-testid:** E2E best practice is stable selectors: `data-testid` is recommended for non-visible hooks; role-based selectors are better for accessibility alignment. **Verdict: Follow GUIDE.** Add critical-flow tests (home, contact success, nav, mobile menu) and use `data-testid` for success message and mobile menu elements so tests stay stable.
- **Schema (JSON-LD):** LocalBusiness and other schema.org types improve SEO and rich results. **Verdict: Follow GUIDE for marketing sites.** Add a schema component (e.g. LocalBusiness) in the firm app and inject JSON-LD in layout or page.
- **Preconnect/dns-prefetch:** Only needed when loading key resources from external origins (e.g. CMS CDN, critical third-party). **Verdict: Context-dependent.** Add when the firm app uses an external image/CDN that affects LCP; otherwise skip.
- **useTransition:** Recommended for expensive state updates to improve INP. **Verdict: Follow GUIDE when applicable.** Use where filterable lists or heavy UI updates exist; not required on every page.
- **opengraph-image.tsx:** Dynamic OG images (ImageResponse) are best practice for shareable pages. **Verdict: Follow GUIDE for SEO-sensitive apps.** Add at least a static or simple dynamic opengraph-image for the firm app.
- **Thank-you / booking success:** Conversion tracking and clear success URLs are best practice. **Verdict: Follow GUIDE.** Add `/thank-you` (and/or `/booking/success` if booking flow exists) and wire tracking; ensure Stripe or other success_url points to them where relevant.

### Prioritized checklist: repository

**P0 — Production / security / SEO baseline**

1. Add **security headers** to all apps: HSTS (`Strict-Transport-Security`: e.g. `max-age=31536000; includeSubDomains; preload`), and add `interest-cohort=()` to Permissions-Policy (in addition to existing camera/microphone/geolocation).
2. Set **metadataBase** in root layout of each public app (e.g. `https://yourdomain.com`) so OG and Twitter URLs resolve correctly.
3. Add **sitemap.ts** and **robots.ts** in the App Router for the firm app (and any other app that should be indexed).
4. Add **.nvmrc** at repo root (e.g. `22`) and optionally use `node-version-file: '.nvmrc'` in CI so local and CI stay aligned.

**P1 — Quality and maintainability**

5. Set ESLint **no-explicit-any** to **"error"** and fix or narrow `any` in packages/scripts (use `unknown` and narrow, or proper types).
6. Add **noUncheckedIndexedAccess** and **exactOptionalPropertyTypes** to shared tsconfig (or app tsconfigs) and fix resulting errors.
7. Add **Husky + lint-staged** for pre-commit (lint + format on staged files); add `prepare` script and document in README/CONTRIBUTING.
8. Add **Zod** validation inside existing Server Actions (contact and any other form actions).
9. Add **honeypot** to contact (and other public) forms; return 200 when honeypot is filled.
10. Add **Sentry** (or equivalent) for production error monitoring in deployed apps.
11. Add **opengraph-image** (static or dynamic) and, if needed, **JSON-LD** (e.g. LocalBusiness) for the firm app.

**P2 — E2E, email, and polish**

12. Expand **Playwright** tests: critical flows (home, contact success, nav, mobile menu); add **data-testid** for success message and mobile menu; add console-error assertion where the GUIDE specifies.
13. Prefer **React Email** for non-trivial transactional email templates.
14. Add **/thank-you** (and **/booking/success** if applicable) and wire conversion tracking.
15. Consider **revalidate** on blog (and other dynamic) pages per GUIDE table; keep services at 60 if already correct.

### Prioritized checklist: GUIDE updates

- Update GUIDE to **Next.js 16** and **Tailwind v4** (CSS-first, no tailwind.config.js).
- Update GUIDE to **ESLint flat config** (eslint.config.mjs), not .eslintrc.js.
- Optionally: add a “Supabase stack” variant (Supabase Auth, PostHog, no Sanity) so the GUIDE reflects this repo’s valid choices.
- Keep or add: metadataBase, sitemap, robots, security headers (HSTS, interest-cohort), Husky + lint-staged, Sentry, React Email, honeypot, .nvmrc, Zod in Server Actions, JSON-LD and opengraph-image for marketing sites.

---

*Generated from full codebase scan and reassessment against docs/GUIDE.md. Section 29: unscoped areas. Section 30: further assessment (second pass). No new normative documentation added; this file only records deviations. Path to perfection: verification (03/2026) and prioritized checklists for repo and GUIDE.*
