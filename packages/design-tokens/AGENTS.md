# @agency/design-tokens Package

## Purpose

W3C DTCG (Design Token Community Group) compliant token system for multi-tenant theming. This package provides a centralized design token management system with tenant-specific compilation.

## Core Patterns

### Token Structure
```typescript
// ✅ Correct - Use generated token types
import { tokens } from '@agency/design-tokens';

const theme = {
  colors: {
    primary: tokens.color.primary,
    background: tokens.color.background,
  },
  spacing: {
    sm: tokens.spacing.sm,
    md: tokens.spacing.md,
  }
};

// ❌ Incorrect - Hardcoded values
const theme = {
  colors: {
    primary: '#3b82f6', // Should use tokens
    background: '#ffffff',
  }
};
```

### Token Usage in CSS
```css
/* ✅ Correct - Use CSS custom properties */
.component {
  background-color: var(--token-color-primary);
  padding: var(--token-spacing-md);
  border-radius: var(--token-border-radius-md);
}

/* ✅ Correct - Tenant-specific tokens */
.tenant-tenant-1 {
  --tenant-primary: var(--token-primary-tenant-1);
  --tenant-background: var(--token-background-tenant-1);
}

/* ❌ Incorrect - Hardcoded values */
.bad-component {
  background-color: #3b82f6;
  padding: 16px;
}
```

### Token Compilation
```bash
# Build all tokens
pnpm tokens:build

# Build specific tenant tokens
pnpm tokens:build --tenant=tenant-1

# Watch for token changes
pnpm tokens:watch

# Validate token structure
pnpm tokens:validate
```

## Package Commands

```bash
# Build package
pnpm build

# Compile design tokens
pnpm tokens:build

# Validate tokens
pnpm tokens:validate

# Type check
pnpm type-check

# Lint
pnpm lint
```

## File Structure

```
packages/design-tokens/
├── src/
│   ├── tokens/           # Token definitions
│   │   ├── color.json    # Color tokens
│   │   ├── spacing.json  # Spacing tokens
│   │   ├── typography.json # Typography tokens
│   │   └── tenants/      # Tenant-specific tokens
│   │       ├── tenant-1.json
│   │       └── tenant-2.json
│   ├── build/            # Compiled tokens
│   │   ├── tokens.css    # Generated CSS
│   │   ├── tokens.ts     # Generated TypeScript
│   │   └── tenants/      # Compiled tenant tokens
│   ├── lib/              # Build utilities
│   │   ├── compiler.ts   # Token compiler
│   │   └── validator.ts  # Token validation
│   └── index.ts          # Main exports
├── AGENTS.md             # This file
├── package.json
└── sd.config.ts         # Style Dictionary config
```

## Token Categories

### Color Tokens
```json
// src/tokens/color.json
{
  "color": {
    "primary": {
      "value": "#3b82f6",
      "type": "color"
    },
    "background": {
      "value": "#ffffff",
      "type": "color"
    },
    "onPrimary": {
      "value": "#ffffff",
      "type": "color"
    }
  }
}
```

### Spacing Tokens
```json
// src/tokens/spacing.json
{
  "spacing": {
    "xs": {
      "value": "4px",
      "type": "dimension"
    },
    "sm": {
      "value": "8px",
      "type": "dimension"
    },
    "md": {
      "value": "16px",
      "type": "dimension"
    },
    "lg": {
      "value": "24px",
      "type": "dimension"
    }
  }
}
```

### Typography Tokens
```json
// src/tokens/typography.json
{
  "typography": {
    "fontFamily": {
      "value": ["Inter", "system-ui", "sans-serif"],
      "type": "fontFamily"
    },
    "fontSize": {
      "sm": {
        "value": "14px",
        "type": "dimension"
      },
      "md": {
        "value": "16px",
        "type": "dimension"
      },
      "lg": {
        "value": "18px",
        "type": "dimension"
      }
    }
  }
}
```

## Tenant-Specific Tokens

### Tenant Token Structure
```json
// src/tokens/tenants/tenant-1.json
{
  "tenant": {
    "primary": {
      "value": "{color.primary}",
      "type": "color"
    },
    "brand": {
      "value": "#ff6b6b",
      "type": "color"
    },
    "logo": {
      "value": "/assets/tenant-1-logo.svg",
      "type": "string"
    }
  }
}
```

### Token Inheritance
```json
// ✅ Correct - Reference global tokens
{
  "tenant": {
    "primary": {
      "value": "{color.primary}", // References global token
      "type": "color"
    }
  }
}

// ❌ Incorrect - Duplicate values
{
  "tenant": {
    "primary": {
      "value": "#3b82f6", // Duplicated from global
      "type": "color"
    }
  }
}
```

## Token Compilation Process

### Style Dictionary Configuration
```typescript
// sd.config.ts
import StyleDictionary from 'style-dictionary';

export default {
  source: ['src/tokens/**/*.json'],
  platforms: {
    css: {
      transformGroup: 'css',
      buildPath: 'src/build/css/',
      files: [
        {
          destination: 'tokens.css',
          format: 'css/variables',
          options: {
            outputReferences: true,
          },
        },
      ],
    },
    ts: {
      transformGroup: 'ts',
      buildPath: 'src/build/ts/',
      files: [
        {
          destination: 'tokens.ts',
          format: 'typescript/es6-declarations',
        },
      ],
    },
  },
};
```

