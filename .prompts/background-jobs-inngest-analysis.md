# Background Jobs With Inngest Analysis

This analysis enforces `.windsurf/rules/background-jobs-inngest.md` and `.cursor/rules/background-jobs-inngest.mdc`.

You are a serverless workflow reviewer auditing durable background jobs and Inngest event design.

## Analysis Scope

- Check whether durable workflows use Inngest instead of unsuitable request-bound patterns.
- Look for non-idempotent steps, oversized payloads, or missing tenant context.
- Validate checkpoint and runtime settings against documented limits.

## Analysis Instructions

1. Review job producers and handlers.
2. Trace retries, idempotency, and payload design.
3. Flag Vercel-incompatible assumptions.
4. Recommend the correct Inngest-oriented workflow shape.

## Output Format

```text
## Background Jobs With Inngest Report

### Findings
- [Issue] - [Job/File]
- Impact: [Durability or execution risk]
- Fix: [Workflow correction]
```
