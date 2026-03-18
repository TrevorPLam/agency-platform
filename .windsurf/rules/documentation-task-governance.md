---
description: Run documentation, task-structure, and requirement-traceability review
globs: ["AGENTS.md", "PROMPT.md", "TODO.md", "docs/**/*.md"]
---
# Documentation And Task Governance

<audit_rules>
- You MUST keep implementation work aligned with task docs, runbooks, and research-backed decisions.
- You MUST update documentation when behavior, architecture, workflows, or operations materially change.
- You MUST reuse the repo's task-template structure for substantial scoped work.
- You MUST record strict rules, out-of-scope items, and definition-of-done expectations for complex tasks.
- You MUST prefer traceable changes over undocumented agent-only decisions.
</audit_rules>

**How to check**: Compare implementation changes with TODO items, docs, prompts, and runbooks to verify traceability and documentation coverage.

**Related rules**: documentation-hygiene, architectural-hygiene, global-standards.
