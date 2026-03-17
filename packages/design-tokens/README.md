# @agency/design-tokens

Design tokens package using Style Dictionary v4 and W3C DTCG format. Produces CSS (primitives, semantic theme, component tokens) and per-client theme files for apps.

## Structure

- **Primitive** — Raw values (color, spacing, motion) in `tokens/primitive/`. Output in `:root` in `dist/primitives.css` and `dist/component.css`.
- **Semantic** — Intent-based tokens referencing primitives in `tokens/semantic/`. Output in `@theme inline` in `dist/semantic.css` for Tailwind v4.
- **Component** — Per-component tokens in `tokens/component/`.
- **Per-client** — `tokens/clients/[slug].json`; built to `apps/prospective-clients/[slug]/tokens/` or `apps/clients/[slug]/tokens/`.

## Build

From repo root: `pnpm tokens:build`. From this package: `pnpm run tokens:build`.

## Accessibility tokens

Tokens that support WCAG 2.1 AA and 2.2:

| Purpose | Token area | Notes |
|--------|------------|--------|
| **Focus** | Semantic color (e.g. `interactive-primary-*`, ring/border accent) | Use for focus ring color; ensure 3:1 contrast (WCAG 2.4.7, 2.4.13). |
| **Contrast** | Semantic text/background colors | Normal text 4.5:1, large text 3:1 (WCAG 1.4.3). |
| **Touch targets** | Spacing primitives / component padding | Minimum 44×44px for interactive elements (WCAG 2.5.5). |
| **Motion** | `motion.primitive.*`, `motion.semantic.*` | Duration, easing, stagger. Apps must respect `prefers-reduced-motion: reduce` (WCAG 2.3.3 AAA) via CSS override. |

Focus-not-obscured (WCAG 2.2): ensure modals/overlays do not fully cover focused elements; layout and component behavior, not token values.

See [docs/research/RESEARCH_MARKETING_MONOREPO_DESIGN_2026.md](../../docs/research/RESEARCH_MARKETING_MONOREPO_DESIGN_2026.md) §5 for full a11y build order.
