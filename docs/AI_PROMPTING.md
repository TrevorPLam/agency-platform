# AI Prompting — High-Value Templates

Use these prompt templates with Cursor or Windsurf to get stack-correct output. Each encodes agency platform conventions (RLS, tenant_id(), CONCURRENTLY, cn(), @source, Server Components, etc.).

---

## 1. Add a new RLS-protected table

**When:** You need a new tenant-scoped table (e.g. `bookings`, `invoices`).

**Prompt:**
```
Add a new migration for table [TABLE_NAME] with tenant_id, [other columns]. Use public.tenant_id() for all RLS policies. Enable RLS, create INDEX CONCURRENTLY on tenant_id and on (tenant_id, created_at), and add all four policies (SELECT, INSERT WITH CHECK, UPDATE USING+WITH CHECK, DELETE). Follow supabase/migrations/005_auth_tenant_id_helper.sql and 007_refactor_rls_use_tenant_id_helper.sql patterns.
```

---

## 2. Add a Server Component that fetches data

**When:** You need a page or component that loads data from Supabase.

**Prompt:**
```
Add a Server Component that fetches [describe data] from Supabase. Use createSupabaseServerClient from @agency/database with the cookie store. Do not use useEffect or 'use client'. If the data can be cached, add "use cache" at the top of the async function. Pass the fetched data as props to any child components.
```

---

## 3. Add a Client Component with a form

**When:** You need a form with inputs and submit (login, signup, booking).

**Prompt:**
```
Add a Client Component for [form purpose] with [list fields]. Use 'use client', form state, and a submit handler. Use components from @agency/ui (Input, Label, Button). Use cn() from @agency/ui for className merging. Call a Server Action on submit; the Server Action should use createSupabaseServerClient and verify tenant_id from the session (app_metadata) before any insert/update.
```

---

## 4. Style a button or card with design tokens

**When:** You need to style a button, card, or section with brand/semantic tokens.

**Prompt:**
```
Style this [button/card/section] using design tokens. Use cn() from @agency/ui. Use token-based classes (e.g. bg-brand-primary, text-text-default, border-border-default) from our Tailwind v4 theme — no hardcoded hex or theme() in CSS. Do not add tailwind.config.js; tokens come from @theme and :root in the app's token CSS.
```

---

## 5. Add an animation to a component

**When:** You need enter/exit or transition animations (e.g. dialog, sheet, dropdown).

**Prompt:**
```
Add [describe animation] to this component using tw-animate-css. Do not use tailwindcss-animate or custom @keyframes. Ensure the app's globals.css has @import "tw-animate-css". Use the tw-animate-css utility classes for the animation effect.
```

---

## 6. Add a Server Action with tenant check

**When:** You need a Server Action that writes to the database (e.g. create booking, update profile).

**Prompt:**
```
Add a Server Action that [describe action]. Use createSupabaseServerClient from @agency/database. Get the session and read tenant_id from session.user.app_metadata.tenant_id (never user_metadata). Every insert/update/delete must include .eq('tenant_id', tenantId) or use a query that is already tenant-scoped via RLS. Validate input with Zod if needed. Return a result object { success, error? }.
```

---

## 7. Add a new client token file

**When:** Onboarding a new client and need their design token file.

**Prompt:**
```
Add a new client token file for [slug] in packages/design-tokens/tokens/clients/[slug].json. Use W3C DTCG format ($type, $value). Include brand color tokens (brand-primary, brand-secondary, text-default, text-muted, background, surface) and font families. Reference semantic tokens where possible. Match the structure of tokens/clients/riverside-hotel.json.
```

---

## 8. Run tokens build and verify

**When:** After changing tokens or adding a client, verify the build.

**Prompt:**
```
I changed design tokens. Run pnpm tokens:build from the repo root and verify that apps/clients/[slug]/tokens/[slug].css is generated (or list which client CSS files exist). Confirm the output has @theme inline {} for semantic tokens and :root {} for primitives/component tokens. If anything fails, suggest fixes per docs/TAILWIND_V4_NOTES.md and the tokens rule (outputReferencesTransformed for semantic platform).
```

---

## 9. Add an API route with auth

**When:** You need a Route Handler (e.g. webhook, internal API) that must be authenticated and tenant-scoped.

**Prompt:**
```
Add a GET/POST API route at app/api/[route]/route.ts that [describe behavior]. Use createSupabaseServerClient to get the session. Require authentication; if no session return 401. Read tenant_id from session.user.app_metadata.tenant_id. For any Supabase query, ensure tenant_id is in the filter (.eq('tenant_id', tenantId)) or the table is only accessible via RLS. Do not expose the service role key or use getAdminClient in this route unless the operation is explicitly admin-only and guarded.
```

---

## 10. Debug an RLS policy

**When:** RLS is blocking allowed access or allowing disallowed access.

**Prompt:**
```
Debug RLS for table [name]. Policies should use public.tenant_id() (see supabase/migrations/005_auth_tenant_id_helper.sql). There must be an index on tenant_id (CREATE INDEX CONCURRENTLY). Check that all four policy types exist (SELECT, INSERT WITH CHECK, UPDATE USING+WITH CHECK, DELETE) and that WITH CHECK matches USING for UPDATE. Suggest an EXPLAIN (ANALYZE, BUFFERS) query to verify the index is used. Do not use user_metadata for tenant_id.
```

---

*Use these prompts as-is or adapt the bracketed placeholders. They keep the AI within stack rules (Port 6543, app_metadata, cn(), @source, tw-animate-css, CONCURRENTLY, public.tenant_id()).*
