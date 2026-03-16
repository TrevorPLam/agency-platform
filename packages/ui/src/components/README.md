# Component hierarchy (Atomic Design)

This package organizes shared UI into **atoms**, **molecules**, and **organisms**. Use the hierarchy as a guide, not dogma—promote patterns only when they repeat.

| Level | Purpose | Examples |
| ----- | ------- | -------- |
| **Atoms** | Smallest primitives; single responsibility; styleable via props | Button, Input, Label, Badge |
| **Molecules** | Groups of atoms as one unit; encapsulate accessibility | Card, Dialog, Sheet, DropdownMenu |
| **Organisms** | Sections combining molecules/atoms; loading/empty/error states | (Shared organisms added when repeated across apps) |

**Rules:**

- **Atoms:** Keep dumb and styleable; use design tokens (`var(--*)`); no business logic.
- **Molecules:** Encapsulate label/input/error, aria-*; sensible defaults; may use atoms (e.g. Dialog uses Button).
- **Organisms:** Define clear data contracts; add interaction states; app-specific organisms (SiteHeader, ContactForm) live in `apps/*/src/components`, not here.

**Templates & pages:** Page-level layouts (templates) and concrete routes (pages) live in apps, not in this package. This package is the design system only.

**Adding components:** Prefer adding to the lowest level that fits. When a pattern appears in two places, promote it (e.g. form field → molecule). Avoid "is this a molecule or organism?" debates—use the level that helps communication.
