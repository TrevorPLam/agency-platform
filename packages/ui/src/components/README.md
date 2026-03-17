# Component hierarchy (Atomic Design)

**Levels and in-repo rules:** see [docs/architecture/ATOMIC_DESIGN.md](../../../../docs/architecture/ATOMIC_DESIGN.md). **Component structure** (atoms/molecules/organisms and where they live): [ARCHITECTURE.md](../../../../docs/architecture/ARCHITECTURE.md) §Component structure.

**When adding components:** Use the lowest level that fits (atoms → molecules → organisms). Promote when a pattern repeats. No app-to-app imports; shared UI stays here, app-specific sections stay in `apps/*/src/components`.
