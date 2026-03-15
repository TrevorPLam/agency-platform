# T-18 verification playbook

Use this playbook to run the four Cursor behavior tests (T-18.08–T-18.11) and complete T-18. Open the specified file in Cursor, paste the prompt in Chat or Composer, then verify the AI output against the pass criteria. If it passes, check off that subtask in [TODO.md](../TODO.md); when all four pass, mark T-18 complete.

## Step-by-step

| Step        | File to open                                                                                                    | Prompt (paste as-is)                                      |
| ----------- | --------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| **T-18.08** | `supabase/migrations/003_posts.sql` (or any file under `supabase/migrations/`)                                  | Add a new table `bookings` with tenant_id and created_at. |
| **T-18.09** | `apps/agency-admin/src/app/page.tsx` or `apps/clients/riley-day-care/src/app/dashboard/page.tsx`                | Fetch the list of posts from Supabase and display them.   |
| **T-18.10** | Any `apps/**` file that has a button or card (e.g. `apps/clients/riley-day-care/src/app/(auth)/login/page.tsx`) | Style this button with our brand colors.                  |
| **T-18.11** | Any `apps/**` component file (e.g. `apps/agency-admin/src/app/page.tsx`)                                        | Add a fade-in animation when this mounts.                 |

**How to run:** Focus the editor on the file in the second column, then in Cursor Chat or Composer paste the prompt from the third column. Compare the model’s suggestion to the pass criteria in [AI_PROMPTING.md](AI_PROMPTING.md) (table under “T-18 Cursor verification checklist”). If the output matches, check the box for that step in TODO.md (T-18.08–T-18.11 at lines 1214–1217). When all four are checked, mark T-18 complete (line 1196).

## Pass/fail checklist (quick reference)

- **T-18.08** — Migration uses `public.tenant_id()` in all RLS policies (not inline JWT). Indexes use `CONCURRENTLY`. ENABLE RLS + four policies (SELECT, INSERT WITH CHECK, UPDATE USING+WITH CHECK, DELETE).
- **T-18.09** — Server Component using `createSupabaseServerClient` from `@agency/database` with the cookie store. No `useEffect`, no `'use client'` for the fetch.
- **T-18.10** — Uses `cn()` from `@agency/ui` and token-based classes (e.g. `bg-brand-primary`, `text-text-default`). No hardcoded hex, no `theme()` in CSS, no new `tailwind.config.js`.
- **T-18.11** — Uses tw-animate-css utility classes and/or `@import "tw-animate-css"` in globals.css. No `tailwindcss-animate`, no custom `@keyframes`.

---

## Reference snippets (what good looks like)

Use these as a comparison when judging Cursor’s output. The suggestion does not need to be identical, but it should follow the same patterns.

### T-18.08 — New table with RLS (bookings)

- All policies use `public.tenant_id()`, not inline `current_setting('request.jwt.claims'...)`.
- Indexes are created with `CONCURRENTLY`.
- Four policy types present: SELECT, INSERT WITH CHECK, UPDATE USING+WITH CHECK, DELETE.

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

### T-18.09 — Server Component fetching posts

- No `'use client'`. No `useEffect`. Async Server Component.
- `createSupabaseServerClient` from `@agency/database` with cookie store (e.g. `cookies()` from `next/headers`).
- Fetches and renders in the same component or passes data as props.

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

### T-18.10 — Button styled with tokens

- `cn()` from `@agency/ui`.
- Token-based classes such as `bg-brand-primary`, `text-text-default`, `border-border-default`. No hex, no `theme()` in CSS, no `tailwind.config.js`.

```tsx
import { Button, cn } from '@agency/ui'
;<Button className={cn('bg-brand-primary text-text-inverse hover:bg-brand-primary/90')}>
  Submit
</Button>
```

### T-18.11 — Fade-in with tw-animate-css

- Uses tw-animate-css utility classes (e.g. `animate-in`, `fade-in`, `duration-300`).
- If globals.css is mentioned, it should reference `@import "tw-animate-css"`.
- No `tailwindcss-animate` package. No custom `@keyframes` for the fade.

```tsx
<div className="animate-in fade-in duration-300">{/* content */}</div>
```

In `apps/*/src/app/globals.css` the app should already have:

```css
@import 'tailwindcss';
@import 'tw-animate-css';
```

If Cursor suggests adding `@import "tw-animate-css"` when it’s missing, that’s correct. It should not suggest installing `tailwindcss-animate` or defining custom keyframes.
