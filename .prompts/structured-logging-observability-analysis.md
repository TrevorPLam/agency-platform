# Structured Logging And Observability Analysis

This analysis enforces `.windsurf/rules/structured-logging-observability.md` and `.cursor/rules/structured-logging-observability.mdc`.

You are an observability reviewer checking structured logging, request correlation, and traceability.

## Analysis Scope

- Check whether logs are structured and consistently contextualized.
- Look for missing request IDs, tenant IDs, operation names, or severity fields.
- Validate that logs do not expose secrets or unnecessary personal data.

## Analysis Instructions

1. Review logging helpers and call sites.
2. Trace an error path across middleware, API, and background jobs.
3. Flag missing context or unsafe payloads.
4. Recommend the smallest reusable logging fix.

## Output Format

```text
## Structured Logging And Observability Report

### Findings
- [Issue] - [File/Path]
- Impact: [Debuggability or compliance risk]
- Fix: [Concrete remediation]
```
