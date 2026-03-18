---
description: Run structured logging, request correlation, and observability review
globs: ["apps/**", "packages/analytics/**", "packages/monitoring/**", "packages/database/**"]
---
# Structured Logging And Observability

<audit_rules>
- You MUST prefer structured logs over free-form string logging.
- You MUST include request ID, tenant ID, route or operation name, severity, and actor context when available.
- You MUST reject logging that includes secrets, tokens, raw credentials, or unnecessary personal data.
- You MUST reuse existing request-context and monitoring helpers instead of inventing parallel logging schemes.
- You MUST ensure failures are traceable across API, background jobs, and database operations.
</audit_rules>

**How to check**: Inspect logging calls, error paths, monitoring wrappers, and request-context usage for consistency and traceability.

**Related rules**: logging-strategy, observability-monitoring, api-security.