### Custom Transforms
```typescript
// src/lib/transforms.ts
export const tenantTransform = {
  name: 'tenant/css',
  type: 'value',
  matcher: (token) => token.path[0] === 'tenant',
  transformer: (token) => {
    return `var(--tenant-${token.name})`;
  },
};
```

## Usage Patterns

### React Component Integration
```typescript
// ✅ Correct - Use token hooks
import { useTokens, useTenantTokens } from '@agency/design-tokens';

function Component({ tenantId }: { tenantId: string }) {
  const tokens = useTokens();
  const tenantTokens = useTenantTokens(tenantId);
  
  return (
    <div
      style={{
        backgroundColor: tokens.color.primary,
        borderColor: tenantTokens.brand,
        padding: tokens.spacing.md,
      }}
    >
      Content
    </div>
  );
}

// ❌ Incorrect - Direct token access
function BadComponent({ tenantId }: { tenantId: string }) {
  return (
    <div style={{ backgroundColor: '#3b82f6' }}>
      Content
    </div>
  );
}
```

### CSS Integration
```css
/* ✅ Correct - Use CSS custom properties */
@import '@agency/design-tokens/build/css/tokens.css';

.component {
  background-color: var(--token-color-primary);
  padding: var(--token-spacing-md);
  border: 1px solid var(--token-border-color);
}

.tenant-tenant-1 .component {
  background-color: var(--tenant-primary);
  border-color: var(--tenant-brand);
}

/* ❌ Incorrect - Hardcoded values */
.bad-component {
  background-color: #3b82f6;
  padding: 16px;
}
```

## Token Validation

### Schema Validation
```typescript
// ✅ Correct - Validate token structure
import { validateTokens } from '@agency/design-tokens/lib/validator';

const validation = validateTokens('src/tokens');
if (!validation.valid) {
  console.error('Token validation failed:', validation.errors);
  process.exit(1);
}

// ❌ Incorrect - Skip validation
// No validation - tokens could be malformed
```

### Type Safety
```typescript
// ✅ Correct - Use generated types
import type { ColorTokens, SpacingTokens } from '@agency/design-tokens';

function useColorTokens(): ColorTokens {
  return {
    primary: 'var(--token-color-primary)',
    background: 'var(--token-color-background)',
  };
}

// ❌ Incorrect - Loose typing
function useBadColorTokens(): Record<string, string> {
  return {
    primary: '#3b82f6', // No type safety
  };
}
```

## Performance Optimization

### Token Caching
```typescript
// ✅ Correct - Cache compiled tokens
import { cacheTokens } from '@agency/design-tokens/lib/cache';

const cachedTokens = cacheTokens('tenant-1');
if (cachedTokens) {
  return cachedTokens;
}

// Compile and cache new tokens
const tokens = compileTokens('tenant-1');
cacheTokens('tenant-1', tokens);
return tokens;

// ❌ Incorrect - Compile on every access
function getTokens(tenantId: string) {
  return compileTokens(tenantId); // Compiles every time
}
```

### Bundle Optimization
```typescript
// ✅ Correct - Tree-shakeable exports
export { useTokens } from './hooks/use-tokens';
export { useTenantTokens } from './hooks/use-tenant-tokens';

// ❌ Incorrect - Barrel exports
export * from './hooks'; // Prevents tree-shaking
```

## Testing Patterns

### Token Testing
```typescript
import { tokens } from '@agency/design-tokens';

describe('Design Tokens', () => {
  it('should have required color tokens', () => {
    expect(tokens.color.primary).toBeDefined();
    expect(tokens.color.background).toBeDefined();
  });

  it('should have valid spacing values', () => {
    expect(tokens.spacing.xs).toBe('4px');
    expect(tokens.spacing.sm).toBe('8px');
  });
});
```

### Token Integration Testing
```typescript
import { render } from '@testing-library/react';
import { TokenProvider } from '@agency/design-tokens';

describe('Token Integration', () => {
  it('should apply tokens to components', () => {
    const { container } = render(
      <TokenProvider tenantId="tenant-1">
        <div style={{ backgroundColor: 'var(--token-color-primary)' }}>
          Test
        </div>
      </TokenProvider>
    );

    expect(container.firstChild).toHaveStyle({
      backgroundColor: 'var(--token-color-primary)',
    });
  });
});
```

## Dependencies

This package depends on:
- `style-dictionary` - Token compilation
- `typescript` - Type generation
- `@types/node` - Node.js types

## Integration with Build System

### Turborepo Integration
```json
// turbo.json
{
  "tasks": {
    "tokens:build": {
      "dependsOn": ["^build"],
      "inputs": ["packages/design-tokens/src/tokens/**/*.json"],
      "outputs": ["packages/design-tokens/src/build/**"]
    }
  }
}
```

### CI/CD Integration
```yaml
# .github/workflows/tokens.yml
name: Validate Design Tokens

on:
  push:
    paths: ['packages/design-tokens/src/tokens/**']

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node.js
        uses: actions/setup-node@v4
      - name: Install dependencies
        run: pnpm install
      - name: Validate tokens
        run: pnpm tokens:validate
      - name: Build tokens
        run: pnpm tokens:build
```

## Progressive Documentation

For more details:
- `@packages/ui/AGENTS.md` - UI component patterns
- `docs/TAILWIND.md` - CSS-first styling guide
- `W3C DTCG Specification` - Design token standards
