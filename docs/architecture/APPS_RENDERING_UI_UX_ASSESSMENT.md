# Apps: Site Rendering & UI/UX — 100% Confidence Assessment

**Purpose:** Verified, evidence-based analysis of `apps/` for site rendering and UI/UX. Every claim is traceable to file paths and line-level checks.  
**Scope:** firm, agency-admin, prospective-clients/riley-day-care, prospective-clients/the-barber-cave.  
**Last verified:** Build and grep/glob run; CODEBASE_ANALYSIS.md and tokens/build paths cross-checked.

---

## 1. Verification method

- **File discovery:** `Glob` over `apps/**` (92 files found); all `layout.tsx`, `page.tsx`, `globals.css`, and `@/components/*` imports checked.
- **Imports:** Grep for `@/components/`, `@agency/ui`, `'use client'`, `notFound`, `Suspense`, `loading.tsx`, `error.tsx`, `revalidate`, `generateMetadata`, middleware.
- **Token paths:** `packages/design-tokens/scripts/build-clients.ts` read; output dir is `apps/<app>/tokens/<slug>.css` (app root). App `globals.css` import paths resolved from `src/app/globals.css`.
- **Build:** `pnpm run build --filter=@agency/agency-admin` attempted; failed at `@agency/database` (types.ts not a module). Agency-admin app code was not compiled; cost dashboard `@/components/ui/*` imports were not exercised by build.

---

## 2. Rendering — verified facts

### 2.1 Server vs client

| App | Server Components | Client-only files (`'use client'`) |
|-----|--------------------|-----------------------------------|
| **firm** | All pages, layout, SiteHeader, SiteFooter | `src/components/providers.tsx`, `src/app/contact/contact-form.tsx` |
| **agency-admin** | Root layout, dashboard page, costs page (wrapper), metrics page (wrapper), metrics layout | `src/components/providers.tsx`, `src/components/costs/cost-management-dashboard.tsx`, `src/components/metrics/dora-metrics-dashboard.tsx` |
| **riley-day-care** | All pages except login/signup; layout, SiteHeader, SiteFooter | `src/components/providers.tsx`, `src/components/auth-analytics.tsx`, `src/app/contact/contact-form.tsx`, `src/app/(auth)/login/page.tsx`, `src/app/(auth)/signup/page.tsx` |
| **the-barber-cave** | All pages, layout, SiteHeader, SiteFooter | `src/components/providers.tsx`, `src/components/auth-analytics.tsx`, `src/app/contact/contact-form.tsx` |

- **Async params:** `apps/firm/src/app/blog/[slug]/page.tsx` and `apps/prospective-clients/riley-day-care/src/app/blog/[slug]/page.tsx` use `params: Promise<{ slug: string }>` and `await params` (Next.js 16).
- **generateMetadata:** Only the two blog `[slug]` pages export `generateMetadata`; all other metadata is static `metadata` on layout or page.
- **revalidate:** Only `apps/firm/src/app/services/page.tsx` exports `revalidate = 60` (ISR).
- **Cache-Control:** Only `apps/agency-admin/src/app/api/metrics/dora/route.ts` sets `Cache-Control: public, s-maxage=300, stale-while-revalidate=600`.

### 2.2 Loading, error, and Suspense

- **loading.tsx:** None in any app (glob and grep).
- **error.tsx:** None in any app.
- **notFound():** Used in both blog `[slug]` pages when post is missing (`if (!post) notFound()`).
- **Suspense:** Only in `apps/prospective-clients/riley-day-care/src/app/(auth)/login/page.tsx`: wraps `LoginForm` (which uses `useSearchParams()`) with fallback `"Loading…"`.

### 2.3 Data fetching

- **Server:** firm Book page uses `getAdminClient()`; agency-admin dashboard uses `createSupabaseServerClient(cookies())` and `.from('posts').select()`. No `useEffect` + fetch in Server Components.
- **Client:** Cost dashboard and DORA dashboard use `useEffect` + `fetch()` to API routes; appropriate for client-only dashboards.

---

## 3. Layout and shell — verified

| App | Root layout location | Header/Footer | Font | Body classes |
|-----|------------------------|---------------|------|--------------|
| **firm** | `apps/firm/src/app/layout.tsx` | SiteHeader, SiteFooter (relative import `../components/`) | None (no `next/font`) | `flex min-h-screen flex-col` |
| **agency-admin** | `apps/agency-admin/src/app/layout.tsx` | Inline header with ThemeToggle only | None | `min-h-screen bg-white dark:bg-[var(--color-semantic-background-primary)]` |
| **riley-day-care** | `apps/prospective-clients/riley-day-care/src/app/layout.tsx` | SiteHeader, SiteFooter (`@/components/`) | `Inter` from `next/font/google` | `${inter.className} flex min-h-screen flex-col` |
| **the-barber-cave** | `apps/prospective-clients/the-barber-cave/src/app/layout.tsx` | SiteHeader, SiteFooter (`@/components/`) | `Inter` from `next/font/google` | `${inter.className} flex min-h-screen flex-col` |

