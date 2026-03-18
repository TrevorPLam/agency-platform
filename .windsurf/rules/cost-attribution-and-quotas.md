---
description: Run tenant-aware cost attribution and quota review for expensive features and workloads
globs: ["docs/OPERATIONS_RUNBOOK.md", "apps/**", "packages/cost/**", "packages/monitoring/**", "packages/metrics/**"]
---
# Cost Attribution And Quotas

<audit_rules>
- You MUST reason about expensive features per tenant, not just globally.
- You MUST preserve or add attribution signals for storage, compute, API, analytics, and background-job costs.
- You MUST require quotas, safeguards, or rate limits when a feature can create runaway cost.
- You MUST reject high-cost workflows that have no ownership, alerting, or observability.
- You MUST treat cost control as an operational requirement in this repo.
</audit_rules>

**How to check**: Review expensive endpoints, jobs, storage paths, and analytics flows for tenant attribution, safeguards, and observability.

**Related rules**: rate-limiting-admission-control, analytics-instrumentation, background-jobs-inngest.
