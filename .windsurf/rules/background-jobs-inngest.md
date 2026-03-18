---
description: Run durable background-job review for Inngest workflows in Vercel-compatible apps
globs: ["apps/**/src/inngest/**", "apps/**/src/app/api/inngest/**/*.ts", "docs/BACKGROUND_JOBS.md"]
---
# Background Jobs With Inngest

<audit_rules>
- You MUST prefer Inngest for durable multi-step workflows in this repo's serverless environment.
- You MUST reject replacing durable workflows with `after()` or long-lived worker assumptions.
- You MUST require idempotent and retry-safe step design.
- You MUST preserve tenant context, correlation IDs, and minimal payloads in job events.
- You MUST keep runtime and checkpoint settings aligned with the documented 260s and 300s limits.
</audit_rules>

**How to check**: Review event producers, job handlers, retry behavior, and timing configuration against the documented serverless workflow constraints.

**Related rules**: background-jobs, api-security, analytics-tracking.
