# AI Development Guide

Comprehensive guide for AI coding agents (Cursor, Windsurf, etc.) working in the agency monorepo. Includes repository context, prompt templates, and verification procedures.

---

## Quick Start for AI Agents

### Repository Layout

- **`apps/`** — Deployable applications. Do not import from one app into another.
  - `apps/firm` — Agency marketing site
  - `apps/agency-admin` — Internal multi-tenant dashboard (session refresh + tenant headers)
  - `apps/prospective-clients/<slug>` — Demo/test client sites (e.g. `riley-day-care`, `the-barber-cave`)
  - `apps/clients/<slug>` — Production client sites (one directory per client)
- **`packages/`** — Shared code only. All apps depend on packages; packages never depend on apps.
  - `@agency/ui` — Shared UI components (shadcn-style), `cn()` utility
  - `@agency/database` — Supabase client factories, auth helpers, tenant resolution, RLS-aware types
  - `@agency/analytics` — PostHog client/server
  - `@agency/design-tokens` — Style Dictionary v4; primitive/semantic/component + per-client tokens
  - `@agency/booking` — Embeddable booking widget types, schema (Zod), and widget component
  - `@agency/typescript-config`, `@agency/eslint-config` — Shared configs
- **`supabase/`** — Migrations and pgTAP tests. Tenant isolation is enforced via RLS; `tenant_id` in JWT `app_metadata` only.
- **`scripts/`** — `scaffold-client.ts` (run with `pnpm scaffold`) creates a new client app and updates root `tsconfig.json`.

### Critical Rules Agents Must Follow

- **Shared code** lives only in `packages/`. Never import from `apps/*` inside another app or inside a package.
- **Tenant identity** is always from **`app_metadata.tenant_id`** (UUID) in the JWT. Never use `user_metadata` for tenant; never trust tenant from request headers for auth/RLS (headers are for convenience after middleware resolution).
- **Supabase**: Use `createSupabaseServerClient` / `createSupabaseBrowserClient` from `@agency/database`; never instantiate Supabase directly in app code. Never expose the service role key or put it in `NEXT_PUBLIC_*` variables.
- **Design tokens**: Tailwind v4 uses `@theme {}` and `var(--token-name)`; no `tailwind.config.js`, no `theme()` in CSS. Client-specific tokens live in `packages/design-tokens/tokens/clients/<slug>.json` and are built to each app's `tokens/` directory.
- **Cursor/Windsurf**: Project rules in `.cursor/rules/*.mdc` and `.windsurf/rules/` encode stack and conventions; respect them (e.g. base.mdc, database.mdc, rls.mdc, frontend.mdc, tokens.mdc).

### Adding a New Client Site

1. Run **`pnpm scaffold`** from the repo root. The script will:
   - Create the app under `apps/prospective-clients/<slug>` or `apps/clients/<slug>`
   - Copy from the template `apps/prospective-clients/riley-day-care`
   - Create client token file and add a reference in root `tsconfig.json`
   - Run `pnpm install` and `pnpm tokens:build`
2. **Do not** create client apps by hand; use the scaffold so references and tokens stay in sync.
3. After scaffolding, follow the printed "Next steps" (tenant row in Supabase, Vercel project, env vars).

---

## Prompt Templates for Stack-Correct Output

Use these prompt templates with Cursor or Windsurf to get output that follows agency platform conventions.

### 1. Add a new RLS-protected table

**When:** You need a new tenant-scoped table (e.g. `bookings`, `invoices`).

**Prompt:**
```
Add a new migration for table [TABLE_NAME] with tenant_id, [other columns]. Use public.tenant_id() for all RLS policies. Enable RLS, create INDEX CONCURRENTLY on tenant_id and on (tenant_id, created_at), and add all four policies (SELECT, INSERT WITH CHECK, UPDATE USING+WITH CHECK, DELETE). Follow supabase/migrations/005_auth_tenant_id_helper.sql and 007_refactor_rls_use_tenant_id_helper.sql patterns.
```

### 2. Add a Server Component that fetches data

**When:** You need a page or component that loads data from Supabase.

**Prompt:**
```
Add a Server Component that fetches [describe data] from Supabase. Use createSupabaseServerClient from @agency/database with the cookie store. Do not use useEffect or 'use client'. If the data can be cached, add "use cache" at the top of the async function. Pass the fetched data as props to any child components.
```

### 3. Add a Client Component with a form

**When:** You need a form with inputs and submit (login, signup, booking).

