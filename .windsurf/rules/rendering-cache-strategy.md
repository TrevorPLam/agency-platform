---
description: Run Next.js rendering and cache-strategy review for public and tenant-aware routes
globs: ["apps/**/src/app/**/*.tsx", "apps/**/next.config.ts", "docs/FRONTEND_ARCHITECTURE.md"]
---
# Rendering And Cache Strategy

<audit_rules>
- You MUST prefer static generation or ISR for public marketing pages unless fresh per-request data is required.
- You MUST require dynamic rendering for session-dependent or tenant-dependent pages.
- You MUST enforce explicit `revalidate` strategy when ISR is used.
- You MUST validate `generateStaticParams` when routes can be safely precomputed.
- You MUST reject cache behavior that can expose user-specific or tenant-specific data.
</audit_rules>

**How to check**: Review route modules, layout behavior, data dependencies, and cache directives against the documented rendering strategy.

**Related rules**: nextjs-architecture, frontend-performance, nextjs-security.
