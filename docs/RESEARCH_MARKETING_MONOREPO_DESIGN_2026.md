# Marketing Monorepo Design, UI & Components — Research Summary (Mar 2026)

Up-to-date research on enterprise marketing/agency monorepos, design systems, UI elements, and component architecture. Covers standards, best practices, and implementation guidance as of Q1 2026. *Last updated after third enrichment and gap research cycle.*

**Research process (revision 1):** Enrichment: Turborepo vs Nx, Style Dictionary v4, Storybook 8 + RSC, versioning/Changesets, RSC boundaries. Gaps: delivery, CWV, Figma sync, shared UI performance, WCAG 2.2.

**Research process (revision 2):** (1) Reasoned over full doc: thin areas = token syntax (DTCG $type/$value), reduced-motion, doc tooling, CWV tactics, deprecation/codemods. Gaps = governance, i18n/RTL, agency onboarding/scaffold, adoption metrics. (2) Enrichment research: DTCG naming and types; prefers-reduced-motion and motion tokens; Storybook doc blocks/autodocs; deprecation cadence and codemods (MUI, Carbon); LCP/INP/third-party tactics. (3) Gap research: design system governance (roles, RFC, cadence); i18n and RTL (logical properties, dir, text expansion); monorepo scaffold (create-turbo, new-client flow); adoption metrics (coverage vs usage, Figma/code tracking). (4) Doc updated: enriched §2, §3a, §5, §6, §8; new §11a–§14 (governance, i18n/RTL, onboarding, adoption); checklist §15 and summary.

**Research process (revision 3):** (1) Reasoned over RESEARCH_TOPICS_2026 and this doc: enrichment = Supabase (types, migrations, clients, port 6543), Testing (Vitest, Playwright, pgTAP), Vercel monorepo (one project per app, Root Directory, turbo build --filter), Security (multi-tenant checklist, tenant from auth only, RLS, no service role in client), Forms (useActionState, Zod), Style Dictionary v3→v4 (ESM, async, codemod), Inngest (error handling, idempotency). Gaps = full Testing topic, consolidated Security section, explicit Vercel deployment. (2) Research conducted: Supabase Next.js types/migrations; monorepo testing (Vitest + Playwright); Vercel monorepo multiple apps; Next.js Server Actions/useActionState/Zod; multi-tenant security (OWASP); Style Dictionary v4 migration (codemod); Inngest error/retry/idempotency. (3) Doc updated: new §16 Testing strategy, new §17 Security checklist; §2 codemod note; §13 Vercel deployment; checklist and summary rows for Testing and Security.

---

## 1. Monorepo architecture (marketing / agency)

### Stack and tooling

| Need | Recommendation | Notes |
|------|----------------|-------|
| **Default choice** | Turborepo + pnpm | ~2M weekly downloads; simple config, fast caching, workspace + symlink control; minimal new concepts. |
| **Enterprise scale** | Nx | ~4M weekly downloads; preferred when package count grows (~30+), cross-domain imports, code generation, affected-project detection, teams 30+. |
| **Package manager** | pnpm workspaces | Catalog for versions, `workspace:*` for internal packages; run `pnpm install` from root only. |

### Turborepo vs Nx — when to choose which

**Stay with Turborepo when:** You want fast, cached builds with minimal configuration; team already uses npm/pnpm workspaces; no need for module-boundary enforcement or code generation; Next.js-first (first-party Vercel support). Best for **simplicity** and “I just need caching and task orchestration.”

**Migrate to (or start with) Nx when:** You need **module boundary enforcement** (e.g. “apps cannot import from other apps”; “data-access cannot depend on UI”); **code generation** (generators for apps, libs, components); **project graph** visualization and precise affected commands; **distributed CI** (Nx Cloud task distribution across machines); **multi-language** (Rust, Go, .NET) without requiring package.json; or **teams of 30+** where architectural governance pays off.

**Team-size guidance (2026):** 1–3 devs → workspaces + Makefile may suffice; 3–15 devs → Turborepo; 15–50 devs → Turborepo + Nx Cloud caching or full Nx; 50+ devs → Nx for governance and scale.

**Migration:** Nx is a superset of Turborepo; migration is low-friction (add `nx`, convert `turbo.json` to `nx.json`; automated tools exist). Nx can run alongside Turborepo; some teams use Nx Cloud for caching with Turborepo.

### When a monorepo pays off

- Multiple apps share code (web, API, mobile).
- Shared UI component library across multiple frontends.
- Atomic commits (UI + API changes in one PR).
- Consistent tooling (ESLint, TypeScript, Prettier) across teams.
- **Rule of thumb:** 2+ apps sharing code, or 5+ apps total.

### Benefits (cited ranges)

- **70–85%** faster build times with remote caching (CI cache hits in seconds).
- **60%** reduction in dependency conflicts.
- **40%** improvement in developer productivity.
- Nx can show **~7×** better performance in very large monorepos (smarter caching, file restoration); on mid-size (e.g. 15-package) monorepos, incremental builds ~5s (Nx) vs ~8s (Turborepo) in cited benchmarks.

### Direction: AI and agents (2026)

Monorepos are increasingly used as infrastructure for autonomous AI agents: full codebase visibility, cross-project dependencies, and coordinated changes across projects—harder to achieve with polyrepo.

**Sources:** PkgPulse (Turborepo vs Nx 2026, JavaScript Monorepos 2026), Nx (migrating from Turborepo), AskAnTech (Turborepo Enterprise 2026), Nx 2026 Roadmap, Graphite (monorepo organization).

---

## 2. Design tokens — standards and structure

### W3C Design Tokens Community Group (DTCG) — 2025.10

The Design Tokens specification reached **first stable version (2025.10)** in October 2025 (Design Tokens CG Final Report). It is a **Candidate Recommendation** and considered production-ready.