**Prompt:**
```
Add a Client Component for [form purpose] with [list fields]. Use 'use client', form state, and a submit handler. Use components from @agency/ui (Input, Label, Button). Use cn() from @agency/ui for className merging. Call a Server Action on submit; the Server Action should use createSupabaseServerClient and verify tenant_id from the session (app_metadata) before any insert/update.
```

### 4. Style a button or card with design tokens

**When:** You need to style a button, card, or section with brand/semantic tokens.

**Prompt:**
```
Style this [button/card/section] using design tokens. Use cn() from @agency/ui. Use token-based classes (e.g. bg-brand-primary, text-text-default, border-border-default) from our Tailwind v4 theme — no hardcoded hex or theme() in CSS. Do not add tailwind.config.js; tokens come from @theme and :root in the app's token CSS.
```

### 5. Add an animation to a component

**When:** You need enter/exit or transition animations (e.g. dialog, sheet, dropdown).

**Prompt:**
```
Add [describe animation] to this component using tw-animate-css. Do not use tailwindcss-animate or custom @keyframes. Ensure the app's globals.css has @import "tw-animate-css". Use the tw-animate-css utility classes for the animation effect.
```

### 6. Add a Server Action with tenant check

**When:** You need a Server Action that writes to the database (e.g. create booking, update profile).

**Prompt:**
```
Add a Server Action that [describe action]. Use createSupabaseServerClient from @agency/database. Get the session and read tenant_id from session.user.app_metadata.tenant_id (never user_metadata). Every insert/update/delete must include .eq('tenant_id', tenantId) or use a query that is already tenant-scoped via RLS. Validate input with Zod if needed. Return a result object { success, error? }.
```

### 7. Add a new client token file

**When:** Onboarding a new client and need their design token file.

**Prompt:**
```
Add a new client token file for [slug] in packages/design-tokens/tokens/clients/[slug].json. Use W3C DTCG format ($type, $value). Include brand color tokens (brand-primary, brand-secondary, text-default, text-muted, background, surface) and font families. Reference semantic tokens where possible. Match the structure of tokens/clients/riley-day-care.json.
```

### 8. Run tokens build and verify

**When:** After changing tokens or adding a client, verify the build.

**Prompt:**
```
I changed design tokens. Run pnpm tokens:build from the repo root and verify that apps/clients/[slug]/tokens/[slug].css is generated (or list which client CSS files exist). Confirm the output has @theme inline {} for semantic tokens and :root {} for primitives/component tokens. If anything fails, suggest fixes per docs/TAILWIND_V4_NOTES.md and the tokens rule (outputReferencesTransformed for semantic platform).
```

### 9. Add an API route with auth

**When:** You need a Route Handler (e.g. webhook, internal API) that must be authenticated and tenant-scoped.

**Prompt:**
```
Add a GET/POST API route at app/api/[route]/route.ts that [describe behavior]. Use createSupabaseServerClient to get the session. Require authentication; if no session return 401. Read tenant_id from session.user.app_metadata.tenant_id. For any Supabase query, ensure tenant_id is in the filter (.eq('tenant_id', tenantId)) or the table is only accessible via RLS. Do not expose the service role key or use getAdminClient in this route unless the operation is explicitly admin-only and guarded.
```

### 10. Debug an RLS policy

**When:** RLS is blocking allowed access or allowing disallowed access.

**Prompt:**
```
Debug RLS for table [name]. Policies should use public.tenant_id() (see supabase/migrations/005_auth_tenant_id_helper.sql). There must be an index on tenant_id (CREATE INDEX CONCURRENTLY). Check that all four policy types exist (SELECT, INSERT WITH CHECK, UPDATE USING+WITH CHECK, DELETE) and that WITH CHECK matches USING for UPDATE. Suggest an EXPLAIN (ANALYZE, BUFFERS) query to verify the index is used. Do not use user_metadata for tenant_id.
```

---

## AI Agent Verification Procedures

### T-18 Cursor Verification Checklist

Use this checklist to verify that Cursor rules produce stack-correct suggestions without manual correction. Run each scenario in Cursor and confirm the AI output matches the pass criteria.

