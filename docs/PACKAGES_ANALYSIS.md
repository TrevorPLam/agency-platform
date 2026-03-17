# Full Analysis: packages/

This document analyzes every package under `packages/` to determine what is not properly built out, what features are missing, and what needs further enhancement. It is based on package.json, source structure, READMEs, app/script consumption, and alignment with docs/GUIDE.md and TODO.md.

---

## Summary table

| Package | Purpose | App/script use | Not built out / Missing | Needs enhancement |
|--------|---------|----------------|------------------------|-------------------|
| **@agency/database** | Supabase clients, auth, middleware | Apps (all) | — | Single test file; no lint in package.json |
| **@agency/ui** | Shared React components, cn() | Apps (all) | No shared organisms; README links to deleted doc | Radix versions not catalog; no test script; Storybook only |
| **@agency/email** | Resend send, contact notification | Apps (firm, riley, barber, agency-admin) | React Email not adopted; inline HTML only | No tests; no preview/dev story |
| **@agency/analytics** | PostHog client + server | Apps (firm, barber, riley, agency-admin) | Server entry never imported | `any` in ServerEventProperties; no tests |
| **@agency/booking** | Booking widget, config schema | firm (/book) only | — | README says "no app consumes" but firm does; no tests |
| **@agency/design-tokens** | Style Dictionary, CSS tokens | Apps via CSS import | main/types point to dist/index.js but build outputs CSS only | Broken README links; build uses experimental-strip-types |
| **@agency/artifacts** | Artifact registry, promotion, retention | Scripts only | — | Deps use ^ not catalog; no app integration |
| **@agency/governance** | Repo metadata, properties, risk | Scripts only | validate-properties script broken (no source file) | Deps use ^; no app use; many `any` |
| **@agency/knowledge** | Knowledge capture, search, expertise | Scripts only | — | No tests; many `any` |
| **@agency/metrics** | DORA metrics collector | Declared by agency-admin but **not used** | API route mock; collector never wired; **exports ./types but tsup does not build it** | Add types to tsup entry or remove export; wire or remove dep |
| **@agency/monitoring** | Cost monitoring, alerts, optimization | Declared by agency-admin but **not used** | Cost routes use Supabase RPC, not package; no lint script | Wire to cost routes or remove dep; add lint |
| **@agency/security** | SBOM, integrity, provenance | Scripts + artifacts pkg | **tsup dts: false — no .d.ts generated; exports claim types** | Enable dts or remove type exports; deps to catalog |
| **@agency/eslint-config** | Shared ESLint | All apps | no-console missing; no-explicit-any is warn | Align with GUIDE (TODO TASK-04) |
| **@agency/typescript-config** | Shared tsconfig | All apps | noUncheckedIndexedAccess, exactOptionalPropertyTypes missing | Align with GUIDE (TODO TASK-04) |

---

## 100% confidence verification (methodology)

The following was verified to ensure full confidence in the assessment:

1. **Exports vs build:** For each package, every `exports` and `main`/`types` entry was checked against the build tool (tsup/tsc) entry points. Mismatches are documented below.
2. **Scripts:** Every `package.json` script was checked for existence of the target (e.g. `dist/validate-properties.js`); CI references to package scripts were cross-checked.
3. **Consumers:** Grep for `@agency/<pkg>` and `@agency/<pkg>/subpath` across `apps/` and `scripts/` to confirm who uses each package.
4. **Docs links:** Every path in package READMEs (e.g. `docs/architecture/...`, `docs/research/...`) was checked against the repo; only `docs/ARCHITECTURE.md` and `docs/RESEARCH.md` exist at top-level (no `docs/architecture/` or `docs/research/` subdirs with the linked filenames).
5. **Turbo:** `turbo.json` defines `build`, `lint`, `type-check`, `test`, `tokens:build`; packages that declare these scripts are run by turbo. No package-specific overrides.

### Verified issues (high confidence)