- **Nested layout:** Only `apps/agency-admin/src/app/(dashboard)/metrics/layout.tsx`; it returns `children` with no wrapper.
- **firm** has no `middleware.ts` (file not found in `apps/firm`).

---

## 4. Styling and design tokens — verified

### 4.1 Global CSS (all four apps)

- Every app has `@import 'tailwindcss'`, `@import 'tw-animate-css'`, and `@source` to `packages/ui` (path from each app’s globals.css). No `theme()` or `tailwind.config.js` in apps.
- Dark: `@custom-variant dark (&:is(.dark *))` and `:root .dark { ... }` semantic overrides (oklch) in firm, agency-admin, riley-day-care, the-barber-cave.
- `prefers-reduced-motion` block present in all four `globals.css` files.

### 4.2 Token imports — critical path mismatch

- **Design-tokens build output** (`packages/design-tokens/scripts/build-clients.ts`): writes to `apps/<app>/tokens/<slug>.css` (e.g. `apps/prospective-clients/riley-day-care/tokens/riley-day-care.css`). Path is at **app root**, not under `src/`.
- **Riley Day Care** `apps/prospective-clients/riley-day-care/src/app/globals.css` line 9: `@import '../../tokens/riley-day-care.css';`  
  From `src/app/globals.css`, `../../` resolves to `src/`. So the import expects `src/tokens/riley-day-care.css`. **No such path exists**; build outputs to `tokens/riley-day-care.css` at app root. Correct import would be `../../../tokens/riley-day-care.css`.
- **The Barber Cave** `apps/prospective-clients/the-barber-cave/src/app/globals.css` line 9: `@import '../../tokens/the-barber-cave.css';`  
  Same issue: expects `src/tokens/the-barber-cave.css`; build outputs to app root `tokens/the-barber-cave.css`. Correct import would be `../../../tokens/the-barber-cave.css`.
- **firm** and **agency-admin** do not import any client token CSS file. Firm uses raw Tailwind (e.g. slate); agency-admin uses a mix of raw and semantic vars.

**Conclusion:** Prospective-client apps have a **token import path bug**. Until fixed, client token CSS from `tokens:build` will not be applied unless the build is run and the import path is corrected (or the build is changed to output under `src/tokens/`).

---

## 5. UI components — verified

### 5.1 Source of truth

- **@agency/ui** (`packages/ui/src/index.ts`): Exports `cn`, Badge, Button, Input, Label, Progress, Card*, Dialog*, Sheet*, DropdownMenu*, ThemeToggle, Tabs*. **Does not export** Alert, AlertDescription, AlertTitle.
- **apps/agency-admin:** No directory `apps/agency-admin/src/components/ui/` (glob and file list). No files matching `**/ui/*.tsx` under agency-admin.

### 5.2 Broken imports in agency-admin

- **File:** `apps/agency-admin/src/components/costs/cost-management-dashboard.tsx` (lines 4–9).
- **Imports:**  
  `Card, CardContent, CardDescription, CardHeader, CardTitle` from `@/components/ui/card`  
  `Tabs, TabsContent, TabsList, TabsTrigger` from `@/components/ui/tabs`  
  `Badge` from `@/components/ui/badge`  
  `Button` from `@/components/ui/button`  
  `Alert, AlertDescription, AlertTitle` from `@/components/ui/alert`  
  `Progress` from `@/components/ui/progress`
- **Resolution:** `@/*` in agency-admin tsconfig extends `@agency/typescript-config/nextjs.json` which sets `"@/*": ["./src/*"]`, so `@/components/ui/*` resolves to `src/components/ui/*`. That directory **does not exist**. Alert is also not in `@agency/ui`.
- **Conclusion:** The cost management dashboard has **broken imports**. Build was not run to completion (failed at @agency/database), so this would surface as missing modules when agency-admin is built successfully.

### 5.3 All other apps

- firm, riley-day-care, the-barber-cave use only `@agency/ui` for shared UI (and local components like SiteHeader, ContactForm). No `@/components/ui` usage.
- **agency-admin** DORA metrics dashboard (`apps/agency-admin/src/components/metrics/dora-metrics-dashboard.tsx`) imports Card, Badge, Progress, Tabs from `@agency/ui` — correct.

