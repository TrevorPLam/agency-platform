---
description: Run incident-classification and runbook-alignment review for operational failures
globs: ["docs/OPERATIONS_RUNBOOK.md", "docs/ERROR_HANDLING_SLO_PROGRAM.md", "apps/**", "packages/**"]
---
# Incident Response Runbooks

<audit_rules>
- You MUST preserve stable error classes and operationally meaningful failure signals.
- You MUST define how new critical failure modes map to detection, mitigation, and follow-up actions.
- You MUST favor errors and logs that help operators identify the right runbook quickly.
- You MUST reject changes that rename or remove important error classes without updating runbook and alert references.
- You MUST treat operator usability as part of correctness for reliability and security-sensitive changes.
</audit_rules>

**How to check**: Review error classes, logs, alerting signals, and response documentation to verify that incidents still map cleanly to existing runbooks.

**Related rules**: api-error-contracts, structured-logging-observability, slo-error-budget-operations.
