---
description: Run monorepo boundary, package export, and dependency governance review
globs: ["apps/**", "packages/**", "package.json", "pnpm-workspace.yaml", "turbo.json"]
---
# Monorepo Boundaries

<audit_rules>
- You MUST reject imports between apps. Shared code belongs in packages.
- You MUST enforce `workspace:*` for internal packages and `catalog:` for external dependencies.
- You MUST verify package exports match real build outputs.
- You MUST prefer single-file verification commands before broad workspace runs.
- You MUST assess downstream impact when shared package entrypoints change.
</audit_rules>

**How to check**: Review imports, package.json exports, workspace dependency specifiers, and changes to shared packages for boundary violations.

**Related rules**: dependency-management, architectural-hygiene, typescript-standards.
