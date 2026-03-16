# Rendering strategy

This document describes how rendering is chosen per app and per route in the agency platform, and how to use Next.js 16 options for static, dynamic, ISR, and (optionally) PPR or Cache Components. For the full research on rendering flexibility, see [docs/RESEARCH_MARKETING_MONOREPO_DESIGN_2026.md](./RESEARCH_MARKETING_MONOREPO_DESIGN_2026.md) §8a.

---

## Default behaviour

- **Apps** use the Next.js 16 App Router. No dynamic APIs (e.g. `cookies()`, `headers()`, `searchParams` in a page) → route is **static** at build time.
- **Tenant resolution** happens in **middleware** (or layout) before rendering, so every route has tenant context when needed. Middleware runs at the edge by default.
- **Per-route control** is available via route segment config (`dynamic`, `revalidate`, `runtime`) or, when using Next.js 16 Cache Components, via `'use cache'` and Suspense boundaries.

---

## When to use which strategy

| Strategy | Use when |
|----------|----------|
| **Static (SSG)** | Build-time HTML; no per-request data. Default when the page uses no dynamic APIs. |
| **Dynamic (SSR)** | Fresh data every request; tenant- or session-dependent (e.g. dashboards, user-specific content). |
| **ISR** | Static with time-based revalidation (e.g. marketing pages that can be revalidated every N seconds). |
| **PPR** (optional) | Static shell + streamed dynamic chunks in one response; good for “fast shell + fresh data where needed”. |
| **Cache Components** (optional) | Next.js 16 `cacheComponents: true` and `'use cache'` for component- or function-level caching. |

Use **route segment config** on the page or layout: `export const dynamic = 'force-static'` or `'force-dynamic'`, or `export const revalidate = 60` (seconds) for ISR. For PPR or Cache Components, see the Next.js 16 docs and the research doc §8a.

---

## Tenant resolution

Tenant is resolved in **middleware** (or in layout when needed) so that downstream routes can assume tenant context. Dynamic rendering is typical for tenant-scoped data; static or ISR is possible when routes are known per tenant (e.g. `generateStaticParams` over a tenant list or public paths). Document or configure the strategy per app (or per client) in config or env when you need different behaviour per deployment.

---

## Example: ISR on a marketing page

To revalidate a static marketing page every 60 seconds, add to the page module:

```ts
export const revalidate = 60
```

See `apps/firm/src/app/services/page.tsx` for a working example. No need to change every route; use this as the pattern for new client sites that benefit from ISR.

---

## Optional: PPR and Cache Components

- **PPR:** Enable per route or globally (`experimental_ppr: true`), then wrap dynamic parts in `Suspense`. Same route can serve a static shell and stream dynamic slots.
- **Cache Components (Next.js 16):** In `next.config.ts`, set `cacheComponents: true` and use `'use cache'` on components or functions. Route segment config (`dynamic`, `revalidate`) is deprecated in favor of `use cache` and Suspense when using this mode. See Next.js docs and research §8a for details.

---

## Output and hosting

- **Vercel (default):** Serverless + edge; full Next.js feature set.
- **Static export:** `output: 'export'` for CDN-only hosting; requires `generateStaticParams` for all dynamic routes; no ISR or API routes.
- **Standalone:** `output: 'standalone'` for self-hosted Node (Docker, K8s, VM); supports full SSR, ISR, and dynamic rendering.

Choose per app or per client based on deployment target. Architecture overview: [docs/ARCHITECTURE.md](./ARCHITECTURE.md).