| Package | Issue | Verification |
|---------|--------|---------------|
| **design-tokens** | `main`/`types` point to `dist/index.js` and `dist/index.d.ts` | `sd.config.ts` and `build-clients.ts` output only CSS to `dist/` (primitives.css, semantic.css, component.css) and client theme dirs. No JS build. **Confirmed: main/types are invalid.** |
| **metrics** | Exports `./types` | `tsup.config.ts` has only `entry: ['src/index.ts']`. `dist/types.js` and `dist/types.cjs` are never built. **Confirmed: ./types export is broken.** No consumer imports it today. |
| **governance** | Script `validate-properties`: `node dist/validate-properties.js` | No `src/validate-properties.ts` (or .js) in the package. `tsc` builds index, schema, properties, risk, types, validation only. **Confirmed: script and CI job are broken.** (CI: `.github/workflows/governance.yml`; CONTRIBUTING references it.) |
| **security** | Exports declare `./dist/*.d.ts` | `tsup.config.ts` has `dts: false`. No declaration files are generated. **Confirmed: type exports are broken for consumers.** |
| **agency-admin** | Deps include `@agency/metrics`, `@agency/monitoring` | Grep of `apps/agency-admin/src` for `@agency/metrics` and `@agency/monitoring`: **no matches.** Confirmed unused. |
| **analytics/server** | Server entry exists | Grep of repo for `@agency/analytics/server` or `from '@agency/analytics/server'`: **no imports.** Confirmed unused. |
| **README links** | design-tokens, ui | design-tokens: links to `docs/research/RESEARCH_MARKETING_MONOREPO_DESIGN_2026.md` — file does not exist (only `docs/RESEARCH.md`). ui: links to `docs/architecture/ATOMIC_DESIGN.md` and `docs/architecture/ARCHITECTURE.md` — neither exists (only `docs/ARCHITECTURE.md`). **Confirmed broken.** |

### Build output summary

