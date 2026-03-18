---
description: Run rate-limiting and admission-control review for APIs and middleware
globs: ["apps/**/src/app/api/**/*.ts", "apps/**/middleware.ts", "packages/**/src/**/*.ts"]
---
# Rate Limiting And Admission Control

<audit_rules>
- You MUST apply rate limiting intentionally to auth, public, and expensive endpoints.
- You MUST use tenant-aware or actor-aware bucketing when the endpoint is tenant scoped.
- You MUST reuse existing preset and middleware utilities before creating new limit logic.
- You MUST verify failure responses and rate-limit headers are explicit and consistent when supported.
- You MUST treat rate limiting as both a security and cost-control concern.
</audit_rules>

**How to check**: Review middleware and route handlers for missing limits, wrong limit presets, or inconsistent headers and failure responses.

**Related rules**: api-security, auth-standards, backend-performance.