| Step        | File to open                                    | Prompt (paste as-is)                                      | Pass Criteria                                                                                                                                                                                                                           |
| ----------- | ----------------------------------------------- | --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **T-18.08** | `supabase/migrations/003_posts.sql`             | Add a new table `bookings` with tenant_id and created_at. | Output uses **public.tenant_id()** in all RLS policies (not inline JWT). Indexes use **CONCURRENTLY**. Full RLS checklist: ENABLE RLS, four policies (SELECT, INSERT WITH CHECK, UPDATE USING+WITH CHECK, DELETE). |
| **T-18.09** | `apps/agency-admin/src/app/page.tsx`            | Fetch the list of posts from Supabase and display them.   | Cursor suggests a **Server Component** using **createSupabaseServerClient** from `@agency/database` with the cookie store. It does **not** suggest `useEffect` or `'use client'` for the fetch.                                         |
| **T-18.10** | Any button/card file in apps/**                   | Style this button with our brand colors.                  | Cursor uses **cn()** from `@agency/ui` and **token-based classes** (e.g. `bg-brand-primary`, `text-text-default`). No hardcoded hex, no `theme()` in CSS, no new `tailwind.config.js`.                                                  |
| **T-18.11** | Any component file in apps/**                    | Add a fade-in animation when this mounts.                 | Cursor uses **tw-animate-css** utility classes and/or references `@import "tw-animate-css"` in globals.css. It does **not** use `tailwindcss-animate` or custom `@keyframes`.                                                           |

### Reference Examples

#### T-18.08 — New table with RLS (bookings)
```sql
CREATE TABLE public.bookings (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

CREATE INDEX CONCURRENTLY idx_bookings_tenant_id ON public.bookings (tenant_id);
CREATE INDEX CONCURRENTLY idx_bookings_tenant_created ON public.bookings (tenant_id, created_at DESC);

CREATE POLICY "Tenants select own bookings"
  ON public.bookings FOR SELECT
  USING (tenant_id = public.tenant_id());

CREATE POLICY "Tenants insert own bookings"
  ON public.bookings FOR INSERT
  WITH CHECK (tenant_id = public.tenant_id());

CREATE POLICY "Tenants update own bookings"
  ON public.bookings FOR UPDATE
  USING (tenant_id = public.tenant_id())
  WITH CHECK (tenant_id = public.tenant_id());

CREATE POLICY "Tenants delete own bookings"
  ON public.bookings FOR DELETE
  USING (tenant_id = public.tenant_id());
```

#### T-18.09 — Server Component fetching posts
```tsx
import { cookies } from 'next/headers'
import { createSupabaseServerClient } from '@agency/database'

export default async function Page() {
  const cookieStore = await cookies()
  const supabase = createSupabaseServerClient({
    getAll: () => cookieStore.getAll().map((c) => ({ name: c.name, value: c.value })),
    setAll: (cookiesToSet) => {
      cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
    },
  })

  const { data: posts } = await supabase
    .from('posts')
    .select('id, title, slug')
    .order('created_at', { ascending: false })

  return (
    <ul>
      {(posts ?? []).map((p) => (
        <li key={p.id}>{p.title}</li>
      ))}
    </ul>
  )
}
```

#### T-18.10 — Button styled with tokens
```tsx
import { Button, cn } from '@agency/ui'
;<Button className={cn('bg-brand-primary text-text-inverse hover:bg-brand-primary/90')}>
  Submit
</Button>
```

#### T-18.11 — Fade-in with tw-animate-css
```tsx
<div className="animate-in fade-in duration-300">{/* content */}</div>
```

---

## Common Agent Tasks

### Add a shared component
Add or edit components in `packages/ui` under `src/components/atoms/`, `molecules/`, or `organisms/` (Atomic Design). Use the lowest level that fits; promote when a pattern repeats. Use them in any app via `import { … } from '@agency/ui'`. Ensure consuming apps have `@source` in globals.css pointing at `packages/ui` so Tailwind scans the package.

### Update an existing client site
Edit under `apps/prospective-clients/<slug>` or `apps/clients/<slug>`. If you change branding, update `packages/design-tokens/tokens/clients/<slug>.json` and run `pnpm tokens:build`. If you change tenant metadata, update Supabase `tenants` (and any RLS-affected data) accordingly.

---

## Useful Commands

- `pnpm dev` — Run all apps in watch mode
- `pnpm turbo run dev --filter=@agency/<slug>` — Run one client app
- `pnpm scaffold` — Create a new client app (interactive or env-driven)
- `pnpm tokens:build` — Rebuild design tokens (including per-client CSS)
- `pnpm turbo run build --affected` — Build only changed packages/apps
- `supabase test db` — Run RLS pgTAP tests

---

_This consolidated guide replaces AI_AGENT_ONBOARDING.md, AI_PROMPTING.md, and T18_VERIFICATION_PLAYBOOK.md. All content has been combined and organized for better maintainability._
