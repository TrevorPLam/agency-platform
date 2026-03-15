# Agency Platform — Windsurf Rules

## Project purpose

Multi-client marketing agency monorepo. Each client is isolated by tenant_id at the
database layer (Row-Level Security). Shared code lives in packages/. Client-specific
code lives in apps/clients/[slug]/.

## Stack

- Next.js 16.1 with Turbopack (default, no flags needed)
- React 19, TypeScript 5 strict mode
- Tailwind CSS v4 (CSS-first, @import "tailwindcss", @theme {} for tokens)
- Style Dictionary v4 (ESM-only, async, W3C DTCG format, sd.config.ts)
- pnpm 10 (catalog: protocol for versions, workspace:\* for internal packages)
- Turborepo 2.7 (turbo.json defines the task pipeline)
- Supabase (PostgreSQL + Auth + Storage) — Port 6543 (Supavisor), not 5432
- shadcn/ui components in packages/ui
- Inngest for background jobs (not BullMQ, not after())

## Absolute prohibitions

1. Do NOT write `any` type. Use `unknown` and narrow, or define the type.
2. Do NOT use `user_metadata` for tenant_id. Always use `app_metadata`.
3. Do NOT import from one app into another. Use packages/.
4. Do NOT put SUPABASE*SERVICE_ROLE_KEY in any NEXT_PUBLIC* variable.
5. Do NOT use tailwind.config.js — Tailwind v4 uses CSS @theme {} only.
6. Do NOT use theme() in CSS files — use var(--token-name) instead.
7. Do NOT add 'use client' unless genuinely needed for browser APIs or interactivity.
8. Do NOT call Supabase directly from app code — always use @agency/database.
9. Do NOT connect to Supabase via Port 5432 — always use Port 6543.

## When generating RLS migrations

- Always: ENABLE ROW LEVEL SECURITY
- Always: CREATE INDEX CONCURRENTLY on tenant_id
- Always: CREATE INDEX CONCURRENTLY on (tenant_id, created_at)
- Always: all four policies (SELECT, INSERT WITH CHECK, UPDATE USING+WITH CHECK, DELETE)
- Use public.tenant_id() in policy expressions (see supabase/migrations/005_auth_tenant_id_helper.sql): USING (tenant_id = public.tenant_id())

## When generating design token CSS

- Primitives go in :root {} — NO utility classes
- Semantic tokens go in @theme inline {} — generates cascade-overridable utilities
- Component tokens go in :root {} — consumed via var() not utility classes
- Never put primitives in @theme — it generates redundant utilities for every scale step
- Semantic platform must use outputReferencesTransformed so var(--token-name) is preserved

## Running tasks

- pnpm dev — starts all apps in watch mode
- pnpm turbo run dev --filter=@agency/riley-day-care — starts one app
- pnpm tokens:build — compiles design tokens to CSS
- supabase test db — runs pgTAP RLS isolation tests
- supabase start — starts local Supabase (requires Docker)