| Package | Build tool | Entry points (config) | Output (declared) | Match? |
|---------|------------|----------------------|-------------------|--------|
| database | tsup + tsc (declaration) | index, admin | dist/index, dist/admin (+ .d.ts) | Yes |
| ui | no-op | — | src (direct) | Yes |
| email | no-op | — | src (direct) | Yes |
| analytics | tsup | client, server | dist/client.mjs, dist/server.mjs (+ .d.mts) | Yes |
| booking | no-op | — | src (direct) | Yes |
| design-tokens | node (SD + script) | — | dist/*.css only | **No** (main/types claim index.js) |
| artifacts | tsup | index, registry, promotion, policies, retention | dist/*.js/.cjs/.d.ts | Yes |
| governance | tsc | all src/*.ts | dist/*.js (no validate-properties) | **No** (script missing) |
| knowledge | tsc | all src/*.ts | dist/*.js | Yes |
| metrics | tsup | index only | dist/index.* | **No** (exports ./types) |
| monitoring | tsup | index, types | dist/index.*, dist/types.* | Yes |
| security | tsup | index, sbom, integrity, provenance | dist/*.js/.cjs, **no .d.ts** | **No** (dts: false) |
| eslint-config | — | index.js, flat.cjs | direct | Yes |
| typescript-config | — | base.json, nextjs.json | direct | Yes |

---

## 1. @agency/database

**Purpose:** Type-safe Supabase client factories (server, browser, admin), middleware tenant resolution, auth helpers (createUserForTenant, assignUserToTenant, etc.).

**Consumption:** All apps; `getAdminClient` and `createSupabaseServerClient` / `createSupabaseBrowserClient` / middleware exports are used.

**Not built out / missing**
- Only one test file: `src/auth.email.test.ts`. No tests for client factories, middleware, or admin.
- `package.json` has no `lint` script (relies on root/turbo; other packages have explicit lint).

**Enhancement**
- Add unit tests for middleware (resolveTenantFromRequest, validateTenantContext) and for client creation (server/browser) where testable without live Supabase.
- Add `lint` script for consistency (`eslint .` or `eslint src`).

---

## 2. @agency/ui

**Purpose:** Shared React components (atoms, molecules), `cn()` utility, Tailwind-based design system. Storybook for development.

**Consumption:** All apps; Button, Card, Input, Label, Dialog, Sheet, DropdownMenu, ThemeToggle, Tabs, Alert, Badge, Progress, cn.

**Not built out / missing**
- **Organisms:** `src/components/organisms/index.ts` is empty (“No shared organisms yet”). No shared section-level components (e.g. Hero, FeatureGrid, Testimonials) that GUIDE or multi-app reuse would expect.
- **README** (`src/components/README.md`) references `docs/architecture/ATOMIC_DESIGN.md` and `docs/architecture/ARCHITECTURE.md` — the first does not exist (architecture docs were moved/flattened per git status); only `docs/ARCHITECTURE.md` exists. Links are broken.
- **Tests:** No `test` script; no Vitest or component tests. Storybook provides visual dev only.
- **Exports:** No `Link` or `Image` wrappers (GUIDE prefers next/link and next/image); apps use next/link and next/image directly — acceptable but could be re-exported for consistency.

**Enhancement**
- Fix README links to point to `docs/ARCHITECTURE.md` (and remove or update ATOMIC_DESIGN reference).
- Add shared organisms when a pattern repeats across two or more apps (e.g. a generic CardSection or CTA block).
- Add catalog for Radix UI deps (ui currently uses `^` for @radix-ui/*) to align with pnpm-workspace catalog.
- Consider adding a `test` script and at least smoke tests for `cn()` and one or two critical components.

---

## 3. @agency/email

**Purpose:** Send email via Resend; `sendEmail`, `sendContactNotification` with inline HTML.

**Consumption:** firm, riley-day-care, the-barber-cave (contact); agency-admin (Inngest onboarding and email sequence).

**Not built out / missing**
- **React Email:** All emails are inline HTML strings. No React Email templates (TODO TASK-15 and GUIDE recommend React Email for non-trivial templates).
- **Tests:** No test script; no unit tests for escapeHtml or send paths (could use mocks).
- **Preview:** No dev/preview story for contact or onboarding emails.

**Enhancement**
- Introduce React Email for at least contact notification (and optionally onboarding) per TODO TASK-15.
- Add a `test` script and tests for `escapeHtml` and for `sendContactNotification` (mocked Resend).
- Document env vars (RESEND_API_KEY, CONTACT_TO_EMAIL, FROM_EMAIL) in package README or docs.

---

## 4. @agency/analytics

**Purpose:** PostHog client (`initAnalytics`, `captureEvent`, `identifyUser`, `resetUser`) and server (`captureServerEvent`, etc.) with tenant awareness.

**Consumption:** Apps use **client** entry only (initAnalytics, identifyUser, resetUser in providers and auth-analytics). **Server entry is never imported** anywhere in the repo.

**Not built out / missing**
- **Server usage:** No app or script imports `@agency/analytics/server`. Server-side events (e.g. form submissions, booking success) are not captured via this package.
- **Type safety:** `ServerEventProperties` uses `[key: string]: any` (and GUIDE/README forbid `any`).
- **Tests:** No test script; no tests for client or server.

**Enhancement**
- Replace `any` in `ServerEventProperties` with `Record<string, unknown>` or a concrete type and narrow where needed.
- Either wire server analytics in (e.g. contact form success, booking success) or document that server is for future use.
- Add unit tests with mocked PostHog.

---

## 5. @agency/booking

**Purpose:** Booking widget component, BookingConfig type, Zod schema for config. Tenant-scoped booking flow.

**Consumption:** firm app (`apps/firm/src/app/book/page.tsx`) imports `BookingWidget` and `getAdminClient`; booking actions use DB.

**Not built out / missing**
- README states “No app currently consumes this package” — **outdated**; firm consumes it. Update README.
- No tests for widget or schema validation.

**Enhancement**
- Update README to state that firm app uses the package for /book.
- Add Vitest tests for `bookingConfigSchema` (valid/invalid configs) and, if feasible, a simple render test for BookingWidget.

---

## 6. @agency/design-tokens

**Purpose:** Style Dictionary v4; W3C DTCG-style tokens. Outputs primitive/semantic/component CSS and per-client theme files for Tailwind v4.

**Consumption:** Apps import generated CSS (e.g. from `dist/` or client-specific tokens). No JS import of the package in app code; build output is consumed.

**Not built out / missing**
- **package.json** declares `"main": "./dist/index.js"` and `"types": "./dist/index.d.ts"`. The build script runs `build-clients.ts` and `sd.config.ts` and produces **CSS** in `dist/` (and client theme files). There is no `dist/index.js` or `dist/index.d.ts` produced — so main/types are **stale or wrong**. The package is effectively CSS-only; no JS API is built.
- **README** links to `docs/research/RESEARCH_MARKETING_MONOREPO_DESIGN_2026.md` and “docs/architecture” — some of these paths may be gone (docs were reorganized).
- **Build:** Uses `node --experimental-strip-types` to run TypeScript; no tsc or tsup. Works but is non-standard.

**Enhancement**
- Remove or correct `main` and `types` in package.json (e.g. omit them or point to a minimal stub if a JS API is ever added). Alternatively, document that the package is CSS-only and not required as a JS dependency.
- Fix README links to current docs paths.
- Consider building with tsc or a small script instead of experimental-strip-types for consistency.
- Add Radix (or other) tokens to catalog if they are shared; design-tokens itself does not depend on Radix.

---

## 7. @agency/artifacts

**Purpose:** Artifact registry, promotion, retention, policies. Used by scripts (register-artifact, promote-artifact, cleanup-artifacts) and by CI.

**Consumption:** Scripts only; no app imports.

**Not built out / missing**
- Nothing critical; package is feature-rich and documented (README, exports).

**Enhancement**
- **Dependencies:** Use catalog for zod, semver, tsx, eslint, tsup, typescript, vitest instead of `^` to align with pnpm-workspace catalog.
- **crypto:** Dependency `"crypto": "^1.0.1"` — Node has built-in `crypto`; confirm this is the intended npm package or remove if redundant.
- Consider documenting how an app could report build artifacts (e.g. from Next.js build) if that’s a future goal.

---

## 8. @agency/governance

**Purpose:** Repository governance, metadata (PropertyManager), validation, risk assessment, schema. Used by scripts (dynamic-policies, compliance-automation, risk-assessment, metadata-workflows, manage-properties).

**Consumption:** Scripts and @agency/artifacts; no app imports.

**Not built out / missing**
- **validate-properties script:** package.json has `"validate-properties": "node dist/validate-properties.js"` and CI (governance.yml) and CONTRIBUTING run it. There is **no** `src/validate-properties.ts` (or .js). tsc builds only the six files in src/. So the script and CI job **fail** when run.
- **Types:** Many `any` in properties.ts and types.ts (GUIDE_DEVIATIONS_ANALYSIS.md). No tests.

**Enhancement**
- Add `src/validate-properties.ts` (or remove the script and CI step) so `pnpm run validate-properties --filter=@agency/governance` works.
- Replace or narrow `any` in governance (TODO TASK-04).
- Use catalog for peer typescript; add tests for PropertyManager and validation where feasible.

---

## 9. @agency/knowledge

**Purpose:** Knowledge capture, search, expertise mapping, workflows, audit, incentives. Used by scripts (capture, expertise-map, search).

**Consumption:** Scripts only; no app imports.

**Not built out / missing**
- No tests. Many `any` in knowledge package (GUIDE_DEVIATIONS_ANALYSIS.md).

**Enhancement**
- Add unit tests for search, capture, or expertise modules (mocked Octokit or file system).
- Reduce `any` usage (TODO TASK-04).

---

## 10. @agency/metrics

**Purpose:** DORA metrics (deployment frequency, lead time, change failure rate, MTTR). Provides `DORAMetricsCollector` and storage.

**Consumption:** **agency-admin** lists `@agency/metrics` as a dependency but **does not import it**. The DORA API route (`apps/agency-admin/src/app/api/metrics/dora/route.ts`) returns **hardcoded mock data** and does not use `DORAMetricsCollector`.

**Not built out / missing**
- **Broken export:** package.json exports `"./types"` (dist/types.js, dist/types.cjs, dist/types.d.ts). tsup.config.ts has only `entry: ['src/index.ts']`, so **dist/types.* are never built**. Any consumer of `@agency/metrics/types` would get a missing file. None currently import it.
- **Integration:** The metrics package is fully implemented but never wired to the app. Either wire `DORAMetricsCollector` to the DORA API route or remove the agency-admin dep.
- **Data source:** Collector expects deployments, incidents, pull requests; the current route does not fetch from DB or GitHub.
- **Tests:** Package has `test` script and vitest; no vitest.config in package; add at least one test file to confirm collector behavior.

**Enhancement**
- Fix export: either add `src/types.ts` to tsup entry so `./types` is built, or remove the `"./types"` export from package.json.
- Decide: (1) Implement real DORA pipeline (data source + wire collector to API), or (2) Keep mock and remove unused dep.
- Add tests for DORAMetricsCollector with mocked data.

---

## 11. @agency/monitoring

**Purpose:** Cost monitoring (StorageMonitor, CicdCostMonitor, CostAlertEngine, CostOptimizationEngine, CostMonitoringSystem). Tenant-aware cost metrics and recommendations.

**Consumption:** **agency-admin** lists `@agency/monitoring` as a dependency but **does not import it**. Cost API routes (`costs/summary`, `costs/metrics`, etc.) use **Supabase RPC** (e.g. `get_tenant_cost_summary`) and direct DB access, not the monitoring package.

**Not built out / missing**
- **Integration:** Same as metrics — package is implemented but not used by the app. Either wire CostMonitoringSystem to the cost routes or remove the dep.
- **Lint:** No `lint` script in package.json (unlike artifacts, security, governance).
- **Tests:** Package has `test` script; add tests for at least one engine (e.g. CostAlertEngine) with mocked storage.

**Enhancement**
- Add `lint` script (e.g. `eslint src --max-warnings 0`) for consistency.
- Align cost routes with monitoring package, or remove dependency and document architecture.
- Add unit tests for key classes.

---

## 12. @agency/security

**Purpose:** SBOM, integrity, provenance, security-manager. Used by scripts (generate-sbom, verify-sbom, scan-dependencies) and by @agency/artifacts.

**Consumption:** Scripts and artifacts; no app imports.

**Not built out / missing**
- **Type declarations:** tsup.config.ts has `dts: false`. Package exports declare `./dist/index.d.ts`, `./dist/sbom.d.ts`, etc. **No .d.ts files are generated**, so TypeScript resolution for consumers will fail or fall back to inference.
- **Dependencies:** zod and several devDependencies use `^` instead of catalog.

**Enhancement**
- Set `dts: true` in tsup (or run a separate declaration step) so exported types exist. Alternatively remove type paths from exports if the package is consumed without types.
- Standardize on catalog for zod and devDependencies.

---

## 13. @agency/eslint-config

**Purpose:** Shared ESLint config (legacy index.js and flat.cjs) for the monorepo.

**Consumption:** All apps (via eslint.config.mjs extending flat); some packages extend it.

**Not built out / missing**
- **no-console:** Not in config; GUIDE recommends `no-console: "warn"`.
- **no-explicit-any:** Set to `"warn"`; GUIDE and TODO TASK-04 require `"error"`.

**Enhancement**
- Add `no-console: "warn"` and set `no-explicit-any` to `"error"` (TODO TASK-04, TASK-04-4).
- Keep flat config as primary; document migration from index.js for any remaining consumers.

---

## 14. @agency/typescript-config

**Purpose:** Shared tsconfig base and Next.js preset.

**Consumption:** All apps extend `nextjs.json`; packages extend `base.json`.

**Not built out / missing**
- **Strict options:** base.json has `strict: true` but is missing `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes` (GUIDE and TODO TASK-04).

**Enhancement**
- Add `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes` to base.json (or a dedicated strict preset) and fix resulting errors across the repo (TODO TASK-04-1).

---

## Cross-cutting findings

### Dependency consistency
- **Catalog:** Several packages use `^` instead of `catalog:` for dependencies: artifacts (zod, semver, eslint, tsup, tsx, typescript, vitest), governance (typescript peer), knowledge (typescript peer), ui (all @radix-ui/*). Align with pnpm-workspace catalog for consistency and single-source versioning.
- **design-tokens:** main/types reference non-existent dist/index.js and dist/index.d.ts; fix or remove.

### Testing
- **With tests:** database (1 test file), artifacts (vitest), security (vitest), metrics (vitest), monitoring (vitest).
- **Without tests:** ui, email, analytics, booking, governance, knowledge. Adding even minimal tests (e.g. schema validation, utils, one component) would improve reliability.

### Documentation
- **READMEs:** design-tokens, artifacts, booking, ui (components) have READMEs; database, email, analytics, governance, knowledge, metrics, monitoring, security, eslint-config, typescript-config lack package-level READMEs. Adding short READMEs (purpose, main exports, how to use) would help onboarding.
- **Broken links:** ui/components/README and design-tokens/README reference moved or deleted docs; update paths.

### App integration gaps
- **@agency/metrics** and **@agency/monitoring** are declared by agency-admin but not used in code; DORA and cost routes use mocks or Supabase RPC. Either integrate packages or remove deps and document.
- **@agency/analytics/server** is never imported; server-side analytics is unused. Wire or document.

---

## Script and task coverage (verified)

| Package | build | lint | type-check | test | Notes |
|---------|-------|------|------------|------|--------|
| database | ✓ tsup+tsc | ✗ | ✓ | ✓ | No lint script |
| ui | no-op | ✓ | ✓ | ✗ | |
| email | no-op | ✓ | ✓ | ✗ | |
| analytics | ✓ | ✗ | ✓ | ✗ | No lint, no test |
| booking | no-op | ✓ | ✓ | ✗ | |
| design-tokens | ✓ | ✗ | ✗ | ✗ | CSS-only build |
| artifacts | ✓ | ✓ | ✓ | ✓ | |
| governance | ✓ tsc | ✓ | ✓ | ✗ | validate-properties script broken |
| knowledge | ✓ tsc | ✓ | ✓ | ✗ | |
| metrics | ✓ | ✗ | ✓ | ✓ | ./types export broken |
| monitoring | ✓ | ✗ | ✓ | ✓ | No lint script |
| security | ✓ | ✓ | ✓ | ✓ | dts: false — no .d.ts |
| eslint-config | — | — | — | — | Config only |
| typescript-config | — | — | — | — | Config only |

---

## Recommended priority

1. **P0 (correctness / alignment):** Fix design-tokens main/types; fix governance validate-properties (add source file or remove script/CI); fix metrics ./types (add to tsup entry or remove export); enable security dts or fix type exports; add no-console and no-explicit-any (and strict tsconfig) per TODO; fix README links in ui and design-tokens.
2. **P1 (integration):** Wire @agency/metrics to DORA API or remove dep; wire @agency/monitoring to cost routes or remove dep; optionally wire @agency/analytics/server for key server events.
3. **P2 (quality):** Add lint to database, analytics, monitoring; add tests to email, analytics, booking, ui; add READMEs where missing; replace `any` and align deps to catalog.
4. **P3 (features):** React Email in @agency/email; shared organisms in @agency/ui when patterns repeat; document artifact reporting from apps if desired.
