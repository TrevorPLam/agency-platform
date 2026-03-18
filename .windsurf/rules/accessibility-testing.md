---
description: Run accessibility and a11y testing review for UI changes
globs: ["apps/**/*.tsx", "packages/ui/**/*.tsx", "test/**", "docs/ACCESSIBILITY_CHECKLIST.md"]
---
# Accessibility Testing

<audit_rules>
- You MUST treat accessibility as a functional requirement.
- You MUST enforce semantic HTML, visible focus states, keyboard support, and correct labeling.
- You MUST require accessibility-oriented test coverage for material UI behavior changes.
- You MUST reuse the repo's accessibility checklist and existing tooling.
- You MUST reject interactive UI that cannot be used without a pointer.
</audit_rules>

**How to check**: Review components and tests for semantics, keyboard support, labels, focus management, and existing a11y test integration.

**Related rules**: accessibility-standards, automated-testing, e2e-testing.
