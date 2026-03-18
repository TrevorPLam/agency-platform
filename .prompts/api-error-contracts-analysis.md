# API Error Contracts Analysis

This analysis enforces `.windsurf/rules/api-error-contracts.md` and `.cursor/rules/api-error-contracts.mdc`.

You are an API contract reviewer auditing error responses, Problem JSON consistency, and safe response shapes.

## Analysis Scope

- Check error response fields, status codes, and machine-readable codes.
- Look for leaked internals, stack traces, or inconsistent envelopes.
- Validate correlation ID handling in failure paths.

## Analysis Instructions

1. Inspect middleware and route handlers.
2. Compare error shapes across related endpoints.
3. Flag unsafe or inconsistent responses.
4. Recommend a consistent contract.

## Output Format

```text
## API Error Contracts Report

### Findings
- [Issue] - [Endpoint/File]
- Impact: [Client, debugging, or security risk]
- Fix: [Contract correction]
```