**Highlights:**

- **Cross-platform:** One token source → iOS, Android, web, Flutter.
- **Relationships:** Inheritance, aliases, component-level references.
- **Color:** Display P3, OKLCH, CSS Color Module 4.
- **Theming:** Light/dark, accessibility variants, multi-brand.

**Modules:** Resolver, Color, Format. Supported or in progress in Figma, Sketch, Framer, Tokens Studio, Penpot, Knapsack, Supernova, zeroheight. Authors include Adobe, Google, Meta, Microsoft, Figma, Shopify.

**Style Dictionary v4 alignment:** Style Dictionary v4 (led by Tokens Studio + Amazon) adds **async APIs** throughout (`buildAllPlatforms`, `extend`, `cleanAllPlatforms`, `exportPlatform` return Promises), **ESM-only** migration, and **browser compatibility**. DTCG-formatted tokens (including `$description` / comment) are supported in formatters (e.g. javascript/es6). Migration from v3: use `new StyleDictionary(cfg)` instead of `StyleDictionary.extend(cfg)`; convert to ESM; await async methods. Use `await sd.hasInitialized` (or equivalent) before accessing tokens per async API requirements. **Codemod:** `npx codemod styledictionary/4/migration-recipe` updates config and build scripts for ESM and async usage; run then fix any remaining sync calls.

