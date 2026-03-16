# Keeping Minimal Items in App Folders and Rendering from Packages

**Purpose:** How to keep app directories thin by rendering from `packages/` and other shared locations. For AI agents and developers adding features or new apps.  
**Complements:** [ARCHITECTURE.md](./ARCHITECTURE.md), [AI_DEVELOPMENT_GUIDE.md](../guides/AI_DEVELOPMENT_GUIDE.md), `.cursor/rules/base.mdc`.

---

## 1. The rule and why it matters

**Rule (from `.cursor/rules/base.mdc`):**  
*"NEVER import from another app. Shared code goes in packages/."*

**Implications:**

- Every reusable UI primitive, molecule, and shared business logic lives in **`packages/`**.
- Apps **only** contain: routing (pages/layouts), app-specific configuration (nav links, brand name, tenant slug), and thin wrappers that **import from packages** and compose them.
- Packages **never** import from apps. The dependency arrow is one-way: **apps → packages**.

Keeping app folders minimal gives you:

1. **Single source of truth** — Fix a bug or improve a component once; all apps get it.
2. **Faster onboarding** — New client apps (via `pnpm scaffold`) get a small, consistent set of files; shared behavior comes from packages.
3. **Clear boundaries** — Easier to reason about “what is per-app” vs “what is shared.”
4. **Safer refactors** — Changing a package is done in one place; apps stay stable if they only import and configure.

---

## 2. What already lives in packages (render from here)

Apps **render from** these packages today. Prefer these over reimplementing in an app.

| Package | What it provides | Apps use it for |
|--------|-------------------|------------------|
| **@agency/ui** | `cn()`, Button, Input, Label, Card, Dialog, Sheet, Tabs, Badge, Progress, ThemeToggle, DropdownMenu | All styling primitives and molecules; no app-owned copies of buttons/cards. |
| **@agency/database** | `createSupabaseServerClient`, `createSupabaseBrowserClient`, `getAdminClient`, `resolveTenantFromRequest`, auth helpers | Server/client Supabase, middleware tenant resolution, server actions. |
| **@agency/analytics** | `initAnalytics`, track, identify, reset | Providers in each app call `initAnalytics(slug)`; no analytics logic in app code. |
| **@agency/email** | `sendEmail`, `sendContactNotification` | Contact and onboarding flows; server actions in apps call these. |
| **@agency/booking** | `BookingWidget`, config schema, `BookingSubmitAction` | Firm `/book` page renders `<BookingWidget />` and passes a server action. |
| **@agency/design-tokens** | Per-client CSS (built to `apps/<app>/tokens/<slug>.css`) | Apps import token CSS in `globals.css`; no hardcoded palettes in app. |
| **@agency/typescript-config** / **@agency/eslint-config** | Shared TS/ESLint config | Apps extend these; no duplicate config in app folders. |

**Takeaway:** Any new “shared” behavior (e.g. a new form pattern, a new layout shell, a new data helper) should be added to the appropriate **package** and then **imported** in apps. Apps do not reimplement what a package already provides.

---

## 3. What belongs in the app (minimal surface)

Apps **must** own only what is inherently app- or route-specific:

| In the app | Why it stays there |
|------------|--------------------|
| **Route tree** | `app/**/page.tsx`, `layout.tsx`, `route.ts` — Next.js routing is per-app. |
| **App-specific config** | Nav links, brand name, tenant slug, feature flags. Different per deployment. |
| **Server Actions** | Actions are tied to the app’s route and often to tenant/session; they **call** packages (e.g. `getAdminClient()`, `sendContactNotification()`), not the other way around. |
| **Minimal layout shell** | Root layout composes Providers + (optional) shared layout from package + `{children}`. Layout is the place that wires app config (e.g. slug) into shared components. |
| **Thin client wrappers** | e.g. `Providers` that call `initAnalytics(slug)` — the slug is app-specific; the analytics API lives in the package. |

**Not in the app (or only as re-exports):**

- Copies of Button, Card, Input, etc. → use `@agency/ui`.
- Supabase client creation or admin access → use `@agency/database` / `@agency/database/admin`.
- Email sending, contact notification logic → use `@agency/email`.
- Design tokens (hex, spacing scales) → use design-tokens build output; style with token classes.

---

## 4. Patterns to keep app folders minimal

### 4.1 Config-driven layout from a package

**Idea:** A shared layout component lives in a package and takes **config** (nav links, logo text, optional footer links). The app only provides that config and the route tree.

**Example (conceptual):**

```tsx
// packages/ui or packages/layout (new) — shared
export function MarketingShell({
  brandName,
  navLinks,
  children,
}: {
  brandName: string
  navLinks: { href: string; label: string }[]
  children: React.ReactNode
}) {
  return (
    <>
      <header className="…">
        <Link href="/">{brandName}</Link>
        <nav>{navLinks.map(…)}</nav>
        <ThemeToggle />
      </header>
      <main className="flex-1">{children}</main>
      <footer>…</footer>
    </>
  )
}
```

```tsx
// apps/firm/src/app/layout.tsx — minimal
import { MarketingShell } from '@agency/ui'  // or @agency/layout

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/services', label: 'Services' },
  …
]

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <MarketingShell brandName="Agency" navLinks={navLinks}>
            {children}
          </MarketingShell>
        </Providers>
      </body>
    </html>
  )
}
```

**Current state:** Each app has its own `SiteHeader` and `SiteFooter` with similar structure but different links and brand name. Moving the **structure** into a package and passing **config** from the app keeps apps minimal and avoids duplication.

---

### 4.2 Shared Providers from a package