---

## 6. Middleware — verified

| App | File | Behavior |
|-----|------|----------|
| **firm** | No middleware | — |
| **agency-admin** | `apps/agency-admin/src/middleware.ts` | `createSupabaseServerClient` + `getUser()`; `resolveTenantFromRequest`; sets `x-tenant-id`, `x-tenant-slug`, `x-tenant-source`. No auth redirects. |
| **riley-day-care** | `apps/prospective-clients/riley-day-care/src/middleware.ts` | Same tenant headers; **auth:** `/dashboard` without user → redirect to `/login?redirect=...`; `/login` or `/signup` with user → redirect to `/dashboard` (callback excluded). |
| **the-barber-cave** | `apps/prospective-clients/the-barber-cave/src/middleware.ts` | **Only** `resolveTenantFromRequest` and tenant headers. No auth checks, no redirects to /login or /dashboard. |

**Note:** `docs/architecture/CODEBASE_ANALYSIS.md` §3.4 states The Barber Cave middleware "protects /dashboard" and "redirects /login, /signup to /dashboard". **Current repo:** the-barber-cave middleware does not implement those redirects; it only sets tenant headers. Either the doc is stale or the middleware was simplified.

---

## 7. Providers and analytics — verified

- **firm:** `Providers` wraps children and calls `initAnalytics('agency')` in useEffect.
- **agency-admin:** `Providers` wraps children and calls `initAnalytics('agency-admin')` in useEffect. **Correction:** CODEBASE_ANALYSIS §3.2 stated "initAnalytics is never called" and "no Providers wrapper" — **incorrect**. Layout does use `<Providers>` and providers call `initAnalytics('agency-admin')`.
- **riley-day-care:** Providers call `initAnalytics('riley-day-care')` and render `AuthAnalytics`.
- **the-barber-cave:** Providers call `initAnalytics('the-barber-cave')` and render `AuthAnalytics`.

---

## 8. Convention compliance (cursor rules)

- **Default exports:** Only page/layout components use `export default` (grep over apps; all matches are page.tsx or layout.tsx). Non-page components use named exports.
- **theme() / tailwind.config:** No `theme()` in app CSS; no `tailwind.config.js` in apps.
- **Cross-app imports:** No imports from one app into another (grep for `apps/firm`, `apps/agency-admin`, `apps/prospective` in apps returned no matches).

---

## 9. Summary: high-confidence findings

| # | Finding | Confidence | Evidence |
|---|---------|------------|----------|
| 1 | No `loading.tsx` or `error.tsx` in any app | 100% | Glob + grep |
| 2 | Only firm uses ISR (`revalidate = 60` on services) | 100% | Grep |
| 3 | Only riley-day-care login uses Suspense (useSearchParams) | 100% | Read login/page.tsx |
| 4 | firm has no middleware | 100% | File not found |
| 5 | the-barber-cave middleware does not protect /dashboard or redirect auth | 100% | Read middleware.ts |
| 6 | Agency-admin cost dashboard imports from non-existent `@/components/ui/` and uses Alert (not in @agency/ui) | 100% | Glob + packages/ui index + tsconfig paths |
| 7 | Prospective-client token CSS import path is wrong (../../ vs ../../../) relative to build output | 100% | build-clients.ts output path vs globals.css import |
| 8 | Agency-admin has Providers and initAnalytics | 100% | Read layout.tsx and providers.tsx |
| 9 | All apps use Server Components by default; client boundaries limited to providers, forms, dashboards, auth pages | 100% | Grep 'use client' + file list |

---

## 10. Recommended next steps

1. **Fix agency-admin cost dashboard:** Switch imports to `@agency/ui` for Card, Tabs, Badge, Button, Progress. Add Alert (and AlertDescription, AlertTitle) to `@agency/ui` or replace alert usage with an existing pattern (e.g. Card + destructive text).
2. **Fix prospective-client token imports:** In both riley-day-care and the-barber-cave `globals.css`, change `@import '../../tokens/...'` to `@import '../../../tokens/...'` so the path resolves to app root `tokens/` where design-tokens outputs.
3. **Optional:** Add `loading.tsx` (and optionally `error.tsx`) for key routes (e.g. dashboard, costs) to improve UX.
4. **Doc:** Update CODEBASE_ANALYSIS.md §3.2 (agency-admin Providers/analytics) and §3.4 (the-barber-cave middleware behavior) to match current code.