**Source:** [W3C Design Tokens CG — First stable version](https://www.w3.org/community/design-tokens/2025/10/28/design-tokens-specification-reaches-first-stable-version/), [Format Module 2025.10](https://www.w3.org/community/reports/design-tokens/CG-FINAL-format-20251028/), [Style Dictionary v4 statement](https://styledictionary.com/versions/v4/statement/), Tokens Studio (Style Dictionary v4 plan), style-dictionary#1404 (DTCG format handling).

### Three-layer token hierarchy (universal best practice)

| Layer | Purpose | Example | Output / usage |
|-------|---------|---------|-----------------|
| **1. Base (primitives)** | Raw values, no semantics | `--color-blue-500`, `--spacing-4`, `--radius-md` | Palette, scales; often `:root` only. |
| **2. Semantic** | Intent, not raw values | `--color-primary`, `--color-background`, `--color-error` | What components use; enables safe refactors. |
| **3. Component** | Per-component variants | `--button-radius`, `--card-padding`, `--input-border-width` | Component-level tokens referencing semantic. |

**Rule:** Component tokens → semantic → base. Never let components reference raw primitives directly; semantic layer is what makes global changes safe.

**DTCG format (2025.10) — concrete structure:** Tokens have **`$type`** (e.g. `color`, `dimension`, `duration`, `fontFamily`, `fontWeight`, `number`, `cubicBezier`; composite: `border`, `gradient`, `shadow`, `transition`, `typography`) and **`$value`**; groups have no `$value`. Names are hierarchical with **periods** for grouping only (e.g. `colors.green.100`); reserve consistent casing. Use `$description` for documentation. See [Format Module 2025.10](https://www.designtokens.org/TR/2025.10/format/) and Tokens Studio technical specs.

**Motion and reduced-motion (a11y):** Tokenize duration, easing, and stagger. Respect **`prefers-reduced-motion: reduce`** (WCAG 2.3.3 AAA): use `@media (prefers-reduced-motion: reduce)` to disable or simplify animations (e.g. `animation: none`; `transition: none`); or expose a motion token that resolves to `0ms` when reduced. Aligns with vestibular, photosensitivity, and attention considerations. Integrate with Tailwind or animation libraries via CSS variables.

### Tailwind v4 — CSS-first tokens (2025–2026)

- **Config:** `@theme` in CSS replaces `tailwind.config.js`; tokens are CSS variables.
- **Runtime theming:** Swap via `.dark`, `[data-theme="brand"]`, or `[data-brand="client-a"]` without rebuilds.
- **Performance:** ~5× faster full builds, 100×+ faster incremental (Lightning CSS).
- **Color:** OKLCH recommended for perceptually even steps.
- **No `theme()` in CSS:** Use `var(--token-name)` only (aligns with your `.cursor/rules/tokens.mdc`).

**Motion tokens (often missed):** Duration scale (`--duration-fast`, `--duration-normal`), easing (`--ease-out`, `--ease-spring`), stagger delays. Use for hover (fast), modals (slow + spring), page transitions (slower).

**Style drift prevention:** ESLint rules to limit arbitrary values; design review; quarterly token audits; documentation on which token to use.

**Sources:** Mavik Labs (Design Tokens Tailwind v4 2026), Tailwind v4 docs, Medium (Tailwind v4 enterprise playbook).

---

## 3. Multi-tenant / multi-brand architecture

### Two main approaches

| Approach | Description | Pros | Cons |
|---------|-------------|------|------|
| **Monolithic (centralized)** | Single core component library; brand differentiation via **tokens/theming** (e.g. KAYAK). | Simpler setup, easier governance, strong core consistency. | Less brand-specific layout/behavior without extension points. |
| **Federated** | Distributed; brand-specific components or forks. | Maximum brand freedom. | Harder to govern, risk of drift. |

**Recommendation for marketing/agency:** Prefer **monolithic + token-driven theming** so one codebase serves many clients; per-client token files (e.g. `tokens/clients/[slug].json`) produce per-client CSS. Same components, different look—matches your current design-tokens + ui split.

### Multi-tenant implementation (SaaS-style)

- Tokens as platform-agnostic data (e.g. JSON/DTCG).
- React Context (or build-time injection) to distribute theme.
- Env or config to identify active tenant.
- Framework-specific theme creation (e.g. MUI theme from tokens, or Tailwind `@theme` from generated CSS).

**Outcome:** One codebase, multiple brand identities, no component duplication.

**Sources:** Design Systems Collective (multi-brand architecture), MaterialUI (design tokens & theming 2025), Qi Mu (multi-tenant theming), Medium (token-driven design system Next.js).

---

### 3a. Design system delivery — versioning and breaking changes

**Semantic versioning:** Use semver (MAJOR.MINOR.PATCH): PATCH = bug fixes, MINOR = non-breaking features, MAJOR = breaking changes.

**What counts as breaking:** *Design:* token value changes, removal/change of overridable elements, typography or component width changes causing layout shift, component removal. *Implementation:* renaming components or props, removing props, dependency version changes that break support, box-model changes affecting alignment. Non-breaking: deprecation warnings, bug fixes, new optional props, internal structure updates.

**Tooling:** **Changesets** is widely used: multi-package changelogs, automatic version bumps, documentation-first change tracking before approval. Supports “version design system without breaking client sites” via clear support windows (e.g. current + one previous major).

**Release cadence (governance):** Patch weekly (bug fixes, non-breaking token tweaks); minor biweekly (new components/props, backwards-compatible); major quarterly with a review window (e.g. 10 days) for breaking changes. Document deprecation timelines and migration paths.

**Deprecation and codemods:** Provide codemods (e.g. jscodeshift) for mechanical renames and prop migrations so consumers can upgrade without manual edits. MUI’s `@mui/codemod` and Carbon’s migration guides are references. Limitation: codemods that search for `@vendor/package` imports may miss custom wrappers (e.g. `@my-org/ui` re-exporting MUI); document or support a `packageName`/path option when offering codemods.

**Sources:** Design Systems Collective (versioning without breaking client sites, Axiom version control), Helsinki Design System, Morningstar Design System (versioning and breaking changes), MUI (deprecations, codemod), Carbon (deprecations).

---

## 4. Component library structure and patterns

### Atomic design (evolved for 2025–2026)

**Classic five layers:** Atoms → Molecules → Organisms → Templates → Pages.

**Modern refinement:** Categorize by **intent** as well as size:

- **Layout:** Grids, stacks, containers.
- **Feedback:** Alerts, toasts, loaders.
- **Navigation:** Menus, tabs, breadcrumbs.
- **Display:** Cards, badges, avatars.
- **Action:** Buttons, links, form controls.

Atoms still = primitives with strong accessibility contracts; molecules = composed groups; organisms = sections. Templates/pages stay in apps, not in the shared library.

**Enterprise baseline:** Design tokens as single source of truth; atomic, composable components; permissions, analytics, and accessibility built in; monorepo + Storybook + Jest + CI/CD.

**Reported impact:** ~46% reduction in design/development costs, ~22% faster time to market (enterprise design system studies).

**Sources:** Arttus (enterprise design systems 2025), Feature-Sliced Design (atomic design), Kolaveri (React component library Nx + atomic), Medium (atomic design 2025).

### Composition: Radix + shadcn-style patterns (2025–2026)

- **Radix primitives:** Unstyled; handle a11y, keyboard, focus. shadcn/ui builds on top with CVA for variants.
- **Compound components:** e.g. `Dialog.Root`, `Dialog.Trigger`, `Dialog.Content`, `Dialog.Close`—context shared among subcomponents.
- **Polymorphic `asChild`:** Component can render as another element for flexibility.
- **Avoid over-generalization:** Only abstract patterns you actually need; keep context consistent to avoid state bugs.

**Oct 2025 shadcn/ui:** New primitives (Field, Input Group, Button Group, Item, Empty, Kbd, Spinner) aimed at reuse across Radix, Base UI, React Aria—emphasis on composition and shared patterns.

**Sources:** Vercel Academy (shadcn core concepts, anatomy of a primitive, compound components), shadcn changelog, Paul Serban (advanced composition).

---

## 5. Accessibility (WCAG) in design systems

### Build order (four layers)

1. **Design tokens** — Color, typography, spacing, focus indicators, motion (e.g. reduced motion).
2. **Component specs** — Interactions, states, keyboard behavior, labels, help text, errors.
3. **Acceptance criteria** — Testable outcomes (e.g. “checkout completable with Tab only”).
4. **Governance** — Ongoing compliance, team standards, audits.

### Token-level a11y

- **Focus ring:** Color and width (WCAG 2.4.7); tokenize for theming and WCAG 2.2 (see below).
- **Touch targets:** Minimum 44×44px (WCAG 2.5.5).
- **Contrast:** 4.5:1 normal text, 3:1 large text (WCAG 1.4.3).
- **Motion:** Respect **prefers-reduced-motion** (WCAG 2.3.3 AAA); tokenize duration/easing and override to `0ms` or simplified motion when `prefers-reduced-motion: reduce`. See §2 motion and reduced-motion.

### High-risk components

Prioritize a11y in: forms, modals, tabs, menus, tables, video players—where most failures occur.

### Limits of the design system

The system cannot fix: third-party integrations, responsive layout choices, contextual usage, page structure, or content (e.g. alt text). Full compliance needs app-level testing and governance.

**Testing:** Mix of automated (e.g. axe-core), manual, and assistive-technology testing. Components tested atomically; products tested end-to-end. Automated tools catch ~57% of issues by volume; full coverage requires manual and AT testing.

**WCAG 2.2 (W3C Recommendation Dec 2024):** Design systems should account for **2.4.11 Focus Not Obscured (Minimum)** (AA): when a component receives keyboard focus, it must not be entirely hidden by author-created content (e.g. sticky headers, cookie banners, modals). **2.4.13 Focus Appearance** (AAA): focus indication area and contrast (e.g. ≥2 CSS px thickness or 3:1 contrast against adjacent colors). Tokenize focus ring (color, width, offset) and ensure modals/overlays do not obscure focused elements.

**Sources:** Design Systems Collective (WCAG in design systems 2026), A11Y Pros, VA.gov Design System, Greeden (accessible design system guide 2026), W3C WCAG 2.2, Understanding 2.4.11 / 2.4.13.

---

## 6. Documentation and component API standards

### Per-component documentation

- **Usage:** When and how to use.
- **Style:** Color, typography, structure, size (token-based).
- **Code:** Implementation and examples.
- **Accessibility:** Requirements and considerations.

### Definition of “done” (Carbon-style)

- **Design:** Tokenized color, type, spacing; all states (hover, focus, disabled, error, etc.); behavior (responsive, overflow); a11y (e.g. 3:1 / 4.5:1).
- **Code, kit, docs:** All complete before “Stable.”

### Naming and API

- **Components:** Short (1–2 words), user-focused.
- **Attributes:** kebab-case, semantic prefixes (`is-disabled`, `has-error`).
- **Internal styling:** e.g. BEM where applicable.
- **Common API:** Shared styling props, responsive syntax, theming, hooks/recipes.

**Documentation tooling (Storybook):** Use **doc blocks** (Meta, Canvas, Controls, Source, Stories, Primary) in MDX to attach docs to component stories; **Controls** block surfaces props automatically from arg types (exclude internal props via `parameters.docs.controls.exclude`). Enable **autodocs** with `tags: ['autodocs']` for one docs page per component; customize the default template with doc blocks. Storybook 7+ is component-centric (one sidebar entry per component). Combines usage, code, and interactive props in one place.

**Sources:** Carbon Design System (documentation, component checklist), VA.gov (naming conventions), Intouch Design System (API), Storybook (doc blocks, MDX, autodocs).

---

## 7. React Server Components and design systems (2025–2026)

- **Default:** Server Components; use `'use client'` only for interactivity, browser APIs, state, effects.
- **Tokens:** Can be resolved at build time on the server (no runtime token engine on client), improving performance and SEO.
- **Bundle:** Less JS sent to client; data access and orchestration on server.
- **Client boundary:** Add `'use client'` only to files that are **entry points** from Server Components—not every file. Props passed to Client Components must be serializable. Nest Client inside Server for optimal split: Server for static/data, Client for interactive leaves (Dialog trigger, form inputs, theme toggle).
- **Component library packaging:** Per-component entry points aid tree-shaking; RSC/SSR-safe packaging; `"use client"` at boundary only; bundle size budgets and analyzers in CI.
- **Storybook 8:** Experimental RSC support via `experimentalRSC: true` in `.storybook/main.js`; wraps RSC stories in `Suspense` for async rendering in browser. Enables documenting and testing Next.js server components in isolation. Storybook 8 also adds built-in visual testing, 2–4× faster test builds, SWC support.

**Sources:** React/Next.js docs (use client, composition), Jishu Labs (RSC 2026), Medium (React 19 design system architecture), Growin (RSC production 2026), Ruixen (UI kit to Next.js component library), Storybook (RSC, Storybook 8).

---

## 8. Marketing and landing-page performance (Core Web Vitals)

Marketing sites and landing pages are judged by **Core Web Vitals**, which affect SEO and conversions (2025: increased weight in ranking, emphasis on mobile and real-user monitoring).

| Metric | Target | Design-system relevance |
|--------|--------|---------------------------|
| **LCP** | ≤2.5s | Critical CSS, fonts, image dimensions; token-driven layout avoids late-injected styles. |
| **INP** (replaces FID) | ≤200ms | Long tasks hurt INP; Server Components and code-split client boundaries help. |
| **CLS** | ≤0.1 | Reserve space for dynamic content; set image dimensions; avoid layout shifts from unset token-based spacing. |

**Optimization:** Next-gen images (WebP/AVIF), preload critical assets, server components and static/ISR where possible, explicit sizes and `font-display`, reserve space for CTAs/forms. Design systems contribute: token-based spacing/sizing reduces arbitrary layout shifts; shared UI should be tree-shakeable and lazy-loadable so marketing pages don’t pull unused components.

**Concrete tactics:** **LCP:** Next.js `Image` with automatic optimization; preload critical fonts and CSS; edge caching and CDN; minimize/defer non-critical JS; prefer Server Components. **INP:** Reduce client bundle; debounce/throttle heavy handlers; passive listeners; `useTransition`/`Suspense`; prefer `transform`/`opacity` for animations. **Third-party scripts:** Use Next.js `Script` with `strategy="afterInteractive"` or `strategy="lazyOnload"` so analytics/chat don’t block LCP; ~45% of requests are third-party (many scripts)—deferring them avoids main-thread blocking. Architecture (edge, ISR/SSG, parallel data, minimal hydration) matters more than micro-optimizations.

**Sources:** Flowspark, OptimizeUp, AverageDevs (Next.js CWV 2025), DebugBear (landing page performance), RossLab (CWV guide), Next.js (images, third-party scripts), Chrome for Developers (script loading).

---

## 8a. Rendering flexibility for client websites

**Goal:** Maximize flexibility so each client site—or each route—can use the right rendering strategy (static, dynamic, ISR, edge, or hybrid) without locking the whole app into one mode.

### Rendering spectrum (Next.js 16 App Router)

| Strategy | When to use | Control |
|----------|-------------|---------|
| **Static (SSG)** | Build-time HTML; no per-request data. | `dynamic = 'force-static'` or no dynamic APIs; `generateStaticParams` for dynamic segments. |
| **Dynamic (SSR)** | Fresh data every request; tenant/session-dependent. | `dynamic = 'force-dynamic'` or use `cookies()`/`headers()`/`searchParams`. |
| **ISR** | Static with time-based revalidation. | `revalidate = number` (seconds); or `revalidatePath`/`revalidateTag` on demand. |
| **Partial Prerendering (PPR)** | Static shell + streamed dynamic chunks in one response. | Enable per route (`experimental_ppr = true`) or globally; wrap dynamic parts in `Suspense`. |
| **Cache Components (`use cache`)** | Component- or function-level caching; mixes static, cached, and dynamic in one page. | Next.js 16: `cacheComponents: true` in config; mark components/functions with `'use cache'`; optional `cacheLife` profiles (stale, revalidate, expire). |

**Note:** With `cacheComponents` enabled, route segment config (`dynamic`, `revalidate`) is deprecated in favor of explicit `use cache` and Suspense boundaries. Next.js then classifies content as prerendered, cached, or dynamic automatically.

### Per-route and per-component control

- **Route segment config** (page/layout/route): Export `dynamic`, `revalidate`, `runtime` so one app can have static marketing pages, dynamic dashboards, and ISR blog posts. Use `generateStaticParams` to predefine paths for static or ISR dynamic routes.
- **PPR:** Same route can send a static shell (nav, layout, above-fold) and stream dynamic slots (cart, user name, personalization) via Suspense. Best for “fast shell + fresh data where needed” (e.g. agency client home page with static hero and dynamic CTA or promos).
- **Edge vs Node:** **Middleware** runs at the edge by default (auth, redirects, tenant resolution, A/B assignment). **Route handlers** and **pages** can set `export const runtime = 'edge'` for low latency and geo-awareness; edge does not support ISR and has limited Node APIs. Use edge for tenant/subdomain routing and redirects; use Node for full ISR and server data access. Vercel: both run on Fluid compute; choose by capability, not only by performance.

### Multi-tenant and tenant-aware rendering

- **Tenant resolution first:** Resolve tenant (subdomain, path, or custom domain) in middleware or layout before rendering so every route has tenant context. Dynamic rendering is typical for tenant-scoped data; static/ISR is possible when routes are known per tenant (e.g. `generateStaticParams` over tenant list or public paths).
- **Per-tenant strategy:** Same codebase can serve: client A with mostly static + PPR for personalization; client B with fully dynamic portal; client C with static export for CDN-only hosting. Document or configure strategy per app (or per tenant) in config or env.

### Headless CMS and content-driven rendering

- **Decoupled content:** Headless CMS (Contentful, Storyblok, Sanity, Agility, etc.) lets content drive structure; rendering can stay static or ISR for most pages and dynamic only for preview/draft or personalized blocks. Reduces “everything dynamic” and improves TTFB and LCP.
- **Preview and draft:** Use dynamic rendering or draft mode for editorial preview; keep production routes static or ISR where possible. Agency benefit: content teams publish without forcing every page to be server-rendered.

### Output and hosting flexibility

- **`output: 'export'`:** Full static export (HTML/CSS/JS); no server. Use for CDN/shared hosting or clients who cannot run Node. Requires `generateStaticParams` for all dynamic routes; no ISR, no API routes, no server-only features. Images need `images: { unoptimized: true }` or external optimization.
- **`output: 'standalone'`:** Self-contained Node app for self-hosting (Docker, K8s, VM). Supports full SSR, ISR, API routes, and dynamic rendering. Use when the client hosts on their own infra.
- **Vercel (default):** Serverless + edge; full Next.js feature set. Use when the agency or client deploys on Vercel.

**Recommendation for “most flexibility”:** (1) Use App Router with **PPR or Cache Components** where available so each page can mix static and dynamic. (2) Resolve **tenant in middleware** (edge) and pass context into layouts. (3) Use **route segment config** (or `use cache` when on cacheComponents) per route so marketing pages are static/ISR and portals are dynamic. (4) Support **static export** as an opt-in build for clients that need CDN-only; use **standalone** for self-hosted Node. (5) Pair with **headless CMS** so content-driven client sites can stay mostly static/ISR with dynamic only where needed (preview, personalization).

**Sources:** Next.js (route segment config, caching, PPR, edge runtime, static export, standalone, use cache, cacheLife), Next.js 16 blog, DEV Community (PPR), Sachin Sharma (PPR patterns), Next.js Launchpad (cache components), Vercel (edge middleware), Next.js multi-tenant guides, Agency/headless CMS guides (Contento, Agility vs Contentful).
---

## 9. Figma–code token sync and handoff

**Goal:** Single source of truth for tokens between Figma and code; avoid manual drift.

**Flow:** (1) Define tokens in **Figma Variables** (native since 2023): colors, spacing, typography, radius, shadows; use modes for light/dark. (2) Export to JSON (Figma Tokens plugin or Variables API). (3) Run **Style Dictionary** to transform JSON into platform outputs (CSS variables, SCSS, etc.). (4) Consume generated CSS in apps (e.g. Tailwind `@theme` or :root).

**Automation:** GitHub Actions + Tokens Studio or Figma API (`file_variables:read`, enterprise) to sync on schedule; commit changes and open PRs for review. FigMayo and similar tools offer sync workflows. Design systems should document whether Figma or code is the source of truth and how often sync runs.

**Sources:** Medium (Figma to Style Dictionary), Jacob Qvist, TheFrontKit (Figma design tokens guide), James Ives (Figma + GitHub Actions + Style Dictionary).

---

## 10. Shared UI performance (bundle size, tree-shaking)

**ESM and exports:** Publish as ESM with clear `exports` in `package.json` so bundlers can tree-shake. Prefer **subpath exports** (e.g. `"@org/ui/button"`) or explicit entry points over a single barrel that pulls in all components.

**Import discipline:** Named imports from specific paths or main entry; avoid `import * as UI`. Keep modules **side-effect-free** at import time (no top-level DOM, timers, or logging). Mark `"sideEffects": ["*.css"]` so CSS is preserved while JS is tree-shaken.

**Peer dependencies:** Declare React/React-DOM as peer dependencies so they are not bundled. Extract CSS separately; use CSS variables and semantic tokens for theming so no runtime style injection is required on import.

**CI:** Bundle size analyzers and performance budgets in CI to guard against regressions.

**Sources:** Ruixen (React component library performance), shadcn monorepo docs, Twind (tree-shaking), Module Federation (shared tree-shaking).

---

## 11a. Design system governance

**Purpose:** Define who decides, who maintains, and how contributions flow so the system stays consistent and sustainable.

**Roles:** **Lead (single-threaded owner):** Vision, roadmap, change control; final say on disputes; approves major/minor releases and deprecations. **Maintainers (design + engineering):** Steward components, docs, and CI; review and merge; enforce a11y and performance gates. **Contributors (product teams):** Propose RFCs, file issues, open PRs, pilot new components. **Consumers:** Use components and give feedback.

**Contribution workflow:** Propose need and context → collaborate with system team → review by maintainers or governance council → approve → implement and publish. RFCs should capture context, proposal, impact, and migration path. Use tiered ownership (core team, working groups, product teams) and transparent decision records.

**Cadence:** Align semver with release cycles (e.g. patch weekly, minor biweekly, major quarterly with review window). Without explicit governance, systems drift into ad hoc decisions and invisible hierarchies; governance is the “immune system and political contract” of the design system.

**Sources:** Designilo (design system governance 2025), Design Systems Collective (governance model), Redesigning Design Systems (contribution and review), Zypsy (governance roles and RFCs), Wild Codes (governing contributions).

---

## 12. Internationalization (i18n) and RTL

**Relevance:** Agencies serving global clients need layout and tokens that support multiple languages and right-to-left (RTL) locales.

**Challenges:** Text expansion (e.g. German ~30%, French 15–20%; CJK often more compact); RTL layout; character limits; bidirectional content; list/number/date/currency formatting.

**RTL implementation:** **Mirror:** drawer/sidebar position, carousels, horizontal scrollbars, text alignment, margins/padding, reading order, directional icons (back/forward, breadcrumbs). **Do not mirror:** numbers, punctuation, physical objects, universal symbols, videos, logos, time-based charts, media controls. Use **CSS logical properties** (`margin-inline-start`, `padding-block`) and **`dir`** at root; flexbox and grid reflow with direction.

**Design tokens:** Use tokens for direction-dependent spacing and alignment where needed; Figma Variables and direction-based styles can drive LTR/RTL. Consider locale-aware typography (e.g. `clamp()` for responsive type with expansion).

**Design system scope:** Document list/number/date/currency formatting expectations; support localized URLs and relative time where components expose them. Pseudo-localization and truncation patterns (with tooltips) help before translation.

**Sources:** IntlPull (UI localization 2026), Design Code Tips (RTL design systems 2025), Smashing Magazine (localization in design systems 2025), FAST (localization), next-intl (design principles).

---

## 13. Agency onboarding and scaffolding

**Goal:** Add a new client or marketing site to the monorepo without ad hoc copy-paste; keep structure and tokens consistent.

**Monorepo scaffold:** Use **create-turbo** (`pnpm dlx create-turbo@latest`) for net-new monorepos. For adding a **new app** inside an existing repo: copy a reference app (e.g. `apps/prospective-clients/riley-day-care`), rename package and folder, add to workspace; add a **per-client token file** (e.g. `packages/design-tokens/tokens/clients/[slug].json`) and run `pnpm tokens:build`; wire app to client CSS. Document the steps in CONTRIBUTING (e.g. “Scaffold new client”).

**Automation:** A **scaffold script** (e.g. `pnpm scaffold` or `tsx scripts/scaffold-client.ts`) can generate app folder, package.json, token file stub, and layout/theme wiring from a slug or template. Reduces human error and keeps ports, env, and token paths consistent.

**White-label:** Same codebase and components; differentiation via per-client tokens and env (e.g. `NEXT_PUBLIC_TENANT_SLUG`, domain → tenant resolution). Onboarding = new token file + new app entry + deployment config (Vercel project, domain).

**Vercel monorepo deployment:** One **Vercel project per app** (e.g. one for firm, one per prospective client). Set **Root Directory** to the app path (e.g. `apps/firm`, `apps/prospective-clients/the-barber-cave`). **Build command** from repo root: `pnpm turbo build --filter=@agency/firm` (or the app’s package name). **Install command:** `pnpm install` at root. Vercel can include source outside the root when needed. Env vars are per project; do not share secrets across client apps. Isolates rollback, billing, and config per client.

**Sources:** Turborepo (create-turbo), PkgPulse (monorepo setup 2026), repo scaffold patterns (e.g. scripts/scaffold-client.ts in agency-platform), Vercel (monorepo, root directory, build from root).

---

## 14. Design system adoption and metrics

**Why measure:** Without metrics, components duplicate, tokens drift from code, and a11y erodes; data supports roadmap and ROI.

**Core metrics:** **Coverage:** Share of interface built with system components (depth). **Usage:** How often components appear across products (breadth). High usage with low coverage = many one-off custom UIs; both matter.

**Tracking:** **Design:** Figma Library Analytics (components, styles, variables; Org/Enterprise); plugins (Similayer, Design Lint); detached instances and overrides. **Code:** Repo searches, token usage, telemetry (e.g. Bit, Backlight). **Docs:** Stale or missing usage notes. Monitor: lookalike components, deprecated patterns still in use, inconsistencies across teams.

**Actions:** Use coverage and usage to prioritize new components, deprecations, and docs; demonstrate value to stakeholders; schedule audits to prevent decay.

**Sources:** Design Systems Collective (measuring adoption, Atlantic coverage analyzer), Redesigning Design Systems (measuring component usage), Figma (design system analytics, measuring value), Okoone (design system metrics).
---

## 15. Implementation checklist (high level)

**Monorepo**

- [ ] Single package manager (pnpm) and install-from-root only.
- [ ] Turborepo (or Nx at scale); remote cache for CI.
- [ ] Clear app vs package boundary; no app-to-app or package→app imports.
- [ ] Shared configs (TypeScript, ESLint) in packages.

**Design tokens**

- [ ] Three layers: primitives → semantic → component; DTCG/W3C format where applicable ($type, $value, naming).
- [ ] Build pipeline (e.g. Style Dictionary) → CSS; Tailwind v4 `@theme` / `var(--token-name)`; no `theme()` in CSS.
- [ ] Motion tokens (duration, easing, stagger); prefers-reduced-motion respected (override or media query).
- [ ] Per-client/brand token files → per-app CSS; monolithic component set.

**Components**

- [ ] Atomic structure (atoms/molecules/organisms) plus intent-based categories.
- [ ] Radix-style primitives + CVA (or equivalent) for variants; compound components where appropriate.
- [ ] Server Components by default; `'use client'` only where needed.
- [ ] Token-based styling only; no hardcoded colors/spacing in components.

**Accessibility**

- [ ] Tokens for focus, contrast, touch targets, motion.
- [ ] Component specs and acceptance criteria for a11y; high-risk components prioritized.
- [ ] Automated + manual + AT testing; governance process.

**Documentation**

- [ ] Usage, style, code, a11y for each component; definition of done.
- [ ] Naming and API conventions; common API and theming docs.

**Delivery and versioning**

- [ ] Semver for design system packages; document breaking vs non-breaking.
- [ ] Changesets (or equivalent) for changelogs and version bumps; support window (e.g. current + previous major).
- [ ] Clear policy for token/component renames and removals.

**Marketing and performance**

- [ ] LCP/INP/CLS considered for shared layout and components; explicit dimensions and reserved space.
- [ ] Critical CSS and fonts; Server Components and code-split client boundaries where appropriate.

**Rendering flexibility (client websites)**

- [ ] Per-route or per-component strategy (static, dynamic, ISR, PPR, or `use cache`) so clients can mix strategies.
- [ ] Tenant resolution in middleware/layout before render; document or configure strategy per client/app.
- [ ] Optional static export for CDN-only clients; standalone for self-hosted Node; default serverless/edge where applicable.
- [ ] Headless CMS or content-driven patterns where content should drive static/ISR with dynamic only for preview or personalization.

**Figma–code sync (optional)**

- [ ] Token source of truth defined (Figma vs code); export pipeline (Figma → JSON → Style Dictionary → CSS).
- [ ] Sync cadence and automation (e.g. GitHub Actions); review process for token PRs.

**Shared UI performance**

- [ ] ESM and `exports` map; subpath or per-component entries for tree-shaking.
- [ ] React/React-DOM as peer deps; `sideEffects` for CSS; no top-level side effects in JS.
- [ ] Bundle size budget and CI checks.

**Governance**

- [ ] Roles defined (lead, maintainers, contributors, consumers); RFC or PR workflow for changes.
- [ ] Release cadence (patch/minor/major) and deprecation timeline; codemods for breaking migrations where feasible.

**i18n and RTL (if applicable)**

- [ ] CSS logical properties and `dir`; document what mirrors in RTL vs what does not.
- [ ] Token or layout support for text expansion and locale-aware formatting.

**Agency onboarding**

- [ ] Documented steps or script to add new client (app + token file + deploy config).
- [ ] Single source of truth for ports, env, and token paths.

**Adoption and metrics**

- [ ] Coverage and usage tracked (design and/or code); audits to prevent drift and demonstrate ROI.

**Testing**

- [ ] Unit/integration (e.g. Vitest) for packages (database helpers, email, tokens); E2E (e.g. Playwright) for critical flows; RLS/database tests (e.g. pgTAP) for every tenant-scoped table.
- [ ] Monorepo: unit tests next to source; E2E in dedicated package or app `e2e/` with webServer; RLS in `supabase/tests/database/`; run `turbo run test` and `supabase test db` in CI.

**Security (multi-tenant / agency)**

- [ ] Tenant context from auth only (e.g. JWT `app_metadata.tenant_id`); never from client headers or input.
- [ ] RLS on every tenant-scoped table; policies for SELECT/INSERT/UPDATE/DELETE; pgTAP tests for cross-tenant isolation.
- [ ] Service role and API keys server-only; never in `NEXT_PUBLIC_*` or client bundles; `user_metadata` not used for tenant_id or authorization.

---

## 16. Testing strategy (unit, E2E, RLS)

**Unit/integration:** Use **Vitest** for packages (database auth helpers, email utils, token logic)—ESM-native, parallel, fast. Tests live next to source (e.g. `auth.email.test.ts`). Run per package or from root with Vitest projects.

**E2E:** Use **Playwright** for critical user flows (login, contact form, checkout). One `e2e-tests` package or app-level `e2e/`; `webServer` points at `pnpm --filter @agency/firm dev` (or target app); reuse existing server in dev, spin up in CI. Stable selectors (data-testid or role+name); isolate with test tenant or DB reset.

**RLS/database:** Use **pgTAP** (or Supabase test db) for every tenant-scoped table. Assert cross-tenant SELECT/UPDATE/DELETE/INSERT fail or return empty; positive tests that authenticated user with tenant_id can CRUD own rows. Run via `supabase test db`; update EXPECTED_TABLE_COUNT and RLS coverage list when adding tables. Required per CONTRIBUTING for new public tables.

**When to use which:** Unit for pure logic; E2E for happy paths and key flows; RLS tests for every migration that adds a public table. CI: `pnpm turbo run test` (unit) and `supabase test db` (RLS); E2E on PR or main with auth secrets. Keeps agent-generated migrations and server actions verifiable.

**Sources:** Vitest, Playwright, Supabase (testing), pgTAP; RESEARCH_TOPICS_2026 §15.

---

## 17. Security checklist (multi-tenant agency platform)

**Tenant isolation:** One vulnerability can expose all tenants. Resolve tenant only from **verified auth** (e.g. JWT `app_metadata.tenant_id`); never from `X-Tenant-Id`, query params, or user-editable `user_metadata`. Use a STABLE helper (e.g. `public.tenant_id()`) in RLS so Postgres evaluates once per query.

**RLS:** Enable on every public table; separate policies per operation (SELECT, INSERT, UPDATE, DELETE) using `tenant_id = public.tenant_id()` in USING and WITH CHECK. Index `tenant_id`; add pgTAP tests for cross-tenant isolation and positive access. Every new tenant-scoped table: migration + RLS + tests + update table count and coverage list.

**Secrets:** Service role and API keys **server-only** (Server Actions, API routes, Inngest, scripts). Never in client or `NEXT_PUBLIC_*`. Scan CI for accidental exposure. Env vars per app/project; rotate and audit.

**OWASP-style multi-tenant:** Address cross-tenant data leakage, IDOR, tenant impersonation, privilege escalation, shared-resource poisoning. Establish tenant context early (middleware/layout); validate membership; scope all queries. Default-deny; least privilege. Document in rules and CONTRIBUTING so agents and humans follow the same constraints.

**Sources:** OWASP multi-tenant guidance, Supabase RLS, RESEARCH_TOPICS_2026 §16.

---

## Summary

| Area | Best practice (2025–2026) |
|------|---------------------------|
| **Monorepo** | Turborepo + pnpm for simplicity; Nx when teams 30+, module boundaries, codegen, or distributed CI matter; migration is low-friction; remote cache. |
| **Tokens** | DTCG 2025.10–aligned; Style Dictionary v4 (async, ESM, DTCG support); three layers (base → semantic → component); CSS-first (Tailwind v4); motion tokens; per-client tokens for multi-brand. |
| **Multi-brand** | Monolithic component library + token-driven theming; one codebase, many brands. Version with semver + Changesets; define breaking vs non-breaking clearly. |
| **Components** | Atomic + intent-based; Radix-style primitives + composition; Server Components by default; `'use client'` at entry boundaries only; Storybook 8 for docs and RSC experiments. |
| **Accessibility** | Tokens + specs + acceptance criteria + governance; WCAG 2.1 AA baseline; WCAG 2.2 (2.4.11 Focus Not Obscured, 2.4.13 Focus Appearance) for focus tokenization and overlay behavior. |
| **Docs** | Usage, style, code, a11y; definition of done; consistent naming and API. |
| **Marketing/CWV** | LCP/INP/CLS-aware layout and components; explicit dimensions; Server Components and code-split client code. |
| **Rendering flexibility** | Per-route/per-component strategies (static, ISR, PPR, `use cache`); tenant-first; optional static export or standalone; headless CMS for content-driven static/ISR. |
| **Figma–code** | Optional: token sync pipeline (Figma → JSON → Style Dictionary → CSS); automate and review. |
| **Performance** | ESM, exports map, tree-shaking; peer deps; bundle size budget in CI. |
| **Governance** | Roles (lead, maintainers, contributors); RFC/PR workflow; cadence and deprecation; codemods where possible. |
| **i18n/RTL** | Logical properties, `dir`; mirror rules; tokens for direction and expansion when global. |
| **Onboarding** | Scaffold script or documented steps for new client (app + tokens + deploy); white-label via tokens; Vercel: one project per app, Root Directory, `turbo build --filter=...`. |
| **Adoption** | Coverage and usage metrics (design + code); audits; ROI and roadmap decisions. |
| **Testing** | Vitest (unit) for packages; Playwright (E2E) for critical flows; pgTAP (RLS) for every tenant-scoped table; CI runs unit + RLS; E2E on PR/main. |
| **Security (multi-tenant)** | Tenant from auth only; RLS on all tenant tables; service role never in client; pgTAP for isolation; document in rules/CONTRIBUTING. |

This research supports your existing split (design-tokens vs ui), three-tier token model, Tailwind v4 and `var()`-only usage, and Server Components–first approach. **Cycle 2 enrichment:** DTCG $type/$value and naming; reduced-motion tokens and prefers-reduced-motion; Storybook doc blocks and autodocs; deprecation cadence and codemods; concrete LCP/INP/third-party tactics. **Cycle 2 gaps closed:** Design system governance (roles, RFC, cadence); i18n and RTL; agency onboarding and scaffold; adoption metrics. **Rendering flexibility (additional research):** New §8a added for maximum flexibility when rendering client websites: Next.js 16 rendering spectrum (SSG, SSR, ISR, PPR, Cache Components / `use cache`), per-route and per-component control, edge vs Node, multi-tenant rendering, headless CMS, and output/hosting options (static export, standalone, Vercel). Continue to tighten: explicit motion token set in your tokens, style-drift lint rules, and scaffold script if not yet automated. **Cycle 3:** New §16 Testing strategy (Vitest, Playwright, pgTAP) and §17 Security checklist (multi-tenant, RLS, tenant-from-auth); §2 Style Dictionary v4 codemod; §13 Vercel deployment (one project per app, Root Directory, turbo build); checklist and summary rows for Testing and Security.
