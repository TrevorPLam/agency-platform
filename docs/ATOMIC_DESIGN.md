# Atomic Design — Research Summary and Conventions

Up-to-date (03/2026) summary: proper implementation, best practices, anti-patterns, and how this repo applies them.

## The five levels

| Level | What it is | Examples in this repo |
| ----- | ---------- | --------------------- |
| **Atoms** | Smallest primitives; single responsibility; styleable via props | Button, Input, Label, Badge |
| **Molecules** | Groups of atoms as one unit; encapsulate accessibility | Card, Dialog, Sheet, DropdownMenu |
| **Organisms** | Sections of molecules/atoms; loading/empty/error; data contracts | (Shared organisms when pattern repeats; app-specific in apps) |
| **Templates** | Page-level layout with slots; no real content | In apps (e.g. layout.tsx, page wrappers) |
| **Pages** | Concrete routes with real data | In apps (page.tsx) |

Templates and pages live in **apps**, not in `packages/ui`. The design system stops at organisms.

## Best practices (what works)

- **Use as a mental model, not dogma** — Don’t force every component into a level; use levels to communicate and to decide where new components go.
- **Build across levels in parallel** — Not a linear pipeline; iterate atoms, molecules, and organisms together as you ship real pages.
- **Atoms: keep dumb and styleable** — Minimal API (variant, size, disabled); use design tokens (`var(--*)`); no business logic.
- **Molecules: encapsulate accessibility** — Label + input + error, aria-*, sensible defaults. Molecules may use atoms (e.g. Dialog uses Button).
- **Organisms: clear data contracts** — Define what data the organism needs; add loading/empty/error here; keep templates presentational.
- **Centralize and version design tokens** — This repo uses `packages/design-tokens` and Style Dictionary; atoms consume tokens only.
- **Single source of truth** — Build the system while shipping real pages; avoid “library first, product later” so components stay used.

## Anti-patterns (what to avoid)

- **Rigid taxonomy** — Arguing “is this a molecule or organism?” instead of shipping. Use the level that helps the team.
- **Over-abstracted atoms** — Super-generic primitives that are hard to use. Promote to molecules only when a pattern repeats.
- **Templates with business logic** — Keep templates presentational (slots/layout); fetch data in pages or thin containers.
- **Design system drift** — Components in Storybook that diverge from production. Keep docs and governance light but real.
- **Shelfware components** — Building the library first without real use cases. Add components when a page needs them.

## Advanced patterns

- **Barrel exports** — `atoms/index.ts`, `molecules/index.ts` re-export so apps keep importing from `@agency/ui`; no change to public API.
- **Molecules using atoms** — Only when it reduces duplication and keeps accessibility in one place (e.g. Dialog close button uses Button).
- **Organisms in apps vs package** — App-specific sections (SiteHeader, ContactForm) stay in `apps/*/src/components`; move to `packages/ui/src/components/organisms/` when the same pattern appears in multiple apps.
- **Storybook** — Optional; organize stories by atoms/molecules/organisms to teach the hierarchy and run visual regression. Not required for Phase 1.

## Where things live in this repo

- **packages/ui/src/components/atoms/** — Button, Input, Label, Badge.
- **packages/ui/src/components/molecules/** — Card, Dialog, Sheet, DropdownMenu.
- **packages/ui/src/components/organisms/** — Placeholder; add shared organisms when needed.
- **packages/ui/src/components/README.md** — Rules for adding/promoting components.
- **docs/ARCHITECTURE.md** — §Component structure.
- **.cursor/rules/frontend.mdc** — Structure and Tailwind/design token rules.

## References

- Brad Frost, [Atomic Design](https://atomicdesign.bradfrost.com/) (methodology).
- Mykola Aleksandrov, [Atomic Design in Practice (2025)](https://mykolaaleksandrov.dev/posts/2025/11/atomic-design-in-practice/) — What works, pitfalls, rollout.
- Wunderman Thompson / Vercel — Monorepo + Turborepo + headless CMS + Atomic Design (10x/25x gains).
