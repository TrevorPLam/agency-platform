---
description: Run SLO, burn-rate, and reliability-observability review for operationally significant changes
globs: ["docs/ERROR_HANDLING_SLO_PROGRAM.md", "docs/OPERATIONS_RUNBOOK.md", "apps/**", "packages/**"]
---
# SLO And Error Budget Operations

<audit_rules>
- You MUST consider how changes affect availability, latency, and operational error budgets.
- You MUST preserve route-level visibility for status, latency, error code, correlation ID, and trace context where supported.
- You MUST reject changes that make fast-burn, medium-burn, or slow-burn analysis harder.
- You MUST account for retries, timeouts, and degraded modes when evaluating reliability impact.
- You MUST update operational docs when failure patterns or observability materially change.
</audit_rules>

**How to check**: Review monitoring, logging, retries, timeout behavior, and documentation updates against the repo's SLO and burn-rate model.

**Related rules**: structured-logging-observability, incident-response-runbooks, backend-performance.
