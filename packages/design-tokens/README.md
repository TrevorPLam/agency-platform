# @agency/design-tokens

<div align="center">

**W3C DTCG-compliant design token system using Style Dictionary v4**

[![npm version](https://img.shields.io/npm/v/@agency/design-tokens)](https://www.npmjs.com/package/@agency/design-tokens)
[![Style Dictionary](https://img.shields.io/badge/Style%20Dictionary-v4-blue)](https://amzn.github.io/style-dictionary/)
[![W3C DTCG](https://img.shields.io/badge/W3C%20DTCG-compliant-green)](https://design-tokens.github.io/community-group/format/)

</div>

Produces CSS (primitives, semantic theme, component tokens) and per-client theme files for apps with ESM-only, async compilation.

## 🏗️ Architecture

### Token Hierarchy

| Level | Purpose | Location | Output |
|-------|---------|----------|--------|
| **Primitive** | Raw values (color, spacing, motion) | `tokens/primitive/` | `:root` in `dist/primitives.css` |
| **Semantic** | Intent-based tokens referencing primitives | `tokens/semantic/` | `@theme inline` in `dist/semantic.css` |
| **Component** | Per-component tokens | `tokens/component/` | Component-specific CSS |
| **Client** | Per-client brand customizations | `tokens/clients/[slug].json` | `apps/*/tokens/` |

### 🎯 Design Principles

- **W3C DTCG Compliance** - Industry-standard token format
- **Three-Tier Hierarchy** - Clear separation of concerns
- **Client Isolation** - Per-client token compilation
- **CSS-First Approach** - Optimized for Tailwind CSS v4
- **Async Compilation** - ESM-only, non-blocking builds

## 🚀 Quick Start

### Build Commands

```bash
# From repo root (recommended)
pnpm tokens:build

# From this package only
pnpm run tokens:build

# Watch mode for development
pnpm run tokens:dev
```

### Adding New Tokens

1. **Primitive Tokens** - Add to `tokens/primitive/`
2. **Semantic Tokens** - Reference primitives in `tokens/semantic/`
3. **Component Tokens** - Add to `tokens/component/`
4. **Client Tokens** - Add to `tokens/clients/[slug].json`

### Token Naming Convention

```json
{
  "color": {
    "primitive": {
      "blue-50": "#eff6ff",
      "blue-500": "#3b82f6"
    },
    "semantic": {
      "interactive-primary": "{color.primitive.blue-500}",
      "interactive-primary-hover": "{color.primitive.blue-600}"
    }
  }
}
```

## ♿ Accessibility Compliance

### WCAG 2.1 AA & 2.2 Support

| Purpose | Token Area | Implementation | WCAG Requirement |
|--------|------------|----------------|------------------|
| **Focus Indicators** | Semantic color (`interactive-primary-*`, ring/border) | Use for focus ring color; ensure 3:1 contrast | WCAG 2.4.7, 2.4.13 |
| **Text Contrast** | Semantic text/background colors | Normal text 4.5:1, large text 3:1 | WCAG 1.4.3 |
| **Touch Targets** | Spacing primitives / component padding | Minimum 44×44px for interactive elements | WCAG 2.5.5 |
| **Motion Preferences** | `motion.primitive.*`, `motion.semantic.*` | Respect `prefers-reduced-motion: reduce` | WCAG 2.3.3 AAA |

### Accessibility Implementation

```css
/* Focus indicators */
.focus-visible {
  outline: 2px solid var(--color-interactive-primary);
  outline-offset: 2px;
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

> 📖 **See:** [docs/research/RESEARCH_MARKETING_MONOREPO_DESIGN_2026.md](../../docs/research/RESEARCH_MARKETING_MONOREPO_DESIGN_2026.md) §5 for full accessibility build order.

## 📁 File Structure

```
packages/design-tokens/
├── tokens/
│   ├── primitive/          # Raw values
│   │   ├── color.json
│   │   ├── spacing.json
│   │   ├── typography.json
│   │   └── motion.json
│   ├── semantic/           # Intent-based tokens
│   │   ├── color.json
│   │   ├── spacing.json
│   │   └── typography.json
│   ├── component/          # Component-specific tokens
│   │   ├── button.json
│   │   ├── card.json
│   │   └── modal.json
│   └── clients/            # Per-client customizations
│       ├── riverside-hotel.json
│       ├── riley-day-care.json
│       └── the-barber-cave.json
├── dist/                   # Compiled output
│   ├── primitives.css      # :root primitive tokens
│   ├── semantic.css        # @theme semantic tokens
│   └── component.css       # Component tokens
├── sd.config.ts            # Style Dictionary v4 config
└── package.json
```

## 🔧 Configuration

### Style Dictionary Config (sd.config.ts)

```typescript
import { StyleDictionary } from 'style-dictionary';

export default {
  source: ['tokens/**/*.json'],
  platforms: {
    css: {
      transformGroup: 'css',
      buildPath: 'dist/',
      files: [
        {
          destination: 'primitives.css',
          format: 'css/variables',
          options: {
            selector: ':root'
          }
        },
        {
          destination: 'semantic.css',
          format: 'css/variables',
          options: {
            selector: '@theme inline'
          }
        }
      ]
    }
  }
};
```

## 🎨 Theming System

### Client-Specific Themes

Each client gets a custom theme file:

```json
// tokens/clients/riverside-hotel.json
{
  "color": {
    "semantic": {
      "brand-primary": "#1e40af",
      "brand-secondary": "#3730a3",
      "accent": "#f59e0b"
    }
  },
  "typography": {
    "semantic": {
      "font-family-brand": "\"Georgia\", serif"
    }
  }
}
```

### Theme Compilation

Client themes are compiled to app-specific directories:

```bash
# Output structure
apps/
├── clients/
│   └── riverside-hotel/
│       └── tokens/
│           ├── theme.css
│           └── variables.css
└── prospective-clients/
    ├── riley-day-care/
    │   └── tokens/
    │       └── theme.css
    └── the-barber-cave/
        └── tokens/
            └── theme.css
```

## 🧪 Testing

```bash
# Validate token syntax
pnpm run tokens:validate

# Check for unused tokens
pnpm run tokens:audit

# Test theme compilation
pnpm run tokens:test

# Type checking
pnpm type-check
```

## 🔍 Token Inspection

### View Compiled Tokens

```bash
# View all primitive tokens
cat dist/primitives.css

# View semantic tokens
cat dist/semantic.css

# View client theme
cat apps/clients/riverside-hotel/tokens/theme.css
```

### Token Debugging

```bash
# Build with verbose output
DEBUG=style-dictionary:* pnpm tokens:build

# Validate specific client
pnpm tokens:validate --client riverside-hotel
```

## 🚀 Performance

### Build Optimization

- **Parallel Processing** - Client themes built concurrently
- **Incremental Builds** - Only rebuild changed token files
- **CSS Minification** - Optimized output for production
- **Tree Shaking** - Unused tokens removed

### Bundle Size Impact

- **Primitive Tokens**: ~2KB gzipped
- **Semantic Tokens**: ~1KB gzipped
- **Client Themes**: ~500B gzipped each

## 🔄 Migration Guide

### Upgrading from v3 to v4

1. **ESM Only** - Style Dictionary v4 is ESM-only
2. **Async API** - Build process is now async
3. **W3C DTCG Format** - Updated token structure
4. **Tailwind v4** - New CSS variable approach

```typescript
// Old (v3)
const StyleDictionary = require('style-dictionary');
const SD = StyleDictionary.extend(config);
SD.buildAllPlatforms();

// New (v4)
import { StyleDictionary } from 'style-dictionary';
const SD = new StyleDictionary(config);
await SD.buildAllPlatforms();
```

## 🤝 Contributing

1. **Token Standards** - Follow W3C DTCG specification
2. **Naming Conventions** - Use semantic, descriptive names
3. **Accessibility** - Ensure WCAG 2.1 AA compliance
4. **Documentation** - Update token descriptions
5. **Testing** - Add tests for new token categories

## 📄 License

ISC License - see LICENSE file for details.

---

<div align="center">

**Part of the @agency monorepo**

[📖 Documentation](../../docs/) • [🎨 UI Components](../ui/) • [🔒 Security](../../SECURITY.md)

</div>
