---
description: Run developer-environment, workspace-performance, and pnpm-catalog operations review
globs: ["docs/DEVELOPER_OPERATIONS.md", "pnpm-workspace.yaml", "package.json", "apps/**", "packages/**", "scripts/**"]
---
# Developer Environment And Operations

<audit_rules>
- You MUST prefer documented root-level workflows for pnpm, Git, sparse checkout, and workspace maintenance.
- You MUST treat `pnpm-workspace.yaml` as operationally sensitive because catalog mistakes can break the monorepo.
- You MUST reject sub-package dependency changes that bypass catalog and root-install discipline.
- You MUST preserve workspace-performance and developer-experience scripts when changing tooling.
- You MUST align tooling changes with the repo's documented IDE and Git performance guidance.
</audit_rules>

**How to check**: Review dependency changes, workspace scripts, root tooling config, and developer-ops docs for consistency with the documented repo workflow.

**Related rules**: monorepo-boundaries, dependency-management, documentation-task-governance.