**Idea:** Analytics (and other global client setup) lives in the package; the app only passes the tenant/site slug.

**Current state:** Each app has `components/providers.tsx` that does:

```tsx
'use client'
import { initAnalytics } from '@agency/analytics'
export function Providers({ children }) {
  useEffect(() => { initAnalytics('agency') }, [])  // or 'riley-day-care', etc.
  return <>{children}</>
}
```

**More minimal:** A shared wrapper in `@agency/analytics` (e.g. `AnalyticsProviders`) that takes `slug: string` and wraps children. The app then has:

```tsx
// apps/firm/src/components/providers.tsx
export { AnalyticsProviders as Providers } from '@agency/analytics'
// and in layout, use <Providers slug="agency">{children}</Providers>
```

Or the app layout imports once from the package and passes the slug from env or a constant. That way the app folder holds no analytics logic—only the slug config.

---

### 4.3 Shared form UI, app-owned server action

**Idea:** The **form component** (inputs, labels, submit button, client validation) lives in a package; the **submit behavior** is a Server Action passed in from the app (because it touches app-specific tenant/DB/email).

**Current state:** Contact form is duplicated (firm, riley-day-care, the-barber-cave): same structure, different `submitContactForm` action. The action uses `getAdminClient()` and `sendContactNotification()` from packages.

**More minimal:**

- **Package:** e.g. `@agency/forms` or `@agency/ui` exports `ContactFormView` (or `ContactForm`) that accepts `action: (formData: FormData) => Promise<{ success: boolean; message: string }>` and optional props (placeholder text, class names).
- **App:** One server action file that calls `getAdminClient()` and `sendContactNotification()`; the page imports `ContactFormView` from the package and passes that action.

Result: no duplicated form markup or validation logic in app folders; only the action and route live in the app.

---

### 4.4 Route = data + shared component

**Idea:** The **page** in the app is a thin wrapper: it fetches data (or uses `use cache` / server APIs) and passes it to a **presentation component** from a package.

**Example:**

```tsx
// apps/firm/src/app/services/page.tsx
import { ServicesPageContent } from '@agency/ui'  // or @agency/sections

export const revalidate = 60

export default async function ServicesPage() {
  const services = await getServices()  // or static list
  return <ServicesPageContent services={services} />
}
```

The list of services and revalidation are app/route-specific; the layout and styling of the section live in the package. Apps stay minimal by not owning the heavy JSX.

---

### 4.5 Tailwind scanning packages (so app CSS stays minimal)

**Rule (from `.cursor/rules/base.mdc` and frontend.mdc):**  
*"Apps using Tailwind MUST include the @source directive in globals.css pointing at packages/ui (and any other shared UI) so Tailwind v4 scans those paths."*

So:

- **Packages** own the class names used by shared components (e.g. `@agency/ui`).
- **App `globals.css`** only: `@import 'tailwindcss'`, `@import 'tw-animate-css'`, `@source` to `packages/ui`, optional token import, dark overrides, reduced-motion.
- No duplicate utility sets or component styles in the app; production build still purges correctly because `@source` pulls in package class usage.

---

## 5. What the scaffold already keeps minimal

The scaffold (`pnpm scaffold`) creates a **minimal** new client app:

- **From template:** One root layout, one home page, middleware, `(auth)` group (login, signup, callback), dashboard page, `providers.tsx`, `auth-analytics.tsx`, and a client token file. It does **not** copy every page from the template (e.g. about, blog, programs, contact are not scaffolded by default).
- **Dependencies:** New app depends on `@agency/ui`, `@agency/database`, `@agency/analytics`, etc., and uses them from day one.

So “minimal app” is already the intent: small set of app-specific files, everything else from packages. Adding a new page or feature should follow the same idea—implement shared behavior in a package, then **render from packages** in the app via imports and config.

---

## 6. Checklist for “minimal app, render from packages”

When adding or changing an app:

1. **Shared UI** → Implement or extend in `packages/ui` (atoms/molecules/organisms); use in app via `import { … } from '@agency/ui'`. Do not add a parallel `components/ui/` in the app unless it’s truly app-only (and prefer pushing shared pieces to the package).
2. **Shared behavior** (auth, email, analytics, DB access) → Use `@agency/database`, `@agency/email`, `@agency/analytics`; app only wires config (slug, env) and route/action entry points.
3. **Layout shell** → Prefer a config-driven layout from a package (e.g. `MarketingShell` with `brandName` and `navLinks`); app layout only provides config and `{children}`.
4. **Forms** → Shared form **view** in a package; app provides the Server Action that calls package APIs.
5. **Tailwind** → No duplicate component styles in app; use `@source` so Tailwind scans `packages/ui` (and any other shared UI).
6. **No app-to-app imports** → Never `import … from '../other-app'` or `@/apps/…`; shared code goes in a package and is imported from there.

---

## 7. Summary

| Goal | How |
|------|-----|
| Keep app folders minimal | Put shared code in `packages/`; apps only hold routes, config, and thin wrappers that import from packages. |
| Render from packages | Use `@agency/ui`, `@agency/database`, `@agency/analytics`, `@agency/email`, `@agency/booking`, design-tokens output; avoid reimplementing in the app. |
| Enforce the boundary | Rule: “NEVER import from another app. Shared code goes in packages.” Packages never depend on apps. |
| Reduce duplication | Config-driven layout and shared form view in packages; app supplies slug, nav links, and server actions. |
| Keep styling in one place | Token CSS from design-tokens; component classes in `packages/ui`; app globals only import and `@source` packages. |

Applying this keeps client app folders small and consistent while rendering behavior and UI from a single, package-based source of truth.
