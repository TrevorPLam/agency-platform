# Tailwind CSS v4 Integration Notes

## Overview
This document outlines the migration to Tailwind CSS v4 and the key changes required for the agency platform monorepo.

## Key Changes from v3 to v4

### 1. CSS-First Configuration
- **No more tailwind.config.js**: Configuration is now done entirely in CSS using `@theme` blocks
- **CSS Custom Properties**: All theme values are defined as CSS custom properties
- **@import syntax**: Replace `@tailwind` directives with `@import "tailwindcss"`

### 2. PostCSS Configuration
- **File extension**: Must use `.mjs` extension (not `.js`) for ES Module compatibility
- **Plugin**: Use `@tailwindcss/postcss` plugin instead of traditional Tailwind PostCSS plugin

### 3. Monorepo Scanning
- **@source directive**: Required to tell Tailwind which directories to scan for class names
- **Package scanning**: Essential for monorepos where components live in separate packages
- **Example**: `@source "../../../../packages/ui/src/**/*.{js,ts,jsx,tsx}"`

### 4. Animation Migration
- **tw-animate-css**: Replaces `tailwindcss-animate` 
- **Import syntax**: `@import "tw-animate-css"` instead of `@plugin 'tailwindcss-animate'`
- **shadcn/ui**: Officially migrated to tw-animate-css in March 2025

## Five Critical v3→v4 Production Blockers

### 1. Missing @source Directives
**Problem**: Tailwind v4 only scans the app directory by default
**Solution**: Add `@source` directives pointing to shared packages
**Impact**: Without this, utility classes from `@agency/ui` won't be generated

### 2. Incorrect PostCSS Extension
**Problem**: Using `.js` instead of `.mjs` for PostCSS config
**Solution**: Rename `postcss.config.js` to `postcss.config.mjs`
**Impact**: Silent build failures or ES Module errors

### 3. Legacy @tailwind Directives
**Problem**: Using old `@tailwind base/components/utilities` syntax
**Solution**: Replace with single `@import "tailwindcss"`
**Impact**: Build errors or missing styles

### 4. Missing tw-animate-css
**Problem**: Using deprecated `tailwindcss-animate`
**Solution**: Install and import `tw-animate-css`
**Impact**: Dialog and Sheet animations won't work

### 5. Theme Function Usage
**Problem**: Using `theme()` function calls in CSS
**Solution**: Replace with direct CSS custom property references
**Impact**: Runtime errors or incorrect values

## Dark Mode Configuration

### Custom Variant Syntax
```css
@custom-variant dark (&:is(.dark *));
```

### Dark Mode Overrides
```css
:root .dark {
  --color-semantic-background-primary: oklch(0.15 0.02 198.41);
  /* ... other dark overrides */
}
```

### Implementation Notes
- Use `:is()` selector for higher specificity (matches shadcn pattern)
- Apply `.dark` class to `<html>` element
- Override semantic tokens in `:root .dark` block

## Design Token Integration

### Three-Tier Hierarchy
1. **Primitives**: Raw values in `:root {}` blocks (no utility generation)
2. **Semantic**: Contextual aliases in `@theme inline {}` blocks (cascade-overridable)
3. **Component**: Component-specific tokens in `:root {}` blocks

### Client-Specific Tokens
- **Location**: `packages/design-tokens/tokens/clients/[slug].json`
- **Compilation**: `apps/clients/[slug]/tokens/[slug].css` (generated)
- **Import**: `@import "../../../tokens/[slug].css"` in app globals.css

## Utility Class Generation

### Brand Colors
- **Generated**: `bg-brand-primary`, `text-brand-primary`, `border-brand-primary`
- **Source**: Client-specific token files
- **Format**: OKLCH color space for better perceptual uniformity

### Semantic Tokens
- **Generated**: `bg-background-primary`, `text-text-secondary`, etc.
- **Cascade**: Can be overridden by dark mode or client-specific styles
- **Structure**: Defined in `@theme inline {}` blocks

## Validation Checklist

### Pre-Build Verification
- [ ] No `tailwind.config.*` files exist anywhere in repo
- [ ] All apps use `@import "tailwindcss"` (no `@tailwind` directives)
- [ ] All PostCSS configs use `.mjs` extension
- [ ] All CSS files import `tw-animate-css`
- [ ] All client apps have `@source` directives for UI package
- [ ] No `theme()` function calls in any CSS files
- [ ] Dark mode configured with `@custom-variant` and `:root .dark` overrides

### Runtime Testing
- [ ] Brand utility classes generate correctly
- [ ] Dark mode toggle changes visible colors
- [ ] Dialog and Sheet animations work
- [ ] Production CSS contains UI package classes
- [ ] `@theme inline {}` and `:root {}` structure verified

## Migration Commands

### Verification Commands
```bash
# Check for tailwind config files
find . -name "tailwind.config.*" -not -path "*/node_modules/*"

# Audit for theme() usage
grep -r "theme(" --include="*.css" apps/ packages/

# Verify PostCSS configs
find . -name "postcss.config.*" -not -path "*/node_modules/*"
```

### Build Commands
```bash
# Build design tokens
pnpm tokens:build

# Build specific app
pnpm turbo run build --filter=@agency/riverside-hotel

# Build all affected packages
pnpm turbo run build --affected
```

## Known Issues

### CSS Linter Warnings
- **@source directive**: Unknown at rule warning (expected)
- **@custom-variant**: Unknown at rule warning (expected)
- **Resolution**: Linters don't yet support Tailwind v4 syntax

### TypeScript JSX Errors
- **Cause**: Missing JSX configuration in app tsconfig.json
- **Resolution**: Extends `@agency/typescript-config/nextjs.json` should handle this
- **Workaround**: Errors don't affect runtime functionality

### Token Collisions
- **Cause**: Overlapping semantic tokens between base and client files
- **Severity**: Warning only, doesn't affect functionality
- **Resolution**: Expected behavior in multi-tenant setup

## References

- [Tailwind CSS v4 Upgrade Guide](https://tailwindcss.com/docs/upgrade-guide)
- [shadcn/ui Tailwind v4 Migration](https://ui.shadcn.com/docs/tailwind-v4)
- [Style Dictionary v4 Documentation](https://styledictionary.com/)
- [PostCSS ES Module Configuration](https://postcss.org/docs/plugins)

---

*Last updated: March 2026*
*Tailwind CSS version: 4.1.0*
*Agency platform version: 2.0*
