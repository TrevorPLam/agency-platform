---
description: Run API error contract and Problem JSON consistency review
globs: ["apps/**/src/app/api/**/*.ts", "packages/**/src/**/*.ts", "**/middleware.ts"]
---
# API Error Contracts

<audit_rules>
- You MUST standardize API failures around Problem JSON style fields where this repo already uses them.
- You MUST require stable machine-readable codes when an API exposes error codes.
- You MUST reject responses that leak stack traces, secrets, SQL details, or internal infrastructure details.
- You MUST verify correlation identifiers are preserved in logs and safe error metadata.
- You MUST check for consistency of success and error shapes within the same API surface.
</audit_rules>

**How to check**: Review route handlers and middleware for response shape drift, unsafe error details, and inconsistent status-code behavior.

**Related rules**: api-standards, api-security, input-validation, logging-strategy.
